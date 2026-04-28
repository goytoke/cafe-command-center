import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Star, Upload, Users } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";

export default function Staff() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", department: "", rating: 5 });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    let photo_url: string | null = null;
    if (photo) {
      const path = `staff/${Date.now()}-${photo.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, photo);
      if (!error) photo_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    await supabase.from("staff").insert({ ...form, photo_url });
    prettyToast.success(`"${form.name}" added`, "Staff added successfully");
    setOpen(false);
    setForm({ name: "", description: "", department: "", rating: 5 }); setPhoto(null); setPreview(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Staff</h1>
        <Button onClick={() => setOpen(true)} style={{ background: "var(--gradient-primary)" }} className="btn-glow"><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
      </div>

      {list.length === 0 ? (
        <div className="glass-panel-strong p-16 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-40" />No staff added yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((s) => (
            <div key={s.id} className="glass-panel-strong p-5 text-center transition hover:-translate-y-1">
              <div className="h-24 w-24 mx-auto rounded-full p-[3px]" style={{ background: "var(--gradient-primary)" }}>
                {s.photo_url ? <img src={s.photo_url} alt={s.name} className="h-full w-full rounded-full object-cover" /> :
                  <div className="h-full w-full rounded-full bg-muted grid place-items-center text-2xl font-bold gradient-text">{s.name[0]}</div>}
              </div>
              <h3 className="mt-3 font-bold">{s.name}</h3>
              <div className="text-xs text-accent">{s.department}</div>
              <p className="text-sm text-muted-foreground mt-2 min-h-[2.5rem]">{s.description}</p>
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < s.rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel-strong">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">Add Staff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer hover:bg-muted/40">
              {preview ? <img src={preview} alt="" className="h-12 w-12 rounded-full object-cover" /> : <Upload className="h-5 w-5" />}
              <span className="text-sm text-muted-foreground">{photo?.name ?? "Attach photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; setPhoto(f); if (f) setPreview(URL.createObjectURL(f)); }} />
            </label>
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Rating (1–5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} style={{ background: "var(--gradient-primary)" }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
