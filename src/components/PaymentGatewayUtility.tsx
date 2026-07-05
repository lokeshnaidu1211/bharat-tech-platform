import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { User, Order } from '../types';
import { 
  CreditCard, 
  ArrowUpRight, 
  QrCode, 
  Activity, 
  CircleDollarSign, 
  CheckCircle2, 
  Wallet, 
  Percent, 
  Terminal, 
  Users, 
  Sliders, 
  ArrowRight, 
  Lock, 
  TrendingUp, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck,
  AlertCircle,
  Clock,
  HelpCircle
} from 'lucide-react';

interface PaymentGatewayUtilityProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  initialAmount?: number;
  initialInfluencerId?: string;
}

export const PaymentGatewayUtility: React.FC<PaymentGatewayUtilityProps> = ({ 
  isOpen, 
  onClose,
  initialOrderId,
  initialAmount,
  initialInfluencerId
}) => {
  const { users, orders, config, language, addNotification, confirmHandshake } = useApp();
  const t = TRANSLATIONS[language];

  // Simulator states
  const [selectedOrderId, setSelectedOrderId] = useState<string>('custom');
  const [transactionAmount, setTransactionAmount] = useState<number>(1250);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');
  
  // Custom percentages/amounts (initialized from system config)
  const [customPlatformPercent, setCustomPlatformPercent] = useState<number>(config.platformFeePercent);
  const [customTaxPercent, setCustomTaxPercent] = useState<number>(config.defaultTaxPercent);
  const [customInfluencerPercent, setCustomInfluencerPercent] = useState<number>(config.defaultInfluencerPercent);
  const [customDeliveryAmount, setCustomDeliveryAmount] = useState<number>(config.deliveryFeeAmount);

  // Clearing simulator state
  const [upiStep, setUpiStep] = useState<'SETUP' | 'PIN_PAD' | 'CLEARING_LOGS' | 'RECEIPT'>('SETUP');
  const [upiPin, setUpiPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [clearingLogs, setClearingLogs] = useState<string[]>([]);
  const [simulatedTxnId, setSimulatedTxnId] = useState<string>('');

  // Local settlement history
  const [settledTxns, setSettledTxns] = useState<any[]>([]);

  // Filter users by role
  const merchants = users.filter((u) => u.role === 'MERCHANT');
  const riders = users.filter((u) => u.role === 'DELIVERY_PARTNER');
  const influencers = users.filter((u) => u.role === 'INFLUENCER');

  // Load defaults on mount/open
  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        setSelectedOrderId(initialOrderId);
        const order = orders.find((o) => o.id === initialOrderId);
        if (order) {
          setTransactionAmount(order.product.price * order.quantity);
          setSelectedMerchantId(order.merchantId);
          if (order.influencerId) {
            setSelectedInfluencerId(order.influencerId);
          }
          setCustomPlatformPercent(order.platformFeePercent);
          setCustomTaxPercent(order.taxPercent);
          setCustomInfluencerPercent(order.commissionPercent);
          setCustomDeliveryAmount(order.deliveryFeeAmount);
        }
      } else {
        setSelectedOrderId('custom');
        if (initialAmount !== undefined) {
          setTransactionAmount(initialAmount);
        }
        if (initialInfluencerId) {
          setSelectedInfluencerId(initialInfluencerId);
        }
      }

      if (merchants.length > 0 && !selectedMerchantId) {
        setSelectedMerchantId(merchants[0].id);
      }
      if (riders.length > 0 && !selectedRiderId) {
        setSelectedRiderId(riders[0].id);
      }
      if (influencers.length > 0 && !selectedInfluencerId && !initialInfluencerId) {
        setSelectedInfluencerId(influencers[0].id);
      }
    }
  }, [users, isOpen, initialOrderId, initialAmount, initialInfluencerId]);

  // Prepopulate form if user selects an existing order
  const handleOrderSelectionChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId === 'custom') {
      setTransactionAmount(1250);
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setTransactionAmount(order.product.price * order.quantity);
      setSelectedMerchantId(order.merchantId);
      if (order.influencerId) {
        setSelectedInfluencerId(order.influencerId);
      }
      setCustomPlatformPercent(order.platformFeePercent);
      setCustomTaxPercent(order.taxPercent);
      setCustomInfluencerPercent(order.commissionPercent);
      setCustomDeliveryAmount(order.deliveryFeeAmount);
    }
  };

  // Split calculation formulas
  const totalBill = transactionAmount;
  const platformFeeVal = parseFloat((totalBill * (customPlatformPercent / 100)).toFixed(2));
  const govtTaxVal = parseFloat((totalBill * (customTaxPercent / 100)).toFixed(2));
  const influencerVal = selectedInfluencerId ? parseFloat((totalBill * (customInfluencerPercent / 100)).toFixed(2)) : 0;
  const deliveryVal = customDeliveryAmount;
  
  // Under UPI Split Pay, delivery fee is either paid extra by customer or comes from the basket.
  // To match the app's standard confirmHandshake Net formula:
  // merchantNet = TotalItemAmount - platformFee - govtTax - influencerCommission
  // (Delivery partner fee is paid as a direct additional ledger credit of deliveryFeeAmount, which was funded by the buyer)
  const merchantNetVal = parseFloat((totalBill - platformFeeVal - govtTaxVal - influencerVal).toFixed(2));
  const customerTotalPaid = parseFloat((totalBill + deliveryVal).toFixed(2));

  const activeMerchant = users.find((u) => u.id === selectedMerchantId);
  const activeRider = users.find((u) => u.id === selectedRiderId);
  const activeInfluencer = selectedInfluencerId ? users.find((u) => u.id === selectedInfluencerId) : null;

  // Keypad simulation input helper
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setUpiPin('');
    } else if (val === 'DELETE') {
      setUpiPin((prev) => prev.slice(0, -1));
    } else {
      if (upiPin.length < 6) {
        setUpiPin((prev) => prev + val);
      }
    }
  };

  // Run instant split settlement simulation via Full-Stack payment split API
  const handleStartClearing = async () => {
    if (upiPin.length < 4) {
      setPinError('A secure 4-to-6 digit UPI PIN is required for settlement signatures.');
      return;
    }
    setPinError('');
    setUpiStep('CLEARING_LOGS');
    setProgress(5);
    setClearingLogs([
      `[NPCI-PSP] Initiating secure dual-factor UPI 2.0 handshake...`,
      `[NPCI-PSP] Direct payload encrypted using AES-256 with e-KYC credentials.`,
      `[NPCI-PSP] Authenticating Virtual Payment Address (VPA) routing...`
    ]);

    try {
      const res = await fetch('/api/payment/split-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: transactionAmount,
          merchantVpa: activeMerchant?.vpa || 'merchant@okaxis',
          riderVpa: activeRider?.vpa || 'rider@okhdfc',
          influencerVpa: activeInfluencer?.vpa || 'None',
          platformPercent: customPlatformPercent,
          taxPercent: customTaxPercent,
          commissionPercent: customInfluencerPercent,
          deliveryFee: customDeliveryAmount
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Split calculation failed.');
      }

      // Stagger showing NPCI steps
      for (let i = 0; i < data.steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setProgress(data.steps[i].progress);
        setClearingLogs((prev) => [...prev, data.steps[i].message]);
      }

      // Finalize transaction with actual backend response data
      const txnId = data.transactionId;
      setSimulatedTxnId(txnId);
      
      const newSettledRecord = {
        id: txnId,
        orderId: selectedOrderId === 'custom' ? 'Direct Simulation' : selectedOrderId,
        total: customerTotalPaid,
        merchantVpa: activeMerchant?.vpa || 'merchant@okaxis',
        merchantAmt: data.splits.merchant,
        riderVpa: activeRider?.vpa || 'rider@okhdfc',
        riderAmt: data.splits.rider,
        platformAmt: data.splits.platform,
        taxAmt: data.splits.tax,
        influencerVpa: activeInfluencer?.vpa || 'None',
        influencerAmt: data.splits.influencer,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSettledTxns((prev) => [newSettledRecord, ...prev]);

      // If this simulation was triggered for an actual platform order that was IN_TRANSIT,
      // let's mark it as DELIVERED to synchronize real state!
      if (selectedOrderId !== 'custom') {
        confirmHandshake(selectedOrderId);
        addNotification(`DPI Live Settlement complete! Placed order ${selectedOrderId} has been cleared in the background.`);
      } else {
        addNotification(`Sovereign Payment Gateway: Sim-Txn settled for ₹${customerTotalPaid.toFixed(2)}.`);
      }

      setUpiStep('RECEIPT');

    } catch (err: any) {
      console.error(err);
      setClearingLogs((prev) => [...prev, `[NPCI-CLEARING] ERROR: ${err.message || 'Interbank route disconnected.'}`]);
      setPinError(err.message || 'Interbank route disconnected.');
      setUpiStep('PIN_PAD');
    }
  };

  const resetSimulator = () => {
    setUpiStep('SETUP');
    setUpiPin('');
    setPinError('');
    setProgress(0);
    setClearingLogs([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('Transaction parameters copied as structural JSON.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-slate-950 text-white p-5 md:p-6 shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-4.5 h-4.5 text-orange-400" />
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">FINTECH AGGREGATOR MODULE</span>
              </div>
              <h2 className="text-xl md:text-2xl font-light text-slate-100 font-display">
                NPCI UPI 2.0 <span className="font-bold text-emerald-400">Instant Split-Settlement Gateway</span>
              </h2>
              <p className="text-[10.5px] text-slate-400 max-w-2xl leading-normal">
                Simulating atomic multi-payee direct bank payouts under the Swadeshi Public Service Mandate. Capped platform fees are dispersed concurrently with merchant credit and rider delivery splits.
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-sm text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          
          {/* LEFT COLUMN (Lg: col-span-7) - CALCULATOR & INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Setup Form */}
            <div className="bg-white p-5 md:p-6 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">I. Configure Payout Parameters</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Transaction Source */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">1. Link Platform Order</label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => handleOrderSelectionChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950"
                  >
                    <option value="custom">-- Custom Free Sandbox Simulation --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} ({o.customerName.slice(0, 10)}...) - ₹{(o.product.price * o.quantity).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">2. Basket Value (₹)</label>
                  <input
                    type="number"
                    value={transactionAmount}
                    disabled={selectedOrderId !== 'custom'}
                    onChange={(e) => setTransactionAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono font-bold rounded-sm focus:outline-none focus:border-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter transaction value"
                  />
                </div>

                {/* 3. Merchant Beneficiary */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">3. Beneficiary Merchant</label>
                  <select
                    value={selectedMerchantId}
                    disabled={selectedOrderId !== 'custom'}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950 disabled:opacity-75"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        🏪 {m.storeName || m.name} ({m.vpa})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. EV Rider Beneficiary */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">4. Logistics Rider</label>
                  <select
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950"
                  >
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        🚴 {r.name} ({r.vpa})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Creator Beneficiary (Promoter) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">5. Optional Swadeshi Promoter VPA</label>
                  <select
                    value={selectedInfluencerId}
                    disabled={selectedOrderId !== 'custom'}
                    onChange={(e) => setSelectedInfluencerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950 disabled:opacity-75"
                  >
                    <option value="">-- No Creator Affiliate Payout --</option>
                    {influencers.map((i) => (
                      <option key={i.id} value={i.id}>
                        🤳 {i.name} ({i.vpa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slider Settings (Admin Controls style) */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">SLIT PAYOUT RATIO GOVERNANCE</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Platform percent */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">DPI Platform Fee:</span>
                      <span className="font-mono font-bold text-slate-900">{customPlatformPercent.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.1}
                      disabled={selectedOrderId !== 'custom'}
                      value={customPlatformPercent}
                      onChange={(e) => setCustomPlatformPercent(Number(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-[8.5px] text-slate-400 font-mono block">Capped legally at 2-3% of order amount.</span>
                  </div>

                  {/* GST percent */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">Tax Reserve (GST/TDS):</span>
                      <span className="font-mono font-bold text-slate-900">{customTaxPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={18}
                      step={1}
                      disabled={selectedOrderId !== 'custom'}
                      value={customTaxPercent}
                      onChange={(e) => setCustomTaxPercent(Number(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-[8.5px] text-slate-400 font-mono block">Swadeshi traditional items default: 5%</span>
                  </div>

                  {/* Delivery partner fee */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">Rider Delivery Fee:</span>
                      <span className="font-mono font-bold text-slate-900">₹{customDeliveryAmount}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      step={5}
                      disabled={selectedOrderId !== 'custom'}
                      value={customDeliveryAmount}
                      onChange={(e) => setCustomDeliveryAmount(Number(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-[8.5px] text-slate-400 font-mono block">Directly credited split for EV transit.</span>
                  </div>

                  {/* Creator commission percent */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">Creator commission:</span>
                      <span className="font-mono font-bold text-slate-900">{customInfluencerPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      disabled={selectedOrderId !== 'custom' || !selectedInfluencerId}
                      value={customInfluencerPercent}
                      onChange={(e) => setCustomInfluencerPercent(Number(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-[8.5px] text-slate-400 font-mono block">Distributed split to affiliate promoters.</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Split Visual Estimator Card */}
            <div className="bg-slate-900 text-white p-5 md:p-6 rounded-lg border border-slate-850 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">II. Real-time Settlement Estimates</h3>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/20 rounded-sm">
                  NPCI CLEARING SIMULATION
                </span>
              </div>

              {/* Split Ratios Stacked Bar Chart */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                  <span>Split Payout Allocation Bar</span>
                  <span>Total Paid: ₹{customerTotalPaid.toFixed(2)}</span>
                </div>
                
                {/* Visual Segment Bar */}
                <div className="w-full h-4 bg-slate-950 rounded-sm overflow-hidden flex border border-slate-800 text-[8px] font-mono font-bold">
                  {/* Merchant Net segment */}
                  <div 
                    style={{ width: `${(merchantNetVal / customerTotalPaid) * 100}%` }}
                    className="bg-orange-500 h-full flex items-center justify-center text-white"
                    title={`Merchant Share: ${((merchantNetVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  >
                    {((merchantNetVal / customerTotalPaid) * 100) > 15 && `MCH: ${((merchantNetVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  </div>

                  {/* Rider Segment */}
                  <div 
                    style={{ width: `${(deliveryVal / customerTotalPaid) * 100}%` }}
                    className="bg-emerald-500 h-full flex items-center justify-center text-slate-950"
                    title={`Rider Split: ${((deliveryVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  >
                    {((deliveryVal / customerTotalPaid) * 100) > 15 && `RDR: ${((deliveryVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  </div>

                  {/* Creator Split Segment */}
                  {selectedInfluencerId && (
                    <div 
                      style={{ width: `${(influencerVal / customerTotalPaid) * 100}%` }}
                      className="bg-indigo-500 h-full flex items-center justify-center text-white"
                      title={`Creator Split: ${((influencerVal / customerTotalPaid) * 100).toFixed(0)}%`}
                    >
                      {((influencerVal / customerTotalPaid) * 100) > 12 && `CRE: ${((influencerVal / customerTotalPaid) * 100).toFixed(0)}%`}
                    </div>
                  )}

                  {/* Platform segment */}
                  <div 
                    style={{ width: `${(platformFeeVal / customerTotalPaid) * 100}%` }}
                    className="bg-purple-600 h-full flex items-center justify-center text-white animate-pulse"
                    title={`Platform Fee: ${((platformFeeVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  >
                    {((platformFeeVal / customerTotalPaid) * 100) > 10 && `DPI: ${((platformFeeVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  </div>

                  {/* Government GST Tax segment */}
                  <div 
                    style={{ width: `${(govtTaxVal / customerTotalPaid) * 100}%` }}
                    className="bg-blue-500 h-full flex items-center justify-center text-white"
                    title={`Tax Split: ${((govtTaxVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  >
                    {((govtTaxVal / customerTotalPaid) * 100) > 10 && `TAX: ${((govtTaxVal / customerTotalPaid) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>

              {/* Breakdown Ledger Bento Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                
                {/* 1. Customer Pays */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-slate-400 block uppercase">Paid by Buyer</span>
                  <span className="text-sm font-black text-white font-mono block">₹{customerTotalPaid.toFixed(2)}</span>
                  <span className="text-[7.5px] text-slate-500 block">Total debited</span>
                </div>

                {/* 2. Merchant Net */}
                <div className="bg-orange-950/30 p-3 rounded border border-orange-900/30 text-center space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-orange-400 block uppercase">Merchant Net</span>
                  <span className="text-sm font-black text-orange-300 font-mono block">₹{merchantNetVal.toFixed(2)}</span>
                  <span className="text-[7.5px] text-orange-500/80 block font-mono truncate">{activeMerchant?.vpa || 'merchant@okaxis'}</span>
                </div>

                {/* 3. Rider Split */}
                <div className="bg-emerald-950/30 p-3 rounded border border-emerald-900/30 text-center space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-emerald-400 block uppercase">EV Rider Fee</span>
                  <span className="text-sm font-black text-emerald-300 font-mono block">₹{deliveryVal.toFixed(2)}</span>
                  <span className="text-[7.5px] text-emerald-500/80 block font-mono truncate">{activeRider?.vpa || 'rider@okhdfc'}</span>
                </div>

                {/* 4. Swadeshi Affiliate Creator Split */}
                <div className={`p-3 rounded text-center space-y-0.5 ${
                  selectedInfluencerId 
                    ? 'bg-indigo-950/30 border border-indigo-900/30' 
                    : 'bg-slate-900 opacity-40 border border-slate-800'
                }`}>
                  <span className="text-[8px] font-mono font-bold text-indigo-400 block uppercase">Creator Share</span>
                  <span className="text-sm font-black text-indigo-300 font-mono block">₹{influencerVal.toFixed(2)}</span>
                  <span className="text-[7.5px] text-indigo-500/80 block font-mono truncate">{activeInfluencer?.vpa || 'No referrer VPA'}</span>
                </div>

                {/* 5. Capped DPI Platform */}
                <div className="bg-purple-950/30 p-3 rounded border border-purple-900/30 text-center space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[8px] font-mono font-bold text-purple-400 block uppercase">DPI Platform Fee</span>
                  <span className="text-sm font-black text-purple-300 font-mono block">₹{platformFeeVal.toFixed(2)}</span>
                  <span className="text-[7.5px] text-purple-400/80 block font-mono">Capped {customPlatformPercent}%</span>
                </div>

              </div>

              {/* Extra tax reserve */}
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-sm flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Statutory GST Treasury reserve ({customTaxPercent}%) settled automatically:</span>
                </span>
                <strong className="font-mono text-blue-400 text-xs">₹{govtTaxVal.toFixed(2)}</strong>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN (Lg: col-span-5) - INTERACTIVE UPI PHONE SIMULATOR & LEDGERS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* UPI 2.0 Live Payment Screen */}
            <div className="bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden text-center relative font-sans aspect-[9/16] max-w-sm mx-auto flex flex-col justify-between">
              
              {/* Phone Status bar */}
              <div className="bg-slate-900 px-4 py-1.5 flex justify-between items-center text-[9px] font-mono text-slate-500 border-b border-slate-800/60 shrink-0">
                <span>NPCI UPI 2.0 Terminal</span>
                <span>LTE 5G</span>
                <span>12:00</span>
              </div>

              {/* Dynamic Content Switching based on step */}
              <div className="p-5 flex-1 flex flex-col justify-between text-white">
                
                {/* SETUP STEP: Ask user to click 'Initiate Split payout' */}
                {upiStep === 'SETUP' && (
                  <div className="space-y-6 my-auto animate-in fade-in duration-200">
                    <div className="w-14 h-14 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                      <QrCode className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">PAYEE SPECIFICATION</span>
                      <h4 className="text-md font-bold text-slate-100">UPI Multi-Beneficiary Checkout</h4>
                      <p className="text-[10.5px] text-slate-400 leading-normal max-w-xs mx-auto">
                        This sandbox mimics the physical UPI intent. The single payment of <strong>₹{customerTotalPaid.toFixed(2)}</strong> is cleared and split instantly across the merchant, delivery partner, and platform.
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg text-left text-[10px] text-slate-400 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <strong className="text-white">₹{customerTotalPaid.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-800/60 pt-1 mt-1">
                        <span>Merchant Net:</span>
                        <span className="text-orange-400 font-semibold">₹{merchantNetVal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rider Credit:</span>
                        <span className="text-emerald-400 font-semibold">₹{deliveryVal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUpiStep('PIN_PAD')}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-emerald-950" />
                      Simulate UPI Checkout
                    </button>
                  </div>
                )}

                {/* PIN PAD STEP: Custom Simulated pincode keypad */}
                {upiStep === 'PIN_PAD' && (
                  <div className="space-y-4 flex flex-col justify-between h-full animate-in fade-in duration-200">
                    <div className="space-y-1 text-center pt-2">
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block">NPCI SECURE PIN CHALLENGE</span>
                      <h4 className="text-xs font-bold text-slate-300">Enter secure UPI PIN for digital settlement</h4>
                      <p className="text-[10px] text-slate-400">Total Settlement Value: <strong>₹{customerTotalPaid.toFixed(2)}</strong></p>
                    </div>

                    {/* Masked pin display */}
                    <div className="flex justify-center gap-3 py-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <div 
                          key={index}
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            index < upiPin.length 
                              ? 'bg-white border-white scale-110' 
                              : 'bg-transparent border-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {pinError && <p className="text-[9.5px] text-rose-500 font-bold font-mono">{pinError}</p>}
                    <p className="text-[8.5px] text-indigo-400 font-mono">Demo mode bypass: any 4-6 digit sequence works! (e.g. 1122)</p>

                    {/* Numeric Keypad layout */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pb-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'DELETE'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className={`py-2 text-xs font-bold font-mono rounded-lg transition-colors ${
                            key === 'CLEAR' || key === 'DELETE'
                              ? 'bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-400 uppercase tracking-tight'
                              : 'bg-slate-900 hover:bg-slate-850 text-white'
                          } cursor-pointer`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setUpiStep('SETUP')}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStartClearing}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-md"
                      >
                        Authorize & Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* CLEARING LOGS STEP */}
                {upiStep === 'CLEARING_LOGS' && (
                  <div className="space-y-4 my-auto animate-in fade-in duration-200 text-left">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>NPCI SPLIT PAY CONCURRENCY</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg h-56 overflow-y-auto space-y-1 font-mono text-[9px] scrollbar-none leading-relaxed">
                      {clearingLogs.map((log, i) => (
                        <div 
                          key={i} 
                          className={
                            log.startsWith('[SUCCESS]') 
                              ? 'text-emerald-400 font-extrabold' 
                              : log.startsWith('[NPCI-DPI-ROUTE]') 
                              ? 'text-indigo-400' 
                              : 'text-slate-400'
                          }
                        >
                          {log}
                        </div>
                      ))}
                    </div>

                    <div className="py-2 text-center text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">
                      Invoking interbank payment split...
                    </div>
                  </div>
                )}

                {/* RECEIPT / SUCCESS STEP */}
                {upiStep === 'RECEIPT' && (
                  <div className="space-y-5 my-auto animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-slate-500 block">SOCIALLY AUDITABLE TRANSACTION</span>
                      <h4 className="text-sm font-black text-slate-200">₹{customerTotalPaid.toFixed(2)} Split-Pay Cleared</h4>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter truncate">{simulatedTxnId}</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg text-left text-[10px] font-mono space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase block tracking-wider pb-1">Atomic Dispersals Cleared:</span>
                      
                      <div className="flex justify-between text-slate-300">
                        <span>Merchant Net:</span>
                        <strong className="text-orange-400">₹{merchantNetVal.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Rider EV Payout:</span>
                        <strong className="text-emerald-400">₹{deliveryVal.toFixed(2)}</strong>
                      </div>
                      {selectedInfluencerId && (
                        <div className="flex justify-between text-slate-300">
                          <span>Creator Comm:</span>
                          <strong className="text-indigo-400">₹{influencerVal.toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300">
                        <span>DPI Platform Fee:</span>
                        <strong className="text-purple-400">₹{platformFeeVal.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300 border-t border-slate-800/60 pt-1 mt-1">
                        <span>Govt GST Tax:</span>
                        <strong className="text-blue-400">₹{govtTaxVal.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(settledTxns[0], null, 2))}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        Copy JSON
                      </button>
                      <button
                        type="button"
                        onClick={resetSimulator}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-md cursor-pointer"
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Phone home indicator */}
              <div className="bg-slate-900 py-2.5 flex justify-center items-center shrink-0">
                <div className="w-24 h-1 bg-slate-800 rounded-full"></div>
              </div>

            </div>

          </div>

        </div>

        {/* Live Ledger / Audit History section at footer of modal */}
        <div className="bg-white border-t border-slate-200 p-5 md:p-6 shrink-0 space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-slate-800" />
              <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">
                III. Sandbox Clearing Ledger Registry ({settledTxns.length} transactions)
              </h3>
            </div>
            
            {settledTxns.length > 0 && (
              <button
                onClick={() => setSettledTxns([])}
                className="text-[9px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear History
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {settledTxns.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                No transactions cleared in this session. Run a simulated pincode check to populates settlement logs!
              </div>
            ) : (
              <table className="w-full text-left text-[10.5px] border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Transaction Reference</th>
                    <th className="py-2 px-3">Originated Order</th>
                    <th className="py-2 px-3">Total Amount</th>
                    <th className="py-2 px-3">Merchant Net</th>
                    <th className="py-2 px-3">EV Rider Net</th>
                    <th className="py-2 px-3">DPI & Tax Split</th>
                    <th className="py-2 px-3 text-right">Time Settle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {settledTxns.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-900 text-xs block">{txn.id}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">
                        {txn.orderId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">₹{txn.total.toFixed(2)}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-orange-600 block">₹{txn.merchantAmt.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-400 block tracking-tight">{txn.merchantVpa}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-emerald-600 block">₹{txn.riderAmt.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-400 block tracking-tight">{txn.riderVpa}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-purple-600 font-semibold block">DPI: ₹{txn.platformAmt.toFixed(2)}</span>
                        <span className="text-blue-600 block">GST: ₹{txn.taxAmt.toFixed(2)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-sans text-[10px]">
                        {txn.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
