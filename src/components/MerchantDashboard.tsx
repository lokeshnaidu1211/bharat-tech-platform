import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { Plus, Check, ClipboardCopy, ChevronRight, Award, CircleDollarSign, Sparkles, Camera, Cpu, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { OrderRouteMapper } from './OrderRouteMapper';

export const MerchantDashboard: React.FC = () => {
  const { loggedInUser, products, orders, users, config, language, addProduct, acceptOrder, packOrder, assignRiderAndDispatch, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'CRM' | 'CATALOG' | 'ORDERS' | 'CREATORS'>('CRM');
  const [drilledOrderId, setDrilledOrderId] = useState<string | null>(null);

  // New product states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [price, setPrice] = useState(100);
  const [category, setCategory] = useState('Staples & Millets');
  const [hsnCode, setHsnCode] = useState('1008.21.10');
  const [bisCertified, setBisCertified] = useState(true);
  const [image, setImage] = useState('https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600');

  // Google Vertex AI quality grading state
  const [selectedAiCrop, setSelectedAiCrop] = useState<'millets' | 'turmeric' | 'mustard' | 'khadi'>('millets');
  const [aiGradingStatus, setAiGradingStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE');
  const [aiGradingLogs, setAiGradingLogs] = useState<string[]>([]);
  const [aiGradedLevel, setAiGradedLevel] = useState('');
  const [aiGradedHsn, setAiGradedHsn] = useState('');
  const [aiGradedSpecs, setAiGradedSpecs] = useState('');

  const merchantId = loggedInUser?.id || 'merchant-1';

  // Interactive Creator Campaign state
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
        merchantId: merchantId,
        merchantName: loggedInUser?.storeName || 'Krishna Organics',
        influencerId: 'influencer-1',
        influencerName: 'Sujatha Reddy (Telugu Kitchen)',
        title: 'Millet Khichdi Video Reel',
        brief: 'Create a 60-second video explaining diabetic benefits of organic Foxtail Millets.',
        budget: 4500,
        commissionPercent: 5,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'CAMP-002',
        merchantId: merchantId,
        merchantName: loggedInUser?.storeName || 'Krishna Organics',
        influencerId: 'influencer-2',
        influencerName: 'Tech Agro Vlogs',
        title: 'Cold-pressed Oil Tasting Live',
        brief: 'Conduct a live comparative taste of cold-pressed peanut oil versus refined alternatives.',
        budget: 6000,
        commissionPercent: 8,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState('');
  const [campTitle, setCampTitle] = useState('');
  const [campBrief, setCampBrief] = useState('');
  const [campBudget, setCampBudget] = useState(5000);
  const [campComm, setCampComm] = useState(10);

  const saveCampaigns = (newCamps: any[]) => {
    setCampaigns(newCamps);
    localStorage.setItem('bc_campaigns', JSON.stringify(newCamps));
  };

  // Run real Google Vertex AI quality grading analysis via Full-Stack backend
  const handleRunAiGrading = async () => {
    setAiGradingStatus('PENDING');
    setAiGradingLogs([`[VertexAI-AutoML] Booting Vertex AI AutoML Vision Model: crop_quality_v4_live...`]);
    
    try {
      const res = await fetch('/api/verify-crop-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropType: selectedAiCrop })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Autotune pipeline interrupted.');
      }

      // Stagger showing the logs for visual feedback
      let currentLogs: string[] = [];
      for (let i = 0; i < data.logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        currentLogs.push(data.logs[i]);
        setAiGradingLogs([...currentLogs]);
      }

      setAiGradingStatus('SUCCESS');
      setAiGradedLevel(data.grade);
      setAiGradedHsn(data.hsn);
      setAiGradedSpecs(data.specs);
      addNotification(`Vertex AI Quality Grading Completed! Certified as ${data.grade} under HSN ${data.hsn}.`);
    } catch (err: any) {
      console.error(err);
      setAiGradingLogs(prev => [...prev, `[VertexAI-AutoML] ERROR: ${err.message || 'Model scan failed.'}`]);
      setAiGradingStatus('FAILED');
      addNotification('Vertex AI scan failure: please check dev server console.');
    }
  };

  const handleApplyAiGrading = () => {
    if (selectedAiCrop === 'millets') {
      setTitle('Swadeshi Premium Foxtail Millets (Grade A)');
      setPrice(130);
      setCategory('Staples & Millets');
      setHsnCode('1008.21.10');
      setSpecifications(aiGradedSpecs);
      setDescription('100% organic, unpolished, high-fiber Foxtail Millets sourced directly from dryland farmers in Medchal. Authentically graded as premium Grade A using Google Vertex AI AutoML computer vision for maximum purity and zero-middleman trust routing.');
      setImage('https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600');
    } else if (selectedAiCrop === 'turmeric') {
      setTitle('Premium Salem Turmeric (Grade A - 5.9% Curcumin)');
      setPrice(95);
      setCategory('Traditional Spices');
      setHsnCode('0910.30.20');
      setSpecifications(aiGradedSpecs);
      setDescription('Single-origin organic Salem-grade turmeric traditionally stone-ground to preserve high Curcumin (5.9%) content. Inspected and certified as Grade A using local Vertex AI AutoML vision models.');
      setImage('https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&q=80&w=600');
    } else if (selectedAiCrop === 'mustard') {
      setTitle('Swadeshi Cold-Pressed Yellow Mustard Oil (Grade A)');
      setPrice(350);
      setCategory('Wood-Pressed Oils');
      setHsnCode('1508.90.10');
      setSpecifications(aiGradedSpecs);
      setDescription('Yellow mustard cold wood-pressed oil sourced from single-origin cooperative farming. Graded and verified Grade A by Vertex AI model for high fat density and maximum nutritional retention.');
      setImage('https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600');
    } else if (selectedAiCrop === 'khadi') {
      setTitle('Handwoven Khadi Cotton Saree (Grade A)');
      setPrice(2500);
      setCategory('Handloom Textiles');
      setHsnCode('5208.11.10');
      setSpecifications(aiGradedSpecs);
      setDescription('Beautifully handwoven organic cotton khadi saree using traditional handlooms. Tensile strength and color potency inspected and graded as Swadeshi Premium Grade A by local Vertex AI models.');
      setImage('https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600');
    }
    
    setBisCertified(true);
    addNotification('Applied Vertex AI graded crop specs to Swadeshi catalog registration node.');
  };

  // Merchant own products
  const merchantProducts = products.filter((p) => p.merchantId === merchantId);

  // Merchant own orders
  const merchantOrders = orders.filter((o) => o.merchantId === merchantId);

  // Financial sums
  const deliveredOrders = merchantOrders.filter((o) => o.status === 'DELIVERED');
  
  const totalSales = deliveredOrders.reduce((sum, o) => sum + (o.product.price * o.quantity), 0);
  
  const netProceeds = deliveredOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.merchant;
    const total = o.product.price * o.quantity;
    const splits = (o.platformFeePercent + o.commissionPercent + o.taxPercent) / 100;
    return sum + (total * (1 - splits));
  }, 0);

  const platformFeesPaid = deliveredOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.platform;
    return sum + (o.product.price * o.quantity * (o.platformFeePercent / 100));
  }, 0);

  const taxesPaid = deliveredOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.tax;
    return sum + (o.product.price * o.quantity * (o.taxPercent / 100));
  }, 0);

  const influencerSharesPaid = deliveredOrders.reduce((sum, o) => {
    if (o.finalSplits) return sum + o.finalSplits.influencer;
    return sum + (o.product.price * o.quantity * (o.commissionPercent / 100));
  }, 0);

  // Generate itemized product performance
  const productPerformance = merchantProducts.map((p) => {
    const productSales = deliveredOrders.filter((o) => o.product.id === p.id);
    const units = productSales.reduce((sum, o) => sum + o.quantity, 0);
    const revenue = productSales.reduce((sum, o) => {
      if (o.finalSplits) return sum + o.finalSplits.merchant;
      const total = o.product.price * o.quantity;
      const splits = (o.platformFeePercent + o.commissionPercent + o.taxPercent) / 100;
      return sum + (total * (1 - splits));
    }, 0);

    return {
      product: p,
      units,
      revenue,
    };
  });

  const handlePublishProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !specifications) return;

    // Fallback Unsplash image selector
    let chosenImg = image;
    if (category.includes('Oils')) chosenImg = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600';
    if (category.includes('Spices')) chosenImg = 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&q=80&w=600';
    if (category.includes('Textiles')) chosenImg = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600';

    addProduct({
      title,
      description,
      specifications,
      price,
      category,
      hsnCode,
      bisCertified,
      image: chosenImg,
    });

    setTitle('');
    setDescription('');
    setSpecifications('');
    setPrice(100);
    setShowAddForm(false);
  };

  const handleProposeCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreatorId || !campTitle || !campBrief) {
      addNotification('All campaign proposal fields are mandatory.');
      return;
    }

    const creator = users.find((u) => u.id === selectedCreatorId);
    if (!creator) return;

    const newCampaign = {
      id: `CAMP-${Math.floor(100 + Math.random() * 900)}`,
      merchantId,
      merchantName: loggedInUser?.storeName || 'Krishna Organics',
      influencerId: creator.id,
      influencerName: creator.name,
      title: campTitle,
      brief: campBrief,
      budget: campBudget,
      commissionPercent: campComm,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updated = [newCampaign, ...campaigns];
    saveCampaigns(updated);

    // Reset fields
    setCampTitle('');
    setCampBrief('');
    setCampBudget(5000);
    setCampComm(10);
    setShowBookingForm(false);

    // Add notification
    addNotification(`Campaign proposed to ${creator.name} & logged on the DPI ledger.`);
  };

  return (
    <div id="merchant-workspace" className="space-y-6 font-sans">
      
      {/* Merchant Header Status */}
      <div className="bg-white rounded-sm p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-950 font-display">{loggedInUser?.storeName || 'Krishna Organics'}</h2>
            <span className="bg-slate-100 text-slate-800 text-[9px] font-bold uppercase tracking-wider border border-slate-200 px-2 py-0.5 rounded-sm font-mono">
              Trust Score: {loggedInUser?.trustScore || 95}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            GSTIN: <span className="font-mono text-slate-600">{loggedInUser?.gstin || '36AAAAA1111A1Z1'}</span> &bull; {loggedInUser?.location}
          </p>
        </div>

        {/* Dashboard inner tabs */}
        <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-sm">
          {[
            { id: 'CRM', label: t.financialCrmAnalytics },
            { id: 'CATALOG', label: 'Catalog & Inventory' },
            { id: 'ORDERS', label: 'Incoming Orders' },
            { id: 'CREATORS', label: 'Book Creators' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'CRM' | 'CATALOG' | 'ORDERS' | 'CREATORS')}
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

      {activeTab === 'CRM' && (
        <div className="space-y-6">
          
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Total Sales</span>
              <span className="text-lg font-bold text-slate-900 block font-mono mt-1">₹{totalSales.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Settled handshakes</span>
            </div>

            <div className="bg-slate-900 rounded-sm p-4 border border-slate-850 shadow-xs text-white">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Net Proceeds</span>
              <span className="text-lg font-bold text-white block font-mono mt-1">₹{netProceeds.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">To merchant VPA</span>
            </div>

            <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">DPI Platform Fee</span>
              <span className="text-lg font-bold text-slate-900 block font-mono mt-1">₹{platformFeesPaid.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Capped {config.platformFeePercent}%</span>
            </div>

            <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Govt. Tax Paid</span>
              <span className="text-lg font-bold text-slate-900 block font-mono mt-1">₹{taxesPaid.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">GST / TDS split</span>
            </div>

            <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Creator Splits</span>
              <span className="text-lg font-bold text-slate-900 block font-mono mt-1">₹{influencerSharesPaid.toFixed(2)}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Paid to creators</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Custom glowing SVG sales trend area chart */}
            <div className="lg:col-span-8 bg-slate-950 text-white rounded-sm p-5 border border-slate-900 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[9px] text-slate-400 tracking-widest font-bold uppercase block">UPI Billing Engine Telemetry</span>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mt-1">Direct-to-VPA Transaction Settlement Wave</h3>
                </div>
                <span className="text-[9px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-sm">
                  LIVE TRACK
                </span>
              </div>

              {/* Glowing SVG Wave area graph */}
              <div className="relative w-full h-48 bg-slate-950 rounded-sm overflow-hidden border border-slate-900 flex items-end">
                <svg className="w-full h-full absolute inset-0 text-slate-700" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#64748b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill area */}
                  <path 
                    d="M 0 80 Q 20 40, 40 70 T 80 30 T 100 20 L 100 100 L 0 100 Z" 
                    fill="url(#waveGrad)"
                  />
                  
                  {/* Stroke wave */}
                  <path 
                    d="M 0 80 Q 20 40, 40 70 T 80 30 T 100 20" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    className="text-slate-400"
                  />
                </svg>

                {/* Simulated vertical grid line indicators */}
                <div className="absolute inset-0 flex justify-between px-6 pointer-events-none">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="w-px h-full bg-slate-900/40"></div>
                  ))}
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[8px] uppercase tracking-widest font-mono text-slate-500 z-10">
                  <span>Mandi dispatch</span>
                  <span>EV Dispatch</span>
                  <span>Rider routing</span>
                  <span>Handshake confirmation</span>
                  <span>Settled (100%)</span>
                </div>
              </div>
            </div>

            {/* Quick stats and GST Ledger panel */}
            <div className="lg:col-span-4 bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2 mb-2">
                  <h3 className="text-[10px] font-extrabold uppercase text-slate-900 tracking-widest">Statutory GST & Withholding Ledger</h3>
                  <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 border border-emerald-200 rounded-sm font-mono">ACTIVE INVOICING</span>
                </div>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross Sales Value (Delivered):</span>
                    <span className="font-mono text-slate-900 font-bold">₹{totalSales.toFixed(2)}</span>
                  </div>
                  
                  {/* Itemized split */}
                  <div className="bg-slate-50 p-2.5 border border-slate-150 rounded space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Central GST (CGST @ 2.5%):</span>
                      <span className="font-mono text-slate-800">₹{(taxesPaid / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>State GST (SGST @ 2.5%):</span>
                      <span className="font-mono text-slate-800">₹{(taxesPaid / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-200/50 pt-1 mt-1 font-bold">
                      <span>Total GST Treasury Split:</span>
                      <span className="font-mono text-slate-900">₹{taxesPaid.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-orange-50/40 p-2.5 border border-orange-100 rounded space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>E-com TCS (GST Sec 52 @ 1%):</span>
                      <span className="font-mono text-slate-800">₹{(totalSales * 0.01).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>E-com TDS (IT Sec 194-O @ 1%):</span>
                      <span className="font-mono text-slate-800">₹{(totalSales * 0.01).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-1 border-t border-slate-150 text-[10.5px]">
                    <span>Net Disbursed Proceeds:</span>
                    <span className="font-mono text-emerald-600 font-bold">₹{netProceeds.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200 text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700 block mb-0.5">Tax compliance verified:</span>
                  GSTIN is registered with central CGST/SGST nodes. Dynamic TDS/TCS filings are posted in quarterly GST GSTR-1 & GSTR-8 returns.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">DPI Disruption Margin</span>
                <p className="text-[10px] text-slate-650 font-medium">Save up to 18% compared to corporate monopolies.</p>
              </div>
            </div>
          </div>

          {/* Itemized product performance CRM table */}
          <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{t.itemizedRevenue}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated specifically based on delivered physical handshake transactions.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-widest border-b border-slate-200">
                    <th className="p-4">Registered Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">HSN Code</th>
                    <th className="p-4 text-center">{t.unitsSold}</th>
                    <th className="p-4 text-right">Net Proceeds Retained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productPerformance.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <img src={item.product.image} className="w-7 h-7 rounded-sm object-cover" alt="" />
                        {item.product.title}
                      </td>
                      <td className="p-4 font-bold text-slate-500">{item.product.category}</td>
                      <td className="p-4 font-bold text-slate-700 font-mono">₹{item.product.price.toFixed(2)}</td>
                      <td className="p-4 font-mono text-slate-400">{item.product.hsnCode}</td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold">
                          {item.units}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-950 text-xs font-mono">₹{item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}

                  {productPerformance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No custom products registered inside your catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{t.inventoryManagement}</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.registerNewProduct}
            </button>
          </div>

          {/* Product publishing Form */}
          {showAddForm && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-sm space-y-6 shadow-xs">
              
              {/* VERTEX AI QUALITY GRADING SECTION */}
              <div className="p-5 bg-white border border-slate-250 rounded-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    Google Vertex AI AutoML Crop Quality Grading Engine
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-400 font-bold uppercase">Active DPI-APIGEE Node</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal font-sans">
                  Farmers & producers can photograph harvested crops. Vertex AI AutoML computer vision will instantly perform visual spectrum, moisture, and potentiometer potency audits to certify quality and auto-map appropriate HSN codes.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                  
                  {/* Select crop & camera */}
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Crop For Analysis</label>
                      <select
                        value={selectedAiCrop}
                        onChange={(e) => {
                          setSelectedAiCrop(e.target.value as any);
                          setAiGradingStatus('IDLE');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="millets">🌾 Foxtail Millets (Korralu)</option>
                        <option value="turmeric">🌱 Salem Turmeric Cooperative</option>
                        <option value="mustard">🌻 Yellow Mustard Seeds</option>
                        <option value="khadi">🧵 Organic Khadi Cotton Yarn</option>
                      </select>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 rounded-sm aspect-video overflow-hidden relative flex flex-col justify-between p-3">
                      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{
                        backgroundImage: `url(${
                          selectedAiCrop === 'millets' ? 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' :
                          selectedAiCrop === 'turmeric' ? 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&q=80&w=400' :
                          selectedAiCrop === 'mustard' ? 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' :
                          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400'
                        })`
                      }}></div>

                      {/* Video scanner line */}
                      {aiGradingStatus === 'PENDING' && (
                        <div className="absolute inset-x-0 h-0.5 bg-cyan-400 animate-bounce shadow-[0_0_10px_#22d3ee] z-10"></div>
                      )}

                      <div className="relative z-10 flex justify-between items-start">
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded uppercase">
                          Camera feed active
                        </span>
                        <Camera className="w-4 h-4 text-slate-300" />
                      </div>

                      <div className="relative z-10 text-center flex flex-col items-center">
                        <button
                          type="button"
                          disabled={aiGradingStatus === 'PENDING'}
                          onClick={handleRunAiGrading}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[9.5px] font-extrabold uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {aiGradingStatus === 'PENDING' ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Scanning Crop...
                            </>
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5 text-slate-800" />
                              Capture & Audit
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logs & certificate results */}
                  <div className="md:col-span-7 bg-slate-950 text-slate-200 p-4 border border-slate-900 rounded-sm font-mono space-y-3 text-xs flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Analysis Stream Logs</span>
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        aiGradingStatus === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {aiGradingStatus === 'SUCCESS' ? 'Complete' : 'Pending Scan'}
                      </span>
                    </div>

                    <div className="flex-1 bg-black/30 p-2.5 rounded-sm text-[9.5px] text-slate-300 space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                      {aiGradingLogs.length === 0 ? (
                        <p className="text-slate-600 italic">Ready for crop analysis. Click "Capture & Audit" to begin scanning.</p>
                      ) : (
                        aiGradingLogs.map((log, idx) => (
                          <p key={idx} className="leading-relaxed animate-in fade-in slide-in-from-left-1 duration-150">
                            {log.includes('Result:') ? (
                              <span className="text-emerald-400 font-bold">{log}</span>
                            ) : (
                              <span>{log}</span>
                            )}
                          </p>
                        ))
                      )}
                    </div>

                    {aiGradingStatus === 'SUCCESS' && (
                      <div className="pt-2 border-t border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-in fade-in duration-300 font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8.5px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-sm">
                              {aiGradedLevel}
                            </span>
                            <span className="text-[8.5px] font-bold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 px-2 py-0.5 rounded-sm font-mono">
                              HSN: {aiGradedHsn}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-400 block font-mono">{aiGradedSpecs}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyAiGrading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9.5px] uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Apply AI Specs
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Main Form Fields */}
              <form onSubmit={handlePublishProduct} className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-950 uppercase tracking-widest block mb-1">
                  Establish Swadeshi Catalog Node Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prodTitle} *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Cold-Pressed Mustard Oil"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prodPrice} *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={10000}
                      value={price}
                      onChange={(e) => setPrice(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono focus:ring-1 focus:ring-slate-950"
                    />
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prodCategory} *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="Staples & Millets">Staples & Millets</option>
                    <option value="Wood-Pressed Oils">Wood-Pressed Oils</option>
                    <option value="Traditional Spices">Traditional Spices</option>
                    <option value="Handloom Textiles">Handloom Textiles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">HSN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 1508.90.10"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono focus:ring-1 focus:ring-slate-950"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="bisCertified"
                    checked={bisCertified}
                    onChange={(e) => setBisCertified(e.target.checked)}
                    className="w-3.5 h-3.5 text-slate-900 border-slate-300 rounded-sm focus:ring-slate-950 focus:ring-1"
                  />
                  <label htmlFor="bisCertified" className="ml-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Apply FSSAI/BIS Badge
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prodDesc} *</label>
                <textarea
                  required
                  placeholder="Tell customers about the local heritage of this product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-slate-950 min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prodSpecs} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weight: 1 Kg | Packed in paper pouches | Moisture: <10%"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-all"
                >
                  {t.prodRegisterBtn}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* List catalog items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchantProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-sm border border-slate-200 p-4 flex gap-4 shadow-xs items-center">
                <img src={p.image} className="w-14 h-14 rounded-sm object-cover bg-slate-50 shrink-0 border border-slate-100" alt="" />
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                    <span className="text-xs font-bold text-slate-900 font-mono">₹{p.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-1">{p.description}</p>
                  <div className="flex gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="font-mono">HSN: {p.hsnCode}</span>
                    <span>&bull;</span>
                    <span>{p.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{t.merchantOrders}</h3>

          <div className="space-y-3.5">
            {merchantOrders.map((order) => {
              const totalPrice = order.product.price * order.quantity;
              
              // Filter active pending riders to display
              const riders = users.filter((u) => u.role === 'DELIVERY_PARTNER');
              const defaultRider = riders[Math.floor(Math.random() * riders.length)] || null;

              return (
                <div key={order.id} className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm font-mono">
                          {order.id}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-sm uppercase tracking-wider ${
                          order.status === 'DELIVERED' 
                            ? 'bg-slate-100 text-slate-800 border-slate-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        <span>Customer: <strong className="text-slate-900 font-bold">{order.customerName}</strong></span>
                        <span className="mx-2 font-normal text-slate-200">|</span>
                        <span>Delivery Coordinate: <strong className="text-slate-900 font-mono">{order.customerLocation}</strong></span>
                        {order.vendorCode && (
                          <>
                            <span className="mx-2 font-normal text-slate-200">|</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Rider Handshake Code: <strong className="text-indigo-900 font-mono text-[11px] font-extrabold">{order.vendorCode}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Billing Value</span>
                      <span className="text-sm font-bold text-slate-950 font-mono">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-3 items-center">
                      <img src={order.product.image} className="w-8 h-8 rounded-sm object-cover border border-slate-100" alt="" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block leading-tight">{order.product.title}</span>
                        <span className="text-slate-400 block mt-0.5">Quantity requested: {order.quantity} units</span>
                      </div>
                    </div>

                    {/* Sequential control actions for order pipeline */}
                    <div className="flex gap-2">
                      {order.status === 'BOOKED' && (
                        <button
                          onClick={() => acceptOrder(order.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-xs transition-all"
                        >
                          {t.confirmPaymentAndAccept}
                        </button>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => packOrder(order.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-xs transition-all"
                        >
                          {t.markPackedAndDispatch}
                        </button>
                      )}

                      {order.status === 'PACKED' && defaultRider && (
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Assigned Rider: <strong className="text-slate-800 font-bold">{defaultRider.name}</strong></span>
                          <button
                            onClick={() => {
                              assignRiderAndDispatch(order.id, defaultRider.id);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all"
                          >
                            Dispatch Now
                          </button>
                        </div>
                      )}

                      {order.status === 'IN_TRANSIT' && (
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-sm">
                          Rider out for delivery
                        </span>
                      )}

                      {order.status === 'DELIVERED' && (
                        <span className="text-[10px] text-slate-850 font-bold uppercase tracking-widest flex items-center gap-1 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-sm">
                          <Check className="w-3.5 h-3.5 text-slate-900" />
                          Handshake settled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDrilledOrderId(drilledOrderId === order.id ? null : order.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all animate-none"
                    >
                      {drilledOrderId === order.id ? 'Hide Merchant Audit ▲' : '🔍 Drill Down: BharatConnect DPI Sourcing Audit & Split Ledger ▼'}
                    </button>
                  </div>

                  {/* Merchant Drill Down Interactive Panel */}
                  {drilledOrderId === order.id && (
                    <div className="p-5 bg-slate-950 text-white rounded-sm border border-slate-800 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Merchant Clearing & Sourcing Audit</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Escrow ID: {order.id}-MCH-OK</span>
                      </div>

                      {/* Real-time EV Route Mapper on simplified coordinate grid */}
                      <div className="w-full">
                        <OrderRouteMapper 
                          order={order} 
                          assignedRider={(() => {
                            const riders = users.filter((u) => u.role === 'DELIVERY_PARTNER');
                            let hash = 0;
                            for (let i = 0; i < order.id.length; i++) {
                              hash = order.id.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            const riderIndex = Math.abs(hash % (riders.length || 1));
                            return riders[riderIndex] || null;
                          })()} 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Column 1: Financial Settlement Split Ledger */}
                        <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1.5">💵 VPA Split Clearance</span>
                          <div className="space-y-1.5 text-[11px] text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Gross Sale:</span>
                              <span className="font-mono text-slate-200">₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">DPI Platform Fee:</span>
                              <span className="font-mono text-slate-400">₹{(totalPrice * (order.platformFeePercent/100)).toFixed(2)} ({order.platformFeePercent}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Withholding Tax:</span>
                              <span className="font-mono text-slate-400">₹{(totalPrice * (order.taxPercent/100)).toFixed(2)} ({order.taxPercent}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Creator Comm.:</span>
                              <span className="font-mono text-slate-400">₹{(totalPrice * (order.commissionPercent/100)).toFixed(2)} ({order.commissionPercent}%)</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-100">
                              <span className="text-slate-500 font-bold">Your Net VPA:</span>
                              <span className="font-bold text-emerald-400 font-mono">
                                ₹{order.finalSplits ? order.finalSplits.merchant.toFixed(2) : (totalPrice - (totalPrice * (order.platformFeePercent + order.commissionPercent + order.taxPercent)/100)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Logistics Handshake Status */}
                        <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block border-b border-slate-800 pb-1.5">🚴 Logistics & EV Sourcing Coordinates</span>
                          <div className="space-y-1.5 text-[11px] text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dispatch Location:</span>
                              <span className="text-slate-200 font-medium truncate max-w-[140px]">{loggedInUser?.location || 'Ghatkesar Hub'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Fulfillment Status:</span>
                              <span className="font-bold text-sky-400 uppercase">{order.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">EV Scooter Rider:</span>
                              <span className="font-medium text-slate-200">EV Express Unit</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dispatch Handshake:</span>
                              <span className="font-mono text-[10.5px] text-sky-300">verified_checksum</span>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Quality Compliance Tracking */}
                        <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block border-b border-slate-800 pb-1.5">🎓 Quality Assurance Audit</span>
                          <div className="space-y-1.5 text-[11px] text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">BIS Certification:</span>
                              <span className="text-emerald-400 font-bold font-mono">Compliant</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">HSN Tariff Line:</span>
                              <span className="font-mono text-slate-400">{order.product.hsnCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Consumer Trust Index:</span>
                              <span className="text-amber-400 font-bold font-mono">{loggedInUser?.trustScore || 95}% Stable</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Quality Certificate:</span>
                              <span className="text-purple-300 font-semibold font-mono text-[9.5px]">ISO-9001-BHARAT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}

            {merchantOrders.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                {t.noOrders}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'CREATORS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header block */}
          <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-900 shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              DPI Creator Booking & Campaign Escrow Hub
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Incorporate local Swadeshi content creators directly into your sales splits. Secure pre-authorized budgets in the DPI escrow node to drive customer conversions via verified attribution deep-links.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Swadeshi Creators Directory & Book Action */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Registered Rural Swadeshi Creators</h4>
                  <span className="text-[9.5px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-indigo-100 font-mono">
                    DPI Verified
                  </span>
                </div>

                <div className="divide-y divide-slate-150">
                  {users.filter(u => u.role === 'INFLUENCER').map((creator) => {
                    const activeContracts = campaigns.filter(c => c.influencerId === creator.id && c.status === 'ACTIVE').length;
                    
                    return (
                      <div key={creator.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 uppercase">{creator.name}</span>
                            <span className="bg-orange-50 text-orange-700 text-[8.5px] font-black border border-orange-100 px-1.5 py-0.5 rounded uppercase">
                              {creator.niche || 'Rural Tech & Agri Vlogger'}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 space-y-0.5">
                            <p>VPA: <span className="font-mono text-indigo-600 font-semibold">{creator.vpa}</span></p>
                            <p>Location: <span className="font-semibold text-slate-600">{creator.location}</span></p>
                          </div>
                          <div className="flex gap-4 pt-1.5 text-[9px] font-mono font-bold text-slate-400 uppercase">
                            <span>Trust Score: <strong className="text-slate-700">{creator.trustScore}%</strong></span>
                            <span>Active Campaigns: <strong className="text-indigo-600">{activeContracts}</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreatorId(creator.id);
                            setShowBookingForm(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer"
                        >
                          Book Creator
                        </button>
                      </div>
                    );
                  })}
                  {users.filter(u => u.role === 'INFLUENCER').length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No rural content creators registered on the node currently.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Contract Ledger & Booking Form */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Proposal Form */}
              {showBookingForm && (() => {
                const creator = users.find(u => u.id === selectedCreatorId);
                return (
                  <div className="bg-slate-950 text-white rounded-xl border border-slate-900 p-5 shadow-lg space-y-4 animate-in slide-in-from-right duration-200">
                    <div className="border-b border-slate-900 pb-2.5 flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider">Propose Swadeshi Campaign</h4>
                      <button 
                        onClick={() => setShowBookingForm(false)}
                        className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {creator && (
                      <div className="bg-slate-900/50 p-2.5 rounded border border-slate-850 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Creator:</span>
                          <span className="font-extrabold text-white uppercase">{creator.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target VPA:</span>
                          <span className="font-mono text-indigo-400">{creator.vpa}</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleProposeCampaign} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Campaign Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Traditional Handloom Saree Reel"
                          value={campTitle}
                          onChange={(e) => setCampTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Content Brief / Product Scope</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Explain key selling points, organic credentials, or mill source details..."
                          value={campBrief}
                          onChange={(e) => setCampBrief(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Campaign Budget (₹)</label>
                          <input
                            type="number"
                            required
                            min={1000}
                            value={campBudget}
                            onChange={(e) => setCampBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Commission Split (%)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={30}
                            value={campComm}
                            onChange={(e) => setCampComm(Math.min(30, Math.max(1, parseInt(e.target.value) || 0)))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CircleDollarSign className="w-4 h-4" />
                        Lock Campaign Contract
                      </button>
                    </form>
                  </div>
                );
              })()}

              {/* Campaigns List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-150 bg-slate-50">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">LOCKED CAMPAIGN CONTRACTS LEDGER</h4>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {campaigns.filter(c => c.merchantId === merchantId).map((camp) => (
                    <div key={camp.id} className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{camp.id}</span>
                          <h5 className="font-bold text-xs text-slate-950 leading-snug">{camp.title}</h5>
                        </div>
                        <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : camp.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-rose-50 text-rose-700 border-rose-10 border-rose-100'
                        }`}>
                          {camp.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed bg-slate-50 p-2 rounded border border-slate-150">
                        "{camp.brief}"
                      </p>

                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>Creator: <strong className="text-slate-700 font-sans">{camp.influencerName}</strong></span>
                        <div className="text-right">
                          <p>Budget: <strong className="text-indigo-700">₹{camp.budget}</strong></p>
                          <p>Comm: <strong className="text-emerald-700">{camp.commissionPercent}%</strong></p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {campaigns.filter(c => c.merchantId === merchantId).length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No locked campaigns on the blockchain node. Select a creator to begin!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
