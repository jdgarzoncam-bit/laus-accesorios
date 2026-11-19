-- QA only; additive migration for confirmed sales registry.
CREATE TABLE IF NOT EXISTS public.sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sale_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 customer_name text NOT NULL DEFAULT '',
 channel text NOT NULL DEFAULT 'whatsapp' CHECK(channel IN ('whatsapp','direct','other')),
 status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','refunded')),
 total_cop integer NOT NULL CHECK(total_cop>0),
 notes text NOT NULL DEFAULT '',
 actor_user_id uuid NULL REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sale_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
 product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
 product_reference text NOT NULL,
 product_name text NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0),
 unit_price_cop integer NOT NULL CHECK(unit_price_cop>=0),
 line_total_cop integer NOT NULL CHECK(line_total_cop>=0)
);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS sale_items_product_idx ON public.sale_items(product_id);
-- No public write policies. Writes must pass through an authenticated admin API.