-- LAU'S Accesorios / QA store settings
-- Additive migration: one editable public-facing store configuration row.
CREATE TABLE IF NOT EXISTS public.store_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id=true),
 store_name text NOT NULL DEFAULT 'LAU''S Accesorios',
 whatsapp_number text NOT NULL DEFAULT '573027433621',
 instagram_handle text NOT NULL DEFAULT '@lau.s_accesorios',
 shipping_message text NOT NULL DEFAULT 'Coordinamos disponibilidad y envío contigo por WhatsApp.',
 catalog_title text NOT NULL DEFAULT 'Colección actual',
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES neon_auth."user"(id) ON DELETE SET NULL
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.store_settings(id) VALUES(true) ON CONFLICT(id) DO NOTHING;
