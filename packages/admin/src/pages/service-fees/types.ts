export interface ServiceFeeRule {
  id: string
  reference: string
  reference_id: string
  mode: string
}

export interface ServiceFee {
  id: string
  name: string
  display_name: string
  code: string
  type: string
  target: string
  charging_level: string
  status: string
  value: number
  min_amount: number | null
  max_amount: number | null
  include_tax: boolean
  is_enabled: boolean
  priority: number
  effective_date: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  replaces_fee_id?: string | null
  currency_code?: string
  rules: ServiceFeeRule[]
}

export interface ChangeLog {
  id: string
  action: string
  service_fee_id: string
  previous_snapshot?: Record<string, unknown>
  new_snapshot?: { description?: string } & Record<string, unknown>
  created_at: string
  changed_by?: string
}

export interface Seller {
  id: string
  name?: string
}

export interface ProductCategory {
  id: string
  name: string
}

export interface ProductType {
  id: string
  value: string
}

export interface ProductCollection {
  id: string
  title: string
}

export interface Product {
  id: string
  title: string
}
