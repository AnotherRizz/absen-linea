import DivisionTable from "./DivisionTable";
import PositionTable from "./PositionTable";
import EmploymentTypeTable from "./EmploymentTypeTable";

export default function JobSettingsTab() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="premium-card premium-card-hover dark:border-gray-800 dark:bg-gray-800/40">
        <DivisionTable />
      </div>
      <div className="premium-card premium-card-hover dark:border-gray-800 dark:bg-gray-800/40">
        <EmploymentTypeTable />
      </div>
      <div className="premium-card premium-card-hover dark:border-gray-800 dark:bg-gray-800/40">
        <PositionTable />
      </div>
    </div>
  );
}
