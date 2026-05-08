
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all_auth" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories_all_auth" ON public.subcategories FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.categories (name) VALUES ('drink'), ('food'), ('snacks');

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c
JOIN (VALUES
  ('drink','Iced Coffee'),('drink','Frappe'),('drink','Mojito'),
  ('food','Wrap'),('food','Sandwich'),
  ('snacks','Cake'),('snacks','Donut'),('snacks','French Fries')
) AS s(cat, name) ON s.cat = c.name;
