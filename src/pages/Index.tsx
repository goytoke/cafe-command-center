import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "./Auth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Auth />;
};

export default Index;
