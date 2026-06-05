/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import {
  Account,
  AccountType,
  JournalEntry,
  Customer,
  Supplier,
  Product,
  Invoice,
  Quotation,
  Bill,
  BankAccount,
  MoMoTransaction,
  Expense,
  Employee,
  Payslip,
  TaxObligation,
  AuditLog,
  Branch,
  Organization,
  StockTransfer,
  TaxType,
  SalesStatus
} from "./src/types"; // note the ESM resolution or direct imports

dotenv.config();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Interface for global state
interface DBState {
  organization: Organization;
  branches: Branch[];
  accounts: Account[];
  journals: JournalEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  bills: Bill[];
  bankAccounts: BankAccount[];
  momoTransactions: MoMoTransaction[];
  expenses: Expense[];
  employees: Employee[];
  payslips: Payslip[];
  taxObligations: TaxObligation[];
  stockTransfers: StockTransfer[];
  auditLogs: AuditLog[];
}

// Global state in-memory with file persistence
const DB_FILE = path.join(process.cwd(), "db.json");

const initialAccounts: Account[] = [
  // Assets
  { id: "acc-1010", code: "1010", name: "Bank of Kigali Checking", type: AccountType.ASSET, balance: 25000000, description: "Primary RWF working business bank account", isSystem: true },
  { id: "acc-1020", code: "1020", name: "MTN Mobile Money Wallet", type: AccountType.ASSET, balance: 4500000, description: "Commercial MoMo Bulk payment account", isSystem: true },
  { id: "acc-1200", code: "1200", name: "Accounts Receivable (Debtors)", type: AccountType.ASSET, balance: 6800000, description: "Due from customers for invoices", isSystem: true },
  { id: "acc-1400", code: "1400", name: "Inventory Asset Pool", type: AccountType.ASSET, balance: 14500000, description: "Current inventory asset value", isSystem: true },
  
  // Liabilities
  { id: "acc-2100", code: "2100", name: "Accounts Payable (Creditors)", type: AccountType.LIABILITY, balance: 3400000, description: "Owed to suppliers for bills", isSystem: true },
  { id: "acc-2200", code: "2200", name: "RRA VAT Payable (Standard 18%)", type: AccountType.LIABILITY, balance: 1250000, description: "VAT Output collected - VAT Input claimed", isSystem: true },
  { id: "acc-2300", code: "2300", name: "RRA PAYE Liability", type: AccountType.LIABILITY, balance: 420000, description: "Withheld PAYE taxes payable to Rwanda Revenue Authority", isSystem: true },
  { id: "acc-2400", code: "2400", name: "RSSB Pension Obligation", type: AccountType.LIABILITY, balance: 180000, description: "Social security contributions (Employee & Employer)", isSystem: true },
  
  // Equity
  { id: "acc-3000", code: "3000", name: "SME Share Capital", type: AccountType.EQUITY, balance: 40000000, description: "Initial invested family capital", isSystem: true },
  { id: "acc-3500", code: "3500", name: "Retained Earnings", type: AccountType.EQUITY, balance: 6150000, description: "Accumulated profits", isSystem: true },

  // Revenues
  { id: "acc-4000", code: "4000", name: "Product Sales Revenue", type: AccountType.REVENUE, balance: 18450000, description: "Standard physical merchandise sales revenue", isSystem: true },
  { id: "acc-4100", code: "4100", name: "Professional Services Revenue", type: AccountType.REVENUE, balance: 3500000, description: "Consulting and business services receipts", isSystem: true },

  // Expenses
  { id: "acc-5000", code: "5000", name: "Cost of Goods Sold (COGS)", type: AccountType.EXPENSE, balance: 8200000, description: "Direct materials cost of items sold", isSystem: true },
  { id: "acc-5100", code: "5100", name: "Office and Rent Expense", type: AccountType.EXPENSE, balance: 1500000, description: "Rent, power and utility bills", isSystem: true },
  { id: "acc-5200", code: "5200", name: "Staff Payroll Salaries", type: AccountType.EXPENSE, balance: 3800000, description: "Gross personnel salaries", isSystem: true },
  { id: "acc-5300", code: "5300", name: "RRA Taxes and Fees", type: AccountType.EXPENSE, balance: 240000, description: "General municipal, trade license and registration taxes", isSystem: true }
];

const initialCustomers: Customer[] = [
  { id: "cust-1", name: "Imena Trading Ltd", tin: "100234567", email: "info@imena.rw", phone: "+250788320491", address: "KN 14 Ave, Nyarugenge, Kigali", creditLimit: 5000000, outstandingBalance: 3200000 },
  { id: "cust-2", name: "Giti Farmers Cooperative", tin: "109843210", email: "giti.coop@giti.org.rw", phone: "+250785121289", address: "Gicumbi District, Northern Province", creditLimit: 2000000, outstandingBalance: 850000 },
  { id: "cust-3", name: "Kivu Serene Resort", tin: "102938475", email: "finance@kivuserene.com", phone: "+250783454590", address: "Rubavu Promenade, Western Province", creditLimit: 8000000, outstandingBalance: 2750000 }
];

const initialSuppliers: Supplier[] = [
  { id: "supp-1", name: "Akagera Logistics & Supplies", tin: "101928374", email: "procurement@akagera.co.rw", phone: "+250788445566", address: "Gikondo industrial zone, Kigali" },
  { id: "supp-2", name: "East Africa Cement Ltd", tin: "100495810", email: "sales@eacement.rw", phone: "+250782333444", address: "Bugarama, Rusizi District" }
];

const initialProducts: Product[] = [
  { id: "prod-1", code: "PROD-CON-01", name: "Premium Construction Cement (50kg)", type: "PHYSICAL", category: "Materials", sku: "CEM-PM-50", costPrice: 9500, sellingPrice: 13500, taxType: TaxType.VAT_18, reorderLevel: 100, stockCount: 450, branchStocks: { "br-1": 300, "br-2": 150 } },
  { id: "prod-2", code: "PROD-STE-02", name: "Structural Reinforcement Steel Bar (12mm)", type: "PHYSICAL", category: "Materials", sku: "STL-RB-12", costPrice: 16000, sellingPrice: 22000, taxType: TaxType.VAT_18, reorderLevel: 50, stockCount: 180, branchStocks: { "br-1": 130, "br-2": 50 } },
  { id: "prod-3", code: "PROD-SRV-03", name: "Quantity Survey & Engineering Support", type: "SERVICE", category: "Services", sku: "SRV-QS-01", costPrice: 0, sellingPrice: 150000, taxType: TaxType.VAT_EXEMPT, reorderLevel: 0, stockCount: 9999, branchStocks: { "br-1": 9999, "br-2": 0 } }
];

