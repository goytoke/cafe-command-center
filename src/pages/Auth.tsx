import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prettyToast } from "@/components/PrettyToast";
import { Loader2, Trophy, Upload } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // login
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  // register
  const [r, setR] = useState({ first_name: "", last_name: "", username: "", phone: "", password: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: emailData, error: rpcErr } = await supabase.rpc("get_email_by_username", { _username: u });
    if (rpcErr || !emailData) {
      setLoading(false);
      prettyToast.error("Login failed", "Username not found");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: emailData as string, password: p });
    setLoading(false);
    if (error) {
      prettyToast.error("Login failed", error.message);
      return;
    }
    prettyToast.success("Welcome back!", `Logged in as ${u}`);
    nav("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = `${r.username.toLowerCase().replace(/[^a-z0-9]/g, "")}@anfield.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: r.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error || !data.user) {
      setLoading(false);
      prettyToast.error("Registration failed", error?.message);
      return;
    }
    let avatar_url: string | null = null;
    if (avatar) {
      const path = `${data.user.id}/${Date.now()}-${avatar.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatar);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = pub.publicUrl;
      }
    }
    await supabase.from("profiles").insert({
      id: data.user.id,
      first_name: r.first_name,
      last_name: r.last_name,
      username: r.username,
      phone: r.phone,
      avatar_url,
    });
    setLoading(false);
    prettyToast.success("Registered successfully", "You can now log in");
    setMode("login");
    setU(r.username);
    setP("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass-panel-strong p-8 md:p-10 animate-scale-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">The Anfield Stand</h1>
        </div>
        <p className="text-center text-muted-foreground mb-8">
          {mode === "login" ? "Welcome back — please sign in" : "Create your account"}
        </p>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={u} onChange={(e) => setU(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={p} onChange={(e) => setP(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-glow" style={{ background: "var(--gradient-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-accent hover:underline font-medium">
                Register
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={r.first_name} onChange={(e) => setR({ ...r, first_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={r.last_name} onChange={(e) => setR({ ...r, last_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={r.username} onChange={(e) => setR({ ...r, username: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Password</Label>
                <Input type="password" minLength={6} value={r.password} onChange={(e) => setR({ ...r, password: e.target.value })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Profile picture</Label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/40 cursor-pointer hover:bg-muted/60 transition">
                  {preview ? (
                    <img src={preview} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted grid place-items-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">{avatar?.name ?? "Click to attach a profile picture"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setAvatar(f);
                      if (f) setPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-glow" style={{ background: "var(--gradient-primary)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-accent hover:underline font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
