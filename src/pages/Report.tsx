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
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3">Date</th><th className="p-3">Reason</th><th className="p-3">Qty</th><th className="p-3">Total</th></tr></thead>
            <tbody>{exp.length === 0 ? <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No expenses</td></tr> : exp.map((e) => (
              <tr key={e.id} className="border-b border-border/50"><td className="p-3">{e.purchase_date}</td><td className="p-3">{e.reason}</td><td className="p-3">{e.quantity}</td><td className="p-3 font-semibold">{money(e.total)}</td></tr>
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
    </div>
  );
}
