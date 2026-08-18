import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

const rows = (res) => res?.data ?? res?.Data ?? [];
const one = (res) => res?.data ?? res?.Data ?? null;

const STAMP_STYLE = {
    Draft: "text-slate-600 border-slate-200 bg-slate-100",
    Approved: "text-emerald-700 border-emerald-200/50 bg-emerald-50",
    PartiallyReceived: "text-amber-700 border-amber-200/50 bg-amber-50",
    Completed: "text-blue-700 border-blue-200/50 bg-blue-50",
    Cancelled: "text-rose-700 border-rose-200/50 bg-rose-50",
};
const STAMP_LABEL = {
    Draft: "DRAFT",
    Approved: "APPROVED",
    PartiallyReceived: "PARTIAL",
    Completed: "COMPLETE",
    Cancelled: "VOID",
};

function StatusStamp({ status }) {
    return (
        <span
            className={`inline-block border rounded-md font-mono text-[10px] font-bold tracking-wider px-2.5 py-1 whitespace-nowrap ${STAMP_STYLE[status] || STAMP_STYLE.Draft}`}
        >
            {STAMP_LABEL[status] || status?.toUpperCase()}
        </span>
    );
}

const NEXT_STATUS = {
    Draft: ["Approved", "Cancelled"],
    Approved: ["PartiallyReceived", "Completed", "Cancelled"],
    PartiallyReceived: ["Completed", "Cancelled"],
    Completed: [],
    Cancelled: [],
};

