import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { Language } from '../types';

// Role dashboards
import { ConsumerDashboard } from './ConsumerDashboard';
import { MerchantDashboard } from './MerchantDashboard';
import { InfluencerDashboard } from './InfluencerDashboard';
import { DeliveryDashboard } from './DeliveryDashboard';
import { ExecutiveConsole } from './ExecutiveConsole';

import { Languages, LogOut, Bell, Award, Shield, Check, FileText, CreditCard, FolderLock, Percent } from 'lucide-react';
import { Dpdpshield } from './Dpdpshield';
import { DpdpshieldGate } from './DpdpshieldGate';
import { PaymentGatewayUtility } from './PaymentGatewayUtility';
import { SecureVerificationVault } from './SecureVerificationVault';
import { GstCalculationUtility } from './GstCalculationUtility';

export const DashboardContainer: React.FC = () => {
  const { loggedInUser, language, notifications, setLanguage, logout, clearNotifications, login } = useApp();
  const t = TRANSLATIONS[language];

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showDpdpshield, setShowDpdpshield] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showVerificationVault, setShowVerificationVault] = useState(false);
  const [showGstUtility, setShowGstUtility] = useState(false);
  const [isConsentAccepted, setIsConsentAccepted] = useState(false);

  useEffect(() => {
    if (loggedInUser) {
      const accepted = localStorage.getItem(`dpdp_consent_accepted_${loggedInUser.id}`) === 'true';
      setIsConsentAccepted(accepted);
    }
  }, [loggedInUser]);

  const languagesList: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'te', label: 'Telugu (తెలుగు)' },
    { code: 'ta', label: 'Tamil (தமிழ்)' }
  ];

  if (!loggedInUser) return null;

  const renderActiveDashboard = () => {
    switch (loggedInUser.role) {
      case 'ADMIN':
        return <ExecutiveConsole />;
      case 'MERCHANT':
        return <MerchantDashboard />;
      case 'INFLUENCER':
        return <InfluencerDashboard />;
      case 'DELIVERY_PARTNER':
        return <DeliveryDashboard />;
      case 'CUSTOMER':
        return <ConsumerDashboard />;
      default:
        return <ConsumerDashboard />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'BharatConnect CEO';
      case 'MERCHANT':
        return 'DPI Partner Merchant';
      case 'INFLUENCER':
        return 'DPI Affiliate Creator';
      case 'DELIVERY_PARTNER':
        return 'EV Delivery Partner';
      case 'CUSTOMER':
        return 'Retail Customer';
      default:
        return 'Customer';
    }
  };

  const currentRoleColor = () => {
    switch (loggedInUser.role) {
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MERCHANT': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'INFLUENCER': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DELIVERY_PARTNER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div id="dashboard-layout" className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      
      {/* Header Panel - Geometric Balance Edition */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Sovereign Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 border border-slate-900 rounded-sm flex items-center justify-center text-xs font-black text-white font-mono">
              BC
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight block leading-none font-display">
                {t.brandName}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-1">
                {t.tagline}
              </span>
            </div>
          </div>

          {/* Utility Actions */}
          <div className="flex items-center gap-3.5">
            
            {/* Active User Information */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right flex flex-col items-end">
                <span className="font-bold text-xs text-slate-900 block leading-tight">{loggedInUser.name}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {loggedInUser.aadhaarMasked && (
                    <span className="text-[7.5px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-sm px-1 py-0.2 animate-pulse flex items-center gap-0.5 uppercase tracking-wider">
                      <Check className="w-2 h-2" /> e-KYC Certified
                    </span>
                  )}
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm inline-block ${currentRoleColor()}`}>
                    {getRoleLabel(loggedInUser.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* DPDP Consent Center Shield Button */}
            <button
              onClick={() => setShowDpdpshield(true)}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-sm transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consent Center</span>
            </button>

            {/* GST Tax Compliance Audit Button */}
            <button
              onClick={() => setShowGstUtility(true)}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-750 hover:bg-blue-100 rounded-sm transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>GST Audit</span>
            </button>

            {/* Compliance Documents Cabinet / KYC Vault Button */}
            <button
              onClick={() => setShowVerificationVault(true)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-950 text-slate-100 hover:bg-slate-800 rounded-sm transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <FolderLock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compliance Vault</span>
            </button>

            {/* Simulated Payment Gateway Trigger Button */}
            <button
              onClick={() => setShowPaymentGateway(true)}
              className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-750 hover:bg-orange-100 rounded-sm transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-orange-600" />
              <span>Payment Gateway</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowNotifMenu(false);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs"
              >
                <Languages className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {languagesList.find((l) => l.code === language)?.label}
                </span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-sm shadow-sm py-1 z-50">
                  {languagesList.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        language === lang.code
                          ? 'bg-slate-100 text-slate-900 font-extrabold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification logs tray */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowLangMenu(false);
                }}
                className="p-2 bg-white border border-slate-200 rounded-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-600 rounded-full ring-1 ring-white"></span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-sm shadow-md z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pipeline Handshakes</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[9px] font-bold text-slate-900 hover:underline uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 text-[11px] hover:bg-slate-50 transition-colors">
                        <p className="text-slate-600 font-medium leading-relaxed">{n.text}</p>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-1">{n.time}</span>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-[11px] text-slate-400 font-mono">
                        No telemetry handshake updates.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout trigger */}
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-600 rounded-sm transition-all shadow-2xs flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
              title={t.logoutBtn}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logoutBtn}</span>
            </button>

          </div>
        </div>
      </header>

      {/* Sandbox Role Switcher Strip - Premium Minimal Design */}
      <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
              Sandbox Role Previewer Node:
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {[
              { label: 'Retail Customer', email: 'lokesh.naidu@gmail.com', role: 'CUSTOMER', color: 'border-blue-500/30 text-blue-300' },
              { label: 'DPI Merchant', email: 'sai.krishna@bharatconnect.in', role: 'MERCHANT', color: 'border-orange-500/30 text-orange-300' },
              { label: 'Affiliate Creator', email: 'naveen.vlogs@bharatconnect.in', role: 'INFLUENCER', color: 'border-indigo-500/30 text-indigo-300' },
              { label: 'EV Delivery Rider', email: 'harish.delivery@bharatconnect.in', role: 'DELIVERY_PARTNER', color: 'border-emerald-500/30 text-emerald-300' },
              { label: 'BharatConnect CEO', email: 'admin@bharatconnect.in', role: 'ADMIN', color: 'border-purple-500/30 text-purple-300' },
            ].map((node) => {
              const isActive = loggedInUser.role === node.role;
              return (
                <button
                  key={node.role}
                  onClick={() => login(node.email)}
                  className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm border transition-all ${
                    isActive
                      ? 'bg-white border-white text-slate-950 font-black shadow-xs scale-102'
                      : `bg-slate-950 hover:bg-slate-800 ${node.color}`
                  }`}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full bg-transparent">
        {isConsentAccepted ? (
          renderActiveDashboard()
        ) : (
          <DpdpshieldGate onAccept={() => setIsConsentAccepted(true)} />
        )}
      </main>

      {/* Sovereign DPDP Compliant Footer - Geometric Balance */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="font-extrabold text-sm text-white tracking-widest block font-display uppercase">🇮🇳 {t.brandName}</span>
            <p className="text-[10.5px] text-slate-500 font-medium max-w-md leading-relaxed">
              BharatConnect Digital Public Infrastructure (DPI) trade & logistics aggregator supporting decentralized B2B/B2C direct trade pipelines, secure escrow clearing, and sustainable logistics.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 text-[9px] font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-sm">
              <Award className="w-3 h-3 text-orange-400" />
              {t.makeInIndia}
            </span>
            <button
              onClick={() => setShowDpdpshield(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-sm cursor-pointer transition-colors"
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              {t.dpdpCompliant}
            </button>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-sm">
              <FileText className="w-3 h-3 text-blue-400" />
              {t.zeroRetention}
            </span>
          </div>
        </div>
      </footer>

      {/* DPDP Shield Consent Center Modal */}
      <Dpdpshield isOpen={showDpdpshield} onClose={() => setShowDpdpshield(false)} />

      {/* Secure KYC Documents Verification Vault Modal */}
      <SecureVerificationVault isOpen={showVerificationVault} onClose={() => setShowVerificationVault(false)} />

      {/* UPI Payment Gateway Utility Modal */}
      <PaymentGatewayUtility isOpen={showPaymentGateway} onClose={() => setShowPaymentGateway(false)} />

      {/* GST & Direct Tax Compliance Center Modal */}
      {showGstUtility && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <GstCalculationUtility onClose={() => setShowGstUtility(false)} />
        </div>
      )}

    </div>
  );
};
