/**
 * seedRandom.js — populates realistic demo data for analysis
 * Called via POST /api/seed-demo (requires auth token or runs on start)
 */

const Order        = require('../models/Order');
const Delivery     = require('../models/Delivery');
const Payment      = require('../models/Payment');
const Attendance   = require('../models/Attendance');
const Material     = require('../models/Material');
const Notification = require('../models/Notification');
const Project      = require('../models/Project');
const User         = require('../models/User');
const Vendor       = require('../models/Vendor');
const Budget       = require('../models/Budget');
const WorkSchedule = require('../models/WorkSchedule');
const SitePhoto    = require('../models/SitePhoto');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const fmt = (d) => d.toISOString().split('T')[0];

// ─── Item catalogue per category ──────────────────────────────────────────────
const CATALOGUE = {
  steel: [
    { name: 'TMT Steel Bar 8mm', unit: 'kg' },
    { name: 'TMT Steel Bar 12mm', unit: 'kg' },
    { name: 'TMT Steel Bar 16mm', unit: 'kg' },
    { name: 'Binding Wire', unit: 'kg' },
    { name: 'MS Angle 50x50x5', unit: 'kg' },
  ],
  cement: [
    { name: 'OPC 53 Grade Cement', unit: 'bag' },
    { name: 'PPC Cement', unit: 'bag' },
    { name: 'White Cement', unit: 'bag' },
  ],
  brick_block: [
    { name: 'Red Brick 9"', unit: 'nos' },
    { name: 'AAC Block 200mm', unit: 'nos' },
    { name: 'Solid Concrete Block', unit: 'nos' },
    { name: 'Hollow Block 6"', unit: 'nos' },
  ],
  plumbing: [
    { name: 'CPVC Pipe 1/2"', unit: 'meter' },
    { name: 'CPVC Pipe 3/4"', unit: 'meter' },
    { name: 'PVC SWR Pipe 4"', unit: 'meter' },
    { name: 'Ball Valve 1/2"', unit: 'nos' },
    { name: 'Elbow 90° CPVC', unit: 'nos' },
    { name: 'Tee Junction CPVC', unit: 'nos' },
    { name: 'P-Trap 4"', unit: 'nos' },
    { name: 'Flush Tank', unit: 'nos' },
  ],
  electrical: [
    { name: '2.5 sqmm FR Wire', unit: 'meter' },
    { name: '4 sqmm FR Wire', unit: 'meter' },
    { name: '6 sqmm FR Wire', unit: 'meter' },
    { name: 'Modular Switch 6A', unit: 'nos' },
    { name: 'Modular Socket 16A', unit: 'nos' },
    { name: 'MCB 32A Single Pole', unit: 'nos' },
    { name: 'Distribution Board 8-way', unit: 'nos' },
    { name: 'LED Batten 2ft', unit: 'nos' },
    { name: 'Conduit Pipe 25mm', unit: 'meter' },
  ],
  tiles: [
    { name: 'Vitrified Floor Tile 600x600', unit: 'sqft' },
    { name: 'Wall Tile 300x450', unit: 'sqft' },
    { name: 'Anti-skid Tile 300x300', unit: 'sqft' },
    { name: 'Granite Slab 20mm', unit: 'sqft' },
    { name: 'Tile Adhesive', unit: 'bag' },
    { name: 'Tile Grout', unit: 'kg' },
  ],
  acp: [
    { name: 'ACP Sheet 4mm FR Grade', unit: 'sqft' },
    { name: 'ACP Sheet 3mm Economy', unit: 'sqft' },
    { name: 'Aluminium Composite Panel Silver', unit: 'sqft' },
  ],
  aluminium: [
    { name: 'Aluminium Section 2"x2"', unit: 'meter' },
    { name: 'Aluminium Window Frame', unit: 'nos' },
    { name: 'Aluminium Sliding Door', unit: 'nos' },
    { name: 'UPVC Window 4x4', unit: 'nos' },
    { name: 'Glass 5mm Clear', unit: 'sqft' },
  ],
  door_lock: [
    { name: 'Flush Door 7x3 ft', unit: 'nos' },
    { name: 'WPC Door Frame', unit: 'nos' },
    { name: 'Mortise Lock Set', unit: 'nos' },
    { name: 'Door Hinge SS', unit: 'nos' },
    { name: 'Door Stopper', unit: 'nos' },
  ],
  paint: [
    { name: 'Interior Emulsion Paint', unit: 'liter' },
    { name: 'Exterior Weather Coat', unit: 'liter' },
    { name: 'Primer White', unit: 'liter' },
    { name: 'PU Polish', unit: 'liter' },
    { name: 'Putty', unit: 'kg' },
  ],
  sand: [
    { name: 'River Sand (Fine)', unit: 'cft' },
    { name: 'M-Sand', unit: 'cft' },
    { name: 'P-Sand', unit: 'cft' },
    { name: '20mm Aggregate', unit: 'cft' },
    { name: '40mm Aggregate', unit: 'cft' },
  ],
};

