-- ============================================================
-- CRYPTA SUPABASE DATABASE SCHEMA
-- Execute this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. User Profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    display_name TEXT,
    avatar_url  TEXT,
    tier        TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
    vault_limit INTEGER DEFAULT 5,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Trigger to auto-create public.profiles upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Encrypted Vault Items table
CREATE TABLE IF NOT EXISTS public.vault_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type       TEXT NOT NULL CHECK (item_type IN ('text', 'image', 'audio', 'video', 'location', 'combined')),
    title           TEXT NOT NULL DEFAULT 'Untitled Item',
    algorithm       TEXT NOT NULL DEFAULT 'AES-256-GCM',
    encrypted_data  TEXT NOT NULL,
    storage_path    TEXT,
    file_size       BIGINT DEFAULT 0,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user ON public.vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_type ON public.vault_items(item_type);

-- 3. Shareable Encrypted Links table
CREATE TABLE IF NOT EXISTS public.shared_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_item_id   UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
    share_token     TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    password_hash   TEXT,
    expires_at      TIMESTAMPTZ,
    max_views       INTEGER DEFAULT 0,
    view_count      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_links_token ON public.shared_links(share_token);

-- 4. Audit Log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    item_type   TEXT,
    item_id     UUID,
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Vault items policies
DROP POLICY IF EXISTS "Users can view own vault items" ON public.vault_items;
CREATE POLICY "Users can view own vault items" ON public.vault_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vault items" ON public.vault_items;
CREATE POLICY "Users can insert own vault items" ON public.vault_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vault items" ON public.vault_items;
CREATE POLICY "Users can update own vault items" ON public.vault_items
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vault items" ON public.vault_items;
CREATE POLICY "Users can delete own vault items" ON public.vault_items
    FOR DELETE USING (auth.uid() = user_id);

-- Shared links policies
DROP POLICY IF EXISTS "Users can manage own shared links" ON public.shared_links;
CREATE POLICY "Users can manage own shared links" ON public.shared_links
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active unexpired shared links" ON public.shared_links;
CREATE POLICY "Public can view active unexpired shared links" ON public.shared_links
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

