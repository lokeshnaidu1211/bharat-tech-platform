import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Order, SystemConfig, Language, OrderStatus, AuditLogEntry } from '../types';
import { DEFAULT_CONFIG, generateDynamicDataset, SEED_USERS } from '../data/mockData';

interface AppContextProps {
  loggedInUser: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  config: SystemConfig;
  language: Language;
  notifications: { id: string; text: string; time: string }[];
  auditLogs: AuditLogEntry[];
  setLanguage: (lang: Language) => void;
  login: (email: string) => boolean;
  register: (userData: Omit<User, 'id' | 'trustScore'>) => void;
  logout: () => void;
  addProduct: (productData: Omit<Product, 'id' | 'merchantId' | 'merchantName'>) => void;
  placeOrder: (
    productId: string,
    quantity: number,
    deliveryAddress: string,
    paymentMode: 'PREPAID' | 'COD',
    influencerId?: string,
    notes?: string
  ) => void;
  acceptOrder: (orderId: string) => void;
  packOrder: (orderId: string) => void;
  assignRiderAndDispatch: (orderId: string, riderId: string) => void;
  confirmHandshake: (orderId: string) => void;
  buyerAcceptOrder: (orderId: string, dispatchDetails: string) => void;
  sendToTransport: (orderId: string) => void;
  transportAssignRider: (orderId: string, riderId: string) => void;
  riderAcceptOrder: (orderId: string) => void;
  riderEnterVendorCode: (orderId: string, code: string) => boolean;
  deliveryPersonArrive: (orderId: string) => void;
  riderCompleteDeliveryWithOtp: (orderId: string, otp: string) => boolean;
  updateConfig: (newConfig: SystemConfig) => string | null; // returns error message or null if successful
  addNotification: (text: string) => void;
  clearNotifications: () => void;
  addAuditLog: (
    action: AuditLogEntry['action'],
    details: string,
    severity: AuditLogEntry['severity'],
    status: AuditLogEntry['status'],
    metadata?: Record<string, any>
  ) => void;
  approveUserRegistration: (userId: string) => void;
  overrideOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  toggleComplianceFlag: (userId: string, flagDetails: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const seedDefaultAuditLogs = (): AuditLogEntry[] => {
  const logs: AuditLogEntry[] = [];
  const baseTime = new Date();
  
  const t1 = new Date(baseTime);
  t1.setDate(baseTime.getDate() - 5);
  const log1: AuditLogEntry = {
    id: 'AUDIT-001',
    timestamp: t1.toISOString(),
    action: 'REGULATION_ADJUSTMENT',
    actorName: 'Lokesh Naidu (CEO, BharatConnect)',
    actorEmail: 'admin@bharatconnect.in',
    details: 'Calibrated platform convenience fee to 2.5% to comply with national DPI routing rules. Split ratios recalculated.',
    severity: 'INFO',
    status: 'SUCCESS',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: 'BC-HASH-8B7C2A9E-F402-4A3B-B051-DDE6A39D9E11'
  };
  logs.push(log1);

  const t2 = new Date(baseTime);
  t2.setDate(baseTime.getDate() - 4);
  const log2: AuditLogEntry = {
    id: 'AUDIT-002',
    timestamp: t2.toISOString(),
    action: 'REGISTRATION_APPROVAL',
    actorName: 'Lokesh Naidu (CEO, BharatConnect)',
    actorEmail: 'admin@bharatconnect.in',
    details: 'Approved Swadeshi Merchant enrollment for "Krishna Organic Millets & Grains" after physical Mandi audit and FSSAI link validation.',
    severity: 'INFO',
    status: 'SUCCESS',
    prevHash: log1.hash,
    hash: 'BC-HASH-72E5D1AA-91CC-47FA-B992-FA19A82D1B2D'
  };
  logs.push(log2);

  const t3 = new Date(baseTime);
  t3.setDate(baseTime.getDate() - 2);
  const log3: AuditLogEntry = {
    id: 'AUDIT-003',
    timestamp: t3.toISOString(),
    action: 'COMPLIANCE_FLAG_TOGGLE',
    actorName: 'Lokesh Naidu (CEO, BharatConnect)',
    actorEmail: 'admin@bharatconnect.in',
    details: 'Activated zero-retention audit flags for rider Alapati Harish. Masked Aadhaar coordinates verified with UIDAI live-gate.',
    severity: 'WARNING',
    status: 'SUCCESS',
    prevHash: log2.hash,
    hash: 'BC-HASH-3F221E90-C1B0-40FF-8802-12BCFDF88931'
  };
  logs.push(log3);

  const t4 = new Date(baseTime);
  t4.setDate(baseTime.getDate() - 1);
  const log4: AuditLogEntry = {
    id: 'AUDIT-004',
    timestamp: t4.toISOString(),
    action: 'TRANSACTION_OVERRIDE',
    actorName: 'Lokesh Naidu (CEO, BharatConnect)',
    actorEmail: 'admin@bharatconnect.in',
    details: 'Admin verified shipping coordinates override for BC-ORD-HIST-1002. Escrow released to merchant VPA saikrishna@ybl.',
    severity: 'CRITICAL',
    status: 'SUCCESS',
    prevHash: log3.hash,
    hash: 'BC-HASH-992FDC12-320D-4911-BFE2-CDDE1288AE92'
  };
  logs.push(log4);

  return logs;
};

const deduplicateUsers = (userList: User[]): User[] => {
  const seen = new Set<string>();
  return userList.filter((u) => {
    if (!u || !u.id) return false;
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersState, setUsersState] = useState<User[]>([]);

  const setUsers = (val: User[] | ((prev: User[]) => User[])) => {
    setUsersState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      return deduplicateUsers(next);
    });
  };

  const users = usersState;
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [language, setLanguageState] = useState<Language>('en');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string }[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Load or seed initial state from backend with fallback to localStorage
  useEffect(() => {
    const initializeState = async () => {
      let currentUsers: User[] = [];
      let currentProducts: Product[] = [];
      let currentOrders: Order[] = [];
      let currentConfig: SystemConfig = DEFAULT_CONFIG;
      let currentAuditLogs: AuditLogEntry[] = [];

      try {
        const response = await fetch('/api/db/state');
        const resData = await response.json();
        
        if (resData.success && resData.exists) {
          const { users: sUsers, products: sProducts, orders: sOrders, config: sConfig, auditLogs: sLogs } = resData.data;
          currentUsers = sUsers || [];
          currentProducts = sProducts || [];
          currentOrders = sOrders || [];
          currentConfig = sConfig || DEFAULT_CONFIG;
          currentAuditLogs = sLogs || [];
          
          setUsers(currentUsers);
          setProducts(currentProducts);
          setOrders(currentOrders);
          setConfig(currentConfig);
          setAuditLogs(currentAuditLogs);

          localStorage.setItem('bc_users', JSON.stringify(currentUsers));
          localStorage.setItem('bc_products', JSON.stringify(currentProducts));
          localStorage.setItem('bc_orders', JSON.stringify(currentOrders));
          localStorage.setItem('bc_config', JSON.stringify(currentConfig));
          localStorage.setItem('bc_audit_logs', JSON.stringify(currentAuditLogs));
        } else {
          // Fallback to localStorage or default seed
          const cachedUsers = localStorage.getItem('bc_users');
          const cachedProducts = localStorage.getItem('bc_products');
          const cachedOrders = localStorage.getItem('bc_orders');
          const cachedConfig = localStorage.getItem('bc_config');
          const cachedAuditLogs = localStorage.getItem('bc_audit_logs');

          if (cachedUsers && cachedProducts && cachedOrders && cachedConfig) {
            currentUsers = JSON.parse(cachedUsers);
            currentProducts = JSON.parse(cachedProducts);
            currentOrders = JSON.parse(cachedOrders);
            currentConfig = JSON.parse(cachedConfig);
            currentAuditLogs = cachedAuditLogs ? JSON.parse(cachedAuditLogs) : seedDefaultAuditLogs();

            setUsers(currentUsers);
            setProducts(currentProducts);
            setOrders(currentOrders);
            setConfig(currentConfig);
            setAuditLogs(currentAuditLogs);
          } else {
            const seeded = generateDynamicDataset();
            currentUsers = seeded.users;
            currentProducts = seeded.products;
            currentOrders = seeded.orders;
            currentConfig = DEFAULT_CONFIG;
            currentAuditLogs = seedDefaultAuditLogs();

            setUsers(currentUsers);
            setProducts(currentProducts);
            setOrders(currentOrders);
            setConfig(currentConfig);
            setAuditLogs(currentAuditLogs);
          }

          // Initial push to server to seed backend
          await fetch('/api/db/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              users: currentUsers,
              products: currentProducts,
              orders: currentOrders,
              config: currentConfig,
              auditLogs: currentAuditLogs
            })
          });
        }
      } catch (err) {
        console.error('Error fetching backend state, falling back to local storage:', err);
        const cachedUsers = localStorage.getItem('bc_users');
        const cachedProducts = localStorage.getItem('bc_products');
        const cachedOrders = localStorage.getItem('bc_orders');
        const cachedConfig = localStorage.getItem('bc_config');
        const cachedAuditLogs = localStorage.getItem('bc_audit_logs');

        if (cachedUsers && cachedProducts && cachedOrders && cachedConfig) {
          setUsers(JSON.parse(cachedUsers));
          setProducts(JSON.parse(cachedProducts));
          setOrders(JSON.parse(cachedOrders));
          setConfig(JSON.parse(cachedConfig));
          setAuditLogs(cachedAuditLogs ? JSON.parse(cachedAuditLogs) : seedDefaultAuditLogs());
        } else {
          const seeded = generateDynamicDataset();
          setUsers(seeded.users);
          setProducts(seeded.products);
          setOrders(seeded.orders);
          setConfig(DEFAULT_CONFIG);
          setAuditLogs(seedDefaultAuditLogs());
        }
      }

      // Handle language and session setup
      const cachedLang = localStorage.getItem('bc_lang');
      const cachedSession = localStorage.getItem('bc_session');

      if (cachedLang) {
        setLanguageState(cachedLang as Language);
      }

      if (cachedSession) {
        setLoggedInUser(JSON.parse(cachedSession));
      } else {
        const cachedCurrentUsers = localStorage.getItem('bc_users');
        const currentUsersList = cachedCurrentUsers ? JSON.parse(cachedCurrentUsers) : [];
        const defaultCust = currentUsersList.find((u: any) => u.email === 'lokesh.naidu@gmail.com') || null;
        if (defaultCust) {
          setLoggedInUser(defaultCust);
          localStorage.setItem('bc_session', JSON.stringify(defaultCust));
        }
      }
    };

