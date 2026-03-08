import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function AuthGuard({ children }: any) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/signin" replace />;

  return children;
}