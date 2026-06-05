/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Check, Smartphone, FilePlus2, Receipt, Send, ShoppingBag, Coins, CornerDownRight } from "lucide-react";
import { Customer, Invoice, Quotation, Product, TaxType, SalesStatus } from "../types";

interface InvoicingProps {
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];
  products: Product[];
  currentBranchId: string;
  onEmitInvoice: (params: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discount?: number; taxType: TaxType }>;
    dueDate: string;
    branchId: string;
  }) => Promise<boolean>;
  onEmitQuotation: (params: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discount?: number; taxType: TaxType }>;
    validUntil: string;
    branchId: string;
  }) => Promise<boolean>;
  onConvertQuotation: (quoteId: string) => Promise<boolean>;
  onSimulateMoMo: (params: {
    phone: string;
    amount: number;
    invoiceId: string;
  }) => Promise<boolean>;
}

export default function Invoicing({
  customers,
  invoices,
  quotations,
  products,
  currentBranchId,
  onEmitInvoice,
  onEmitQuotation,
  onConvertQuotation,
  onSimulateMoMo
}: InvoicingProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "create_invoice" | "quotations" | "create_quote" | "customers">("invoices");

  // Form states invoice
  const [customerSel, setCustomerSel] = useState<string>("");
  const [invoiceDue, setInvoiceDue] = useState<string>(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]);
  const [branchSel, setBranchSel] = useState<string>("br-1");
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; discount: number; taxType: TaxType }>>([
    { productId: "", quantity: 1, unitPrice: 0, discount: 0, taxType: TaxType.VAT_18 }
  ]);

  // Form states quotation
  const [quoteCustomer, setQuoteCustomer] = useState<string>("");
  const [quoteValid, setQuoteValid] = useState<string>(new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]);
  const [quoteItems, setQuoteItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; discount: number; taxType: TaxType }>>([
    { productId: "", quantity: 1, unitPrice: 0, discount: 0, taxType: TaxType.VAT_18 }
  ]);

  // Mobile Money simulated drawer popup
  const [momoPhone, setMomoPhone] = useState<string>("250788123456");
  const [momoAmount, setMomoAmount] = useState<number>(0);
  const [momoInvoiceId, setMomoInvoiceId] = useState<string | null>(null);
  const [momoSuccess, setMomoSuccess] = useState<boolean>(false);
  const [momoLoading, setMomoLoading] = useState<boolean>(false);

  // General helpers
  const handleAddItemRow = (isQuote = false) => {
    const row = { productId: "", quantity: 1, unitPrice: 0, discount: 0, taxType: TaxType.VAT_18 };
    if (isQuote) {
      setQuoteItems([...quoteItems, row]);
    } else {
      setItems([...items, row]);
    }
  };

  const handleRemoveItemRow = (idx: number, isQuote = false) => {
    if (isQuote) {
      if (quoteItems.length <= 1) return;
      setQuoteItems(quoteItems.filter((_, i) => i !== idx));
    } else {
      if (items.length <= 1) return;
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleProductChange = (index: number, productId: string, isQuote = false) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (isQuote) {
      const updated = [...quoteItems];
      updated[index].productId = productId;
      updated[index].unitPrice = prod.sellingPrice;
      updated[index].taxType = prod.taxType;
      setQuoteItems(updated);
    } else {
      const updated = [...items];
      updated[index].productId = productId;
      updated[index].unitPrice = prod.sellingPrice;
      updated[index].taxType = prod.taxType;
      setItems(updated);
    }
  };

  const handleValChange = (index: number, key: "quantity" | "unitPrice" | "discount" | "taxType", value: any, isQuote = false) => {
    if (isQuote) {
      const updated = [...quoteItems];
      if (key === "taxType") {
        updated[index].taxType = value;
      } else {
        updated[index][key] = Number(value) || 0;
      }
      setQuoteItems(updated);
    } else {
      const updated = [...items];
      if (key === "taxType") {
        updated[index].taxType = value;
      } else {
        updated[index][key] = Number(value) || 0;
      }
      setItems(updated);
    }
  };

  const handleInvoiceCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerSel || items.some(i => !i.productId)) return;

    const ok = await onEmitInvoice({
      customerId: customerSel,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxType: i.taxType
      })),
      dueDate: invoiceDue,
      branchId: branchSel
    });

    if (ok) {
      setCustomerSel("");
      setItems([{ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxType: TaxType.VAT_18 }]);
      setActiveTab("invoices");
    }
  };

  const handleQuotationCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteCustomer || quoteItems.some(i => !i.productId)) return;

    const ok = await onEmitQuotation({
      customerId: quoteCustomer,
      items: quoteItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxType: i.taxType
      })),
      validUntil: quoteValid,
      branchId: "br-1"
    });

    if (ok) {
      setQuoteCustomer("");
      setQuoteItems([{ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxType: TaxType.VAT_18 }]);
      setActiveTab("quotations");
    }
  };

  const triggerMomoOverlay = (inv: Invoice) => {
    setMomoInvoiceId(inv.id);
    setMomoAmount(Number(inv.total) - Number(inv.amountPaid));
    setMomoSuccess(false);
  };

  const handleMomoDischarge = async () => {
    if (!momoInvoiceId) return;
    setMomoLoading(true);
    const ok = await onSimulateMoMo({
      phone: momoPhone,
      amount: momoAmount,
      invoiceId: momoInvoiceId
    });
    setMomoLoading(false);
    if (ok) {
      setMomoSuccess(true);
      setTimeout(() => {
        setMomoInvoiceId(null);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="invoicing-billing-engine">
      
      {/* Sub tabs nav */}
      <div className="flex border-b border-slate-100 flex-wrap gap-2 pb-1" id="invoice-tabs">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "invoices"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Invoices
        </button>
        <button
          onClick={() => setActiveTab("create_invoice")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "create_invoice"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FilePlus2 className="w-3.5 h-3.5" /> Book Sale Invoice
        </button>
        <button
          onClick={() => setActiveTab("quotations")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "quotations"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Quotations & Tenders
        </button>
        <button
          onClick={() => setActiveTab("create_quote")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "create_quote"
              ? "bg-indigo-55 bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Generate Quotation
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "customers"
              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Customers Registry
        </button>
      </div>

      {/* VIEW INVOICES */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="invoices-list-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sales Invoices Log</h3>
              <p className="text-xs text-slate-400">Manage receipts and pull direct payments via Mobile Money</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Customer Entity</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Items Subtotal</th>
                  <th className="p-3 text-right">RRA VAT Due (18%)</th>
                  <th className="p-3 text-right">Invoice Sum</th>
                  <th className="p-3 text-center">Settlement Status</th>
                  <th className="p-3 text-center">Collect payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="p-3 font-sans text-slate-700">{inv.customerName}</td>
                    <td className="p-3 font-sans text-slate-500 font-normal">{inv.date}</td>
                    <td className="p-3 font-sans text-amber-600 font-normal">{inv.dueDate}</td>
                    <td className="p-3 text-right text-slate-700">{Number(inv.subtotal).toLocaleString()}</td>
                    <td className="p-3 text-right text-indigo-600 font-bold">{Number(inv.taxTotal).toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-950 font-bold">{Number(inv.total).toLocaleString()} RWF</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        inv.status === SalesStatus.PAID ? "bg-emerald-50 text-emerald-700 border-emerald-100 border" :
                        inv.status === SalesStatus.PARTIAL ? "bg-amber-50 text-amber-700 border-amber-100 border" :
                        "bg-rose-50 text-rose-700 border border-rose-100 border"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {inv.status !== SalesStatus.PAID ? (
                        <button
                          onClick={() => triggerMomoOverlay(inv)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 text-white rounded-md hover:bg-amber-600 flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Smartphone className="w-3 h-3" /> Push MoMo
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans italic">Paid: {inv.momoReference || "Bank Wire"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SALE INVOICE */}
      {activeTab === "create_invoice" && (
        <form onSubmit={handleInvoiceCreate} className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6" id="invoice-creation-form">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Issue an RRA-compliant Sale Invoice</h3>
            <p className="text-xs text-slate-400 font-normal">Real physical items will be automatically decremented from warehouse stocks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Select Customer profile</label>
              <select
                required
                value={customerSel}
                onChange={e => setCustomerSel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="">Choose customer client...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} [TIN: {c.tin || "N/A"}]</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Settlement Date</label>
              <input
                type="date"
                required
                value={invoiceDue}
                onChange={e => setInvoiceDue(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Origin branch / Warehouse</label>
              <select
                value={branchSel}
                onChange={e => setBranchSel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="br-1">Kigali Gikondo Head Office</option>
                <option value="br-2">Rubavu Kivu Depot</option>
              </select>
            </div>
          </div>

          {/* Sells Items rows */}
          <div className="space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items</span>
            
            <div className="space-y-2">
              {items.map((itm, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                  <div className="md:col-span-2">
                    <select
                      required
                      value={itm.productId}
                      onChange={e => handleProductChange(idx, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white"
                    >
                      <option value="">Select physical product or service...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.stockCount} in stock) - {p.sellingPrice.toLocaleString()} RWF</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Qty"
                      min="1"
                      value={itm.quantity}
                      onChange={e => handleValChange(idx, "quantity", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 font-mono text-right"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Disc (RWF)"
                      value={itm.discount || ""}
                      onChange={e => handleValChange(idx, "discount", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 font-mono text-right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={itm.taxType}
                      onChange={e => handleValChange(idx, "taxType", e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white"
                    >
                      <option value={TaxType.VAT_18}>Standard VAT 18%</option>
                      <option value={TaxType.VAT_EXEMPT}>VAT Exempt</option>
                    </select>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
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
              onClick={() => handleAddItemRow()}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              + Add Billable Item row
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer"
            >
              Emit Sales Invoice & Decrement Inventory
            </button>
          </div>
        </form>
      )}

      {/* VIEW QUOTATIONS */}
      {activeTab === "quotations" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="quotations-list-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tenders & Quotations</h3>
              <p className="text-xs text-slate-400">Review, approve, and convert active proposals directly to RRA standard invoices</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">Quote Number</th>
                  <th className="p-3">Customer Entity</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Validity Until</th>
                  <th className="p-3 text-right font-mono">Total Value (RWF)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Perform action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {quotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-mono font-bold text-slate-800">{q.quoteNumber}</td>
                    <td className="p-3 font-sans text-slate-700">{q.customerName}</td>
                    <td className="p-3 font-sans text-slate-500 font-normal">{q.date}</td>
                    <td className="p-3 font-sans text-slate-500 font-normal">{q.validUntil}</td>
                    <td className="p-3 text-right text-slate-950 font-bold">{Number(q.total).toLocaleString()} RWF</td>
                    <td className="p-3 text-center font-sans font-bold">
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${
                        q.status === "CONVERTED" ? "bg-slate-100 text-slate-500" :
                        q.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {q.status === "APPROVED" ? (
                        <button
                          onClick={async () => await onConvertQuotation(q.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-750 text-white rounded-md mx-auto cursor-pointer"
                        >
                          Convert to Invoice
                        </button>
                      ) : q.status === "CONVERTED" ? (
                        <span className="text-[10px] text-slate-400 font-sans italic flex items-center justify-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5" /> Direct Invoice posted
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans italic">Awaiting external approval</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE QUOTATION */}
      {activeTab === "create_quote" && (
        <form onSubmit={handleQuotationCreate} className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6" id="quote-creation-form">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Compile Commercial Quotation</h3>
            <p className="text-xs text-slate-400 font-normal">A formal price projection to win commercial contract tenders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Customer Prospect</label>
              <select
                required
                value={quoteCustomer}
                onChange={e => setQuoteCustomer(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Validity Offer Date</label>
              <input
                type="date"
                required
                value={quoteValid}
                onChange={e => setQuoteValid(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Quotation items rows */}
          <div className="space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items</span>

            <div className="space-y-2">
              {quoteItems.map((itm, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                  <div className="md:col-span-2">
                    <select
                      required
                      value={itm.productId}
                      onChange={e => handleProductChange(idx, e.target.value, true)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white"
                    >
                      <option value="">Select physical product or service...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.sellingPrice.toLocaleString()} RWF</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Qty"
                      min="1"
                      value={itm.quantity}
                      onChange={e => handleValChange(idx, "quantity", e.target.value, true)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 font-mono text-right"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Disc (RWF)"
                      value={itm.discount || ""}
                      onChange={e => handleValChange(idx, "discount", e.target.value, true)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 font-mono text-right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={itm.taxType}
                      onChange={e => handleValChange(idx, "taxType", e.target.value, true)}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white"
                    >
                      <option value={TaxType.VAT_18}>Standard VAT 18%</option>
                      <option value={TaxType.VAT_EXEMPT}>VAT Exempt</option>
                    </select>
                    {quoteItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx, true)}
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
              onClick={() => handleAddItemRow(true)}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              + Add proposed product row
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer"
            >
              Emit Formal Commercial Quotation
            </button>
          </div>
        </form>
      )}

      {/* CUSTOMERS REGISTRY */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs" id="customers-list-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Prospect & Client Database</h3>
              <p className="text-xs text-slate-400">Review credit terms and outstanding debit balances for Rwandan builders</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/70">
                  <th className="p-3">Customer Entity Name</th>
                  <th className="p-3 font-mono">Rwanda TIN ID</th>
                  <th className="p-3">Commercial Contact</th>
                  <th className="p-3">Geographical Address</th>
                  <th className="p-3 text-right">Assigned Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Debt Receivable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium font-mono">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-sans text-slate-800 font-bold">{c.name}</td>
                    <td className="p-3 font-mono font-semibold text-indigo-600">{c.tin || "100-XXXXXX"}</td>
                    <td className="p-3 font-sans text-slate-500 font-normal">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-slate-400">{c.phone}</div>
                    </td>
                    <td className="p-3 font-sans text-slate-500 font-normal">{c.address}</td>
                    <td className="p-3 text-right font-bold text-slate-700">{Number(c.creditLimit).toLocaleString()} RWF</td>
                    <td className="p-3 text-right font-bold text-rose-600">{Number(c.outstandingBalance).toLocaleString()} RWF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DYNAMIC MOBILE MONEY DRAWER OVERLAY */}
      {momoInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="momo-push-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-150 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold font-sans text-slate-500 uppercase tracking-wide">
                <Smartphone className="w-4 h-4 text-amber-500 shrink-0" /> MTN MoMo Bulk Merchant Simulator
              </span>
              <button 
                onClick={() => setMomoInvoiceId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs"
              >
                ✕ Close
              </button>
            </div>

            {momoSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 animate-scale-up">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-950">MTN Mobile Money Cleared!</h4>
                <p className="text-xs text-slate-400">RWF collections transferred securely. Ledger accounts updated automatically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="p-3 bg-amber-50/70 border border-amber-100 text-amber-950 rounded-lg flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    KoraBooks embeds an <b>MTN MoMo and Airtel Money Pay-In Pull API</b> simulation. In production, this fires a USSD push notification requesting RRA PIN confirmation.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subscriber Phone (Tel)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 mt-1 rounded-lg font-mono focus:border-amber-500 outline-hidden text-slate-800"
                      value={momoPhone}
                      onChange={e => setMomoPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transaction Amount (RWF Value)</label>
                    <input
                      type="number"
                      disabled
                      className="w-full p-2.5 border border-slate-100 mt-1 rounded-lg font-mono bg-slate-50 text-slate-800 font-bold"
                      value={momoAmount}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleMomoDischarge}
                    disabled={momoLoading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {momoLoading ? (
                      <span className="flex items-center gap-1.5 font-sans font-normal items-center">
                        <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white animate-spin rounded-full"></span> Running RRA validation...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <smartphone className="w-4 h-4 shrink-0" /> Trigger Simulated Push Callback
                      </span>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
