/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Account definitions
export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE"
}

export enum TaxType {
  VAT_18 = "VAT_18", // Standard Rwanda VAT (18%)
  VAT_EXEMPT = "VAT_EXEMPT",
  WHT_15 = "WHT_15", // Rwanda withholding tax for non-registered/services (15%)
  WHT_3 = "WHT_3"    // Withholding tax for registered tenders (3%)
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  isSystem?: boolean; // Uneditable standard registers
}

// Journal Entry structure (Double-Entry Bookkeeping)
export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  narration: string;
  lines: JournalEntryLine[];
  isApproved: boolean;
  createdBy: string;
  branchId: string;
}

// Branches & SaaS Tenants
export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  isMain: boolean;
}

export interface Organization {
  id: string;
  name: string;
  tin: string; // Tax Identification Number (Rwanda TIN - 9 digits)
  currency: string; // Usually RWF, can support USD, UGX, KES
  logo?: string;
  subscriptionPlan: "Starter" | "Professional" | "Enterprise";
  isKigaliRegistered: boolean;
}

// Sales Module
export interface Customer {
  id: string;
  name: string;
  tin?: string; // Client's VAT identification
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
}

export enum SalesStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  PARTIAL = "PARTIAL"
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxType: TaxType;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  status: SalesStatus;
  branchId: string;
  momoReference?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  total: number;
  status: "DRAFT" | "SENT" | "APPROVED" | "DECLINED" | "CONVERTED";
  branchId: string;
}

// Purchases Module
export interface Supplier {
  id: string;
  name: string;
  tin?: string;
  email: string;
  phone: string;
  address: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: "UNPAID" | "PAID" | "PARTIAL" | "OVERDUE";
  branchId: string;
}

// Inventory Module
export interface Product {
  id: string;
  code: string;
  name: string;
  type: "PHYSICAL" | "SERVICE";
  category: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  taxType: TaxType;
  reorderLevel: number;
  stockCount: number; // Across all branches/warehouses
  branchStocks: Record<string, number>; // branchId -> count
}

export interface StockTransfer {
  id: string;
  date: string;
  productId: string;
  productName: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  status: "PENDING" | "SHIPPED" | "COMPLETED";
}

// Banking & MoMo
export interface BankAccount {
  id: string;
  name: string; // e.g. "BK (Bank of Kigali) Corporate" or "MTN MoMo Sandbox Wallet"
  accountNumber: string;
  type: "BANK" | "MOBILE_MONEY" | "CASH";
  balance: number;
  provider?: string; // MTN, Airtel, BK, I&M, Equity
}

export interface MoMoTransaction {
  id: string;
  timestamp: string;
  phone: string; // e.g. "250788123456" for Rwanda MTN
  amount: number;
  type: "CASH_IN" | "CASH_OUT";
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  invoiceId?: string;
}

// Expense Management
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  taxAmount: number;
  accountId: string;
  merchant: string;
  description: string;
  receiptUrl?: string; // simulated Base64 or local URL
  isApproved: boolean;
  branchId: string;
}

// Payroll Module
export interface Employee {
  id: string;
  name: string;
  nid: string; // National ID (16 digits in Rwanda)
  email: string;
  phone: string;
  role: string;
  baseSalary: number; // in RWF
  bankAccount: string;
  allowances: number;
  deductions: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. "May 2026"
  baseSalary: number;
  allowances: number;
  grossSalary: number;
  rssbEmployee: number; // Pension contribution employee 3%
  maternityLeaveEmployee: number; // Maternity levy employee 0.15% (maternity levy is 0.3% split 0.15% each)
  paye: number; // Rwanda progressive Tax (RRA Table)
  totalDeductions: number;
  netPay: number;
  isPaid: boolean;
  paymentDate?: string;
}

// Tax Reports
export interface TaxObligation {
  id: string;
  period: string;
  type: "VAT" | "PAYE" | "WHT" | "RSSB";
  taxableAmount: number;
  taxDue: number;
  status: "PENDING" | "FILED" | "OVERDUE";
  dueDate: string;
}

// Audit Logs
export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  action: string;
  ip: string;
  beforeValue?: string;
  afterValue?: string;
}

// AI Message Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
