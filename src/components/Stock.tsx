/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Check, RefreshCw, Send, Sliders, AlertTriangle, ArrowRight } from "lucide-react";
import { Product, StockTransfer, Branch, TaxType } from "../types";

interface StockProps {
  products: Product[];
  stockTransfers: StockTransfer[];
  branches: Branch[];
  onStockTransfer: (params: {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
  }) => Promise<boolean>;
  onStockAdjust: (params: {
    productId: string;
    branchId: string;
    difference: number;
    reason: string;
  }) => Promise<boolean>;
}

export default function Stock({
  products,
  stockTransfers,
  branches,
  onStockTransfer,
  onStockAdjust
}: StockProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "transfers" | "adjust">("inventory");

  // Transfer states
  const [prodSel, setProdSel] = useState<string>("");
  const [fromBranch, setFromBranch] = useState<string>("br-1");
  const [toBranch, setToBranch] = useState<string>("br-2");
  const [transferQty, setTransferQty] = useState<number>(10);
  const [transferErr, setTransferErr] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);

  // Adjustment states
  const [adjustProd, setAdjustProd] = useState<string>("");
  const [adjustBranch, setAdjustBranch] = useState<string>("br-1");
  const [adjustDiff, setAdjustDiff] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("Stocktake discrepancy reconciliation");
  const [adjustSuccess, setAdjustSuccess] = useState<boolean>(false);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferErr(null);
    setTransferSuccess(false);

    if (!prodSel) return;
    if (fromBranch === toBranch) {
      setTransferErr("Source and Destination branches must differ to trigger stock transfer.");
      return;
    }

    const prod = products.find(p => p.id === prodSel);
    if (prod) {
      const activeFromStock = prod.branchStocks[fromBranch] || 0;
      if (activeFromStock < transferQty) {
        setTransferErr(`Insufficient stock! ${prod.name} only has ${activeFromStock} items inside selected origin warehouse.`);
        return;
      }
    }

    const ok = await onStockTransfer({
      productId: prodSel,
      fromBranchId: fromBranch,
      toBranchId: toBranch,
      quantity: transferQty
    });

    if (ok) {
      setTransferSuccess(true);
      setTransferQty(10);
      setProdSel("");
      setTimeout(() => {
        setTransferSuccess(false);
        setActiveTab("inventory");
      }, 1500);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProd || adjustDiff === 0) return;

    const ok = await onStockAdjust({
      productId: adjustProd,
      branchId: adjustBranch,
      difference: adjustDiff,
      reason: adjustReason
    });

    if (ok) {
      setAdjustSuccess(true);
      setAdjustProd("");
      setAdjustDiff(0);
      setTimeout(() => {
        setAdjustSuccess(false);
        setActiveTab("inventory");
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="inventory-warehouse-control">
      
      {/* Tab controls */}
      <div className="flex border-b border-slate-100 flex-wrap gap-2 pb-1" id="stock-nav">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "inventory"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Inventory Asset Balances
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "transfers"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Stock Transfers logs
        </button>
        <button
          onClick={() => setActiveTab("adjust")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "adjust"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Reconcile & Adjust counts
        </button>
      </div>

      {/* RENDER VIEWPORTS */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="inventory-sheet-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Warehouse Stocks Ledger</h3>
              <p className="text-xs text-slate-400">Total volume allocations across regional building depots</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">SKU / Item Code</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Cost Price (RWF)</th>
                  <th className="p-3 text-right">Selling Price RWF</th>
                  <th className="p-3 text-center">Standard Taxing</th>
                  <th className="p-3 text-right">Kigali Quantity</th>
                  <th className="p-3 text-right">Rubavu Quantity</th>
                  <th className="p-3 text-right font-mono">Aggregated Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {products.map(p => {
                  const isLow = p.stockCount <= p.reorderLevel && p.type === "PHYSICAL";
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/40 ${isLow ? "bg-rose-50/20" : ""}`}>
                      <td className="p-3 font-mono font-bold text-slate-800">{p.sku}</td>
                      <td className="p-3 font-sans text-slate-800 font-medium">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.code}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-500">{Number(p.costPrice).toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-800 font-bold">{Number(p.sellingPrice).toLocaleString()}</td>
                      <td className="p-3 text-center font-sans text-slate-400 text-[10px]">{p.taxType === TaxType.VAT_18 ? "18% VAT" : "Exempt"}</td>
                      <td className="p-3 text-right">{p.type === "PHYSICAL" ? (p.branchStocks["br-1"] || 0).toLocaleString() : "-"}</td>
                      <td className="p-3 text-right">{p.type === "PHYSICAL" ? (p.branchStocks["br-2"] || 0).toLocaleString() : "-"}</td>
                      <td className="p-3 text-right font-bold text-slate-950">
                        {p.type === "PHYSICAL" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {isLow && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                            <span className={isLow ? "text-rose-600 font-bold" : "text-slate-900"}>
                              {p.stockCount.toLocaleString()} items
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">SME Service</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="inventory-transfer-section">
          
          <form onSubmit={handleTransferSubmit} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6" id="transfer-form-block">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Dispatch Inter-branch Stock Transfer</h4>
              <p className="text-xs text-slate-400">Moves physical items securely between Gikondo HQ and Kivu Depot</p>
            </div>

            {transferErr && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg">
                ✕ {transferErr}
              </div>
            )}

            {transferSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg">
                ✓ Inter-branch dispatch successful! Stocks balances automatically reallocated.
              </div>
            )}

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Select Dispatch Item</label>
                <select
                  required
                  value={prodSel}
                  onChange={e => setProdSel(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
                >
                  <option value="">Select physical material...</option>
                  {products.filter(p => p.type === "PHYSICAL").map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">From Origin</label>
                  <select
                    value={fromBranch}
                    onChange={e => setFromBranch(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
                  >
                    <option value="br-1">Kigali HO</option>
                    <option value="br-2">Rubavu Depot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">To Destination</label>
                  <select
                    value={toBranch}
                    onChange={e => setToBranch(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
                  >
                    <option value="br-2">Rubavu Depot</option>
                    <option value="br-1">Kigali HO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-mono">Transfer Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full p-2.5 border border-slate-200 mt-1 rounded-lg font-mono text-slate-800"
                  value={transferQty}
                  onChange={e => setTransferQty(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4 shrink-0" /> Commit Stock Transfer Dispatch
            </button>
          </form>

          {/* Transfers list history */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Dispatch Transfers Audit</h4>
            
            <div className="space-y-3">
              {stockTransfers.map(st => (
                <div key={st.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 text-xs font-mono flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-sans font-bold text-slate-850">{st.productName}</div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-1.5">
                      <span>{st.fromBranchId === "br-1" ? "Kigali Head Office" : "Rubavu Depot"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.toBranchId === "br-1" ? "Kigali Head Office" : "Rubavu Depot"}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-slate-900">{st.quantity} Units</div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase font-sans">
                      {st.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* RECONCILE AND ADJUST */}
      {activeTab === "adjust" && (
        <form onSubmit={handleAdjustSubmit} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs max-w-2xl space-y-6" id="adjust-form">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Inventory Reconciliation Certificate</h4>
            <p className="text-xs text-slate-400">Posts automated balancing ledger entry to write-off losses or record findings.</p>
          </div>

          {adjustSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg">
              ✓ Adjustment posted successfully! Double entry asset reconciliations committed under auditing logs.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Target Material SKU</label>
              <select
                required
                value={adjustProd}
                onChange={e => setAdjustProd(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
              >
                <option value="">Choose item SKU...</option>
                {products.filter(p => p.type === "PHYSICAL").map(p => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Target Regional Warehouse Branch</label>
              <select
                value={adjustBranch}
                onChange={e => setAdjustBranch(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 mt-1 rounded-lg"
              >
                <option value="br-1">Kigali Gikondo HO</option>
                <option value="br-2">Rubavu Kivu Depot</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-mono">Count Variance (Positive / Negative)</label>
              <input
                type="number"
                required
                placeholder="e.g. -5 to write off 5 missing item values"
                className="w-full p-2.5 border border-slate-200 mt-1 rounded-lg font-mono text-slate-800"
                value={adjustDiff || ""}
                onChange={e => setAdjustDiff(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Adjustment justification reason</label>
              <input
                type="text"
                required
                placeholder="Reconciliation reason, e.g. Stock count, rain wastage..."
                className="w-full p-2.5 border border-slate-200 mt-1 rounded-lg focus:border-indigo-500 font-sans"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-4 h-4 shrink-0" /> Commit Adjustments
          </button>
        </form>
      )}

    </div>
  );
}
