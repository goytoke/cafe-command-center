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

  // Aggregate by category
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

  // Category profit after its own expenses (cannot go below 0 for bucket purposes)
  const catProfit = (c: string) => {
    const v = byCat[c]; if (!v) return 0;
    return v.revenue - v.cost - (expByCat[c] ?? 0);
  };
  const drinks = Math.max(0, catProfit("drink"));
  const food = Math.max(0, catProfit("food"));
  const snacks = Math.max(0, catProfit("snacks"));
  const totalProfit = drinks + food + snacks;

  // Rent fills first from combined profit; once filled, overflow returns proportionally to category buckets
  // and each full 15,000 gets "released" to net profit.
  const released = Math.floor(totalProfit / RENT_CAP) * RENT_CAP;
  const rentSaved = Math.min(totalProfit, RENT_CAP) - (released >= RENT_CAP ? RENT_CAP : 0);
  // Simpler: current rent balance after releases
  const rentBalance = totalProfit - released; // 0..RENT_CAP-ε  (when totalProfit % RENT_CAP)
  const rentFilled = Math.min(rentBalance, RENT_CAP);

  // Overflow per category = its share of (totalProfit - rentBalance - released) ... but released bumps net profit, not buckets
  // After rent is funded (current cycle), remaining of each category's profit goes to its bucket.
  // Allocation: each category contributes proportionally to rent until full each cycle.
  const rentContribution = totalProfit - rentBalance; // already moved out of buckets (to rent fills released)
  const factor = totalProfit > 0 ? Math.max(0, totalProfit - RENT_CAP) / totalProfit : 0;
  // Actually: bucket_cat = cat * (totalProfit - currentRent) / totalProfit  — but currentRent depends on cycles.
  // Use: bucket_cat = max(0, cat - cat * (currentRentTarget)/totalProfit). Where currentRentTarget = rentBalance.
  const bucketShare = (cat: number) => totalProfit > 0 ? Math.max(0, cat - cat * (rentBalance / totalProfit)) - (cat * released / totalProfit) : 0;
  // Cleaner: bucket = cat * (totalProfit - rentBalance - released)/totalProfit
  const remainAfterRent = Math.max(0, totalProfit - rentBalance - released);
  const drinksBucket = totalProfit > 0 ? drinks * remainAfterRent / totalProfit : 0;
  const foodBucket = totalProfit > 0 ? food * remainAfterRent / totalProfit : 0;
  const snacksBucket = totalProfit > 0 ? snacks * remainAfterRent / totalProfit : 0;

  // Wraps sub-bucket (subset of food)
  const wrapsProfit = Math.max(0, (bySub["wrap"]?.revenue ?? 0) - (bySub["wrap"]?.cost ?? 0));
  const wrapsBucket = food > 0 ? foodBucket * (wrapsProfit / food) : 0;
  const icedProfit = Math.max(0, (bySub["iced"]?.revenue ?? 0) - (bySub["iced"]?.cost ?? 0));

  const rentPct = (rentFilled / RENT_CAP) * 100;

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-semibold">Rent Savings</h2>
          <div className="text-xs text-muted-foreground">Cap {money(RENT_CAP)} · Released {money(released)}</div>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-bold gradient-text">{money(rentFilled)}</div>
          <div className="text-sm text-muted-foreground">{rentPct.toFixed(1)}%</div>
        </div>
        <Progress value={rentPct} className="h-3" />
        <div className="text-xs text-muted-foreground mt-2">
          Each {money(RENT_CAP)} filled is released to Net Profit; remaining profit flows to category buckets below.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Drinks Money</div>
          <div className="text-2xl font-bold mt-1">{money(drinksBucket)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Lifetime profit {money(drinks)} · Expenses {money(expByCat.drink ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          {icedProfit > 0 && <div className="text-[11px] text-muted-foreground mt-2">Iced profit: {money(icedProfit)}</div>}
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Food / Wraps Money</div>
          <div className="text-2xl font-bold mt-1">{money(foodBucket)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Lifetime profit {money(food)} · Expenses {money(expByCat.food ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-success)" }} />
          {wrapsProfit > 0 && <div className="text-[11px] text-muted-foreground mt-2">Wraps bucket: {money(wrapsBucket)}</div>}
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground">Snacks Money</div>
          <div className="text-2xl font-bold mt-1">{money(snacksBucket)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Lifetime profit {money(snacks)} · Expenses {money(expByCat.snacks ?? 0)}</div>
          <div className="h-1 w-12 mt-3 rounded-full" style={{ background: "var(--gradient-accent)" }} />
        </div>
      </div>

      <div className="glass-panel-strong p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> Each day's profit from Drinks, Food and Snacks goes into the Rent Savings jar first.
        When it hits {money(RENT_CAP)} it is released to Net Profit and the jar resets. Any extra profit beyond the current rent
        target is allocated to each category's own money bucket. Expenses you log under a category are automatically deducted from that
        category's profit before it flows into the buckets.
      </div>
    </div>
  );
}
