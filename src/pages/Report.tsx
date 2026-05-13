import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Download } from "lucide-react";

type Tab = "sales" | "expense" | "orders";

export default function Report() {
  const { ymd, startISO, endISO, date } = useDateFilter();
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [exp, setExp] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("sales");

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("*").gte("created_at", startISO).lte("created_at", endISO).order("created_at", { ascending: false }),
      supabase.from("order_items").select("*").gte("created_at", startISO).lte("created_at", endISO).order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").eq("purchase_date", ymd).order("created_at", { ascending: false }),
    ]).then(([{ data: o }, { data: it }, { data: e }]) => {
      setOrders(o ?? []); setItems(it ?? []); setExp(e ?? []);
    });
  }, [ymd, startISO, endISO]);

  const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalExpense = exp.reduce((s, e) => s + Number(e.total), 0);
  const netProfit = totalSales - totalExpense;

  const exportCSV = () => {
    const rows: string[][] = [["type", "label", "quantity", "amount", "date"]];
    if (tab === "sales") items.forEach((i) => rows.push(["sale", i.product_name, i.quantity, String(Number(i.price) * Number(i.quantity)), i.created_at]));
    else if (tab === "expense") exp.forEach((e) => rows.push(["expense", e.reason, e.quantity, e.total, e.purchase_date]));
    else orders.forEach((o) => rows.push(["order", o.payment_method, "1", o.total, o.created_at]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${tab}-report.csv`; a.click();
  };

  const stats = [
    { label: "Total Sales", value: money(totalSales), gradient: "var(--gradient-primary)" },
    { label: "Total Expense", value: money(totalExpense), gradient: "var(--gradient-warning)" },
    { label: "Net Profit", value: money(netProfit), gradient: "var(--gradient-success)" },
    { label: "Total Orders", value: orders.length, gradient: "var(--gradient-accent)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold gradient-text">Reports — {date.toLocaleDateString()}</h1>
        <Button onClick={exportCSV} variant="outline"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
            <div className="h-1 w-12 mt-3 rounded-full" style={{ background: s.gradient }} />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["sales", "expense", "orders"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl capitalize text-sm font-medium ${tab === t ? "text-white" : "bg-muted/50 hover:bg-muted"}`}
            style={tab === t ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}>{t}</button>
        ))}
      </div>

      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          {tab === "sales" && (<>
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3">Time</th><th className="p-3">Item</th><th className="p-3">Qty</th><th className="p-3">Total</th></tr></thead>
            <tbody>{items.length === 0 ? <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No sales</td></tr> : items.map((i) => (
              <tr key={i.id} className="border-b border-border/50"><td className="p-3">{new Date(i.created_at).toLocaleString()}</td><td className="p-3">{i.product_name}</td><td className="p-3">{i.quantity}</td><td className="p-3 font-semibold">{money(Number(i.price) * Number(i.quantity))}</td></tr>
            ))}</tbody>
          </>)}
          {tab === "expense" && (<>
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3">Date</th><th className="p-3">Reason</th><th className="p-3">Category</th><th className="p-3">Qty</th><th className="p-3">Total</th></tr></thead>
            <tbody>{exp.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No expenses</td></tr> : exp.map((e) => (
              <tr key={e.id} className="border-b border-border/50"><td className="p-3">{e.purchase_date}</td><td className="p-3">{e.reason}</td><td className="p-3 capitalize text-muted-foreground">{e.category ?? "—"}</td><td className="p-3">{e.quantity}</td><td className="p-3 font-semibold">{money(e.total)}</td></tr>
            ))}</tbody>
          </>)}
          {tab === "orders" && (<>
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3">Time</th><th className="p-3">Payment</th><th className="p-3">Total</th></tr></thead>
            <tbody>{orders.length === 0 ? <tr><td colSpan={3} className="p-12 text-center text-muted-foreground">No orders</td></tr> : orders.map((o) => (
              <tr key={o.id} className="border-b border-border/50"><td className="p-3">{new Date(o.created_at).toLocaleString()}</td><td className="p-3">{o.payment_method}</td><td className="p-3 font-semibold">{money(o.total)}</td></tr>
            ))}</tbody>
          </>)}
        </table>
      </div>

      {tab === "sales" && <BreakdownPanels items={items} exp={exp} />}
    </div>
  );
}

