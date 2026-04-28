import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Store, Receipt,
  TrendingUp, Users, Target, ChevronDown, Trophy, AlertTriangle, XOctagon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/product", label: "Product", icon: Package },
  { to: "/order", label: "Order", icon: ShoppingCart },
];
const storeChildren = [
  { to: "/store/due", label: "Due to Expiry", icon: AlertTriangle },
  { to: "/store/expired", label: "Expired Materials", icon: XOctagon },
];
const tail = [
  { to: "/expense", label: "Expense", icon: Receipt },
  { to: "/sales", label: "Sales", icon: TrendingUp },
  { to: "/report", label: "Report", icon: TrendingUp },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/goal", label: "Goal", icon: Target },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [storeOpen, setStoreOpen] = useState(pathname.startsWith("/store"));

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? "text-white shadow-lg"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;
  const activeStyle = (isActive: boolean) =>
    isActive ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : undefined;

  const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username : "";

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sidebar-accent-foreground text-sm leading-tight">The Anfield</div>
            <div className="font-bold gradient-text text-sm leading-tight">Stand</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-sidebar-border flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full p-[3px]" style={{ background: "var(--gradient-primary)" }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="h-full w-full rounded-full bg-sidebar grid place-items-center text-2xl font-bold gradient-text">
              {profile?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
        </div>
        <div className="mt-3 font-semibold text-sidebar-accent-foreground text-sm">{fullName}</div>
        <div className="text-xs text-sidebar-foreground">@{profile?.username}</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkCls} style={({ isActive }) => activeStyle(isActive) as any}>
            <l.icon className="h-4 w-4" />
            {l.label}
          </NavLink>
        ))}

        {/* Store with dropdown */}
        <div>
          <NavLink
            to="/sales"
            className={linkCls}
            style={({ isActive }) => activeStyle(pathname === "/sales" && isActive) as any}
          >
            <Store className="h-4 w-4" />
            <span className="flex-1 text-left">Store</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStoreOpen(!storeOpen); }}
              className="p-0.5 rounded hover:bg-sidebar-accent"
              aria-label="Toggle store submenu"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${storeOpen ? "rotate-180" : ""}`} />
            </button>
          </NavLink>
          {storeOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3 animate-fade-in">
              {storeChildren.map((c) => (
                <NavLink key={c.to} to={c.to} className={linkCls} style={({ isActive }) => activeStyle(isActive) as any}>
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {tail.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkCls} style={({ isActive }) => activeStyle(isActive) as any}>
            <l.icon className="h-4 w-4" />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
