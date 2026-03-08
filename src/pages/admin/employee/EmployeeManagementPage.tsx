import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import EmployeeTab from "./tabs/EmployeeTab";
import JobSettingsTab from "./tabs/JobSettingsTab";

type TabType = "employee" | "job";

export default function EmployeeManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("employee");

  const renderContent = () => {
    switch (activeTab) {
      case "employee":
        return <EmployeeTab />;

      case "job":
        return <JobSettingsTab />;

      default:
        return null;
    }
  };

  return (
    <div>
      <PageMeta
        title="Manajemen Karyawan | HRIS"
        description="Manajemen Karyawan and job configuration page"
      />

      <PageBreadcrumb pageTitle="Manajemen Karyawan" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 xl:px-10 xl:py-12">

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">

            <button
              onClick={() => setActiveTab("employee")}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === "employee"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
Manajemen Karyawan            </button>

            <button
              onClick={() => setActiveTab("job")}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === "job"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pengaturan
            </button>

          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}

      </div>
    </div>
  );
}