const initialInvoices: Invoice[] = [
  {
    id: "inv-1001",
    invoiceNumber: "INV-2026-1001",
    date: "2026-05-10",
    dueDate: "2026-06-10",
    customerId: "cust-1",
    customerName: "Imena Trading Ltd",
    items: [
      { productId: "prod-1", quantity: 150, unitPrice: 13500, discount: 0, taxType: TaxType.VAT_18, taxAmount: 364500, total: 2389500 }
    ],
    subtotal: 2025000,
    taxTotal: 364500,
    total: 2389500,
    amountPaid: 1100000,
    status: SalesStatus.PARTIAL,
    branchId: "br-1",
    momoReference: "MOMO-9348910"
  },
  {
    id: "inv-1002",
    invoiceNumber: "INV-2026-1002",
    date: "2026-05-24",
    dueDate: "2026-06-24",
    customerId: "cust-3",
    customerName: "Kivu Serene Resort",
    items: [
      { productId: "prod-3", quantity: 5, unitPrice: 150000, discount: 5000, taxType: TaxType.VAT_EXEMPT, taxAmount: 0, total: 725000 }
    ],
    subtotal: 725000,
    taxTotal: 0,
    total: 725000,
    amountPaid: 725000,
    status: SalesStatus.PAID,
    branchId: "br-2",
    momoReference: "MOMO-1029348"
  }
];

const initialEmployees: Employee[] = [
  { id: "emp-1", name: "Kagabo Jean de Dieu", nid: "1199180023451023", email: "jean.kagabo@korabooks-demo.com", phone: "+250788111222", role: "Accountant / Auditor", baseSalary: 850000, bankAccount: "BK - 00100-293849", allowances: 80000, deductions: 25000 },
  { id: "emp-2", name: "Uwase Diane", nid: "1199380234912093", email: "diane.uwase@korabooks-demo.com", phone: "+250782334455", role: "Rubavu Branch Supervisor", baseSalary: 550000, bankAccount: "Equity - 40010-384910", allowances: 45000, deductions: 10000 },
  { id: "emp-3", name: "Nshuti Christian", nid: "1199580123910283", email: "christian.nshuti@korabooks-demo.com", phone: "+250785998877", role: "Head of Warehouse & Logistics", baseSalary: 420000, bankAccount: "I&M - 00120-293849", allowances: 30000, deductions: 5000 }
];

const initialPayslips: Payslip[] = [
  {
    id: "slip-101",
    employeeId: "emp-1",
    employeeName: "Kagabo Jean de Dieu",
    period: "May 2026",
    baseSalary: 850000,
    allowances: 80000,
    grossSalary: 930000,
    rssbEmployee: 25500, // 3% of 850000
    maternityLeaveEmployee: 1275, // 0.15% of 850000
    paye: 219000, // Simple simulated PAYE bracket
    totalDeductions: 245775,
    netPay: 684225,
    isPaid: true,
    paymentDate: "2026-05-28"
  }
];

const initialState: DBState = {
  organization: {
    id: "org-master",
    name: "Murakoze General Builders Ltd",
    tin: "103948512",
    currency: "RWF",
    subscriptionPlan: "Professional",
    isKigaliRegistered: true
  },
  branches: [
    { id: "br-1", name: "Kigali Gikondo Head Office", location: "Gikondo industrial sector, Kigali", manager: "Jean-Pierre Mugezi", isMain: true },
    { id: "br-2", name: "Rubavu Kivu Depot", location: "Rubavu Promenade, Rubavu District", manager: "Uwase Diane", isMain: false }
  ],
  accounts: initialAccounts,
  journals: [
    {
      id: "jrn-1",
      date: "2026-05-01",
      reference: "OPB-2026",
      narration: "Record initial shareholder equity and capitalization",
      lines: [
        { accountId: "acc-1010", debit: 40000000, credit: 0, memo: "BK starting deposits" },
        { accountId: "acc-3000", debit: 0, credit: 40000000, memo: "Capital shares matching" }
      ],
      isApproved: true,
      createdBy: "owner@murakoze.rw",
      branchId: "br-1"
    }
  ],
  customers: initialCustomers,
  suppliers: initialSuppliers,
  products: initialProducts,
  invoices: initialInvoices,
  quotations: [
    {
      id: "qte-1",
      quoteNumber: "QTE-2026-004",
      date: "2026-05-18",
      validUntil: "2026-06-18",
      customerId: "cust-2",
      customerName: "Giti Farmers Cooperative",
      items: [
        { productId: "prod-2", quantity: 15, unitPrice: 22000, discount: 1000, taxType: TaxType.VAT_18, taxAmount: 56700, total: 371700 }
      ],
      total: 371700,
      status: "APPROVED",
      branchId: "br-1"
    }
  ],
  bills: [
    {
      id: "bill-101",
      billNumber: "BIL-AK-9234",
      date: "2026-05-14",
      dueDate: "2026-06-14",
      supplierId: "supp-1",
      supplierName: "Akagera Logistics & Supplies",
      items: [
        { productId: "prod-1", quantity: 200, unitPrice: 9500, discount: 0, taxType: TaxType.VAT_18, taxAmount: 342000, total: 2242000 }
      ],
      subtotal: 1900000,
      taxTotal: 342000,
      total: 2242000,
      status: "UNPAID",
      branchId: "br-1"
    }
  ],
  bankAccounts: [
    { id: "bk-1", name: "BK checking primary account", accountNumber: "00100-293849102", type: "BANK", balance: 25000000, provider: "Bank of Kigali" },
    { id: "bk-2", name: "MTN Bulk MoMo Commercial Pay", accountNumber: "*182*8# - Shop 029310", type: "MOBILE_MONEY", balance: 4500000, provider: "MTN Rwanda" }
  ],
  momoTransactions: [
    { id: "tx-momo-1", timestamp: "2026-05-10T11:23:00Z", phone: "250788320491", amount: 1100000, type: "CASH_IN", reference: "MOMO-9348910", status: "SUCCESS", invoiceId: "inv-1001" },
    { id: "tx-momo-2", timestamp: "2026-05-24T15:10:00Z", phone: "250783454590", amount: 725000, type: "CASH_IN", reference: "MOMO-1029348", status: "SUCCESS", invoiceId: "inv-1002" }
  ],
  expenses: [
    { id: "exp-1", date: "2026-05-15", category: "Rent & Utilities", amount: 450000, taxAmount: 81000, accountId: "acc-5100", merchant: "Zion Real Estate Ltd", description: "Office rent month of May Gikondo", isApproved: true, branchId: "br-1" },
    { id: "exp-2", date: "2026-05-22", category: "Transport & Fuel", amount: 120000, taxAmount: 0, accountId: "acc-5300", merchant: "SP Gikondo Station", description: "Warehouse truck diesel refuel", isApproved: true, branchId: "br-1" }
  ],
  taxObligations: [
    { id: "tax-ob-1", period: "May 2026", type: "VAT", taxableAmount: 2025000, taxDue: 364500, status: "PENDING", dueDate: "2026-06-15" },
    { id: "tax-ob-2", period: "May 2026", type: "PAYE", taxableAmount: 930000, taxDue: 219000, status: "PENDING", dueDate: "2026-06-15" }
  ],
  stockTransfers: [
    { id: "st-1", date: "2026-05-08", productId: "prod-1", productName: "Premium Construction Cement (50kg)", fromBranchId: "br-1", toBranchId: "br-2", quantity: 50, status: "COMPLETED" }
  ],
  auditLogs: [
    { id: "aud-1", timestamp: "2026-06-05T08:12:00Z", userEmail: "niyonshutiisaac7@gmail.com", role: "Super Admin", action: "PLATFORM_ACCESS_INITIALIZED", ip: "197.243.32.18" },
    { id: "aud-2", timestamp: "2026-06-05T09:40:00Z", userEmail: "niyonshutiisaac7@gmail.com", role: "Super Admin", action: "CHARTS_OF_ACCOUNTS_SYNCED", ip: "197.243.32.18" }
  ],
  employees: initialEmployees,
  payslips: initialPayslips
};

