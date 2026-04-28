import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Bell, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EditProfileDialog from "@/components/EditProfileDialog";

export default function Header() {
  const nav = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setNotifs(data ?? []));
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/70 backdrop-blur-xl flex items-center px-4 md:px-6 gap-3">
      <div className="flex-1 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-10 bg-muted/50 border-border/60" />
      </div>

      <div className="flex items-center gap-2">
        {/* Calendar */}
        <Popover>
          <PopoverTrigger className="h-10 w-10 rounded-xl grid place-items-center bg-muted/50 hover:bg-muted transition">
            <Calendar className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0 glass-panel-strong">
            <CalendarUI mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger className="relative h-10 w-10 rounded-xl grid place-items-center bg-muted/50 hover:bg-muted transition">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold grid place-items-center text-white"
                style={{ background: "var(--gradient-primary)" }}>
                {unread}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 glass-panel-strong p-0">
            <div className="p-3 border-b border-border font-semibold">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
              ) : (
                notifs.map((n) => (
                  <div key={n.id} className="p-3 border-b border-border/50 hover:bg-muted/40">
                    <div className="font-medium text-sm">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User */}
        <Popover>
          <PopoverTrigger className="h-10 w-10 rounded-xl grid place-items-center overflow-hidden bg-muted/50 hover:bg-muted transition">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 glass-panel-strong p-2">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
            >
              Edit profile
            </button>
            <button
              onClick={async () => { await signOut(); nav("/"); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
            >
              Switch account
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </header>
  );
}
