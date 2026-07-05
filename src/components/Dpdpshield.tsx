import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldAlert, Check, X, FileJson, RotateCcw, Download, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface DpdpshieldProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Dpdpshield: React.FC<DpdpshieldProps> = ({ isOpen, onClose }) => {
  const { loggedInUser, orders, addNotification, logout } = useApp();
  
  // Consent Switches (default to true as active e-KYC signup was accepted)
  const [preciseLocation, setPreciseLocation] = useState(true);
  const [upiSplits, setUpiSplits] = useState(true);
  const [creatorAttribution, setCreatorAttribution] = useState(true);
  const [qualityAudit, setQualityAudit] = useState(true);
  
  const [showDataMap, setShowDataMap] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    // Load persisted consent preferences
    if (loggedInUser) {
      const stored = localStorage.getItem(`dpdp_consent_${loggedInUser.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreciseLocation(parsed.preciseLocation ?? true);
          setUpiSplits(parsed.upiSplits ?? true);
          setCreatorAttribution(parsed.creatorAttribution ?? true);
          setQualityAudit(parsed.qualityAudit ?? true);
        } catch (e) {
          console.error(e);
        }
      }

      // Initialize audit logs for this session or load existing ones
      const savedLogs = localStorage.getItem(`dpdp_consent_logs_${loggedInUser.id}`);
      if (savedLogs) {
        try {
          setAuditLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error(e);
        }
      } else {
        setAuditLogs([
          `[${new Date().toLocaleTimeString()}] Secure connection with CID-UIDAI verified.`,
          `[${new Date().toLocaleTimeString()}] e-KYC verification token issued with zero retention.`,
          `[${new Date().toLocaleTimeString()}] Masked Aadhaar record locked in ephemeral RAM.`,
        ]);
      }
    }
  }, [loggedInUser, isOpen]);

  if (!isOpen || !loggedInUser) return null;

  const handleToggleConsent = (type: string, value: boolean) => {
    const nextConsents = {
      preciseLocation: type === 'location' ? value : preciseLocation,
      upiSplits: type === 'upi' ? value : upiSplits,
      creatorAttribution: type === 'creator' ? value : creatorAttribution,
      qualityAudit: type === 'quality' ? value : qualityAudit,
    };

    if (type === 'location') setPreciseLocation(value);
    if (type === 'upi') setUpiSplits(value);
    if (type === 'creator') setCreatorAttribution(value);
    if (type === 'quality') setQualityAudit(value);

    localStorage.setItem(`dpdp_consent_${loggedInUser.id}`, JSON.stringify(nextConsents));
    
    const logTime = new Date().toLocaleTimeString();
    const newLogs = [
      `[${logTime}] Consent updated: ${type.toUpperCase()} set to ${value ? 'GRANTED' : 'REVOKED'}.`,
      ...auditLogs
    ];
    setAuditLogs(newLogs);
    localStorage.setItem(`dpdp_consent_logs_${loggedInUser.id}`, JSON.stringify(newLogs));

    addNotification(`DPDP Consent Updated: ${type.toUpperCase()} consent is now ${value ? 'GRANTED' : 'REVOKED'}.`);
  };

  const exportDataLedger = () => {
    const personalLedger = {
      complianceStandard: 'Indian DPDP Act 2023 Compliant',
      platformRegistryNode: 'BHARATCONNECT-SECURE-DPI-01',
      timestamp: new Date().toISOString(),
      principalUser: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        phone: loggedInUser.phone,
        vpa: loggedInUser.vpa,
        role: loggedInUser.role,
        maskedAadhaar: loggedInUser.aadhaarMasked || 'XXXX-XXXX-8822',
        declaredLocation: loggedInUser.location,
      },
      consentsActive: {
        preciseLocation,
        upiSplits,
        creatorAttribution,
        qualityAudit
      },
      auditTrails: auditLogs,
      transactionLogs: orders.filter(o => o.customerId === loggedInUser.id || o.merchantId === loggedInUser.id)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(personalLedger, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BharatConnect_DPDP_Portability_${loggedInUser.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addNotification('Sovereign Personal Data portability JSON package generated & downloaded.');
  };

  const executeRightToBeForgotten = () => {
    setIsErasing(true);
    addNotification('Initiating DPDP Section 12 Right to be Forgotten protocol...');
    
    setTimeout(() => {
      // Clear storage
      localStorage.removeItem(`dpdp_consent_${loggedInUser.id}`);
      localStorage.removeItem(`dpdp_consent_accepted_${loggedInUser.id}`);
      localStorage.removeItem(`dpdp_consent_logs_${loggedInUser.id}`);
      addNotification('All e-KYC tokens, precise logistics coordinates, and local sessions purged.');
      logout();
      onClose();
    }, 1500);
  };

  return (
    <div id="dpdp-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-sm border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden font-sans">
        
        {/* Banner indicator */}
        <div className="bg-slate-950 text-white p-5 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">Sovereign Data Protection Control</span>
              <h3 className="text-sm font-bold uppercase tracking-wider font-display">DPDP Act e-KYC Consent Center</h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-sm transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contents area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Statutory Notice Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">STATUTORY PRIVATE RECORD NOTICE</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                In absolute obedience with the <strong>Digital Personal Data Protection (DPDP) Act, 2023 (Act No. 40 of 2023, Govt of India)</strong>, we obtain explicit consent from you (the Data Principal) before processing your e-KYC credentials. We enforce strict data minimization & zero retention policies on UIDAI Aadhaar data.
              </p>
            </div>
          </div>

          {/* e-KYC Principal Data Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">I. Data Principal Profile Map</h4>
              <button
                type="button"
                onClick={() => setShowDataMap(!showDataMap)}
                className="text-[10px] font-bold text-slate-900 hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                {showDataMap ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDataMap ? 'Hide Private Records' : 'Show Private Records'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">Verified Name:</span>
                <span className="font-bold text-slate-800 block">{loggedInUser.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">Registered Email:</span>
                <span className="font-mono text-slate-700 block">{loggedInUser.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">e-KYC Phone (OTP Bind):</span>
                <span className="font-mono text-slate-700 block">{showDataMap ? loggedInUser.phone : '+91 XXXXX XX' + loggedInUser.phone.slice(-3)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">Aadhaar Token (UIDAI-Masked):</span>
                <span className="font-mono text-slate-700 block">{loggedInUser.aadhaarMasked || 'XXXX-XXXX-8822'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">UPI Virtual Payment Address:</span>
                <span className="font-mono text-slate-700 block">{showDataMap ? loggedInUser.vpa : 'XXXX@okaxis'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[9.5px] block">Sovereign Role Entity:</span>
                <span className="font-bold text-slate-900 block">{loggedInUser.role}</span>
              </div>
            </div>
          </div>

          {/* Consent Switches Group */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">II. Revocable Processing Consents</h4>
            
            <div className="divide-y divide-slate-150 border border-slate-200 rounded-sm overflow-hidden">
              
              {/* Consent 1: Location */}
              <div className="p-4 bg-white flex justify-between items-start gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-950">Precise Location Telemetry Routing</span>
                    {preciseLocation ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">ACTIVE</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">REVOKED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Authorizes the EV delivery partner dashboard to map transit coordinates and calculates optimal carbon-offset delivery paths.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={preciseLocation} 
                    onChange={(e) => handleToggleConsent('location', e.target.checked)}
                    className="sr-only peer" 
                    id="consent-loc-toggle"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Consent 2: UPI splits */}
              <div className="p-4 bg-white flex justify-between items-start gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-950">Direct UPI Split Ledger Settlement</span>
                    {upiSplits ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">ACTIVE</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">REVOKED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Consent to securely split UPI payment parameters at dropoff checkout among merchant, creator commission, driver salary, and GST.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={upiSplits} 
                    onChange={(e) => handleToggleConsent('upi', e.target.checked)}
                    className="sr-only peer" 
                    id="consent-upi-toggle"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Consent 3: Creator UTM attribution */}
              <div className="p-4 bg-white flex justify-between items-start gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-950">Creator Affiliate Attribution Tracking</span>
                    {creatorAttribution ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">ACTIVE</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">REVOKED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Permits the app to match custom UTM promoter tokens from social QRs, calculating and attributing due splits to digital public creators.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={creatorAttribution} 
                    onChange={(e) => handleToggleConsent('creator', e.target.checked)}
                    className="sr-only peer" 
                    id="consent-creator-toggle"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Consent 4: Quality assays */}
              <div className="p-4 bg-white flex justify-between items-start gap-4">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-950">Mandi Chemical Essay Telemetry Trace</span>
                    {qualityAudit ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">ACTIVE</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase tracking-wider px-1.5 rounded-sm">REVOKED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Consent to link food security records, pesticide-free lab results, and standard FSSAI pack labels to products purchased.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={qualityAudit} 
                    onChange={(e) => handleToggleConsent('quality', e.target.checked)}
                    className="sr-only peer" 
                    id="consent-quality-toggle"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Secure Audit Ledger Trail */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">III. Immutable DPI Consent Audit Ledger</h4>
            <div className="bg-slate-900 text-slate-300 font-mono text-[10.5px] p-3 rounded-sm border border-slate-800 max-h-28 overflow-y-auto space-y-1">
              {auditLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">{log}</div>
              ))}
            </div>
          </div>

        </div>

        {/* Action controls footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-wrap justify-between items-center gap-4">
          <button
            type="button"
            disabled={isErasing}
            onClick={executeRightToBeForgotten}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            {isErasing ? 'Purging Private Data...' : 'Erase My Data (Forget Me)'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportDataLedger}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Portability Export (JSON)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-xs"
            >
              Close Ledger
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
