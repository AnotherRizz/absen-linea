import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;

  // jika belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // cek role
  if (!allowedRoles.includes(user.role ?? "")) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}