// Database local State management
let state: DBState = { ...initialState };

function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const dbStr = fs.readFileSync(DB_FILE, "utf-8");
      const loaded = JSON.parse(dbStr);
      // Basic validation to confirm loaded schema is correct
      if (loaded.accounts && loaded.invoices && loaded.products) {
        state = loaded;
        console.log("State loaded successfully from database file:", DB_FILE);
      }
    } else {
      saveState();
    }
  } catch (err) {
    console.error("Error loading db state, compiling defaults:", err);
  }
}

function saveState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving state to file:", err);
  }
}

// Initial state load
loadState();

// Express app initialize
const app = express();
app.use(express.json());

// API: Load Dashboard and Core Data
app.get("/api/data", (req, res) => {
  res.json(state);
});

// Write audit entry helper
function createAudit(userEmail: string, role: string, action: string, before?: any, after?: any) {
  const audit: AuditLog = {
    id: "aud-" + generateId(),
    timestamp: new Date().toISOString(),
    userEmail: userEmail || "anonymous@korabooks.rw",
    role: role || "Guest",
    action,
    ip: "197.243.32.18",
    beforeValue: before ? JSON.stringify(before) : undefined,
    afterValue: after ? JSON.stringify(after) : undefined
  };
  state.auditLogs.unshift(audit);
  saveState();
}

// Write double-entry transaction posting helper
function postJournalEntry(params: {
  date: string;
  reference: string;
  narration: string;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
  branchId: string;
}): boolean {
  // Check debits vs credits
  const totalDebits = params.lines.reduce((tot, l) => tot + l.debit, 0);
  const totalCredits = params.lines.reduce((tot, l) => tot + l.credit, 0);
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    console.error("Ledger out-of-balance! Debit sum", totalDebits, "≠ Credit sum", totalCredits);
    return false;
  }

  const id = "jrn-" + generateId();
  const journal: JournalEntry = {
    id,
    date: params.date,
    reference: params.reference,
    narration: params.narration,
    lines: params.lines,
    isApproved: true,
    createdBy: "automated@korabooks.rw",
    branchId: params.branchId
  };

  // Mutate account balances
  params.lines.forEach(line => {
    const acc = state.accounts.find(a => a.id === line.accountId);
    if (acc) {
      // Asset debits increase balance, credits decrease balance
      // Expense debits increase, credits decrease
      // Liability, Equity & Revenue credits increase, debits decrease
      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        acc.balance += (line.debit - line.credit);
      } else {
        acc.balance += (line.credit - line.debit);
      }
    }
  });

  state.journals.push(journal);
  saveState();
  return true;
}

// API: Create manual Journal entry
app.post("/api/journals", (req, res) => {
  const { date, reference, narration, lines, branchId, userEmail, userRole } = req.body;
  if (!lines || lines.length < 2) {
    return res.status(400).json({ error: "Requires at least 2 lines for double-entry ledger validation." });
  }

  const success = postJournalEntry({ date, reference, narration, lines, branchId });
  if (success) {
    createAudit(userEmail, userRole, "CREATE_MANUAL_JOURNAL", null, { reference, narration, lines });
    res.json({ success: true, journals: state.journals, accounts: state.accounts });
  } else {
    res.status(400).json({ error: "Double entry validation failed. Debit total must exactly balance credits." });
  }
});

// API: Save TIN / corporate details
app.post("/api/settings/tintax", (req, res) => {
  const { name, tin, currency, subscriptionPlan, isKigaliRegistered, userEmail, userRole } = req.body;
  const before = { ...state.organization };
  state.organization = {
    ...state.organization,
    name,
    tin,
    currency,
    subscriptionPlan,
    isKigaliRegistered
  };
  saveState();
  createAudit(userEmail, userRole, "UPDATE_TIN_SETTINGS", before, state.organization);
  res.json({ success: true, organization: state.organization });
});

