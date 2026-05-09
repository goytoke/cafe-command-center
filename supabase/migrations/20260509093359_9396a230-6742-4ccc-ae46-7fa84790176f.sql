ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS additional numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS additional_label text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS takeaway boolean NOT NULL DEFAULT false;