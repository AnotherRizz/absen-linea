import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import DailyAttendanceTab from "./tabs/DailyAttendanceTab";
import ReportAttendanceTab from "./tabs/ReportAttendanceTab";

type TabType = "daily" | "report";

export default function AttendanceManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");

  const renderContent = () => {
    switch (activeTab) {
      case "daily":
        return <DailyAttendanceTab />;

      case "report":
        return <ReportAttendanceTab />;

      default:
        return null;
    }
  };

  return (
    <div>
      <PageMeta
        title="Manajemen Absensi | HRIS"
        description="Attendance management page"
      />

      <PageBreadcrumb pageTitle="Manajemen Absensi" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 xl:px-10 xl:py-12">

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">

            <button
              onClick={() => setActiveTab("daily")}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === "daily"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Absensi Harian
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === "report"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Report Absensi
            </button>

          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}

      </div>
    </div>
  );
}