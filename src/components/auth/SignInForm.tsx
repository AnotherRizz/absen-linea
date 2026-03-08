import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg("");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setErrorMsg(error.message);
    setLoading(false);
    return;
  }

  // ambil session setelah login
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    setErrorMsg("Session tidak ditemukan");
    setLoading(false);
    return;
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    setErrorMsg("Role user tidak ditemukan");
    setLoading(false);
    return;
  }

  if (profile.role === "employee") {
    navigate("/employee", { replace: true });
  } else {
    navigate("/dashboard-admin", { replace: true });
  }

  setLoading(false);
};

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="border border-slate-200 px-5 py-10 rounded-2xl">
          <div className="mb-5 sm:mb-8">
            <img
              src="/images/brand/linea.png"
              className="w-2/3 mx-auto"
              alt="Logo"
            />
          </div>

          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              {/* EMAIL */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {errorMsg && (
                <div className="text-sm text-red-500">{errorMsg}</div>
              )}

              {/* BUTTON */}
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={loading}>
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
