import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { ShieldCheck, ShieldAlert, Sliders, RefreshCw, BarChart2, Star, Search, Filter, Database, Link, ArrowRight, CheckCircle2, AlertTriangle, FileJson, Lock, UserCheck, Settings, AlertOctagon, Info, ArrowUpRight } from 'lucide-react';

export const ExecutiveConsole: React.FC = () => {
  const { 
    config, 
    users, 
    orders, 
    language, 
    updateConfig, 
    addNotification, 
    auditLogs, 
    approveUserRegistration, 
    overrideOrderStatus, 
    toggleComplianceFlag,
    buyerAcceptOrder,
    sendToTransport,
    transportAssignRider
  } = useApp();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'GOVERNANCE' | 'SYSTEM_CRM' | 'AUDIT_LOG' | 'BUYER_PORTAL' | 'TRANSPORT_DEPT'>('TELEMETRY');
  const [govSubTab, setGovSubTab] = useState<'MERCHANTS' | 'DRIVERS'>('MERCHANTS');
  const [drilledOrderId, setDrilledOrderId] = useState<string | null>(null);

  // States for the new logistics workflow
  const [dispatchDetailsMap, setDispatchDetailsMap] = useState<Record<string, string>>({});
  const [selectedRiderIdMap, setSelectedRiderIdMap] = useState<Record<string, string>>({});

  // Immutable Audit Log states
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [adminToolTab, setAdminToolTab] = useState<'APPROVE' | 'OVERRIDE' | 'COMPLIANCE'>('APPROVE');
  
  // States for admin actions
  const [selectedApproveUserId, setSelectedApproveUserId] = useState('');
  const [selectedOverrideOrderId, setSelectedOverrideOrderId] = useState('');
  const [selectedOverrideStatus, setSelectedOverrideStatus] = useState<string>('DELIVERED');
  const [selectedComplianceUserId, setSelectedComplianceUserId] = useState('');
  const [complianceFlagText, setComplianceFlagText] = useState('Missing physical Mandi audit certificates');
  const [chainValidState, setChainValidState] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Config adjustment states
  const [platformFee, setPlatformFee] = useState(config.platformFeePercent);
  const [influencerShare, setInfluencerShare] = useState(config.defaultInfluencerPercent);
  const [taxPercent, setTaxPercent] = useState(config.defaultTaxPercent);
  const [deliveryFee, setDeliveryFee] = useState(config.deliveryFeeAmount);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleUpdateRegulations = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const error = updateConfig({
      platformFeePercent: parseFloat(String(platformFee)),
      defaultInfluencerPercent: parseFloat(String(influencerShare)),
      defaultTaxPercent: parseFloat(String(taxPercent)),
      deliveryFeeAmount: parseFloat(String(deliveryFee)),
    });

    if (error) {
      setFeedbackMsg({ text: error, isError: true });
      addNotification(`Regulation Update Refused: ${error}`);
    } else {
      setFeedbackMsg({ text: t.successRulesUpdated, isError: false });
    }
  };

  const handleVerifyChain = () => {
    setChainValidState('VALIDATING');
    setTimeout(() => {
      let isChainIntact = true;
      for (let i = 1; i < auditLogs.length; i++) {
        if (auditLogs[i].prevHash !== auditLogs[i - 1].hash) {
          isChainIntact = false;
          break;
        }
      }
      setChainValidState(isChainIntact ? 'SUCCESS' : 'ERROR');
    }, 600);
  };

  const merchants = users.filter((u) => u.role === 'MERCHANT');

  // Overall calculations
  const settledOrders = orders.filter((o) => o.status === 'DELIVERED');
  const globalTurnover = settledOrders.reduce((sum, o) => sum + (o.product.price * o.quantity), 0);
  
  const totalPlatformDpiFee = settledOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.platform;
    return sum + (o.product.price * o.quantity * (o.platformFeePercent / 100));
  }, 0);

  const totalTaxCollected = settledOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.tax;
    return sum + (o.product.price * o.quantity * (o.taxPercent / 100));
  }, 0);

  return (
    <div id="admin-workspace" className="space-y-6">
      
      {/* Admin header */}
      <div className="bg-white rounded-sm p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="space-y-1 font-sans">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-950 font-display">DPI Executive Operations Console</h2>
            <span className="bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase border border-slate-900 px-2.5 py-0.5 rounded-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              BharatConnect DPI Registry Node
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Authorized: <strong className="text-slate-700 font-extrabold">Lokesh Naidu (CEO, BharatConnect)</strong> &bull; Bengaluru - Hyderabad Operations Hub
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-sm overflow-x-auto">
          {[
            { id: 'TELEMETRY', label: 'Global Telemetry & Splits' },
            { id: 'GOVERNANCE', label: 'Trust Governance & Audits' },
            { id: 'BUYER_PORTAL', label: 'ONDC Buyer Portal' },
            { id: 'TRANSPORT_DEPT', label: 'Transport Dept' },
            { id: 'SYSTEM_CRM', label: 'System Transaction CRM' },
            { id: 'AUDIT_LOG', label: 'Immutable Audit Ledger' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'TELEMETRY' && (
        <div className="space-y-6">
          
          {/* Global KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-2xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">GCC Aggregate Volume</span>
              <span className="text-2xl font-black text-slate-950 block mt-1 font-mono">₹{globalTurnover.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Escrow settle aggregate</span>
            </div>

            <div className="bg-slate-50 rounded-sm p-5 border border-slate-200 shadow-2xs">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Corporate Treasury Accrual</span>
              <span className="text-2xl font-black text-slate-950 block mt-1 font-mono">₹{totalPlatformDpiFee.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Retained via platform fee</span>
            </div>

            <div className="bg-slate-50 rounded-sm p-5 border border-slate-200 shadow-2xs">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Estimated Tax Fund</span>
              <span className="text-2xl font-black text-slate-950 block mt-1 font-mono">₹{totalTaxCollected.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Automated GST/TDS reserves</span>
            </div>

            <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-2xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Active Supply Nodes</span>
              <span className="text-2xl font-black text-slate-950 block mt-1 font-mono">{users.length} Nodes</span>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Seeded + registered partners</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* System config form with strict validation check */}
            <div className="lg:col-span-6 bg-white rounded-sm p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
                <Sliders className="w-4 h-4 text-slate-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{t.systemConfig}</h3>
              </div>

              {feedbackMsg && (
                <div className={`p-3.5 rounded-sm text-xs flex gap-2 items-start ${
                  feedbackMsg.isError 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${feedbackMsg.isError ? 'text-rose-700' : 'text-emerald-700'}`} />
                  <p className="font-semibold leading-relaxed">{feedbackMsg.text}</p>
                </div>
              )}

              <form onSubmit={handleUpdateRegulations} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Platform Fee % (2.0% - 3.0% Max) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={platformFee}
                      onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">GST/TDS Split % *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Influencer Split % *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={influencerShare}
                      onChange={(e) => setInfluencerShare(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rider Base Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                >
                  {t.updateRulesBtn}
                </button>
              </form>
            </div>

            {/* Platform regulatory brief */}
            <div className="lg:col-span-6 bg-slate-900 text-white rounded-sm p-5 border border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block">DPI Public Sector Mandate</span>
                <h4 className="text-sm font-bold uppercase tracking-tight text-slate-100 font-display">BharatConnect Service Fee Ceiling Enforcements</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  In compliance with the <strong>BharatConnect Digital Public Infrastructure (DPI) trade charter</strong>, platform routing fees are strictly capped at <strong>2.0% - 3.0%</strong>. This guarantees that local Indian merchants retain peak revenue, driving micro-economic growth with direct trade lanes.
                </p>

                <div className="p-3.5 bg-slate-950 rounded-sm border border-slate-800 space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Compliance Checklist</span>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>2-3% platform fee cap check:</span>
                    <span className="text-emerald-400 font-bold font-mono">STRICTLY PASS</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>e-KYC data privacy assurance:</span>
                    <span className="text-emerald-400 font-bold font-mono">DPDP ACT VERIFIED</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800 text-center font-mono">
                Active operations node running: BHARATCONNECT-HYD-DPI-SECURE-01
              </div>
            </div>

          </div>

        </div>
      )}
      {activeTab === 'GOVERNANCE' && (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-display">{t.globalTrustAudit}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Verify licenses, Aadhaar records, photo files, and trust score indexes for all participants registered on the BharatConnect node.
              </p>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex bg-slate-200/60 p-0.5 rounded-sm border border-slate-300">
              <button
                type="button"
                onClick={() => setGovSubTab('MERCHANTS')}
                className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  govSubTab === 'MERCHANTS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                D2C Merchants ({merchants.length})
              </button>
              <button
                type="button"
                onClick={() => setGovSubTab('DRIVERS')}
                className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  govSubTab === 'DRIVERS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delivery Drivers ({users.filter(u => u.role === 'DELIVERY_PARTNER').length})
              </button>
            </div>
          </div>

          {govSubTab === 'MERCHANTS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-4">Merchant Photo</th>
                    <th className="p-4">Merchant Name</th>
                    <th className="p-4">Store Name</th>
                    <th className="p-4">GSTIN ID</th>
                    <th className="p-4">e-KYC Document</th>
                    <th className="p-4 text-center">Trust Index</th>
                    <th className="p-4">Compliance Audit Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {merchants.map((merchant, index) => {
                    // Custom fallback profiles based on name
                    const photoUrl = index % 2 === 0 
                      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150';
                    return (
                      <tr key={merchant.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <img 
                            src={photoUrl} 
                            alt={merchant.name} 
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-950">
                          {merchant.name}
                          <span className="block text-[9px] text-slate-400 font-mono font-bold mt-0.5">{merchant.id}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{merchant.storeName || 'N/A'}</td>
                        <td className="p-4 font-mono text-slate-500 text-[11px] font-bold">{merchant.gstin || '36AAAAA1111A1Z1'}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono uppercase block w-fit">
                            AADHAAR OK
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">BIS Verified</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-xs text-slate-900 font-mono">{merchant.trustScore}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-[10.5px] leading-relaxed max-w-xs">
                          <p className="font-medium text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-150">
                            "e-KYC verified via DigiLocker on signup. GSTIN lookup successful. Swadeshi products certified with BIS stamp."
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {govSubTab === 'DRIVERS' && (
            <div className="overflow-x-auto animate-in fade-in duration-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-4">Driver Photo</th>
                    <th className="p-4">Driver Name</th>
                    <th className="p-4">Vehicle Type</th>
                    <th className="p-4">License No.</th>
                    <th className="p-4">Aadhaar (Masked)</th>
                    <th className="p-4 text-center">Rider Trust Score</th>
                    <th className="p-4">RTO Compliance Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter(u => u.role === 'DELIVERY_PARTNER').map((driver, index) => {
                    const photoUrl = index % 2 === 0
                      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
                      : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
                    return (
                      <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <img 
                            src={photoUrl} 
                            alt={driver.name} 
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-950">
                          {driver.name}
                          <span className="block text-[9px] text-slate-400 font-mono font-bold mt-0.5">{driver.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase">
                            {driver.vehicleType || 'EV SCOOTER'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600 text-[11px] font-bold">{driver.licenseNo || 'TS09-202400912'}</td>
                        <td className="p-4 font-mono text-slate-500 text-[11.5px]">{driver.aadhaarMasked || 'XXXX-XXXX-4509'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-xs text-slate-900 font-mono">{driver.trustScore || 98}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-[10.5px] leading-relaxed max-w-xs">
                          <p className="font-medium text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-150">
                            "RTO Sarathi License matched. Masked Aadhaar validated. Location obfuscation enabled per DPDP Consent Rule 3."
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                  {users.filter(u => u.role === 'DELIVERY_PARTNER').length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-semibold">
                        No delivery riders registered on this node currently.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'SYSTEM_CRM' && (
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-display">{t.globalLedger}</h3>
            <p className="text-xs text-slate-400 mt-1">Real-time centralized routing and transaction splits logs under BharatConnect DPI clearing house protocols.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-4">Transaction Code</th>
                  <th className="p-4">Beneficiary Store</th>
                  <th className="p-4">Customer Loc.</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Plat. Fee (Capped)</th>
                  <th className="p-4">Govt Tax</th>
                  <th className="p-4 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const totalPrice = o.product.price * o.quantity;
                  const platformSplit = parseFloat((totalPrice * (o.platformFeePercent / 100)).toFixed(2));
                  const taxSplit = parseFloat((totalPrice * (o.taxPercent / 100)).toFixed(2));
                  const commissionSplit = parseFloat((totalPrice * (o.commissionPercent / 100)).toFixed(2));
                  const deliverySplit = o.deliveryFeeAmount;
                  const merchantSplit = parseFloat((totalPrice - (platformSplit + taxSplit + commissionSplit)).toFixed(2));

                  const isExpanded = drilledOrderId === o.id;

                  return (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDrilledOrderId(isExpanded ? null : o.id)}>
                        <td className="p-4 font-mono font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                          <span className="text-slate-400 text-[9px]">{isExpanded ? '▲' : '🔍'}</span>
                          <span className="hover:underline">{o.id}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{o.merchantName}</td>
                        <td className="p-4 font-semibold text-slate-500 truncate max-w-[150px]" title={o.customerLocation}>{o.customerLocation}</td>
                        <td className="p-4 font-bold text-slate-900 font-mono text-[11px]">₹{totalPrice.toFixed(2)}</td>
                        <td className="p-4 font-medium text-slate-600 font-mono text-[11px]">₹{platformSplit.toFixed(2)}</td>
                        <td className="p-4 font-medium text-slate-600 font-mono text-[11px]">₹{taxSplit.toFixed(2)}</td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold border uppercase tracking-wider ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {o.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrilledOrderId(isExpanded ? null : o.id);
                            }}
                            className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? 'Close' : 'Drill'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950 text-white border-b border-slate-800">
                          <td colSpan={7} className="p-6">
                            <div className="space-y-4 animate-in fade-in duration-300">
                              
                              {/* Header banner inside drill down */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-100 font-display">
                                    Sovereign Central Audit Node &bull; Escrow Ledger
                                  </h4>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  Ledger Hash: BHARAT-TX-REC-{o.id}-SECURE
                                </span>
                              </div>

                              {/* Bento box details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                
                                {/* 1. Split Settlement Details */}
                                <div className="bg-slate-900 p-4 rounded-sm border border-slate-800 space-y-3">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                                    💰 Multi-Party UPI Split Ledger
                                  </span>
                                  <div className="space-y-1.5 text-[11.5px] text-slate-300 font-sans">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Gross Sale:</span>
                                      <span className="font-mono">₹{totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Merchant Payout VPA:</span>
                                      <span className="font-mono text-emerald-300">₹{merchantSplit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Government GST Tax ({o.taxPercent}%):</span>
                                      <span className="font-mono">₹{taxSplit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">DPI Platform Fee ({o.platformFeePercent}%):</span>
                                      <span className="font-mono text-blue-400 font-bold">₹{platformSplit.toFixed(2)}</span>
                                    </div>
                                    {o.influencerId && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Creator Commission ({o.commissionPercent}%):</span>
                                        <span className="font-mono">₹{commissionSplit.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">EV Delivery Partner:</span>
                                      <span className="font-mono">₹{deliverySplit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-800 pt-1.5 text-slate-100 font-bold text-xs">
                                      <span>Settlement Status:</span>
                                      <span className={o.status === 'DELIVERED' ? 'text-emerald-400' : 'text-amber-400'}>
                                        {o.status === 'DELIVERED' ? 'INSTANT_PAY_SETTLED' : 'ESCROW_LOCKED'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 2. Logistics Telemetry */}
                                <div className="bg-slate-900 p-4 rounded-sm border border-slate-800 space-y-3">
                                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                                    🚴 Logistics Telemetry Logs
                                  </span>
                                  <div className="space-y-1.5 text-[11.5px] text-slate-300 font-sans">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">EV Vehicle Assigned:</span>
                                      <span className="font-medium text-slate-200">{o.vehicleType || 'BharatConnect EV Express'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Origin Warehouse:</span>
                                      <span className="text-slate-200 truncate max-w-[130px]">{o.merchantName} Hub</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Destination Coordinate:</span>
                                      <span className="font-mono text-slate-200">17.3850° N, 78.4867° E</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Rider ID / Phone:</span>
                                      <span className="font-mono">harish.delivery@bharatconnect.in</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Physical Handshake:</span>
                                      <span className="text-sky-300 font-semibold font-mono">Verified (ECDSA Signature)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Sourcing & Quality Control Compliance */}
                                <div className="bg-slate-900 p-4 rounded-sm border border-slate-800 space-y-3">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                                    🛡️ Quality & Sourcing Compliance
                                  </span>
                                  <div className="space-y-1.5 text-[11.5px] text-slate-300 font-sans">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Product Line Tariff:</span>
                                      <span className="font-mono text-slate-200">HSN: {o.product.hsnCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">BIS Certification:</span>
                                      <span className="text-emerald-400 font-bold font-mono">PASS (Grade A)</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Chemical Assays:</span>
                                      <span className="text-purple-300 italic">Heavy Metals (ND), Pesticides (ND)</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">FSSAI Pack Code:</span>
                                      <span className="font-mono">FSSAI-DIN-2026-REG-0912</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-800 pt-1.5 text-slate-100 font-bold">
                                      <span>Partner Trust Score:</span>
                                      <span className="text-amber-400 font-mono">98.5% Compliant</span>
                                    </div>
                                  </div>
                                </div>

                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT_LOG' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header & Verification Section */}
          <div className="bg-slate-900 text-white rounded-sm p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">Immutable Central Audit Logs</span>
              </div>
              <h2 className="text-xl font-light text-slate-100 font-display uppercase tracking-tight">
                Sovereign <span className="font-bold">Ledger Registry Hub</span>
              </h2>
              <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                BharatConnect DPI systems enforce mathematical immutability on administrative activities. Every fee recalibration, merchant credential validation, and transaction override is linked chronologically in a hash chain.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-stretch gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={handleVerifyChain}
                disabled={chainValidState === 'VALIDATING'}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className={`w-3.5 h-3.5 ${chainValidState === 'VALIDATING' ? 'animate-spin' : ''}`} />
                {chainValidState === 'VALIDATING' ? 'Computing Hash Chain...' : 'Verify Cryptographic Chain'}
              </button>

              {chainValidState === 'SUCCESS' && (
                <div className="p-2.5 bg-emerald-950/70 text-emerald-300 border border-emerald-800 rounded-sm text-[10px] font-mono flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-200">CHAIN INTEGRITY OK</span>
                    Sequential hash sequence verified. No external modifications.
                  </div>
                </div>
              )}

              {chainValidState === 'ERROR' && (
                <div className="p-2.5 bg-rose-950/70 text-rose-300 border border-rose-800 rounded-sm text-[10px] font-mono flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-rose-200">LEDGER MUTATION WARNING</span>
                    Previous blocks hash matching failure detected!
                  </div>
                </div>
              )}

              {chainValidState === 'IDLE' && (
                <div className="p-2 bg-slate-800/80 text-slate-400 rounded-sm text-[10px] font-mono text-center">
                  Status: Sequence unchecked
                </div>
              )}
            </div>
          </div>

          {/* Interactive Override & Simulation Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand: Sovereign Override Controls */}
            <div className="lg:col-span-5 bg-white rounded-sm border border-slate-200 shadow-xs flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-display">Sovereign Overwrite & Compliance Console</h3>
              </div>

              {/* Sub-tabs for Admin Tools */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setAdminToolTab('APPROVE')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 border-transparent ${
                    adminToolTab === 'APPROVE' 
                      ? 'bg-white text-indigo-700 border-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Approve Registry
                </button>
                <button
                  type="button"
                  onClick={() => setAdminToolTab('OVERRIDE')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 border-transparent ${
                    adminToolTab === 'OVERRIDE' 
                      ? 'bg-white text-indigo-700 border-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Tx Override
                </button>
                <button
                  type="button"
                  onClick={() => setAdminToolTab('COMPLIANCE')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 border-transparent ${
                    adminToolTab === 'COMPLIANCE' 
                      ? 'bg-white text-indigo-700 border-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Compliance Flags
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* 1. APPROVE USER REGISTRY PANEL */}
                {adminToolTab === 'APPROVE' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-widest block">Action type</span>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-display">Swadeshi Registrar Certification</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Approve pending e-KYC documents and physical Mandi audit listings for registered Merchants or Delivery Drivers. This sets their trust rating to active.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Select User / Node Profile</label>
                        <select
                          value={selectedApproveUserId}
                          onChange={(e) => setSelectedApproveUserId(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                        >
                          <option value="">-- Choose User profile to approve --</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              [{u.role}] {u.name} ({u.email}) - Current Trust: {u.trustScore || 0}%
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Preview selected profile */}
                      {(() => {
                        const selU = users.find(u => u.id === selectedApproveUserId);
                        if (!selU) return null;
                        return (
                          <div className="p-3 bg-slate-50 border border-slate-150 rounded space-y-2 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-mono">UID/Key Node:</span>
                              <span className="font-mono text-slate-900 font-bold">{selU.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Registered VPA Address:</span>
                              <span className="font-mono text-slate-800">{selU.vpa || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Aadhaar (Masked):</span>
                              <span className="font-mono text-slate-800">{selU.aadhaarMasked || 'XXXX-XXXX-8822'}</span>
                            </div>
                            {selU.storeName && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Swadeshi Store:</span>
                                <span className="text-indigo-600 font-bold">{selU.storeName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedApproveUserId}
                      onClick={() => {
                        approveUserRegistration(selectedApproveUserId);
                        setSelectedApproveUserId('');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approve & Certification Release
                    </button>
                  </div>
                )}

                {/* 2. TRANSACTION OVERRIDE PANEL */}
                {adminToolTab === 'OVERRIDE' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-widest block">Action type</span>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-display">Instant Escrow Split Override</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Forcibly state transition active orders to resolve logistics disputes or coordinate manual delivery handshakes. This triggers immediate split disbursal.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Select Active Transaction Code</label>
                        <select
                          value={selectedOverrideOrderId}
                          onChange={(e) => setSelectedOverrideOrderId(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold font-mono"
                        >
                          <option value="">-- Choose transaction code --</option>
                          {orders.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.id} - {o.merchantName} ({o.status}) - ₹{(o.product.price * o.quantity).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Forced Status Shift Target</label>
                        <select
                          value={selectedOverrideStatus}
                          onChange={(e) => setSelectedOverrideStatus(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold font-mono"
                        >
                          <option value="DELIVERED">DELIVERED (Settle & Disburse Escrow)</option>
                          <option value="DISPATCHED">DISPATCHED (In Transit)</option>
                          <option value="PENDING">PENDING (Awaiting Rider Accept)</option>
                          <option value="CANCELLED">CANCELLED (Void Splits & Return to VPA)</option>
                        </select>
                      </div>

                      {/* Display transaction specs */}
                      {(() => {
                        const selO = orders.find(o => o.id === selectedOverrideOrderId);
                        if (!selO) return null;
                        return (
                          <div className="p-3 bg-slate-50 border border-slate-150 rounded space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Product name:</span>
                              <span className="font-bold text-slate-800">{selO.product.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Splits Model:</span>
                              <span className="font-mono text-slate-500 text-[10px]">Merchant ({100 - selO.platformFeePercent - selO.taxPercent - (selO.influencerId ? selO.commissionPercent : 0)}%) | Gov ({selO.taxPercent}%) | Platform ({selO.platformFeePercent}%)</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedOverrideOrderId}
                      onClick={() => {
                        overrideOrderStatus(selectedOverrideOrderId, selectedOverrideStatus as any);
                        setSelectedOverrideOrderId('');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Apply State Overwrite & Sign Block
                    </button>
                  </div>
                )}

                {/* 3. COMPLIANCE FLAG TOGGLE PANEL */}
                {adminToolTab === 'COMPLIANCE' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-widest block">Action type</span>
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-display">Statutory Compliance Rating Audit</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Manually issue warning flags or reinstate high compliance standing for network participants based on physical audits or complaints. Adjusts trust index immediately.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Select Node Participant</label>
                        <select
                          value={selectedComplianceUserId}
                          onChange={(e) => setSelectedComplianceUserId(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                        >
                          <option value="">-- Choose user to audit --</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              [{u.role}] {u.name} - Trust Index: {u.trustScore || 0}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Reason Details / Statutory Infraction Note</label>
                        <textarea
                          rows={2}
                          value={complianceFlagText}
                          onChange={(e) => setComplianceFlagText(e.target.value)}
                          placeholder="e.g. Failure to maintain zero-retention logs per DPDP Act Rule 4."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!selectedComplianceUserId}
                      onClick={() => {
                        toggleComplianceFlag(selectedComplianceUserId, complianceFlagText);
                        setSelectedComplianceUserId('');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 text-orange-400" />
                      Sign Compliance Audit Flag
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-150 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sovereign actions on this terminal execute instantly on local indexers.</span>
                </div>
              </div>
            </div>

            {/* Right Hand: The Immutable Registry Stream */}
            <div className="lg:col-span-7 bg-white rounded-sm border border-slate-200 shadow-xs flex flex-col">
              
              {/* Header and Filtering Controls */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-display">Live Block Sequence ({auditLogs.length} blocks)</h3>
                  </div>
                  
                  {/* Export button */}
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "bharatconnect_dpi_audit_ledger.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addNotification("System Audit Ledger: Successfully generated and downloaded JSON dump!");
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-extrabold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileJson className="w-3 h-3 text-slate-600" />
                    Export Ledger (JSON)
                  </button>
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
                  
                  {/* Search input */}
                  <div className="md:col-span-6 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by details, actor email, hash..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-sans placeholder-slate-400 focus:outline-indigo-500"
                    />
                  </div>

                  {/* Filter Action Type */}
                  <div className="md:col-span-3">
                    <select
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-[10.5px] font-sans text-slate-700"
                    >
                      <option value="ALL">All Actions</option>
                      <option value="REGISTRATION_APPROVAL">Registry Approvals</option>
                      <option value="TRANSACTION_OVERRIDE">Escrow Overrides</option>
                      <option value="COMPLIANCE_FLAG_TOGGLE">Compliance Warnings</option>
                      <option value="REGULATION_ADJUSTMENT">Fee Adjustments</option>
                    </select>
                  </div>

                  {/* Filter Severity */}
                  <div className="md:col-span-3">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-[10.5px] font-sans text-slate-700"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="INFO">INFO (Slate)</option>
                      <option value="WARNING">WARNING (Gold)</option>
                      <option value="CRITICAL">CRITICAL (Crimson)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* The Timeline Stream */}
              <div className="p-5 flex-1 space-y-4 max-h-[600px] overflow-y-auto">
                {(() => {
                  const filteredLogs = auditLogs.filter((log) => {
                    const matchesSearch = 
                      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.id.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.hash.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.prevHash.toLowerCase().includes(auditSearch.toLowerCase());

                    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
                    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

                    return matchesSearch && matchesAction && matchesSeverity;
                  }).reverse(); // Display newest first in chronological stream

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <AlertTriangle className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold uppercase tracking-wide">No ledger matching criteria found</p>
                        <p className="text-[11px]">Refine your search keywords or toggle filter states.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="relative border-l border-slate-200 pl-5 ml-2.5 space-y-6">
                      {filteredLogs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        
                        // Action Badge styling
                        let actionPill = "bg-slate-100 text-slate-700 border-slate-200";
                        if (log.action === 'REGISTRATION_APPROVAL') actionPill = "bg-blue-50 text-blue-700 border-blue-200";
                        if (log.action === 'TRANSACTION_OVERRIDE') actionPill = "bg-red-50 text-red-700 border-red-200";
                        if (log.action === 'COMPLIANCE_FLAG_TOGGLE') actionPill = "bg-orange-50 text-orange-700 border-orange-200";
                        if (log.action === 'REGULATION_ADJUSTMENT') actionPill = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        if (log.action === 'KYC_REVOCATION') actionPill = "bg-amber-50 text-amber-700 border-amber-200";

                        // Severity Badge styling
                        let severityBadge = "bg-slate-100 text-slate-700";
                        if (log.severity === 'WARNING') severityBadge = "bg-amber-100 text-amber-900";
                        if (log.severity === 'CRITICAL') severityBadge = "bg-rose-100 text-rose-900";

                        return (
                          <div key={log.id} className="relative group">
                            
                            {/* Dot indicator */}
                            <div className={`absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-all ${
                              log.severity === 'CRITICAL' ? 'border-rose-500 group-hover:bg-rose-500' :
                              log.severity === 'WARNING' ? 'border-amber-500 group-hover:bg-amber-500' :
                              'border-blue-500 group-hover:bg-blue-500'
                            }`} />

                            {/* Main Block Card */}
                            <div 
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className={`p-4 bg-white border rounded-sm shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5 ${
                                isExpanded ? 'border-slate-400 bg-slate-50/50' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {log.id}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-sm text-[8.5px] font-extrabold border uppercase tracking-wider font-mono ${actionPill}`}>
                                    {log.action.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  {new Date(log.timestamp).toLocaleString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                  })}
                                </span>
                              </div>

                              <p className="text-[11.5px] text-slate-800 leading-relaxed font-sans font-medium">
                                {log.details}
                              </p>

                              <div className="flex flex-wrap items-center gap-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                                <span className="font-bold text-slate-700">
                                  Actor: <span className="font-sans font-semibold text-slate-600">{log.actorName}</span> <span className="font-mono text-slate-400">&lt;{log.actorEmail}&gt;</span>
                                </span>
                                
                                <span className="text-slate-200">&bull;</span>
                                
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${severityBadge}`}>
                                  {log.severity}
                                </span>

                                <span className="text-slate-200">&bull;</span>

                                <span className={`px-1 rounded text-[8px] border font-bold ${
                                  log.status === 'SUCCESS' ? 'text-emerald-600 border-emerald-200 bg-emerald-50/20' : 'text-orange-600 border-orange-200 bg-orange-50/20'
                                }`}>
                                  {log.status}
                                </span>
                              </div>

                              {/* Cryptographic Link section */}
                              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[9px] text-slate-400 font-mono border-t border-slate-100/50">
                                <div className="flex items-center gap-1 truncate max-w-xs" title={log.hash}>
                                  <Link className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span>Hash:</span>
                                  <span className="text-slate-600 font-bold">{log.hash}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate max-w-xs" title={log.prevHash}>
                                  <span>Prev:</span>
                                  <span className="text-slate-500">{log.prevHash.slice(0, 15)}...</span>
                                </div>
                              </div>

                              {/* Expanded panel detail */}
                              {isExpanded && (
                                <div className="p-4 bg-slate-950 text-white rounded mt-3 space-y-3 font-mono text-[10.5px] border border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                    <span className="text-indigo-400 uppercase font-black text-[9px]">Full Cryptographic Payload</span>
                                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">SHA256 CHECKSUM</span>
                                  </div>
                                  
                                  {/* JSON structure preview */}
                                  <pre className="overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 max-h-48 whitespace-pre-wrap">
                                    {JSON.stringify({
                                      blockId: log.id,
                                      timestamp: log.timestamp,
                                      transactionType: log.action,
                                      authority: {
                                        name: log.actorName,
                                        email: log.actorEmail,
                                        signatureKey: `ECDSA-${log.hash.slice(-4)}`
                                      },
                                      payload: {
                                        description: log.details,
                                        metadata: log.metadata || { compliance: "strict", routingNodes: ["central-hyderabad-1"] }
                                      },
                                      ledgerLinks: {
                                        previousBlockHash: log.prevHash,
                                        currentBlockHash: log.hash
                                      }
                                    }, null, 2)}
                                  </pre>

                                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                    <span className="text-[8.5px] text-slate-500">Node verification: BHARAT-DPI-CHAIN-INDEX-01</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addNotification(`Block ${log.id} successfully checked against Sovereign Public Vault. Signature: VALID.`);
                                      }}
                                      className="px-2 py-1 bg-indigo-900 hover:bg-indigo-800 border border-indigo-700 text-white text-[8px] font-black uppercase rounded cursor-pointer transition-colors"
                                    >
                                      Verify block signature
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'BUYER_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 text-white rounded-sm p-6 border border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight uppercase font-display">ONDC Network - Buyer Agent Portal</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-3xl">
              This sandbox console represents the Buyer Network Participant (Buyer App). When retail customers initiate a checkout booking, the request is routed here. As the Buyer Agent, you must verify the customer's credentials and update the order with verified dispatch details.
            </p>
          </div>

          <div className="bg-white rounded-sm border border-slate-200 shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
              Active Customer Booking Requests
            </div>
            <div className="p-6">
              {orders.filter(o => o.status === 'BOOKED' || o.status === 'BUYER_ACCEPTED').length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wide">No active buyer requests</p>
                  <p className="text-[11px]">Go to the Consumer Dashboard to place a new product booking request.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orders.filter(o => o.status === 'BOOKED' || o.status === 'BUYER_ACCEPTED').map((order) => {
                    const totalAmt = order.product.price * order.quantity;
                    const isAccepted = order.status === 'BUYER_ACCEPTED';
                    return (
                      <div key={order.id} className={`p-5 rounded-sm border ${isAccepted ? 'border-emerald-200 bg-emerald-50/10' : 'border-amber-200 bg-amber-50/10'} space-y-4`}>
                        <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block">ORDER ID</span>
                            <span className="font-mono text-xs font-black text-slate-800">{order.id}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                            isAccepted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">CUSTOMER</span>
                            <span className="font-bold text-slate-800">{order.customerName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">TOTAL ESCROW</span>
                            <span className="font-extrabold text-slate-900 font-mono">₹{totalAmt.toFixed(2)}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100 mt-1">
                            <span className="text-[9px] text-slate-400 block font-bold">PRODUCT REQUESTED</span>
                            <span className="font-semibold text-slate-800">{order.product.title} &times; {order.quantity}</span>
                          </div>
                        </div>

                        {!isAccepted ? (
                          <div className="space-y-3 pt-3 border-t border-slate-150">
                            <div>
                              <label className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                                Enter Dispatch / Routing Instructions
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Standard EV Cargo with priority routing to Ghatkesar Hub"
                                value={dispatchDetailsMap[order.id] || ''}
                                onChange={(e) => setDispatchDetailsMap({
                                  ...dispatchDetailsMap,
                                  [order.id]: e.target.value
                                })}
                                className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const details = dispatchDetailsMap[order.id] || 'Priority routing via certified EV network';
                                buyerAcceptOrder(order.id, details);
                              }}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition-all"
                            >
                              Verify & Accept (Set Dispatch Details)
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-3 border-t border-slate-150 text-xs">
                            <div className="p-2.5 bg-white border border-emerald-150 rounded-sm">
                              <span className="text-[9px] text-emerald-700 font-bold uppercase block">VERIFIED DISPATCH DETAILS</span>
                              <p className="font-semibold text-slate-800 mt-0.5">"{order.dispatchDetails}"</p>
                            </div>
                            <button
                              onClick={() => sendToTransport(order.id)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              Send details to Transport Department
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TRANSPORT_DEPT' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 text-white rounded-sm p-6 border border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight uppercase font-display">Sovereign Transport & Ride Assignment Department</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-3xl">
              This department represents the physical fulfillment layer. It monitors verified dispatch requests routed from ONDC Buyer Apps, identifies registered, high-trust local EV delivery partners, and issues ride manifests.
            </p>
          </div>

          <div className="bg-white rounded-sm border border-slate-200 shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
              Pending Transport Requests & Rider Matching
            </div>
            <div className="p-6">
              {orders.filter(o => o.status === 'TRANSPORT_PENDING' || o.status === 'RIDER_ASSIGNED' || o.status === 'RIDER_ACCEPTED').length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wide">No pending transport requests</p>
                  <p className="text-[11px]">Once Buyer Apps send verified dispatch details, those requests appear here for driver matching.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orders.filter(o => o.status === 'TRANSPORT_PENDING' || o.status === 'RIDER_ASSIGNED' || o.status === 'RIDER_ACCEPTED').map((order) => {
                    const isAssigned = order.status === 'RIDER_ASSIGNED' || order.status === 'RIDER_ACCEPTED';
                    
                    // Filter drivers (role === 'DELIVERY_PARTNER')
                    const availableDrivers = users.filter(u => u.role === 'DELIVERY_PARTNER');

                    return (
                      <div key={order.id} className={`p-5 rounded-sm border ${isAssigned ? 'border-indigo-200 bg-indigo-50/10' : 'border-amber-200 bg-amber-50/10'} space-y-4`}>
                        <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block">ORDER ID</span>
                            <span className="font-mono text-xs font-black text-slate-800">{order.id}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                            isAssigned ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-2">
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm">
                            <span className="text-[9px] text-slate-400 font-bold block">VERIFIED DISPATCH SPECS</span>
                            <p className="font-semibold text-slate-800 mt-0.5">"{order.dispatchDetails}"</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">VENDOR (MANDI SOURCING)</span>
                              <span className="font-bold text-slate-800">{order.merchantName} ({order.merchantLocation})</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">DESTINATION</span>
                              <span className="font-bold text-slate-800">{order.customerName} ({order.customerLocation})</span>
                            </div>
                          </div>
                        </div>

                        {!isAssigned ? (
                          <div className="space-y-3 pt-3 border-t border-slate-150">
                            <div>
                              <label className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                                Select Nearby EV Delivery Driver
                              </label>
                              <select
                                value={selectedRiderIdMap[order.id] || ''}
                                onChange={(e) => setSelectedRiderIdMap({
                                  ...selectedRiderIdMap,
                                  [order.id]: e.target.value
                                })}
                                className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold"
                              >
                                <option value="">-- Choose local driver --</option>
                                {availableDrivers.map((driver) => (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.name} - {driver.vehicleType || 'EV Vehicle'} (Trust Rating: {driver.trustScore || 0}%)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              disabled={!selectedRiderIdMap[order.id]}
                              onClick={() => transportAssignRider(order.id, selectedRiderIdMap[order.id])}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition-all"
                            >
                              Identify and Assign Driver
                            </button>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-slate-150 text-xs text-slate-700 flex items-center justify-between p-2 bg-indigo-50/50 rounded-sm">
                            <div>
                              <span className="text-[9px] text-indigo-800 font-extrabold block">ASSIGNED RIDER</span>
                              <p className="font-bold text-slate-900">{order.driverName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{order.driverPhone}</p>
                            </div>
                            <span className="text-[10.5px] font-bold italic text-indigo-700 animate-pulse">
                              {order.status === 'RIDER_ASSIGNED' ? 'Awaiting rider acceptance...' : 'Rider accepted! En route to vendor.'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
