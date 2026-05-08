import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Sales() {
  const { ymd, startISO, endISO, date } = useDateFilter();
  const [items, setItems] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [orders, setOrders] = useState<Record<string, any>>({});

  const load = async () => {
    const [{ data: it }, { data: ex }, { data: ords }] = await Promise.all([
      supabase.from("order_items").select("*").gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("expenses").select("*").eq("purchase_date", ymd),
      supabase.from("orders").select("*").gte("created_at", startISO).lte("created_at", endISO),
    ]);
    setItems(it ?? []);
    setExpenses(ex ?? []);
    const map: Record<string, any> = {};
    (ords ?? []).forEach((o: any) => { map[o.id] = o; });
    setOrders(map);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("sales-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [ymd]);

  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const totalCost = items.reduce((s, i) => s + Number(i.cost ?? 0) * Number(i.quantity), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.total), 0);
  const totalDiscount = Object.values(orders).reduce((s: number, o: any) => s + Number(o?.discount ?? 0), 0);
  const grossProfit = total - totalCost;
  const netProfit = grossProfit - totalExpense - totalDiscount;

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.category] = (m[i.category] ?? 0) + Number(i.quantity); });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [items]);

  const bySub = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.subcategory] = (m[i.subcategory] ?? 0) + Number(i.quantity); });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold gradient-text">Sales — {date.toLocaleDateString()}</h1>
        <div className="flex gap-6 flex-wrap">
          <div><div className="text-xs text-muted-foreground">Revenue</div><div className="text-2xl font-bold">{money(total)}</div></div>
          <div><div className="text-xs text-muted-foreground">Cost</div><div className="text-2xl font-bold text-warning">{money(totalCost)}</div></div>
          <div><div className="text-xs text-muted-foreground">Expense</div><div className="text-2xl font-bold text-destructive">{money(totalExpense)}</div></div>
          <div><div className="text-xs text-muted-foreground">Discount</div><div className="text-2xl font-bold text-destructive">{money(totalDiscount)}</div></div>
          <div><div className="text-xs text-muted-foreground">Gross Profit</div><div className="text-2xl font-bold">{money(grossProfit)}</div></div>
          <div><div className="text-xs text-muted-foreground">Net Profit</div><div className="text-2xl font-bold text-success">{money(netProfit)}</div></div>
        </div>
      </div>

      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Price</th><th className="p-3">Profit/unit</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Time</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No sales today</td></tr> :
              items.map((i) => {
                const pm = orders[i.order_id]?.payment_method ?? "-";
                return (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{i.product_name}</td>
                  <td className="p-3">{i.quantity}</td>
                  <td className="p-3">{money(i.price)}</td>
                  <td className="p-3 text-success">{money(Number(i.price) - Number(i.cost ?? 0))}</td>
                  <td className="p-3 font-semibold">{money(Number(i.price) * Number(i.quantity))}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full text-xs capitalize bg-primary/15 text-primary border border-primary/30">{pm}</span></td>
                  <td className="p-3">{new Date(i.created_at).toLocaleTimeString()}</td>
                </tr>
              );})}
          </tbody>
        </table>
      </div>

      {expenses.length > 0 && (
        <div className="glass-panel-strong p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">Today's Expenses</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="p-3">Reason</th><th className="p-3">Qty</th><th className="p-3">Amount</th><th className="p-3">Total</th>
            </tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{e.reason}</td>
                  <td className="p-3">{e.quantity}</td>
                  <td className="p-3">{money(e.amount)}</td>
                  <td className="p-3 font-semibold text-destructive">-{money(e.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel-strong p-6">
          <h2 className="font-semibold mb-3">By Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel-strong p-6">
          <h2 className="font-semibold mb-3">By Subcategory</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bySub}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
