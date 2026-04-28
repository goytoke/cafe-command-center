import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trophy, Target as TargetIcon } from "lucide-react";
import { prettyToast } from "@/components/PrettyToast";
import { today } from "@/lib/format";

export default function Goal() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setGoals(data ?? []);
    // celebrate if yesterday all goals were completed
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const ymd = yesterday.toISOString().slice(0, 10);
    const ydays = (data ?? []).filter((g) => g.goal_date === ymd);
    if (ydays.length > 0 && ydays.every((g) => g.completed)) setCelebrate(true);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const add = async () => {
    if (!text.trim() || !user) return;
    await supabase.from("goals").insert({ user_id: user.id, title: text, goal_date: today() });
    setText(""); load();
  };

  const toggle = async (g: any) => {
    const next = !g.completed;
    await supabase.from("goals").update({ completed: next }).eq("id", g.id);
    if (next && user) {
      await supabase.from("notifications").insert({ user_id: user.id, title: "Goal completed 🎯", body: g.title });
      prettyToast.success("Goal completed!", g.title);
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">My Goals</h1>
        <p className="text-muted-foreground">Write down today's goals — get notified when you complete them</p>
      </div>

      {celebrate && (
        <div className="glass-panel-strong p-6 text-center animate-scale-in" style={{ background: "var(--gradient-success)" }}>
          <Trophy className="h-12 w-12 mx-auto text-white mb-2" />
          <div className="text-2xl font-bold text-white">Congratulations! 🎉</div>
          <div className="text-white/90">You completed all of yesterday's goals!</div>
          <Button onClick={() => setCelebrate(false)} variant="secondary" className="mt-4">Dismiss</Button>
        </div>
      )}

      <div className="glass-panel-strong p-5 flex gap-2">
        <Input placeholder="Write a new goal for today..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add} style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="glass-panel-strong p-2">
        {goals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground"><TargetIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />No goals yet</div>
        ) : goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-xl">
            <Checkbox checked={g.completed} onCheckedChange={() => toggle(g)} />
            <div className="flex-1">
              <div className={`font-medium ${g.completed ? "line-through text-muted-foreground" : ""}`}>{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.goal_date}</div>
            </div>
            {g.completed && <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">Done</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
