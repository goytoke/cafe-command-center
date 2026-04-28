import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, startOfTodayISO } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Sales() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("order_items").select("*").gte("created_at", startOfTodayISO()).then(({ data }) => setItems(data ?? []));
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

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
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold gradient-text">Today's Sales</h1>
        <div className="text-2xl font-bold">{money(total)}</div>
      </div>

      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Price</th><th className="p-3">Total</th><th className="p-3">Time</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No sales today</td></tr> :
              items.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{i.product_name}</td>
                  <td className="p-3">{i.quantity}</td>
                  <td className="p-3">{money(i.price)}</td>
                  <td className="p-3 font-semibold">{money(Number(i.price) * Number(i.quantity))}</td>
                  <td className="p-3">{new Date(i.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

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
