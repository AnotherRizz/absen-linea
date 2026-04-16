import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";

import DailyAttendanceTab from "./tabs/DailyAttendanceTab";
import ReportAttendanceTab from "./tabs/ReportAttendanceTab";
import CalendarAttendanceTab from "./tabs/CalendarAttendanceTab";

type TabType = "daily" | "report" | "calendar";

export default function AttendanceManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");

  const tabs = [
    { id: "daily" as TabType, label: "Absensi Harian" },
    { id: "report" as TabType, label: "Report Absensi" },
    { id: "calendar" as TabType, label: "Kalender Absensi" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "daily":
        return <DailyAttendanceTab />;
      case "report":
        return <ReportAttendanceTab />;
      case "calendar":
        return <CalendarAttendanceTab />;
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