    initializeState();
  }, []);

  // Helper because ES6 exports might evaluate before state hook
  const SEED_USERS_LOCAL = () => {
    const cache = localStorage.getItem('bc_users');
    if (cache) return JSON.parse(cache) as User[];
    return [];
  };

  const syncState = (updatedUsers: User[], updatedProducts: Product[], updatedOrders: Order[], updatedConfig = config) => {
    setUsers(updatedUsers);
    setProducts(updatedProducts);
    setOrders(updatedOrders);
    setConfig(updatedConfig);

    localStorage.setItem('bc_users', JSON.stringify(updatedUsers));
    localStorage.setItem('bc_products', JSON.stringify(updatedProducts));
    localStorage.setItem('bc_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('bc_config', JSON.stringify(updatedConfig));

    // Save state to the backend Express server database asynchronously
    fetch('/api/db/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: updatedUsers,
        products: updatedProducts,
        orders: updatedOrders,
        config: updatedConfig,
        auditLogs
      })
    }).catch((err) => console.error('Failed to sync state to server:', err));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bc_lang', lang);
  };

  const addNotification = (text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newNotif = { id: Math.random().toString(36).substr(2, 9), text, time };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const login = (email: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    let matched = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
    
    // Self-healing fallback for seeded sandbox roles (like admin/CEO)
    if (!matched) {
      const seedMatch = SEED_USERS.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
      if (seedMatch) {
        matched = seedMatch;
        const updatedUsers = [...users, seedMatch];
        setUsers(updatedUsers);
        localStorage.setItem('bc_users', JSON.stringify(updatedUsers));
      }
    }

    if (matched) {
      setLoggedInUser(matched);
      localStorage.setItem('bc_session', JSON.stringify(matched));
      addNotification(`Session established: Logged in as ${matched.name} (${matched.role})`);
      return true;
    }
    return false;
  };

  const register = (userData: Omit<User, 'id' | 'trustScore'>) => {
    const id = `user-registered-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id,
      trustScore: 90, // starts with high trust
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setLoggedInUser(newUser);
    localStorage.setItem('bc_users', JSON.stringify(updatedUsers));
    localStorage.setItem('bc_session', JSON.stringify(newUser));

    addNotification(`Account created successfully for ${newUser.name} with e-KYC validation!`);
  };

  const logout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('bc_session');
    addNotification('Secure session disconnected successfully.');
  };

  const addProduct = (productData: Omit<Product, 'id' | 'merchantId' | 'merchantName'>) => {
    if (!loggedInUser || loggedInUser.role !== 'MERCHANT') return;

    const id = `prod-registered-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      merchantId: loggedInUser.id,
      merchantName: loggedInUser.storeName || loggedInUser.name,
    };

    const updatedProds = [newProduct, ...products];
    syncState(users, updatedProds, orders);
    addNotification(`Product published: "${newProduct.title}" has been registered with HSN ${newProduct.hsnCode}.`);
  };

  const placeOrder = (
    productId: string,
    quantity: number,
    deliveryAddress: string,
    paymentMode: 'PREPAID' | 'COD',
    influencerId?: string,
    notes?: string
  ) => {
    if (!loggedInUser) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Fetch promoter info
    let influencerName: string | undefined;
    let influencerVpa: string | undefined;
    if (influencerId) {
      const inf = users.find((u) => u.id === influencerId);
      if (inf) {
        influencerName = inf.name;
        influencerVpa = inf.vpa;
      }
    }

    const orderId = `BC-ORD-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      customerId: loggedInUser.id,
      customerName: loggedInUser.name,
      customerLocation: deliveryAddress,
      merchantId: product.merchantId,
      merchantName: product.merchantName,
      merchantLocation: users.find((u) => u.id === product.merchantId)?.location || 'Mandi, Ghatkesar',
      influencerId,
      influencerName,
      influencerVpa,
      product,
      quantity,
      paymentMode,
      paymentStatus: paymentMode === 'PREPAID' ? 'COMPLETED' : 'PENDING',
      status: 'BOOKED',
      notes,
      createdAt: timestamp,
      commissionPercent: config.defaultInfluencerPercent,
      platformFeePercent: config.platformFeePercent,
      taxPercent: config.defaultTaxPercent,
      deliveryFeeAmount: config.deliveryFeeAmount,
      trackingHistory: [{ status: 'BOOKED', timestamp }],
    };

    const updatedOrders = [newOrder, ...orders];
    syncState(users, products, updatedOrders);
    
    addNotification(`Order placed: Placed order ${orderId} for ₹${(product.price * quantity).toFixed(2)}`);
  };

  const acceptOrder = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'ACCEPTED' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'ACCEPTED' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      addNotification(`Order Accepted: Merchant ${order.merchantName} verified payment and accepted shipment ${orderId}.`);
    }
  };

  const packOrder = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'PACKED' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'PACKED' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      addNotification(`Order Packed: Shipment ${orderId} is packed. EV dispatch notification sent to nearby riders.`);
    }
  };

  const assignRiderAndDispatch = (orderId: string, riderId: string) => {
    const rider = users.find((u) => u.id === riderId);
    if (!rider) return;

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'IN_TRANSIT' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'IN_TRANSIT' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      addNotification(`Rider Dispatched: Rider ${rider.name} accepted manifest for ${orderId}. Moving to destination.`);
    }
  };

  const confirmHandshake = (orderId: string) => {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const order = orders[orderIndex];
    const timestamp = new Date().toISOString();

    // 1. Calculate final financial splits
    const totalItemAmount = order.product.price * order.quantity;
    
    // Platform fee (strictly capped between 2% and 3%)
    const platformFee = parseFloat((totalItemAmount * (order.platformFeePercent / 100)).toFixed(2));
    
    // Tax calculations (GST/TDS)
    const govtTax = parseFloat((totalItemAmount * (order.taxPercent / 100)).toFixed(2));
    
    // Influencer commission split
    const influencerCommission = order.influencerId
      ? parseFloat((totalItemAmount * (order.commissionPercent / 100)).toFixed(2))
      : 0;
      
    // Delivery fee (direct split to rider)
    const deliveryFee = order.deliveryFeeAmount;
    
    // Merchant Net proceeds (Total - splits)
    const merchantProceeds = parseFloat((totalItemAmount - platformFee - govtTax - influencerCommission).toFixed(2));

    const finalSplits = {
      merchant: merchantProceeds,
      influencer: influencerCommission,
      platform: platformFee,
      tax: govtTax,
      delivery: deliveryFee,
    };

    // 2. Map updated order state
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'DELIVERED' as OrderStatus,
          paymentStatus: 'COMPLETED' as const,
          trackingHistory: [...o.trackingHistory, { status: 'DELIVERED' as OrderStatus, timestamp }],
          finalSplits,
        };
      }
      return o;
    });

    // 3. Boost Merchant & Rider Trust Index score based on high performance
    const updatedUsers = users.map((u) => {
      if (u.id === order.merchantId) {
        return { ...u, trustScore: Math.min(100, u.trustScore + 1) };
      }
      return u;
    });

    syncState(updatedUsers, products, updatedOrders);

    addNotification(`🎉 Direct UPI Splits Settled for ${orderId}:`);
    addNotification(`- Merchant Direct UPI: ₹${merchantProceeds} sent to VPA`);
    if (influencerCommission > 0 && order.influencerVpa) {
      addNotification(`- Influencer Direct UPI: ₹${influencerCommission} sent to ${order.influencerVpa}`);
    }
    addNotification(`- Delivery Rider UPI: ₹${deliveryFee} split paid to Rider`);
    addNotification(`- Govt GST/TDS VPA: ₹${govtTax} deposited to consolidated account`);
    addNotification(`- Platform Fee (strictly capped): ₹${platformFee} settled`);
  };

  const buyerAcceptOrder = (orderId: string, dispatchDetails: string) => {
    const code = `VND-${Math.floor(1000 + Math.random() * 9000)}`;
    const otp = `OTP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'BUYER_ACCEPTED' as OrderStatus,
          dispatchDetails,
          vendorCode: code,
          customerOtp: otp,
          trackingHistory: [...o.trackingHistory, { status: 'BUYER_ACCEPTED' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    addNotification(`Buyer Accepted: Order ${orderId} has been verified with dispatch details: "${dispatchDetails}".`);
  };

  const sendToTransport = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'TRANSPORT_PENDING' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'TRANSPORT_PENDING' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    addNotification(`Transport Request Sent: Details for order ${orderId} routed to Transport Department API.`);
  };

  const transportAssignRider = (orderId: string, riderId: string) => {
    const rider = users.find((u) => u.id === riderId);
    if (!rider) return;

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'RIDER_ASSIGNED' as OrderStatus,
          driverId: rider.id,
          driverName: rider.name,
          driverPhone: rider.phone,
          trackingHistory: [...o.trackingHistory, { status: 'RIDER_ASSIGNED' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    addNotification(`Rider Assigned: Ride assigned to ${rider.name} (${rider.vehicleType || 'EV Rider'}).`);
  };

  const riderAcceptOrder = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'RIDER_ACCEPTED' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'RIDER_ACCEPTED' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    addNotification(`Rider Accepted: Rider has accepted the ride request for ${orderId}. Moving to vendor.`);
  };

  const riderEnterVendorCode = (orderId: string, code: string): boolean => {
    let matched = false;
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        if (o.vendorCode && o.vendorCode.trim().toUpperCase() === code.trim().toUpperCase()) {
          matched = true;
          const timestamp = new Date().toISOString();
          return {
            ...o,
            status: 'IN_TRANSIT' as OrderStatus,
            enteredVendorCode: code.trim().toUpperCase(),
            trackingHistory: [...o.trackingHistory, { status: 'IN_TRANSIT' as OrderStatus, timestamp }],
          };
        }
      }
      return o;
    });

    if (matched) {
      syncState(users, products, updatedOrders);
      addNotification(`Verification Code Correct: Product for ${orderId} collected from vendor. Moving to transit!`);
    }
    return matched;
  };

  const deliveryPersonArrive = (orderId: string) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const timestamp = new Date().toISOString();
        return {
          ...o,
          status: 'DELIVERED_AWAITING_OTP' as OrderStatus,
          trackingHistory: [...o.trackingHistory, { status: 'DELIVERED_AWAITING_OTP' as OrderStatus, timestamp }],
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);
    addNotification(`Rider Arrived: Delivery person arrived at customer destination. Awaiting OTP handshake.`);
  };

  const riderCompleteDeliveryWithOtp = (orderId: string, otp: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    if (order.customerOtp && order.customerOtp.trim().toUpperCase() === otp.trim().toUpperCase()) {
      // Complete and trigger financial payouts
      const orderIndex = orders.findIndex((o) => o.id === orderId);
      if (orderIndex === -1) return false;

      // Update enteredCustomerOtp in context local tracking
      const updatedOrders = orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            enteredCustomerOtp: otp.trim().toUpperCase()
          };
        }
        return o;
      });

      // Update local state first so confirmHandshake gets it
      setOrders(updatedOrders);
      
      // confirmHandshake transitions status to DELIVERED and executes ledger payout splits
      setTimeout(() => {
        confirmHandshake(orderId);
      }, 50);
      return true;
    }
    return false;
  };

  const addAuditLog = (
    action: AuditLogEntry['action'],
    details: string,
    severity: AuditLogEntry['severity'],
    status: AuditLogEntry['status'],
    metadata?: Record<string, any>
  ) => {
    const nextId = `AUDIT-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toISOString();
    
    setAuditLogs((prevLogs) => {
      const lastLog = prevLogs[prevLogs.length - 1];
      const prevHash = lastLog ? lastLog.hash : '0000000000000000000000000000000000000000000000000000000000000000';
      
      const content = `${nextId}-${timestamp}-${action}-${loggedInUser?.email || 'system'}-${details}-${prevHash}`;
      let hashVal = 0;
      for (let i = 0; i < content.length; i++) {
        hashVal = (hashVal << 5) - hashVal + content.charCodeAt(i);
        hashVal |= 0;
      }
      const hex = Math.abs(hashVal).toString(16).toUpperCase().padStart(8, '0');
      const hash = `BC-HASH-${hex}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const newEntry: AuditLogEntry = {
        id: nextId,
        timestamp,
        action,
        actorName: loggedInUser ? loggedInUser.name : 'System Scheduler',
        actorEmail: loggedInUser ? loggedInUser.email : 'system@bharatconnect.in',
        details,
        severity,
        status,
        hash,
        prevHash,
        metadata
      };

      const updated = [...prevLogs, newEntry];
      localStorage.setItem('bc_audit_logs', JSON.stringify(updated));

      // Asynchronously post updated log sequence to Express backend database
      fetch('/api/db/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users,
          products,
          orders,
          config,
          auditLogs: updated
        })
      }).catch((err) => console.error('Failed to sync audit logs to server:', err));

      return updated;
    });
  };

  const approveUserRegistration = (userId: string) => {
    const userToApprove = users.find(u => u.id === userId);
    if (!userToApprove) return;

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { 
          ...u, 
          trustScore: 98,
          storeName: u.role === 'MERCHANT' && !u.storeName ? `${u.name}'s Swadeshi Bazaar` : u.storeName
        };
      }
      return u;
    });

    syncState(updatedUsers, products, orders);

    addAuditLog(
      'REGISTRATION_APPROVAL',
      `Approved registered role credentials and e-KYC documents for ${userToApprove.name} (${userToApprove.role}). Set Trust Score to 98%.`,
      'INFO',
      'SUCCESS',
      { userId, originalTrustScore: userToApprove.trustScore }
    );
    addNotification(`DPI Registry Node: Approved credentials for ${userToApprove.name} successfully!`);
  };

  const overrideOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const orderToOverride = orders.find(o => o.id === orderId);
    if (!orderToOverride) return;

    const timestamp = new Date().toISOString();
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        let finalSplits = o.finalSplits;
        if (newStatus === 'DELIVERED' && !finalSplits) {
          const totalItemAmount = o.product.price * o.quantity;
          const platformFee = parseFloat((totalItemAmount * (o.platformFeePercent / 100)).toFixed(2));
          const govtTax = parseFloat((totalItemAmount * (o.taxPercent / 100)).toFixed(2));
          const influencerCommission = o.influencerId ? parseFloat((totalItemAmount * (o.commissionPercent / 100)).toFixed(2)) : 0;
          const merchantProceeds = parseFloat((totalItemAmount - platformFee - govtTax - influencerCommission).toFixed(2));
          
          finalSplits = {
            merchant: merchantProceeds,
            influencer: influencerCommission,
            platform: platformFee,
            tax: govtTax,
            delivery: o.deliveryFeeAmount,
          };
        }

        return {
          ...o,
          status: newStatus,
          paymentStatus: newStatus === 'DELIVERED' ? ('COMPLETED' as const) : o.paymentStatus,
          trackingHistory: [...o.trackingHistory, { status: newStatus, timestamp }],
          finalSplits
        };
      }
      return o;
    });

    syncState(users, products, updatedOrders);

    addAuditLog(
      'TRANSACTION_OVERRIDE',
      `Admin override on Transaction ${orderId}: Forcibly state shifted status from "${orderToOverride.status}" to "${newStatus}". Escrow splits updated.`,
      'CRITICAL',
      'SUCCESS',
      { orderId, previousStatus: orderToOverride.status, overriddenStatus: newStatus }
    );
    addNotification(`Sovereign Audit: Forcibly overridden order ${orderId} to status ${newStatus}.`);
  };

  const toggleComplianceFlag = (userId: string, flagDetails: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const isDeescalating = targetUser.trustScore < 90;
    const newTrustScore = isDeescalating ? 95 : 75;

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { ...u, trustScore: newTrustScore };
      }
      return u;
    });

    syncState(updatedUsers, products, orders);

    const detailsText = isDeescalating
      ? `Re-instated high compliance status for ${targetUser.name} (${targetUser.role}). Verified license certificates.`
      : `Raised statutory compliance warning flag for ${targetUser.name} (${targetUser.role}). Details: ${flagDetails}`;

    addAuditLog(
      'COMPLIANCE_FLAG_TOGGLE',
      detailsText,
      isDeescalating ? 'INFO' : 'WARNING',
      isDeescalating ? 'SUCCESS' : 'FLAGGED',
      { userId, targetName: targetUser.name, previousScore: targetUser.trustScore, newScore: newTrustScore }
    );

    addNotification(`Compliance Event: Trust score adjusted to ${newTrustScore}% for ${targetUser.name}.`);
  };

  const updateConfig = (newConfig: SystemConfig): string | null => {
    // Rigid compliance validation: platform convenience fee must be between 2.0% and 3.0%
    if (newConfig.platformFeePercent < 2.0 || newConfig.platformFeePercent > 3.0) {
      return 'Platform routing fee is strictly capped between 2.0% and 3.0% under BharatConnect Digital Public Infrastructure (DPI) mandate guidelines.';
    }

    const updatedUsers = [...users];
    const updatedProducts = [...products];
    const updatedOrders = [...orders];

    syncState(updatedUsers, updatedProducts, updatedOrders, newConfig);
    addNotification('BharatConnect transaction parameters updated successfully on system ledger!');

    addAuditLog(
      'REGULATION_ADJUSTMENT',
      `Recalibrated core economic parameters. Platform Fee Percent set to ${newConfig.platformFeePercent}%, Tax Percent to ${newConfig.defaultTaxPercent}%, Influencer Percent to ${newConfig.defaultInfluencerPercent}%.`,
      'INFO',
      'SUCCESS',
      { oldConfig: config, newConfig }
    );
    return null;
  };

  return (
    <AppContext.Provider
      value={{
        loggedInUser,
        users,
        products,
        orders,
        config,
        language,
        notifications,
        auditLogs,
        setLanguage,
        login,
        register,
        logout,
        addProduct,
        placeOrder,
        acceptOrder,
        packOrder,
        assignRiderAndDispatch,
        confirmHandshake,
        buyerAcceptOrder,
        sendToTransport,
        transportAssignRider,
        riderAcceptOrder,
        riderEnterVendorCode,
        deliveryPersonArrive,
        riderCompleteDeliveryWithOtp,
        updateConfig,
        addNotification,
        clearNotifications,
        addAuditLog,
        approveUserRegistration,
        overrideOrderStatus,
        toggleComplianceFlag,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