// API: Complete Mobile Money & Cards payments pulls
app.post("/api/momo/payment", (req, res) => {
  const { phone, amount, invoiceId, reference, userEmail, userRole } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount required for subscriber Mobile Money push." });
  }

  // Auto-generate status
  const txRef = reference || "TX-" + generateId();
  const newTx: MoMoTransaction = {
    id: "momo-" + generateId(),
    timestamp: new Date().toISOString(),
    phone,
    amount,
    type: "CASH_IN",
    reference: txRef,
    status: "SUCCESS", // Default to success for fintech workspace simulation
    invoiceId
  };

  state.momoTransactions.unshift(newTx);

  if (invoiceId) {
    const inv = state.invoices.find(i => i.id === invoiceId);
    if (inv) {
      const beforeInv = { ...inv };
      inv.amountPaid = Math.min(inv.total, inv.amountPaid + amount);
      if (inv.amountPaid >= inv.total) {
        inv.status = SalesStatus.PAID;
      } else if (inv.amountPaid > 0) {
        inv.status = SalesStatus.PARTIAL;
      }
      inv.momoReference = txRef;

      // Update customer outstanding tracker as well
      const cust = state.customers.find(c => c.id === inv.customerId);
      if (cust) {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - amount);
      }

      // Record automated Double Entry journal posting: Cash MoMo assets DEBIT, Accounts Receivable CREDIT
      postJournalEntry({
        date: new Date().toISOString().split("T")[0],
        reference: txRef,
        narration: `Bulk MoMo collections for Invoice ${inv.invoiceNumber}`,
        lines: [
          { accountId: "acc-1020", debit: amount, credit: 0, memo: `Mobile Money Cash Deposit phone: ${phone}` },
          { accountId: "acc-1200", debit: 0, credit: amount, memo: `Invoices collections clearing` }
        ],
        branchId: inv.branchId
      });

      createAudit(userEmail, userRole, "MOBILE_MONEY_PIPELINE_RESOLVED", beforeInv, inv);
    }
  } else {
    // General direct MoMo receipt without invoice association (Direct revenue ledger debit)
    postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: txRef,
      narration: `General direct MoMo collection`,
      lines: [
        { accountId: "acc-1020", debit: amount, credit: 0, memo: `Direct customer MoMo payment` },
        { accountId: "acc-4000", debit: 0, credit: amount, memo: `Direct counter receipt` }
      ],
      branchId: "br-1"
    });
    createAudit(userEmail, userRole, "DIRECT_MOBILE_MONEY_RECEIPT", null, newTx);
  }

  saveState();
  res.json({ success: true, momoTransactions: state.momoTransactions, invoices: state.invoices, customers: state.customers, accounts: state.accounts });
});

// API: Create Outward Expenses
app.post("/api/expenses", (req, res) => {
  const { date, category, amount, accountId, merchant, description, branchId, userEmail, userRole } = req.body;
  const id = "exp-" + generateId();
  
  // RRA Standard VAT inside Expense tracking (simulating 18% reclaimable Input Tax)
  const isVatable = category === "Rent & Utilities" || category === "Office Supplies";
  const taxAmount = isVatable ? Math.round(amount * (0.18 / 1.18)) : 0;
  
  const newExp: Expense = {
    id,
    date,
    category,
    amount,
    taxAmount,
    accountId,
    merchant,
    description,
    isApproved: true,
    branchId: branchId || "br-1"
  };

  state.expenses.unshift(newExp);

  // Journal Posting:
  // Expense account DEBIT, VAT Input DEBIT (reducing VAT payable liability), Cash/Bank assets CREDIT
  const expLines = [
    { accountId: accountId, debit: amount - taxAmount, credit: 0, memo: `${description} Net material cost` },
    { accountId: "acc-1010", debit: 0, credit: amount, memo: `Cash paid from BK account` }
  ];

  if (taxAmount > 0) {
    // Debit VAT Liability (reducing cash to pay under standard Input Claim rules RRA)
    expLines.push({ accountId: "acc-2200", debit: taxAmount, credit: 0, memo: `Claimable input VAT credit` });
  }

  postJournalEntry({
    date,
    reference: `EXP-${id}`,
    narration: `Automated posting for expense voucher to ${merchant}`,
    lines: expLines,
    branchId: branchId || "br-1"
  });

  createAudit(userEmail, userRole, "CREATE_EXPENSE_VOUCHER", null, newExp);
  saveState();
  res.json({ success: true, expenses: state.expenses, accounts: state.accounts });
});

