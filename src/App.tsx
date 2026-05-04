import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DateFilterProvider } from "@/contexts/DateFilterContext";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Product from "./pages/Product";
import Order from "./pages/Order";
import Store from "./pages/Store";
import StoreDue from "./pages/StoreDue";
import StoreExpired from "./pages/StoreExpired";
import Expense from "./pages/Expense";
import Sales from "./pages/Sales";
import Report from "./pages/Report";
import Staff from "./pages/Staff";
import Goal from "./pages/Goal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
         <DateFilterProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/product" element={<Product />} />
              <Route path="/order" element={<Order />} />
              <Route path="/store" element={<Store />} />
              <Route path="/store/due" element={<StoreDue />} />
              <Route path="/store/expired" element={<StoreExpired />} />
              <Route path="/expense" element={<Expense />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/report" element={<Report />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/goal" element={<Goal />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
         </DateFilterProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