function BreakdownPanels({ items, exp }: { items: any[]; exp: any[] }) {
  const bySub: Record<string, { category: string; qty: number; revenue: number; cost: number }> = {};
  const byCat: Record<string, { qty: number; revenue: number; cost: number }> = {};
  items.forEach((i) => {
    const s = i.subcategory || "—";
    const c = i.category || "—";
    const rev = Number(i.price) * Number(i.quantity);
    const cost = Number(i.cost ?? 0) * Number(i.quantity);
    if (!bySub[s]) bySub[s] = { category: c, qty: 0, revenue: 0, cost: 0 };
    bySub[s].qty += Number(i.quantity); bySub[s].revenue += rev; bySub[s].cost += cost;
    if (!byCat[c]) byCat[c] = { qty: 0, revenue: 0, cost: 0 };
    byCat[c].qty += Number(i.quantity); byCat[c].revenue += rev; byCat[c].cost += cost;
  });
  const expByCat: Record<string, number> = {};
  exp.forEach((e) => { const k = e.category || "general"; expByCat[k] = (expByCat[k] ?? 0) + Number(e.total); });

  return (
    <>
      <div className="glass-panel-strong p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Breakdown by Subcategory</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Subcategory</th><th className="p-3">Category</th><th className="p-3">Sold</th><th className="p-3">Revenue</th><th className="p-3">Cost</th><th className="p-3">Profit</th>
          </tr></thead>
          <tbody>
            {Object.keys(bySub).length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No data</td></tr> :
              Object.entries(bySub).map(([n, v]) => (
                <tr key={n} className="border-b border-border/50">
                  <td className="p-3 font-medium capitalize">{n}</td>
                  <td className="p-3 capitalize text-muted-foreground">{v.category}</td>
                  <td className="p-3">{v.qty}</td>
                  <td className="p-3">{money(v.revenue)}</td>
                  <td className="p-3 text-warning">{money(v.cost)}</td>
                  <td className="p-3 font-semibold text-success">{money(v.revenue - v.cost)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="glass-panel-strong p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Breakdown by Category (with Expenses)</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Category</th><th className="p-3">Sold</th><th className="p-3">Revenue</th><th className="p-3">Cost</th><th className="p-3">Gross Profit</th><th className="p-3">Expense</th><th className="p-3">Net Profit</th>
          </tr></thead>
          <tbody>
            {Object.keys(byCat).length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No data</td></tr> :
              Object.entries(byCat).map(([n, v]) => {
                const e = expByCat[n] ?? 0; const g = v.revenue - v.cost;
                return (
                  <tr key={n} className="border-b border-border/50">
                    <td className="p-3 font-medium capitalize">{n}</td>
                    <td className="p-3">{v.qty}</td>
                    <td className="p-3">{money(v.revenue)}</td>
                    <td className="p-3 text-warning">{money(v.cost)}</td>
                    <td className="p-3">{money(g)}</td>
                    <td className="p-3 text-destructive">{money(e)}</td>
                    <td className="p-3 font-semibold text-success">{money(g - e)}</td>
                  </tr>
                );
              })}
            {expByCat.general ? (
              <tr className="border-b border-border/50">
                <td className="p-3 font-medium text-muted-foreground">General (uncategorized)</td>
                <td className="p-3">—</td><td className="p-3">—</td><td className="p-3">—</td><td className="p-3">—</td>
                <td className="p-3 text-destructive">{money(expByCat.general)}</td>
                <td className="p-3 font-semibold text-destructive">−{money(expByCat.general)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