// API: Handle dynamic invoice issuances
app.post("/api/invoices", (req, res) => {
  const { customerId, items, dueDate, branchId, userEmail, userRole } = req.body;
  
  const customer = state.customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer record not found for invoice issuance." });
  }

  const invoiceNumber = `INV-2026-${1000 + state.invoices.length + 1}`;
  
  let subtotal = 0;
  let taxTotal = 0;

  // Compile calculations with Rwanda standard Taxing engine
  const processedItems = items.map((itm: any) => {
    const prod = state.products.find(p => p.id === itm.productId);
    const unitPrice = Number(itm.unitPrice) || (prod ? prod.sellingPrice : 0);
    const quantity = Number(itm.quantity) || 1;
    const discount = Number(itm.discount) || 0;
    const grossVal = (unitPrice * quantity) - discount;

    let taxAmount = 0;
    if (itm.taxType === TaxType.VAT_18) {
      taxAmount = Math.round(grossVal * 0.18);
    }

    subtotal += grossVal;
    taxTotal += taxAmount;

    // Direct Stock decrement inside Warehouse module
    if (prod && prod.type === "PHYSICAL") {
      const bId = branchId || "br-1";
      if (prod.branchStocks[bId] !== undefined) {
        prod.branchStocks[bId] = Math.max(0, prod.branchStocks[bId] - quantity);
      }
      prod.stockCount = Object.values(prod.branchStocks).reduce((sum, count) => sum + count, 0);
    }

    return {
      productId: itm.productId,
      quantity,
      unitPrice,
      discount,
      taxType: itm.taxType,
      taxAmount,
      total: grossVal + taxAmount
    };
  });

  const total = subtotal + taxTotal;

  const newInv: Invoice = {
    id: "inv-" + generateId(),
    invoiceNumber,
    date: new Date().toISOString().split("T")[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    customerId,
    customerName: customer.name,
    items: processedItems,
    subtotal,
    taxTotal,
    total,
    amountPaid: 0,
    status: SalesStatus.SENT,
    branchId: branchId || "br-1"
  };

  state.invoices.unshift(newInv);
  customer.outstandingBalance += total;

  // Double entry Accounting logs:
  // Accounts Receivable (1200) DEBIT total, Sales Revenue (4000) CREDIT subtotal, VAT Output liability CREDIT taxTotal
  const entryLines = [
    { accountId: "acc-1200", debit: total, credit: 0, memo: `Receivables generated invoice ${invoiceNumber}` },
    { accountId: "acc-4000", debit: 0, credit: subtotal, memo: `Core merchandise sales revenue` }
  ];

  if (taxTotal > 0) {
    entryLines.push({ accountId: "acc-2200", debit: 0, credit: taxTotal, memo: `RRA output VAT liability recorded` });
  }

  postJournalEntry({
    date: newInv.date,
    reference: invoiceNumber,
    narration: `Automated sale ledger entry for client ${customer.name}`,
    lines: entryLines,
    branchId: branchId || "br-1"
  });

  // Automated Cost of Goods Sold (COGS) transaction
  processedItems.forEach((itm: any) => {
    const prod = state.products.find(p => p.id === itm.productId);
    if (prod && prod.type === "PHYSICAL") {
      const cogsAmount = prod.costPrice * itm.quantity;
      postJournalEntry({
        date: newInv.date,
        reference: `COGS-${invoiceNumber}`,
        narration: `Record cost of goods and warehouse drop for ${prod.name}`,
        lines: [
          { accountId: "acc-5000", debit: cogsAmount, credit: 0, memo: `COGS posting` },
          { accountId: "acc-1400", debit: 0, credit: cogsAmount, memo: `Inventory reduction credit` }
        ],
        branchId: branchId || "br-1"
      });
    }
  });

  createAudit(userEmail, userRole, "EMIT_SALE_INVOICE", null, newInv);
  saveState();
  res.json({ success: true, invoices: state.invoices, customers: state.customers, products: state.products, accounts: state.accounts });
});

// API: Quotations and Conversion
app.post("/api/quotations", (req, res) => {
  const { customerId, items, validUntil, branchId, userEmail, userRole } = req.body;
  const customer = state.customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found." });
  }

  const quoteNumber = `QTE-2026-${1000 + state.quotations.length + 1}`;
  let total = 0;
  
  const processedItems = items.map((itm: any) => {
    const prod = state.products.find(p => p.id === itm.productId);
    const unitPrice = Number(itm.unitPrice) || (prod ? prod.sellingPrice : 0);
    const quantity = Number(itm.quantity) || 1;
    const discount = Number(itm.discount) || 0;
    const grossVal = (unitPrice * quantity) - discount;
    const taxAmount = itm.taxType === TaxType.VAT_18 ? Math.round(grossVal * 0.18) : 0;
    
    total += grossVal + taxAmount;
    
    return {
      productId: itm.productId,
      quantity,
      unitPrice,
      discount,
      taxType: itm.taxType,
      taxAmount,
      total: grossVal + taxAmount
    };
  });

  const qte: Quotation = {
    id: "qte-" + generateId(),
    quoteNumber,
    date: new Date().toISOString().split("T")[0],
    validUntil: validUntil || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0],
    customerId,
    customerName: customer.name,
    items: processedItems,
    total,
    status: "SENT",
    branchId: branchId || "br-1"
  };

  state.quotations.unshift(qte);
  createAudit(userEmail, userRole, "CREATE_QUOTATION", null, qte);
  saveState();
  res.json({ success: true, quotations: state.quotations });
});

// Convert Quote to Invoice
app.post("/api/quotations/convert", (req, res) => {
  const { quoteId, userEmail, userRole } = req.body;
  const qte = state.quotations.find(q => q.id === quoteId);
  if (!qte) {
    return res.status(404).json({ error: "Quotation not found" });
  }

  qte.status = "CONVERTED";
  saveState();

  // Redirecting internally to invoices POST logic simulation
  const invReqBody = {
    customerId: qte.customerId,
    items: qte.items,
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    branchId: qte.branchId,
    userEmail,
    userRole
  };

  // Run the POST logic sequentially
  const mockRes = {
    status: () => ({ json: (err: any) => console.log(err) }),
    json: (data: any) => {
      createAudit(userEmail, userRole, "CONVERTED_QUOTATION_TO_INVOICE", qte, data.invoices[0]);
    }
  };

  // Hand-off
  const mockReq = { body: invReqBody };
  // Trigger logic
  // We can just call the invoice logic manually or let client call invoices and handle locally. Let's just create it directly in database to be clean and atomic!
  const invoiceNumber = `INV-2026-${1000 + state.invoices.length + 1}`;
  const customer = state.customers.find(c => c.id === qte.customerId);
  if (customer) {
    let subtotal = 0;
    let taxTotal = 0;
    qte.items.forEach(itm => {
      const val = (itm.unitPrice * itm.quantity) - itm.discount;
      subtotal += val;
      taxTotal += itm.taxAmount;
    });

    const newInv: Invoice = {
      id: "inv-" + generateId(),
      invoiceNumber,
      date: new Date().toISOString().split("T")[0],
      dueDate: invReqBody.dueDate,
      customerId: qte.customerId,
      customerName: customer.name,
      items: qte.items,
      subtotal,
      taxTotal,
      total: qte.total,
      amountPaid: 0,
      status: SalesStatus.SENT,
      branchId: qte.branchId
    };

    state.invoices.unshift(newInv);
    customer.outstandingBalance += qte.total;

    // Post double entries
    postJournalEntry({
      date: newInv.date,
      reference: invoiceNumber,
      narration: `Sale ledger posted from converted Quotation ${qte.quoteNumber}`,
      lines: [
        { accountId: "acc-1200", debit: qte.total, credit: 0, memo: `Accounts Receivables` },
        { accountId: "acc-4000", debit: 0, credit: subtotal, memo: `Sales converted` },
        ...(taxTotal > 0 ? [{ accountId: "acc-2200", debit: 0, credit: taxTotal, memo: `VAT` }] : [])
      ],
      branchId: qte.branchId
    });

    saveState();
  }

  res.json({ success: true, quotations: state.quotations, invoices: state.invoices, customers: state.customers });
});

