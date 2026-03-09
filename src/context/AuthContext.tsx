import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

interface AuthUser {
  id: string;
  email: string;
  role: string | null;
  employeeId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      initAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  const initAuth = async () => {
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;

    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fullUser = await buildUser(sessionUser);

    setUser(fullUser);
    setLoading(false);
  };

  const buildUser = async (sessionUser: any): Promise<AuthUser> => {
    // ambil role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sessionUser.id)
      .single();

    // ambil employee
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", sessionUser.id)
      .maybeSingle();

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      role: profile?.role ?? null,
      employeeId: employee?.id ?? null,
    };
  };

  const refreshUser = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};