import React, { useState, useEffect, useRef } from 'react';
import { Order, User } from '../types';
import { 
  Navigation, 
  MapPin, 
  Battery, 
  Cpu, 
  Wifi, 
  Gauge, 
  Zap, 
  CloudRain, 
  ShieldAlert, 
  Play, 
  Pause, 
  Activity, 
  Compass, 
  TrendingUp,
  AlertOctagon,
  Clock
} from 'lucide-react';

interface OrderRouteMapperProps {
  order: Order;
  assignedRider: User | null;
}

export const OrderRouteMapper: React.FC<OrderRouteMapperProps> = ({ order, assignedRider }) => {
  // Derive coordinates based on order ID hash to give different orders unique maps
  const getHashValue = (str: string, range: number, offset = 0) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % range) + offset;
  };

  const orderHash = order.id || 'ORD-999';
  
  // Custom unique origin and destination points on our 100x100 grid
  const originX = getHashValue(orderHash + 'origX', 15, 10); // 10 to 25
  const originY = getHashValue(orderHash + 'origY', 15, 75); // 75 to 90
  
  const destX = getHashValue(orderHash + 'destX', 20, 70); // 70 to 90
  const destY = getHashValue(orderHash + 'destY', 20, 15); // 15 to 35

  // S-curve intersection point 1 and 2
  const corner1X = Math.round((originX + destX) / 2);
  const corner1Y = originY;

  const corner2X = corner1X;
  const corner2Y = destY;

  // Key coordinate nodes along the route path
  const pathPoints = [
    { x: originX, y: originY, label: 'Mandi Sourcing Hub' },
    { x: corner1X, y: corner1Y, label: 'Secured Highway Junction' },
    { x: corner2X, y: corner2Y, label: 'Metro Ring Interchange' },
    { x: destX, y: destY, label: 'Customer Residence' }
  ];

  // Simulator tracking states
  const [progress, setProgress] = useState<number>(() => {
    if (order.status === 'DELIVERED') return 100;
    if (order.status === 'IN_TRANSIT') return 40;
    return 0; // BOOKED, ACCEPTED, PACKED is 0% progress
  });

  const [isSimulating, setIsSimulating] = useState(order.status === 'IN_TRANSIT');
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 2x, 5x
  const [activeScenario, setActiveScenario] = useState<'NORMAL' | 'TRAFFIC' | 'STORM'>('NORMAL');
  const [gpsObfuscated, setGpsObfuscated] = useState(false);

  // Dynamic EV state sensors
  const [batteryCharge, setBatteryCharge] = useState(94);
  const [speed, setSpeed] = useState(42);
  const [motorTemp, setMotorTemp] = useState(32.8);
  const [signalStrength, setSignalStrength] = useState<number>(4); // out of 4

  // Simulation timer
  useEffect(() => {
    let intervalId: any;
    
    // Automatically set simulating state based on order status changes
    if (order.status === 'IN_TRANSIT') {
      setIsSimulating(true);
    } else if (order.status === 'DELIVERED') {
      setIsSimulating(false);
      setProgress(100);
    } else {
      setIsSimulating(false);
      setProgress(0);
    }

    if (isSimulating && order.status === 'IN_TRANSIT') {
      intervalId = setInterval(() => {
        setProgress((prev) => {
          let step = 1.5 * speedMultiplier;
          if (activeScenario === 'TRAFFIC') step = 0.4 * speedMultiplier;
          if (activeScenario === 'STORM') step = 0.6 * speedMultiplier;

          const nextProgress = prev + step;

          // Battery drain simulation
          setBatteryCharge((bat) => Math.max(12, Math.round(94 - (nextProgress * 0.25))));
          
          // Speed fluctuation
          setSpeed(() => {
            let baseSpeed = 40;
            if (activeScenario === 'TRAFFIC') baseSpeed = 12;
            if (activeScenario === 'STORM') baseSpeed = 22;
            if (speedMultiplier > 1) baseSpeed *= 1.3;
            return Math.round(baseSpeed + (Math.sin(nextProgress / 5) * 4));
          });

          // Motor Temperature fluctuation
          setMotorTemp((temp) => {
            const extraHeat = activeScenario === 'STORM' ? -2 : 3;
            const targetTemp = 30 + (nextProgress * 0.1) + (speedMultiplier * extraHeat);
            return parseFloat(targetTemp.toFixed(1));
          });

          // Signal strength fluctuation
          setSignalStrength(() => {
            if (activeScenario === 'STORM') return Math.random() > 0.4 ? 2 : 1;
            if (nextProgress > 45 && nextProgress < 55) return 2; // valley dip
            return 4;
          });

          if (nextProgress >= 100) {
            return 100;
          }
          return nextProgress;
        });
      }, 800);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSimulating, speedMultiplier, activeScenario, order.status]);

  // Calculate current point coordinates based on current progress percentage
  const getDriverPos = (pct: number) => {
    if (pct <= 0) return { x: originX, y: originY };
    if (pct >= 100) return { x: destX, y: destY };

    // Segment 1: Origin to Corner 1 (X changes)
    // Segment 2: Corner 1 to Corner 2 (Y changes)
    // Segment 3: Corner 2 to Dest (X changes)
    
    const seg1Length = Math.abs(corner1X - originX);
    const seg2Length = Math.abs(corner2Y - corner1Y);
    const seg3Length = Math.abs(destX - corner2X);
    const totalLength = seg1Length + seg2Length + seg3Length;

    const ratio = pct / 100;
    const currentDistance = ratio * totalLength;

    if (currentDistance <= seg1Length) {
      // Along Segment 1
      const segRatio = currentDistance / seg1Length;
      const x = originX + (corner1X - originX) * segRatio;
      return { x, y: originY };
    } else if (currentDistance <= seg1Length + seg2Length) {
      // Along Segment 2
      const segRatio = (currentDistance - seg1Length) / seg2Length;
      const y = corner1Y + (corner2Y - corner1Y) * segRatio;
      return { x: corner1X, y };
    } else {
      // Along Segment 3
      const segRatio = (currentDistance - seg1Length - seg2Length) / seg3Length;
      const x = corner2X + (destX - corner2X) * segRatio;
      return { x, y: destY };
    }
  };

  const driverPos = getDriverPos(progress);

  // Derived location string values
  const riderName = assignedRider?.name || 'Assigned EV Partner';
  const vehicleName = assignedRider?.vehicleType || 'Hero Vida V1 (TS-09-EV-3004)';
  const riderTrust = assignedRider?.trustScore || 98;

  // Real-time GPS coordinates
  const baseLat = 17.4411 + (originY - driverPos.y) * 0.0012;
  const baseLng = 78.5522 + (driverPos.x - originX) * 0.0012;

  // Calculated estimated minutes remaining
  const distanceTotal = 12.8; // km
  const distRemaining = parseFloat((distanceTotal * (1 - progress / 100)).toFixed(1));
  const calculatedEta = Math.ceil((distRemaining / (speed || 30)) * 60) || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full font-sans text-slate-100">
      
      {/* Header bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">NPCI SOVEREIGN LOGISTICS SUITE</h4>
            <span className="text-xs font-black text-white flex items-center gap-1">
              Live Path Node: <strong className="text-orange-400">{order.id}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
            order.status === 'IN_TRANSIT' 
              ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
              : order.status === 'DELIVERED'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-slate-950 text-slate-400 border border-slate-800'
          }`}>
            {order.status === 'IN_TRANSIT' ? '⚡ LIVE EN ROUTE' : order.status}
          </span>
          <span className="text-[9px] font-bold text-slate-500 font-mono">DPI_LOCK_GRID</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
        
        {/* Left column: SVG Simplified Coordinate Grid */}
        <div className="lg:col-span-8 p-4 bg-slate-950/60 flex flex-col justify-between border-r border-slate-850 relative min-h-[300px]">
          
          {/* Obfuscation shield overlay */}
          {gpsObfuscated && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-10 animate-in fade-in duration-300">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-bounce mb-2" />
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest block">DPDP PRIVACY PROTECTION PROTOCOL ACTIVE</span>
              <p className="text-[10.5px] text-slate-400 max-w-[280px] leading-relaxed mt-2">
                Under DPDP Consent Guideline Rule 4-A, customer coordinates are masked. Precision tracking is obfuscated, replaced by secure network node updates.
              </p>
              <button
                type="button"
                onClick={() => setGpsObfuscated(false)}
                className="mt-4 px-4 py-1.5 bg-slate-850 hover:bg-slate-800 text-white border border-slate-700 rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Disable Obfuscation (Simulate Consent)
              </button>
            </div>
          )}

          {/* Grid coordinates and grid lines */}
          <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-900 overflow-hidden min-h-[220px]">
            
            {/* 10x10 Coordinate Grid Background lines */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none opacity-10">
              {[...Array(100)].map((_, i) => (
                <div key={i} className="border-b border-r border-indigo-400 text-[6px] font-mono text-slate-700 p-0.5 select-none">
                  {i % 10 === 0 && `Y${100 - Math.floor(i/10)*10}`}
                </div>
              ))}
            </div>

            {/* Path Drawing via SVG */}
            <svg className="absolute inset-0 w-full h-full text-indigo-500 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Reference Grid Gridlines for visual flavor */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Dotted overall roadmap */}
              <path
                d={`M ${originX} ${originY} L ${corner1X} ${corner1Y} L ${corner2X} ${corner2Y} L ${destX} ${destY}`}
                fill="none"
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />

              {/* Traveled Glow Path (Dynamic based on progress) */}
              {progress > 0 && (
                <path
                  d={(() => {
                    if (progress <= 0) return `M ${originX} ${originY}`;
                    const curr = getDriverPos(progress);
                    if (progress < 35) {
                      return `M ${originX} ${originY} L ${curr.x} ${curr.y}`;
                    } else if (progress < 70) {
                      return `M ${originX} ${originY} L ${corner1X} ${corner1Y} L ${curr.x} ${curr.y}`;
                    } else {
                      return `M ${originX} ${originY} L ${corner1X} ${corner1Y} L ${corner2X} ${corner2Y} L ${curr.x} ${curr.y}`;
                    }
                  })()}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_4px_#f97316]"
                />
              )}
            </svg>

            {/* Node Points Layer */}
            {/* Origin Store Node */}
            <div 
              className="absolute group cursor-help" 
              style={{ left: `${originX}%`, top: `${originY}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              </div>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded text-orange-400 font-mono font-bold whitespace-nowrap opacity-90">
                ORIGIN: {order.merchantName.slice(0, 10)}..
              </div>
            </div>

            {/* Intermediate Checkpoint 1 */}
            <div 
              className="absolute" 
              style={{ left: `${corner1X}%`, top: `${corner1Y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-2 h-2 rounded-full bg-indigo-900 border border-indigo-700/80"></div>
              <span className="hidden lg:block absolute -top-4 left-1/2 -translate-x-1/2 text-[6.5px] font-mono text-slate-500 uppercase whitespace-nowrap">
                CP-1
              </span>
            </div>

            {/* Intermediate Checkpoint 2 */}
            <div 
              className="absolute" 
              style={{ left: `${corner2X}%`, top: `${corner2Y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-2 h-2 rounded-full bg-indigo-900 border border-indigo-700/80"></div>
              <span className="hidden lg:block absolute -top-4 left-1/2 -translate-x-1/2 text-[6.5px] font-mono text-slate-500 uppercase whitespace-nowrap">
                CP-2
              </span>
            </div>

            {/* Destination Node */}
            <div 
              className="absolute cursor-help" 
              style={{ left: `${destX}%`, top: `${destY}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded text-emerald-400 font-mono font-bold whitespace-nowrap opacity-90">
                DROP: {order.customerName.slice(0, 10)}..
              </div>
            </div>

            {/* Active Moving Rider EV Token */}
            {progress < 100 && progress > 0 && (
              <div 
                className="absolute transition-all duration-700 ease-out z-10" 
                style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_15px_#f97316] border-2 border-white cursor-pointer relative group">
                  <Compass className={`w-4 h-4 text-white ${isSimulating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 p-2 rounded text-[8.5px] font-mono space-y-0.5 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <p className="font-bold text-orange-400 uppercase">EV DRIVER INSTANCE</p>
                    <p className="text-slate-300">ID: {assignedRider?.id || 'EV-RIDER-OK'}</p>
                    <p className="text-slate-300">COORD: {driverPos.x.toFixed(1)}, {driverPos.y.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinate Axis Labels overlay */}
            <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-500 select-none">
              GRID SCALE: 1 UNIT = 120 METERS
            </div>

            {/* Live Progress banner */}
            <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-850 px-2.5 py-1 rounded-sm text-[8.5px] font-mono text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
              <span>RESOLVED PATH PROGRESS: <strong>{progress.toFixed(0)}%</strong></span>
            </div>

            {/* Obfuscate trigger overlay button */}
            <button
              type="button"
              onClick={() => setGpsObfuscated(true)}
              className="absolute top-2 right-2 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[8.5px] text-slate-400 font-bold uppercase rounded-sm cursor-pointer z-10"
            >
              🛡️ Mask GPS
            </button>
          </div>

          {/* Grid control bar */}
          <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                disabled={order.status !== 'IN_TRANSIT'}
                className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                  order.status !== 'IN_TRANSIT'
                    ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-600'
                    : isSimulating
                    ? 'bg-orange-950 text-orange-400 border border-orange-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isSimulating ? 'Pause Stream' : 'Live Stream'}
              </button>

              <div className="flex bg-slate-900 rounded-sm p-0.5 border border-slate-800">
                {[1, 2, 5].map((multiplier) => (
                  <button
                    key={multiplier}
                    type="button"
                    onClick={() => setSpeedMultiplier(multiplier)}
                    disabled={order.status !== 'IN_TRANSIT'}
                    className={`px-2 py-0.5 text-[8.5px] font-mono font-bold rounded-sm cursor-pointer ${
                      speedMultiplier === multiplier 
                        ? 'bg-slate-800 text-white font-black' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {multiplier}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Injectors */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Scenario:</span>
              <div className="flex bg-slate-900 rounded-sm p-0.5 border border-slate-800">
                {[
                  { id: 'NORMAL', label: 'Clear', color: 'text-slate-300' },
                  { id: 'TRAFFIC', label: 'Traffic Jam', color: 'text-amber-400' },
                  { id: 'STORM', label: 'Monsoon Rain', color: 'text-blue-400' }
                ].map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setActiveScenario(sc.id as any);
                    }}
                    disabled={order.status !== 'IN_TRANSIT'}
                    className={`px-2 py-1 text-[8px] font-bold uppercase rounded-sm cursor-pointer transition-all ${
                      activeScenario === sc.id
                        ? 'bg-slate-800 text-white font-black border border-slate-750'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className={sc.color}>{sc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Driver telemetry & physical status logs */}
        <div className="lg:col-span-4 p-4 space-y-4 bg-slate-950 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Driver Identity Card */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-2">
              <span className="text-[8.5px] font-black font-mono text-slate-500 tracking-widest uppercase block">VERIFIED EV DRIVER INSTANCE</span>
              
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-300 font-bold font-mono">
                  {riderName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase text-white leading-tight">{riderName}</h5>
                  <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{vehicleName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                <div>
                  <span>Trust index:</span>
                  <span className="block text-white font-bold">{riderTrust}% Stable</span>
                </div>
                <div className="text-right">
                  <span>GPS Status:</span>
                  <span className={`block font-bold ${signalStrength >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {signalStrength === 4 ? 'EXCELLENT' : signalStrength === 2 ? 'FRINGE' : 'DEGRADED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Telemetry Metrics */}
            <div className="space-y-2">
              <span className="text-[8.5px] font-black font-mono text-slate-500 tracking-widest uppercase block">REAL-TIME SENSOR BUS TELEMETRY</span>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Speed sensor */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-mono">SPEEDOMETER</span>
                    <span className="text-xs font-black font-mono text-white">
                      {order.status === 'IN_TRANSIT' ? `${speed} km/h` : '0 km/h'}
                    </span>
                  </div>
                </div>

                {/* Battery SOC */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-mono">BATTERY (SOC)</span>
                    <span className="text-xs font-black font-mono text-white">
                      {order.status === 'DELIVERED' ? '76%' : order.status === 'IN_TRANSIT' ? `${batteryCharge}%` : '94%'}
                    </span>
                  </div>
                </div>

                {/* Cargo Temperature */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-mono">MOTOR TEMP</span>
                    <span className="text-xs font-black font-mono text-white">
                      {order.status === 'IN_TRANSIT' ? `${motorTemp}°C` : '28.4°C'}
                    </span>
                  </div>
                </div>

                {/* Signal strength */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-mono">SIGNAL GPRS</span>
                    <span className="text-xs font-black font-mono text-white">
                      {signalStrength}/4 Channels
                    </span>
                  </div>
                </div>
              </div>

              {/* Precise coordinates display */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-[10px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">LATITUDE:</span>
                  <span className="text-slate-300">{gpsObfuscated ? 'XX.XXXX° N' : `${baseLat.toFixed(6)}° N`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LONGITUDE:</span>
                  <span className="text-slate-300">{gpsObfuscated ? 'XX.XXXX° E' : `${baseLng.toFixed(6)}° E`}</span>
                </div>
              </div>
            </div>

            {/* Scenario Logs */}
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-black font-mono text-slate-500 tracking-widest uppercase block font-bold">DPI CLEARING LEDGER TELEMETRY LOGS</span>
              <div className="bg-slate-950 p-2 rounded border border-slate-850 font-mono text-[9px] leading-relaxed space-y-1 h-24 overflow-y-auto scrollbar-thin">
                <p className="text-slate-500">[12:04:15] Initialize order route mapped schema</p>
                {order.status === 'BOOKED' && <p className="text-amber-500 font-bold">&gt; Awaiting merchant acceptance confirmation</p>}
                {order.status === 'ACCEPTED' && <p className="text-indigo-400 font-bold">&gt; Accepted. Awaiting packaging dispatch checklist</p>}
                {order.status === 'PACKED' && <p className="text-sky-400 font-bold">&gt; Packed. Mandi Bay clearance complete. Rider pending</p>}
                {progress > 0 && (
                  <>
                    <p className="text-indigo-400">&gt; GPS Lock established on {vehicleName}</p>
                    <p className="text-slate-400">&gt; Hub Handshake checksum match: SHA-256 ok</p>
                  </>
                )}
                {activeScenario === 'TRAFFIC' && <p className="text-amber-500 font-bold">&gt; ALERT: Heavy traffic delay reported at Metro Ring</p>}
                {activeScenario === 'STORM' && <p className="text-blue-400 font-bold">&gt; WARNING: High monsoon precipitation on route grid</p>}
                {progress > 80 && progress < 100 && <p className="text-sky-400">&gt; Entering customer proximity zone. Obfuscation standby</p>}
                {progress === 100 && (
                  <p className="text-emerald-500 font-black">&gt; SUCCESS: Direct inter-bank settlement splits triggered!</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Summary block */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>ESTIMATED TIME:</span>
            </div>
            <div className="text-right">
              {order.status === 'DELIVERED' ? (
                <span className="text-emerald-400 font-extrabold font-sans">SETTLED</span>
              ) : order.status === 'IN_TRANSIT' ? (
                <span className="text-white font-extrabold">{calculatedEta} MINS ({distRemaining} km)</span>
              ) : (
                <span className="text-slate-400">PENDING DISPATCH</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
