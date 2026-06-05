/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, ShieldAlert, FileSpreadsheet, Building2, Save, FileText, Landmark } from "lucide-react";
import { Organization, Account, TaxType } from "../types";

interface ComplianceProps {
  organization: Organization;
  accounts: Account[];
  onSaveTaxSettings: (params: { tin: string; ebmEnabled: boolean; vatRate: number }) => Promise<boolean>;
}

export default function Compliance({
  organization,
  accounts,
  onSaveTaxSettings
}: ComplianceProps) {
  const [tinInput, setTinInput] = useState<string>(organization.tin || "");
  const [ebmSw, setEbmSw] = useState<boolean>(true);
  const [vatPercent, setVatPercent] = useState<number>(18);
  const [success, setSuccess] = useState<boolean>(false);

  // Financial summary tax offset
  const vatCollected = accounts.find(a => a.code === "2200")?.balance || 0; // Output VAT
  const vatOffsetAllowed = accounts.find(a => a.code === "1060")?.balance || 0; // Input VAT asset
  const netVatPayable = Math.max(0, Number(vatCollected) - Number(vatOffsetAllowed));

  const payeLiability = accounts.find(a => a.code === "2300")?.balance || 0;
  const rssbLiability = accounts.find(a => a.code === "2400")?.balance || 0;

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSaveTaxSettings({
      tin: tinInput,
      ebmEnabled: ebmSw,
      vatRate: vatPercent
    });
    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6" id="rra-compliance-portal">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="compliance-layout">
        
        {/* RRA Declarations Summaries */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-6" id="tax-return-summary">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Rwanda Revenue Authority (RRA) Tax Declarations</h3>
            <p className="text-xs text-slate-400">YTD Summary figures formulated for instant upload to Rwanda Revenue Portal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* VAT Reconciliations standard offsets */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
              <div className="font-sans font-bold text-slate-800 text-xs border-b border-slate-150 pb-1.5 flex justify-between items-center">
                <span>Value Added Tax (VAT)</span>
                <span className="text-[10px] bg-indigo-50 border border-indigo-100/50 px-2 text-indigo-700 rounded uppercase">Standard 18%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Output VAT Collected</span>
                  <span className="font-bold text-slate-900">{Number(vatCollected).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Input VAT Claimable</span>
                  <span className="font-bold text-slate-600">({Number(vatOffsetAllowed).toLocaleString()}) RWF</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-xs font-bold font-mono">
                  <span className="font-sans text-slate-800">Net RRA VAT Payable</span>
                  <span className="text-indigo-600 underline">{netVatPayable.toLocaleString()} RWF</span>
                </div>
              </div>
            </div>

            {/* Payroll statuary deductions */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
              <div className="font-sans font-bold text-slate-800 text-xs border-b border-slate-150 pb-1.5 flex justify-between items-center">
                <span>Progressive Social Pools</span>
                <span className="text-[10px] bg-teal-50 border border-teal-100/50 px-2 text-teal-700 rounded uppercase font-bold">Filer</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">PAYE Taxes Withheld</span>
                  <span className="font-bold text-slate-900">{Number(payeLiability).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">RSSB Pensions Due</span>
                  <span className="font-bold text-slate-900">{Number(rssbLiability).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="font-sans text-slate-800 font-medium">Aggregated liabilities</span>
                  <span className="text-teal-600 font-mono font-bold">{(Number(payeLiability) + Number(rssbLiability)).toLocaleString()} RWF</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100 flex gap-3 text-xs">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-emerald-950 font-sans">Pre-mapped RRA Upload format approved</h5>
              <p className="text-emerald-700 leading-relaxed font-sans text-xs mt-0.5">
                KoraBooks exports compliant JSON matrices directly suited to <b>E-Taxing systems</b>. Run full statutory declarations securely from local branch files.
              </p>
            </div>
          </div>
        </div>

        {/* Corporate Tax Settings */}
        <form onSubmit={handleSaveTax} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6" id="compliance-settings">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Branch Tax Configurations</h3>
            <p className="text-xs text-slate-400">Maintain corporate identities and regulatory auditing checks</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5 font-sans">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Settings updated, audit logged!
            </div>
          )}

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rwanda Corporate TIN</label>
              <input
                type="text"
                required
                placeholder="100345678"
                className="w-full p-2.5 border border-slate-200 mt-1 rounded-lg font-mono focus:border-indigo-500 outline-hidden"
                value={tinInput}
                onChange={e => setTinInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Default VAT Taxation</label>
              <select
                className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
                value={vatPercent}
                onChange={e => setVatPercent(Number(e.target.value))}
              >
                <option value="18">Standard VAT 18%</option>
                <option value="15">Reduced Rate 15%</option>
                <option value="0">Zero-Rated / Exempt</option>
              </select>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <input
                type="checkbox"
                id="ebm-sw"
                className="w-4 h-4 text-indigo-600 border-slate-200 rounded cursor-pointer"
                checked={ebmSw}
                onChange={e => setEbmSw(e.target.checked)}
              />
              <label htmlFor="ebm-sw" className="text-xs font-semibold text-slate-700 cursor-pointer font-sans leading-tight">
                Enable Electronic Billing Machine (EBM v2) Automatic Hooks
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
          >
            <Save className="w-4 h-4 shrink-0" /> Commit Regulatory Adjustments
          </button>
        </form>

      </div>

    </div>
  );
}
