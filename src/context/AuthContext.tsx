import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

interface AuthUser {
  id: string;
  email: string;
  role: string | null;
  full_name: string | null;
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
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        role,
        employee_id
      `)
      .eq("id", sessionUser.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      full_name: sessionUser.full_name,
      role: profile?.role ?? null,
      employeeId: profile?.employee_id ?? null,
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