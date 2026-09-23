#!/bin/bash
input=$(cat)

extract() {
  printf '%s' "$input" | node -e "
    let d='';
    process.stdin.on('data',c=>d+=c).on('end',()=>{
      try{
        const j=JSON.parse(d);
        const t=j.tool_input||{};
        process.stdout.write(String(t[process.argv[1]]||''));
      }catch{}
    });
  " "$1"
}

file_path=$(extract file_path)
[ -z "$file_path" ] && exit 0
file_path=$(cygpath -u "$file_path" 2>/dev/null || printf '%s' "$file_path" | tr '\\' '/')

case "$file_path" in
  */prisma/migrations/*)
    echo "BLOQUEADO: nunca criar ou editar arquivos em prisma/migrations/ à mão. Altere packages/database/prisma/schema.prisma e rode 'npx prisma migrate dev --name <nome>' dentro de packages/database." >&2
    exit 2 ;;
  */routeTree.gen.ts)
    echo "BLOQUEADO: apps/web/src/routeTree.gen.ts é gerado. Adicione a rota em apps/web/src/routes.ts e reinicie o dev server do web." >&2
    exit 2 ;;
  */src/generated/*)
    echo "BLOQUEADO: packages/database/src/generated é o Prisma client gerado. Rode 'npm run db:generate'." >&2
    exit 2 ;;
esac

case "$file_path" in
  */node_modules/*|*/dist/*) exit 0 ;;
  *.test.ts|*.test.tsx) exit 0 ;;
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

content=$(extract content)
[ -z "$content" ] && content=$(extract new_string)
[ -z "$content" ] && exit 0

case "$file_path" in
  */apps/api/src/index.ts) ;;
  *)
    if printf '%s' "$content" | grep -qE 'console\.(log|warn)[[:space:]]*\('; then
      echo "BLOQUEADO: console.log/console.warn são proibidos (CLAUDE.md › Code quality). Só console.error para erro inesperado; o boot do apps/api/src/index.ts é a única exceção." >&2
      exit 2
    fi ;;
esac

if printf '%s' "$content" | grep -qE ':[[:space:]]*any([^A-Za-z0-9_]|$)|(^|[^A-Za-z0-9_])as[[:space:]]+any([^A-Za-z0-9_]|$)|<any>|any\[\]'; then
  echo "BLOQUEADO: tipo 'any' é proibido (CLAUDE.md). Use tipos explícitos ou 'unknown' com type guard." >&2
  exit 2
fi

if printf '%s' "$content" | grep -qE '^[[:space:]]*/\*\*'; then
  echo "BLOQUEADO: sem comentários em src/ (CLAUDE.md › Code quality 1). O porquê vai para specs/decisions/ ou para o corpo do commit." >&2
  exit 2
fi

if printf '%s' "$content" | grep -qE '(bg|text|border|fill|stroke|ring)-\[#[0-9a-fA-F]{3,8}\]'; then
  echo "BLOQUEADO: cor hex inline é proibida (CLAUDE.md › Design system). Use o token de apps/web/src/shared/styles/global.css (@theme)." >&2
  exit 2
fi

exit 0
