import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";

export default function StoreExpired() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("store_items").select("*").not("expiry_date", "is", null).order("expiry_date", { ascending: false }).then(({ data }) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setItems((data ?? []).filter((i) => new Date(i.expiry_date) < today));
    });
  }, []);

  const totalLost = items.reduce((s, i) => s + Number(i.quantity) * Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold gradient-text">Expired Materials</h1>
        <div className="text-sm">Total lost: <span className="font-bold text-destructive">{money(totalLost)}</span></div>
      </div>
      <div className="glass-panel-strong p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3">Item</th><th className="p-3">Quantity</th><th className="p-3">Category</th><th className="p-3">Unit Price</th><th className="p-3">Amount Lost</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No expired materials</td></tr> :
              items.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3">{i.quantity} {i.unit}</td>
                  <td className="p-3 capitalize">{i.category}</td>
                  <td className="p-3">{money(i.amount)}</td>
                  <td className="p-3 font-semibold text-destructive">{money(Number(i.quantity) * Number(i.amount))}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
