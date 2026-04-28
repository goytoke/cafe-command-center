import { toast } from "sonner";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const base = "min-w-[320px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl px-5 py-4 flex items-center gap-3 animate-scale-in";

export const prettyToast = {
  success: (title: string, description?: string) =>
    toast.custom(() => (
      <div className={base} style={{ boxShadow: "0 20px 60px -10px hsl(152 76% 50% / 0.4)" }}>
        <div className="h-10 w-10 rounded-full grid place-items-center" style={{ background: "var(--gradient-success)" }}>
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-foreground">{title}</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
    ), { duration: 3000, position: "top-center" }),
  error: (title: string, description?: string) =>
    toast.custom(() => (
      <div className={base} style={{ boxShadow: "0 20px 60px -10px hsl(0 84% 62% / 0.4)" }}>
        <div className="h-10 w-10 rounded-full grid place-items-center bg-destructive">
          <XCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-foreground">{title}</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
    ), { duration: 4000, position: "top-center" }),
  info: (title: string, description?: string) =>
    toast.custom(() => (
      <div className={base}>
        <div className="h-10 w-10 rounded-full grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
          <Info className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-foreground">{title}</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
    ), { duration: 3000, position: "top-center" }),
};
