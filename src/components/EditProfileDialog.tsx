import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { prettyToast } from "@/components/PrettyToast";
import { Upload } from "lucide-react";

export default function EditProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { profile, user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", phone: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        username: profile.username,
        phone: profile.phone ?? "",
      });
      setPreview(profile.avatar_url);
      setAvatar(null);
    }
  }, [profile, open]);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    let avatar_url = profile?.avatar_url ?? null;
    if (avatar) {
      const path = `${user.id}/${Date.now()}-${avatar.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, avatar);
      if (!error) avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("profiles").update({ ...form, avatar_url }).eq("id", user.id);
    setLoading(false);
    if (error) return prettyToast.error("Update failed", error.message);
    await refreshProfile();
    prettyToast.success("Updated successfully", "Your profile is up to date");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="gradient-text text-2xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex items-center gap-4">
            <label className="cursor-pointer">
              <div className="h-16 w-16 rounded-full p-[2px]" style={{ background: "var(--gradient-primary)" }}>
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-muted grid place-items-center">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setAvatar(f); if (f) setPreview(URL.createObjectURL(f));
              }} />
            </label>
            <span className="text-sm text-muted-foreground">Click avatar to change</span>
          </div>
          <div className="space-y-2"><Label>First name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Last name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={submit} disabled={loading} style={{ background: "var(--gradient-primary)" }}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