const VENDOR_CATEGORIES = {
  steel: 0, cement: 1, brick_block: 1, plumbing: 2,
  electrical: 3, tiles: 4, acp: 5, aluminium: 5, door_lock: 5,
  paint: 1, sand: 1,
};

const REQUESTOR_ROLES = {
  civil_contractor:     { cats: ['steel','cement','brick_block','sand'] },
  plumbing_contractor:  { cats: ['plumbing'] },
  color_contractor:     { cats: ['paint'] },
  electric_contractor:  { cats: ['electrical'] },
  tile_contractor:      { cats: ['tiles'] },
  acp_contractor:       { cats: ['acp','aluminium'] },
  aluminium_contractor: { cats: ['aluminium','acp'] },
  door_lock_contractor: { cats: ['door_lock','aluminium'] },
  site_engineer:        { cats: ['steel','cement','brick_block','sand','plumbing','electrical'] },
};

const DRIVERS = [
  { name: 'Suresh Yadav',   phone: '9876543210', vehicle: 'GJ01AB1234' },
  { name: 'Mohan Kumar',    phone: '9876543211', vehicle: 'GJ05CD5678' },
  { name: 'Raju Sharma',    phone: '9876543212', vehicle: 'GJ06EF9012' },
  { name: 'Prem Singh',     phone: '9876543213', vehicle: 'GJ07GH3456' },
  { name: 'Kailash Joshi',  phone: '9876543214', vehicle: 'GJ01XY7890' },
];

// ─── Build random items for an order ─────────────────────────────────────────
function makeItems(cats, count = null) {
  const allItems = cats.flatMap(c => (CATALOGUE[c] || []).map(i => ({ ...i, cat: c })));
  if (!allItems.length) return [{ materialName: 'Misc Material', unit: 'nos', quantity: 10, estimatedCost: 500, category: 'other' }];
  const n = count || rand(1, Math.min(5, allItems.length));
  const shuffled = allItems.sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map(i => ({
    materialName: i.name,
    unit: i.unit,
    category: i.cat,
    quantity: i.unit === 'nos' ? rand(5, 200) : i.unit === 'bag' ? rand(50, 500) : i.unit === 'meter' ? rand(50, 1000) : rand(10, 5000),
    estimatedCost: rand(1000, 80000),
  }));
}

