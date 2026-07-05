import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  IndianRupee, 
  ArrowUpRight, 
  PieChartIcon, 
  BarChart3, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Zap
} from 'lucide-react';
import { PaymentGatewayUtility } from './PaymentGatewayUtility';

interface InfluencerEarningsChartProps {
  influencerId: string;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export const InfluencerEarningsChart: React.FC<InfluencerEarningsChartProps> = ({ influencerId, timeframe }) => {
  const { orders, users, config, addNotification } = useApp();
  const [chartType, setChartType] = useState<'TREND' | 'CATEGORY' | 'MERCHANT'>('TREND');
  const [showPayoutGateway, setShowPayoutGateway] = useState(false);
  const [selectedPayoutAmount, setSelectedPayoutAmount] = useState(0);

  // Get current influencer details
  const influencerUser = useMemo(() => users.find(u => u.id === influencerId), [users, influencerId]);

  // Aggregate actual referred orders for this influencer
  const referredOrders = useMemo(() => {
    return orders.filter(o => o.influencerId === influencerId);
  }, [orders, influencerId]);

  // Total cleared vs pending
  const deliveredReferred = useMemo(() => referredOrders.filter(o => o.status === 'DELIVERED'), [referredOrders]);
  const pendingReferred = useMemo(() => referredOrders.filter(o => o.status !== 'DELIVERED'), [referredOrders]);

  const totalClearedComm = useMemo(() => {
    return deliveredReferred.reduce((sum, o) => {
      if (o.finalSplits) return sum + o.finalSplits.influencer;
      return sum + (o.product.price * o.quantity * (o.commissionPercent / 100));
    }, 0);
  }, [deliveredReferred]);

  const totalPendingEscrow = useMemo(() => {
    return pendingReferred.reduce((sum, o) => {
      return sum + (o.product.price * o.quantity * (o.commissionPercent / 100));
    }, 0);
  }, [pendingReferred]);

  // Compile daily, weekly, and monthly data for the Trend Chart
  const trendData = useMemo(() => {
    if (timeframe === 'DAILY') {
      // Last 7 Days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day, idx) => {
        // Base mock commission + real attribution for Friday/Saturday
        let realComm = 0;
        if (idx === 4) realComm += totalClearedComm * 0.45; // Friday
        if (idx === 5) realComm += totalPendingEscrow * 0.6; // Saturday
        const mockBase = [240, 180, 320, 410, 290, 520, 390][idx];
        return {
          name: day,
          "Cleared Earnings": parseFloat((mockBase + realComm * 0.7).toFixed(2)),
          "Escrow Locked": parseFloat((mockBase * 0.3 + realComm * 0.3).toFixed(2)),
          amt: mockBase + realComm
        };
      });
    } else if (timeframe === 'MONTHLY') {
      // Last 6 Months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map((month, idx) => {
        let realComm = 0;
        if (idx === 5) { // June / Current month gets real totals
          realComm = totalClearedComm + totalPendingEscrow;
        }
        const mockBase = [3200, 4800, 4100, 5900, 6800, 7200][idx];
        return {
          name: month,
          "Cleared Earnings": parseFloat((mockBase + realComm * 0.8).toFixed(2)),
          "Escrow Locked": parseFloat((mockBase * 0.25 + realComm * 0.2).toFixed(2)),
          amt: mockBase + realComm
        };
      });
    } else {
      // WEEKLY - Default
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((week, idx) => {
        let realComm = 0;
        if (idx === 3) { // Last week gets real totals
          realComm = totalClearedComm + totalPendingEscrow;
        }
        const mockBase = [1200, 1550, 1420, 1980][idx];
        return {
          name: week,
          "Cleared Earnings": parseFloat((mockBase + realComm * 0.75).toFixed(2)),
          "Escrow Locked": parseFloat((mockBase * 0.2 + realComm * 0.25).toFixed(2)),
          amt: mockBase + realComm
        };
      });
    }
  }, [timeframe, totalClearedComm, totalPendingEscrow]);

  // Compile Category wise commission distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {
      'Staples & Millets': 850,
      'Wood-Pressed Oils': 1200,
      'Spices & Herbs': 650,
      'Textiles & Handloom': 450
    };

    // Add actual order category counts
    referredOrders.forEach(o => {
      const cat = o.product.category || 'Staples & Millets';
      const comm = o.finalSplits ? o.finalSplits.influencer : (o.product.price * o.quantity * (o.commissionPercent / 100));
      if (cat.includes('Millet') || cat.includes('Staples')) {
        categories['Staples & Millets'] += comm;
      } else if (cat.includes('Oil')) {
        categories['Wood-Pressed Oils'] += comm;
      } else if (cat.includes('Spice') || cat.includes('Herb')) {
        categories['Spices & Herbs'] += comm;
      } else {
        categories['Textiles & Handloom'] += comm;
      }
    });

    return Object.entries(categories).map(([name, val]) => ({
      name,
      value: parseFloat(val.toFixed(2))
    }));
  }, [referredOrders]);

  // Compile Merchant wise payouts
  const merchantData = useMemo(() => {
    const merchants: Record<string, number> = {
      'Krishna Organics': 1450,
      'Cauvery Handlooms': 920,
      'Sahyadri Spices': 680,
      'Kovai Cold-pressed': 1100
    };

    // Integrate with live orders
    referredOrders.forEach(o => {
      // Find merchant name
      const mName = o.merchantName || 'Krishna Organics';
      const comm = o.finalSplits ? o.finalSplits.influencer : (o.product.price * o.quantity * (o.commissionPercent / 100));
      merchants[mName] = (merchants[mName] || 0) + comm;
    });

    return Object.entries(merchants).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [referredOrders]);

  // Colors for Pie cells
  const COLORS = ['#f97316', '#fbbf24', '#10b981', '#6366f1', '#ec4899'];

  // Handle immediate payout split triggering
  const triggerPayoutSimulator = () => {
    const calculatedPayout = timeframe === 'DAILY' 
      ? parseFloat((totalClearedComm * 0.15 + totalPendingEscrow * 0.3).toFixed(2))
      : timeframe === 'MONTHLY'
      ? parseFloat((totalClearedComm * 3.4 + totalPendingEscrow * 1.8).toFixed(2))
      : parseFloat((totalClearedComm + totalPendingEscrow).toFixed(2));

    setSelectedPayoutAmount(calculatedPayout || 840);
    setShowPayoutGateway(true);
    addNotification('Payout gateway loaded with active commission totals. Input PIN to complete UPI split settlement.');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
      
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest">
              Swadeshi Promoter Commission Analytics
            </h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Automated Recharts-powered ledger visualizing referral attribution loops.
          </p>
        </div>

        {/* Chart View Selector Toggles */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {[
            { id: 'TREND', label: 'Earning Trend', icon: TrendingUp },
            { id: 'CATEGORY', label: 'Category Split', icon: PieChartIcon },
            { id: 'MERCHANT', label: 'Merchant Payouts', icon: BarChart3 }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setChartType(mode.id as any)}
              className={`px-3 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all ${
                chartType === mode.id
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              <mode.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-6 bg-slate-950 text-white min-h-[280px] flex flex-col justify-between relative">
        <div className="absolute top-4 right-4 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
          LIVE ATTESTED DATA
        </div>

        {/* Dynamic Recharts Integration */}
        <div className="w-full h-56 mt-2">
          {chartType === 'TREND' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCleared" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEscrow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="Cleared Earnings" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorCleared)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Escrow Locked" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEscrow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === 'CATEGORY' && (
            <div className="grid grid-cols-1 md:grid-cols-12 h-full items-center">
              <div className="md:col-span-7 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Legends */}
              <div className="md:col-span-5 space-y-2 text-xs">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Category Distribution</span>
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-slate-300 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-100">₹{item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartType === 'MERCHANT' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={merchantData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="value" name="Attributed Commission (₹)" radius={[4, 4, 0, 0]}>
                  {merchantData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Visual efficiency footer */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900 pt-3 mt-1 font-mono">
          <span>Sovereign settlement routing nodes online: BHARAT-FAC-HYD</span>
          <span className="text-emerald-400 font-bold">100% Attributed</span>
        </div>
      </div>

      {/* UPI Settlement Trigger Panel */}
      <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-orange-600 block uppercase tracking-wider">
            NPCI INSTANT SPLIT SETTLEMENT
          </span>
          <h4 className="text-xs font-bold text-slate-900">
            Attributed Earnings ready for direct bank clearing
          </h4>
          <p className="text-[11px] text-slate-500">
            Disburse pending promoter balances directly into your VPA bank node (<strong>{influencerUser?.vpa || 'naveenvlogs@okaxis'}</strong>) in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={triggerPayoutSimulator}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <QrCode className="w-4.5 h-4.5" />
          Trigger Payout Simulator
        </button>
      </div>

      {/* Local Payment Gateway trigger instance */}
      <PaymentGatewayUtility 
        isOpen={showPayoutGateway} 
        onClose={() => setShowPayoutGateway(false)} 
        initialAmount={selectedPayoutAmount}
        initialInfluencerId={influencerId}
      />

    </div>
  );
};
