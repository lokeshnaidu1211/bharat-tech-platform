import React, { useState, useMemo } from 'react';
import { 
  Percent, 
  Layers, 
  Info, 
  Globe, 
  Building2, 
  UserCheck, 
  Download, 
  CheckCircle2, 
  Calculator, 
  ChevronRight, 
  ShieldAlert, 
  FileJson, 
  ClipboardCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GstCalculationUtilityProps {
  onClose?: () => void;
  inline?: boolean;
}

export const GstCalculationUtility: React.FC<GstCalculationUtilityProps> = ({ onClose, inline = false }) => {
  const { config, addNotification } = useApp();

  // Mode state: Merchant booking vs. Influencer payout vs. Live manual sandbox
  const [activeTab, setActiveTab] = useState<'MERCHANT' | 'INFLUENCER' | 'SANDBOX'>('MERCHANT');
  
  // State for manual calculator
  const [inputAmount, setInputAmount] = useState<number>(1000);
  const [selectedGstSlab, setSelectedGstSlab] = useState<number>(5); // 5%, 12%, 18% standard slabs
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Merchant product pre-configurations for demonstration
  const sampleProducts = [
    { title: "Organic Little Millet Flour (5kg)", category: "Staples & Millets", price: 650, baseGst: 5 },
    { title: "Wood-Pressed Yellow Mustard Oil (1L)", category: "Wood-Pressed Oils", price: 340, baseGst: 12 },
    { title: "Kashmiri Guntur Chilli Powder (500g)", category: "Traditional Spices", price: 280, baseGst: 5 },
    { title: "Handwoven Khadi Cotton Saree", category: "Handloom Textiles", price: 2400, baseGst: 5 }
  ];
  
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  const [merchantQty, setMerchantQty] = useState<number>(2);

  // Influencer payout configurations for demonstration
  const [payoutAmount, setPayoutAmount] = useState<number>(5000);
  const [hasGstRegistration, setHasGstRegistration] = useState<boolean>(false); // Most individual influencers are not registered under GST (below 20L threshold)

  // -- CALCULATE MERCHANT BOOKING TAXES --
  const merchantTaxData = useMemo(() => {
    const p = sampleProducts[selectedProductIndex];
    const grossAmount = p.price * merchantQty;
    const gstRate = p.baseGst;
    
    // Reverse calculation (if price is GST inclusive) vs. Forward calculation (price is GST exclusive)
    // Under DPDP & Swadeshi platform rules, prices are GST exclusive, meaning tax is added on top of the base.
    const baseValue = grossAmount;
    const totalGst = parseFloat((baseValue * (gstRate / 100)).toFixed(2));
    const cgst = parseFloat((totalGst / 2).toFixed(2));
    const sgst = parseFloat((totalGst / 2).toFixed(2));
    const igst = totalGst;

    // TCS (Tax Collected at Source under CGST Act Section 52): 1.0% total (0.5% CGST + 0.5% SGST) for e-commerce operators
    const tcsRate = 1.0;
    const tcsValue = parseFloat((baseValue * (tcsRate / 100)).toFixed(2));
    const tcsCgst = parseFloat((tcsValue / 2).toFixed(2));
    const tcsSgst = parseFloat((tcsValue / 2).toFixed(2));

    // TDS (Tax Deducted at Source under Income Tax Act Section 194-O): 1.0% for e-commerce transactions
    const tdsRate = 1.0;
    const tdsValue = parseFloat((baseValue * (tdsRate / 100)).toFixed(2));

    const totalInvoice = parseFloat((baseValue + totalGst).toFixed(2));
    const finalMerchantPayout = parseFloat((baseValue - tcsValue - tdsValue).toFixed(2));

    return {
      productTitle: p.title,
      category: p.category,
      grossAmount,
      baseValue,
      gstRate,
      totalGst,
      cgst,
      sgst,
      igst,
      tcsRate,
      tcsValue,
      tcsCgst,
      tcsSgst,
      tdsRate,
      tdsValue,
      totalInvoice,
      finalMerchantPayout
    };
  }, [selectedProductIndex, merchantQty]);

  // -- CALCULATE INFLUENCER PAYOUT TAXES --
  const influencerTaxData = useMemo(() => {
    const grossComm = payoutAmount;
    
    // TDS under Section 194-H (Commission or Brokerage): 5% flat withholding for resident individuals if payout > ₹15,000 annually.
    // For Swadeshi platform safety, 5% is withheld and routed directly to the Income Tax Department.
    const tdsRate = 5.0;
    const tdsWithheld = parseFloat((grossComm * (tdsRate / 100)).toFixed(2));

    // If influencer is GST registered, they charge 18% GST (Service Code SAC 9983) which platform pays.
    // If not, no GST is charged but platform handles general ledger reporting.
    const gstRate = hasGstRegistration ? 18.0 : 0.0;
    const addedGst = parseFloat((grossComm * (gstRate / 100)).toFixed(2));
    const cgst = parseFloat((addedGst / 2).toFixed(2));
    const sgst = parseFloat((addedGst / 2).toFixed(2));
    const igst = addedGst;

    const totalDisbursed = parseFloat((grossComm + addedGst).toFixed(2));
    const netToBank = parseFloat((grossComm - tdsWithheld).toFixed(2));

    return {
      grossComm,
      tdsRate,
      tdsWithheld,
      gstRate,
      addedGst,
      cgst,
      sgst,
      igst,
      totalDisbursed,
      netToBank
    };
  }, [payoutAmount, hasGstRegistration]);

  // -- CALCULATE SANDBOX MANUAL TAXES --
  const sandboxTaxData = useMemo(() => {
    const baseVal = inputAmount;
    const totalGst = parseFloat((baseVal * (selectedGstSlab / 100)).toFixed(2));
    const cgst = parseFloat((totalGst / 2).toFixed(2));
    const sgst = parseFloat((totalGst / 2).toFixed(2));
    const igst = totalGst;

    const tds194O = parseFloat((baseVal * 0.01).toFixed(2)); // 1.0%
    const tcs52 = parseFloat((baseVal * 0.01).toFixed(2)); // 1.0%

    return {
      baseVal,
      totalGst,
      cgst,
      sgst,
      igst,
      tds194O,
      tcs52,
      totalBill: parseFloat((baseVal + totalGst).toFixed(2))
    };
  }, [inputAmount, selectedGstSlab]);

  // Copy structured compliance JSON payload
  const handleCopyPayload = (type: string, data: any) => {
    const payload = {
      complianceStandard: "GSTIN-COMPLIANT-INVOICING-v3",
      timestamp: new Date().toISOString(),
      governingActs: [
        "CGST Act 2017 (Section 9)",
        "IGST Act 2017 (Section 5)",
        "Income Tax Act 1961 (Section 194-O, 194-H)",
        "GST E-Commerce TCS (Section 52)"
      ],
      ...data
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedInvoiceId(type);
    addNotification(`GST Compliance: Structured ${type} payload copied to clipboard.`);
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-900 ${inline ? 'w-full' : 'max-w-4xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200'}`}>
      
      {/* Dynamic Header Ribbon */}
      <div className="bg-slate-950 text-white p-5 md:p-6 relative shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-orange-400">
              <Calculator className="w-4 h-4" />
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase">STATUTORY TAX ENGINE</span>
            </div>
            <h2 className="text-lg md:text-xl font-light text-slate-100 font-display">
              GST & Direct Tax <span className="font-bold text-emerald-400">Compliance Utility</span>
            </h2>
            <p className="text-[10px] text-slate-400 max-w-2xl leading-normal">
              Automated CGST, SGST, IGST, and TDS withholding splitter conforming to e-commerce guidelines under the CGST Act 2017 & Income Tax Act 1961.
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-sm text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ✕ CLOSE
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 p-1">
        {[
          { id: 'MERCHANT', label: 'I. Merchant Order Booking GST', icon: Building2 },
          { id: 'INFLUENCER', label: 'II. Promoter Payout & TDS', icon: UserCheck },
          { id: 'SANDBOX', label: 'III. Inter-State Sandbox', icon: Globe }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-900 text-indigo-950 bg-white shadow-3xs rounded-t-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Body Area */}
      <div className="p-5 md:p-6 lg:p-8 bg-slate-50/50">

        {/* TAB 1: MERCHANT TAX CALCULATOR */}
        {activeTab === 'MERCHANT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            
            {/* Input Controllers (col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4 shadow-3xs">
                <span className="text-[9px] font-mono font-bold text-indigo-950 uppercase tracking-widest block border-b border-slate-100 pb-1.5">Configure Order</span>
                
                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">1. Select Swadeshi Product</label>
                  <select
                    value={selectedProductIndex}
                    onChange={(e) => setSelectedProductIndex(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950"
                  >
                    {sampleProducts.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.title} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">2. Booking Quantity</label>
                    <span className="text-xs font-bold text-slate-900 font-mono">{merchantQty} Units</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={merchantQty}
                    onChange={(e) => setMerchantQty(Number(e.target.value))}
                    className="w-full accent-slate-950 cursor-pointer"
                  />
                </div>

                {/* Routing rule banner */}
                <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-sm space-y-1 text-xs text-indigo-950 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Intra-state CGST/SGST splitting</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600">
                    By default, intra-state delivery is assumed within Karnataka (DPI node local cluster). Split components map directly to State & Central treasuries.
                  </p>
                </div>
              </div>

              {/* Legal Reference Note */}
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-[10.5px] text-slate-600 space-y-1.5 font-mono">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>GSTIN-TCS Section 52</span>
                </div>
                <p className="leading-normal">
                  E-commerce operators are strictly mandated to withhold TCS (Tax Collected at Source) @ 1.0% of the net taxable sales and deposit it into the Government treasury.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown Output (col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-3xs">
                
                {/* Header of Invoice */}
                <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
                  <span className="text-xs font-bold font-mono text-emerald-400">GST Invoice Audit Preview</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Section 9 CGST Act</span>
                </div>

                {/* Ledger Items */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">{merchantTaxData.productTitle}</span>
                      <p className="text-[10px] text-slate-400 font-mono">Tax Category: {merchantTaxData.category}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{merchantTaxData.grossAmount.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Tax Components (Slab {merchantTaxData.gstRate}%)</span>
                    
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span>Central GST (CGST @ {merchantTaxData.gstRate/2}%):</span>
                      <span className="text-slate-900">₹{merchantTaxData.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span>State GST (SGST @ {merchantTaxData.gstRate/2}%):</span>
                      <span className="text-slate-900">₹{merchantTaxData.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-indigo-900 font-mono pt-1">
                      <span>Total GST Added Component:</span>
                      <span>₹{merchantTaxData.totalGst.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Withholding Deductions (E-Commerce Escrow)</span>
                    
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span className="flex items-center gap-1">
                        TCS (Sec 52 @ {merchantTaxData.tcsRate}%):
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded hover:cursor-help" title="withheld for GST">GST TCS</span>
                      </span>
                      <span className="text-rose-600 font-bold">-₹{merchantTaxData.tcsValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span className="flex items-center gap-1">
                        TDS (Sec 194-O @ {merchantTaxData.tdsRate}%):
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded hover:cursor-help" title="Income Tax withholding">IT TDS</span>
                      </span>
                      <span className="text-rose-600 font-bold">-₹{merchantTaxData.tdsValue.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Summary Footer Blocks */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-0.5">
                      <span className="text-[8px] font-mono font-bold text-slate-400 block uppercase">CUSTOMER TO PAY</span>
                      <strong className="text-base text-slate-950 font-mono block">₹{merchantTaxData.totalInvoice.toFixed(2)}</strong>
                      <span className="text-[8px] text-slate-500 block font-mono">Inclusive of GST</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded border border-emerald-150 space-y-0.5">
                      <span className="text-[8px] font-mono font-bold text-emerald-800 block uppercase">NET DISBURSED TO MERCH</span>
                      <strong className="text-base text-emerald-700 font-mono block">₹{merchantTaxData.finalMerchantPayout.toFixed(2)}</strong>
                      <span className="text-[8px] text-emerald-600 block font-mono">Post TCS & TDS Clearance</span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyPayload('MerchantGSTInvoice', merchantTaxData)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedInvoiceId === 'MerchantGSTInvoice' ? (
                      <>
                        <ClipboardCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Copied Compliance Payload!
                      </>
                    ) : (
                      <>
                        <FileJson className="w-4 h-4 text-slate-300" />
                        Copy Verified JSON Tax Payload
                      </>
                    )}
                  </button>

                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: INFLUENCER PAYOUT TDS & GST COMPONENT */}
        {activeTab === 'INFLUENCER' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            
            {/* Input Controls (col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4 shadow-3xs">
                <span className="text-[9px] font-mono font-bold text-indigo-950 uppercase tracking-widest block border-b border-slate-100 pb-1.5">Configure Promoter Payout</span>
                
                {/* Payout gross amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">1. Gross Commission Earned (₹)</label>
                    <span className="text-xs font-mono font-black text-slate-950">₹{payoutAmount}</span>
                  </div>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono font-bold rounded-sm focus:outline-none focus:border-slate-950"
                  />
                  <div className="flex gap-2">
                    {[500, 1500, 5000, 15000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayoutAmount(amt)}
                        className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded-sm text-[9.5px] font-mono font-bold text-slate-700"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GST registered toggle */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">2. Promoter GSTIN Registered?</span>
                    <button
                      type="button"
                      onClick={() => setHasGstRegistration(!hasGstRegistration)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hasGstRegistration ? 'bg-indigo-900' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          hasGstRegistration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Under Indian tax rules, micro-influencers with annual turnover below ₹20 Lakhs do not need GST registration.
                  </p>
                </div>
              </div>

              {/* Legal Reference Note */}
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-[10.5px] text-slate-600 space-y-1.5 font-mono">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Withholding TDS Sec 194-H</span>
                </div>
                <p className="leading-normal">
                  All referral commissions paid to promoters are subject to flat 5% TDS (Tax Deducted at Source) under Section 194-H if annual payments exceed the standard ₹15,000 threshold.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown Output (col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-3xs">
                
                {/* Header of Invoice */}
                <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
                  <span className="text-xs font-bold font-mono text-indigo-300">Promoter Settlement & TDS Audit</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Sec 194-H & SAC 9983</span>
                </div>

                {/* Ledger Items */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">Gross Attributed Commission:</span>
                    <span className="font-mono font-bold text-slate-900">₹{influencerTaxData.grossComm.toFixed(2)}</span>
                  </div>

                  {/* GST component (18%) if registered */}
                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Affiliate Service GST Component</span>
                      <span className="text-[8.5px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-150">
                        {hasGstRegistration ? 'SAC 9983 - 18%' : 'EXEMPTED / NOT REG.'}
                      </span>
                    </div>

                    {hasGstRegistration ? (
                      <>
                        <div className="flex justify-between text-slate-600 font-mono">
                          <span>CGST (9.0% on Service):</span>
                          <span className="text-slate-900">₹{influencerTaxData.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-mono">
                          <span>SGST (9.0% on Service):</span>
                          <span className="text-slate-900">₹{influencerTaxData.sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-indigo-950 font-mono pt-1">
                          <span>Total Added GST Service Credit:</span>
                          <span>+₹{influencerTaxData.addedGst.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 italic">
                        No service tax added. Commission is paid at gross value.
                      </p>
                    )}
                  </div>

                  {/* TDS witholding (Sec 194-H) */}
                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Withholding Tax (TDS Reserve)</span>
                    
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span className="flex items-center gap-1.5">
                        TDS (Section 194-H @ {influencerTaxData.tdsRate}%):
                        <span className="text-[8.5px] text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded font-mono font-bold">194H</span>
                      </span>
                      <span className="text-rose-600 font-bold">-₹{influencerTaxData.tdsWithheld.toFixed(2)}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-normal font-mono">
                      Withheld automatically and logged against Promoter PAN under Central ITD nodes.
                    </p>
                  </div>

                  {/* Summary Footer Blocks */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-0.5">
                      <span className="text-[8px] font-mono font-bold text-slate-400 block uppercase">TOTAL EXPENSE DISBURSED</span>
                      <strong className="text-base text-slate-950 font-mono block">₹{influencerTaxData.totalDisbursed.toFixed(2)}</strong>
                      <span className="text-[8px] text-slate-500 block font-mono">Gross + Service GST</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded border border-emerald-150 space-y-0.5">
                      <span className="text-[8px] font-mono font-bold text-emerald-800 block uppercase">NET CREDITED TO PROMOTER</span>
                      <strong className="text-base text-emerald-700 font-mono block">₹{influencerTaxData.netToBank.toFixed(2)}</strong>
                      <span className="text-[8px] text-emerald-600 block font-mono">Cleared directly to VPA</span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyPayload('InfluencerPayoutTDS', influencerTaxData)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedInvoiceId === 'InfluencerPayoutTDS' ? (
                      <>
                        <ClipboardCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Copied Compliance Payload!
                      </>
                    ) : (
                      <>
                        <FileJson className="w-4 h-4 text-slate-300" />
                        Copy Verified JSON Tax Payload
                      </>
                    )}
                  </button>

                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LIVE SANDBOX - INTER-STATE vs INTRA-STATE CALCULATOR */}
        {activeTab === 'SANDBOX' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Split layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Inputs */}
              <div className="md:col-span-5 bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-3xs">
                <span className="text-[9px] font-mono font-bold text-indigo-950 uppercase tracking-widest block border-b border-slate-100 pb-1.5">Free Sandbox Variables</span>
                
                {/* Manual amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Custom Basket Value (₹)</label>
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono font-bold rounded-sm focus:outline-none focus:border-slate-950"
                  />
                </div>

                {/* GST Tax slabs */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Select Tax Category Slab</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 12, 18].map((slab) => (
                      <button
                        key={slab}
                        type="button"
                        onClick={() => setSelectedGstSlab(slab)}
                        className={`py-2 rounded font-mono font-bold text-xs border transition-all ${
                          selectedGstSlab === slab
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {slab}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interstate Toggle */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Inter-State Transaction Routing?</span>
                      <span className="text-[9px] text-slate-400 block font-mono">IGST vs CGST+SGST</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInterState(!isInterState)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isInterState ? 'bg-orange-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isInterState ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

              </div>

              {/* Outputs with details */}
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-950 text-white p-5 rounded-lg border border-slate-850 space-y-4 shadow-sm relative">
                  <div className="absolute top-4 right-4 text-[8px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {isInterState ? 'IGST ROUTE - INTER-STATE' : 'CGST/SGST ROUTE - INTRA-STATE'}
                  </div>

                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-2">Compliance Split Result</span>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-[10px]">Taxable Base Value:</span>
                      <p className="font-mono font-bold text-slate-100 text-sm">₹{sandboxTaxData.baseVal.toFixed(2)}</p>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <span className="text-slate-500 text-[10px]">Total Invoice Value:</span>
                      <p className="font-mono font-bold text-emerald-400 text-sm">₹{sandboxTaxData.totalBill.toFixed(2)}</p>
                    </div>

                    <div className="col-span-2 border-t border-slate-850/60 my-1"></div>

                    {isInterState ? (
                      <div className="col-span-2 space-y-2">
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-orange-400" />
                            Integrated GST (IGST @ {selectedGstSlab}%):
                          </span>
                          <span className="font-bold text-orange-400">₹{sandboxTaxData.igst.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Paid in full directly to the Central Government under Section 5 of the IGST Act 2017, which redistributes splits to the consuming state.
                        </p>
                      </div>
                    ) : (
                      <div className="col-span-2 space-y-2">
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-emerald-400" />
                            Central GST (CGST @ {selectedGstSlab/2}%):
                          </span>
                          <span className="font-bold text-emerald-400">₹{sandboxTaxData.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-mono border-b border-slate-850 pb-2 mb-2">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-emerald-400" />
                            State GST (SGST @ {selectedGstSlab/2}%):
                          </span>
                          <span className="font-bold text-emerald-400">₹{sandboxTaxData.sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-mono font-bold">
                          <span className="text-slate-200">Combined GST Credit:</span>
                          <span className="text-indigo-400 text-sm">₹{sandboxTaxData.totalGst.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="col-span-2 border-t border-slate-850/60 my-1"></div>

                    {/* e-com TCS & TDS splits */}
                    <div className="col-span-2 grid grid-cols-2 gap-4 text-[10.5px]">
                      <div className="bg-slate-900 p-2.5 rounded border border-slate-850 space-y-0.5">
                        <span className="text-[8px] font-mono text-slate-400 block uppercase">E-Com TCS (Section 52)</span>
                        <strong className="text-rose-400 font-mono block">₹{sandboxTaxData.tcs52.toFixed(2)}</strong>
                        <span className="text-[7.5px] text-slate-500 block">withheld by platform</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded border border-slate-850 space-y-0.5">
                        <span className="text-[8px] font-mono text-slate-400 block uppercase">E-Com TDS (Section 194-O)</span>
                        <strong className="text-rose-400 font-mono block">₹{sandboxTaxData.tds194O.toFixed(2)}</strong>
                        <span className="text-[7.5px] text-slate-500 block">remitted to PAN credit</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
