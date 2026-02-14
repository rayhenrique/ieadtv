-- RBAC NOTICE:
-- Run db/rbac_audit.sql before this seed to enable role-aware policies.

-- 1. Cria a tabela de banners se não existir
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    imagem_url TEXT NOT NULL,
    link_destino TEXT,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita RLS (Segurança a nível de linha)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Define Políticas de Acesso
-- Permitir leitura pública
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON public.banners;
CREATE POLICY "Public banners are viewable by everyone"
ON public.banners FOR SELECT
USING (true);

-- Permitir modificação para backoffice (admin/operador)
DROP POLICY IF EXISTS "Backoffice users can modify banners" ON public.banners;
CREATE POLICY "Backoffice users can modify banners"
ON public.banners FOR ALL
TO authenticated
USING (public.current_user_role() IS NOT NULL)
WITH CHECK (public.current_user_role() IS NOT NULL);

-- 4. Inserir Dados de Exemplo (Banners)
INSERT INTO public.banners (titulo, imagem_url, link_destino, ativo, ordem) VALUES
('Culto de Doutrina', 'https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=1200&q=80', '/eventos', true, 1),
('Missões Estaduais', 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80', '/missoes', true, 2),
('Campanha de Oração', 'https://images.unsplash.com/photo-1507692049790-de58293a469d?w=1200&q=80', '/campanhas', true, 3);