import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Star, Upload, Users, Settings, Pencil, Trash2, Phone } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";

type Staff = {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  rating: number;
  phone?: string | null;
  photo_url: string | null;
};

const empty = { name: "", description: "", department: "", phone: "", rating: 5 };

export default function StaffPage() {
  const [list, setList] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    setList((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(empty); setPhoto(null); setPreview(null); setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name ?? "",
      description: s.description ?? "",
      department: s.department ?? "",
      phone: s.phone ?? "",
      rating: s.rating ?? 5,
    });
    setPhoto(null);
    setPreview(s.photo_url ?? null);
    setOpen(true);
  };

  const save = async () => {
    let photo_url: string | null = editing?.photo_url ?? null;
    if (photo) {
      const path = `staff/${Date.now()}-${photo.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, photo);
      if (!error) photo_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    if (editing) {
      await supabase.from("staff").update({ ...form, photo_url }).eq("id", editing.id);
      prettyToast.success("Updated", `"${form.name}" saved`);
    } else {
      await supabase.from("staff").insert({ ...form, photo_url });
      prettyToast.success(`"${form.name}" added`, "Staff added successfully");
    }
    setOpen(false);
    setForm(empty); setPhoto(null); setPreview(null); setEditing(null);
    load();
  };

  const remove = async (s: Staff) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    await supabase.from("staff").delete().eq("id", s.id);
    prettyToast.success("Removed", `${s.name} deleted`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold gradient-text">Staff</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setManageOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />Manage Staff
          </Button>
          <Button onClick={openAdd} style={{ background: "var(--gradient-primary)" }} className="btn-glow">
            <Plus className="h-4 w-4 mr-2" />Add Staff
          </Button>
        </div>
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
              {s.phone && <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Phone className="h-3 w-3" />{s.phone}</div>}
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

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel-strong max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">{editing ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer hover:bg-muted/40">
              {preview ? <img src={preview} alt="" className="h-12 w-12 rounded-full object-cover" /> : <Upload className="h-5 w-5" />}
              <span className="text-sm text-muted-foreground">{photo?.name ?? (preview ? "Change photo" : "Attach photo")}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; setPhoto(f); if (f) setPreview(URL.createObjectURL(f)); }} />
            </label>
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Rating (1–5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} style={{ background: "var(--gradient-primary)" }}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage panel */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="glass-panel-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="gradient-text text-2xl">Manage Staff</DialogTitle></DialogHeader>
          {list.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No staff yet.</div>
          ) : (
            <div className="space-y-2">
              {list.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40">
                  <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 bg-muted grid place-items-center">
                    {s.photo_url ? <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" /> : <span className="font-bold">{s.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.department}{s.phone ? ` • ${s.phone}` : ""}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setManageOpen(false); openEdit(s); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