// API: Stock transfers within warehouses & branches
app.post("/api/stock/transfer", (req, res) => {
  const { productId, fromBranchId, toBranchId, quantity, userEmail, userRole } = req.body;
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return res.status(404).json({ error: "Product not found" });

  const currentFrom = prod.branchStocks[fromBranchId] || 0;
  if (currentFrom < quantity) {
    return res.status(400).json({ error: `Insufficient stock on source branch: only ${currentFrom} available.` });
  }

  prod.branchStocks[fromBranchId] -= quantity;
  prod.branchStocks[toBranchId] = (prod.branchStocks[toBranchId] || 0) + quantity;
  prod.stockCount = Object.values(prod.branchStocks).reduce((sum, c) => sum + c, 0);

  const transfer: StockTransfer = {
    id: "st-" + generateId(),
    date: new Date().toISOString().split("T")[0],
    productId,
    productName: prod.name,
    fromBranchId,
    toBranchId,
    quantity,
    status: "COMPLETED"
  };

  state.stockTransfers.unshift(transfer);
  createAudit(userEmail, userRole, "INVENTORY_BRANCH_TRANSFER", null, transfer);
  saveState();
  res.json({ success: true, products: state.products, stockTransfers: state.stockTransfers });
});

// API: Stock adjusts
app.post("/api/stock/adjust", (req, res) => {
  const { productId, branchId, difference, reason, userEmail, userRole } = req.body;
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return res.status(404).json({ error: "Product not found" });

  const beforeStock = { ...prod };
  const diffInt = parseInt(difference) || 0;
  prod.branchStocks[branchId] = Math.max(0, (prod.branchStocks[branchId] || 0) + diffInt);
  prod.stockCount = Object.values(prod.branchStocks).reduce((sum, c) => sum + c, 0);

  // General journal posting to reconcile inventory assets with adjustments expense
  const netCogsDiff = prod.costPrice * Math.abs(diffInt);
  if (diffInt !== 0) {
    postJournalEntry({
      date: new Date().toISOString().split("T")[0],
      reference: "STK-ADJ-" + generateId(),
      narration: `Reconcile inventory stock adjust: ${reason}`,
      lines: diffInt > 0 ? [
        { accountId: "acc-1400", debit: netCogsDiff, credit: 0, memo: "Inventory stock count increase" },
        { accountId: "acc-3500", debit: 0, credit: netCogsDiff, memo: "Retained Earnings upward adjust credit" }
      ] : [
        { accountId: "acc-5000", debit: netCogsDiff, credit: 0, memo: "Inventory write-off / wastage expense" },
        { accountId: "acc-1400", debit: 0, credit: netCogsDiff, memo: "Credit to inventory value pool" }
      ],
      branchId
    });
  }

  createAudit(userEmail, userRole, "STOCK_ADJUSTMENT", beforeStock, prod);
  saveState();
  res.json({ success: true, products: state.products, accounts: state.accounts });
});

