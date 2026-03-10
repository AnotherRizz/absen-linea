import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";

interface Slip {
  employee_name: string
  basic_salary: number
  meal: number
  fuel: number
  other: number
  net_salary: number
  month: number
  year: number
}

function formatRupiah(value:number){
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function PayrollSlipPage(){

  const { id } = useParams<{ id: string }>();
  const [data,setData] = useState<Slip | null>(null);

  const fetchData = async () => {

    if(!id) return;

    const { data: result } = await supabase
    .from("payrolls")
    .select(`
      basic_salary,
      total_meal_allowance,
      total_fuel_allowance,
      other_allowance,
      net_salary,
      employee:employees!payrolls_employee_id_fkey(
        full_name
      ),
      batch:payroll_batches!payrolls_payroll_batch_id_fkey(
        month,
        year
      )
    `)
    .eq("id", id)
    .single();

    const r: any = result;

    const formatted: Slip = {
      employee_name: r?.employee?.full_name ?? "-",
      basic_salary: r?.basic_salary ?? 0,
      meal: r?.total_meal_allowance ?? 0,
      fuel: r?.total_fuel_allowance ?? 0,
      other: r?.other_allowance ?? 0,
      net_salary: r?.net_salary ?? 0,
      month: r?.batch?.month ?? 0,
      year: r?.batch?.year ?? 0
    };

    setData(formatted);
  };

  useEffect(()=>{
    fetchData();
  },[]);

  useEffect(()=>{
    if(data){
      setTimeout(()=>window.print(),300);
    }
  },[data]);

  if(!data) return null;

  return(

  <div id="print-area" className="slip-page">

    <div className="slip-container">

      <h2 className="title">
        Slip Gaji Karyawan
      </h2>

      <div className="info-row">
        <span>Nama</span>
        <span>{data.employee_name}</span>
      </div>

      <div className="info-row">
        <span>Periode</span>
        <span>{data.month} / {data.year}</span>
      </div>

      <hr/>

      <div className="info-row">
        <span>Gaji Pokok</span>
        <span>Rp {formatRupiah(data.basic_salary)}</span>
      </div>

      <div className="info-row">
        <span>Tunjangan Makan</span>
        <span>Rp {formatRupiah(data.meal)}</span>
      </div>

      <div className="info-row">
        <span>Tunjangan Bensin</span>
        <span>Rp {formatRupiah(data.fuel)}</span>
      </div>

      <div className="info-row">
        <span>Tunjangan Lain</span>
        <span>Rp {formatRupiah(data.other)}</span>
      </div>

      <hr/>

      <div className="info-row total">
        <span>Total Gaji</span>
        <span>Rp {formatRupiah(data.net_salary)}</span>
      </div>

    </div>

  </div>

  );
}