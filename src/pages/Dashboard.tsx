import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Receipt, TrendingUp, DollarSign } from "lucide-react";
import { money } from "@/lib/format";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type Tab = "sales" | "order" | "expense";

export default function Dashboard() {
  const { ymd, startISO, endISO, date } = useDateFilter();
  const [stats, setStats] = useState({ sales: 0, orders: 0, expense: 0 });
  const [tab, setTab] = useState<Tab>("sales");
  const [chartData, setChartData] = useState<any[]>([]);

  const refresh = async () => {
    const [{ data: orders }, { data: items }, { data: exp }] = await Promise.all([
      supabase.from("orders").select("id,total,created_at").gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("order_items").select("price,quantity,created_at,product_name").gte("created_at", startISO).lte("created_at", endISO),
      supabase.from("expenses").select("total,purchase_date").eq("purchase_date", ymd),
    ]);
    const sales = (orders ?? []).reduce((s, o: any) => s + Number(o.total), 0);
    const expense = (exp ?? []).reduce((s, e: any) => s + Number(e.total), 0);
    setStats({ sales, orders: orders?.length ?? 0, expense });

    if (tab === "sales") {
      const buckets: Record<string, number> = {};
      (items ?? []).forEach((it: any) => {
        const h = new Date(it.created_at).getHours() + ":00";
        buckets[h] = (buckets[h] ?? 0) + Number(it.price) * Number(it.quantity);
      });
      setChartData(Object.entries(buckets).map(([t, v]) => ({ t, v })));
    } else if (tab === "order") {
      const buckets: Record<string, number> = {};
      (orders ?? []).forEach((o: any) => {
        const h = new Date(o.created_at).getHours() + ":00";
        buckets[h] = (buckets[h] ?? 0) + 1;
      });
      setChartData(Object.entries(buckets).map(([t, v]) => ({ t, v })));
    } else {
      const buckets: Record<string, number> = {};
      (exp ?? []).forEach((e: any) => {
        buckets[date.toLocaleDateString()] = (buckets[date.toLocaleDateString()] ?? 0) + Number(e.total);
      });
      setChartData(Object.entries(buckets).map(([t, v]) => ({ t, v })));
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [tab, ymd]);

  useEffect(() => {
    const ch = supabase.channel("dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [tab, ymd]);

  const stat = [
    { label: "Today's Sales", value: money(stats.sales), icon: DollarSign, gradient: "var(--gradient-primary)" },
    { label: "Today's Orders", value: stats.orders, icon: ShoppingCart, gradient: "var(--gradient-accent)" },
    { label: "Today's Expense", value: money(stats.expense), icon: Receipt, gradient: "var(--gradient-warning)" },
  ];

  const emptyMsg = tab === "sales" ? "NO SALES TODAY" : tab === "order" ? "NO ORDERS TODAY" : "NO EXPENSE TODAY";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">Live overview of today's activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stat.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="text-3xl font-bold mt-1">{s.value}</div>
              </div>
              <div className="h-14 w-14 rounded-2xl grid place-items-center" style={{ background: s.gradient }}>
                <s.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel-strong p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {(["sales", "order", "expense"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                tab === t ? "text-white shadow-lg" : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
              style={tab === t ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 grid place-items-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" />
              <div className="text-xl font-bold text-muted-foreground tracking-wider">{emptyMsg}</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {tab === "sales" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--accent))" }} />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="v" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
