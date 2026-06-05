/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldCheck, UserX, Clock, Database, Milestone } from "lucide-react";
import { AuditLog } from "../types";

interface SecurityAuditProps {
  audits: AuditLog[];
}

export default function SecurityAudit({ audits }: SecurityAuditProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6" id="security-auditing-panel">
      
      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Continuous Real-time Security Auditing Trailing [SOC-2 Protocol]
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Every accounting ledger adjustment, branch stock reallocation, and payload alteration triggers immutable structural logs with before-after snapshots for forensic compliance.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70 font-sans">
              <th className="p-3">Audit timestamp</th>
              <th className="p-3">Operator User</th>
              <th className="p-3">Event action</th>
              <th className="p-3">Affected Ledger ID</th>
              <th className="p-3 pl-4">Before State Snapshot</th>
              <th className="p-3 pl-4">Post State Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
            {audits.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/40">
                <td className="p-3 font-mono text-slate-400 font-normal whitespace-nowrap">{log.timestamp}</td>
                <td className="p-3 font-sans text-slate-700 font-bold">
                  <div>{log.userEmail}</div>
                  <div className="text-[9px] font-mono font-normal text-indigo-600">IP: {log.ip}</div>
                </td>
                <td className="p-3">
                  <span className="p-1 px-2.5 rounded font-bold text-[9px] font-sans bg-slate-100 uppercase border border-slate-200/50 text-slate-600">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800">{log.id}</td>
                <td className="p-3 pl-4 text-rose-600 underline font-semibold font-mono text-[10px] max-w-xs truncate">
                  {log.beforeValue || "Initial Void Entry"}
                </td>
                <td className="p-3 pl-4 text-emerald-600 font-extrabold font-mono text-[10px] max-w-xs truncate">
                  {log.afterValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
