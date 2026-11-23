-- Lau's Accesorios / Neon QA foundation
-- Apply to Neon project dawn-cherry-24723488, branch qa only.
-- Additive migration: no existing business data is dropped.

CREATE TABLE IF NOT EXISTS public.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
 description text, sort_order integer NOT NULL DEFAULT 0, is_visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text NOT NULL UNIQUE, name text NOT NULL,
 slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '', price_cop integer NOT NULL CHECK (price_cop >= 0),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 availability_override text CHECK (availability_override IN ('available','out_of_stock') OR availability_override IS NULL),
 category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL, is_featured boolean NOT NULL DEFAULT false,
 published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 bucket_name text NOT NULL DEFAULT 'laus-product-images', object_key text NOT NULL, alt_text text NOT NULL DEFAULT '',
 sort_order integer NOT NULL DEFAULT 0, width integer CHECK (width > 0), height integer CHECK (height > 0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(bucket_name, object_key)
);
CREATE TABLE IF NOT EXISTS public.product_variants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 variant_type text NOT NULL CHECK (variant_type IN ('size','model','color','other')), label text NOT NULL,
 sku text UNIQUE, sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE, quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
 low_stock_threshold integer NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE NULLS NOT DISTINCT(product_id, variant_id)
);
CREATE TABLE IF NOT EXISTS public.inventory_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
 movement_type text NOT NULL CHECK (movement_type IN ('opening','restock','sale','adjustment','return','damage')),
 quantity_delta integer NOT NULL CHECK (quantity_delta <> 0), note text NOT NULL DEFAULT '',
 actor_user_id uuid REFERENCES neon_auth."user"(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.collections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '',
 collection_type text NOT NULL DEFAULT 'seasonal' CHECK (collection_type IN ('general','seasonal','campaign')),
 cover_image_key text, starts_at timestamptz, ends_at timestamptz, is_active boolean NOT NULL DEFAULT false,
 sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS public.collection_products (
 collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, sort_order integer NOT NULL DEFAULT 0,
 PRIMARY KEY(collection_id, product_id)
);
CREATE TABLE IF NOT EXISTS public.promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL DEFAULT '',
 discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed_amount')), discount_value integer NOT NULL CHECK (discount_value > 0),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, is_active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ends_at > starts_at), CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);
CREATE TABLE IF NOT EXISTS public.product_promotions (
 promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, PRIMARY KEY(promotion_id, product_id)
);
CREATE TABLE IF NOT EXISTS public.catalog_events (
 id bigserial PRIMARY KEY, event_type text NOT NULL CHECK (event_type IN ('product_view','search','add_to_cart','whatsapp_click','pdf_download')),
 product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
 session_key text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admin_profiles (
 user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '', role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.enforce_admin_limit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(918273645);
 IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
  IF (SELECT count(*) FROM public.admin_profiles WHERE role='admin' AND user_id <> NEW.user_id) >= 3 THEN
   RAISE EXCEPTION 'Maximum of three administrator accounts reached' USING ERRCODE='check_violation';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS admin_profiles_limit ON public.admin_profiles;
CREATE TRIGGER admin_profiles_limit BEFORE INSERT OR UPDATE OF role ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_limit();
CREATE INDEX IF NOT EXISTS products_public_idx ON public.products(status, category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS product_images_product_sort_idx ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS variants_product_active_idx ON public.product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS inventory_product_idx ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS inventory_movements_created_idx ON public.inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS collections_active_idx ON public.collections(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS catalog_events_type_created_idx ON public.catalog_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS catalog_events_product_created_idx ON public.catalog_events(product_id, created_at DESC);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (is_visible=true);
CREATE POLICY products_public_read ON public.products FOR SELECT USING (status='published');
CREATE POLICY product_images_public_read ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.status='published'));
CREATE POLICY variants_public_read ON public.product_variants FOR SELECT USING (is_active=true AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.status='published'));
CREATE POLICY collections_public_read ON public.collections FOR SELECT USING (is_active=true AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()));
CREATE POLICY collection_products_public_read ON public.collection_products FOR SELECT USING (
 EXISTS (SELECT 1 FROM public.collections c WHERE c.id=collection_id AND c.is_active=true AND (c.starts_at IS NULL OR c.starts_at<=now()) AND (c.ends_at IS NULL OR c.ends_at>now()))
 AND EXISTS (SELECT 1 FROM public.products p WHERE p.id=product_id AND p.status='published'));
CREATE POLICY promotions_public_read ON public.promotions FOR SELECT USING (is_active=true AND starts_at<=now() AND ends_at>now());
CREATE POLICY product_promotions_public_read ON public.product_promotions FOR SELECT USING (EXISTS (SELECT 1 FROM public.promotions pr WHERE pr.id=promotion_id AND pr.is_active=true AND pr.starts_at<=now() AND pr.ends_at>now()));
CREATE POLICY admin_profiles_self_read ON public.admin_profiles FOR SELECT USING (user_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
