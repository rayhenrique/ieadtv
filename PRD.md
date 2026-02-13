# Product Requirements Document (PRD)

## 1. Visão Geral
Portal institucional desenvolvido em Next.js (client-side focused) e Supabase (BaaS), utilizando shadcn/ui para o design system. Focado em alta performance de leitura e facilidade de gestão para a equipe de mídia.

## 2. Personas
- **Irmão João (Membro):** Quer saber o horário do próximo evento, ler a notícia do último congresso e achar o endereço de uma congregação específica.
- **Lucas (Equipe de Mídia):** Precisa de um painel rápido e sem complexidade para subir banners, cadastrar notícias e atualizar a agenda antes do final de semana.

## 3. User Stories
- Como *Membro*, quero *assistir ao culto gravado/ao vivo na página inicial* para *acompanhar a palavra quando não puder ir presencialmente*.
- Como *Membro*, quero *filtrar notícias e eventos por congregação* para *saber o que acontece na minha comunidade local*.
- Como *Visitante*, quero *ver uma lista com fotos e endereços das congregações* para *decidir qual é a mais próxima da minha casa*.
- Como *Equipe de Mídia*, quero *gerenciar o conteúdo (Banners, Notícias, Eventos, Congregações)* para *manter o site atualizado sem precisar de código*.

## 4. Requisitos Funcionais (Core Features)
### 4.1. Portal Público (Front-end)
- **Home:** Exibição do Slider de Banners, Embed do YouTube (Último culto/Ao vivo), Grid de Últimas Notícias e Próximos Eventos.
- **Notícias:** Listagem de artigos com paginação e filtro por Categoria/Tag de Congregação. Página interna de leitura otimizada.
- **Agenda:** Visualização em lista dos próximos eventos, ordenados por data.
- **Congregações:** Página listando todas as congregações. Página de detalhes com: Foto principal, Endereço, Nome do Dirigente e Breve Histórico.

### 4.2. Painel Admin (CMS Backend)
Acesso restrito via Supabase Auth. Módulos com CRUD completo:
- **Usuários:** Gerenciamento da equipe de mídia (Adicionar/Remover acessos).
- **Banners:** Upload de imagem (Supabase Storage), título, link de destino e status (ativo/inativo).
- **Categorias:** Gestão de tags (usadas para vincular notícias às congregações ou temas gerais).
- **Notícias/Artigos:** Editor de texto rico (Rich Text), upload de imagem de capa, seleção de categoria, autor e data de publicação.
- **Eventos:** Título, data/hora de início e fim, local e descrição.
- **Congregações:** Nome, Endereço, Nome do Dirigente, Texto de Histórico, Upload de Fotos (Storage).

## 5. Requisitos Não-Funcionais
- **Stack:** Next.js (App Router), TailwindCSS, shadcn/ui, Lucide Icons.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage).
- **Integração:** YouTube Data API v3 (para buscar o último vídeo do canal automaticamente).
- **Performance:** Imagens servidas no formato WebP com Next/Image. Páginas estáticas revalidadas em background (ISR).

## 6. Casos de Borda (Edge Cases)
- Falha na API do YouTube: O player deve ter um fallback elegante ou sumir, sem quebrar a renderização da página.
- Imagem de capa da notícia não enviada: O sistema deve aplicar um placeholder padrão com a logo da AD.