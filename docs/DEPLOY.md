# Manual de Deploy (VPS, Linux e Windows)

Este guia cobre deploy de producao para o projeto IEADTV em:

- VPS Linux (recomendado)
- Linux (servidor local/on-premises)
- Windows (servidor ou maquina dedicada)

## 1. Requisitos gerais

- Node.js 20+
- npm 10+
- Git
- Projeto Supabase pronto
- Variaveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://ieadtv.kltecnologia.com
```

Opcional (YouTube):

```env
YOUTUBE_CHANNEL_ID=
YOUTUBE_HANDLE=
```

## 2. Preparacao do projeto

No servidor de destino:

```bash
git clone https://github.com/rayhenrique/ieadtv.git
cd ieadtv
npm ci
```

Crie o arquivo `.env.local` na raiz e preencha as variaveis.

Valide build:

```bash
npm run build
```

## 3. Deploy em VPS Linux (Ubuntu + Nginx + PM2)

### 3.1 Instalar dependencias basicas

```bash
sudo apt update
sudo apt install -y git curl nginx
```

Instalar Node.js 20 (via NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.2 Rodar app com PM2

```bash
sudo npm i -g pm2
cd ieadtv
npm ci
npm run build
pm2 start npm --name ieadtv -- run start
pm2 save
pm2 startup
```

### 3.3 Configurar Nginx como reverse proxy

Arquivo: `/etc/nginx/sites-available/ieadtv`

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/ieadtv /etc/nginx/sites-enabled/ieadtv
sudo nginx -t
sudo systemctl restart nginx
```

### 3.4 SSL com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 4. Deploy em Linux com systemd (sem PM2)

Use esta opcao quando quiser gerenciar o processo com `systemd`.

### 4.1 Build

```bash
cd ieadtv
npm ci
npm run build
```

### 4.2 Criar service

Arquivo: `/etc/systemd/system/ieadtv.service`

```ini
[Unit]
Description=IEADTV Next.js App
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/ieadtv
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ieadtv
sudo systemctl start ieadtv
sudo systemctl status ieadtv
```

Se quiser dominio publico, use Nginx igual ao passo 3.3.

## 5. Deploy em Windows (NSSM + servico)

### 5.1 Preparacao

1. Instale Node.js 20 LTS.
2. Instale Git.
3. Clone o projeto:

```powershell
git clone https://github.com/rayhenrique/ieadtv.git
cd ieadtv
npm ci
npm run build
```

4. Crie `.env.local` na raiz.

### 5.2 Rodar como servico com NSSM

Baixe NSSM: `https://nssm.cc/download`

Criar servico (PowerShell como Administrador):

```powershell
nssm install IEADTV
```

No formulario do NSSM:

- Path: `C:\Program Files\nodejs\npm.cmd`
- Startup directory: `C:\caminho\para\ieadtv`
- Arguments: `run start`

Depois:

```powershell
nssm start IEADTV
```

### 5.3 Porta e firewall

Liberar porta 3000 (se necessario):

```powershell
netsh advfirewall firewall add rule name="IEADTV 3000" dir=in action=allow protocol=TCP localport=3000
```

Para expor em dominio com SSL no Windows, use reverse proxy (IIS + ARR ou Nginx para Windows).

## 6. Atualizacao de versao

Fluxo padrao de update:

```bash
cd ieadtv
git pull origin main
npm ci
npm run build
```

Reiniciar processo:

- PM2:

```bash
pm2 restart ieadtv
```

- systemd:

```bash
sudo systemctl restart ieadtv
```

- NSSM (Windows):

```powershell
nssm restart IEADTV
```

## 7. Checklist de producao

- `.env.local` preenchido corretamente
- `SUPABASE_SERVICE_ROLE_KEY` somente no servidor
- build sem erro (`npm run build`)
- processo persistente (PM2/systemd/NSSM)
- reverse proxy configurado
- SSL ativo
- backup e monitoramento habilitados
