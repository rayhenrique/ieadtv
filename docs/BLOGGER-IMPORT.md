# Importacao do Blogger para Noticias

Guia para migrar noticias do blog antigo para `public.noticias`, preservando data, texto e imagens.

## 1. Preparar banco

Execute no Supabase SQL Editor:

```sql
-- caminho no repositorio
db/blogger_import.sql
```

Isso cria colunas de rastreabilidade (`fonte_externa*`) e indice unico parcial para idempotencia.

## 2. Rodar importacao (dry-run primeiro)

No projeto:

```bash
npm run import:blogger -- --dry-run
```

Esse modo nao grava noticias no banco. Apenas valida feed, deduplicacao e gera relatorio em `docs/reports/`.

## 3. Aplicar importacao

Depois de revisar o dry-run:

```bash
npm run import:blogger -- --apply
```

## 4. O que o script faz

- Fonte: `https://blogadteotoniovilela.blogspot.com/feeds/posts/default?alt=json`
- Categoria fixa: `categorias.slug = "noticias"`
- Preserva HTML original em `conteudo`
- Usa `published` do Blogger em `published_at` e `created_at`
- Mantem imagens por hotlink do Blogger/Googleusercontent
- Ignora duplicatas por:
  - `fonte_externa = blogger` + `fonte_externa_id`
  - ou `slug` ja existente
- Registra auditoria agregada em `audit_logs` no modo `--apply`:
  - `action = BLOGGER_IMPORT_NEWS`
  - `resource_type = noticias`

## 5. Relatorios

Cada execucao gera um JSON com resumo:

- `totalLidos`
- `totalNovos`
- `totalDuplicados`
- `totalFalhas`
- listas de importados, duplicados e falhas

Caminho:

```text
docs/reports/blogger-import-YYYYMMDD-HHMMSS.json
```
