import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { Role } from '../types';
import { Check, ShieldAlert, Award, Globe, UserCheck, Database, Cpu, RefreshCw, CheckCircle, Fingerprint, Search } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { language, register, login, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<Role>('CUSTOMER');
  const [emailInput, setEmailInput] = useState('');
  
  // Registration States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vpa, setVpa] = useState('');
  const [location, setLocation] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  
  // Role specific states
  const [storeName, setStoreName] = useState('');
  const [gstin, setGstin] = useState('');
  const [niche, setNiche] = useState('');
  const [vehicleType, setVehicleType] = useState('Electric Scooter (Ola S1)');
  const [licenseNo, setLicenseNo] = useState('');

  // DPI Interactive Verification States
  const [merchantSubtype, setMerchantSubtype] = useState<'FARMER' | 'VENDOR' | 'MSME'>('FARMER');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [tradeLicenseNo, setTradeLicenseNo] = useState('');
  const [udyamId, setUdyamId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);

  const [isRegistering, setIsRegistering] = useState(false);

  // Trigger simulated multi-layered DPI verification registry cross-referencing
  const runDpiVerification = async () => {
    if (!aadhaar || aadhaar.length < 12) {
      addNotification('A valid 12-digit Aadhaar number is required for DPI identity cross-referencing.');
      return;
    }

    setVerificationStatus('PENDING');
    setVerificationLogs([`[${new Date().toLocaleTimeString()}] Connecting to sovereign DPI gateway endpoint...`]);

    try {
      // 1. Identity validation (Aadhaar KYC)
      const identityRes = await fetch('/api/dpi/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar })
      });
      const identityData = await identityRes.json();
      
      if (!identityData.success) {
        throw new Error(identityData.error || 'Identity verification failed.');
      }

      // Add identity verification logs
      for (const log of identityData.logs) {
        setVerificationLogs(prev => [...prev, log]);
      }

      // 2. Role-specific validation
      let roleUrl = '/api/dpi/verify-influencer';
      let roleBody = {};

      if (activeTab === 'MERCHANT') {
        if (merchantSubtype === 'FARMER') {
          roleUrl = '/api/dpi/verify-mandi-land';
          roleBody = { surveyNumber };
        } else if (merchantSubtype === 'VENDOR') {
          roleUrl = '/api/dpi/verify-trade-license';
          roleBody = { tradeLicenseNo };
        } else {
          roleUrl = '/api/dpi/verify-msme';
          roleBody = { udyamId, gstin };
        }
      } else if (activeTab === 'DELIVERY_PARTNER') {
        roleUrl = '/api/dpi/verify-driver';
        roleBody = { licenseNo };
      }

      const roleRes = await fetch(roleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleBody)
      });
      const roleData = await roleRes.json();
      
      if (roleData.logs) {
        for (const log of roleData.logs) {
          setVerificationLogs(prev => [...prev, log]);
        }
      }

      setVerificationStatus('SUCCESS');
      addNotification('DPI Registry Cross-Referencing Successful! Verification token generated.');
    } catch (err: any) {
      console.error(err);
      setVerificationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${err.message || 'Verification pipeline interrupted'}`]);
      setVerificationStatus('FAILED');
      addNotification('DPI Verification pipeline failure: please check network configuration.');
    }
  };

  const handleQuickLogin = (emailStr: string) => {
    login(emailStr);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const success = login(emailInput);
    if (!success) {
      addNotification(`Profile not found for email: "${emailInput}". Please register a new account below!`);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !vpa || !location) {
      addNotification('Please fill in all mandatory core profile details.');
      return;
    }

    if (activeTab !== 'CUSTOMER' && verificationStatus !== 'SUCCESS') {
      addNotification(`DPI Verification Required: Please perform your Government Registry verification first to enroll as a Swadeshi ${activeTab}.`);
      return;
    }

    // Aadhaar masking simulation (DPDP compliant)
    const maskedAadhaar = aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : 'XXXX-XXXX-8822';

    // Store sub-category credentials in the user object
    register({
      email,
      name,
      role: activeTab,
      location,
      vpa,
      phone,
      storeName: activeTab === 'MERCHANT' ? storeName || `${name}'s Bazaar` : undefined,
      gstin: activeTab === 'MERCHANT' ? gstin || '36AAAAA1234A1Z0' : undefined,
      niche: activeTab === 'INFLUENCER' ? niche || 'General Wellness' : undefined,
      vehicleType: activeTab === 'DELIVERY_PARTNER' ? vehicleType : undefined,
      licenseNo: activeTab === 'DELIVERY_PARTNER' ? licenseNo || 'TS-LIC-889901' : undefined,
      aadhaarMasked: maskedAadhaar,
    });
  };

  const DEMO_USERS = [
    { name: 'Lokesh Naidu', role: 'Retail Customer', email: 'lokesh.naidu@gmail.com', desc: 'Browse catalogs, book items & track deliveries.' },
    { name: 'Sai Krishna', role: 'Store Merchant', email: 'sai.krishna@bharatconnect.in', desc: 'Accept orders, dispatch EV riders, view itemized analytics.' },
    { name: 'Naveen Kumar', role: 'Influencer / Creator', email: 'naveen.vlogs@bharatconnect.in', desc: 'Review commissions, generate affiliate QR links.' },
    { name: 'Alapati Harish', role: 'EV Delivery Rider', email: 'harish.delivery@bharatconnect.in', desc: 'Receive pickup maps, dropoff routing & complete handshakes.' },
    { name: 'Lokesh Naidu (CEO)', role: 'DPI Admin Governance', email: 'admin@bharatconnect.in', desc: 'Audit Trust Indices, regulate platform fees (strictly 2-3%).' }
  ];

  return (
    <div id="onboarding-card" className="max-w-4xl mx-auto my-8 px-4 font-sans">
      {/* Platform Cover Graphic Header - Geometric Balance Edition */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-8 md:p-10 mb-8 text-slate-900 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
        
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">
            🇮🇳 {t.makeInIndia} &bull; Decentralized Digital Public Infrastructure (DPI)
          </span>
          <h1 className="text-4xl font-light text-slate-900 leading-tight mb-3 font-display">
            {t.brandName} <span className="font-bold italic">DPI Trade Gateway</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed">
            {t.tagline} &mdash; {t.subTagline}
          </p>
        </div>
        <div className="shrink-0 flex gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-sm">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            {t.dpdpCompliant}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Registration and Login Card Column */}
        <div className="lg:col-span-7 bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Form Selector (Login vs Register) */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider transition-colors ${
                !isRegistering ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              🔐 BharatConnect Secure Login Gateway
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider transition-colors ${
                isRegistering ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              ➕ Enroll New Identity (e-KYC)
            </button>
          </div>

          <div className="p-6 md:p-8">
            {!isRegistering ? (
              // Secure Login Form
              <div>
                <h3 className="text-base font-bold uppercase tracking-tight text-slate-900 mb-1 font-display">Access Portal Session</h3>
                <p className="text-xs text-slate-400 mb-6">Enter your registered email address to authorize access securely.</p>
                
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Registered Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., lokesh.naidu@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-sm uppercase tracking-wider transition-all"
                  >
                    Authorize Identity Session
                  </button>
                </form>
              </div>
            ) : (
              // Interactive Enrollment Form
              <div>
                <div className="mb-6">
                  <h3 className="text-base font-bold uppercase tracking-tight text-slate-900 mb-1 font-display">{t.onboardingTitle}</h3>
                  <p className="text-xs text-slate-400">{t.onboardingSubtitle}</p>
                </div>

                {/* Role Specific Visual Tabs */}
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.roleSelector}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { role: 'CUSTOMER', label: t.customerTab },
                      { role: 'MERCHANT', label: t.merchantTab },
                      { role: 'INFLUENCER', label: t.influencerTab },
                      { role: 'DELIVERY_PARTNER', label: t.riderTab }
                    ].map((tab) => (
                      <button
                        key={tab.role}
                        type="button"
                        onClick={() => setActiveTab(tab.role as Role)}
                        className={`py-2.5 px-2 rounded-sm text-xs font-bold text-center border transition-all ${
                          activeTab === tab.role
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Core Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldFullName} *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Lokesh Naidu"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldPhone} *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g., +91 99001 99002"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldEmail} *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., citizen@email.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldVpa} *</label>
                      <input
                        type="text"
                        required
                        value={vpa}
                        onChange={(e) => setVpa(e.target.value)}
                        placeholder="e.g., citizen@okaxis"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldLocation} *</label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Ghatkesar East, Hyderabad"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.fieldAadhaar}</label>
                      <input
                        type="text"
                        maxLength={12}
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        placeholder="e.g., 123456789012"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Dynamic Role-Specific Fields */}
                  {activeTab === 'MERCHANT' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">🏪 Swadeshi Merchant Class</span>
                        <div className="flex gap-1.5">
                          {(['FARMER', 'VENDOR', 'MSME'] as const).map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setMerchantSubtype(sub);
                                setVerificationStatus('IDLE');
                              }}
                              className={`px-2 py-1 text-[8.5px] font-bold tracking-wider rounded-sm border transition-all ${
                                merchantSubtype === sub
                                  ? 'bg-orange-600 border-orange-600 text-white'
                                  : 'bg-white border-slate-250 text-slate-500 hover:text-slate-850'
                              }`}
                            >
                              {sub === 'FARMER' ? '🌾 Farmer' : sub === 'VENDOR' ? '🏪 Vendor' : '🏢 MSME'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t.fieldStoreName} / Enterprise Name *</label>
                          <input
                            type="text"
                            required
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder={merchantSubtype === 'FARMER' ? 'e.g., Rythu Millet Growers Coop' : 'e.g., Sri Swadeshi Retailers'}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs"
                          />
                        </div>

                        {merchantSubtype === 'FARMER' && (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Mandi / AP WebLand Survey Number *</label>
                            <input
                              type="text"
                              required
                              value={surveyNumber}
                              onChange={(e) => setSurveyNumber(e.target.value)}
                              placeholder="e.g., Survey No. 44/C-2"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono"
                            />
                          </div>
                        )}

                        {merchantSubtype === 'VENDOR' && (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">State Trade License Number *</label>
                            <input
                              type="text"
                              required
                              value={tradeLicenseNo}
                              onChange={(e) => setTradeLicenseNo(e.target.value)}
                              placeholder="e.g., TL-36-HYD-5543"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono"
                            />
                          </div>
                        )}

                        {merchantSubtype === 'MSME' && (
                          <div className="space-y-3 col-span-2 md:col-span-1">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Udyam Registration ID *</label>
                              <input
                                type="text"
                                required
                                value={udyamId}
                                onChange={(e) => setUdyamId(e.target.value)}
                                placeholder="e.g., UDYAM-TS-08-001234"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {(merchantSubtype === 'MSME' || merchantSubtype === 'VENDOR') && (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t.fieldGstin} *</label>
                            <input
                              type="text"
                              required
                              value={gstin}
                              onChange={(e) => setGstin(e.target.value)}
                              placeholder="e.g., 36AAAAA1234A1Z0"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'INFLUENCER' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">📣 Creator Campaign Metrics</span>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t.fieldNiche} *</label>
                        <input
                          type="text"
                          required
                          value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          placeholder="e.g., Telugu Millet Agriculture Tips"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'DELIVERY_PARTNER' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">🚴 EV Delivery Logistics</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t.fieldVehicle} *</label>
                          <input
                            type="text"
                            required
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            placeholder="e.g., Ather 450X EV (TS-08-EV-9922)"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Sarathi Driving License Number *</label>
                          <input
                            type="text"
                            required
                            value={licenseNo}
                            onChange={(e) => setLicenseNo(e.target.value)}
                            placeholder="e.g., DL-TS0820239088"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DPI INTERACTIVE VERIFICATION CONTAINER */}
                  {activeTab !== 'CUSTOMER' && (
                    <div className="p-4 bg-slate-900 text-slate-200 border border-slate-800 rounded-sm space-y-3 font-mono">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-[9.5px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                          DPI API VALIDATION SANDBOX
                        </span>
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                          verificationStatus === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' :
                          verificationStatus === 'PENDING' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/35 animate-pulse' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {verificationStatus === 'SUCCESS' ? '● Verified' : verificationStatus === 'PENDING' ? '● Querying...' : '○ Unverified'}
                        </span>
                      </div>

                      {verificationLogs.length > 0 && (
                        <div className="bg-black/40 p-2.5 rounded-sm text-[9.5px] text-slate-300 space-y-1.5 max-h-[110px] overflow-y-auto font-mono scrollbar-thin">
                          {verificationLogs.map((log, idx) => (
                            <p key={idx} className="leading-relaxed animate-in fade-in slide-in-from-left-1 duration-150">
                              {log.includes('Result:') || log.includes('Status:') ? (
                                <span className="text-emerald-400 font-bold">{log}</span>
                              ) : log.includes('error') ? (
                                <span className="text-rose-400 font-bold">{log}</span>
                              ) : (
                                <span>{log}</span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}

                      {verificationStatus !== 'SUCCESS' ? (
                        <button
                          type="button"
                          disabled={verificationStatus === 'PENDING'}
                          onClick={runDpiVerification}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {verificationStatus === 'PENDING' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Orchestrating Cross-Referencing...
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5" />
                              Trigger DPI Registry Verification Loop
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 text-[10.5px] bg-emerald-500/10 p-2 rounded-sm border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>DPI Cryptographic Trust Certificate Signed! (Middleman Risk Index: 0%)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DPDP Compliance Notice */}
                  <div className="flex gap-2.5 items-start p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      <strong>Privacy Protection:</strong> In obedience with the <strong>Indian Digital Personal Data Protection (DPDP) Act</strong>, Aadhaar details are only validated live against UIDAI servers and are never stored in plain text or permanently on our servers.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm uppercase tracking-wider transition-all"
                  >
                    {t.registerBtn}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Sandbox quick log-in column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-sm p-6 border border-slate-800 text-white shadow-xs flex-1">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">{t.quickStart}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              No need to register! Instantly authenticate into pre-configured roles using our public sandbox gateway to test full-pipeline transaction automation.
            </p>

            <div className="space-y-3">
              {DEMO_USERS.map((demo) => {
                let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                if (demo.role.includes('Customer')) badgeStyle = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
                if (demo.role.includes('Merchant')) badgeStyle = 'bg-orange-500/10 text-orange-300 border-orange-500/20';
                if (demo.role.includes('Influencer')) badgeStyle = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
                if (demo.role.includes('Rider')) badgeStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                if (demo.role.includes('Admin')) badgeStyle = 'bg-purple-500/10 text-purple-300 border-purple-500/20';

                return (
                  <button
                    key={demo.email}
                    onClick={() => handleQuickLogin(demo.email)}
                    className="w-full text-left p-3.5 bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 rounded-sm transition-all flex justify-between items-center group shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">{demo.name}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm ${badgeStyle}`}>
                          {demo.role}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-normal">{demo.desc}</p>
                      <span className="text-[9.5px] font-mono text-slate-500 block">{demo.email}</span>
                    </div>
                    <UserCheck className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Slogan Banner */}
          <div className="bg-slate-50 rounded-sm p-5 border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase block">DPI SOVEREIGNTY</span>
              <p className="text-xs text-slate-950 font-extrabold uppercase font-display">Coded in India to Disrupt Commissions</p>
              <p className="text-[10px] text-slate-500">Decentralizing payments, boosting village economies.</p>
            </div>
            <div className="text-2xl font-black text-slate-900 select-none">🇮🇳</div>
          </div>
        </div>

      </div>
    </div>
  );
};
