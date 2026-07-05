import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { Product } from '../types';
import { Search, ShoppingBag, MapPin, QrCode, ClipboardCheck, ArrowRight, ShieldCheck, Percent, Globe, Building2, Info } from 'lucide-react';

export const ConsumerDashboard: React.FC = () => {
  const { products, orders, users, config, language, placeOrder, login, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingProductDetails, setViewingProductDetails] = useState<Product | null>(null);
  const [drilledOrderId, setDrilledOrderId] = useState<string | null>(null);
  
  // Checkout details
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');
  const [checkoutIsInterState, setCheckoutIsInterState] = useState<boolean>(false);

  // UPI checkout simulation states
  const [showQrModal, setShowQrModal] = useState(false);
  const [upiStep, setUpiStep] = useState<'QR' | 'PIN' | 'CLEARING'>('QR');
  const [upiPin, setUpiPin] = useState('');
  const [clearingLogs, setClearingLogs] = useState<string[]>([]);
  const [clearingProgress, setClearingProgress] = useState(0);
  const [pinError, setPinError] = useState('');

  // Filter products
  const categories = ['All', 'Staples & Millets', 'Wood-Pressed Oils', 'Traditional Spices', 'Handloom Textiles'];
  
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Fetch only registered active influencers
  const influencers = users.filter((u) => u.role === 'INFLUENCER');

  // Customer specific orders
  const citizenOrders = orders.filter((o) => o.customerId === users.find(u => u.email === localStorage.getItem('bc_session') ? JSON.parse(localStorage.getItem('bc_session')!).email : 'lokesh.naidu@gmail.com')?.id || 'customer-1');

  const handleOpenCheckout = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDeliveryAddress('');
    setNotes('');
    setPaymentMode('PREPAID');
    setSelectedInfluencerId('');
    setUpiStep('QR');
    setUpiPin('');
    setPinError('');
    setClearingProgress(0);
    setClearingLogs([]);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!deliveryAddress.trim()) {
      addNotification('Delivery address is mandatory to route EV dispatch.');
      return;
    }

    if (paymentMode === 'PREPAID') {
      setUpiStep('QR');
      setUpiPin('');
      setPinError('');
      setClearingProgress(0);
      setClearingLogs([]);
      setShowQrModal(true);
    } else {
      executeOrderPlacement();
    }
  };

  const executeOrderPlacement = () => {
    if (!selectedProduct) return;
    placeOrder(
      selectedProduct.id,
      quantity,
      deliveryAddress,
      paymentMode,
      selectedInfluencerId || undefined,
      notes
    );
    setSelectedProduct(null);
    setShowQrModal(false);
  };

  const handleVerifyPinAndClear = () => {
    if (upiPin.length < 4) {
      setPinError('UPI PIN must be 4 to 6 digits.');
      return;
    }
    setPinError('');
    setUpiStep('CLEARING');
    setClearingProgress(10);
    
    const logs = [
      `[NPCI-BP] Resolving beneficiary VPA: ${selectedProduct?.merchantName.toLowerCase().replace(/\s+/g, '')}@okaxis`,
      `[NPCI-BP] Authenticating Data Principal credentials...`,
      `[NPCI-BP] OTP Handshake complete. PIN token validated successfully.`,
      `[NPCI-BP] Querying direct-clearing DPI routing rules...`,
    ];
    setClearingLogs(logs);

    let progress = 10;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setClearingProgress(100);
        
        // Final calculations
        const total = (selectedProduct?.price || 0) * quantity;
        const platFee = parseFloat((total * (config.platformFeePercent / 100)).toFixed(2));
        const taxSplit = parseFloat((total * (config.defaultTaxPercent / 100)).toFixed(2));
        const infSplit = selectedInfluencerId ? parseFloat((total * (config.defaultInfluencerPercent / 100)).toFixed(2)) : 0;
        const merchantNet = parseFloat((total - (platFee + taxSplit + infSplit)).toFixed(2));

        const cgst = parseFloat((taxSplit / 2).toFixed(2));
        const sgst = parseFloat((taxSplit / 2).toFixed(2));
        const igst = taxSplit;

        const tds194O = parseFloat((total * 0.01).toFixed(2));
        const tcs52 = parseFloat((total * 0.01).toFixed(2));

        setClearingLogs(prev => [
          ...prev,
          `[NPCI-BP] Financial split ratios compiled:`,
          `  ├─ Merchant Net Direct: ₹${merchantNet}`,
          `  ├─ Platform DPI (capped): ₹${platFee}`,
          checkoutIsInterState 
            ? `  ├─ Integrated GST (IGST @ ${config.defaultTaxPercent}%): ₹${igst}`
            : `  ├─ Central GST (CGST): ₹${cgst} + State GST (SGST): ₹${sgst}`,
          `  ├─ GST TCS (Section 52 withheld @ 1%): ₹${tcs52}`,
          `  ├─ GST TDS (Section 194-O withheld @ 1%): ₹${tds194O}`,
          selectedInfluencerId ? `  └─ Promoter Split: ₹${infSplit}` : `  └─ Promoter Split: ₹0.00 (No referral)`,
          `[NPCI-BP] Escrow routing locked in BHARAT-FAC-04-HYD node.`,
          `[NPCI-BP] Transaction cleared. Code: TXN-${Math.floor(100000 + Math.random() * 900000)}.`
        ]);
      } else {
        setClearingProgress(progress);
        if (progress === 35) {
          setClearingLogs(prev => [...prev, `[NPCI-BP] Splitting funds based on Swadeshi Public Service Mandate...`]);
        }
        if (progress === 60) {
          setClearingLogs(prev => [...prev, `[NPCI-BP] Direct clearing routes verified for commercial banks.`]);
        }
        if (progress === 85) {
          setClearingLogs(prev => [...prev, `[NPCI-BP] Signing digital handshake compliance token...`]);
        }
      }
    }, 600);
  };

  // 5-Step Order Status Pipeline helper
  const renderStatusTracker = (status: string) => {
    const steps = ['BOOKED', 'ACCEPTED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];
    const stepLabels = [t.trackerBooked, t.trackerAccepted, t.trackerPacked, t.trackerInTransit, t.trackerDelivered];
    const currentIndex = steps.indexOf(status);

    return (
      <div className="w-full py-4 px-2">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line background */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-250 z-0"></div>
          {/* Active Line background */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-900 transition-all duration-500 z-0"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            let bubbleStyle = 'bg-white border-slate-200 text-slate-400';
            if (isActive) bubbleStyle = 'bg-slate-900 border-slate-900 text-white';
            if (isCurrent) bubbleStyle = 'bg-white border-slate-950 text-slate-950 ring-2 ring-slate-950 ring-offset-2';

            return (
              <div key={step} className="flex flex-col items-center relative z-10 flex-1">
                <div className={`w-7 h-7 rounded-sm border flex items-center justify-center font-mono font-bold text-xs transition-all ${bubbleStyle}`}>
                  {idx + 1}
                </div>
                <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider text-center ${isCurrent ? 'text-slate-950 font-black' : isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {stepLabels[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="consumer-hub" className="space-y-8 font-sans">
      
      {/* Category filters and search */}
      <div className="bg-white rounded-sm p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 text-xs focus:ring-1 focus:ring-slate-950 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'All' ? t.categoryAll : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          // Calculate billing preview caps
          const defaultPlatformSplit = parseFloat((p.price * (config.platformFeePercent / 100)).toFixed(2));
          const defaultTaxSplit = parseFloat((p.price * (config.defaultTaxPercent / 100)).toFixed(2));

          return (
            <div 
              key={p.id} 
              id={`prod-${p.id}`}
              className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs flex flex-col hover:border-slate-400 hover:shadow-sm transition-all group cursor-pointer"
            >
              {/* Image Container - Click to view details */}
              <div 
                className="relative h-48 overflow-hidden bg-slate-50"
                onClick={() => setViewingProductDetails(p)}
              >
                <img
                  src={p.image}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider">
                  {p.category}
                </span>
                {p.bisCertified && (
                  <span className="absolute top-3 right-3 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-xs uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    {t.bisCertifiedLabel}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2" onClick={() => setViewingProductDetails(p)}>
                  <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block">
                    🏪 {p.merchantName}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 leading-snug tracking-tight font-display hover:text-blue-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>

                  {/* Highlighted specifications and traditional uses */}
                  <div className="bg-slate-50 rounded-sm p-3 border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">Specifications & Traditional Uses:</span>
                    <p className="text-[10.5px] text-slate-500 leading-normal italic">
                      {p.specifications}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>{t.hsnCodeLabel}: <span className="font-mono text-slate-600">{p.hsnCode}</span></span>
                    <span className="text-slate-500 font-mono">Platform: {config.platformFeePercent}%</span>
                  </div>

                  <div className="flex justify-between items-end gap-2">
                    <div className="shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">DPI Price</span>
                      <span className="text-xl font-black text-slate-950 font-mono">₹{p.price.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setViewingProductDetails(p)}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all"
                      >
                        <Search className="w-3 h-3" />
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenCheckout(p)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {t.buyNow}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            {t.noProducts}
          </div>
        )}
      </div>

      {/* Orders history with vertical step pipeline trackers */}
      {citizenOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase border-l-2 border-slate-900 pl-3">
            {t.ordersHistory}
          </h3>
          
          <div className="space-y-4">
            {citizenOrders.map((order) => {
              const totalPrice = order.product.price * order.quantity;

              return (
                <div key={order.id} className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-800 uppercase bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm font-mono">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {order.product.title} <span className="text-slate-400 font-mono">x {order.quantity}</span>
                      </p>
                      {order.dispatchDetails && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-150 p-2.5 rounded-sm">
                          <span className="font-extrabold text-slate-500 uppercase text-[9px] block">Verified Dispatch Instructions:</span>
                          <p className="font-semibold text-slate-800 mt-0.5">"{order.dispatchDetails}"</p>
                        </div>
                      )}
                      {order.customerOtp && (order.status !== 'DELIVERED') && (
                        <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-150 p-2.5 rounded-sm inline-block">
                          <span className="font-extrabold text-emerald-600 uppercase text-[9px] block">Secure Delivery Verification OTP (Share with Delivery Partner):</span>
                          <span className="font-black text-slate-900 font-mono text-sm tracking-widest">{order.customerOtp}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">NPCI UPI Transaction Amount</span>
                      <span className="text-sm font-black text-slate-950 font-mono">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Glow Pipeline Status Tracker */}
                  {renderStatusTracker(order.status)}

                  {/* Transparent Billing Split Details */}
                  <div className="bg-slate-50 rounded-sm p-4 border border-slate-200 text-xs space-y-3.5">
                    <span className="font-bold text-slate-900 uppercase tracking-widest text-[9px] block">
                      NPCI-Compliant Direct Split Ledger
                    </span>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Merchant Net</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          ₹{order.finalSplits ? order.finalSplits.merchant : (totalPrice - (totalPrice * (order.platformFeePercent + order.commissionPercent + order.taxPercent)/100)).toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">UPI: {order.product.merchantName.slice(0, 8)}@ybl</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Creator Promote</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          ₹{order.finalSplits ? order.finalSplits.influencer : (totalPrice * (order.commissionPercent/100)).toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">VPA: {order.influencerVpa || 'None'}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">DPI Fee</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          ₹{order.finalSplits ? order.finalSplits.platform : (totalPrice * (order.platformFeePercent/100)).toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">Capped {order.platformFeePercent}%</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">GST Tax</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          ₹{order.finalSplits ? order.finalSplits.tax : (totalPrice * (order.taxPercent/100)).toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">Tax {order.taxPercent}%</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Delivery Split</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          ₹{order.deliveryFeeAmount.toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">Direct Payout</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDrilledOrderId(drilledOrderId === order.id ? null : order.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all"
                      >
                        {drilledOrderId === order.id ? 'Hide Audit Telemetry ▲' : '🔍 Drill Down: BharatConnect DPI Audit & Telemetry Tracker ▼'}
                      </button>
                    </div>

                    {/* Drill Down Interactive Panel */}
                    {drilledOrderId === order.id && (
                      <div className="p-5 bg-slate-950 text-white rounded-sm border border-slate-800 space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-100">BharatConnect DPI Sourcing & Telemetry Drill-Down</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Node ID: {order.id}-HYD-QC</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Column 1: Courier EV Telemetry */}
                          <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block border-b border-slate-800 pb-1.5">⚡ EV Delivery Logistics Telemetry</span>
                            <div className="space-y-1.5 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Rider Status:</span>
                                <span className="font-bold text-emerald-400">{order.status === 'DELIVERED' ? 'Arrived / Handshake Complete' : 'In Transit'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Vehicle Unit:</span>
                                <span className="font-mono">{order.vehicleType || 'BharatConnect EV Express'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Battery Level:</span>
                                <span className="font-mono text-blue-400">{order.status === 'DELIVERED' ? '91%' : '74% (SOC C-Rate)'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Temp / Safety:</span>
                                <span className="font-mono">24.2°C (Optimal)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Estimated ETA:</span>
                                <span className="font-bold text-slate-100">{order.status === 'DELIVERED' ? 'Delivered' : '14 minutes'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Financial Escrow Clearing Splits */}
                          <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block border-b border-slate-800 pb-1.5">🛡️ BharatConnect Escrow Clearing Splitting</span>
                            <div className="space-y-1.5 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Split Protocol:</span>
                                <span className="font-mono text-amber-300">BHARAT-SPLIT-v1.0</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Clearing Status:</span>
                                <span className={`font-bold ${order.status === 'DELIVERED' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                  {order.status === 'DELIVERED' ? 'Fully Disbursed' : 'Pre-authorized'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Secured Hold:</span>
                                <span className="font-mono text-slate-100">₹{totalPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Gateway Route:</span>
                                <span className="font-mono text-[9px]">UPI-IMPS-DIRECT-SETTLE</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Handshake Key:</span>
                                <span className="font-mono text-[9.5px] text-blue-300">SECURE_HS_{order.id.slice(-6)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Quality Control & ISO Certs */}
                          <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block border-b border-slate-800 pb-1.5">🌾 QC Traceability & ISO Directory</span>
                            <div className="space-y-1.5 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Facility Code:</span>
                                <span className="font-mono">BHARAT-FAC-04-HYD</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">ISO Standard:</span>
                                <span className="text-purple-300 font-bold">DIN ISO-9001:2026</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Metal Elements:</span>
                                <span className="font-bold text-emerald-400">0.00% (SGS Lab Pass)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Organic Index:</span>
                                <span className="font-mono text-emerald-400">100% Certified</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Packaging Seal:</span>
                                <span className="font-mono text-[9px] text-slate-400">HERMETIC_SEAL_PASS</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkout Modal Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NPCI Security Platform</span>
                <h3 className="text-base font-bold uppercase tracking-wider">{t.buyNow}</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-6 h-6 rounded-sm bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-4 p-3 bg-slate-50 rounded-sm border border-slate-200">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.title} 
                  className="w-14 h-14 object-cover rounded-sm"
                />
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-mono block leading-none">{selectedProduct.merchantName}</span>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{selectedProduct.title}</h4>
                  <p className="text-xs font-bold text-slate-800 font-mono">₹{selectedProduct.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">NPCI Split Promoter</label>
                  <select
                    value={selectedInfluencerId}
                    onChange={(e) => setSelectedInfluencerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-800"
                  >
                    <option value="">Direct (No referral)</option>
                    {influencers.map((inf) => (
                      <option key={inf.id} value={inf.id}>
                        {inf.name} ({inf.niche})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Location input - MANDATORY */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-900" />
                  {t.deliveryAddress} *
                </label>
                <textarea
                  required
                  placeholder={t.deliveryAddressPlaceholder}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:ring-1 focus:ring-slate-950 min-h-[60px]"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.specialInstructions}</label>
                <input
                  type="text"
                  placeholder="e.g., Leave with gate keeper or call upon arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.paymentMode}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('PREPAID')}
                    className={`py-2.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      paymentMode === 'PREPAID'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t.prepaidUpi}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('COD')}
                    className={`py-2.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      paymentMode === 'COD'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t.codOption}
                  </button>
                </div>
              </div>

              {/* Split Estimation breakdown preview with GST component detail */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-[11px] text-slate-600 space-y-3 shadow-3xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider">NPCI Direct Clearing Split Summary</span>
                  
                  {/* Dynamic State Route Selector */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-250">
                    <button
                      type="button"
                      onClick={() => setCheckoutIsInterState(false)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight transition-all uppercase ${
                        !checkoutIsInterState 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Intra-State: CGST + SGST applied"
                    >
                      Intra
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutIsInterState(true)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight transition-all uppercase ${
                        checkoutIsInterState 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Inter-State: IGST applied"
                    >
                      Inter
                    </button>
                  </div>
                </div>

                {/* Ledger splits */}
                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Value (Excl. Tax & Splits):</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      ₹{(selectedProduct.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Dynamic GST breakdown */}
                  <div className="bg-white p-2 border border-slate-200/80 rounded space-y-1 text-[10px]">
                    <span className="text-[8.5px] font-mono font-bold text-indigo-950 uppercase tracking-wider block">Statutory GST Breakdowns ({config.defaultTaxPercent}%)</span>
                    {!checkoutIsInterState ? (
                      <>
                        <div className="flex justify-between text-slate-500">
                          <span>Central GST (CGST @ {(config.defaultTaxPercent / 2).toFixed(1)}%):</span>
                          <span className="font-mono text-slate-800">₹{(selectedProduct.price * quantity * (config.defaultTaxPercent / 200)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>State GST (SGST @ {(config.defaultTaxPercent / 2).toFixed(1)}%):</span>
                          <span className="font-mono text-slate-800">₹{(selectedProduct.price * quantity * (config.defaultTaxPercent / 200)).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-500">
                        <span>Integrated GST (IGST @ {config.defaultTaxPercent}%):</span>
                        <span className="font-mono text-slate-800">₹{(selectedProduct.price * quantity * (config.defaultTaxPercent / 100)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 pt-1 mt-1 font-bold text-slate-700">
                      <span>Total Government GST:</span>
                      <span className="font-mono">₹{(selectedProduct.price * quantity * (config.defaultTaxPercent / 100)).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* statutory deductions for ecom */}
                  <div className="bg-slate-100/60 p-2 border border-slate-200/50 rounded space-y-1 text-[9.5px]">
                    <div className="flex justify-between text-slate-500">
                      <span>E-com TCS (GST Sec 52 @ 1%):</span>
                      <span className="font-mono text-slate-700">₹{(selectedProduct.price * quantity * 0.01).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>E-com TDS (IT Sec 194-O @ 1%):</span>
                      <span className="font-mono text-slate-700">₹{(selectedProduct.price * quantity * 0.01).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Rest of traditional splits */}
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span>Merchant Direct Net Payout:</span>
                    <span className="font-bold text-orange-600 font-mono">
                      ₹{(selectedProduct.price * quantity * (1 - (config.platformFeePercent + (selectedInfluencerId ? config.defaultInfluencerPercent : 0) + config.defaultTaxPercent) / 100)).toFixed(2)}
                    </span>
                  </div>

                  {selectedInfluencerId && (
                    <div className="flex justify-between">
                      <span>Promoter Commission ({config.defaultInfluencerPercent}%):</span>
                      <span className="font-bold text-indigo-600 font-mono">
                        ₹{(selectedProduct.price * quantity * (config.defaultInfluencerPercent / 100)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>DPI Platform Comm ({config.platformFeePercent}%):</span>
                    <span className="font-bold text-purple-600 font-mono">
                      ₹{(selectedProduct.price * quantity * (config.platformFeePercent / 100)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>EV Logistics Base Transit:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      ₹{config.deliveryFeeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-200 text-[11px] font-black text-slate-900 uppercase">
                  <span>Gross Total (incl. of GST):</span>
                  <span className="font-mono text-xs">
                    ₹{(selectedProduct.price * quantity + config.deliveryFeeAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-sm transition-all uppercase tracking-widest"
              >
                {t.confirmBooking}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPI QR Simulation Modal */}
      {showQrModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-slate-950 text-white rounded-xl max-w-sm w-full p-6 text-center border border-slate-800 space-y-5 shadow-2xl relative">
            
            {/* Header section based on step */}
            <div className="space-y-1">
              <span className="text-[8.5px] font-mono text-indigo-400 tracking-widest uppercase block">
                {upiStep === 'QR' && 'NPCI BHARAT BILLPAY DEEP-LINK'}
                {upiStep === 'PIN' && 'NPCI SECURED GATEWAY PROTOCOL'}
                {upiStep === 'CLEARING' && 'UPI DIRECT SPLIT SETTLEMENT CONSOLE'}
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                {upiStep === 'QR' && 'Scan to Authorize Pre-Auth Escrow'}
                {upiStep === 'PIN' && 'Enter UPI Security PIN'}
                {upiStep === 'CLEARING' && 'Ledger Clearance Logs'}
              </h3>
            </div>

            {/* Step 1: QR Code Scanner Screen */}
            {upiStep === 'QR' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Glowing Simulated QR Code */}
                <div className="mx-auto w-36 h-36 bg-white p-3 rounded-lg border border-slate-800 flex items-center justify-center relative shadow-md">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>

                <div className="space-y-2.5 bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Beneficiary:</span>
                    <span className="font-extrabold text-slate-200 uppercase tracking-wide">{selectedProduct.merchantName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VPA Target:</span>
                    <span className="font-mono text-indigo-300">{selectedProduct.merchantName.toLowerCase().replace(/\s+/g, '')}@okaxis</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Due:</span>
                    <span className="font-bold text-white font-mono">₹{(selectedProduct.price * quantity).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal text-left pt-1.5 border-t border-slate-800">
                    Funds will be pre-authorized under UPI Section 13-A and split automatically on the DPI grid upon physical delivery.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiStep('PIN')}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Scan QR / Pay
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Secured PIN Input Screen */}
            {upiStep === 'PIN' && (
              <div className="space-y-5 animate-in slide-in-from-bottom duration-300">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-850 space-y-1 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Payable Amount</span>
                  <span className="text-xl font-black text-white font-mono">₹{(selectedProduct.price * quantity).toFixed(2)}</span>
                </div>

                {/* PIN Input field */}
                <div className="space-y-2">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div 
                        key={index}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          upiPin.length > index 
                            ? 'bg-orange-500 border-orange-500 shadow-[0_0_8px_#f97316]' 
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter 4-6 digit PIN"
                    value={upiPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setUpiPin(val);
                    }}
                    className="w-full max-w-[140px] mx-auto text-center py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white font-bold font-mono tracking-widest focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />

                  {pinError && (
                    <p className="text-[10px] text-rose-400 font-bold">{pinError}</p>
                  )}
                </div>

                {/* Standard virtual keypad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (upiPin.length < 6) setUpiPin(prev => prev + num);
                      }}
                      className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded text-xs font-bold font-mono text-slate-200 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUpiPin('')}
                    className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded text-[9px] font-bold uppercase text-slate-400 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (upiPin.length < 6) setUpiPin(prev => prev + '0');
                    }}
                    className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded text-xs font-bold font-mono text-slate-200 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiPin(prev => prev.slice(0, -1));
                    }}
                    className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded text-[9px] font-bold uppercase text-slate-400 cursor-pointer"
                  >
                    Del
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUpiStep('QR')}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPinAndClear}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Verify PIN & Pay
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Clearing and Instant Split Settlement Logs */}
            {upiStep === 'CLEARING' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Simulated clearing meter bar */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>NPCI INTERBANK ESCROW RESOLUTION</span>
                    <span>{clearingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 transition-all duration-300"
                      style={{ width: `${clearingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Clearing log print pipeline container */}
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left h-36 overflow-y-auto space-y-1 scrollbar-thin">
                  {clearingLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`font-mono text-[9.5px] leading-relaxed whitespace-pre-wrap ${
                        log.startsWith('  ├─') || log.startsWith('  └─')
                          ? 'text-indigo-400'
                          : log.includes('TXN')
                          ? 'text-amber-400 font-bold'
                          : 'text-emerald-500'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>

                {/* Success confirm trigger button */}
                <div className="pt-2">
                  {clearingProgress === 100 ? (
                    <button
                      type="button"
                      onClick={executeOrderPlacement}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center justify-center gap-1.5 animate-bounce cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Dispatch Order
                    </button>
                  ) : (
                    <div className="py-2 text-[10px] text-indigo-400 font-bold uppercase tracking-wider animate-pulse">
                      Processing Ledger Clearing splits...
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Product Details & Merchant Portal Audit Modal */}
      {viewingProductDetails && (() => {
        const merchantUser = users.find(u => u.id === viewingProductDetails.merchantId);
        // Calculate splits
        const price = viewingProductDetails.price;
        const merchantSplit = parseFloat((price * (1 - (config.platformFeePercent + config.defaultTaxPercent) / 100)).toFixed(2));
        const taxSplit = parseFloat((price * (config.defaultTaxPercent / 100)).toFixed(2));
        const feeSplit = parseFloat((price * (config.platformFeePercent / 100)).toFixed(2));

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-sm max-w-2xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative space-y-6">
              <button 
                onClick={() => setViewingProductDetails(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-lg font-bold font-mono"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Product Image Panel */}
                <div className="md:col-span-5 space-y-3">
                  <div className="relative h-56 rounded-sm overflow-hidden bg-slate-50 border border-slate-200">
                    <img 
                      src={viewingProductDetails.image} 
                      alt={viewingProductDetails.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900 text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {viewingProductDetails.category}
                    </span>
                  </div>
                  
                  {viewingProductDetails.bisCertified && (
                    <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider block">BIS Quality Assured</span>
                        <span className="text-[10px] text-slate-500 block leading-tight">Meets Indian standard specifications & curcumin/oil parameters.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Meta & Details */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-widest">HSN CODE: {viewingProductDetails.hsnCode}</span>
                    <h2 className="text-xl font-bold text-slate-950 font-display tracking-tight leading-snug">{viewingProductDetails.title}</h2>
                    <span className="text-xl font-black text-slate-950 font-mono block">₹{viewingProductDetails.price.toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{viewingProductDetails.description}</p>

                  <div className="bg-slate-50 rounded-sm p-3 border border-slate-250 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block">Material Specifications & Traditional Uses:</span>
                    <p className="text-[11px] text-slate-600 leading-normal italic">{viewingProductDetails.specifications}</p>
                  </div>
                </div>
              </div>

              {/* Verified Merchant Banner & Audit Tool */}
              {merchantUser && (
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">DPI Registered Merchant Partner</span>
                      <span className="text-sm font-bold text-slate-900 font-display">🏪 {merchantUser.storeName || merchantUser.name}</span>
                      <span className="text-[10px] text-slate-500 block">Location: {merchantUser.location}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-bold uppercase tracking-wider rounded-sm font-mono">
                        Trust Score: {merchantUser.trustScore}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10.5px] text-slate-500">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[8px]">UPI VPA ID</span>
                      <span className="font-mono text-slate-700 font-bold">{merchantUser.vpa}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[8px]">Merchant GSTIN</span>
                      <span className="font-mono text-slate-700 font-bold">{merchantUser.gstin || '36AAAAA1111A1Z1'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block text-[8px]">e-KYC (DPDP Secured)</span>
                      <span className="font-mono text-slate-700 font-bold">{merchantUser.aadhaarMasked}</span>
                    </div>
                  </div>

                  {/* Merchant Audit Action */}
                  <div className="pt-2 flex justify-between items-center bg-slate-100/50 -mx-4 -mb-4 p-3 rounded-b-sm border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium">Reviewer Tool: Access this Merchant's console to view live orders.</span>
                    <button
                      onClick={() => {
                        login(merchantUser.email);
                        setViewingProductDetails(null);
                        addNotification(`Logged in to Merchant: "${merchantUser.name}" successfully!`);
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all shadow-xs"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Login to Merchant View
                    </button>
                  </div>
                </div>
              )}

              {/* Split Settlement Transparent Estimator */}
              <div className="bg-slate-950 text-white rounded-sm p-4 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Escrow split transaction flow ledger (Capped at 2-3% platform fee)</span>
                  <span className="text-[9px] font-bold uppercase text-blue-400 tracking-wider">NPCI UPI Compliant</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center">
                  <div className="bg-slate-900 p-2 rounded-sm border border-slate-800">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">Merchant payout</span>
                    <span className="text-xs font-black text-white font-mono">₹{merchantSplit.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-500 block font-mono">Direct VPA Transfer</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-sm border border-slate-800">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">GST Tax ({config.defaultTaxPercent}%)</span>
                    <span className="text-xs font-black text-white font-mono">₹{taxSplit.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-500 block font-mono">Integrated Treasury</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-sm border border-slate-800">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">DPI Platform Fee</span>
                    <span className="text-xs font-black text-white font-mono">₹{feeSplit.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-400 block font-bold font-mono text-emerald-400">Strictly Capped {config.platformFeePercent}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-sm border border-slate-800">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">EV Delivery Partner</span>
                    <span className="text-xs font-black text-white font-mono">₹{config.deliveryFeeAmount.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-500 block font-mono">Direct Split</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setViewingProductDetails(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest rounded-sm transition-all"
                >
                  Back to Hub Catalog
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenCheckout(viewingProductDetails);
                    setViewingProductDetails(null);
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Proceed to Secure Checkout
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
