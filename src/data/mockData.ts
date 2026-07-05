import { User, Product, Order, SystemConfig } from '../types';

export const DEFAULT_CONFIG: SystemConfig = {
  platformFeePercent: 2.5, // strictly capped at 2.0% - 3.0% under Digital Public Infrastructure mandate
  defaultInfluencerPercent: 5.0,
  defaultTaxPercent: 12.0, // GST / Govt. Taxes
  deliveryFeeAmount: 40.0, // UPI split directly to delivery partner VPA
};

// Seed initial prominent users
export const SEED_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@bharatconnect.in',
    name: 'Lokesh Naidu (CEO, BharatConnect)',
    role: 'ADMIN',
    location: 'BharatConnect Headquarters, Hitec City, Hyderabad, Telangana',
    vpa: 'lokesh.ceo@bharatconnect',
    trustScore: 100,
    phone: '+91 99999 88888',
    aadhaarMasked: 'XXXX-XXXX-9900'
  },
  {
    id: 'merchant-1',
    email: 'sai.krishna@bharatconnect.in',
    name: 'Sai Krishna Kiran',
    role: 'MERCHANT',
    location: 'Ghatkesar Mandi, Medchal-Malkajgiri, Hyderabad',
    vpa: 'saikrishna@ybl',
    trustScore: 95,
    phone: '+91 90123 45678',
    storeName: 'Krishna Organic Millets & Grains (BharatConnect Certified)',
    gstin: '36AAAAA1111A1Z1',
    aadhaarMasked: 'XXXX-XXXX-2345'
  },
  {
    id: 'merchant-2',
    email: 'gopal.foods@bharatconnect.in',
    name: 'Gopal Swamy',
    role: 'MERCHANT',
    location: 'Anantapur Oil Extraction Depot, Andhra Pradesh',
    vpa: 'gopalfoods@okhdfcbank',
    trustScore: 92,
    phone: '+91 81234 56789',
    storeName: 'Rayalaseema Wood-Pressed Oils (BharatConnect Certified)',
    gstin: '37BBBBB2222B2Z2',
    aadhaarMasked: 'XXXX-XXXX-6789'
  },
  {
    id: 'influencer-1',
    email: 'naveen.vlogs@bharatconnect.in',
    name: 'Naveen Kumar (BharatConnect Creator Partner)',
    role: 'INFLUENCER',
    location: 'Warangal, Telangana',
    vpa: 'naveenvlogs@okaxis',
    trustScore: 96,
    phone: '+91 93456 78901',
    niche: 'Agriculture & Rural Tech Vlogger',
    aadhaarMasked: 'XXXX-XXXX-3456'
  },
  {
    id: 'influencer-2',
    email: 'deepa.organic@bharatconnect.in',
    name: 'Deepa Reddy (Swaasthya Living)',
    role: 'INFLUENCER',
    location: 'Ghatkesar, Hyderabad',
    vpa: 'deepareddy@paytm',
    trustScore: 94,
    phone: '+91 94567 89012',
    niche: 'Organic Recipes & Healthy Living',
    aadhaarMasked: 'XXXX-XXXX-4567'
  },
  {
    id: 'rider-1',
    email: 'harish.delivery@bharatconnect.in',
    name: 'Alapati Harish',
    role: 'DELIVERY_PARTNER',
    location: 'Ghatkesar Bypass Junction, Hyderabad',
    vpa: 'harishrider@okicici',
    trustScore: 98,
    phone: '+91 95678 90123',
    vehicleType: 'BharatConnect EV Delivery Rider Scooter (TS-08-EV-1234)',
    licenseNo: 'DL-TS0820230004561',
    aadhaarMasked: 'XXXX-XXXX-5678'
  },
  {
    id: 'customer-1',
    email: 'lokesh.naidu@gmail.com',
    name: 'Lokesh Naidu',
    role: 'CUSTOMER',
    location: 'Venkadri Hills Colony, Ghatkesar, Hyderabad',
    vpa: 'lokesh.naidu@okhdfcbank',
    trustScore: 100,
    phone: '+91 99999 88888',
    aadhaarMasked: 'XXXX-XXXX-7890'
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    merchantId: 'merchant-1',
    merchantName: 'Krishna Organic Millets & Grains',
    title: 'Organic Foxtail Millets (Korralu)',
    description: '100% organic, unpolished, high-fiber Foxtail Millets sourced directly from dryland farmers in Medchal. Perfect alternative to white rice with rich mineral content, gluten-free, and suitable for diabetic wellness diets.',
    specifications: 'Weight: 1 Kg | BIS Certified | HSN Code: 1008.21.10 | Moisture: <12% | No synthetic pesticide residue.',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
    price: 120.0,
    category: 'Staples & Millets',
    hsnCode: '1008.21.10',
    bisCertified: true
  },
  {
    id: 'prod-2',
    merchantId: 'merchant-2',
    merchantName: 'Rayalaseema Wood-Pressed Oils',
    title: 'Wood-Pressed Cold Groundnut Oil',
    description: 'Traditionally extracted cold-pressed groundnut oil using native wooden Ghani blocks. No heat treatment, chemicals, or solvent extraction. Retains full nutty flavor, high monounsaturated fats, and vitamins for heart-healthy Indian cooking.',
    specifications: 'Volume: 1 Litre | FSSAI Registered | HSN Code: 1508.90.10 | Zero Trans-Fat | Rich in Vitamin E.',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600',
    price: 240.0,
    category: 'Wood-Pressed Oils',
    hsnCode: '1508.90.10',
    bisCertified: true
  },
  {
    id: 'prod-3',
    merchantId: 'merchant-1',
    merchantName: 'Krishna Organic Millets & Grains',
    title: 'Premium Hand-Ground Salem Turmeric',
    description: 'Salem-grade organic turmeric powder with high natural curcumin content (above 5.5%). Sourced from single-origin cooperative farms in South India, sun-dried, and traditionally stone-ground to preserve immunity-boosting benefits.',
    specifications: 'Weight: 250g | Curcumin Content: 5.8% | HSN Code: 0910.30.20 | Pure vegetarian, no starch or coloring additives.',
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&q=80&w=600',
    price: 85.0,
    category: 'Traditional Spices',
    hsnCode: '0910.30.20',
    bisCertified: true
  },
  {
    id: 'prod-4',
    merchantId: 'merchant-2',
    merchantName: 'Rayalaseema Wood-Pressed Oils',
    title: 'Organic Wood-Pressed Sesame Oil',
    description: 'Authentic wood-pressed sesame (til) oil with high nutritional density. Sun-dried sesame seeds are crushed with palm jaggery in a wooden press to balance bitterness, providing a rich aroma and deep golden tint perfect for traditional curries and body massages.',
    specifications: 'Volume: 1 Litre | Cold Filtered | HSN Code: 1515.50.91 | Saturated Fats: 14% | Hand-processed.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
    price: 310.0,
    category: 'Wood-Pressed Oils',
    hsnCode: '1515.50.91',
    bisCertified: true
  }
];