// ─── Main seeder ──────────────────────────────────────────────────────────────
const seedRandom = async () => {
  // Fetch existing base data
  const [users, vendors, projects] = await Promise.all([
    User.find(),
    Vendor.find(),
    Project.find(),
  ]);

  if (!projects.length) { console.log('⚠️  No projects found, run base seed first'); return; }

  const project = projects[0];
  const director  = users.find(u => u.email === 'pratik@nirman.com');
  const engineer  = users.find(u => u.email === 'rinko@nirman.com');
  const chairp    = users.find(u => u.email === 'chairperson@nirman.com');
  const delivery  = users.find(u => u.email === 'delivery@nirman.com');

  const roleUsers = users.filter(u => REQUESTOR_ROLES[u.role]);

  // ─── Clear existing random data ───────────────────────────────────────────
  await Promise.all([
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Attendance.deleteMany({}),
    Material.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // Guard — if key users not found, seed probably not ready yet
  if (!director) { console.log('⚠️  Director user not found — base seed may not have run yet'); return; }

  // ─── PROJECTS: 2 more ─────────────────────────────────────────────────────
  const extraProjects = await Project.find({ name: { $ne: 'Sunrise Residency – Block A' } });
  if (!extraProjects.length) {
    const p2 = await Project.create([
      {
        name: 'Green Valley Township – Phase 1',
        description: 'Row houses + club house, G+2 structure, 120 units.',
        location: 'Sarkhej-Gandhinagar Highway, Ahmedabad',
        status: 'active',
        budget: 82000000,
        startDate: new Date('2024-06-01'),
        expectedEndDate: new Date('2026-06-30'),
        assignedEngineers: [engineer?._id].filter(Boolean),
        assignedContractors: roleUsers.filter(u => ['civil_contractor','electric_contractor'].includes(u.role)).map(u => u._id),
        createdBy: director?._id,
      },
      {
        name: 'Shiv Plaza – Commercial Complex',
        description: 'G+4 Commercial complex with 40 shops and 20 offices.',
        location: 'CG Road, Ahmedabad',
        status: 'planning',
        budget: 35000000,
        startDate: new Date('2025-09-01'),
        expectedEndDate: new Date('2027-03-31'),
        assignedEngineers: [engineer?._id].filter(Boolean),
        createdBy: director?._id,
      },
    ]);
    console.log(`🏗️  Created ${p2.length} extra projects`);
  }

  const allProjects = await Project.find();

  // ─── MATERIALS (Inventory) ────────────────────────────────────────────────
  const matDefs = [
    { name: 'TMT Bar 12mm', category: 'steel', unit: 'kg', currentStock: 12500, minStock: 2000 },
    { name: 'TMT Bar 16mm', category: 'steel', unit: 'kg', currentStock: 8200, minStock: 1500 },
    { name: 'OPC 53 Grade Cement', category: 'cement', unit: 'bag', currentStock: 320, minStock: 100 },
    { name: 'Red Brick 9"', category: 'brick', unit: 'nos', currentStock: 45000, minStock: 5000 },
    { name: 'AAC Block 200mm', category: 'block', unit: 'nos', currentStock: 1200, minStock: 500 },
    { name: 'River Sand', category: 'concrete', unit: 'cft', currentStock: 3800, minStock: 1000 },
    { name: '20mm Aggregate', category: 'concrete', unit: 'cft', currentStock: 2500, minStock: 800 },
    { name: 'CPVC Pipe 1/2"', category: 'pipe', unit: 'meter', currentStock: 650, minStock: 200 },
    { name: 'Ball Valve 1/2"', category: 'fitting', unit: 'nos', currentStock: 85, minStock: 30 },
    { name: '2.5 sqmm FR Wire', category: 'cable', unit: 'meter', currentStock: 1800, minStock: 500 },
    { name: 'Modular Switch 6A', category: 'switch', unit: 'nos', currentStock: 240, minStock: 50 },
    { name: 'MCB 32A', category: 'electrical_accessories', unit: 'nos', currentStock: 45, minStock: 20 },
    { name: 'Vitrified Tile 600x600', category: 'tiles', unit: 'sqft', currentStock: 3200, minStock: 500 },
    { name: 'ACP Sheet 4mm FR', category: 'acp_panel', unit: 'sqft', currentStock: 580, minStock: 100 },
    { name: 'Aluminium Section 2"', category: 'aluminium', unit: 'meter', currentStock: 420, minStock: 80 },
    { name: 'Interior Emulsion Paint', category: 'paint', unit: 'liter', currentStock: 280, minStock: 100 },
    // Low stock items (alerts)
    { name: 'OPC White Cement', category: 'cement', unit: 'bag', currentStock: 18, minStock: 50 },
    { name: 'Flush Door 7x3 ft', category: 'doors_locks', unit: 'nos', currentStock: 12, minStock: 20 },
    { name: 'Binding Wire', category: 'steel', unit: 'kg', currentStock: 45, minStock: 100 },
  ];
  const materials = await Material.insertMany(matDefs.map(m => ({ ...m, project: project._id })));
  console.log(`📦 Created ${materials.length} inventory items`);

  // ─── ORDERS (30 orders across all statuses) ───────────────────────────────
  const orderDefs = [];

  // Workflow: draft (2), pending_approval (5), approved (3), rejected (3),
  //           sent_to_vendor (4), accepted_by_vendor (3), dispatched (3), delivered (7)
  const statuses = [
    ...Array(2).fill('draft'),
    ...Array(5).fill('pending_approval'),
    ...Array(3).fill('approved'),
    ...Array(3).fill('rejected'),
    ...Array(4).fill('sent_to_vendor'),
    ...Array(3).fill('accepted_by_vendor'),
    ...Array(3).fill('dispatched'),
    ...Array(7).fill('delivered'),
  ];

  for (let i = 0; i < statuses.length; i++) {
    const status    = statuses[i];
    const requestor = pick(roleUsers);
    const role      = requestor.role;
    const cats      = REQUESTOR_ROLES[role]?.cats || ['steel'];
    const vIdx      = VENDOR_CATEGORIES[cats[0]] ?? 0;
    const vendor    = vendors[vIdx] || vendors[0];
    const proj      = pick(allProjects);
    const createdDaysAgo = rand(5, 90);
    const items     = makeItems(cats);

    const order = {
      project: proj._id,
      requestedBy: requestor._id,
      requestorType: role,
      items,
      vendor: vendor._id,
      status,
      priority: pick(['low', 'medium', 'medium', 'high', 'urgent']),
      requiredByDate: daysAgo(rand(-10, 15)),
      remarks: pick([
        'Urgent — floor work pending',
        'Required for slab casting on Floor 3',
        'Running low on site',
        'Contractor waiting for materials',
        'As per drawing BOQ',
        'Monthly replenishment',
        null, null
      ]),
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(createdDaysAgo - 1),
    };

    // Add progressive details based on status
    if (['approved','rejected','sent_to_vendor','accepted_by_vendor','dispatched','delivered'].includes(status)) {
      order.approvalDetails = {
        approvedBy: director?._id,
        approvedAt: daysAgo(createdDaysAgo - rand(1,3)),
        remarks: pick(['Approved — verified with site engineer', 'Approved as per BOQ', 'Approved — priority delivery', null]),
      };
    }
    if (status === 'rejected') {
      order.rejectionDetails = {
        rejectedBy: director?._id,
        rejectedAt: daysAgo(createdDaysAgo - 1),
        reason: pick([
          'Over budget — reduce quantity',
          'Duplicate request already raised',
          'Wrong vendor selected',
          'Pending approval from chairperson',
        ]),
      };
      delete order.approvalDetails;
    }
    if (['sent_to_vendor','accepted_by_vendor','dispatched','delivered'].includes(status)) {
      order.vendorResponseAt = daysAgo(createdDaysAgo - rand(2,5));
      order.vendorRemarks = pick(['Will arrange by tomorrow', 'In stock, confirming dispatch', null]);
    }
    if (['dispatched','delivered'].includes(status)) {
      const driver = pick(DRIVERS);
      order.dispatchDetails = {
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleNumber: driver.vehicle,
        dispatchDate: daysAgo(createdDaysAgo - rand(3,6)),
        estimatedArrival: daysAgo(createdDaysAgo - rand(4,7)),
      };
    }
    if (status === 'delivered') {
      order.deliveryDetails = {
        challanNumber: `CH-2025-${String(rand(1000,9999))}`,
        deliveredAt: daysAgo(createdDaysAgo - rand(5,8)),
        receivedBy: engineer?._id,
        isConfirmed: true,
      };
    }

    orderDefs.push(order);
  }

  // Insert orders one by one so pre-save hook generates order numbers
  const orders = [];
  for (const def of orderDefs) {
    try {
      const o = new Order(def);
      o.isNew = true;
      await o.save();
      orders.push(o);
    } catch(e) { console.log('Order skip:', e.message); }
  }
  console.log(`🛒 Created ${orders.length} orders`);

  // ─── DELIVERIES for delivered orders ─────────────────────────────────────
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const deliveryDocs = deliveredOrders.map(o => ({
    order:         o._id,
    uploadedBy:    engineer?._id || director?._id,
    challanNumber: `CH-2025-${rand(1000, 9999)}`,
    deliveredAt:   o.deliveryDetails?.deliveredAt || daysAgo(rand(2, 20)),
    receivedBy:    engineer?._id,
    isConfirmed:   true,
    confirmedAt:   daysAgo(rand(1, 5)),
    remarks:       pick(['Goods received in good condition', 'Minor damage on 2 items — noted', 'All items verified against challan', null]),
    storeSnapshot: { success: false, error: 'Camera not configured' },
  }));
  const deliveries = await Delivery.insertMany(deliveryDocs);
  console.log(`🚚 Created ${deliveries.length} delivery records`);

  // ─── PAYMENTS for delivered orders ───────────────────────────────────────
  const paymentDefs = [];
  for (const o of deliveredOrders) {
    const total = o.totalEstimatedCost || rand(15000, 200000);
    const isPaid = Math.random() > 0.3;
    if (isPaid) {
      const method = pick(['upi','neft','rtgs','cheque','cash','upi','neft']);
      paymentDefs.push({
        order: o._id,
        vendor: o.vendor,
        project: o.project,
        amount: total,
        method,
        upiTransactionId: method === 'upi' ? `${rand(100000000000, 999999999999)}` : undefined,
        chequeNumber: method === 'cheque' ? `0${rand(10000,99999)}` : undefined,
        neftRef: ['neft','rtgs'].includes(method) ? `NEFT${rand(100000000,999999999)}` : undefined,
        paidAt: daysAgo(rand(1, 20)),
        paidBy: director?._id,
        remarks: pick(['Full payment cleared', 'As per invoice', 'Partial advance + balance', null]),
      });
    }
  }
  if (paymentDefs.length) {
    await Payment.insertMany(paymentDefs);
    console.log(`💰 Created ${paymentDefs.length} payments`);
  }

  // ─── ATTENDANCE (last 30 days) ────────────────────────────────────────────
  const contractors = users.filter(u => u.role?.includes('contractor'));
  const attDefs = [];
  for (let day = 0; day < 30; day++) {
    const date = fmt(daysAgo(day));
    for (const c of contractors) {
      // ~80% attendance rate, skip weekends randomly
      const dayOfWeek = daysAgo(day).getDay();
      if (dayOfWeek === 0 && Math.random() > 0.3) continue; // Sunday mostly off
      if (Math.random() > 0.8) continue; // random absent
      attDefs.push({
        date,
        contractor: c._id,
        contractorName: c.name,
        contractorType: c.role.replace('_contractor',''),
        contractorCompany: c.company || 'N/A',
        project: project._id,
        presentCount: rand(2, 18),
        markedBy: engineer?._id,
        note: Math.random() > 0.85 ? pick(['Half day', 'Overtime', 'Rain delay — partial work', null]) : undefined,
      });
    }
  }
  if (attDefs.length) {
    await Attendance.insertMany(attDefs);
    console.log(`📋 Created ${attDefs.length} attendance records (30 days)`);
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const notifDefs = [];
  const pendingOrders = orders.filter(o => o.status === 'pending_approval').slice(0, 5);
  for (const o of pendingOrders) {
    notifDefs.push({
      recipients: [director._id, chairp?._id].filter(Boolean),
      title: 'Order Approval Required',
      type: 'order_created',
      message: `New order ${o.orderNumber} requires your approval`,
      relatedOrder: o._id,
      readBy: [],
      createdAt: o.createdAt,
    });
  }
  const dispatchedOrders = orders.filter(o => o.status === 'dispatched');
  for (const o of dispatchedOrders) {
    notifDefs.push({
      recipients: [engineer?._id].filter(Boolean),
      title: 'Order Dispatched',
      type: 'order_dispatched',
      message: `Order ${o.orderNumber} has been dispatched — driver en route`,
      relatedOrder: o._id,
      readBy: [],
      createdAt: o.updatedAt,
    });
  }
  // Low stock alerts
  notifDefs.push({
    recipients: [director._id, engineer?._id].filter(Boolean),
    title: 'Low Stock Alert',
    type: 'material_low_stock',
    message: 'OPC White Cement (18 bags) is below minimum stock level (50 bags)',
    readBy: [],
    createdAt: daysAgo(1),
  });
  notifDefs.push({
    recipients: [director._id, engineer?._id].filter(Boolean),
    title: 'Low Stock Alert',
    type: 'material_low_stock',
    message: 'Flush Doors (12 nos) is below minimum stock level (20 nos)',
    readBy: [],
    createdAt: daysAgo(2),
  });
  notifDefs.push({
    recipients: [director._id].filter(Boolean),
    title: 'Payments Recorded',
    type: 'general',
    message: `${paymentDefs.length} payments have been recorded against delivered orders`,
    readBy: [],
    createdAt: daysAgo(1),
  });

  if (notifDefs.length) {
    await Notification.insertMany(notifDefs);
    console.log(`🔔 Created ${notifDefs.length} notifications`);
  }

  // ─── BUDGET entries ──────────────────────────────────────────────────────────
  const budgetDefs = [
    { category: 'civil',      allocatedAmount: 8500000,  description: 'Foundation + structure + slab work' },
    { category: 'plumbing',   allocatedAmount: 1200000,  description: 'Water supply + drainage lines' },
    { category: 'electrical', allocatedAmount: 950000,   description: 'Main panel + wiring + fixtures' },
    { category: 'tiles',      allocatedAmount: 1800000,  description: 'Floor + wall tiles for all units' },
    { category: 'acp',        allocatedAmount: 750000,   description: 'ACP cladding – external facade' },
    { category: 'aluminium',  allocatedAmount: 600000,   description: 'Aluminium windows + sliding doors' },
    { category: 'doors',      allocatedAmount: 480000,   description: 'Main doors + room doors + hardware' },
    { category: 'paint',      allocatedAmount: 560000,   description: 'Internal + external painting' },
    { category: 'material',   allocatedAmount: 3200000,  description: 'Steel, cement, aggregates' },
    { category: 'labour',     allocatedAmount: 2400000,  description: 'All trade labour for project duration' },
    { category: 'equipment',  allocatedAmount: 350000,   description: 'Crane, scaffolding, machinery hire' },
  ];
  for (const proj of allProjects.slice(0, 2)) {
    try {
      const docs = budgetDefs.map(b => ({ ...b, project: proj._id, createdBy: director?._id }));
      await Budget.insertMany(docs, { ordered: false });
    } catch (e) { /* ignore duplicate key on re-seed */ }
  }
  console.log(`💰 Budget entries seeded`);

  // ─── WORK SCHEDULE phases ──────────────────────────────────────────────────
  const today = new Date();
  const dateOffset = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return d; };
  const phaseDefs = [
    { phase: 'foundation',    status: 'completed',   progress: 100, start: -90, end: -60 },
    { phase: 'structure',     status: 'completed',   progress: 100, start: -65, end: -20 },
    { phase: 'plumbing',      status: 'in_progress', progress: 60,  start: -25, end: 20  },
    { phase: 'electrical',    status: 'in_progress', progress: 40,  start: -20, end: 30  },
    { phase: 'tiles',         status: 'not_started', progress: 0,   start: 15,  end: 60  },
    { phase: 'painting',      status: 'not_started', progress: 0,   start: 55,  end: 85  },
    { phase: 'acp_aluminium', status: 'not_started', progress: 0,   start: 40,  end: 90  },
    { phase: 'doors',         status: 'not_started', progress: 0,   start: 80,  end: 100 },
    { phase: 'finishing',     status: 'not_started', progress: 0,   start: 95,  end: 120 },
    { phase: 'handover',      status: 'not_started', progress: 0,   start: 118, end: 130 },
  ];
  for (const proj of allProjects.slice(0, 2)) {
    const existing = await WorkSchedule.countDocuments({ project: proj._id });
    if (existing === 0) {
      const docs = phaseDefs.map(p => ({
        project: proj._id,
        phase: p.phase,
        startDate: dateOffset(p.start),
        endDate:   dateOffset(p.end),
        status:    p.status,
        progress:  p.progress,
        createdBy: director?._id,
      }));
      await WorkSchedule.insertMany(docs);
    }
  }
  console.log(`📅 Work schedule phases seeded`);

  // ─── SITE PHOTOS (placeholder — no actual image files) ────────────────────
  const photoDefs = [
    { floor: 'Ground', workType: 'Civil',      caption: 'Column casting – Grid A',  daysBack: 70 },
    { floor: 'Ground', workType: 'Civil',      caption: 'Beam reinforcement ready',  daysBack: 65 },
    { floor: '1st',    workType: 'Structural', caption: 'Slab shuttering work',      daysBack: 45 },
    { floor: '1st',    workType: 'Plumbing',   caption: 'Concealed pipe laying',     daysBack: 20 },
    { floor: '2nd',    workType: 'Electrical', caption: 'Conduit laying in progress',daysBack: 12 },
    { floor: 'Ground', workType: 'Tiles',      caption: 'Lobby floor tiling – done', daysBack: 5  },
  ];
  for (const proj of allProjects.slice(0, 1)) {
    const existing = await SitePhoto.countDocuments({ project: proj._id });
    if (existing === 0) {
      const docs = photoDefs.map(p => ({
        project:    proj._id,
        url:        `/uploads/site-photos/placeholder-${p.workType.toLowerCase()}.jpg`,
        floor:      p.floor,
        workType:   p.workType,
        caption:    p.caption,
        takenAt:    daysAgo(p.daysBack),
        uploadedBy: engineer?._id,
      }));
      await SitePhoto.insertMany(docs);
    }
  }
  console.log(`📸 Site photo records seeded`);

  console.log('✅ Random demo data seeded successfully!');
  return {
    orders: orders.length,
    payments: paymentDefs.length,
    attendanceRecords: attDefs.length,
    materials: materials.length,
    notifications: notifDefs.length,
  };
};

module.exports = { seedRandom };
