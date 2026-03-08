import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: Props) {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (!allowedRoles.includes(role ?? "")) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}