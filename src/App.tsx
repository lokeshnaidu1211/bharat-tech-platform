/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Onboarding } from './components/Onboarding';
import { DashboardContainer } from './components/DashboardContainer';

function MainAppContent() {
  const { loggedInUser } = useApp();

  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center py-10">
          <Onboarding />
        </main>
        
        {/* Basic Gateway Footer */}
        <footer className="bg-indigo-950 text-indigo-300 py-4 text-center text-xs border-t border-indigo-900">
          <div className="max-w-7xl mx-auto px-4">
            <span className="font-extrabold text-white">🇮🇳 BharatConnect DPI</span> &bull; Privacy-by-Design &bull; Powered by NPCI Splitting Infrastructure
          </div>
        </footer>
      </div>
    );
  }

  return <DashboardContainer />;
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
