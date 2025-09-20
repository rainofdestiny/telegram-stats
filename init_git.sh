#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="https://github.com/rainofdestiny/telegram-stats.git"

# --- файлы игнора и атрибутов ---
cat > .gitignore <<'EOF'
node_modules/
dist/
coverage/
.npm/
.eslintcache
.env
.env.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
Thumbs.db
.vscode/
.idea/
*.tar
*.gz
*.zip
result*.json
top.csv
*.tsbuildinfo
.vite/
EOF

cat > .gitattributes <<'EOF'
* text=auto eol=lf
EOF

# --- ESLint flat config (v9) ---
cat > eslint.config.js <<'EOF'
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
      "unused-imports": unusedImports,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
      ],
      "react/react-in-jsx-scope": "off",
      "import/order": ["warn", { "newlines-between": "always" }],
      "import/no-unresolved": "off"
    },
  },
];
EOF

# --- инициализация git ---
if [ -d .git ]; then
  echo ".git уже существует"
else
  git -c init.defaultBranch=main init
fi

# --- pre-commit hook (НЕ блокирует коммит) ---
mkdir -p .git/hooks
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "[pre-commit] typecheck…"
npm run typecheck || true
echo "[pre-commit] eslint…"
npm run lint || true
echo "[pre-commit] depcheck…"
npm run depcheck || true
echo "[pre-commit] ts-prune…"
npm run tsprune || true
EOF
chmod +x .git/hooks/pre-commit

# --- первый коммит, тег, remote, push ---
git add .
git commit -m "chore: init repo, ESLint flat config, hooks, working app" || true

if ! git tag | grep -q '^v0\.1\.0$'; then
  git tag -a v0.1.0 -m "Initial working build"
fi

if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git push -u origin main --tags || true

echo "Done. Remote: $REMOTE_URL"
