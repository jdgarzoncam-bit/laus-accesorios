-- Public storefront stock visibility.
-- Expose only quantity_on_hand for inventory rows belonging to published products.
-- The frontend explicitly selects quantity_on_hand; admin-only fields remain unused.
CREATE POLICY inventory_public_stock_read
ON public.inventory
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.products AS p
    WHERE p.id = inventory.product_id
      AND p.status = 'published'
  )
);
