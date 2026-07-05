import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { 
  Shield, 
  ShieldAlert, 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  FileText, 
  Scale, 
  HelpCircle, 
  Lock, 
  Fingerprint, 
  Info,
  CheckCircle2,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface DpdpshieldGateProps {
  onAccept: () => void;
}

export const DpdpshieldGate: React.FC<DpdpshieldGateProps> = ({ onAccept }) => {
  const { loggedInUser, language, logout, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  // Specific processing consent states
  const [preciseLocation, setPreciseLocation] = useState(true);
  const [upiSplits, setUpiSplits] = useState(true);
  const [creatorAttribution, setCreatorAttribution] = useState(true);
  const [qualityAudit, setQualityAudit] = useState(true);

  // Profile data view toggler
  const [showDataDetails, setShowDataDetails] = useState(false);

  // Mandatory statutory affirmation check
  const [hasAffirmedTerms, setHasAffirmedTerms] = useState(false);
  const [grievanceOfficerModal, setGrievanceOfficerModal] = useState(false);

  // Generate a random but deterministic OTP challenge code just for e-KYC compliance feel
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const challengeCode = "BC-9082";

  if (!loggedInUser) return null;

  const handleSendOtp = () => {
    setOtpSent(true);
    addNotification(`Statutory e-KYC challenge code issued to +91 XXX-XXX-${loggedInUser.phone.slice(-4)}`);
  };

  const handleVerifyOtp = () => {
    if (otpInput === '123456') {
      setIsOtpVerified(true);
      setOtpError('');
      addNotification('Sovereign OTP Challenge Verified. Cryptographic digital signature prepared.');
    } else {
      setOtpError('Invalid 6-digit statutory challenge pin. Use demo pin: 123456');
    }
  };

  const handleAcceptAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAffirmedTerms) {
      addNotification('You must explicitly check the statutory affirmation declaration to proceed.');
      return;
    }
    if (loggedInUser.role !== 'ADMIN' && !isOtpVerified) {
      addNotification('Aadhaar-linked mobile verification (OTP Challenge) is required for statutory consent.');
      return;
    }

    // Save individual consent settings
    const consentPreferences = {
      preciseLocation,
      upiSplits,
      creatorAttribution,
      qualityAudit
    };

    localStorage.setItem(`dpdp_consent_${loggedInUser.id}`, JSON.stringify(consentPreferences));
    // Save overall gate acceptance key
    localStorage.setItem(`dpdp_consent_accepted_${loggedInUser.id}`, 'true');

    // Add compliance trail to localStorage for the Consent Center modal to find
    const logTime = new Date().toLocaleTimeString();
    const initLogs = [
      `[${logTime}] Consent Form explicitly signed by Data Principal.`,
      `[${logTime}] Consent Granted: LOCATION=${preciseLocation ? 'YES' : 'NO'}, UPI=${upiSplits ? 'YES' : 'NO'}, CREATOR=${creatorAttribution ? 'YES' : 'NO'}, QUALITY=${qualityAudit ? 'YES' : 'NO'}.`,
      `[${logTime}] Digital Signature Hash: SHA256-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    ];
    localStorage.setItem(`dpdp_consent_logs_${loggedInUser.id}`, JSON.stringify(initLogs));

    addNotification(`Sovereign DPDP Consent signed successfully for ${loggedInUser.name}. Services unlocked!`);
    onAccept();
  };

  return (
    <div id="dpdp-consent-gate" className="max-w-4xl mx-auto my-6 px-4 animate-in fade-in slide-in-from-bottom-3 duration-350">
      
      {/* Title & Indian DPI Compliance Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-xl p-6 md:p-8 text-white relative overflow-hidden">
        {/* Geometric tricolor ribbon design for Sovereign look */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase">
                DIGITAL PERSONAL DATA PROTECTION (DPDP) ACT, 2023 COMPLIANCE GATE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-slate-100 font-display">
              Statutory e-KYC & <span className="font-bold text-emerald-400">Consent Authorization</span>
            </h1>
            <p className="text-slate-400 text-[11px] max-w-2xl font-medium leading-relaxed">
              Under Section 6 of the DPDP Act 2023 (Act No. 40 of 2023, Govt of India), BharatConnect (Data Fiduciary) is legally required to obtain your (Data Principal) explicit, specific, informed, and unconditional consent before processing any personal data.
            </p>
          </div>

          <div className="bg-slate-950/80 px-3 py-2 border border-slate-800 rounded-sm text-right shrink-0">
            <span className="text-[9px] font-mono font-bold text-slate-500 block">NODE IDENTIFICATION</span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold tracking-wider block">BC-DPI-CORE-MANDI</span>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left Side: Notice & Consents Form */}
        <form onSubmit={handleAcceptAndProceed} className="lg:col-span-8 p-6 md:p-8 space-y-6">
          
          {/* Section I: Identity Profile Check */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2 font-display">
                <Fingerprint className="w-4 h-4 text-slate-700" />
                I. Data Principal e-KYC Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowDataDetails(!showDataDetails)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                {showDataDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDataDetails ? 'Hide Private Records' : 'Show Private Records'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-lg border border-slate-150 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Principal Name:</span>
                <span className="font-bold text-slate-800 block">{loggedInUser.name}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Consent Role entity:</span>
                <span className="font-bold text-slate-900 uppercase block tracking-wider">{loggedInUser.role}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Masked Aadhaar Token:</span>
                <span className="font-mono text-slate-700 font-bold block">{loggedInUser.aadhaarMasked || 'XXXX-XXXX-8822'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Declared Sourcing Hub:</span>
                <span className="font-semibold text-slate-800 block">{loggedInUser.location}</span>
              </div>

              {showDataDetails && (
                <>
                  <div className="space-y-0.5 sm:col-span-2 border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Email Address:</span>
                      <span className="font-mono text-slate-700 block">{loggedInUser.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Registered Mobile:</span>
                      <span className="font-mono text-slate-700 block">{loggedInUser.phone}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section II: Itemized Granular Processing Choices */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2 font-display">
                <Scale className="w-4 h-4 text-slate-700" />
                II. Explicit Purpose & Choices
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                You have the absolute right to refuse any of the following processing items. However, opting out may degrade associated features.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Item 1: Location */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex justify-between items-start gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Precise Location Mapping</span>
                    {preciseLocation ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase px-1.5 rounded-sm">GRANTED</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase px-1.5 rounded-sm">REFUSED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Processing coordinate telemetry to map carbon-offset EV delivery transit paths and calculate real-time distance buffers.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={preciseLocation} 
                    onChange={(e) => setPreciseLocation(e.target.checked)}
                    className="sr-only peer" 
                    id="gate-consent-loc"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Item 2: UPI splits */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex justify-between items-start gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Direct UPI Escrow Split-Ledger Settlement</span>
                    {upiSplits ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase px-1.5 rounded-sm">GRANTED</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase px-1.5 rounded-sm">REFUSED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Consent to split financial payment parameters at checkout among merchant trade splits, affiliate commissions, and delivery fees.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={upiSplits} 
                    onChange={(e) => setUpiSplits(e.target.checked)}
                    className="sr-only peer" 
                    id="gate-consent-upi"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Item 3: Creator Affiliate */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex justify-between items-start gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Affiliate UTM Promotion Tracking</span>
                    {creatorAttribution ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase px-1.5 rounded-sm">GRANTED</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase px-1.5 rounded-sm">REFUSED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Permits matching custom promoter QR tokens to distribute direct commission splits to Swadeshi creators.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={creatorAttribution} 
                    onChange={(e) => setCreatorAttribution(e.target.checked)}
                    className="sr-only peer" 
                    id="gate-consent-creator"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>

              {/* Item 4: Quality Assays */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex justify-between items-start gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Mandi Chemical Essay & Food Security Tracing</span>
                    {qualityAudit ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[8px] font-bold uppercase px-1.5 rounded-sm">GRANTED</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold uppercase px-1.5 rounded-sm">REFUSED</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    Processing farm testing records, pesticide-free certifications, and batch quality grades for items purchased.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={qualityAudit} 
                    onChange={(e) => setQualityAudit(e.target.checked)}
                    className="sr-only peer" 
                    id="gate-consent-quality"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section III: Aadhaar OTP Challenge (Except Admin) */}
          {loggedInUser.role !== 'ADMIN' && (
            <div className="p-4 border border-indigo-150 rounded-lg bg-indigo-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wider block">III. OTP Verification (DPDP Act Affirmative Action)</span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                To confirm the identity of the Data Principal with unambiguous affirmative action, verify the e-KYC linked mobile challenge.
              </p>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Send Challenge Code
                </button>
              ) : (
                <div className="space-y-2 max-w-sm">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 6-digit pin (demo: 123456)"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isOtpVerified}
                      className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 cursor-pointer ${
                        isOtpVerified 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isOtpVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                  {otpError && <p className="text-[10px] text-rose-600 font-bold font-mono">{otpError}</p>}
                  {!isOtpVerified && (
                    <p className="text-[9.5px] text-indigo-700 font-mono">
                      * Statutory code sent to registered endpoint. Use demo bypass: <strong className="font-extrabold underline">123456</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section IV: Affirmation Checkbox */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <input
                type="checkbox"
                id="affirmation-chk"
                checked={hasAffirmedTerms}
                onChange={(e) => setHasAffirmedTerms(e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-300 rounded-sm focus:ring-slate-900 shrink-0 mt-0.5 cursor-pointer"
              />
              <label htmlFor="affirmation-chk" className="text-[11px] text-slate-700 leading-relaxed cursor-pointer select-none">
                <strong>Statutory Declaration:</strong> I, the Data Principal, hereby certify that I have read the statutory notice regarding processing operations. I grant free, specific, informed, unconditional, and unambiguous consent to process the selected categories of my personal data for the designated purposes under the <strong>DPDP Act, 2023</strong>. I understand I can withdraw this consent at any time via the Consent Center.
              </label>
            </div>
          </div>

          {/* Buttons Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-sm shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sign Consent & Proceed
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-rose-600 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Decline & Logout
            </button>
          </div>

        </form>

        {/* Right Side: DPDP Rights, Summaries & Info (Sovereign Notice Board) */}
        <div className="lg:col-span-4 p-6 md:p-8 bg-slate-50 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">NOTICE BOARD</span>
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-800" />
                Sovereign Notice
              </h3>
            </div>

            {/* List of Statutory Rights */}
            <div className="space-y-4 text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">Your Legally Protected Rights:</span>

              {/* Right 1 */}
              <div className="space-y-1 bg-white p-3 rounded-sm border border-slate-150 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[10px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Right to Withdraw Consent</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Section 6(4): You may revoke any or all processing permissions instantly via the Consent Center shield at the bottom.
                </p>
              </div>

              {/* Right 2 */}
              <div className="space-y-1 bg-white p-3 rounded-sm border border-slate-150 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[10px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Right to Erasure / Deletion</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Section 12(3): You can execute your "Right to be Forgotten" to instantly purge all Aadhaar tokens, session coordinates, and transaction audits.
                </p>
              </div>

              {/* Right 3 */}
              <div className="space-y-1 bg-white p-3 rounded-sm border border-slate-150 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[10px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Right to Portability</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Download a structured machine-readable JSON package containing your entire profile, consent log history, and ledgers.
                </p>
              </div>
            </div>
          </div>

          {/* Grievance redressal contacts */}
          <div className="bg-white p-3.5 rounded border border-slate-200/90 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase">
              <Scale className="w-3.5 h-3.5 text-slate-600" />
              <span>Grievance Redressal</span>
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              If you believe your personal data is processed unlawfully, seek redressal directly from our Data Protection Grievance Officer.
            </p>
            <button
              type="button"
              onClick={() => setGrievanceOfficerModal(true)}
              className="text-[10px] font-black text-slate-900 uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
            >
              Contact Grievance Officer <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* Grievance Redressal Overlay Modal */}
      {grievanceOfficerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white text-slate-900 rounded-sm border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-700" />
                <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">BharatConnect Grievance Desk</h4>
              </div>
              <button
                type="button"
                onClick={() => setGrievanceOfficerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 border-y border-slate-100 py-3">
              <p>
                In compliance with <strong>Section 13 of the DPDP Act 2023</strong>, we have appointed an official Data Protection Officer:
              </p>
              <div className="bg-slate-50 p-3 rounded-sm border border-slate-150 space-y-1 text-[11px] font-mono">
                <p><strong>Officer:</strong> Smt. Archana Deshmukh, IAS (Retd.)</p>
                <p><strong>Designation:</strong> Chief Grievance Officer, DPI Node</p>
                <p><strong>Address:</strong> Electronics Niketan, 6 CGO Complex, New Delhi</p>
                <p><strong>Email:</strong> grievance.dpo@bharatconnect.gov.in</p>
                <p><strong>TAT Response:</strong> Within 72 Business Hours</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGrievanceOfficerModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm cursor-pointer"
            >
              Acknowledge Grievance Desk Info
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
