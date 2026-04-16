import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import LeaveRequestsTab from "./tabs/LeaveRequestsTab";
import LeaveQuotaTab from "./tabs/LeaveQuotaTab";
import LeaveTypesTab from "./tabs/LeaveTypesTab";

type TabType = "requests" | "quota" | "types";

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");

  const tabs = [
    { id: "requests" as TabType, label: "Pengajuan Cuti" },
    { id: "quota" as TabType, label: "Kuota Cuti" },
    { id: "types" as TabType, label: "Jenis Cuti" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return <LeaveRequestsTab />;
      case "quota":
        return <LeaveQuotaTab />;
      case "types":
        return <LeaveTypesTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PageMeta
        title="Manajemen Izin & Cuti | HRIS"
        description="Leave management page"
      />

      <PageBreadcrumb pageTitle="Manajemen Izin & Cuti" />

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
                }`}>
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