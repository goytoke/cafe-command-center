import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CATEGORIES, SUBCATEGORIES, Category } from "@/lib/categories";
import { money } from "@/lib/format";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";

type CartItem = { product: any; qty: number };
const PAYMENT = ["Cash", "E-Birr", "Telebirr", "CBE"];

export default function Order() {
  const [products, setProducts] = useState<any[]>([]);
  const [cat, setCat] = useState<Category>("drink");
  const [sub, setSub] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pay, setPay] = useState("Cash");

  useEffect(() => {
    supabase.from("products").select("*").order("name").then(({ data }) => setProducts(data ?? []));
  }, []);

  const filtered = products.filter((p) => p.category === cat && (sub === "All" || p.subcategory === sub));
  const total = cart.reduce((s, c) => s + c.qty * Number(c.product.price), 0);

  const addToCart = (p: any) => setCart((c) => {
    const existing = c.find((i) => i.product.id === p.id);
    if (existing) return c.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, { product: p, qty: 1 }];
  });
  const dec = (id: string) => setCart((c) => c.flatMap((i) => i.product.id === id ? (i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }]) : [i]));
  const inc = (id: string) => setCart((c) => c.map((i) => i.product.id === id ? { ...i, qty: i.qty + 1 } : i));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.product.id !== id));

  const placeOrder = async () => {
    if (cart.length === 0) return prettyToast.error("Cart is empty");
    const { data: order, error } = await supabase.from("orders").insert({ total, payment_method: pay }).select().single();
    if (error || !order) return prettyToast.error("Order failed", error?.message);
    await supabase.from("order_items").insert(cart.map((c) => ({
      order_id: order.id, product_id: c.product.id, product_name: c.product.name,
      category: c.product.category, subcategory: c.product.subcategory,
      quantity: c.qty, price: c.product.price, cost: c.product.cost ?? 0,
    })));
    prettyToast.success("Order placed", `${money(total)} via ${pay}`);
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text">Our Menu</h1>
        </div>
        <div className="flex justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCat(c); setSub("All"); }}
              className={`px-5 py-2 rounded-xl capitalize text-sm font-medium ${cat === c ? "text-white" : "bg-muted/50 hover:bg-muted"}`}
              style={cat === c ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}>{c}</button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["All", ...SUBCATEGORIES[cat]].map((s) => (
            <button key={s} onClick={() => setSub(s)}
              className={`px-4 py-1.5 rounded-lg text-sm ${sub === s ? "bg-accent text-accent-foreground font-semibold" : "bg-muted/50 hover:bg-muted"}`}>{s}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-12">No products in this category</div>
          ) : filtered.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="glass-panel-strong overflow-hidden text-left transition-all hover:-translate-y-1 hover:[box-shadow:var(--shadow-glow)]">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="h-32 w-full object-cover" /> : <div className="h-32 bg-muted" />}
              <div className="p-3">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{p.description}</div>
                <div className="mt-2 font-bold gradient-text-accent">{money(p.price)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <aside className="glass-panel-strong p-5 h-fit lg:sticky lg:top-20">
        <div className="flex items-center gap-2 mb-4"><ShoppingCart className="h-5 w-5 text-accent" /><h2 className="font-bold text-lg">Current Order</h2></div>
        {cart.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Click a product to add</div>
        ) : (
          <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.product.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.product.name}</div>
                  <div className="text-xs text-muted-foreground">{money(c.product.price)} × {c.qty}</div>
                </div>
                <button onClick={() => dec(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg bg-muted hover:bg-background"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm font-semibold">{c.qty}</span>
                <button onClick={() => inc(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg bg-muted hover:bg-background"><Plus className="h-3 w-3" /></button>
                <button onClick={() => remove(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between font-bold mb-3"><span>Total</span><span className="gradient-text">{money(total)}</span></div>
        <div className="space-y-2 mb-3">
          <div className="text-xs text-muted-foreground">Payment Method</div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT.map((m) => (
              <button key={m} onClick={() => setPay(m)} className={`px-2 py-2 text-xs rounded-lg ${pay === m ? "bg-accent text-accent-foreground font-semibold" : "bg-muted/50 hover:bg-muted"}`}>{m}</button>
            ))}
          </div>
        </div>
        <Button onClick={placeOrder} className="w-full btn-glow" style={{ background: "var(--gradient-primary)" }}>Place Order</Button>
      </aside>
    </div>
  );
}