// Seed dynamic dataset: 50 merchants, 50 consumers, 10 Telugu creators, 10 delivery partners
export function generateDynamicDataset(): { users: User[]; products: Product[]; orders: Order[] } {
  const users: User[] = [...SEED_USERS];
  const products: Product[] = [...SEED_PRODUCTS];
  const orders: Order[] = [];

  const locationsHyderabad = [
    'Ghatkesar Sector 1, Hyderabad',
    'Ghatkesar Sector 2, Hyderabad',
    'Chowdariguda, Ghatkesar',
    'Yamnampet, Ghatkesar',
    'Venkadri Hills, Hyderabad',
    'RTC Colony, Ghatkesar',
    'Annojiguda, Hyderabad',
    'Korremula Road, Ghatkesar',
    'Narapally, Hyderabad',
    'Boduppal, Hyderabad'
  ];

  const categories = ['Staples & Millets', 'Wood-Pressed Oils', 'Traditional Spices', 'Handloom Textiles'];

  // 1. Generate 50 Merchants (id: merchant-101 to merchant-150)
  for (let i = 1; i <= 50; i++) {
    const id = `merchant-dynamic-${i}`;
    const name = `Merchant ${i} (${['Koteswar Rao', 'Narayana Swamy', 'Anjali Devi', 'Subba Reddy', 'Srinivasa Raju', 'Radhika Rao'][i % 6]})`;
    const loc = locationsHyderabad[i % locationsHyderabad.length];
    const category = categories[i % categories.length];
    
    users.push({
      id,
      email: `merchant${i}@bharatconnect.in`,
      name,
      role: 'MERCHANT',
      location: loc,
      vpa: `merchant${i}@okaxis`,
      trustScore: 85 + (i % 15),
      phone: `+91 98480 ${String(10000 + i).slice(1)}`,
      storeName: `BharatConnect Partner ${category} Hub ${i}`,
      gstin: `36ABCDF${String(1000 + i)}A1Z${i % 9}`,
      aadhaarMasked: `XXXX-XXXX-${String(2000 + i)}`
    });

    // Each merchant gets 1 custom product
    products.push({
      id: `prod-dynamic-${i}`,
      merchantId: id,
      merchantName: `BharatConnect Partner ${category} Hub ${i}`,
      title: `BharatConnect Verified ${category} Product ${i}`,
      description: `Organic high-grade ${category.toLowerCase()} hand-selected from native cooperatives. Cultivated under BharatConnect Digital Public Infrastructure (DPI) quality assurance protocols with zero heavy metal elements. Tested and packed carefully for family consumption.`,
      specifications: `FSSAI Grade A | HSN Code: ${2000 + i} | BIS Compliant | Hand-processed inside Telangana.`,
      image: i % 4 === 0 
        ? 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600'
        : i % 4 === 1
        ? 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600'
        : i % 4 === 2
        ? 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
      price: 150 + (i * 5),
      category,
      hsnCode: `09${10 + i}.30.20`,
      bisCertified: true
    });
  }

  // 2. Generate 50 Consumers (id: customer-dynamic-1 to customer-dynamic-50)
  for (let i = 1; i <= 50; i++) {
    const id = `customer-dynamic-${i}`;
    users.push({
      id,
      email: `consumer${i}@gmail.com`,
      name: `${['Harsha Vardhan', 'Priya Naidu', 'Satish Chander', 'Meenakshi Iyer', 'Latha Reddy', 'Venkat Ram'][i % 6]} (Customer ${i})`,
      role: 'CUSTOMER',
      location: locationsHyderabad[(i + 3) % locationsHyderabad.length],
      vpa: `consumer${i}@okaxis`,
      trustScore: 90 + (i % 11),
      phone: `+91 99890 ${String(10000 + i).slice(1)}`,
      aadhaarMasked: `XXXX-XXXX-${String(5000 + i)}`
    });
  }

  // 3. Generate 10 Telugu/Local Influencers (id: influencer-dynamic-1 to influencer-dynamic-10)
  const creatorNames = [
    'Telugu Rythu Badi (Agro Tech)',
    'Nippu Vlogs (Telugu Food)',
    'Smart Ghatkesar Guide',
    'Gramina Kala (Village Arts)',
    'Andhra Authentic Kitchen',
    'Telangana Pragathi Tech',
    'Mitti Se Lifestyle',
    'Swadeshi Sanchar',
    'Local Merchant Advocate',
    'BharatConnect Partner Telugu'
  ];
  const niches = [
    'Farming Tips & Agro Supplies',
    'Traditional Food Processing',
    'Local Township Guide',
    'Handloom Textiles Promos',
    'Healthy Food Recipes',
    'Rural Tech & Digitization',
    'Zero-waste Lifestyle',
    'Handmade Products & Pottery',
    'MSME Merchant Showcases',
    'BharatConnect Partner Network Advisor'
  ];
  for (let i = 1; i <= 10; i++) {
    const id = `influencer-dynamic-${i}`;
    users.push({
      id,
      email: `influencer${i}@bharatconnect.in`,
      name: creatorNames[i - 1],
      role: 'INFLUENCER',
      location: locationsHyderabad[(i + 7) % locationsHyderabad.length],
      vpa: `creator${i}@oksbi`,
      trustScore: 93 + (i % 7),
      phone: `+91 94405 ${String(10000 + i).slice(1)}`,
      niche: niches[i - 1],
      aadhaarMasked: `XXXX-XXXX-${String(8000 + i)}`
    });
  }

  // 4. Generate 10 Delivery Riders (id: delivery-dynamic-1 to delivery-dynamic-10)
  const EV_MODELS = [
    'BharatConnect EV Scooter (TS-08-EV-9810)',
    'BharatConnect EV Rider Ather (AP-15-EV-4422)',
    'BharatConnect EV Express (TS-07-EV-3351)',
    'BharatConnect EV Cargo (TS-08-EV-5561)',
    'BharatConnect EV Swift (AP-31-EV-2231)'
  ];
  for (let i = 1; i <= 10; i++) {
    const id = `delivery-dynamic-${i}`;
    users.push({
      id,
      email: `delivery${i}@bharatconnect.in`,
      name: `${['Siva Kumar', 'Ravi Shankar', 'Kalyan Chakravarthy', 'Prasad Rao', 'Mahesh Babu'][i % 5]} (EV Express)`,
      role: 'DELIVERY_PARTNER',
      location: locationsHyderabad[(i + i) % locationsHyderabad.length],
      vpa: `rider${i}@okpaytm`,
      trustScore: 95 + (i % 5),
      phone: `+91 91001 ${String(10000 + i).slice(1)}`,
      vehicleType: EV_MODELS[i % EV_MODELS.length],
      licenseNo: `DL-TS082024000${9900 + i}`,
      aadhaarMasked: `XXXX-XXXX-${String(3000 + i)}`
    });
  }

  // Seed 5 historical settled transactions for rich charts and telemetry
  const baseOrderTime = new Date();
  for (let i = 1; i <= 6; i++) {
    const randProd = products[(i + 2) % products.length];
    const randCust = users.filter(u => u.role === 'CUSTOMER')[i % users.filter(u => u.role === 'CUSTOMER').length];
    const randInf = users.filter(u => u.role === 'INFLUENCER')[i % users.filter(u => u.role === 'INFLUENCER').length];
    const randRid = users.filter(u => u.role === 'DELIVERY_PARTNER')[i % users.filter(u => u.role === 'DELIVERY_PARTNER').length];
    
    const basePrice = randProd.price;
    const quantity = 1;
    const itemTotal = basePrice * quantity;
    const commission = parseFloat((itemTotal * (DEFAULT_CONFIG.defaultInfluencerPercent / 100)).toFixed(2));
    const platformFee = parseFloat((itemTotal * (DEFAULT_CONFIG.platformFeePercent / 100)).toFixed(2));
    const tax = parseFloat((itemTotal * (DEFAULT_CONFIG.defaultTaxPercent / 100)).toFixed(2));
    const merchantProceeds = parseFloat((itemTotal - commission - platformFee - tax).toFixed(2));
    
    const splitTime = new Date();
    splitTime.setDate(baseOrderTime.getDate() - (7 - i));

    orders.push({
      id: `BC-ORD-HIST-100${i}`,
      customerId: randCust.id,
      customerName: randCust.name,
      customerLocation: randCust.location,
      merchantId: randProd.merchantId,
      merchantName: randProd.merchantName,
      merchantLocation: 'Ghatkesar Mandi, Medchal-Malkajgiri, Hyderabad',
      influencerId: randInf.id,
      influencerName: randInf.name,
      influencerVpa: randInf.vpa,
      product: randProd,
      quantity,
      paymentMode: i % 2 === 0 ? 'PREPAID' : 'COD',
      paymentStatus: 'COMPLETED',
      status: 'DELIVERED',
      createdAt: splitTime.toISOString(),
      commissionPercent: DEFAULT_CONFIG.defaultInfluencerPercent,
      platformFeePercent: DEFAULT_CONFIG.platformFeePercent,
      taxPercent: DEFAULT_CONFIG.defaultTaxPercent,
      deliveryFeeAmount: DEFAULT_CONFIG.deliveryFeeAmount,
      trackingHistory: [
        { status: 'BOOKED', timestamp: splitTime.toISOString() },
        { status: 'BUYER_ACCEPTED', timestamp: splitTime.toISOString() },
        { status: 'RIDER_ACCEPTED', timestamp: splitTime.toISOString() },
        { status: 'IN_TRANSIT', timestamp: splitTime.toISOString() },
        { status: 'DELIVERED', timestamp: splitTime.toISOString() }
      ],
      finalSplits: {
        merchant: merchantProceeds,
        influencer: commission,
        platform: platformFee,
        tax,
        delivery: DEFAULT_CONFIG.deliveryFeeAmount
      }
    });
  }

  return { users, products, orders };
}
