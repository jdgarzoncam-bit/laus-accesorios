-- Expose only aggregate stock fields needed by the public storefront.
-- Inventory rows and internal thresholds remain protected by the admin-only RLS policy.
DROP POLICY IF EXISTS inventory_public_stock_read ON public.inventory;

CREATE OR REPLACE FUNCTION public.get_public_product_stock()
RETURNS TABLE (
  product_id uuid,
  variant_id uuid,
  quantity_on_hand integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT i.product_id, i.variant_id, i.quantity_on_hand
  FROM public.inventory AS i
  INNER JOIN public.products AS p ON p.id = i.product_id
  WHERE p.status = 'published';
$function$;

REVOKE ALL ON FUNCTION public.get_public_product_stock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_product_stock() TO anonymous, authenticated;
