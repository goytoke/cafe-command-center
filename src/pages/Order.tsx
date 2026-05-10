import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategories } from "@/hooks/useCategories";
import { money } from "@/lib/format";
import { Plus, Minus, ShoppingCart, Trash2, Check } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";

type CartItem = {
  product: any;
  qty: number;
  takeaway: boolean;
  discountOn: boolean;
  discountInput: string;
  discount: number;
  additionalOn: boolean;
  additionalInput: string;
  additional: number;
};
const PAYMENT = ["Cash", "E-Birr", "Telebirr", "CBE"];
const TAKEAWAY_FEE = 20;

export default function Order() {
  const [products, setProducts] = useState<any[]>([]);
  const { categories, subsOf } = useCategories();
  const [cat, setCat] = useState<string>("");
  const [sub, setSub] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pay, setPay] = useState("Cash");

  useEffect(() => {
    supabase.from("products").select("*").order("name").then(({ data }) => setProducts(data ?? []));
  }, []);

  useEffect(() => { if (!cat && categories.length > 0) setCat(categories[0].name); }, [categories, cat]);

  const filtered = products.filter((p) => p.category === cat && (sub === "All" || p.subcategory === sub));

  const lineGross = (c: CartItem) =>
    c.qty * (Number(c.product.price) + (c.takeaway ? TAKEAWAY_FEE : 0));
  const lineTotal = (c: CartItem) =>
    Math.max(0, lineGross(c) - c.discount + c.additional);
  const subtotal = cart.reduce((s, c) => s + lineGross(c), 0);
  const takeawayFees = cart.reduce((s, c) => s + (c.takeaway ? c.qty * TAKEAWAY_FEE : 0), 0);
  const totalDiscount = cart.reduce((s, c) => s + c.discount, 0);
  const totalAdditional = cart.reduce((s, c) => s + c.additional, 0);
  const total = Math.max(0, subtotal - totalDiscount + totalAdditional);

  const addToCart = (p: any) => setCart((c) => {
    const existing = c.find((i) => i.product.id === p.id);
    if (existing) return c.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, {
      product: p, qty: 1, takeaway: false,
      discountOn: false, discountInput: "", discount: 0,
      additionalOn: false, additionalInput: "", additional: 0,
    }];
  });
  const updateItem = (id: string, patch: Partial<CartItem>) =>
    setCart((c) => c.map((i) => i.product.id === id ? { ...i, ...patch } : i));
  const dec = (id: string) => setCart((c) => c.flatMap((i) => i.product.id === id ? (i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }]) : [i]));
  const inc = (id: string) => setCart((c) => c.map((i) => i.product.id === id ? { ...i, qty: i.qty + 1 } : i));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.product.id !== id));

  const confirmDiscount = (c: CartItem) => {
    const v = Math.max(0, Number(c.discountInput) || 0);
    updateItem(c.product.id, { discount: v });
    if (v > 0) prettyToast.success(`Discount on ${c.product.name}`, `−${money(v)}`);
  };
  const confirmAdditional = (c: CartItem) => {
    const v = Math.max(0, Number(c.additionalInput) || 0);
    updateItem(c.product.id, { additional: v });
    if (v > 0) prettyToast.success(`Additional on ${c.product.name}`, `+${money(v)}`);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return prettyToast.error("Cart is empty");
    const { data: order, error } = await supabase.from("orders").insert({
      total,
      payment_method: pay,
      discount: totalDiscount,
      additional: totalAdditional,
      additional_label: null,
    } as any).select().single();
    if (error || !order) return prettyToast.error("Order failed", error?.message);
    await supabase.from("order_items").insert(cart.map((c) => ({
      order_id: order.id,
      product_id: c.product.id,
      product_name: c.product.name,
      category: c.product.category,
      subcategory: c.product.subcategory,
      quantity: c.qty,
      price: Number(c.product.price) + (c.takeaway ? TAKEAWAY_FEE : 0),
      cost: c.product.cost ?? 0,
      takeaway: c.takeaway,
    } as any)));

    const icedCups = cart
      .filter((c) => c.product.category === "drink" && String(c.product.subcategory ?? "").toLowerCase().includes("iced"))
      .reduce((s, c) => s + c.qty, 0);
    if (icedCups > 0) {
      const { data: cups } = await supabase
        .from("store_items")
        .select("*")
        .ilike("name", "%takeaway cup%")
        .order("created_at")
        .limit(1);
      const cup = cups?.[0];
      if (cup) {
        const newQty = Math.max(0, Number(cup.quantity) - icedCups);
        await supabase.from("store_items").update({ quantity: newQty }).eq("id", cup.id);
      } else {
        prettyToast.error("Takeaway Cup not found in Store", "Add a store item named 'Takeaway Cup' to track stock");
      }
    }

    prettyToast.success("Order placed", `${money(total)} via ${pay}`);
    setCart([]);
  };

  const isFoodOrSnack = (c: CartItem) => c.product.category === "food" || c.product.category === "snacks";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text">Our Menu</h1>
        </div>
        <div className="flex justify-center gap-2">
          {categories.map((c) => (
            <button key={c.id} onClick={() => { setCat(c.name); setSub("All"); }}
              className={`px-5 py-2 rounded-xl capitalize text-sm font-medium ${cat === c.name ? "text-white" : "bg-muted/50 hover:bg-muted"}`}
              style={cat === c.name ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}>{c.name}</button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["All", ...subsOf(cat).map((s) => s.name)].map((s) => (
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
          <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.product.id} className="p-2 rounded-lg bg-muted/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {money(c.product.price)} × {c.qty}
                      {c.takeaway && <span className="ml-1 text-accent">+{money(TAKEAWAY_FEE)}</span>}
                      {c.discount > 0 && <span className="ml-1 text-destructive">−{money(c.discount)}</span>}
                      {c.additional > 0 && <span className="ml-1 text-accent">+{money(c.additional)}</span>}
                    </div>
                    <div className="text-xs font-semibold mt-0.5">= {money(lineTotal(c))}</div>
                  </div>
                  <button onClick={() => dec(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg bg-muted hover:bg-background"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm font-semibold">{c.qty}</span>
                  <button onClick={() => inc(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg bg-muted hover:bg-background"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => remove(c.product.id)} className="h-7 w-7 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
                </div>

                {isFoodOrSnack(c) && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer pl-1">
                    <Checkbox checked={c.takeaway} onCheckedChange={(v) => updateItem(c.product.id, { takeaway: !!v })} />
                    <span>Takeaway (+{money(TAKEAWAY_FEE)})</span>
                  </label>
                )}

                <label className="flex items-center gap-2 text-xs cursor-pointer pl-1">
                  <Checkbox checked={c.discountOn} onCheckedChange={(v) => updateItem(c.product.id, { discountOn: !!v, ...(v ? {} : { discount: 0, discountInput: "" }) })} />
                  <span>Discount</span>
                </label>
                {c.discountOn && (
                  <div className="flex gap-2 pl-1">
                    <input type="number" min={0} value={c.discountInput} onChange={(e) => updateItem(c.product.id, { discountInput: e.target.value })} placeholder="Amount"
                      className="flex-1 h-8 px-2 rounded-lg bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={() => confirmDiscount(c)} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"><Check className="h-3 w-3" />OK</button>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs cursor-pointer pl-1">
                  <Checkbox checked={c.additionalOn} onCheckedChange={(v) => updateItem(c.product.id, { additionalOn: !!v, ...(v ? {} : { additional: 0, additionalInput: "" }) })} />
                  <span>Additional</span>
                </label>
                {c.additionalOn && (
                  <div className="flex gap-2 pl-1">
                    <input type="number" min={0} value={c.additionalInput} onChange={(e) => updateItem(c.product.id, { additionalInput: e.target.value })} placeholder="Amount"
                      className="flex-1 h-8 px-2 rounded-lg bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button onClick={() => confirmAdditional(c)} className="h-8 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1"><Check className="h-3 w-3" />OK</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1 mb-3 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {takeawayFees > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground"><span>↳ incl. takeaway</span><span>+{money(takeawayFees)}</span></div>
          )}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-destructive"><span>Discount</span><span>−{money(totalDiscount)}</span></div>
          )}
          {totalAdditional > 0 && (
            <div className="flex justify-between text-accent"><span>Additional</span><span>+{money(totalAdditional)}</span></div>
          )}
        </div>

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