const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ---------------------------------------------------------------------------
// Amount-in-words (Indian numbering: lakh / crore)
// ---------------------------------------------------------------------------
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigits(n) {
    if (n < 100) return twoDigits(n);
    return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
}
function numToWordsIndian(num) {
    num = Math.round(Number(num) || 0);
    if (num === 0) return "Zero";
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const hundred = num;
    let out = "";
    if (crore) out += threeDigits(crore) + " Crore ";
    if (lakh) out += threeDigits(lakh) + " Lakh ";
    if (thousand) out += threeDigits(thousand) + " Thousand ";
    if (hundred) out += threeDigits(hundred);
    return out.trim();
}
function amountInWords(n) {
    return "INR " + numToWordsIndian(n) + " Only";
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------
function Table({ head, rows: tableRows, empty, emptyText }) {
    return (
        <div className="overflow-x-auto min-h-[300px] flex flex-col justify-between">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                        {head.map((h, i) => (
                            <th
                                key={i}
                                className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {empty ? (
                        <tr>
                            <td colSpan={head.length} className="py-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                        <i className="fa-solid fa-magnifying-glass-minus text-xl text-slate-400" />
                                    </div>
                                    <p className="text-base text-slate-700 font-bold">No results found</p>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">{emptyText}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        tableRows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                                {row.map((cell, j) => (
                                    <td key={j} className="px-6 py-4">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function Modal({ title, onClose, children, wide = false }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-white border border-slate-200 rounded-[24px] w-full ${wide ? "max-w-4xl" : "max-w-md"} shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200`}
            >
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block mb-4">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">{label}</span>
            {children}
        </label>
    );
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const inputSm = "w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";

function SubmitButton({ children, ...props }) {
    return (
        <div className="pt-4 border-t border-slate-100 mt-2">
            <button
                {...props}
                className="w-full py-3.5 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
                {children}
            </button>
        </div>
    );
}

function Toolbar({ search, onSearch, placeholder, ctaLabel, onCta }) {
    return (
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative group w-full sm:flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                />
            </div>
            {onCta && (
                <button
                    onClick={onCta}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center justify-center gap-2 shadow-sm"
                >
                    <i className="fa-solid fa-plus" /> {ctaLabel}
                </button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Printable document — same layout as the paper Purchase Order / Proforma
// ---------------------------------------------------------------------------
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: absolute; top: 0; left: 0; width: 100%; }
  .no-print { display: none !important; }
}
`;

function PartyBlock({ label, data, showEmail = false }) {
    return (
        <div className="p-1.5 border-b border-slate-400 last:border-b-0">
            <div className="font-bold">{label}</div>
            <div className="font-semibold">{data?.name || "—"}</div>
            <div>{data?.address}</div>
            {data?.gstin && <div>GSTIN/UIN: {data.gstin}</div>}
            {data?.panNo && <div>PAN/IT No: {data.panNo}</div>}
            {data?.stateName && <div>State Name: {data.stateName}, Code: {data.stateCode}</div>}
            {data?.contact && <div>Contact: {data.contact}</div>}
            {showEmail && data?.email && <div>E-Mail: {data.email}</div>}
        </div>
    );
}

function PrintableDocument({ doc, companyName = "AKS SOLAR SYSTEMS PRIVATE LIMITED" }) {
    const shipToFirst = doc.partyOrder === "shipTo-first";
    const middleParty = shipToFirst
        ? { label: doc.billFromLabel || "Buyer (Bill to)", data: doc.billFrom }
        : { label: doc.shipToLabel || "Consignee (Ship to)", data: doc.shipTo };
    const bottomParty = shipToFirst
        ? { label: doc.shipToLabel || "Consignee (Ship to)", data: doc.shipTo }
        : { label: doc.billFromLabel || "Supplier (Bill from)", data: doc.billFrom };

    return (
        <div id="print-area" className="bg-white text-[11px] text-slate-800 font-sans p-4 border border-slate-300">
            <style>{PRINT_STYLE}</style>
            <div className="text-center font-bold text-sm mb-2">{doc.docTitle}</div>

            <div className="grid grid-cols-2 border border-slate-400 text-[11px]">
                <div className="border-r border-slate-400">
                    <PartyBlock label="Invoice To" data={doc.invoiceTo} showEmail />
                    <PartyBlock label={middleParty.label} data={middleParty.data} />
                    <PartyBlock label={bottomParty.label} data={bottomParty.data} />
                </div>
                <div className="p-1.5">
                    <div className="grid grid-cols-2 gap-x-2">
                        <div><span className="font-bold">Voucher No.</span><br />{doc.voucherNo}</div>
                        <div><span className="font-bold">Dated</span><br />{fmtDate(doc.date)}</div>
                        <div><span className="font-bold">{shipToFirst ? "Buyer's Ref./Order No." : "Reference No. & Date."}</span><br />{doc.referenceNo || "—"} {doc.referenceDate ? `/ ${fmtDate(doc.referenceDate)}` : ""}</div>
                        <div><span className="font-bold">{shipToFirst ? "Other References" : "Other References"}</span><br />{doc.otherReferences || "—"}</div>
                        <div><span className="font-bold">Dispatched through</span><br />{doc.dispatchedThrough || "—"}</div>
                        <div><span className="font-bold">Destination</span><br />{doc.destination || "—"}</div>
                        <div><span className="font-bold">Terms of Delivery</span><br />{doc.termsOfDelivery || "—"}</div>
                        <div><span className="font-bold">Mode/Terms of Payment</span><br />{doc.modeOfPayment || "—"}</div>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-t-0 border-slate-400 mt-0 text-[11px]">
                <thead>
                    <tr className="border-b border-slate-400">
                        <th className="border-r border-slate-400 p-1 w-8">SI No.</th>
                        <th className="border-r border-slate-400 p-1 text-left">Description of Goods</th>
                        <th className="border-r border-slate-400 p-1 w-16">HSN/SAC</th>
                        <th className="border-r border-slate-400 p-1 w-12">GST Rate</th>
                        <th className="border-r border-slate-400 p-1 w-16">Quantity</th>
                        <th className="border-r border-slate-400 p-1 w-14">Rate</th>
                        <th className="border-r border-slate-400 p-1 w-10">per</th>
                        <th className="p-1 w-20 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(doc.items || []).map((it, i) => (
                        <tr key={i} className="border-b border-slate-200 align-top">
                            <td className="border-r border-slate-400 p-1 text-center">{i + 1}</td>
                            <td className="border-r border-slate-400 p-1">
                                <div className="font-semibold">{it.description}</div>
                                {it.subDescription && <div className="text-slate-500">{it.subDescription}</div>}
                            </td>
                            <td className="border-r border-slate-400 p-1 text-center">{it.hsnSac || "—"}</td>
                            <td className="border-r border-slate-400 p-1 text-center">{it.gstRate}%</td>
                            <td className="border-r border-slate-400 p-1 text-center">{it.quantity} {it.unit}</td>
                            <td className="border-r border-slate-400 p-1 text-right">{Number(it.rate).toFixed(2)}</td>
                            <td className="border-r border-slate-400 p-1 text-center">{it.unit}</td>
                            <td className="p-1 text-right">{Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    {(doc.taxLines || []).map((t, i) => (
                        <tr key={"tax" + i}>
                            <td className="border-r border-slate-400 p-1" colSpan={7}>
                                <div className="text-right pr-2">{t.label}</div>
                            </td>
                            <td className="p-1 text-right">{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    {doc.roundOff != null && (
                        <tr>
                            <td className="border-r border-slate-400 p-1" colSpan={7}>
                                <div className="text-right pr-2">Round Off</div>
                            </td>
                            <td className="p-1 text-right">{Number(doc.roundOff).toFixed(2)}</td>
                        </tr>
                    )}
                    <tr className="border-t-2 border-slate-500 font-bold">
                        <td className="border-r border-slate-400 p-1 text-center" colSpan={4}>Total</td>
                        <td className="border-r border-slate-400 p-1 text-center">
                            {(doc.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0)}
                        </td>
                        <td className="border-r border-slate-400 p-1" colSpan={2}></td>
                        <td className="p-1 text-right">{fmtINR(doc.grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="border border-t-0 border-slate-400 p-1.5">
                <span className="font-bold">Amount Chargeable (in words):</span> {amountInWords(doc.grandTotal)}
            </div>

            <div className="grid grid-cols-2 border border-t-0 border-slate-400">
                <div className="p-1.5">
                    {doc.bankDetails && (
                        <>
                            <div className="font-bold mb-0.5">Company's Bank Details</div>
                            <div>A/c Holder's Name: {doc.bankDetails.holderName}</div>
                            <div>Bank Name: {doc.bankDetails.bankName}</div>
                            <div>A/c No.: {doc.bankDetails.accountNo}</div>
                            <div>Branch &amp; IFS Code: {doc.bankDetails.branchIfsc}</div>
                            {doc.bankDetails.swiftCode && <div>SWIFT Code: {doc.bankDetails.swiftCode}</div>}
                        </>
                    )}
                </div>
                <div className="p-4 text-right">
                    <div className="text-[11px]">for {companyName}</div>
                    <div className="h-10" />
                    <div className="text-[11px] font-semibold">Authorised Signatory</div>
                </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-1">This is a Computer Generated Document</div>
        </div>
    );
}


function docToWordHtml(doc, companyName = "AKS SOLAR SYSTEMS PRIVATE LIMITED") {
    const shipToFirst = doc.partyOrder === "shipTo-first";
    const middleParty = shipToFirst
        ? { label: doc.billFromLabel || "Buyer (Bill to)", data: doc.billFrom }
        : { label: doc.shipToLabel || "Consignee (Ship to)", data: doc.shipTo };
    const bottomParty = shipToFirst
        ? { label: doc.shipToLabel || "Consignee (Ship to)", data: doc.shipTo }
        : { label: doc.billFromLabel || "Supplier (Bill from)", data: doc.billFrom };

    const esc = (s) =>
        String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const partyBlock = (label, data, showEmail = false) => `
        <div style="padding:6px;border-bottom:1px solid #94a3b8;">
            <div style="font-weight:bold;">${esc(label)}</div>
            <div style="font-weight:600;">${esc(data?.name) || "—"}</div>
            <div>${esc(data?.address)}</div>
            ${data?.gstin ? `<div>GSTIN/UIN: ${esc(data.gstin)}</div>` : ""}
            ${data?.panNo ? `<div>PAN/IT No: ${esc(data.panNo)}</div>` : ""}
            ${data?.stateName ? `<div>State Name: ${esc(data.stateName)}, Code: ${esc(data.stateCode)}</div>` : ""}
            ${data?.contact ? `<div>Contact: ${esc(data.contact)}</div>` : ""}
            ${showEmail && data?.email ? `<div>E-Mail: ${esc(data.email)}</div>` : ""}
        </div>`;

    const itemRows = (doc.items || []).map((it, i) => `
        <tr>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${i + 1}</td>
            <td style="border:1px solid #94a3b8;padding:4px;">
                <div style="font-weight:600;">${esc(it.description)}</div>
                ${it.subDescription ? `<div style="color:#64748b;">${esc(it.subDescription)}</div>` : ""}
            </td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${esc(it.hsnSac) || "—"}</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${esc(it.gstRate)}%</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${esc(it.quantity)} ${esc(it.unit)}</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;">${Number(it.rate).toFixed(2)}</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${esc(it.unit)}</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;">${Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`).join("");

    const taxRows = (doc.taxLines || []).map((t) => `
        <tr>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;" colspan="7">${esc(t.label)}</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;">${Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`).join("");

    const roundOffRow = doc.roundOff != null ? `
        <tr>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;" colspan="7">Round Off</td>
            <td style="border:1px solid #94a3b8;padding:4px;text-align:right;">${Number(doc.roundOff).toFixed(2)}</td>
        </tr>` : "";

    const totalQty = (doc.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);

    const bankBlock = doc.bankDetails ? `
        <div>
            <div style="font-weight:bold;margin-bottom:2px;">Company's Bank Details</div>
            <div>A/c Holder's Name: ${esc(doc.bankDetails.holderName)}</div>
            <div>Bank Name: ${esc(doc.bankDetails.bankName)}</div>
            <div>A/c No.: ${esc(doc.bankDetails.accountNo)}</div>
            <div>Branch &amp; IFS Code: ${esc(doc.bankDetails.branchIfsc)}</div>
            ${doc.bankDetails.swiftCode ? `<div>SWIFT Code: ${esc(doc.bankDetails.swiftCode)}</div>` : ""}
        </div>` : "";

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${esc(doc.docTitle)}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11px; color:#1e293b; }
  table { border-collapse: collapse; width: 100%; }
  @media print {
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:8px;">${esc(doc.docTitle)}</div>

  <table style="border:1px solid #94a3b8;">
    <tr>
      <td style="border-right:1px solid #94a3b8;vertical-align:top;width:55%;">
        ${partyBlock("Invoice To", doc.invoiceTo, true)}
        ${partyBlock(middleParty.label, middleParty.data)}
        ${partyBlock(bottomParty.label, bottomParty.data)}
      </td>
      <td style="vertical-align:top;padding:6px;">
        <table>
          <tr><td style="font-weight:bold;">Voucher No.</td><td>${esc(doc.voucherNo)}</td></tr>
          <tr><td style="font-weight:bold;">Dated</td><td>${fmtDate(doc.date)}</td></tr>
          <tr><td style="font-weight:bold;">Reference No. &amp; Date</td><td>${esc(doc.referenceNo) || "—"} ${doc.referenceDate ? "/ " + fmtDate(doc.referenceDate) : ""}</td></tr>
          <tr><td style="font-weight:bold;">Other References</td><td>${esc(doc.otherReferences) || "—"}</td></tr>
          <tr><td style="font-weight:bold;">Dispatched through</td><td>${esc(doc.dispatchedThrough) || "—"}</td></tr>
          <tr><td style="font-weight:bold;">Destination</td><td>${esc(doc.destination) || "—"}</td></tr>
          <tr><td style="font-weight:bold;">Terms of Delivery</td><td>${esc(doc.termsOfDelivery) || "—"}</td></tr>
          <tr><td style="font-weight:bold;">Mode/Terms of Payment</td><td>${esc(doc.modeOfPayment) || "—"}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <table style="border:1px solid #94a3b8;border-top:0;">
    <thead>
      <tr>
        <th style="border:1px solid #94a3b8;padding:4px;">SI No.</th>
        <th style="border:1px solid #94a3b8;padding:4px;">Description of Goods</th>
        <th style="border:1px solid #94a3b8;padding:4px;">HSN/SAC</th>
        <th style="border:1px solid #94a3b8;padding:4px;">GST Rate</th>
        <th style="border:1px solid #94a3b8;padding:4px;">Quantity</th>
        <th style="border:1px solid #94a3b8;padding:4px;">Rate</th>
        <th style="border:1px solid #94a3b8;padding:4px;">per</th>
        <th style="border:1px solid #94a3b8;padding:4px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${taxRows}
      ${roundOffRow}
      <tr style="font-weight:bold;border-top:2px solid #64748b;">
        <td style="border:1px solid #94a3b8;padding:4px;text-align:center;" colspan="4">Total</td>
        <td style="border:1px solid #94a3b8;padding:4px;text-align:center;">${totalQty}</td>
        <td style="border:1px solid #94a3b8;padding:4px;" colspan="2"></td>
        <td style="border:1px solid #94a3b8;padding:4px;text-align:right;">${fmtINR(doc.grandTotal)}</td>
      </tr>
    </tbody>
  </table>

  <div style="border:1px solid #94a3b8;border-top:0;padding:6px;">
    <b>Amount Chargeable (in words):</b> ${esc(amountInWords(doc.grandTotal))}
  </div>

  <table style="border:1px solid #94a3b8;border-top:0;">
    <tr>
      <td style="vertical-align:top;padding:6px;width:60%;">${bankBlock}</td>
      <td style="vertical-align:top;text-align:right;padding:16px;">
        <div>for ${esc(companyName)}</div>
        <div style="height:40px;"></div>
        <div style="font-weight:600;">Authorised Signatory</div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;font-size:10px;color:#94a3b8;margin-top:4px;">This is a Computer Generated Document</div>
</body>
</html>`;
}

function downloadAsWord(doc, companyName = "AKS SOLAR SYSTEMS PRIVATE LIMITED") {
    try {
        if (!doc) {
            console.error("downloadAsWord: doc is missing");
            alert("Document data not available yet — please try again.");
            return;
        }
        const html = docToWordHtml(doc, companyName);
        const blob = new Blob(["\ufeff", html], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(doc.voucherNo || doc.docTitle || "document").toString().replace(/[^\w-]+/g, "_")}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
        console.error("downloadAsWord failed:", err);
        alert("Couldn't generate the Word file: " + (err?.message || err));
    }
}


function printDocInNewWindow(doc, companyName = "AKS SOLAR SYSTEMS PRIVATE LIMITED") {
    if (!doc) {
        alert("Document data not available yet — please try again.");
        return;
    }
    const html = docToWordHtml(doc, companyName);

    // Hidden iframe — no new tab, no visible switch. Print dialog opens on current page.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc_ = iframe.contentWindow.document;
    doc_.open();
    doc_.write(html);
    doc_.close();

    iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    };

    // cleanup after print dialog closes (or after a delay as fallback)
    const cleanup = () => {
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    iframe.contentWindow.onafterprint = cleanup;
    setTimeout(cleanup, 10000); // fallback safety
}

function PrintDocumentModal({ doc, onClose }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] w-full max-w-4xl my-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="no-print flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-lg">Document Preview</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => downloadAsWord(doc)}
                            className="bg-blue-600 text-white rounded-xl px-5 py-2 text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                            <i className="fa-solid fa-file-word" /> Download Word
                        </button>
                        <button
                            onClick={() => printDocInNewWindow(doc)}
                            className="bg-[#0b2836] text-white rounded-xl px-5 py-2 text-xs font-bold hover:bg-[#0f3345] shadow-lg shadow-[#0b2836]/20 transition-all flex items-center gap-2"
                        >
                            <i className="fa-solid fa-print" /> Print / Save PDF
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
                            <i className="fa-solid fa-xmark text-lg" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <PrintableDocument doc={doc} />
                </div>
            </div>
        </div>
    );
}

function poToPrintDoc(po) {
    const items = (po.items || []).map((it) => ({
        description: it.itemName || it.description,
        subDescription: it.itemName && it.description !== it.itemName ? it.description : null,
        hsnSac: it.hsnSac,
        gstRate: it.gstRate,
        quantity: it.quantity,
        unit: it.unit,
        rate: it.rate,
        amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    }));
    const subTotal = items.reduce((s, it) => s + it.amount, 0);
    const gstAmount = items.reduce((s, it) => s + it.amount * (Number(it.gstRate) || 0) / 100, 0);
    const rawTotal = subTotal + gstAmount;
    const grandTotal = Math.round(rawTotal);

    return {
        docTitle: "PURCHASE ORDER",
        voucherNo: po.voucherNo,
        date: po.poDate,
        referenceNo: po.voucherNo,
        referenceDate: po.poDate,
        dispatchedThrough: po.dispatchedThrough,
        destination: po.destination,
        termsOfDelivery: po.termsOfDelivery,
        modeOfPayment: po.modeOfPayment,
        invoiceTo: {
            name: "AKS SOLAR SYSTEMS PRIVATE LIMITED",
            address: "H.NO. 67-A/4, NH-21 VPO BHOJPUR, TEHSIL SUNDERNAGAR DISTT. MANDI",
            gstin: "02AAYCA7897E1Z3",
            panNo: "AAYCA7897E",
            stateName: "Himachal Pradesh",
            stateCode: "02",
            contact: "9805763000",
            email: "akssolarsystems@gmail.com",
        },
        billFromLabel: "Supplier (Bill from)",
        billFrom: {
            name: po.supplierName,
            address: po.supplierAddress,
            gstin: po.supplierGstin,
            panNo: po.supplierPanNo,
            stateName: po.supplierStateName,
            stateCode: po.supplierStateCode,
        },
        shipToLabel: "Consignee (Ship to)",
        shipTo: po.consigneeName
            ? {
                name: po.consigneeName,
                address: po.consigneeAddress,
                gstin: po.consigneeGstin,
                stateName: po.consigneeStateName,
                stateCode: po.consigneeStateCode,
            }
            : null,
        items,
        taxLines: gstAmount ? [{ label: "IGST", amount: gstAmount }] : [],
        roundOff: grandTotal - rawTotal,
        grandTotal,
    };
}

function emptyPoItem() {
    return {
        itemId: "",
        newItemName: "",
        newItemCategory: "",
        description: "",
        hsnSac: "",
        gstRate: "0",
        quantity: "1",
        unit: "Nos",
        rate: "0",
    };
}

function PoItemsEditor({ items, setItems }) {
    const update = (i, field, value) => {
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    };
    const addRow = () => setItems((prev) => [...prev, emptyPoItem()]);
    const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

    const lineTotal = (it) => (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    const grandTotal = items.reduce((sum, it) => sum + lineTotal(it), 0);

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4 bg-slate-50/50">
            <div className="bg-slate-100/50 px-5 py-3.5 flex justify-between items-center border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Line Items</span>
                <button type="button" onClick={addRow} className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/50 transition-colors flex items-center gap-1.5 shadow-sm">
                    <i className="fa-solid fa-plus" /> Add Item
                </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                {items.map((it, i) => (
                    <div key={i} className="p-4 space-y-3 relative group bg-white m-2 rounded-xl border border-slate-100 shadow-sm">
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                            >
                                <i className="fa-solid fa-trash-can text-xs" />
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-3 pr-10">
                            <input
                                placeholder="New item name (leave blank if picking existing)"
                                value={it.newItemName}
                                onChange={(e) => update(i, "newItemName", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                placeholder="Category (if new item)"
                                value={it.newItemCategory}
                                onChange={(e) => update(i, "newItemCategory", e.target.value)}
                                className={inputSm}
                            />
                        </div>
                        <input
                            placeholder="Description"
                            value={it.description}
                            onChange={(e) => update(i, "description", e.target.value)}
                            className={inputSm}
                        />
                        <div className="grid grid-cols-5 gap-3">
                            <input
                                placeholder="HSN/SAC"
                                value={it.hsnSac}
                                onChange={(e) => update(i, "hsnSac", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                placeholder="GST %"
                                value={it.gstRate}
                                onChange={(e) => update(i, "gstRate", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={it.quantity}
                                onChange={(e) => update(i, "quantity", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                placeholder="Unit"
                                value={it.unit}
                                onChange={(e) => update(i, "unit", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Rate"
                                value={it.rate}
                                onChange={(e) => update(i, "rate", e.target.value)}
                                className={inputSm}
                            />
                        </div>
                        <div className="text-right text-xs font-mono font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 inline-block float-right">
                            = {fmtINR(lineTotal(it))}
                        </div>
                        <div className="clear-both"></div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-100/50 px-5 py-3 border-t border-slate-200 text-right text-sm font-bold text-slate-800">
                Total: <span className="font-mono text-base ml-2">{fmtINR(grandTotal)}</span>
            </div>
        </div>
    );
}

function StatusMoveSelect({ po, onChanged }) {
    const [value, setValue] = useState("");
    const [updating, setUpdating] = useState(false);
    const [err, setErr] = useState("");
    const options = NEXT_STATUS[po.status] || [];

    if (!options.length) return <span className="text-slate-300 text-xs font-bold italic">—</span>;

    const handleChange = async (e) => {
        const status = e.target.value;
        if (!status) return;
        setErr("");
        setUpdating(true);
        try {
            await adminService.updatePoStatus({ poId: po.poId, status });
            await onChanged();
        } catch (updateErr) {
            setErr(updateErr.message || "Couldn't update status.");
        } finally {
            setValue("");
            setUpdating(false);
        }
    };

    return (
        <div>
            <select
                value={value}
                disabled={updating}
                onChange={handleChange}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
                <option value="" disabled>
                    {updating ? "Updating…" : "Update status"}
                </option>
                {options.map((s) => (
                    <option key={s} value={s}>
                        {s}
                    </option>
                ))}
            </select>
            {err && <div className="text-[10px] text-rose-600 mt-1 max-w-[140px] leading-tight font-semibold">{err}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Purchase Orders tab
// ---------------------------------------------------------------------------
function PurchaseOrdersTab() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [consignees, setConsignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([emptyPoItem()]);
    const [printDoc, setPrintDoc] = useState(null);
    const [printingId, setPrintingId] = useState(null);

    const load = async (keyword = "") => {
        setLoading(true);
        try {
            const res = await adminService.searchPurchaseOrders({ keyword });
            setOrders(rows(res));
        } catch (err) {
            console.error("Failed to load purchase orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        adminService
            .searchSuppliers({ isActive: true })
            .then((res) => setSuppliers(rows(res)))
            .catch((err) => console.error("Failed to load suppliers", err));
        adminService
            .getAllConsignees()
            .then((res) => setConsignees(rows(res)))
            .catch((err) => console.error("Failed to load consignees", err));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const openModal = () => {
        setItems([emptyPoItem()]);
        setError("");
        setShowModal(true);
    };

    const handlePrint = async (poId) => {
        setPrintingId(poId);
        try {
            const res = await adminService.getPurchaseOrderById(poId);
            const po = one(res);
            printDocInNewWindow(poToPrintDoc(po));   // seedha print dialog, preview modal nahi
        } catch (err) {
            console.error("Failed to load PO for printing", err);
        } finally {
            setPrintingId(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");

        const f = new FormData(e.target);
        const cleanItems = items
            .filter((it) => it.newItemName || it.itemId)
            .map((it) => ({
                itemId: it.itemId ? Number(it.itemId) : null,
                newItemName: it.itemId ? undefined : it.newItemName || undefined,
                newItemCategory: it.itemId ? undefined : it.newItemCategory || undefined,
                description: it.description || undefined,
                hsnSac: it.hsnSac || undefined,
                gstRate: Number(it.gstRate) || 0,
                quantity: Number(it.quantity) || 0,
                unit: it.unit || undefined,
                rate: Number(it.rate) || 0,
            }));

        if (cleanItems.length === 0) {
            setError("Add at least one line item.");
            return;
        }

        const payload = {
            poDate: f.get("poDate"),
            supplierId: Number(f.get("supplierId")),
            consigneeId: f.get("consigneeId") ? Number(f.get("consigneeId")) : null,
            referenceNo: f.get("referenceNo") || undefined,
            referenceDate: f.get("referenceDate") || null,
            dispatchedThrough: f.get("dispatchedThrough") || undefined,
            destination: f.get("destination") || undefined,
            termsOfDelivery: f.get("termsOfDelivery") || undefined,
            modeOfPayment: f.get("modeOfPayment") || undefined,
            items: cleanItems,
        };

        setSaving(true);
        try {
            await adminService.createPurchaseOrder(payload);
            setShowModal(false);
            load(search);
        } catch (err) {
            setError(err.message || "Couldn't create the purchase order.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder="Search PO no. or supplier..."
                ctaLabel="Create PO"
                onCta={openModal}
            />

            <Table
                head={["Voucher No.", "Supplier", "Date", "Amount", "Status", "Move to", "Actions"]}
                rows={orders.map((o) => [
                    <span className="font-mono font-bold text-amber-600">{o.voucherNo}</span>,
                    <span className="font-bold text-slate-800">{o.supplierName}</span>,
                    <span className="font-medium text-slate-600">{fmtDate(o.poDate)}</span>,
                    <span className="font-mono font-bold text-slate-700">{fmtINR(o.totalAmount)}</span>,
                    <StatusStamp status={o.status} />,
                    <StatusMoveSelect po={o} onChanged={() => load(search)} />,
                    <button
                        onClick={() => handlePrint(o.poId)}
                        disabled={printingId === o.poId}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        title="Print / Save as PDF"
                    >
                        {printingId === o.poId ? (
                            <i className="fa-solid fa-spinner animate-spin text-[13px]" />
                        ) : (
                            <i className="fa-solid fa-print text-[13px]" />
                        )}
                    </button>,
                ])}
                empty={!loading && orders.length === 0}
                emptyText={search ? "No purchase orders match that search." : "No purchase orders created yet."}
            />

            {showModal && (
                <Modal title="New Purchase Order" onClose={() => setShowModal(false)} wide>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="PO date *">
                                <input name="poDate" type="date" required className={inputClass} />
                            </Field>
                            <Field label="Supplier *">
                                <select name="supplierId" required defaultValue="" className={`${inputClass} cursor-pointer`}>
                                    <option value="" disabled>Select supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Consignee (optional)">
                                <select name="consigneeId" defaultValue="" className={`${inputClass} cursor-pointer`}>
                                    <option value="">None (Self)</option>
                                    {consignees.map((c) => (
                                        <option key={c.consigneeId} value={c.consigneeId}>{c.consigneeName}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Reference no. (optional)">
                                <input name="referenceNo" className={inputClass} placeholder="e.g. REF-2024" />
                            </Field>
                            <Field label="Reference date (optional)">
                                <input name="referenceDate" type="date" className={inputClass} />
                            </Field>
                            <Field label="Dispatched through (optional)">
                                <input name="dispatchedThrough" className={inputClass} placeholder="e.g. BlueDart" />
                            </Field>
                            <Field label="Destination (optional)">
                                <input name="destination" className={inputClass} placeholder="e.g. Mumbai Hub" />
                            </Field>
                            <Field label="Terms of delivery (optional)">
                                <input name="termsOfDelivery" className={inputClass} placeholder="e.g. 15 Days" />
                            </Field>
                            <Field label="Mode of payment (optional)">
                                <input name="modeOfPayment" className={inputClass} placeholder="e.g. NEFT/RTGS" />
                            </Field>
                        </div>

                        <PoItemsEditor items={items} setItems={setItems} />

                        {error && <p className="text-[11px] font-bold text-rose-500 mt-2 ml-1">{error}</p>}

                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Generating PO…" : "Generate Purchase Order"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}

            {printDoc && <PrintDocumentModal doc={printDoc} onClose={() => setPrintDoc(null)} />}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Suppliers tab
// ---------------------------------------------------------------------------
function SuppliersTab() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = async (keyword = "") => {
        setLoading(true);
        try {
            const res = await adminService.searchSuppliers({ keyword });
            setSuppliers(rows(res));
        } catch (err) {
            console.error("Failed to load suppliers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);
        const payload = {
            supplierName: f.get("supplierName"),
            gstin: f.get("gstin") || undefined,
            panNo: f.get("panNo") || undefined,
            address: f.get("address") || undefined,
            stateName: f.get("stateName") || undefined,
            stateCode: f.get("stateCode") || undefined,
            contactNo: f.get("contactNo") || undefined,
            email: f.get("email") || undefined,
        };
        setSaving(true);
        try {
            if (editing) {
                await adminService.updateSupplier({ ...payload, supplierId: editing.supplierId });
            } else {
                await adminService.createSupplier(payload);
            }
            setShowModal(false);
            setEditing(null);
            load(search);
        } catch (err) {
            setError(err.message || `Couldn't ${editing ? "update" : "create"} the supplier.`);
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setError("");
        setShowModal(true);
    };

    const openEdit = async (supplierId) => {
        setError("");
        try {
            const res = await adminService.getSupplierById(supplierId);
            setEditing(one(res));
            setShowModal(true);
        } catch (err) {
            console.error("Failed to load supplier", err);
        }
    };

    const handleToggle = async (id) => {
        try {
            await adminService.toggleSupplierStatus(id);
            load(search);
        } catch (err) {
            console.error("Failed to toggle supplier status", err);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder="Search supplier or GSTIN..."
                ctaLabel="Add Supplier"
                onCta={openCreate}
            />

            <Table
                head={["Supplier Name", "GSTIN", "Contact Info", "State", "Status", "Actions"]}
                rows={suppliers.map((s) => [
                    <div>
                        <div className="font-bold text-slate-900">{s.supplierName}</div>
                        {s.email && <div className="text-xs font-medium text-slate-500 mt-0.5">{s.email}</div>}
                    </div>,
                    <span className="font-mono text-xs font-semibold text-slate-600">{s.gstin || "—"}</span>,
                    <span className="font-mono text-xs font-semibold text-slate-600">{s.contactNo || "—"}</span>,
                    <span className="font-medium text-slate-600">{s.stateName ? `${s.stateName}${s.stateCode ? " (" + s.stateCode + ")" : ""}` : "—"}</span>,
                    <button
                        onClick={() => handleToggle(s.supplierId)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border transition-all ${s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {s.isActive ? "Active" : "Inactive"}
                    </button>,
                    <button
                        onClick={() => openEdit(s.supplierId)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                        title="Edit supplier"
                    >
                        <i className="fa-solid fa-pen text-[13px]" />
                    </button>,
                ])}
                empty={!loading && suppliers.length === 0}
                emptyText={search ? "No suppliers match that search." : "No suppliers registered yet."}
            />

            {showModal && (
                <Modal
                    title={editing ? `Edit Supplier — ${editing.supplierName}` : "Add New Supplier"}
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                >
                    <form onSubmit={handleCreate} key={editing?.supplierId ?? "new"}>
                        <Field label="Supplier Name *">
                            <input name="supplierName" required defaultValue={editing?.supplierName || ""} className={inputClass} placeholder="Company Name" />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="GSTIN (optional)">
                                <input name="gstin" defaultValue={editing?.gstin || ""} className={inputClass} placeholder="15-digit GSTIN" />
                            </Field>
                            <Field label="PAN no. (optional)">
                                <input name="panNo" defaultValue={editing?.panNo || ""} className={inputClass} placeholder="10-digit PAN" />
                            </Field>
                        </div>
                        <Field label="Registered Address (optional)">
                            <textarea name="address" defaultValue={editing?.address || ""} rows={2} className={`${inputClass} resize-none`} placeholder="Full address" />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="State (optional)">
                                <input name="stateName" defaultValue={editing?.stateName || ""} className={inputClass} placeholder="e.g. Maharashtra" />
                            </Field>
                            <Field label="State code (optional)">
                                <input name="stateCode" defaultValue={editing?.stateCode || ""} className={inputClass} placeholder="e.g. 27" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Contact no. (optional)">
                                <input name="contactNo" defaultValue={editing?.contactNo || ""} className={inputClass} placeholder="Phone number" />
                            </Field>
                            <Field label="Email Address (optional)">
                                <input name="email" type="email" defaultValue={editing?.email || ""} className={inputClass} placeholder="Email" />
                            </Field>
                        </div>
                        {error && <p className="text-[11px] font-bold text-rose-500 mt-2 ml-1">{error}</p>}

                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Saving…" : editing ? "Update Supplier" : "Save Supplier"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Consignees tab
// ---------------------------------------------------------------------------
function ConsigneesTab() {
    const [consignees, setConsignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllConsignees();
            setConsignees(rows(res));
        } catch (err) {
            console.error("Failed to load consignees", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);
        const payload = {
            consigneeName: f.get("consigneeName"),
            siteAddress: f.get("siteAddress"),
            gstin: f.get("gstin") || undefined,
            stateName: f.get("stateName") || undefined,
            stateCode: f.get("stateCode") || undefined,
        };
        setSaving(true);
        try {
            await adminService.createConsignee(payload);
            setShowModal(false);
            load();
        } catch (err) {
            setError(err.message || "Couldn't create the consignee.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-end">
                <button
                    onClick={() => {
                        setError("");
                        setShowModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center justify-center gap-2 shadow-sm"
                >
                    <i className="fa-solid fa-plus" /> Add Consignee
                </button>
            </div>

            <Table
                head={["Consignee Name", "Site Address", "GSTIN", "State"]}
                rows={consignees.map((c) => [
                    <span className="font-bold text-slate-900">{c.consigneeName}</span>,
                    <span className="font-medium text-slate-600 max-w-[250px] truncate block" title={c.siteAddress}>{c.siteAddress}</span>,
                    <span className="font-mono text-xs font-semibold text-slate-600">{c.gstin || "—"}</span>,
                    <span className="font-medium text-slate-600">{c.stateName ? `${c.stateName}${c.stateCode ? " (" + c.stateCode + ")" : ""}` : "—"}</span>,
                ])}
                empty={!loading && consignees.length === 0}
                emptyText="No consignees registered yet."
            />

            {showModal && (
                <Modal title="Add New Consignee" onClose={() => setShowModal(false)}>
                    <form onSubmit={handleCreate}>
                        <Field label="Consignee Name *">
                            <input name="consigneeName" required className={inputClass} placeholder="Name" />
                        </Field>
                        <Field label="Site Address *">
                            <textarea name="siteAddress" required rows={3} className={`${inputClass} resize-none`} placeholder="Full delivery address" />
                        </Field>
                        <Field label="GSTIN (optional)">
                            <input name="gstin" className={inputClass} placeholder="15-digit GSTIN" />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="State (optional)">
                                <input name="stateName" className={inputClass} placeholder="e.g. Haryana" />
                            </Field>
                            <Field label="State code (optional)">
                                <input name="stateCode" className={inputClass} placeholder="e.g. 06" />
                            </Field>
                        </div>

                        {error && <p className="text-[11px] font-bold text-rose-500 mt-2 ml-1">{error}</p>}

                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Consignee"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// GRN tab
// ---------------------------------------------------------------------------
function GrnTab() {
    const [orders, setOrders] = useState([]);
    const [selectedPoId, setSelectedPoId] = useState("");
    const [selectedPo, setSelectedPo] = useState(null);
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [receiveQty, setReceiveQty] = useState({});

    useEffect(() => {
        adminService
            .searchPurchaseOrders({})
            .then((res) => {
                const eligible = rows(res).filter((o) =>
                    ["Approved", "PartiallyReceived", "Completed"].includes(o.status)
                );
                setOrders(eligible);
            })
            .catch((err) => console.error("Failed to load purchase orders", err));
    }, []);

    const loadGrns = (poId) => {
        if (!poId) {
            setGrns([]);
            return;
        }
        setLoading(true);
        adminService
            .getGrnsByPo(poId)
            .then((res) => setGrns(rows(res)))
            .catch((err) => console.error("Failed to load GRNs", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadGrns(selectedPoId);
        setSuccess("");
        if (selectedPoId) {
            adminService
                .getPurchaseOrderById(selectedPoId)
                .then((res) => setSelectedPo(one(res)))
                .catch((err) => console.error("Failed to load PO detail", err));
        } else {
            setSelectedPo(null);
        }
    }, [selectedPoId]);

    const pendingItems = (selectedPo?.items || []).filter((it) => it.pendingQty > 0);
    const canRecordGrn = Boolean(selectedPoId) && pendingItems.length > 0;

    const openModal = () => {
        if (!canRecordGrn) return;
        setReceiveQty({});
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);

        const items = (selectedPo?.items || [])
            .map((it) => ({
                poItemId: it.poItemId,
                itemId: it.itemId,
                receivedQty: Number(receiveQty[it.poItemId]) || 0,
            }))
            .filter((it) => it.receivedQty > 0);

        if (items.length === 0) {
            setError("Enter a received quantity for at least one item.");
            return;
        }

        const payload = {
            poId: Number(selectedPoId),
            grnDate: f.get("date"),
            remarks: f.get("remarks") || undefined,
            items,
        };

        setSaving(true);
        try {
            const res = await adminService.createGrn(payload);
            setShowModal(false);
            loadGrns(selectedPoId);
            adminService.getPurchaseOrderById(selectedPoId).then((r) => setSelectedPo(one(r)));

            const msg = res?.message || res?.Message;
            setSuccess(msg || "GRN recorded successfully.");
        } catch (err) {
            setError(err.message || "Couldn't record the GRN.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border-b border-slate-100 p-5 flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:w-80">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                        Select Purchase Order
                    </label>
                    <select
                        value={selectedPoId}
                        onChange={(e) => setSelectedPoId(e.target.value)}
                        className={`${inputClass} cursor-pointer`}
                    >
                        <option value="" disabled>-- Choose Approved PO --</option>
                        {orders.map((o) => (
                            <option key={o.poId} value={o.poId}>
                                {o.voucherNo} — {o.supplierName}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedPo && (
                    <div className="mb-2.5 shrink-0">
                        <StatusStamp status={selectedPo.status} />
                    </div>
                )}

                <button
                    disabled={!canRecordGrn}
                    onClick={openModal}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${canRecordGrn
                        ? "bg-[#0b2836] hover:bg-[#0f3345] text-white shadow-lg shadow-[#0b2836]/20"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        }`}
                >
                    <i className="fa-solid fa-box-open" />
                    Record GRN
                </button>
            </div>

            {success && (
                <div className="m-5 flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl px-5 py-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-2">
                        <i className="fa-solid fa-circle-check text-lg" />
                        {success}
                    </span>
                    <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700 shrink-0">
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>
            )}

            {!selectedPoId ? (
                <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center text-center py-24">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 text-2xl shadow-sm mb-4 border-2 border-dashed border-slate-200">
                        <i className="fa-solid fa-clipboard-list" />
                    </div>
                    <p className="text-base font-bold text-slate-600">No PO Selected</p>
                    <p className="text-sm text-slate-400 mt-1">Pick a purchase order above to view or log receipts.</p>
                </div>
            ) : (
                <Table
                    head={["GRN No.", "Date Received", "Received By", "Remarks"]}
                    rows={grns.map((g) => [
                        <span className="font-mono font-bold text-amber-600">{g.grnId}</span>,
                        <span className="font-medium text-slate-700">{fmtDate(g.grnDate)}</span>,
                        <span className="font-semibold text-slate-800">{g.receivedBy ?? "—"}</span>,
                        <span className="text-slate-500 max-w-[250px] truncate block" title={g.remarks || ""}>{g.remarks || "—"}</span>,
                    ])}
                    empty={!loading && grns.length === 0}
                    emptyText="No items received against this PO yet."
                />
            )}

            {showModal && (
                <Modal title={`Log Goods Receipt — ${selectedPo?.voucherNo || ""}`} onClose={() => setShowModal(false)} wide>
                    <form onSubmit={handleCreate}>
                        <div className="mb-5">
                            <Field label="Date Received *">
                                <input name="date" type="date" required className={inputClass} />
                            </Field>
                        </div>

                        <div className="mb-5 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                            <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    Pending Items Queue
                                </span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                                {pendingItems.map((it) => (
                                    <div key={it.poItemId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white m-2 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-800 truncate mb-1">
                                                {it.description || it.itemCode}
                                            </div>
                                            <div className="flex gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                <span>Ordered: <span className="text-slate-600">{it.quantity} {it.unit}</span></span>
                                                <span>Pending: <span className="text-amber-600">{it.pendingQty} {it.unit}</span></span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 w-full sm:w-32 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max={it.pendingQty}
                                                step="0.01"
                                                placeholder="Qty Rcvd"
                                                value={receiveQty[it.poItemId] || ""}
                                                onChange={(e) =>
                                                    setReceiveQty((prev) => ({ ...prev, [it.poItemId]: e.target.value }))
                                                }
                                                className={`${inputClass} pr-10`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 pointer-events-none">{it.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Field label="Remarks / Notes (optional)">
                            <textarea name="remarks" rows={2} className={`${inputClass} resize-none`} placeholder="Any discrepancies or notes..." />
                        </Field>

                        {error && <p className="text-[11px] font-bold text-rose-500 mt-2 ml-1">{error}</p>}

                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Logging Receipt…" : "Save GRN"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page — tab shell
// ---------------------------------------------------------------------------
const TABS = [
    { key: "orders", label: "Purchase Orders", icon: "fa-solid fa-file-invoice-dollar", Component: PurchaseOrdersTab },
    { key: "suppliers", label: "Suppliers", icon: "fa-solid fa-boxes-packing", Component: SuppliersTab },
    { key: "consignees", label: "Consignees", icon: "fa-solid fa-truck-fast", Component: ConsigneesTab },
    { key: "grn", label: "GRN", icon: "fa-solid fa-box-check", Component: GrnTab },
];

export default function PurchaseModule() {
    const [active, setActive] = useState("orders");
    const ActiveComponent = useMemo(() => TABS.find((t) => t.key === active).Component, [active]);

    return (
        <div className="space-y-5 pb-10 font-sans">
            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative z-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-cart-shopping text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Purchase Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Suppliers, consignees, orders, and goods receipts in one place.</p>
                    </div>
                </div>
            </div>

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActive(t.key)}
                            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${active === t.key
                                ? "border-amber-500 text-amber-600 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                        >
                            <i className={`${t.icon} text-[13px]`} />
                            {t.label}
                        </button>
                    ))}
                </div>
                <ActiveComponent />
            </div>
        </div>
    );
}
export { PrintableDocument, PrintDocumentModal, amountInWords, docToWordHtml, downloadAsWord };