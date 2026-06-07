#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  QuantumAI — GitHub Sync Script
#
#  Kullanım:
#    bash github-sync.sh push ["commit mesajı"]   → GitHub'a gönder
#    bash github-sync.sh pull                     → GitHub'dan src/ çek
#
#  Nasıl çalışır (push):
#    1) Repo /tmp altına klonlanır — git geçmişi korunur.
#    2) Klonun içi temizlenir (git rm -rf .)
#    3) Proje kaynak dosyaları kopyalanır.
#    4) workspace:/catalog: bağımlılıkları çözülür, Vercel için temizlenir.
#    5) Commit + push (--force KULLANILMAZ).
# ─────────────────────────────────────────────────────────────────────────────

set -e

MODE="${1:-push}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="${2:-QuantumAI sync: ${TIMESTAMP}}"
BRANCH="main"
WORKSPACE="/home/runner/workspace"
QUANTUM_AI="$WORKSPACE/artifacts/quantum-ai"
API_SERVER="$WORKSPACE/artifacts/api-server"
DEPLOY_TMP="/tmp/quantum-deploy-$$"

if [ -z "$GITHUB_PAT" ]; then
  echo "HATA: GITHUB_PAT secret tanimli degil."
  exit 1
fi

REPO_URL="https://TurkYoshi1905:${GITHUB_PAT}@github.com/TurkYoshi1905/quantum-ai.git"

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║        QuantumAI — GitHub Sync                     ║"
echo "║  Mod    : $MODE                                    ║"
echo "║  Dal    : $BRANCH                                  ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# ─── PUSH ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "push" ]; then

  echo "▶ [1/6] GitHub deposu klonlaniyor..."
  rm -rf "$DEPLOY_TMP"
  git clone "$REPO_URL" "$DEPLOY_TMP" --quiet 2>/dev/null || {
    mkdir -p "$DEPLOY_TMP"
    cd "$DEPLOY_TMP"
    git init -b "$BRANCH"
    git remote add origin "$REPO_URL"
  }
  cd "$DEPLOY_TMP"
  git config user.name "TurkYoshi1905"
  git config user.email "165286969+TurkYoshi1905@users.noreply.github.com"
  echo "  OK: Klonlandi."

  echo ""
  echo "▶ [2/6] Eski dosyalar temizleniyor..."
  git rm -rf . --quiet 2>/dev/null || true
  echo "  OK: Temizlendi."

  echo ""
  echo "▶ [3/6] Frontend kaynak kodlari kopyalaniyor..."

  # src/
  cp -r "$QUANTUM_AI/src" "$DEPLOY_TMP/src"
  echo "  OK: src/ kopyalandi ($(find "$DEPLOY_TMP/src" -type f | wc -l | tr -d ' ') dosya)."

  # public/
  [ -d "$QUANTUM_AI/public" ] && cp -r "$QUANTUM_AI/public" "$DEPLOY_TMP/public" && echo "  OK: public/ kopyalandi."

  # Frontend kök dosyalar (package.json workspace rootundan DEGIL buradan alinir)
  for file in index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json components.json package.json; do
    [ -f "$QUANTUM_AI/$file" ] && cp "$QUANTUM_AI/$file" "$DEPLOY_TMP/$file" && echo "  OK: $file kopyalandi."
  done

  echo ""
  echo "▶ [4/6] Backend ve lib dosyalari kopyalaniyor..."

  # api-server/
  if [ -d "$API_SERVER/src" ]; then
    mkdir -p "$DEPLOY_TMP/api-server"
    cp -r "$API_SERVER/src" "$DEPLOY_TMP/api-server/src"
    for f in package.json tsconfig.json build.mjs; do
      [ -f "$API_SERVER/$f" ] && cp "$API_SERVER/$f" "$DEPLOY_TMP/api-server/$f"
    done
    echo "  OK: api-server/ kopyalandi."
  fi

  # lib/ — api-client-react, api-zod, api-spec, db
  if [ -d "$WORKSPACE/lib" ]; then
    mkdir -p "$DEPLOY_TMP/lib"
    for libdir in api-client-react api-zod api-spec db; do
      [ -d "$WORKSPACE/lib/$libdir" ] && cp -r "$WORKSPACE/lib/$libdir" "$DEPLOY_TMP/lib/$libdir"
    done
    find "$DEPLOY_TMP/lib" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$DEPLOY_TMP/lib" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    echo "  OK: lib/ kopyalandi ($(find "$DEPLOY_TMP/lib" -type f | wc -l | tr -d ' ') dosya)."
  fi

  # Diger kök dosyalar (package.json HARIÇ — frontend package.json kullanilacak)
  for file in tsconfig.base.json replit.md github-sync.sh; do
    [ -f "$WORKSPACE/$file" ] && cp "$WORKSPACE/$file" "$DEPLOY_TMP/$file" && echo "  OK: $file kopyalandi."
  done

  echo ""
  echo "▶ [5/6] Vercel icin paket ve yapilandirma duzenleniyor..."

  # Catalog version haritasi
  declare -A CATALOG
  CATALOG["@tailwindcss/vite"]="^4.1.14"
  CATALOG["@tanstack/react-query"]="^5.90.21"
  CATALOG["@types/node"]="^25.3.3"
  CATALOG["@types/react"]="^19.2.0"
  CATALOG["@types/react-dom"]="^19.2.0"
  CATALOG["@vitejs/plugin-react"]="^5.0.4"
  CATALOG["class-variance-authority"]="^0.7.1"
  CATALOG["clsx"]="^2.1.1"
  CATALOG["framer-motion"]="^12.23.24"
  CATALOG["lucide-react"]="^0.545.0"
  CATALOG["react"]="19.1.0"
  CATALOG["react-dom"]="19.1.0"
  CATALOG["tailwind-merge"]="^3.3.1"
  CATALOG["tailwindcss"]="^4.1.14"
  CATALOG["vite"]="^7.3.2"
  CATALOG["wouter"]="^3.3.5"
  CATALOG["zod"]="^3.25.76"
  CATALOG["@replit/vite-plugin-cartographer"]="^0.5.1"
  CATALOG["@replit/vite-plugin-runtime-error-modal"]="^0.0.6"

  # Node script ile package.json temizle: catalog: → gercek versiyon, workspace:* kaldir
  DEPLOY_PATH="$DEPLOY_TMP" node --input-type=module << 'NODEEOF'
