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
#    4) Commit + push → GitHub güncellenir (--force KULLANILMAZ).
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
  echo "HATA: GITHUB_PAT secret tanımlı değil."
  echo "Replit Secrets bölümüne GITHUB_PAT ekleyin ve tekrar deneyin."
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

  echo "▶ [1/5] GitHub deposu klonlanıyor (geçmiş korunuyor)..."
  rm -rf "$DEPLOY_TMP"
  git clone "$REPO_URL" "$DEPLOY_TMP" --quiet 2>/dev/null || {
    # Repo boşsa init et
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
  echo "▶ [2/5] Eski dosyalar temizleniyor..."
  git rm -rf . --quiet 2>/dev/null || true
  echo "  OK: Temizlendi."

  echo ""
  echo "▶ [3/5] Frontend kaynak kodlari kopyalaniyor..."

  # artifacts/quantum-ai/src → src/
  if [ -d "$QUANTUM_AI/src" ]; then
    cp -r "$QUANTUM_AI/src" "$DEPLOY_TMP/src"
    SRC_COUNT=$(find "$DEPLOY_TMP/src" -type f | wc -l | tr -d ' ')
    echo "  OK: src/ kopyalandi ($SRC_COUNT dosya)."
  fi

  # artifacts/quantum-ai/public
  if [ -d "$QUANTUM_AI/public" ]; then
    cp -r "$QUANTUM_AI/public" "$DEPLOY_TMP/public"
    echo "  OK: public/ kopyalandi."
  fi

  # Frontend kök config dosyaları
  for file in index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json tsconfig.app.json tsconfig.node.json components.json package.json; do
    if [ -f "$QUANTUM_AI/$file" ]; then
      cp "$QUANTUM_AI/$file" "$DEPLOY_TMP/$file"
      echo "  OK: $file kopyalandi."
    fi
  done

  echo ""
  echo "▶ [4/5] Backend kaynak kodlari kopyalaniyor..."

  # artifacts/api-server/src → api-server/src/
  if [ -d "$API_SERVER/src" ]; then
    mkdir -p "$DEPLOY_TMP/api-server"
    cp -r "$API_SERVER/src" "$DEPLOY_TMP/api-server/src"
    BE_COUNT=$(find "$DEPLOY_TMP/api-server/src" -type f | wc -l | tr -d ' ')
    echo "  OK: api-server/src/ kopyalandi ($BE_COUNT dosya)."
  fi
  for file in package.json tsconfig.json build.mjs; do
    if [ -f "$API_SERVER/$file" ]; then
      cp "$API_SERVER/$file" "$DEPLOY_TMP/api-server/$file"
    fi
  done

  # lib/ (paylasilan kutuphaneler)
  if [ -d "$WORKSPACE/lib" ]; then
    mkdir -p "$DEPLOY_TMP/lib"
    for libdir in api-spec api-client-react api-zod db; do
      if [ -d "$WORKSPACE/lib/$libdir" ]; then
        cp -r "$WORKSPACE/lib/$libdir" "$DEPLOY_TMP/lib/$libdir"
      fi
    done
    # node_modules ve dist klasorlerini sil
    find "$DEPLOY_TMP/lib" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$DEPLOY_TMP/lib" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    LIB_COUNT=$(find "$DEPLOY_TMP/lib" -type f | wc -l | tr -d ' ')
    echo "  OK: lib/ kopyalandi ($LIB_COUNT dosya)."
  fi

  # OpenAPI spec
  if [ -f "$WORKSPACE/lib/api-spec/openapi.yaml" ]; then
    echo "  OK: OpenAPI spec dahil edildi."
  fi

  echo ""
  echo "▶ [4b/5] Kok dosyalari kopyalaniyor..."

  # Kök yapılandırma dosyaları
  for file in package.json pnpm-workspace.yaml tsconfig.json tsconfig.base.json replit.md github-sync.sh; do
    if [ -f "$WORKSPACE/$file" ]; then
      cp "$WORKSPACE/$file" "$DEPLOY_TMP/$file"
      echo "  OK: $file kopyalandi."
    fi
  done

  # .gitignore oluştur
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
  echo "  OK: .gitignore olusturuldu."

  echo ""
  echo "▶ [5/5] Commit & Push yapiliyor..."
  cd "$DEPLOY_TMP"
  git add -A

  CHANGED=$(git status --porcelain | wc -l)
  if [ "$CHANGED" -eq 0 ]; then
    echo "  Gonderirlecek degisiklik yok — her sey guncel."
  else
    echo "  $CHANGED dosya degisti."
    git commit -m "$COMMIT_MSG"
    git push origin "$BRANCH" 2>&1

    echo ""
    echo "════════════════════════════════════════════════════"
    echo "  BASARILI! GitHub guncellendi."
    echo "  https://github.com/TurkYoshi1905/quantum-ai"
    echo "  Commit: $COMMIT_MSG"
    echo "════════════════════════════════════════════════════"
  fi

  # Temizlik
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
