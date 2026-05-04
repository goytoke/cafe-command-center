import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = {
  date: Date;
  setDate: (d: Date) => void;
  ymd: string;
  startISO: string;
  endISO: string;
};

const DateFilterContext = createContext<Ctx | null>(null);

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [date, setDateState] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  const setDate = (d: Date) => {
    const nd = new Date(d); nd.setHours(0, 0, 0, 0);
    setDateState(nd);
  };

  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);

  return (
    <DateFilterContext.Provider value={{
      date,
      setDate,
      ymd: toYMD(date),
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export const useDateFilter = () => {
  const ctx = useContext(DateFilterContext);
  if (!ctx) throw new Error("useDateFilter must be used within DateFilterProvider");
  return ctx;
};