import { readFileSync, writeFileSync } from "fs";

const deployPath = process.env.DEPLOY_PATH;

const catalog = {
  "@tailwindcss/vite": "^4.1.14",
  "@tanstack/react-query": "^5.90.21",
  "@types/node": "^25.3.3",
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0",
  "@vitejs/plugin-react": "^5.0.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.545.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "tailwind-merge": "^3.3.1",
  "tailwindcss": "^4.1.14",
  "vite": "^7.3.2",
  "wouter": "^3.3.5",
  "zod": "^3.25.76",
  "@replit/vite-plugin-cartographer": "^0.5.1",
  "@replit/vite-plugin-runtime-error-modal": "^0.0.6",
};

const pkgPath = `${deployPath}/package.json`;
const raw = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);

const resolve = (deps) => {
  if (!deps) return deps;
  const out = {};
  for (const [k, v] of Object.entries(deps)) {
    if (v === "workspace:*" || v.startsWith("workspace:")) continue;
    if (v === "catalog:") {
      if (catalog[k]) out[k] = catalog[k];
      else process.stderr.write("WARN: catalog yok: " + k + "\n");
    } else {
      out[k] = v;
    }
  }
  return out;
};

pkg.devDependencies = resolve(pkg.devDependencies);
pkg.dependencies = resolve(pkg.dependencies);
if (pkg.scripts) delete pkg.scripts.preinstall;
pkg.name = "quantum-ai";

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
process.stdout.write("  OK: package.json temizlendi (catalog+workspace cozuldu).\n");
NODEEOF

  # vite.config.ts: @workspace/api-client-react alias ekle
  sed -i 's|"@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),|"@assets": path.resolve(import.meta.dirname, "attached_assets"),\n      "@workspace/api-client-react": path.resolve(import.meta.dirname, "lib/api-client-react/src/index.ts"),|' \
    "$DEPLOY_TMP/vite.config.ts"
  echo "  OK: vite.config.ts @workspace/api-client-react alias eklendi."

  # tsconfig.json: extends + references duzelt (Vercel flat deploy icin)
  cat > "$DEPLOY_TMP/tsconfig.json" << 'TSCONFIGEOF'
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "isolatedModules": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "module": "esnext",
    "target": "es2022",
    "moduleResolution": "bundler",
    "noEmit": true,
    "jsx": "preserve",
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./src/*"],
      "@workspace/api-client-react": ["./lib/api-client-react/src/index.ts"]
    }
  }
}
TSCONFIGEOF
  echo "  OK: tsconfig.json duzeltildi (extends kaldirildi, paths eklendi)."

  # pnpm-workspace.yaml'i kopyalama (Vercel'de gerek yok)
  rm -f "$DEPLOY_TMP/pnpm-workspace.yaml"

  # vercel.json guncelle
  cat > "$DEPLOY_TMP/vercel.json" << 'VERCELJSON'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
VERCELJSON
  echo "  OK: vercel.json guncellendi."

  # .gitignore
  cat > "$DEPLOY_TMP/.gitignore" << 'GITIGNORE'
node_modules/
dist/
.tsbuildinfo
*.map
.env
.env.local
.local/
.cache/
.upm/
*.log
GITIGNORE

  echo ""
  echo "▶ [6/6] Commit & Push yapiliyor..."
  cd "$DEPLOY_TMP"
  git add -A

  CHANGED=$(git status --porcelain | wc -l)
  if [ "$CHANGED" -eq 0 ]; then
    echo "  Gonderirlecek degisiklik yok."
  else
    echo "  $CHANGED dosya degisti."
    git commit -m "$COMMIT_MSG"
    git push origin "$BRANCH"
    echo ""
    echo "════════════════════════════════════════════════════"
    echo "  BASARILI! GitHub guncellendi."
    echo "  https://github.com/TurkYoshi1905/quantum-ai"
    echo "  Commit: $COMMIT_MSG"
    echo "════════════════════════════════════════════════════"
  fi

  cd "$WORKSPACE"
  rm -rf "$DEPLOY_TMP"
  echo "  OK: Gecici dosyalar temizlendi."

# ─── PULL ────────────────────────────────────────────────────────────────────
elif [ "$MODE" = "pull" ]; then

  echo "▶ [1/2] GitHub deposu cekiliyor..."
  rm -rf "$DEPLOY_TMP"
  git clone --depth=1 "$REPO_URL" "$DEPLOY_TMP" --quiet
  echo "  OK: Klonlandi."

  echo ""
  echo "▶ [2/2] src/ ve public/ aktariliyor..."
  [ -d "$DEPLOY_TMP/src" ]    && rm -rf "$QUANTUM_AI/src"    && cp -r "$DEPLOY_TMP/src"    "$QUANTUM_AI/src"
  [ -d "$DEPLOY_TMP/public" ] && rm -rf "$QUANTUM_AI/public" && cp -r "$DEPLOY_TMP/public" "$QUANTUM_AI/public"
  [ -d "$DEPLOY_TMP/api-server/src" ] && rm -rf "$API_SERVER/src" && cp -r "$DEPLOY_TMP/api-server/src" "$API_SERVER/src"

  cd "$WORKSPACE"
  rm -rf "$DEPLOY_TMP"

  echo ""
  echo "════════════════════════════════════════════════════"
  echo "  BASARILI! GitHub'tan cekildi."
  echo "════════════════════════════════════════════════════"

else
  echo "Kullanim:"
  echo "  bash github-sync.sh push [\"commit mesaji\"]"
  echo "  bash github-sync.sh pull"
  exit 1
fi