// API: Save Purchase Bills from Suppliers
app.post("/api/bills", (req, res) => {
  const { supplierId, items, dueDate, branchId, userEmail, userRole } = req.body;
  const supplier = state.suppliers.find(s => s.id === supplierId);
  if (!supplier) return res.status(404).json({ error: "Supplier profile not found." });

  const billNumber = `BIL-PUR-${1000 + state.bills.length + 1}`;
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((itm: any) => {
    const prod = state.products.find(p => p.id === itm.productId);
    const unitCost = Number(itm.unitPrice) || (prod ? prod.costPrice : 0);
    const quantity = Number(itm.quantity) || 1;
    const discount = Number(itm.discount) || 0;
    const finalVal = (unitCost * quantity) - discount;
    const taxAmount = itm.taxType === TaxType.VAT_18 ? Math.round(finalVal * 0.18) : 0;

    subtotal += finalVal;
    taxTotal += taxAmount;

    // Replenish stock count
    if (prod && prod.type === "PHYSICAL") {
      const bId = branchId || "br-1";
      prod.branchStocks[bId] = (prod.branchStocks[bId] || 0) + quantity;
      prod.stockCount = Object.values(prod.branchStocks).reduce((sum, c) => sum + c, 0);
    }

    return {
      productId: itm.productId,
      quantity,
      unitPrice: unitCost,
      discount,
      taxType: itm.taxType,
      taxAmount,
      total: finalVal + taxAmount
    };
  });

  const total = subtotal + taxTotal;

  const newBill: Bill = {
    id: "bill-" + generateId(),
    billNumber,
    date: new Date().toISOString().split("T")[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    supplierId,
    supplierName: supplier.name,
    items: processedItems,
    subtotal,
    taxTotal,
    total,
    status: "UNPAID",
    branchId: branchId || "br-1"
  };

  state.bills.unshift(newBill);

  // Double entry rules:
  // Inventory Asset Pool (1400) DEBIT subtotal, claimable VAT input (reclaimable liability credit) DEBIT taxTotal, Accounts Payable (2100) CREDIT total
  const ledgerLines = [
    { accountId: "acc-1400", debit: subtotal, credit: 0, memo: `Stock additions from supplier Bill ${billNumber}` },
    { accountId: "acc-2100", debit: 0, credit: total, memo: `Supplier payable liability` }
  ];

  if (taxTotal > 0) {
    // Debit VAT Payable decreases the vat liability (Input Credit standard tax RRA rules)
    ledgerLines.push({ accountId: "acc-2200", debit: taxTotal, credit: 0, memo: `VAT inputs claimed on purchase` });
  }

  postJournalEntry({
    date: newBill.date,
    reference: billNumber,
    narration: `Inventory procurement from supply house ${supplier.name}`,
    lines: ledgerLines,
    branchId: branchId || "br-1"
  });

  createAudit(userEmail, userRole, "POST_SUPPLIER_BILL", null, newBill);
  saveState();
  res.json({ success: true, bills: state.bills, products: state.products, accounts: state.accounts });
});

// Bill Payment (Disbursal)
app.post("/api/bills/pay", (req, res) => {
  const { billId, payingBankAccId, amount, userEmail, userRole } = req.body;
  const bill = state.bills.find(b => b.id === billId);
  if (!bill) return res.status(404).json({ error: "Bill not found" });

  const payAmt = Number(amount) || bill.total;
  bill.status = "PAID"; // simplest simulation

  // Deduct from paying account ledger
  // Accounts payable (2100) DEBIT, Bank BK (1010) CREDIT
  postJournalEntry({
    date: new Date().toISOString().split("T")[0],
    reference: "PAY-BIL-" + generateId(),
    narration: `Disbursement pay for Supplier bill ${bill.billNumber}`,
    lines: [
      { accountId: "acc-2100", debit: payAmt, credit: 0, memo: `Accounts Payable debit clearance` },
      { accountId: payingBankAccId || "acc-1010", debit: 0, credit: payAmt, memo: `BK checking credits dispersal` }
    ],
    branchId: bill.branchId
  });

  createAudit(userEmail, userRole, "OUTWARD_BILL_DISBURSEMENT_PAID", null, bill);
  res.json({ success: true, bills: state.bills, accounts: state.accounts });
});

// API: Process local SME Salary payroll batches
app.post("/api/payroll/run", (req, res) => {
  const { period, employeeIds, userEmail, userRole } = req.body;
  
  if (!employeeIds || employeeIds.length === 0) {
    return res.status(400).json({ error: "Select at least one employee to include in monthly pay-run." });
  }

  const generatedSlips: Payslip[] = [];
  let totalGross = 0;
  let totalPAYE = 0;
  let totalRSSB = 0;
  let totalMaternity = 0;

  employeeIds.forEach((empId: string) => {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;

    // RRA Progressive PAYE tables calculations
    const base = emp.baseSalary;
    const allowances = emp.allowances;
    const deductions = emp.deductions;
    const gross = base + allowances;

    // RSSB Pension (Employee portion: 3%)
    const rssbEmp = Math.round(base * 0.03);
    // RSSB Pension (Employer portion is 5% total - recorded in payroll overhead)

    // Maternity Leave Levy (Employee portion: 0.15% of gross/base. Usually calculated on basic salary)
    const maternityEmp = Math.round(base * 0.0015);

    // Progressive PAYE Tax table Rwanda limits:
    // 0 to 60,000 => 0%
    // 60,001 to 100,000 => 10% on first excess (excess is capped at 40k, i.e. tax is up to 4,000)
    // 100,001 to 200,000 => 20% on next 100k (tax is up to 20,000)
    // Above 200,000 => 30% on excess over 200k
    let paye = 0;
    if (gross > 200000) {
      const tier1Tax = 0;
      const tier2Tax = (100000 - 60000) * 0.1; // 4,000
      const tier3Tax = (200000 - 100000) * 0.2; // 20,000
      const tier4Tax = (gross - 200000) * 0.3;
      paye = tier1Tax + tier2Tax + tier3Tax + tier4Tax;
    } else if (gross > 100000) {
      const tier2Tax = (100000 - 60000) * 0.1; // 4,000
      const tier3Tax = (gross - 100000) * 0.2;
      paye = tier2Tax + tier3Tax;
    } else if (gross > 60000) {
      paye = (gross - 60000) * 0.1;
    }

    paye = Math.round(paye);
    const totDeductions = rssbEmp + maternityEmp + paye + deductions;
    const net = gross - totDeductions;

    const slip: Payslip = {
      id: "slip-" + generateId(),
      employeeId: empId,
      employeeName: emp.name,
      period,
      baseSalary: base,
      allowances,
      grossSalary: gross,
      rssbEmployee: rssbEmp,
      maternityLeaveEmployee: maternityEmp,
      paye,
      totalDeductions: totDeductions,
      netPay: net,
      isPaid: true,
      paymentDate: new Date().toISOString().split("T")[0]
    };

    state.payslips.unshift(slip);
    generatedSlips.push(slip);

    totalGross += gross;
    totalPAYE += paye;
    totalRSSB += (rssbEmp + Math.round(base * 0.05)); // adding matching employer RSSB 5%
    totalMaternity += (maternityEmp + Math.round(base * 0.0015)); // matching 0.15% employer maternity levy
  });

  // Balanced double entry ledger posting for Payroll salaries overhead
  // Salaries expense (acc-5200) DEBIT total gross + matching employer pension (gross + 5.15% basic)
  const matchingOverheadPensionAndMaternity = Math.round(generatedSlips.reduce((sum, s) => {
    return sum + (s.baseSalary * 0.05) + (s.baseSalary * 0.0015);
  }, 0));

  const totalPayrollDebitExpense = totalGross + matchingOverheadPensionAndMaternity;
  const payeAccount = "acc-2300";
  const rssbAccount = "acc-2400";
  const checkingBkAccount = "acc-1010"; // salaries cash reduction

  const actualDisbursedNetTotal = generatedSlips.reduce((sum, s) => sum + s.netPay, 0);

  // Journal Posting:
  postJournalEntry({
    date: new Date().toISOString().split("T")[0],
    reference: `PAY-${period.replace(/\s+/g, "-")}`,
    narration: `Process month salary runs for ${period}`,
    lines: [
      { accountId: "acc-5200", debit: totalPayrollDebitExpense, credit: 0, memo: `Gross salaries plus employer statutory matching` },
      { accountId: payeAccount, debit: 0, credit: totalPAYE, memo: `Withheld PAYE income taxes` },
      { accountId: rssbAccount, debit: 0, credit: totalRSSB, memo: `RSSB obligations (employee portion & 5% employer matching)` },
      { accountId: checkingBkAccount, debit: 0, credit: actualDisbursedNetTotal, memo: `BK account bank salaries net payouts disbursement` }
    ],
    branchId: "br-1"
  });

  // Track tax obligation triggers automatically for RRA compliance summaries
  state.taxObligations.unshift({
    id: "tax-ob-" + generateId(),
    period,
    type: "PAYE",
    taxableAmount: totalGross,
    taxDue: totalPAYE,
    status: "PENDING",
    dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0] // standard 15th of next month
  });

  state.taxObligations.unshift({
    id: "tax-ob-" + generateId(),
    period,
    type: "RSSB",
    taxableAmount: totalGross,
    taxDue: totalRSSB,
    status: "PENDING",
    dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]
  });

  createAudit(userEmail, userRole, "EXECUTE_PAYROLL_RUN", null, generatedSlips);
  saveState();
  res.json({ success: true, payslips: state.payslips, taxObligations: state.taxObligations, accounts: state.accounts });
});

