import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";

interface Employee {
  id: string;
  full_name: string;
}

interface Attendance {
  attendance_date: string;
  photo: string | null;
  name: string;
}

export default function CalendarAttendanceTab() {

  const [employees,setEmployees] = useState<Employee[]>([]);
  const [employeeId,setEmployeeId] = useState("");
  const [month,setMonth] = useState(new Date().getMonth()+1);
  const [year] = useState(new Date().getFullYear());
  const [attendance,setAttendance] = useState<Record<string,Attendance>>({});

  const fetchEmployees = async ()=>{
    const {data} = await supabase
      .from("employees")
      .select("id, full_name")
      .eq("is_active",true);

    setEmployees(data || []);
  };

  const fetchAttendance = async ()=>{

    if(!employeeId) return;

    const start = `${year}-${String(month).padStart(2,"0")}-01`;
    const end = `${year}-${String(month).padStart(2,"0")}-31`;

    const {data} = await supabase
      .from("attendance_records")
      .select(`
        attendance_date,
        attachment,
        employee:employees!attendance_records_employee_id_fkey(full_name)
      `)
      .eq("employee_id",employeeId)
      .gte("attendance_date",start)
      .lte("attendance_date",end);

    const mapped:Record<string,Attendance> = {};

    (data || []).forEach((item:any)=>{

      const photoUrl = item.attachment
        ? supabase.storage
            .from("attendance-photos")
            .getPublicUrl(item.attachment).data.publicUrl
        : null;

      mapped[item.attendance_date] = {
        attendance_date:item.attendance_date,
        photo:photoUrl,
        name:item.employee?.full_name
      };

    });

    setAttendance(mapped);
  };

  useEffect(()=>{
    fetchEmployees();
  },[]);

  useEffect(()=>{
    fetchAttendance();
  },[employeeId,month]);

  const daysInMonth = new Date(year,month,0).getDate();

  const days = Array.from({length:daysInMonth},(_,i)=>i+1);

  const formatDate = (day:number)=>{
    return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  };

  return(

    <div className="space-y-6">

      {/* FILTER */}

      <div className="flex gap-4">

        <select
          value={employeeId}
          onChange={(e)=>setEmployeeId(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Pilih Karyawan</option>

          {employees.map(emp=>(
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}

        </select>

        <input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e)=>setMonth(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 w-24"
        />

      </div>

      {/* CALENDAR GRID */}

      <div className="grid grid-cols-4 gap-4">

        {days.map(day=>{

          const date = formatDate(day);
          const record = attendance[date];

          return(

            <div
              key={day}
              className="border rounded-xl overflow-hidden bg-white shadow-sm"
            >

              {/* DATE */}
              <div className="text-xs font-medium px-2 py-1 border-b bg-gray-50">
                {day}
              </div>

              {/* CONTENT */}

              <div className="h-40 relative">

                {record?.photo ? (

                  <img
                    src={record.photo}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                ) : (

                  <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">
                    Belum Absen
                  </div>

                )}

                {record && (
                  <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                    {record.name}
                  </div>
                )}

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}