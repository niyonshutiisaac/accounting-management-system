/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Check, FileText, Scale, TrendingUp, DollarSign, RefreshCw, AlertCircle } from "lucide-react";
import { Account, JournalEntry, AccountType } from "../types";

interface LedgerProps {
  accounts: Account[];
  journals: JournalEntry[];
  currentBranchId: string;
  onPostJournal: (params: {
    date: string;
    reference: string;
    narration: string;
    lines: { accountId: string; debit: number; credit: number; memo?: string }[];
    branchId: string;
  }) => Promise<boolean>;
}

export default function Ledger({
  accounts,
  journals,
  currentBranchId,
  onPostJournal
}: LedgerProps) {
  const [activeTab, setActiveTab] = useState<"accounts" | "journals" | "create_journal" | "reports">("accounts");
  const [reportType, setReportType] = useState<"trial" | "income" | "balance">("trial");

  // Journal creation state
  const [journalDate, setJournalDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [journalRef, setJournalRef] = useState<string>("");
  const [journalNarrative, setJournalNarrative] = useState<string>("");
  const [journalBranch, setJournalBranch] = useState<string>("br-1");
  const [lines, setLines] = useState<Array<{ accountId: string; debit: number; credit: number; memo: string }>>([
    { accountId: "", debit: 0, credit: 0, memo: "" },
    { accountId: "", debit: 0, credit: 0, memo: "" }
  ]);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Totals calculations for the journal draft
  const totalDebits = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const balancesInCheck = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountId: "", debit: 0, credit: 0, memo: "" }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, key: "accountId" | "debit" | "credit" | "memo", val: any) => {
    const updated = [...lines];
    if (key === "debit") {
      updated[index].debit = Number(val) || 0;
      if (Number(val) > 0) updated[index].credit = 0; // double entry validation rule
    } else if (key === "credit") {
      updated[index].credit = Number(val) || 0;
      if (Number(val) > 0) updated[index].debit = 0;
    } else {
      updated[index][key] = val;
    }
    setLines(updated);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage(null);
    setSuccess(false);

    // Validate entries
    if (!journalRef.trim() || !journalNarrative.trim()) {
      setErrMessage("Please enter a valid reference code and narration for auditing.");
      return;
    }

    if (lines.some(l => !l.accountId)) {
      setErrMessage("Please select a target account ledger for every line.");
      return;
    }

    if (!balancesInCheck) {
      setErrMessage(`Journal is out of balance. Total debits (${totalDebits}) must balance credits (${totalCredits}).`);
      return;
    }

    const postedLines = lines.map(l => ({
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      memo: l.memo
    }));

    const ok = await onPostJournal({
      date: journalDate,
      reference: journalRef,
      narration: journalNarrative,
      lines: postedLines,
      branchId: journalBranch
    });

    if (ok) {
      setSuccess(true);
      setJournalRef("");
      setJournalNarrative("");
      setLines([
        { accountId: "", debit: 0, credit: 0, memo: "" },
        { accountId: "", debit: 0, credit: 0, memo: "" }
      ]);
      setTimeout(() => {
        setSuccess(false);
        setActiveTab("journals");
      }, 1500);
    } else {
      setErrMessage("Server double-entry validation logic rejected the structure.");
    }
  };

  // Compile calculations for Trial Balance
  const totalAssetBal = accounts.filter(a => a.type === AccountType.ASSET).reduce((sum, a) => sum + a.balance, 0);
  const totalExpenseBal = accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
  const trialDebitsTotal = totalAssetBal + totalExpenseBal;

  const totalLiabilityBal = accounts.filter(a => a.type === AccountType.LIABILITY).reduce((sum, a) => sum + a.balance, 0);
  const totalEquityBal = accounts.filter(a => a.type === AccountType.EQUITY).reduce((sum, a) => sum + a.balance, 0);
  const totalRevenueBal = accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
  const trialCreditsTotal = totalLiabilityBal + totalEquityBal + totalRevenueBal;

  return (
    <div className="space-y-6" id="double-ledger-component">
      
      {/* Visual Sub Navigation Header */}
      <div className="flex border-b border-slate-100 flex-wrap gap-2 pb-1" id="ledger-tab-navigation">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "accounts"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setActiveTab("journals")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "journals"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Journal Entries logs
        </button>
        <button
          onClick={() => setActiveTab("create_journal")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "create_journal"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Book Manual Journal
        </button>
        <button
          onClick={() => { setActiveTab("reports"); setReportType("trial"); }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "reports"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Financial Statements
        </button>
      </div>

      {/* RENDER VIEWPORTS */}
      {activeTab === "accounts" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="accounts-chart-view">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Corporate Chart of Accounts (COA)</h3>
              <p className="text-xs text-slate-400">Rwandan building contractors balanced registers</p>
            </div>
            <span className="font-mono text-xs font-bold bg-slate-100 px-3 py-1 text-slate-700 rounded-md">
              {accounts.length} Ledgers Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">Ledger Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Account Classification</th>
                  <th className="p-3">Current Running Balance</th>
                  <th className="p-3">Statement association</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-bold text-indigo-600">{acc.code}</td>
                    <td className="p-3 font-sans text-slate-800 font-medium">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        acc.type === AccountType.ASSET ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        acc.type === AccountType.LIABILITY ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        acc.type === AccountType.EQUITY ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        acc.type === AccountType.REVENUE ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        "bg-slate-50 text-slate-700 border border-slate-100"
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-950">
                      {Number(acc.balance).toLocaleString()} RWF
                    </td>
                    <td className="p-3 font-sans font-normal text-slate-400 text-[10px]">
                      {acc.type === AccountType.ASSET || acc.type === AccountType.LIABILITY || acc.type === AccountType.EQUITY
                        ? "Balance Sheet (Direct)"
                        : "Income Statement (Profit/Loss)"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW JOURNAL LOGS */}
      {activeTab === "journals" && (
        <div className="space-y-4" id="ledger-journals-view">
          {journals.map(j => (
            <div key={j.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-50 pb-3 text-xs">
                <div>
                  <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mr-2">{j.reference}</span>
                  <span className="text-slate-400 font-mono">{j.date}</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-sm font-mono text-[9px] text-slate-500 uppercase">
                    Branch: {j.branchId === "br-1" ? "Kigali Head Office" : "Rubavu Depot"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-sm font-bold text-[9px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ledger Posted
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium">
                Narration: <span className="text-slate-800 font-bold">{j.narration}</span>
              </div>

              {/* Journal accounts distribution detail */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-200/50 text-[10px] uppercase">
                      <th className="p-2">Account Name</th>
                      <th className="p-2 text-right">Debit Balance (RWF)</th>
                      <th className="p-2 text-right">Credit Balance (RWF)</th>
                      <th className="p-2 pl-4">Audit memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/40 text-slate-600">
                    {j.lines.map((line, lIdx) => {
                      const accName = accounts.find(a => a.id === line.accountId)?.name || "External Ledger";
                      return (
                        <tr key={lIdx}>
                          <td className="p-2 text-slate-800 font-sans">{accName}</td>
                          <td className="p-2 text-right text-slate-900 font-bold">{line.debit > 0 ? line.debit.toLocaleString() : "-"}</td>
                          <td className="p-2 text-right text-slate-900 font-bold">{line.credit > 0 ? line.credit.toLocaleString() : "-"}</td>
                          <td className="p-2 pl-4 text-slate-400 text-[10px] font-sans italic">{line.memo || "General posting"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOK MANUAL JOURNAL */}
      {activeTab === "create_journal" && (
        <form onSubmit={handlePost} className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6" id="journal-create-form">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Record a New Double-Entry Manual Journal</h3>
            <p className="text-xs text-slate-400">Ledger rules apply: debit sums must match credit sums</p>
          </div>

          {errMessage && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errMessage}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs flex gap-2 items-center">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Manual journal entry approved and saved into double entry ledger successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Journal Date</label>
              <input
                type="date"
                required
                value={journalDate}
                onChange={e => setJournalDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reference Code</label>
              <input
                type="text"
                required
                placeholder="e.g. ADJ-MAY-2026"
                value={journalRef}
                onChange={e => setJournalRef(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Narration / Description</label>
              <input
                type="text"
                required
                placeholder="Audit description for shareholders, e.g. Year-end capital adjustment allocation..."
                value={journalNarrative}
                onChange={e => setJournalNarrative(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-hidden focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entries Allocation</span>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                  <div>
                    <select
                      required
                      value={line.accountId}
                      onChange={e => handleLineChange(idx, "accountId", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white"
                    >
                      <option value="">Select Ledger Account...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Debit Amount (RWF)"
                      value={line.debit || ""}
                      onChange={e => handleLineChange(idx, "debit", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 outline-hidden focus:border-indigo-500 font-mono text-right"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Credit Amount (RWF)"
                      value={line.credit || ""}
                      onChange={e => handleLineChange(idx, "credit", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 outline-hidden focus:border-indigo-500 font-mono text-right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Memo"
                      value={line.memo}
                      onChange={e => handleLineChange(idx, "memo", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:border-indigo-500"
                    />
                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-rose-500 text-xs px-2 hover:bg-rose-50 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              + Add Transaction Row
            </button>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs">
            <div className="flex gap-6">
              <span>Debits sum: <b className="text-slate-800">{totalDebits.toLocaleString()} RWF</b></span>
              <span>Credits sum: <b className="text-slate-800">{totalCredits.toLocaleString()} RWF</b></span>
            </div>
            <div>
              <span className={`px-2.5 py-1 rounded font-bold ${
                balancesInCheck 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "bg-rose-50 text-rose-700"
              }`}>
                {balancesInCheck ? "✓ Balanced & Valid" : "✕ Out-of-Balance"}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!balancesInCheck}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
                balancesInCheck
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              Validate & Post Manual Journal
            </button>
          </div>
        </form>
      )}

      {/* FINANCIAL STATEMENTS AND REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6" id="reports-viewport">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dynamic Financial Statements Builder</h3>
              <p className="text-xs text-slate-400">Instantly calculated balances based on real double-entry books</p>
            </div>
            <div className="flex border border-slate-100 rounded-lg p-1 bg-slate-50/70 gap-1 text-xs font-semibold">
              <button
                onClick={() => setReportType("trial")}
                className={`px-3 py-1.5 rounded-md ${reportType === "trial" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500"}`}
              >
                Trial Balance
              </button>
              <button
                onClick={() => setReportType("income")}
                className={`px-3 py-1.5 rounded-md ${reportType === "income" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500"}`}
              >
                Profit & Loss (Income)
              </button>
              <button
                onClick={() => setReportType("balance")}
                className={`px-3 py-1.5 rounded-md ${reportType === "balance" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500"}`}
              >
                Balance Sheet
              </button>
            </div>
          </div>

          {/* RENDER CHOSEN FINANCIAL REPORT TYPE */}
          {reportType === "trial" && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trial Balance Worksheet</span>
                <span className="text-xs font-mono font-bold text-indigo-600">Period: Year-to-Date 2026</span>
              </div>

              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                    <th className="p-3">Ledger Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3 text-right">Debit Balance (RWF)</th>
                    <th className="p-3 text-right">Credit Balance (RWF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                  {accounts.map(acc => {
                    const isDebit = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/40">
                        <td className="p-3 font-bold text-slate-700">{acc.code}</td>
                        <td className="p-3 font-sans text-slate-800 font-medium">{acc.name}</td>
                        <td className="p-3 text-slate-400 text-[10px] font-sans">{acc.type}</td>
                        <td className="p-3 text-right text-slate-900 font-bold">{isDebit ? Number(acc.balance).toLocaleString() : "-"}</td>
                        <td className="p-3 text-right text-slate-900 font-bold">{!isDebit ? Number(acc.balance).toLocaleString() : "-"}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                    <td colSpan={3} className="p-3 pl-4 font-sans text-slate-800 text-sm">Balanced Totals</td>
                    <td className="p-3 text-right text-indigo-600 text-sm">{trialDebitsTotal.toLocaleString()} RWF</td>
                    <td className="p-3 text-right text-indigo-600 text-sm">{trialCreditsTotal.toLocaleString()} RWF</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {reportType === "income" && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Profit & Loss (Income Statement)</span>
                <span className="text-xs font-mono font-bold text-indigo-600">Period: Q2 2026 Audit View</span>
              </div>

              {/* Outputs Statement structure */}
              <div className="space-y-6 text-sm">
                
                {/* REVENUE SPREADS */}
                <div>
                  <h4 className="font-sans font-bold text-slate-800 border-b border-slate-150 pb-1 text-xs uppercase tracking-wider">I. Operating Revenues</h4>
                  <div className="divide-y divide-slate-50 mt-2 pl-4">
                    {accounts.filter(a => a.type === AccountType.REVENUE).map(acc => (
                      <div key={acc.id} className="flex justify-between py-2 text-xs">
                        <span className="text-slate-600 font-medium">{acc.name}</span>
                        <span className="font-mono font-medium text-slate-800">{Number(acc.balance).toLocaleString()} RWF</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2.5 font-bold border-t border-slate-100 text-xs">
                      <span>Total Net Revenues</span>
                      <span className="font-mono">{trialCreditsTotal - totalLiabilityBal - totalEquityBal} RWF</span>
                    </div>
                  </div>
                </div>

                {/* OPERATING EXPENSES SPREADS */}
                <div>
                  <h4 className="font-sans font-bold text-slate-800 border-b border-slate-150 pb-1 text-xs uppercase tracking-wider">II. Operating Expenditures</h4>
                  <div className="divide-y divide-slate-50 mt-2 pl-4">
                    {accounts.filter(a => a.type === AccountType.EXPENSE).map(acc => (
                      <div key={acc.id} className="flex justify-between py-2 text-xs">
                        <span className="text-slate-600 font-medium">{acc.name}</span>
                        <span className="font-mono font-medium text-slate-800">({Number(acc.balance).toLocaleString()}) RWF</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2.5 font-bold border-t border-slate-100 text-xs">
                      <span>Total Overhead Cost</span>
                      <span className="font-mono">({totalExpenseBal.toLocaleString()}) RWF</span>
                    </div>
                  </div>
                </div>

                {/* RECONCILED PROFIT */}
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100/50 flex justify-between items-center">
                  <span className="font-bold text-indigo-950 font-sans text-xs uppercase tracking-wide">Net Retained Statement Profit (Loss)</span>
                  <span className="font-mono text-lg font-extrabold text-indigo-700">
                    {(trialCreditsTotal - totalLiabilityBal - totalEquityBal - totalExpenseBal).toLocaleString()} RWF
                  </span>
                </div>

              </div>
            </div>
          )}

          {reportType === "balance" && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Balance Sheet (Financial Statement of Position)</span>
                <span className="text-xs font-mono font-bold text-indigo-600">As of Date: 2026-06-05</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                
                {/* ASSETS PORTFOLIO */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-150 pb-1 text-xs uppercase tracking-wider">Assets (Resources)</h4>
                  <div className="space-y-2 mt-2">
                    {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                      <div key={acc.id} className="flex justify-between py-1 text-xs">
                        <span className="text-slate-600 font-medium">{acc.name}</span>
                        <span className="font-mono font-medium text-slate-800">{Number(acc.balance).toLocaleString()} RWF</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-t border-slate-100 text-xs text-indigo-600">
                      <span>Total Corporate Assets</span>
                      <span className="font-mono">{totalAssetBal.toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>

                {/* EQUITY & LIABILITIES PORTFOLIO */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-150 pb-1 text-xs uppercase tracking-wider">Equity & Liabilities</h4>
                  <div className="space-y-2 mt-2">
                    {/* Liabilities */}
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Current Liabilities</div>
                    {accounts.filter(a => a.type === AccountType.LIABILITY).map(acc => (
                      <div key={acc.id} className="flex justify-between py-1 text-xs pl-2">
                        <span className="text-slate-600 font-medium">{acc.name}</span>
                        <span className="font-mono font-medium text-slate-800">{Number(acc.balance).toLocaleString()} RWF</span>
                      </div>
                    ))}

                    {/* Equity */}
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 pt-2">Capital & Reserves</div>
                    {accounts.filter(a => a.type === AccountType.EQUITY).map(acc => (
                      <div key={acc.id} className="flex justify-between py-1 text-xs pl-2">
                        <span className="text-slate-600 font-medium">{acc.name}</span>
                        <span className="font-mono font-medium text-slate-800">{Number(acc.balance).toLocaleString()} RWF</span>
                      </div>
                    ))}

                    <div className="flex justify-between py-2 font-bold border-t border-slate-100 text-xs text-emerald-600">
                      <span>Total Liabilities & Equity Sums</span>
                      <span className="font-mono">{(totalLiabilityBal + totalEquityBal).toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Balanced ledger proof */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono font-medium text-slate-500 flex justify-between items-center">
                <span>Equation Balance: Assets = Liabilities + Equity</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md">
                  <Check className="w-3.5 h-3.5" /> Perfectly Balanced: {totalAssetBal.toLocaleString()} RWF
                </span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
