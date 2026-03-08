export interface Employee {
  employee_code: string
  full_name: string
  nickname: string

  gender: string
  place_of_birth: string
  date_of_birth: string

  national_id: string
  npwp: string

  email: string
  phone: string

  emergency_contact_name: string
  emergency_contact_phone: string

  address: string
  city: string
  province: string
  postal_code: string

  division_id: string
  position_id: string
  employment_type_id: string
  direct_manager_id: string

  join_date: string
  end_date: string
  status: string

  basic_salary: number
  daily_meal_allowance: number
  daily_fuel_allowance: number
  other_allowance: number

  bank_name: string
  bank_account_number: string
  bank_account_name: string

  is_active: boolean
}