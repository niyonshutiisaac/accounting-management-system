/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  DollarSign, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Users, 
  Warehouse, 
  Wallet2, 
  Coins, 
  AlertTriangle 
} from "lucide-react";
import { Organization, Branch, Account, Product, Invoice, SalesStatus } from "../types";

interface OverviewProps {
  organization: Organization;
  branches: Branch[];
  accounts: Account[];
  products: Product[];
  invoices: Invoice[];
  currentBranchId: string;
}

export default function Overview({
  organization,
  branches,
  accounts,
  products,
  invoices,
  currentBranchId
}: OverviewProps) {
  
  // Calculate general values
  const activeCurrency = organization.currency;

  const totalRevenue = accounts
    .filter(a => a.type === "REVENUE")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalExpenses = accounts
    .filter(a => a.type === "EXPENSE")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const netProfit = totalRevenue - totalExpenses;

  const bkBalance = accounts.find(a => a.code === "1010")?.balance || 0;
  const momoBalance = accounts.find(a => a.code === "1020")?.balance || 0;
  const cashAccountsTotal = Number(bkBalance) + Number(momoBalance);

  const outstandingReceivables = invoices
    .filter(i => i.status !== SalesStatus.PAID)
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0);

  const totalTaxLiability = accounts.find(a => a.code === "2200")?.balance || 0;

  const lowStockThreshold = 100;
  const lowStockItems = products.filter(p => p.stockCount <= p.reorderLevel);

  // Filter invoices for current branch
  const filteredInvoices = currentBranchId === "all" 
    ? invoices 
    : invoices.filter(i => i.branchId === currentBranchId);

  return (
    <div className="space-y-6" id="dashboard-widget-container">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stat-cards">
        
        {/* Net Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id="card-revenue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-slate-800">
              {Number(totalRevenue).toLocaleString()} <span className="text-sm font-normal text-slate-400">{activeCurrency}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium font-mono">↑ 12.4%</span> vs. previous Q
            </p>
          </div>
        </div>

        {/* Operating Profits */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id="card-profit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Operating Profit</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-slate-800" : "text-rose-600"}`}>
              {Math.abs(netProfit).toLocaleString()} <span className="text-sm font-normal text-slate-400">{activeCurrency}</span>
              {netProfit < 0 && " (Loss)"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Operating Margin: <span className="text-slate-700 font-semibold font-mono">
                {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0"}%
              </span>
            </p>
          </div>
        </div>

        {/* Total Cash on Hand */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id="card-cash-reserves">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cash Reserves</span>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Wallet2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-slate-800">
              {cashAccountsTotal.toLocaleString()} <span className="text-sm font-normal text-slate-400">{activeCurrency}</span>
            </h3>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>BK: {Number(bkBalance).toLocaleString()}</span>
              <span>MoMo: {Number(momoBalance).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id="card-receivables">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Invoices</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono text-slate-800">
              {outstandingReceivables.toLocaleString()} <span className="text-sm font-normal text-slate-400">{activeCurrency}</span>
            </h3>
            <p className="text-xs text-rose-500 font-medium mt-1">
              Collectibles awaiting settlement
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Charts and Inventory Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-layout">
        
        {/* Dynamic Financial Flow Trend SVG */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2" id="trend-analysis-chart">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Quarterly Cash Flow and Operating Curve</h4>
              <p className="text-xs text-slate-400">Interactive visual distribution of sales income</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-indigo-500 block"></span>Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-slate-300 block"></span>Expenses</span>
            </div>
          </div>

          <div className="h-64 flex flex-col justify-between" id="dashboard-trend-graph">
            {/* Embedded high contrast responsive SVG Curve */}
            <div className="relative w-full h-48 bg-slate-50/50 rounded-lg border border-slate-100/50 p-4">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Shaded Area underneath the Income Curve */}
                <path 
                  d="M 50,150 Q 150,80 250,110 T 450,40 T 550,60 L 550,180 L 50,180 Z" 
                  fill="url(#indigo-gradient)" 
                  opacity="0.15" 
                />

                {/* Revenue Wave Line */}
                <path 
                  d="M 50,150 Q 150,80 250,110 T 450,40 T 550,60" 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />

                {/* Expense Baseline Wave */}
                <path 
                  d="M 50,170 Q 150,130 250,140 T 450,110 T 550,120" 
                  fill="none" 
                  stroke="#94a3b8" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeDasharray="2"
                />

                {/* Graph Data Circles */}
                <circle cx="250" cy="110" r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="450" cy="40" r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="550" cy="60" r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />

                {/* Definitions */}
                <defs>
                  <linearGradient id="indigo-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-1 left-0 right-0 px-8 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Jan (RWF)</span>
                <span>Feb</span>
                <span>Mar (Audit)</span>
                <span>Apr</span>
                <span>May (Current)</span>
                <span>Jun (Proj)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-50 text-slate-400">
              <span>Financial statements closing current cycle in progress.</span>
              <span className="font-mono text-indigo-600 font-semibold uppercase tracking-wider">Balanced ledgers</span>
            </div>
          </div>
        </div>

        {/* East Africa / Rwanda Statutory and VAT Due */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between" id="statutory-compliance-metrics">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Tax & Regulatory Duties</h4>
            <p className="text-xs text-slate-400 mb-4">Rwanda Revenue Authority (RRA) compliance</p>
            
            <div className="space-y-4">
              
              {/* VAT Standard Duty */}
              <div className="p-3 bg-slate-50/55 rounded-lg border border-slate-100/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>VAT (RRA Standard 18%)
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {Number(totalTaxLiability).toLocaleString()} {activeCurrency}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "65%" }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Input tax offset active</span>
                  <span>Due 15th next month</span>
                </div>
              </div>

              {/* PAYE Employee Tax Pool */}
              <div className="p-3 bg-slate-50/55 rounded-lg border border-slate-100/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>PAYE Payroll Reserves
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {Number(accounts.find(a => a.code === "2300")?.balance || 0).toLocaleString()} {activeCurrency}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>RRA Progressive Table applied</span>
                  <span>Due 15th next month</span>
                </div>
              </div>

              {/* RSSB Social Pension Pool */}
              <div className="p-3 bg-slate-50/55 rounded-lg border border-slate-100/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>RSSB Pension Obligations
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {Number(accounts.find(a => a.code === "2400")?.balance || 0).toLocaleString()} {activeCurrency}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "38%" }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3% Employee + 5% Employer</span>
                  <span>Monthly return required</span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600 bg-amber-50/40 p-2.5 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Confirm and double check with direct RRA compliance reports before processing VAT.</span>
          </div>

        </div>
      </div>

      {/* Warning/Alert notifications for low reorder levels */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-rose-800 text-xs shadow-xs" id="dashboard-stock-alerts">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-rose-950">Statutory Reorder Level Trigger Warnings</h5>
            <p className="text-rose-600/90 mt-0.5">The following warehouse physical items fallen under conservative margins. Process stock transfers or generate supplier replenishment Bill order:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {lowStockItems.map(p => (
                <div key={p.id} className="bg-white p-2 rounded-md border border-rose-100/50 flex justify-between font-mono font-medium shadow-2xs">
                  <span className="text-slate-700 font-sans">{p.name}</span>
                  <span className="text-rose-600">{p.stockCount} / {p.reorderLevel} Left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Mini-table */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="dashboard-recents-list">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">Historical Orders and Sales Activities</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                <th className="p-3">Invoice Code</th>
                <th className="p-3">Organization Client</th>
                <th className="p-3">Emitted Date</th>
                <th className="p-3">Total Invoice Value (RWF)</th>
                <th className="p-3">Amount Received</th>
                <th className="p-3 text-center">Receipt Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
              {filteredInvoices.slice(0, 4).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/40">
                  <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                  <td className="p-3 font-sans text-slate-700">{inv.customerName}</td>
                  <td className="p-3 font-mono">{inv.date}</td>
                  <td className="p-3 font-mono text-slate-900">{Number(inv.total).toLocaleString()} RWF</td>
                  <td className="p-3 font-mono text-emerald-600">{(inv.amountPaid || 0).toLocaleString()} RWF</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      inv.status === SalesStatus.PAID 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : inv.status === SalesStatus.PARTIAL 
                        ? "bg-amber-50 text-amber-700 border border-amber-100" 
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
