#!/bin/bash
input=$(cat)

file_path=$(printf '%s' "$input" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c).on('end',()=>{
    try{
      const j=JSON.parse(d);
      process.stdout.write(String((j.tool_input||{}).file_path||''));
    }catch{}
  });
")
[ -z "$file_path" ] && exit 0
file_path=$(cygpath -u "$file_path" 2>/dev/null || printf '%s' "$file_path" | tr '\\' '/')

case "$file_path" in
  */node_modules/*|*/dist/*|*/src/generated/*|*/routeTree.gen.ts) exit 0 ;;
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  repo=$(cygpath -u "$CLAUDE_PROJECT_DIR" 2>/dev/null || printf '%s' "$CLAUDE_PROJECT_DIR" | tr '\\' '/')
else
  repo="$(cd "$(dirname "$0")/../.." && pwd)"
fi

workspace=""
for w in apps/web apps/api packages/contracts packages/database; do
  case "$file_path" in
    "$repo/$w/"*) workspace="$w"; break ;;
  esac
done

cd "$repo" || exit 0
npx prettier --write "$file_path" >/dev/null 2>&1

errors=""

if [ -n "$workspace" ]; then
  lint_out=$(cd "$workspace" && npx eslint --no-warn-ignored "$file_path" 2>&1)
  if printf '%s' "$lint_out" | grep -qE '\([1-9][0-9]* errors?'; then
    errors="=== ESLint ($workspace) ===
$lint_out"
  fi

  tsc_out=$(npm run -s typecheck -w "$workspace" 2>&1)
  if [ $? -ne 0 ]; then
    errors="$errors

=== tsc ($workspace) ===
$tsc_out"
  fi
else
  lint_out=$(npx eslint --no-warn-ignored "$file_path" 2>&1)
  if [ $? -ne 0 ]; then
    errors="=== ESLint (root) ===
$lint_out"
  fi
fi

if [ -n "$errors" ]; then
  printf '%s\n' "$errors" | head -60 >&2
  exit 2
fi

exit 0
