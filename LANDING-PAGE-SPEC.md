# Especificação da Landing Page (Home)

A estrutura deve seguir um fluxo visual lógico de cima para baixo.

**1. Header (Navegação)**
- Logo alinhada à esquerda.
- Links: Início, Notícias, Agenda, Congregações.
- Estilo: Sticky, fundo branco/translúcido, borda inferior sutil (1px).

**2. Hero Section (Banners)**
- Slider principal ocupando largura total (mas contido em max-width de 1200px para manter estilo Vercel).
- Imagens com overlay sutil para garantir leitura de textos por cima.
- Controles: Setas laterais e dots de paginação discretos.

**3. Seção "Culto Online" (Destaque)**
- Background levemente diferenciado (ex: gray-50).
- Componente de Vídeo em destaque (16:9) usando embed do YouTube.
- Badges dinâmicas ("Ao Vivo" em vermelho ou "Último Culto" em cinza).

**4. Últimas Notícias**
- Título da seção à esquerda, link "Ver todas" à direita.
- Grid de 3 colunas (desktop) ou 1 coluna (mobile).
- Cards contendo: Imagem de capa, Tag/Categoria (ex: "Sede", "Jovens"), Título curto, Data.

**5. Próximos Eventos (Agenda)**
- Layout em lista lateral ou grid de 2 colunas.
- Foco tipográfico na Data (Dia em destaque) ao lado do título do evento.

**6. Chamada para Congregações**
- Bloco de CTA (Call to Action).
- Título: "Encontre uma congregação perto de você".
- Botão primário redirecionando para a rota `/congregacoes`.

**7. Footer**
- Logo monocromática, links úteis, redes sociais oficiais e endereço da Sede.