-- LAUS migration: secure direct access through Neon Data API / PostgREST.
-- Apply only to the isolated Neon QA branch before exposing the endpoint.
CREATE OR REPLACE FUNCTION public.is_laus_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.user_id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
  );
$$;

REVOKE ALL ON FUNCTION public.is_laus_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_laus_admin() TO authenticated;

GRANT USAGE ON SCHEMA public TO anonymous, authenticated;

-- Public catalog: read-only access to published/visible rows is constrained by existing RLS.
GRANT SELECT ON public.categories, public.products, public.product_images,
  public.product_variants, public.collections, public.collection_products,
  public.promotions, public.product_promotions, public.store_settings
TO anonymous;

GRANT INSERT ON public.catalog_events TO anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.catalog_events_id_seq TO anonymous;

-- Public store settings are limited to commercial display fields; no secrets are stored here.
DROP POLICY IF EXISTS store_settings_public_read ON public.store_settings;
CREATE POLICY store_settings_public_read ON public.store_settings
  FOR SELECT TO anonymous, authenticated USING (true);

-- Anonymous analytics writes are restricted to known event types and a bounded session key.
DROP POLICY IF EXISTS catalog_events_public_insert ON public.catalog_events;
CREATE POLICY catalog_events_public_insert ON public.catalog_events
  FOR INSERT TO anonymous, authenticated
  WITH CHECK (
    event_type IN ('store_visit','product_view','search','add_to_cart','whatsapp_click','pdf_download')
    AND session_key IS NOT NULL
    AND length(session_key) BETWEEN 8 AND 100
  );

-- Every authenticated write/read outside the public catalog is limited to an approved admin.
DROP POLICY IF EXISTS admin_manage_all ON public.admin_profiles;
CREATE POLICY admin_manage_all ON public.admin_profiles
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.catalog_events;
CREATE POLICY admin_manage_all ON public.catalog_events
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.categories;
CREATE POLICY admin_manage_all ON public.categories
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.collection_products;
CREATE POLICY admin_manage_all ON public.collection_products
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.collections;
CREATE POLICY admin_manage_all ON public.collections
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.inventory;
CREATE POLICY admin_manage_all ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.inventory_movements;
CREATE POLICY admin_manage_all ON public.inventory_movements
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.product_images;
CREATE POLICY admin_manage_all ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.product_promotions;
CREATE POLICY admin_manage_all ON public.product_promotions
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.product_variants;
CREATE POLICY admin_manage_all ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.products;
CREATE POLICY admin_manage_all ON public.products
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.promotions;
CREATE POLICY admin_manage_all ON public.promotions
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.sale_items;
CREATE POLICY admin_manage_all ON public.sale_items
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.sales;
CREATE POLICY admin_manage_all ON public.sales
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());

DROP POLICY IF EXISTS admin_manage_all ON public.store_settings;
CREATE POLICY admin_manage_all ON public.store_settings
  FOR ALL TO authenticated
  USING (public.is_laus_admin())
  WITH CHECK (public.is_laus_admin());
