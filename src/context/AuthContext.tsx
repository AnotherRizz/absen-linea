import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

interface AuthContextType {
  user: any;
  role: string | null;
  employeeId: string | null;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  employeeId: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    getSession();
  }, []);

 const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  const currentUser = data.session?.user;

  if (!currentUser) {
    setLoading(false);
    return;
  }

  setUser(currentUser);

  // Ambil role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  setRole(profile?.role ?? null);

  // Ambil employeeId
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", currentUser.id)
    .maybeSingle();

  setEmployeeId(employee?.id ?? null);

  setLoading(false);
};

  return (
 <AuthContext.Provider value={{ user, role, employeeId, loading }}>
  {children}
</AuthContext.Provider>
  );
};