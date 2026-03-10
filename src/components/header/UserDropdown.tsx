import { useEffect, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("-");
  const [fullName, setFullName] = useState<string>("User");

  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    const fetchEmployee = async () => {

      /* ambil auth user */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserEmail(user.email ?? "-");

      /* ambil profile */
      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .single();

      if (!profile?.employee_id) return;

      /* ambil employee */
      const { data: employee } = await supabase
        .from("employees")
        .select("full_name")
        .eq("id", profile.employee_id)
        .single();

      if (employee) {
        setFullName(employee.full_name);
      }
    };

    fetchEmployee();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <img src="/images/brand/logo.png" alt="User" />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {fullName}
        </span>

        <svg
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border bg-white p-3 shadow-lg"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm">
            {fullName}
          </span>

          <span className="mt-0.5 block text-theme-xs text-gray-500">
            {userEmail}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Edit Profile
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Account Settings
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-3 rounded-lg hover:bg-gray-100"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}