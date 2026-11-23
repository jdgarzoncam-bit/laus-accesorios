-- LAU'S QA: independent catalogs, active storefront selection and immediate availability.
-- Additive only. Apply to the isolated Neon QA branch after review.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS immediate_available boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_products (
  catalog_id uuid NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (catalog_id, product_id)
);

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS active_catalog_id uuid REFERENCES public.catalogs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS active_collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS immediate_section_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS catalog_products_product_idx ON public.catalog_products(product_id);
CREATE INDEX IF NOT EXISTS catalog_products_catalog_order_idx ON public.catalog_products(catalog_id, sort_order);
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalogs_public_read ON public.catalogs;
CREATE POLICY catalogs_public_read ON public.catalogs
  FOR SELECT TO anonymous, authenticated USING (is_active = true);
DROP POLICY IF EXISTS catalog_products_public_read ON public.catalog_products;
CREATE POLICY catalog_products_public_read ON public.catalog_products
  FOR SELECT TO anonymous, authenticated USING (
    EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.is_active = true)
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'published')
  );
DROP POLICY IF EXISTS catalogs_admin_manage ON public.catalogs;
CREATE POLICY catalogs_admin_manage ON public.catalogs
  FOR ALL TO authenticated USING (public.is_laus_admin()) WITH CHECK (public.is_laus_admin());
DROP POLICY IF EXISTS catalog_products_admin_manage ON public.catalog_products;
CREATE POLICY catalog_products_admin_manage ON public.catalog_products
  FOR ALL TO authenticated USING (public.is_laus_admin()) WITH CHECK (public.is_laus_admin());

GRANT SELECT ON public.catalogs, public.catalog_products TO anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogs, public.catalog_products TO authenticated;
