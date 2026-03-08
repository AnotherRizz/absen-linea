import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import LeaveRequestsTab from "./tabs/LeaveRequestsTab";
import LeaveQuotaTab from "./tabs/LeaveQuotaTab";
import LeaveTypesTab from "./tabs/LeaveTypesTab";


export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState("requests");


  const tabs = [
    { id: "requests", label: "Pengajuan Izin/Cuti" },
    { id: "quota", label: "Kuota Karyawan" },
    { id: "types", label: "Jenis Cuti" },
  ];

  return (
    <div>
      <PageMeta title="Manajemen Izin & Cuti" description="Manajemen Izin & Cuti " />
      <PageBreadcrumb pageTitle="Manajemen Izin & Cuti" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Render */}
        {activeTab === "requests" && <LeaveRequestsTab />}
        {activeTab === "quota" && <LeaveQuotaTab />}
        {activeTab === "types" && <LeaveTypesTab />}

      </div>
    </div>
  );
}