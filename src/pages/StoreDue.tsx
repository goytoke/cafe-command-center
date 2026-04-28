import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { prettyToast } from "@/components/PrettyToast";

export default function StoreDue() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("store_items").select("*").not("expiry_date", "is", null).order("expiry_date");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    setItems((data ?? []).filter((i) => new Date(i.expiry_date) >= today));
  };
  useEffect(() => { load(); }, []);

  const withDays = items.map((i) => {
    const d = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86400000);
    return { ...i, days_left: d };
  });

  const chart = useMemo(() => {
    const buckets = { "≤3 days": 0, "≤1 week": 0, "≤1 month": 0, ">1 month": 0 };
    withDays.forEach((i) => {
      if (i.days_left <= 3) buckets["≤3 days"]++;
      else if (i.days_left <= 7) buckets["≤1 week"]++;
      else if (i.days_left <= 30) buckets["≤1 month"]++;
      else buckets[">1 month"]++;
    });
    return Object.entries(buckets).map(([k, v]) => ({ name: k, count: v }));
  }, [withDays]);

  const del = async (id: string) => { await supabase.from("store_items").delete().eq("id", id); prettyToast.success("Item deleted"); load(); };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Due to Expiry</h1>

      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Expiry</th><th className="p-3">Days Left</th><th className="p-3">Action</th>
          </tr></thead>
          <tbody>
            {withDays.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Nothing nearing expiry</td></tr> :
              withDays.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3">{i.quantity} {i.unit}</td>
                  <td className="p-3">{i.expiry_date}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${i.days_left <= 3 ? "bg-destructive/20 text-destructive" : i.days_left <= 7 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}>{i.days_left} days</span></td>
                  <td className="p-3"><div className="flex gap-2">
                    <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-accent"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(i.id)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel-strong p-6">
        <h2 className="font-semibold mb-4">Items by time-to-expiry</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
