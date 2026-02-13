# Deploy VPS CloudPanel (Hostinger)

Guia objetivo para publicar o projeto IEADTV na VPS da Hostinger com CloudPanel, usando o dominio `ieadtv.kltecnologia.com`.

Porta adotada neste guia: `3005`.

## 1. DNS do dominio

No painel de DNS onde o dominio esta gerenciado:

- Crie/edite um registro `A`
- Host: `ieadtv`
- Valor: `IP_PUBLICO_DA_VPS`
- TTL: padrao (ex: 300)

Se usar `www`, crie tambem:

- Tipo: `CNAME`
- Host: `www`
- Valor: `ieadtv.kltecnologia.com`

## 2. Criar site Node.js no CloudPanel

No CloudPanel:

1. `Sites` -> `Add Site` -> `Create a Node.js Site`
2. Domain Name: `ieadtv.kltecnologia.com`
3. Node.js Version: `20`
4. Site User: manter padrao (ou criar dedicado)
5. Finalize em `Create`

## 3. Conectar por SSH e baixar o projeto

```bash
ssh root@IP_DA_VPS
su - USUARIO_DO_SITE
cd ~/htdocs/ieadtv.kltecnologia.com
git clone https://github.com/rayhenrique/ieadtv.git .
npm ci
```

## 4. Variaveis de ambiente

Crie `.env.local`:

```bash
cp .env.example .env.local
nano .env.local
```

Preencha com valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://ieadtv.kltecnologia.com
YOUTUBE_CHANNEL_ID=
YOUTUBE_HANDLE=
```

## 5. Build e start

No diretorio do projeto:

```bash
npm run build
```

No CloudPanel, abra o site criado e configure:

- App Root: `/home/USUARIO_DO_SITE/htdocs/ieadtv.kltecnologia.com`
- Start Command: `npm run start -- -p 3005`
- Port: `3005`

Inicie/reinicie a aplicacao pelo CloudPanel.

Importante: use apenas um gerenciador de processo por vez (`CloudPanel` ou `PM2`).

## 6. PM2 (opcional, via SSH)

Se preferir gerenciar o processo via terminal (em vez do botao Start/Restart do CloudPanel):

```bash
cd ~/htdocs/ieadtv.kltecnologia.com
npm install pm2@latest -g
pm2 delete ieadtv
pm2 start npm --name ieadtv -- run start -- -p 3005
pm2 save
pm2 startup
```

Depois de executar `pm2 startup`, rode o comando que ele imprimir na tela (normalmente com `sudo`) para habilitar inicializacao automatica no boot.

Comandos uteis:

```bash
pm2 status
pm2 logs ieadtv
pm2 restart ieadtv
pm2 stop ieadtv
```

## 7. SSL (Let's Encrypt)

No CloudPanel:

1. Site `ieadtv.kltecnologia.com` -> `SSL/TLS`
2. `New Let's Encrypt Certificate`
3. Marque `Issue Certificate` (e `Auto Renew`)
4. Confirme criacao

## 8. Atualizar em producao

No seu computador local (commit + push para GitHub):

```bash
git status
git add .
git commit -m "sua mensagem de commit"
git pull --rebase origin main
git push origin main
```

Na VPS, para publicar a atualizacao:

```bash
cd ~/htdocs/ieadtv.kltecnologia.com
git pull origin main
npm ci
npm run build
pm2 restart ieadtv --update-env
```

Se usar CloudPanel (sem PM2), troque a ultima linha por restart no painel.

Se estiver usando PM2:

```bash
pm2 restart ieadtv --update-env
```

## 9. Troubleshooting

Erro `EADDRINUSE: address already in use :::3000` ou `:::3005`:

1. Existe outro processo ocupando a porta.
2. Ou voce iniciou pelo CloudPanel e PM2 ao mesmo tempo.

Correcao rapida (PM2):

```bash
pm2 delete ieadtv
pm2 start npm --name ieadtv -- run start -- -p 3005
pm2 save
```

## 10. Checklist rapido

- DNS apontando para a VPS
- Build sem erros (`npm run build`)
- `.env.local` preenchido
- App iniciando na porta `3005`
- SSL ativo em `https://ieadtv.kltecnologia.com`