// API: Configurable tax calculations summary (direct computation for client viewing)
app.get("/api/tax/summary", (req, res) => {
  // VAT Output is total VAT collected from invoices
  const vatOutput = state.invoices.reduce((sum, i) => sum + i.taxTotal, 0);
  
  // VAT Input is VAT paid on expense vouchers + VAT paid on supplier Bills
  const vatInputExpenses = state.expenses.reduce((sum, e) => sum + e.taxAmount, 0);
  const vatInputBills = state.bills.reduce((sum, b) => sum + b.taxTotal, 0);
  const vatInput = vatInputExpenses + vatInputBills;
  
  const vatObligation = vatOutput - vatInput;

  // PAYE
  const payeObligation = state.payslips.reduce((sum, p) => sum + p.paye, 0);

  // RSSB
  const baseSalariesSum = state.payslips.reduce((sum, p) => sum + p.baseSalary, 0);
  const rssbObligation = Math.round(baseSalariesSum * (0.03 + 0.05)); // employee 3% + employer 5%

  res.json({
    vatOutput,
    vatInput,
    vatObligation,
    payeObligation,
    rssbObligation,
    period: "Q2 2026",
    currency: "RWF"
  });
});

// API: Embedded AI Assistant utilizing Gemini - Secure route
app.post("/api/ai/query", async (req, res) => {
  const { query, history } = req.body;
  if (!query) {
    return res.status(400).json({ error: "A prompt is required for the financial AI assistant." });
  }

  try {
    // Collect server environment configurations
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      return res.status(500).json({ error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your secrets settings." });
    }

    // Initialize custom GoogleGenAI client with required header
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Feed condensed database context safely so model can query and interpret exact parameters
    const totalRevenue = state.accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = state.accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
    const bankBkBal = state.accounts.find(a => a.code === "1010")?.balance || 0;
    const bankMoMoBal = state.accounts.find(a => a.code === "1020")?.balance || 0;
    const vatPayable = state.accounts.find(a => a.code === "2200")?.balance || 0;
    const customerCount = state.customers.length;
    
    const unpaidInvoices = state.invoices.filter(i => i.status !== SalesStatus.PAID);
    const inventoryVal = state.products.reduce((sum, p) => sum + (p.stockCount * p.costPrice), 0);

    const condensedContext = `
You are KoraBooks Assistant - an expert Financial AI consultant and tax auditor specializing in East African and Rwandan small businesses (SMEs).

Below is the real-time financial snapshot of Murakoze General Builders Ltd:
- Total Revenue/Sales: ${totalRevenue.toLocaleString()} RWF
- Total Overhead Expenses: ${totalExpenses.toLocaleString()} RWF
- Nets Profits (Revenue - Expenses): ${(totalRevenue - totalExpenses).toLocaleString()} RWF
- Bank of Kigali Checking Cash: ${bankBkBal.toLocaleString()} RWF
- MTN MoMo Commercial wallet cash: ${bankMoMoBal.toLocaleString()} RWF
- RRA VAT Net Payable obligation: ${vatPayable.toLocaleString()} RWF
- Customers database size: ${customerCount} clients
- Number of active unpaid invoices: ${unpaidInvoices.length} orders
- Current active inventory asset value: ${inventoryVal.toLocaleString()} RWF

Active products:
${state.products.map(p => `- ${p.name} (SKU: ${p.sku}) | Selling Price: ${p.sellingPrice} RWF | Stock Level: ${p.stockCount}`).join("\n")}

Active Unpaid Invoices:
${unpaidInvoices.map(i => `- ${i.invoiceNumber} | Customer: ${i.customerName} | Due: ${i.dueDate} | Amount: ${i.total} RWF | Owed: ${i.total - i.amountPaid} RWF`).join("\n")}

Rwandan Tax Reference rules:
- VAT: Standard 18% Output/Sales, credit Input/Expenses.
- PAYE (as of 2026/Recent progressive limits): 0% up to 60k, 10% from 60k-100k, 20% from 100k-200k, 30% above 200k gross RWF basic.
- RSSB Pension: Employee 3%, Employer 5%.

Provide clear, professional, direct financial insights, answering in beautifully-spaced markdown format. Treat queries with technical rigor. Do not use generic answers. Calculate specific values (e.g. cash flow predictions, VAT optimizations) based strictly on these figures. Keep answers humble, constructive, and tailored for Rwandan business operators.
`;

    // Map conversation history
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Append current prompt user search
    formattedContents.push({
      role: "user",
      parts: [{ text: query }]
    });

    // Request from the chosen high-performance model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: condensedContext
      }
    });

    const reply = response.text || "Apologies, the advisor could not derive a response. Let me try again.";
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini API server invoke error:", err);
    res.status(500).json({ error: err.message || "Failed calling server-side GenAI insights engine." });
  }
});

// Serve frontend assets
const distPath = path.join(process.cwd(), "dist");
if (process.env.NODE_ENV === "production" || fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA Fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Vite dev mode mounting
  const startDevVite = async () => {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteInstance.middlewares);
  };
  startDevVite();
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`KoraBooks Cloud Back Server active on port ${PORT}`);
});
