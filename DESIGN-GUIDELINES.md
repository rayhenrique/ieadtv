# Diretrizes de Design & UI

O objetivo é um visual limpo, corporativo moderno e focado no conteúdo (Clean UI).

## 1. Paleta de Cores
- **Primary:** `#2281C5` (Azul Oficial AD Alagoas) - Usado em botões principais, links ativos e destaques.
- **Primary Hover:** `#1D6CA6` (Azul levemente mais escuro para interações).
- **Background:** `#FFFFFF` (Branco puro para a área de conteúdo).
- **Surface:** `#F9FAFB` (Gray 50 do Tailwind para diferenciar seções como o bloco de vídeo).
- **Text Principal:** `#111827` (Gray 900 - quase preto para máximo contraste).
- **Text Secundário:** `#4B5563` (Gray 600 - para datas, descrições e histórico).

## 2. Tipografia
Estilo moderno e sem serifa (System Fonts ou Google Fonts).
- **Sugestão:** `Inter` ou `Geist` (padrão Next.js/Vercel).
- **Títulos (H1, H2):** Font-weight Bold (700) ou Semibold (600), tracking levemente negativo (tight).
- **Corpo de texto:** Font-weight Regular (400), tamanho base 16px, line-height espaçado (relaxed) para facilitar a leitura dos artigos e históricos das congregações.

## 3. Estrutura e Espaçamento
- Espaçamento baseado em múltiplos de 4 (escala padrão do Tailwind).
- **Border Radius:** `0.5rem` (8px - `rounded-md` ou `rounded-lg`) para imagens, cards e botões. Nada de bordas excessivamente redondas (pill).
- **Sombras:** Uso mínimo. Apenas `shadow-sm` em cards para dar leve profundidade no hover, priorizando bordas de `1px` (`border-gray-200`) para separar elementos (estilo Linear).

## 4. Componentes base (shadcn/ui)
- **Button:** Usar variantes `default` (com o azul principal) e `outline` ou `ghost` para ações secundárias.
- **Card:** Para as Notícias e lista de Congregações.
- **Badge:** Para indicar categorias de notícias e status do culto.
- **Carousel/Slider:** Para a seção hero de banners.
- **Table/Data-table:** Para as listagens dentro do Painel de Administração.