import DivisionTable from "./DivisionTable";
import PositionTable from "./PositionTable";
import EmploymentTypeTable from "./EmploymentTypeTable";

export default function JobSettingsTab() {
  return (
    <div className="space-y-5 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className=" bg-white p-7 rounded-lg border border-slate-300">
        <DivisionTable />
      </div>
        <div className=" bg-white p-7 rounded-lg border border-slate-300">
        <EmploymentTypeTable />
      </div>
      <div className=" bg-white p-7 rounded-lg border border-slate-300">
        <PositionTable />
      </div>

    
    </div>
  );
}
