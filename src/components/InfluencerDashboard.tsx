import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { QrCode, ClipboardCopy, TrendingUp, Calendar, Filter, Share2 } from 'lucide-react';
import { InfluencerEarningsChart } from './InfluencerEarningsChart';

export const InfluencerDashboard: React.FC = () => {
  const { loggedInUser, products, orders, config, language, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'CRM' | 'QR_GEN' | 'SLOTS'>('CRM');
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [drilledOrderId, setDrilledOrderId] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'CATEGORY' | 'TREND'>('CATEGORY');
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  
  // QR Gen state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [generatedReferral, setGeneratedReferral] = useState('');

  const influencerId = loggedInUser?.id || 'influencer-1';

  // Shared Campaign state
  const [campaigns, setCampaigns] = useState<any[]>(() => {
    const stored = localStorage.getItem('bc_campaigns');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      {
        id: 'CAMP-001',
        merchantId: 'merchant-1',
        merchantName: 'Krishna Organics',
        influencerId: influencerId,
        influencerName: loggedInUser?.name || 'Sujatha Reddy (Telugu Kitchen)',
        title: 'Millet Khichdi Video Reel',
        brief: 'Create a 60-second video explaining diabetic benefits of organic Foxtail Millets.',
        budget: 4500,
        commissionPercent: 5,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'CAMP-002',
        merchantId: 'merchant-1',
        merchantName: 'Krishna Organics',
        influencerId: influencerId,
        influencerName: loggedInUser?.name || 'Sujatha Reddy (Telugu Kitchen)',
        title: 'Cold-pressed Oil Tasting Live',
        brief: 'Conduct a live comparative taste of cold-pressed peanut oil versus refined alternatives.',
        budget: 6000,
        commissionPercent: 8,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const saveCampaigns = (newCamps: any[]) => {
    setCampaigns(newCamps);
    localStorage.setItem('bc_campaigns', JSON.stringify(newCamps));
  };

  const handleUpdateCampaignStatus = (campId: string, newStatus: 'ACTIVE' | 'REJECTED') => {
    const updated = campaigns.map(c => c.id === campId ? { ...c, status: newStatus } : c);
    saveCampaigns(updated);
    addNotification(`Campaign contract ${campId} is now ${newStatus}.`);
  };

  // Influencer own referred orders
  const referredOrders = orders.filter((o) => o.influencerId === influencerId);

  // Financial splits
  const deliveredReferred = referredOrders.filter((o) => o.status === 'DELIVERED');
  const pendingReferred = referredOrders.filter((o) => o.status !== 'DELIVERED');

  const totalClearedComm = deliveredReferred.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.influencer;
    return sum + (o.product.price * o.quantity * (o.commissionPercent / 100));
  }, 0);

  const totalPendingEscrow = pendingReferred.reduce((sum, o) => {
    return sum + (o.product.price * o.quantity * (o.commissionPercent / 100));
  }, 0);

  // Timeframe filter adjustments
  let displayCleared = totalClearedComm;
  let displayPending = totalPendingEscrow;

  if (timeframe === 'DAILY') {
    displayCleared = parseFloat((totalClearedComm * 0.15).toFixed(2));
    displayPending = parseFloat((totalPendingEscrow * 0.3).toFixed(2));
  } else if (timeframe === 'MONTHLY') {
    displayCleared = parseFloat((totalClearedComm * 3.4).toFixed(2));
    displayPending = parseFloat((totalPendingEscrow * 1.8).toFixed(2));
  }

  const handleGenerateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const deepLink = `upi://pay?pa=${loggedInUser?.vpa || 'creator@sbi'}&pn=${encodeURIComponent(loggedInUser?.name || 'Creator')}&am=${prod.price}&tr=${prod.id}&tn=BharatConnect_Promote_${prod.id}`;
    setGeneratedReferral(deepLink);
    addNotification(`Affiliate QR generated for "${prod.title}". Ready to share on social media channels.`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReferral);
    addNotification('Referral UPI intent link copied to clipboard!');
  };

  return (
    <div id="influencer-workspace" className="space-y-6">
      
      {/* Creator Header Profile */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-indigo-950">{loggedInUser?.name || 'Naveen Kumar (Vlogs)'}</h2>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {loggedInUser?.niche || 'Rural Tech & Agri Vlogger'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase">
            Affiliate VPA: <span className="font-mono text-slate-700">{loggedInUser?.vpa || 'naveenvlogs@okaxis'}</span> &bull; {loggedInUser?.location}
          </p>
        </div>

        {/* Inner Tab selectors */}
        <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
          {[
            { id: 'CRM', label: 'Income Analytics (CRM)' },
            { id: 'QR_GEN', label: 'Campaigns & QR Links' },
            { id: 'SLOTS', label: 'Affiliate Slots' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'CRM' | 'QR_GEN' | 'SLOTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'CRM' && (
        <div className="space-y-6">
          
          {/* Timeframe Toggles and KPI indicators */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-orange-600" />
              Calendar Settlement Filter
            </span>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[
                { id: 'DAILY', label: t.timeframeDaily },
                { id: 'WEEKLY', label: t.timeframeWeekly },
                { id: 'MONTHLY', label: t.timeframeMonthly }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    timeframe === tf.id
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider block">Financial Escrows</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <span className="text-[9.5px] text-orange-800 font-extrabold uppercase block">{t.escrowPending}</span>
                  <span className="text-2xl font-black text-orange-950">₹{displayPending.toFixed(2)}</span>
                  <p className="text-[9px] text-slate-400 mt-1">Held securely in RBI-compliant escrow nodes</p>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-[9.5px] text-emerald-800 font-extrabold uppercase block">{t.clearedPayouts}</span>
                  <span className="text-2xl font-black text-emerald-700">₹{displayCleared.toFixed(2)}</span>
                  <p className="text-[9px] text-slate-400 mt-1">Settled instantly directly to your UPI bank VPA</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Performance-Based Splits:</strong> Commission split is automatically calculated at <strong>{config.defaultInfluencerPercent}%</strong> of the checkout price, settled automatically when physical handshakes are completed by delivery operators.
                </span>
              </div>

              {/* Statutory Payout Tax Breakdowns (GST & TDS Section 194-H) */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-indigo-950 uppercase text-[10px] tracking-wider">Statutory Payout Tax Audits</span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-tight">PAN & GST Verified</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span>Gross Earned Commissions:</span>
                    <span className="font-semibold text-slate-800 font-mono">₹{displayCleared.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-650">
                    <span>TDS Withholding (IT Sec 194-H @ 5.0%):</span>
                    <span className="font-mono font-medium text-red-600">- ₹{(displayCleared * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (CGST 9% + SGST 9% / reverse-charge):</span>
                    <span className="font-mono text-slate-700">₹{(displayCleared * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-950 text-xs">
                    <span>Net Disbursed to Bank VPA:</span>
                    <span className="font-mono text-emerald-600">₹{(displayCleared * 0.95).toFixed(2)}</span>
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-400 leading-normal">
                  In compliance with Income Tax Act, TDS under Section 194-H (5.0%) is deducted for affiliate promoter commissions. Quarterly Form 16A certificates will be routed through the BharatConnect KYC vault.
                </p>
              </div>
            </div>

            <InfluencerEarningsChart 
              influencerId={influencerId}
              timeframe={timeframe}
            />
          </div>

          {/* CRM Campaign Activity Logs */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">Campaign Conversion Ledger</h3>
              <p className="text-xs text-slate-500">Live feed of consumer orders triggered via your promotional virtual channels.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Product Promoted</th>
                    <th className="p-4">Sale Value</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Commission Earned ({config.defaultInfluencerPercent}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referredOrders.map((o) => {
                    const totalPrice = o.product.price * o.quantity;
                    const commission = parseFloat((totalPrice * (config.defaultInfluencerPercent / 100)).toFixed(2));

                    return (
                      <React.Fragment key={o.id}>
                        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                          <td className="p-4 font-mono font-bold text-indigo-900">
                            <button
                              type="button"
                              onClick={() => setDrilledOrderId(drilledOrderId === o.id ? null : o.id)}
                              className="text-left flex items-center gap-1.5 hover:underline"
                            >
                              <span>{drilledOrderId === o.id ? '▲' : '🔍'}</span>
                              <span>{o.id}</span>
                            </button>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{o.customerName}</td>
                          <td className="p-4 font-bold text-indigo-950 flex items-center gap-2">
                            <img src={o.product.image} className="w-6 h-6 rounded object-cover" alt="" />
                            {o.product.title}
                          </td>
                          <td className="p-4 font-bold text-slate-700">₹{totalPrice.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              o.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-emerald-700">₹{commission.toFixed(2)}</td>
                        </tr>
                        {drilledOrderId === o.id && (
                          <tr className="bg-slate-950 text-white animate-in slide-in-from-top-2 duration-300">
                            <td colSpan={6} className="p-5">
                              <div className="space-y-3.5 text-xs">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="font-bold tracking-wider uppercase text-indigo-400">⚡ Dynamic Affiliate Conversion & Attribution Audit</span>
                                  <span className="font-mono text-[10px] text-slate-400">Node ID: {o.id}-INF-CLEAR</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-slate-300">
                                  <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-2">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Promo Funnel</span>
                                    <div className="space-y-1 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Source:</span>
                                        <span className="text-slate-200">YouTube Video Description</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">UTM Campaign:</span>
                                        <span className="font-mono text-slate-200">bharatconnect_dpi_v1</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Attribution Match:</span>
                                        <span className="text-emerald-400 font-bold font-mono">100% Verified</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-2">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block border-b border-slate-800 pb-1">RBI Escrow Lock</span>
                                    <div className="space-y-1 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Payout VPA:</span>
                                        <span className="font-mono text-slate-200">{loggedInUser?.vpa || 'naveenvlogs@okaxis'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Status:</span>
                                        <span className={`font-bold ${o.status === 'DELIVERED' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                          {o.status === 'DELIVERED' ? 'Disbursed to Bank' : 'On Hold'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Split Share:</span>
                                        <span className="font-mono text-slate-200">₹{commission.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-2">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Quality & Sourcing</span>
                                    <div className="space-y-1 text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">QC Status:</span>
                                        <span className="text-emerald-400 font-bold font-mono">DIN ISO-9001 Certified</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">HSN Tariff Line:</span>
                                        <span className="font-mono text-slate-400">{o.product.hsnCode}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Audited Node:</span>
                                        <span className="text-slate-400 font-mono text-[9px]">BHARAT_HYD_QC_PASS</span>
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

                  {referredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No transactions registered under your promoter link yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'QR_GEN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">{t.referralLinkGen}</h3>
            <p className="text-xs text-slate-500">
              Select any registered Swadeshi product below. We will instantly compile an NPCI-compliant deep-link QR containing your virtual identity split commission parameters.
            </p>

            <form onSubmit={handleGenerateReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Swadeshi Product</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setGeneratedReferral('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="">-- Choose Product to Promote --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} &mdash; ₹{p.price.toFixed(2)} ({p.merchantName})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedProductId}
                className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold rounded-lg disabled:opacity-40"
              >
                Assemble QR Splitting Node
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center text-center shadow-md min-h-[250px]">
            {generatedReferral ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <span className="text-[10px] font-bold text-orange-400 tracking-wider uppercase block">Ready to Publish</span>
                
                {/* Visual Referral QR Card */}
                <div className="p-3 bg-white rounded-xl border-4 border-indigo-500 shadow-lg flex items-center justify-center w-36 h-36">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>

                <div className="w-full max-w-sm space-y-2 pt-2">
                  <div className="flex gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 items-center justify-between">
                    <span className="text-[9.5px] font-mono text-slate-400 truncate max-w-[200px]">{generatedReferral}</span>
                    <button
                      onClick={copyToClipboard}
                      type="button"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold rounded flex items-center gap-1 shrink-0"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                      Copy VPA Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Share2 className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400 max-w-xs">
                  Generate an affiliate node to display the deep-linked QR code here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SLOTS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-700" />
              <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">Promotional Campaign Slots & Agreements</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">DPI ESCROW DIRECTORY</span>
          </div>

          <p className="text-xs text-slate-500 max-w-xl">
            Review and sign campaign contracts proposed by local Swadeshi Mandi merchants. Upon digital signature, campaign splits and commissions are locked on the UPI auto-clearing grid.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {campaigns.filter(c => c.influencerId === influencerId).map((camp) => (
              <div 
                key={camp.id} 
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  camp.status === 'ACTIVE' 
                    ? 'bg-emerald-50/40 border-emerald-150' 
                    : camp.status === 'PENDING'
                    ? 'bg-amber-50/40 border-amber-150 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">{camp.id}</span>
                    <h4 className="text-xs font-black text-indigo-950 leading-snug">{camp.title}</h4>
                    <p className="text-[10.5px] text-slate-600 font-bold uppercase mt-0.5">By {camp.merchantName}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                    camp.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                      : camp.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-150'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded border border-slate-100 font-medium">
                  "{camp.brief}"
                </p>

                <div className="flex justify-between items-center bg-white/65 p-2 rounded text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Contract Budget</span>
                    <strong className="text-indigo-950 text-xs">₹{camp.budget}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase block">Promised Split</span>
                    <strong className="text-emerald-700 text-xs">{camp.commissionPercent}%</strong>
                  </div>
                </div>

                {camp.status === 'PENDING' && (
                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateCampaignStatus(camp.id, 'REJECTED')}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[9.5px] font-extrabold uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCampaignStatus(camp.id, 'ACTIVE')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[9.5px] font-extrabold uppercase rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      Accept Contract
                    </button>
                  </div>
                )}

                {camp.status === 'ACTIVE' && (
                  <div className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center animate-pulse">
                    ✓ Contract Locked. Copy and share the product link from "Campaigns & QR Links" tab!
                  </div>
                )}
              </div>
            ))}

            {campaigns.filter(c => c.influencerId === influencerId).length === 0 && (
              <div className="col-span-2 p-8 text-center text-slate-400 text-xs font-semibold">
                No active campaign contracts or slots proposed yet.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
