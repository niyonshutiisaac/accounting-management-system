/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Sparkle, 
  LayoutDashboard, 
  BookOpen, 
  ShieldAlert, 
  Coins, 
  Warehouse, 
  Users, 
  FileText, 
  Landmark, 
  Network, 
  Info, 
  Check, 
  ArrowRight, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Menu, 
  X, 
  ArrowUpRight 
} from "lucide-react";

// Import modular sub-components
import Overview from "./components/Overview";
import Ledger from "./components/Ledger";
import Invoicing from "./components/Invoicing";
import Stock from "./components/Stock";
import Personnel from "./components/Personnel";
import Compliance from "./components/Compliance";
import HelpDesk from "./components/HelpDesk";
import SecurityAudit from "./components/SecurityAudit";

import { 
  Organization, 
  Branch, 
  Account, 
  Customer, 
  Supplier, 
  Product, 
  Invoice, 
  Quotation, 
  StockTransfer, 
  Employee, 
  Payslip, 
  AuditLog, 
  TaxType 
} from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeScreen, setActiveScreen] = useState<
    "dashboard" | "ledger" | "sales" | "inventory" | "payroll" | "compliance" | "ai" | "security"
  >("dashboard");

  // Dynamic entity structures
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);

  const [currentBranchId, setCurrentBranchId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Synchronise state with server API
  const syncServerDataset = async () => {
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setBranches(data.branches || []);
        setAccounts(data.accounts || []);
        setCustomers(data.customers || []);
        setSuppliers(data.suppliers || []);
        setProducts(data.products || []);
        setInvoices(data.invoices || []);
        setQuotations(data.quotations || []);
        setStockTransfers(data.stockTransfers || []);
        setEmployees(data.employees || []);
        setPayslips(data.payslips || []);
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error("Critical: Could not connect to full-stack Express service, falling back.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncServerDataset();
  }, []);

  // Post new Journal Entry
  const handlePostJournal = async (params: {
    date: string;
    reference: string;
    narration: string;
    lines: { accountId: string; debit: number; credit: number; memo?: string }[];
    branchId: string;
  }) => {
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "POST_JOURNAL", ...params })
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Issue Sale Invoice
  const handleEmitInvoice = async (params: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discount?: number; taxType: TaxType }>;
    dueDate: string;
    branchId: string;
  }) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Issue Quotation
  const handleEmitQuotation = async (params: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discount?: number; taxType: TaxType }>;
    validUntil: string;
    branchId: string;
  }) => {
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Convert Quotation to Invoice
  const handleConvertQuotation = async (quoteId: string) => {
    try {
      const response = await fetch("/api/quotations/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId })
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Stock Transfer Dispatch
  const handleStockTransfer = async (params: {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
  }) => {
    try {
      const response = await fetch("/api/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Stock adjustments
  const handleStockAdjust = async (params: {
    productId: string;
    branchId: string;
    difference: number;
    reason: string;
  }) => {
    try {
      const response = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Execute Periodic payroll run
  const handlePayrollRun = async (params: {
    period: string;
    employeeIds: string[];
  }) => {
    try {
      const response = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Save RRA Corporate Tax Setting
  const handleSaveTaxSettings = async (params: { tin: string; ebmEnabled: boolean; vatRate: number }) => {
    try {
      const response = await fetch("/api/settings/tintax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // MTN Mobile money pay stub simulation
  const handleSimulateMoMo = async (params: { phone: string; amount: number; invoiceId: string }) => {
    try {
      const response = await fetch("/api/momo/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        await syncServerDataset();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Gemini Artificial Query assistant
  const handleQueryAI = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (response.ok) {
        const bodyMsg = await response.json();
        return bodyMsg.text;
      }
    } catch (err) {
      console.error(err);
    }
    return "I encountered minor latency trying to resolve your request. Please try again.";
  };

  if (loading || !organization) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-white" id="initial-loading-splash">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-white rounded-full animate-spin"></div>
        <h2 className="mt-4 font-bold tracking-wider font-sans text-sm text-slate-300">Synchronising KoraBooks Ledgers...</h2>
        <p className="text-xs text-slate-500 mt-1">Contacting secure cloud server nodes</p>
      </div>
    );
  }

  // PUBLIC MARKETING AND SALES WEBSITE INTERFACE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="marketing-public-page">
        
        {/* Navigation Bar Header marketing */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-30 flex items-center justify-between" id="public-navbar">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-slate-900 tracking-tight text-base leading-none">KoraBooks</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-semibold uppercase block mt-1">SME PLATFORM</span>
            </div>
          </div>

          <div className="hidden md:flex gap-8 text-xs font-semibold text-slate-650 tracking-tight">
            <a href="#pro-accounting" className="hover:text-indigo-600">Accounting</a>
            <a href="#compliance-focus" className="hover:text-indigo-600">RRA Compliance</a>
            <a href="#momo-payouts" className="hover:text-indigo-600">Mobile Money API</a>
            <a href="#pricing-grid" className="hover:text-indigo-600">Pricing Packages</a>
          </div>

          <button
            onClick={() => setIsAuthenticated(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-indigo-750 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Enter App Portal
          </button>
        </header>

        {/* HERO BLOCK */}
        <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" id="marketing-hero">
          <div className="space-y-6">
            <div className="p-1 px-3 bg-indigo-50 border border-indigo-100 rounded-full inline-flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest leading-none">
              <Sparkle className="w-3 h-3 animate-pulse text-indigo-600" /> Proudly Made For East African SME Expansion
            </div>
            <h2 className="text-4xl md:text-5xl font-sans font-bold text-slate-900 tracking-tight leading-[1.08] lg:-mr-12">
              The Enterprise-grade <span className="text-indigo-600 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Accounting & Tax Filing</span> Workspace.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Empower your Rwandan enterprise with localized double-entry bookkeeping, progressive payroll tax matrices (PAYE / RSSB), automated EBM v2 inventory tracking, and integrated MTN Mobile money merchant pay-ins. Completely synchronized out-of-the-box.
            </p>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setIsAuthenticated(true)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
              >
                Launch Sandbox Environment <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#pricing-grid"
                className="px-5 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1"
              >
                Review Plans
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-left font-mono text-[10px] text-slate-400">
              <div>
                <span className="block font-bold text-lg text-slate-800 font-sans">100%</span>
                RRA Compliant Returns
              </div>
              <div>
                <span className="block font-bold text-lg text-slate-800 font-sans">API</span>
                MTN MoMo Built-in
              </div>
              <div>
                <span className="block font-bold text-lg text-slate-800 font-sans">AI</span>
                Embedded Gemini Advisor
              </div>
            </div>
          </div>

          {/* Graphical Mockup Card */}
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden" id="hero-graphic">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-400 tracking-wider text-[10px]">ORGANIZATION ACTIVITY (KIGALI)</span>
                <span className="p-1 px-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold tracking-wide rounded-md text-[9px] uppercase font-mono">LIVE CONNECTED</span>
              </div>

              <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800/80 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans font-bold text-white">Murakoze Builders Ltd</span>
                  <div className="p-1 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-bold">TIN: 100789524</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Chart status</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">18,540,200 RWF</div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>

              {/* Invoicing sample row */}
              <div className="bg-slate-850/30 p-2.5 rounded-xl border border-slate-800/50 flex justify-between items-center text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-300">Invoice: INV-2026-001</span>
                </div>
                <span className="text-slate-300 font-bold">4,500,000 RWF</span>
              </div>
            </div>

          </div>
        </section>

        {/* COMPLIANCE FOCUS CARDS */}
        <section className="bg-white border-y border-slate-100 py-16 px-6 md:px-12" id="compliance-focus">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Robust Bookkeeping Grounded in East African Law</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Avoid compliance fines. KoraBooks was architected and structured around recent Rwanda Revenue Authority and RSSB social codes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-medium">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100/70 text-xs text-slate-650 space-y-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
                  <Landmark className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Double-Entry Verification</h4>
                <p>Immutable general ledger records. Automated debit-credit balances checking prevents transaction errors for local accountants.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100/70 text-xs text-slate-650 space-y-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg w-fit">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">RRA Statutory Payroll</h4>
                <p>Fully compliant with monthly PAYE progressive tax rules, RSSB pensions (3% employees, 5% employers), and professional Maternity leave levies.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100/70 text-xs text-slate-650 space-y-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit">
                  <Warehouse className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">EBM Inventory Sync</h4>
                <p>Maintains dynamic stock allocations across warehouses. When invoicing, inventories decrease and CoGS calculate instantly.</p>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING PLANS */}
        <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto space-y-12" id="pricing-grid">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Fair, Structured Pricing Packages</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scale comfortably. Switch or terminate plans easily as your business grows. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Starter Plan</span>
                <h4 className="text-2xl font-mono font-bold text-slate-850">25,000 <span className="text-xs text-slate-400 font-sans font-medium">RWF/Month</span></h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">Perfect for sole trades and newly registered SME businesses.</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5 font-medium border-t border-slate-50 pt-4 flex-1">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Local General Ledger</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> 1 Operational Branch</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Up to 5 Employees</li>
              </ul>
              <button onClick={() => setIsAuthenticated(true)} className="w-full py-2.5 font-bold text-xs text-indigo-600 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer">
                Unlock Starter Sandbox
              </button>
            </div>

            {/* Professional Plan (Highly Recommended) */}
            <div className="bg-slate-905 bg-slate-900 text-white p-6 rounded-2xl border border-indigo-700/30 flex flex-col justify-between space-y-6 relative shadow-xl">
              <span className="absolute -top-3 left-6 font-sans text-[9px] font-bold uppercase tracking-widest bg-indigo-600 text-white px-3 py-1 rounded-full border border-indigo-500">
                RECOMMENDED PACK
              </span>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-350 uppercase tracking-widest block pt-2">Professional Growth</span>
                <h4 className="text-2xl font-mono font-bold text-white">55,000 <span className="text-xs text-slate-400 font-normal">RWF/Month</span></h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">Ideal for established local builders and multi-branch suppliers.</p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 font-medium border-t border-slate-800 pt-4 flex-1">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited double-ledger COAs</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Multi-branch Stock Transfers</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Integrated MTN Mobile Money</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Automated RRA progressive PAYE</li>
              </ul>
              <button onClick={() => setIsAuthenticated(true)} className="w-full py-2.5 font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg rounded-xl cursor-pointer">
                Launch Corporate Portal
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enterprise Compliant</span>
                <h4 className="text-2xl font-mono font-bold text-slate-850">120,000 <span className="text-xs text-slate-400 font-sans font-medium">RWF/Month</span></h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">Custom setups built specifically for massive raw construction firms.</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5 font-medium border-t border-slate-50 pt-4 flex-1">
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Dedicated Cloud SQL Database</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Custom EBM v2 REST Endpoints</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> SOC-2 Auditing Integrately</li>
                <li className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> 24/7 Dedicated Accountant</li>
              </ul>
              <button onClick={() => setIsAuthenticated(true)} className="w-full py-2.5 font-bold text-xs text-indigo-600 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer">
                Contact Enterprise Desk
              </button>
            </div>

          </div>
        </section>

        {/* FOOTER marketing */}
        <footer className="bg-white border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400 font-sans" id="public-footer">
          <p>© 2026 KoraBooks Inc. Registered Partner of Rwanda Revenue Authority compliance desks. All rights reserved.</p>
        </footer>

      </div>
    );
  }

  // INTERNAL WORKSPACE SAAS APPLICATION VIEWS
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row" id="core-application-viewport">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col justify-between shrink-0" id="saas-sidebar">
        
        <div className="space-y-6">
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm block leading-none font-sans">KoraBooks</span>
                <span className="text-[9px] font-mono tracking-widest text-indigo-300 font-bold block mt-1">MURAKOZE PORTAL</span>
              </div>
            </div>
            
            {/* Branch selector widget */}
            <div className="text-xs font-mono">
              <select
                value={currentBranchId}
                onChange={e => setCurrentBranchId(e.target.value)}
                className="bg-slate-800 text-slate-350 p-1 px-2 rounded border border-slate-700 font-mono text-[9px] focus:outline-hidden"
              >
                <option value="all">🌐 All Branches</option>
                <option value="br-1">📍 Kigali HO</option>
                <option value="br-2">📍 Rubavu Depot</option>
              </select>
            </div>
          </div>

          {/* SaaS Navigation elements */}
          <nav className="px-3 space-y-1 text-xs" id="sidebar-nav-items">
            {[
              { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
              { id: "ledger", label: "Double-Entry Ledger", icon: BookOpen },
              { id: "sales", label: "Sales & Invoicing", icon: Coins },
              { id: "inventory", label: "Inventory & Warehousing", icon: Warehouse },
              { id: "payroll", label: "Statutory Payroll", icon: Users },
              { id: "compliance", label: "RRA Tax compliance", icon: Landmark },
              { id: "ai", label: "Gemini Smart Advisor", icon: Sparkles },
              { id: "security", label: "SOC-2 Audits Trail", icon: ShieldAlert }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveScreen(item.id as any); setMobileMenuOpen(false); }}
                  className={`w-full p-2.5 rounded-lg font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                    activeScreen === item.id
                      ? "bg-indigo-600 text-white shadow-md font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile and Logouts */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[10px] font-sans">Active User Profile</span>
            <div className="font-bold font-sans text-slate-300">niyonshutiisaac7@gmail.com</div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-1 px-2 bg-slate-800 hover:bg-slate-705 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 transition-all rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </aside>

      {/* CORE CONTROLLER AREA */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-h-screen overflow-y-auto" id="application-body">
        
        {/* Dynamic Screen Container title bar wrapper */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 text-xs font-sans">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight capitalize">
              {activeScreen === "dashboard" && "SME Executive Dashboard"}
              {activeScreen === "ledger" && "General Double-Entry Ledger"}
              {activeScreen === "sales" && "Sales & Customer Invoices"}
              {activeScreen === "inventory" && "Warehouse stock counts & Transfers"}
              {activeScreen === "payroll" && "Progressive PAYE & Pensions Payroll"}
              {activeScreen === "compliance" && "RRA Statutory Declarations summary"}
              {activeScreen === "ai" && "Gemini Artificial Intelligent Copilot"}
              {activeScreen === "security" && "Immutable Audit logs"}
            </h2>
            <p className="text-xs text-slate-400">
              {activeScreen === "dashboard" && "General operational summary of Murakoze General Builders Ltd."}
              {activeScreen === "ledger" && "Chart of accounts, journals bookings, and financial worksheets."}
              {activeScreen === "sales" && "Quotations, standard invoice payouts, and direct MTN MoMo Merchant pushes."}
              {activeScreen === "inventory" && "Manage SKUs and stocks transfer logistics between branch hubs."}
              {activeScreen === "payroll" && "Progressive PAYE table, RSSB pensions, and electronic payslips builder."}
              {activeScreen === "compliance" && "Output tax, input claim offset worksheet, and RRA parameters."}
              {activeScreen === "ai" && "Ask Gemini questions regarding accounts balances or anomalies logs."}
              {activeScreen === "security" && "Immutable trails snapshotting before-after value differences."}
            </p>
          </div>

          <div className="text-slate-400 text-xs font-mono font-medium hidden md:block">
            Database Status: <span className="bg-emerald-50 border border-emerald-100/70 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-wide">Ready</span>
          </div>
        </div>

        {/* SCREEN ROUTER CONDITIONAL VIEWPORT */}
        <div className="space-y-6 animate-fade-in" id="core-screen-routers">
          {activeScreen === "dashboard" && (
            <Overview 
              organization={organization}
              branches={branches}
              accounts={accounts}
              products={products}
              invoices={invoices}
              currentBranchId={currentBranchId}
            />
          )}

          {activeScreen === "ledger" && (
            <Ledger 
              accounts={accounts}
              journals={quotations.reduce((accJournals: any[], q) => {
                // If converted, mock/merge journal mappings
                return accJournals;
              }, audits.filter(a => a.action === "POST_JOURNAL").map(a => {
                return {
                  id: a.id,
                  reference: a.entityId,
                  date: a.timestamp.split(" ")[0],
                  narration: "Manual audited double entry posting",
                  branchId: "br-1",
                  lines: []
                };
              }))}
              currentBranchId={currentBranchId}
              onPostJournal={handlePostJournal}
            />
          )}

          {activeScreen === "sales" && (
            <Invoicing 
              customers={customers}
              invoices={invoices}
              quotations={quotations}
              products={products}
              currentBranchId={currentBranchId}
              onEmitInvoice={handleEmitInvoice}
              onEmitQuotation={handleEmitQuotation}
              onConvertQuotation={handleConvertQuotation}
              onSimulateMoMo={handleSimulateMoMo}
            />
          )}

          {activeScreen === "inventory" && (
            <Stock 
              products={products}
              stockTransfers={stockTransfers}
              branches={branches}
              onStockTransfer={handleStockTransfer}
              onStockAdjust={handleStockAdjust}
            />
          )}

          {activeScreen === "payroll" && (
            <Personnel 
              employees={employees}
              payslips={payslips}
              onPayrollRun={handlePayrollRun}
            />
          )}

          {activeScreen === "compliance" && (
            <Compliance 
              organization={organization}
              accounts={accounts}
              onSaveTaxSettings={handleSaveTaxSettings}
            />
          )}

          {activeScreen === "ai" && (
            <HelpDesk 
              onQueryAI={handleQueryAI}
            />
          )}

          {activeScreen === "security" && (
            <SecurityAudit 
              audits={audits}
            />
          )}
        </div>

      </main>

    </div>
  );
}
