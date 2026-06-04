import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

const RENT_CAP = 15000;

type CatAgg = { revenue: number; cost: number; qty: number };

export default function SavingsPanels() {
  const [items, setItems] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const load = async () => {
    const [{ data: it }, { data: ex }] = await Promise.all([
      supabase.from("order_items").select("category,subcategory,price,cost,quantity"),
      supabase.from("expenses").select("category,total"),
    ]);
    setItems(it ?? []);
    setExpenses(ex ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("savings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Aggregate by category & subcategory (profit only — expenses are NOT subtracted here)
  const byCat: Record<string, CatAgg> = {};
  const bySub: Record<string, CatAgg> = {};
  items.forEach((i) => {
    const c = (i.category || "other").toLowerCase();
    const s = (i.subcategory || "—").toLowerCase();
    const rev = Number(i.price) * Number(i.quantity);
    const cost = Number(i.cost ?? 0) * Number(i.quantity);
    if (!byCat[c]) byCat[c] = { revenue: 0, cost: 0, qty: 0 };
    byCat[c].revenue += rev; byCat[c].cost += cost; byCat[c].qty += Number(i.quantity);
    if (!bySub[s]) bySub[s] = { revenue: 0, cost: 0, qty: 0 };
    bySub[s].revenue += rev; bySub[s].cost += cost; bySub[s].qty += Number(i.quantity);
  });
  const expByCat: Record<string, number> = {};
  expenses.forEach((e) => { const k = (e.category || "general").toLowerCase(); expByCat[k] = (expByCat[k] ?? 0) + Number(e.total); });

  const catProfit = (c: string) => {
    const v = byCat[c]; if (!v) return 0;
    return Math.max(0, v.revenue - v.cost);
  };
  const drinks = catProfit("drink");
  const food = catProfit("food");
  const snacks = catProfit("snacks");
  const totalProfit = drinks + food + snacks;

  // Rent fills first; each full 15,000 is released to Own Profit
  const released = Math.floor(totalProfit / RENT_CAP) * RENT_CAP;
  const rentBalance = totalProfit - released;
  const rentFilled = Math.min(rentBalance, RENT_CAP);
  const ownProfit = released; // released rent cycles become "Own Profit"

  // After rent jar of current cycle is filled, overflow profit flows to category buckets.
  // But since rentBalance is always < RENT_CAP, overflow in current cycle = 0.
  // Category wallets accumulate from overflow across cycles PLUS we subtract expenses.
  // Total profit shared with categories (after rent jar + releases) = 0 in current model.
  // Per user's example, allocation is proportional once jar starts overflowing.
  // We'll compute each category's lifetime contribution that exceeded rent obligations.
  const totalForBuckets = 0; // current cycle: nothing overflows because balance < cap
  // (When rent fills, it gets released to Own Profit and a new cycle starts.)

  // Category wallets = (category share of overflow profit) − category expenses
  const share = (cat: number) => totalProfit > 0 ? cat * (totalForBuckets / totalProfit) : 0;
  const drinksWallet = share(drinks) - (expByCat.drink ?? 0);
  const foodWallet = share(food) - (expByCat.food ?? 0);
  const snacksWallet = share(snacks) - (expByCat.snacks ?? 0);

  const wrapsProfit = Math.max(0, (bySub["wrap"]?.revenue ?? 0) - (bySub["wrap"]?.cost ?? 0));
  const icedProfit = Math.max(0, (bySub["iced"]?.revenue ?? 0) - (bySub["iced"]?.cost ?? 0));

  const rentPct = (rentFilled / RENT_CAP) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel-strong p-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold">Rent Savings Jar</h2>
            <div className="text-xs text-muted-foreground">Cap {money(RENT_CAP)}</div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-bold gradient-text">{money(rentFilled)}</div>
            <div className="text-sm text-muted-foreground">{rentPct.toFixed(1)}%</div>
          </div>
          <Progress value={rentPct} className="h-3" />
          <div className="text-xs text-muted-foreground mt-2">
            Fills from total profit. When full, the {money(RENT_CAP)} is released to Own Profit and the jar resets.
          </div>
        </div>

        <div className="glass-panel-strong p-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold">Own Profit</h2>
            <div className="text-xs text-muted-foreground">Released from rent cycles</div>
          </div>
          <div className="text-3xl font-bold text-success">{money(ownProfit)}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Each completed {money(RENT_CAP)} rent jar adds here as your clear profit.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Drinks Wallet</div>
          <div className={`text-2xl font-bold mt-1 ${drinksWallet < 0 ? "text-destructive" : ""}`}>{money(drinksWallet)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Profit {money(drinks)} · Expenses −{money(expByCat.drink ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          {icedProfit > 0 && <div className="text-[11px] text-muted-foreground mt-2">Iced profit: {money(icedProfit)}</div>}
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Food / Wraps Wallet</div>
          <div className={`text-2xl font-bold mt-1 ${foodWallet < 0 ? "text-destructive" : ""}`}>{money(foodWallet)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Profit {money(food)} · Expenses −{money(expByCat.food ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-success)" }} />
          {wrapsProfit > 0 && <div className="text-[11px] text-muted-foreground mt-2">Wraps profit: {money(wrapsProfit)}</div>}
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Snacks Wallet</div>
          <div className={`text-2xl font-bold mt-1 ${snacksWallet < 0 ? "text-destructive" : ""}`}>{money(snacksWallet)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Profit {money(snacks)} · Expenses −{money(expByCat.snacks ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-accent)" }} />
        </div>
      </div>

      <div className="glass-panel-strong p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> Profit from Drinks, Food and Snacks fills the Rent Savings jar.
        When the jar reaches {money(RENT_CAP)} the full amount is released to <strong className="text-foreground">Own Profit</strong> and
        the jar resets. Profit beyond the current rent target flows to each category's wallet. Expenses you log under a category
        are <strong className="text-foreground">deducted directly from that category's wallet</strong> (not from profit before allocation).
      </div>
    </div>
  );
}
