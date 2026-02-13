# IEADTV

Portal institucional e administrativo da Igreja Evangélica Assembleia de Deus em Teotonio Vilela.

## Stack

- Next.js 16 (App Router)
- React 19
- Supabase (Auth, Database e Storage)
- Tailwind CSS 4

## Requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase configurado

## Variaveis de ambiente

Use o arquivo `.env.example` como base e crie o `.env.local`:

```bash
cp .env.example .env.local
```

Depois, preencha os valores:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Variaveis opcionais para YouTube:

```env
YOUTUBE_CHANNEL_ID=
YOUTUBE_HANDLE=
```

Variavel opcional para SEO e prévia de compartilhamento:

```env
NEXT_PUBLIC_SITE_URL=https://ieadtv.kltecnologia.com
```

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

- Site publico: `http://localhost:3000`
- Login admin: `http://localhost:3000/login`
- Painel admin: `http://localhost:3000/admin/dashboard`

## Scripts disponiveis

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Estrutura principal

- `app/(public)`: paginas publicas
- `app/(admin)`: painel administrativo
- `lib/actions`: server actions
- `lib/supabase`: clientes Supabase (browser/server/admin)
- `components`: componentes reutilizaveis

## Usuarios administrativos

O sistema usa autenticacao do Supabase.

- Para criar o primeiro usuario admin, use o painel do Supabase (Auth > Users) ou o modulo `Usuarios` no admin.
- O modulo `Usuarios` no painel depende de `SUPABASE_SERVICE_ROLE_KEY` configurada.

## Deploy

Manual completo de deploy:

- `docs/DEPLOY.md`
- `docs/DEPLOY-VPS-CLOUDPANEL.md`

## Fluxo Git e Deploy rapido

No computador local (subir alteracoes para o GitHub):

```bash
git status
git add .
git commit -m "sua mensagem de commit"
git pull --rebase origin main
git push origin main
```

Na VPS (baixar e publicar):

```bash
cd ~/htdocs/ieadtv.kltecnologia.com
git pull origin main
npm ci
npm run build
pm2 restart ieadtv --update-env
```
