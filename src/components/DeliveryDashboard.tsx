import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { Map, Navigation, CheckCircle2, IndianRupee, ShieldCheck, Play, Pause, ShieldAlert, Navigation2 } from 'lucide-react';

export const DeliveryDashboard: React.FC = () => {
  const { 
    loggedInUser, 
    orders, 
    assignRiderAndDispatch, 
    confirmHandshake, 
    language,
    riderAcceptOrder,
    riderEnterVendorCode,
    deliveryPersonArrive,
    riderCompleteDeliveryWithOtp
  } = useApp();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'LEDGER'>('MANIFEST');
  const [drilledOrderId, setDrilledOrderId] = useState<string | null>(null);

  // Verification input states
  const [inputCodeMap, setInputCodeMap] = useState<Record<string, string>>({});
  const [inputOtpMap, setInputOtpMap] = useState<Record<string, string>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  // Simulated GPS route progress states
  const [simProgress, setSimProgress] = useState(15);
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) return 0; // loop back
          return prev + 5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const getRiderPos = (progress: number) => {
    // road network points: origin (15, 80) -> corner1 (45, 80) -> corner2 (45, 30) -> drop (85, 30)
    if (progress < 33) {
      const t = progress / 33;
      return { x: 15 + t * (45 - 15), y: 80 };
    } else if (progress < 66) {
      const t = (progress - 33) / 33;
      return { x: 45, y: 80 - t * (80 - 30) };
    } else {
      const t = (progress - 66) / 34;
      return { x: 45 + t * (85 - 45), y: 30 };
    }
  };

  const riderPos = getRiderPos(simProgress);

  const riderId = loggedInUser?.id || 'rider-1';

  // Available packed packages to pickup (assigned to this rider, or packed legacy unassigned)
  const availablePickups = orders.filter((o) => 
    (o.driverId === riderId && o.status === 'RIDER_ASSIGNED') || 
    (!o.driverId && o.status === 'PACKED')
  );

  // Active deliveries assigned to this rider
  const activeDeliveries = orders.filter((o) => 
    o.driverId === riderId && 
    ['RIDER_ACCEPTED', 'ARRIVED_AT_VENDOR', 'IN_TRANSIT', 'DELIVERED_AWAITING_OTP'].includes(o.status)
  );

  // Completed delivery splits
  const completedDeliveries = orders.filter((o) => 
    (o.driverId === riderId || (!o.driverId && riderId === 'rider-1')) && o.status === 'DELIVERED'
  );

  // Calculate earnings split
  const totalRiderEarnings = completedDeliveries.reduce((sum, o) => sum + o.deliveryFeeAmount, 0);

  return (
    <div id="delivery-workspace" className="space-y-6">
      
      {/* Rider Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-indigo-950">{loggedInUser?.name || 'Alapati Harish'}</h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 px-2.5 py-0.5 rounded-full">
              EV Rider Zone: {loggedInUser?.location || 'Ghatkesar, Hyderabad'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase">
            Rider Node: <span className="font-mono text-slate-700">{loggedInUser?.vehicleType || 'Ola S1 Pro (TS-08-EV-1234)'}</span>
          </p>
        </div>

        {/* Inner Tabs */}
        <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('MANIFEST')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'MANIFEST' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.riderConsole}
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'LEDGER' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.ridePayoutsLedger}
          </button>
        </div>
      </div>

      {activeTab === 'MANIFEST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main manifest routes listing column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Active deliverables route maps */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Active Delivery Locks</h3>
              
              {activeDeliveries.map((order) => {
                const totalPrice = order.product.price * order.quantity;

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-indigo-200 shadow-xs p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-mono font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full">{order.id}</span>
                        <h4 className="text-sm font-extrabold text-indigo-950 mt-1.5">{order.product.title} &times; {order.quantity}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Cash to Collect (COD)</span>
                        <span className="text-base font-black text-indigo-950">{order.paymentMode === 'COD' ? `₹${totalPrice.toFixed(2)}` : 'Prepaid via UPI (₹0.00)'}</span>
                      </div>
                    </div>

                    {/* Pickup vs Dropoff custom addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-orange-600 font-extrabold uppercase tracking-wider block">Origin Store pickup</span>
                        <p className="font-extrabold text-indigo-950">{order.merchantName}</p>
                        <p className="text-slate-500 font-semibold">{order.merchantLocation}</p>
                      </div>

                      <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider block">Customer Destination</span>
                        <p className="font-extrabold text-indigo-950">{order.customerName}</p>
                        <p className="text-slate-500 font-semibold">{order.customerLocation}</p>
                        {order.notes && (
                          <p className="text-[10.5px] italic text-indigo-950 mt-1">Instructions: "{order.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      {/* Sandbox Hint */}
                      <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200 font-mono text-slate-500 flex justify-between">
                        <span>[SANDBOX TELEMETRY DATA]</span>
                        <span>Vendor Code: <strong className="text-indigo-600">{order.vendorCode || 'N/A'}</strong> | Cust OTP: <strong className="text-emerald-600">{order.customerOtp || 'N/A'}</strong></span>
                      </div>

                      {order.status === 'RIDER_ASSIGNED' && (
                        <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-indigo-700 font-bold uppercase block">Awaiting Acceptance</span>
                            <p className="text-xs text-slate-600">The Transport Department has assigned this ride to you.</p>
                          </div>
                          <button
                            onClick={() => riderAcceptOrder(order.id)}
                            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold uppercase rounded-lg shadow-xs"
                          >
                            Accept Ride Request
                          </button>
                        </div>
                      )}

                      {order.status === 'RIDER_ACCEPTED' && (
                        <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                          <span className="text-[10px] text-amber-700 font-bold uppercase block">Step 1: Vendor Sourcing Verification</span>
                          <p className="text-xs text-slate-600">Arrive at vendor store <strong>{order.merchantName}</strong>, collect the security verification code and enter below to release package:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. VND-1234"
                              value={inputCodeMap[order.id] || ''}
                              onChange={(e) => {
                                setInputCodeMap({ ...inputCodeMap, [order.id]: e.target.value });
                                setErrorMap({ ...errorMap, [order.id]: '' });
                              }}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase w-32"
                            />
                            <button
                              onClick={() => {
                                const correct = riderEnterVendorCode(order.id, inputCodeMap[order.id] || '');
                                if (!correct) {
                                  setErrorMap({ ...errorMap, [order.id]: 'Invalid vendor verification code.' });
                                }
                              }}
                              className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-lg shadow-xs"
                            >
                              Verify & Load Package
                            </button>
                          </div>
                          {errorMap[order.id] && (
                            <p className="text-rose-600 text-[11px] font-semibold">{errorMap[order.id]}</p>
                          )}
                        </div>
                      )}

                      {order.status === 'IN_TRANSIT' && (
                        <div className="p-3 bg-indigo-50/30 border border-indigo-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-indigo-700 font-bold uppercase block">Step 2: Transit Delivery</span>
                            <p className="text-xs text-slate-600">Package is loaded. Ride en route to customer destination.</p>
                          </div>
                          <button
                            onClick={() => deliveryPersonArrive(order.id)}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs"
                          >
                            Mark Arrived & Deliver
                          </button>
                        </div>
                      )}

                      {order.status === 'DELIVERED_AWAITING_OTP' && (
                        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Step 3: Customer Handshake Settlement</span>
                          <p className="text-xs text-slate-600">Deliver the item physically to <strong>{order.customerName}</strong>. Collect the checkout OTP from them to complete escrow release:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. OTP-1234"
                              value={inputOtpMap[order.id] || ''}
                              onChange={(e) => {
                                setInputOtpMap({ ...inputOtpMap, [order.id]: e.target.value });
                                setErrorMap({ ...errorMap, [order.id]: '' });
                              }}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase w-32"
                            />
                            <button
                              onClick={() => {
                                const correct = riderCompleteDeliveryWithOtp(order.id, inputOtpMap[order.id] || '');
                                if (!correct) {
                                  setErrorMap({ ...errorMap, [order.id]: 'Invalid customer OTP code.' });
                                }
                              }}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-lg shadow-xs"
                            >
                              Verify OTP & Settle Ride
                            </button>
                          </div>
                          {errorMap[order.id] && (
                            <p className="text-rose-600 text-[11px] font-semibold">{errorMap[order.id]}</p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setDrilledOrderId(drilledOrderId === order.id ? null : order.id)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          {drilledOrderId === order.id ? 'Hide Telemetry ▲' : '🔍 Drill Down: Sourcing & Route Audit ▼'}
                        </button>
                        {/* Legacy bypass button for robustness */}
                        {['PACKED', 'IN_TRANSIT'].includes(order.status) && (
                          <button
                            onClick={() => confirmHandshake(order.id)}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all"
                          >
                            Bypass Handshake (Admin Override)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delivery Partner Drill Down Interactive Panel */}
                    {drilledOrderId === order.id && (
                      <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 space-y-3.5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">⚡ BharatConnect DPI Logistics Telemetry Node</span>
                          <span className="text-[10px] font-mono text-slate-400">LID: {order.id}-RIDER-LOG</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                          {/* Col 1: EV Unit battery and thermal sensor */}
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-blue-400 block border-b border-slate-800 pb-1">Vehicle Status</span>
                            <div className="space-y-1 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">EV Model:</span>
                                <span>{loggedInUser?.vehicleType || 'Ola S1 Pro EV'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">SOC Charge:</span>
                                <span className="text-blue-400 font-bold font-mono">84% (High Efficiency)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Motor Temp:</span>
                                <span className="font-mono">31.6°C</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Escrow Split clearance confirmation */}
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-emerald-400 block border-b border-slate-800 pb-1">Earnings Clearance</span>
                            <div className="space-y-1 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Your Pay Split:</span>
                                <span className="text-emerald-400 font-bold font-mono">₹{order.deliveryFeeAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Escrow Lock:</span>
                                <span className="text-slate-400">PRE-AUTHORIZED</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Direct VPA:</span>
                                <span className="font-mono text-slate-400">{loggedInUser?.vpa || 'rider1@okpaytm'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Quality Compliance checklist */}
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-purple-400 block border-b border-slate-800 pb-1">Quality & Packaging</span>
                            <div className="space-y-1 text-[11px] text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Cold Chain:</span>
                                <span className="text-emerald-400">Optimal (Pass)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">ISO-9001 Seal:</span>
                                <span className="text-purple-300 font-bold font-mono">SECURE_SEAL</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">FSSAI Pack Code:</span>
                                <span className="font-mono text-slate-400">DIN-2026-F</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}

              {activeDeliveries.length === 0 && (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 bg-white rounded-xl">
                  No active routes assigned under your profile manifest.
                </div>
              )}
            </div>

            {/* Unassigned packed products at mandi bay */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Unassigned Packages at Mandi Bay</h3>

              {availablePickups.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-slate-150 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{order.id}</span>
                    <h4 className="text-xs font-black text-indigo-950">{order.product.title} &times; {order.quantity}</h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold">Store: {order.merchantName} &bull; Route: {order.customerLocation.slice(0, 40)}...</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9.5px] text-slate-400 block font-bold">Standard EV split</span>
                      <span className="text-xs font-black text-indigo-950">₹{order.deliveryFeeAmount.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (order.status === 'RIDER_ASSIGNED') {
                          riderAcceptOrder(order.id);
                        } else {
                          assignRiderAndDispatch(order.id, riderId);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-lg shadow-xs"
                    >
                      {order.status === 'RIDER_ASSIGNED' ? 'Accept Assigned Ride' : t.actionAcceptRide}
                    </button>
                  </div>
                </div>
              ))}

              {availablePickups.length === 0 && (
                <div className="p-5 text-center text-slate-400">
                  Mandi bay is fully clear. No packaged boxes awaiting dispatch.
                </div>
              )}
            </div>

          </div>

          {/* Interactive Routing Instructions Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Navigation className="w-5 h-5 text-orange-600" />
                <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Live Route Map Routing</h3>
              </div>

              {/* Map mockup replaced by high-fidelity animated Route Visualizer */}
              {(() => {
                const preciseLocationConsent = (() => {
                  if (!loggedInUser) return true;
                  try {
                    const stored = localStorage.getItem(`dpdp_consent_${loggedInUser.id}`);
                    if (stored) {
                      return JSON.parse(stored).preciseLocation ?? true;
                    }
                  } catch (e) {}
                  return true;
                })();

                return (
                  <div className="space-y-3">
                    <div className="relative h-48 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner select-none">
                      {!preciseLocationConsent ? (
                        // Blurred DPDP Compliance Guard State
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-10 animate-in fade-in duration-300">
                          <ShieldAlert className="w-8 h-8 text-rose-500 animate-bounce mb-2" />
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">TELEMETRY OBFUSCATED</span>
                          <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed mt-1">
                            DPDP Act Section 6 consent revoked. Precise GPS tracking path is deactivated for customer/rider privacy protection.
                          </p>
                        </div>
                      ) : (
                        // Route Active Simulation View
                        <>
                          {/* Animated background gridlines */}
                          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-45"></div>
                          
                          {/* Sourcing and Sinking Paths */}
                          <svg className="absolute inset-0 w-full h-full text-indigo-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Road Network line */}
                            <path
                              d="M 15 80 L 45 80 L 45 30 L 85 30"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray="3 3"
                              className="text-slate-800"
                            />
                            {/* Traveled road path glow */}
                            <path
                              d={(() => {
                                if (simProgress < 33) {
                                  const t = simProgress / 33;
                                  return `M 15 80 L ${15 + t * 30} 80`;
                                } else if (simProgress < 66) {
                                  const t = (simProgress - 33) / 33;
                                  return `M 15 80 L 45 80 L 45 ${80 - t * 50}`;
                                } else {
                                  const t = (simProgress - 66) / 34;
                                  return `M 15 80 L 45 80 L 45 30 L ${45 + t * 40} 30`;
                                }
                              })()}
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="2.5"
                              className="drop-shadow-[0_0_6px_#f97316]"
                            />
                          </svg>

                          {/* Origin Mandi hub marker */}
                          <div className="absolute" style={{ left: '15%', top: '80%', transform: 'translate(-50%, -50%)' }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping absolute"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-600 border border-white relative"></div>
                            <span className="absolute left-3 -top-1.5 bg-slate-900 text-white text-[7.5px] font-bold font-mono px-1 py-0.2 rounded border border-slate-800 whitespace-nowrap">
                              Hub: Mandi Bay
                            </span>
                          </div>

                          {/* Destination citizen node */}
                          <div className="absolute" style={{ left: '85%', top: '30%', transform: 'translate(-50%, -50%)' }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white relative"></div>
                            <span className="absolute right-3 -top-1.5 bg-slate-900 text-white text-[7.5px] font-bold font-mono px-1 py-0.2 rounded border border-slate-800 whitespace-nowrap">
                              Drop: Citizen Loc
                            </span>
                          </div>

                          {/* Moving EV Rider */}
                          <div 
                            className="absolute transition-all duration-1000 ease-linear" 
                            style={{ 
                              left: `${riderPos.x}%`, 
                              top: `${riderPos.y}%`, 
                              transform: 'translate(-50%, -50%)' 
                            }}
                          >
                            <div className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-[0_0_12px_#f97316] border border-white">
                              <Navigation2 className="w-3 h-3 rotate-90" />
                            </div>
                          </div>

                          {/* Float overlay telemetry parameters */}
                          <div className="absolute bottom-2 left-2 bg-slate-900/95 border border-slate-800 rounded px-2 py-1 text-[8px] font-mono text-slate-300 space-y-0.5 shadow-md">
                            <div>VPA IP: <span className="text-emerald-400 font-bold">17.4411° N, 78.5522° E</span></div>
                            <div className="flex gap-2">
                              <span>SPEED: <span className="text-orange-400 font-bold">38 km/h</span></span>
                              <span>SOC: <span className="text-blue-400 font-bold">81%</span></span>
                            </div>
                          </div>

                          {/* Simulator control pad */}
                          <button
                            type="button"
                            onClick={() => setIsSimulating(!isSimulating)}
                            className="absolute top-2 right-2 p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white rounded-md transition-all shadow-md flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            {isSimulating ? <Pause className="w-2.5 h-2.5 text-orange-400" /> : <Play className="w-2.5 h-2.5 text-emerald-400" />}
                            <span>{isSimulating ? 'Pause GPS' : 'Resume'}</span>
                          </button>
                        </>
                      )}
                    </div>

                    {preciseLocationConsent && (
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded-lg text-[9px] font-mono text-slate-500">
                        <span>Route Complete: <strong className="text-slate-800">{simProgress}%</strong></span>
                        <span>ETA: <strong className="text-slate-800">{Math.max(15 - Math.floor(simProgress / 7), 2)} mins</strong></span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <p className="text-[10.5px] text-slate-500 leading-normal">
                Coordinate pipelines use official deep-link maps for zero-congestion EV dispatching. Complete the handshake PIN confirmation upon physical dropoff to trigger bank transfers immediately.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Safety Compliance</span>
              <p className="text-[10px] text-slate-500 leading-tight">Strict Aadhaar e-KYC compliance &bull; Drive safely.</p>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          {/* Key summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Routes Slipped</span>
              <span className="text-xl font-black text-indigo-950 block">{completedDeliveries.length} Packages</span>
              <span className="text-[9.5px] text-slate-400 mt-1 block">Completed physical handshakes</span>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-150 shadow-xs">
              <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
              <span className="text-xl font-black text-emerald-700 block">₹{totalRiderEarnings.toFixed(2)}</span>
              <span className="text-[9.5px] text-emerald-600 mt-1 block">Directly split to VPA: {loggedInUser?.vpa || 'rider1@okpaytm'}</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Compliance Standard</span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                e-KYC verified
              </span>
              <span className="text-[9.5px] text-slate-400 mt-1 block">Driving Lic: Verified ts08239</span>
            </div>
          </div>

          {/* Audit ledger table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">Handshake Payout Ledger</h3>
              <p className="text-xs text-slate-500">Completed rides audit trail with direct-to-bank settlement transactions.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Product Item</th>
                    <th className="p-4">Merchant Origin</th>
                    <th className="p-4">Customer Destination</th>
                    <th className="p-4">Settle Date</th>
                    <th className="p-4 text-right">Convenience Payout Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedDeliveries.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-900">{o.id}</td>
                      <td className="p-4 font-bold text-slate-800">{o.product.title}</td>
                      <td className="p-4 font-semibold text-slate-500">{o.merchantName}</td>
                      <td className="p-4 font-semibold text-slate-500">{o.customerLocation}</td>
                      <td className="p-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-black text-emerald-700 text-sm">₹{o.deliveryFeeAmount.toFixed(2)}</td>
                    </tr>
                  ))}

                  {completedDeliveries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No completed delivery handshakes registered under your account yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
