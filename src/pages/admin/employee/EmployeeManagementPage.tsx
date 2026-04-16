import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import EmployeeTab from "./tabs/EmployeeTab";
import JobSettingsTab from "./tabs/JobSettingsTab";

type TabType = "employee" | "job";

export default function EmployeeManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("employee");

  const tabs = [
    { id: "employee" as TabType, label: "Manajemen Karyawan" },
    { id: "job" as TabType, label: "Pengaturan" },
  ];

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

      <div className="premium-card dark:border-gray-800 dark:bg-gray-900 xl:px-10 xl:py-10">

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${
                  activeTab === tab.id ? "tab-btn-active" : ""
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}

      </div>
    </div>
  );
}