#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/TurkYoshi1905/quantum-ai.git"
BRANCH="main"

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "Hata: GITHUB_PAT secret tanımlı değil."
  exit 1
fi

REMOTE_URL="https://${GITHUB_PAT}@github.com/TurkYoshi1905/quantum-ai.git"

echo "==> Git yapılandırması ayarlanıyor..."
git config --global user.email "quantum-ai-bot@replit.com"
git config --global user.name "QuantumAI Bot"

if [ ! -d ".git" ]; then
  echo "==> Git deposu başlatılıyor..."
  git init
  git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "==> Tüm dosyalar ekleniyor..."
git add -A

if git diff --cached --quiet; then
  echo "==> Değişiklik yok, commit atlanıyor."
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "QuantumAI sync: ${TIMESTAMP}"
  echo "==> Commit oluşturuldu."
fi

echo "==> GitHub'a push ediliyor: ${REPO_URL}"
git push -u origin "$BRANCH" --force

echo ""
echo "Tamamlandi! Tum dosyalar basariyla GitHub'a yuklendi."
echo "Repo: ${REPO_URL}"
