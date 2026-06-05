/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Check, Wallet2, Users, Receipt, CalendarClock, Printer, ShieldAlert } from "lucide-react";
import { Employee, Payslip } from "../types";

interface PersonnelProps {
  employees: Employee[];
  payslips: Payslip[];
  onPayrollRun: (params: {
    period: string;
    employeeIds: string[];
  }) => Promise<boolean>;
}

export default function Personnel({
  employees,
  payslips,
  onPayrollRun
}: PersonnelProps) {
  const [activeTab, setActiveTab] = useState<"staff" | "payruns" | "slips">("staff");
  const [periodSel, setPeriodSel] = useState<string>("May 2026");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(employees.map(e => e.id));
  const [paySuccess, setPaySuccess] = useState<boolean>(false);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);

  const toggleStaffSelector = (empId: string) => {
    if (selectedStaffIds.includes(empId)) {
      setSelectedStaffIds(selectedStaffIds.filter(id => id !== empId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, empId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.length === employees.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(employees.map(e => e.id));
    }
  };

  const handleExecutePayrun = async () => {
    if (selectedStaffIds.length === 0) return;
    setPayLoading(true);
    const ok = await onPayrollRun({
      period: periodSel,
      employeeIds: selectedStaffIds
    });
    setPayLoading(false);
    if (ok) {
      setPaySuccess(true);
      setTimeout(() => {
        setPaySuccess(false);
        setActiveTab("slips");
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="personnel-payroll-dashboard">
      
      {/* Sub menu controls */}
      <div className="flex border-b border-slate-100 flex-wrap gap-2 pb-1" id="personnel-nav-tabs">
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "staff"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Employees Registry
        </button>
        <button
          onClick={() => { setSelectedStaffIds(employees.map(e => e.id)); setActiveTab("payruns"); }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "payruns"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Statutory Payroll Payruns
        </button>
        <button
          onClick={() => setActiveTab("slips")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "slips"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Historical Issued Payslips
        </button>
      </div>

      {/* RENDER VIEWPORTS */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="employees-sheet">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">SME Personnel Records</h3>
              <p className="text-xs text-slate-400">Database with Rwanda National Identifiers (NID) checks</p>
            </div>
            <span className="px-3 py-1 font-mono text-xs font-semibold bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-md">
              {employees.length} Staff Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">Staff Member Name</th>
                  <th className="p-3">Rwanda National NID (16 Digs)</th>
                  <th className="p-3">Role / Assignment</th>
                  <th className="p-3">Email Address & Phone</th>
                  <th className="p-3">Disbursement Bank Details</th>
                  <th className="p-3 text-right">Base Salary (Gross M)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-sans text-slate-800 font-bold">{emp.name}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">{emp.nid || "1-1990-8-XXXXXXXX"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-150 rounded text-[9px] font-sans font-bold uppercase text-slate-500">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-400 text-[10px]">
                      <div>{emp.email}</div>
                      <div>{emp.phone}</div>
                    </td>
                    <td className="p-3 font-sans text-slate-500 text-[10px]">
                      {emp.bankAccount}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 font-mono">
                      {Number(emp.baseSalary).toLocaleString()} RWF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATUTORY PAYROLL RUNS */}
      {activeTab === "payruns" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="statutory-payruns-manager">
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6" id="run-payroll-block">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-sans">Run Progressive Payroll</h4>
              <p className="text-xs text-slate-400 font-normal">Calculates PAYE according to recent progressive brackets, RSSB (3% employee Portion) and maternity levels.</p>
            </div>

            {paySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg">
                ✓ Payroll run complete. Financial logs mapped and salary disbursements posted!
              </div>
            )}

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Target Monthly Cycle</label>
                <select
                  className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
                  value={periodSel}
                  onChange={e => setPeriodSel(e.target.value)}
                >
                  <option value="May 2026">May 2026 Payroll Cycle</option>
                  <option value="June 2026">June 2026 Payroll Cycle</option>
                </select>
              </div>

              {/* Selection personnel cards */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Include inside Batch</span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-sans font-semibold cursor-pointer"
                  >
                    Select/Deselect All
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {employees.map(emp => (
                    <div 
                      key={emp.id} 
                      onClick={() => toggleStaffSelector(emp.id)}
                      className={`p-2.5 rounded-lg border text-[11px] flex justify-between items-center cursor-pointer transition-all ${
                        selectedStaffIds.includes(emp.id)
                          ? "border-indigo-150 bg-indigo-50/20"
                          : "border-slate-100 bg-white hover:bg-slate-50/30"
                      }`}
                    >
                      <div className="font-sans font-bold text-slate-800">{emp.name}</div>
                      <div className="font-mono text-slate-500 font-semibold">{emp.baseSalary.toLocaleString()} RWF</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <button
              onClick={handleExecutePayrun}
              disabled={selectedStaffIds.length === 0 || payLoading}
              className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                selectedStaffIds.length > 0 
                  ? "bg-indigo-600 text-white hover:bg-indigo-750 hover:shadow-md"
                  : "bg-slate-50 text-slate-300 pointer-events-none"
              }`}
            >
              {payLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white animate-spin rounded-full"></span> Dispatching payouts...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-4 h-4 shrink-0" /> Commit Period Payroll & File
                </span>
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4 overflow-hidden">
            <h4 className="text-sm font-bold text-slate-800">Progressive Income Tax (PAYE) Table Brackets (Rwanda RRA)</h4>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <p className="leading-relaxed">
                As per direct provisions from the Rwanda Revenue Authority (RRA), progressive monthly employee taxes are automatically evaluated using the progressive salary bracket thresholds below:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                  <div className="font-sans font-bold text-slate-800">Up to 60,000 RWF</div>
                  <div className="text-emerald-600 mt-0.5 font-extrabold text-sm font-mono flex justify-between">
                    <span>Tax Bracket Rate</span> <span>0%</span>
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                  <div className="font-sans font-bold text-slate-800">60,001 to 100,000 RWF</div>
                  <div className="text-indigo-600 mt-0.5 font-extrabold text-sm font-mono flex justify-between">
                    <span>Tax Bracket Rate</span> <span>10%</span>
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                  <div className="font-sans font-bold text-slate-800">100,001 to 200,000 RWF</div>
                  <div className="text-indigo-600 mt-0.5 font-extrabold text-sm font-mono flex justify-between">
                    <span>Tax Bracket Rate</span> <span>20%</span>
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                  <div className="font-sans font-bold text-slate-800">Above 200,000 RWF</div>
                  <div className="text-rose-600 mt-0.5 font-extrabold text-sm font-mono flex justify-between">
                    <span>Tax Bracket Rate</span> <span>30%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 flex gap-2 text-[10px] text-slate-400 items-start">
                <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="font-sans">Matched RSSB Social Security charges (Employee 3% / Employer 5%) and Maternity Levy (employee 0.15% / employer 0.15%) are computed inside overall accounting runs automatically.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* HISTORICAL ISSUED PAYSLIPS */}
      {activeTab === "slips" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="slips-history-view">
          
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 font-sans">Historical Issued Payslips Logs</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70 font-sans">
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Monthly Period</th>
                    <th className="p-3 text-right">Base Salary</th>
                    <th className="p-3 text-right">PAYE Paid</th>
                    <th className="p-3 text-right">Net Received</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold text-[11px]">
                  {payslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-sans text-slate-800 font-bold">{ps.employeeName}</td>
                      <td className="p-3 font-sans">{ps.period}</td>
                      <td className="p-3 text-right">{Number(ps.baseSalary).toLocaleString()} RWF</td>
                      <td className="p-3 text-right text-rose-500">{(ps.paye || 0).toLocaleString()} RWF</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">{(ps.netPay || 0).toLocaleString()} RWF</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedSlip(ps)}
                          className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-sans text-[10px] font-bold rounded hover:bg-indigo-100 opacity-85 hover:opacity-100 cursor-pointer"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Payslip Printable detail popup block */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
            {selectedSlip ? (
              <div className="space-y-6" id="slip-detailed-form">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-start text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[10px] uppercase font-sans text-slate-400">PAYSLIP RECEIPT</span>
                    <div className="font-bold font-sans text-slate-800">{selectedSlip.employeeName}</div>
                    <div className="text-slate-400 text-[10px]">{selectedSlip.period} Period</div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-1 px-2.5 border border-slate-150 text-slate-600 hover:bg-slate-100 font-sans font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs border-b border-slate-100 pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Base Salary Earnings</span>
                    <span className="font-bold text-slate-800">{Number(selectedSlip.baseSalary).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Allowances & Bonuses</span>
                    <span className="font-bold text-slate-800">+{Number(selectedSlip.allowances || 0).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] italic pl-2 border-l border-slate-150">
                    <span className="font-sans">Gross Statement Salary</span>
                    <span>{Number(selectedSlip.grossSalary).toLocaleString()} RWF</span>
                  </div>
                  
                  <div className="text-[10px] uppercase font-sans font-bold text-rose-400 pt-2">Statutory Deductions (RRA)</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Progressive PAYE Tax</span>
                    <span className="font-bold text-rose-500">-{Number(selectedSlip.paye).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">RSSB Pension Contribution (3%)</span>
                    <span className="font-bold text-rose-500">-{Number(selectedSlip.rssbEmployee).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Maternity Leave Levy (0.15%)</span>
                    <span className="font-bold text-rose-500">-{Number(selectedSlip.maternityLeaveEmployee).toLocaleString()} RWF</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-sans text-slate-700 text-xs">Reconciled Net Payoff</span>
                  <span className="font-mono text-emerald-600 text-base font-extrabold">{Number(selectedSlip.netPay).toLocaleString()} RWF</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-sans space-y-2">
                <Printer className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Select an issued staff payslip log from the list to display direct audit receipts.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
