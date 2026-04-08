require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User       = require('../models/User');
const Project    = require('../models/Project');
const Vendor     = require('../models/Vendor');
const Contractor = require('../models/Contractor');
const Store      = require('../models/Store');

// ─── Exported function: uses existing Mongoose connection ─────────────────────
const seedData = async () => {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('ℹ️  Demo data already present, skipping seed');
    return;
  }

  console.log('🌱 Seeding demo data...');

  const password = 'demo1234';

  // ─── USERS ────────────────────────────────────────────────────────────────
  const users = await User.create([
    // ── Management ──
    { name: 'Ramesh Patel',        email: 'chairperson@nirman.com', password, role: 'chairperson',         phone: '9876500001', company: 'Nirmaan Group' },
    { name: 'Pratik Patel',        email: 'pratik@nirman.com',      password, role: 'director',             phone: '9876500002', company: 'Nirmaan Group' },
    { name: 'Krupesh Patel',       email: 'krupesh@nirman.com',     password, role: 'director',             phone: '9876500003', company: 'Nirmaan Group' },
    { name: 'Mahesh Mehta',        email: 'builder@nirman.com',     password, role: 'builder',              phone: '9876500004', company: 'Nirmaan Group' },
    // ── Site Engineers ──
    { name: 'Rinko Shah',          email: 'rinko@nirman.com',       password, role: 'site_engineer',        phone: '9876500005', company: 'Nirmaan Group' },
    // ── Contractors ──
    { name: 'Dinesh Civil',        email: 'civil@nirman.com',       password, role: 'civil_contractor',     phone: '9876500006', company: 'Dinesh Construction' },
    { name: 'Haresh Plumber',      email: 'plumbing@nirman.com',    password, role: 'plumbing_contractor',  phone: '9876500007', company: 'Haresh Plumbing Works' },
    { name: 'Rakesh Painter',      email: 'color@nirman.com',       password, role: 'color_contractor',     phone: '9876500008', company: 'Rakesh Paint Works' },
    { name: 'Nilesh Lifts',        email: 'lift@nirman.com',        password, role: 'lift_contractor',      phone: '9876500009', company: 'Nilesh Elevators' },
    { name: 'Hitesh Electric',     email: 'electric@nirman.com',    password, role: 'electric_contractor',  phone: '9876500010', company: 'Hitesh Electricals' },
    { name: 'Jitesh Tiles',        email: 'tile@nirman.com',        password, role: 'tile_contractor',      phone: '9876500011', company: 'Jitesh Tile Works' },
    { name: 'Manish ACP',          email: 'acp@nirman.com',         password, role: 'acp_contractor',       phone: '9876500012', company: 'Manish ACP Solutions' },
    { name: 'Kamlesh Aluminium',   email: 'aluminium@nirman.com',   password, role: 'aluminium_contractor', phone: '9876500013', company: 'Kamlesh Aluminium Works' },
    { name: 'Vipul Doors',         email: 'doorlock@nirman.com',    password, role: 'door_lock_contractor', phone: '9876500014', company: 'Vipul Door & Hardware' },
    // ── Vendors (Suppliers) ──
    { name: 'Bharat Steel Suppliers',    email: 'supplier1@nirman.com',  password, role: 'vendor', phone: '9876500015', company: 'Bharat Steel Suppliers' },
    { name: 'Shree Bricks & Blocks',     email: 'supplier2@nirman.com',  password, role: 'vendor', phone: '9876500016', company: 'Shree Bricks & Blocks' },
    { name: 'Kavya Plumbing Supplies',   email: 'supplier3@nirman.com',  password, role: 'vendor', phone: '9876500017', company: 'Kavya Plumbing Supplies' },
    { name: 'Bright Electrical Mart',    email: 'supplier4@nirman.com',  password, role: 'vendor', phone: '9876500018', company: 'Bright Electrical Mart' },
    { name: 'Ceramic Palace',            email: 'supplier5@nirman.com',  password, role: 'vendor', phone: '9876500019', company: 'Ceramic Palace' },
    { name: 'Modern ACP & Aluminium',    email: 'supplier6@nirman.com',  password, role: 'vendor', phone: '9876500020', company: 'Modern ACP & Aluminium' },
    // ── Delivery ──
    { name: 'Ramji Driver',        email: 'delivery@nirman.com',    password, role: 'delivery_operator', phone: '9876500021' },
  ]);

  const findUser = (email) => users.find(u => u.email === email);
  console.log(`👥 Created ${users.length} users`);

  // ─── VENDORS ──────────────────────────────────────────────────────────────
  const vendors = await Vendor.create([
    {
      name: 'Bharat Steel Suppliers',
      email: 'bharat@bharatsteel.com',
      phone: '9876500015',
      address: 'Industrial Area, Phase 2, Ahmedabad',
      gst: '24AABCB1234A1ZD',
      contactPerson: 'Bharat Shah',
      materialCategories: ['steel', 'cement'],
      linkedUser: findUser('supplier1@nirman.com')?._id,
    },
    {
      name: 'Shree Bricks & Blocks',
      email: 'contact@shreebricks.com',
      phone: '9876500016',
      address: 'Kathwada Road, Ahmedabad',
      gst: '24AABCS5678A1ZE',
      contactPerson: 'Shree Patel',
      materialCategories: ['brick_block', 'concrete_rmc', 'cement'],
      linkedUser: findUser('supplier2@nirman.com')?._id,
    },
    {
      name: 'Kavya Plumbing Supplies',
      email: 'info@kavyaplumbing.com',
      phone: '9876500017',
      address: 'Ring Road, Surat',
      contactPerson: 'Kavya Desai',
      materialCategories: ['plumbing_pipes_fittings', 'bath_fittings_ceramic'],
      linkedUser: findUser('supplier3@nirman.com')?._id,
    },
    {
      name: 'Bright Electrical Mart',
      email: 'sales@brightelectrical.com',
      phone: '9876500018',
      address: 'Odhav, Ahmedabad',
      contactPerson: 'Bright Joshi',
      materialCategories: ['electrical_cables', 'electrical_accessories'],
      linkedUser: findUser('supplier4@nirman.com')?._id,
    },
    {
      name: 'Ceramic Palace',
      email: 'orders@ceramicpalace.com',
      phone: '9876500019',
      address: 'Morbi, Gujarat',
      gst: '24AABCP9999A1ZF',
      contactPerson: 'Hemal Patel',
      materialCategories: ['tiles_ceramic', 'bath_fittings_ceramic'],
      linkedUser: findUser('supplier5@nirman.com')?._id,
    },
    {
      name: 'Modern ACP & Aluminium',
      email: 'info@modernacp.com',
      phone: '9876500020',
      address: 'GIDC Vatva, Ahmedabad',
      contactPerson: 'Ketan Modi',
      materialCategories: ['acp_panels', 'aluminium_glass', 'doors_locks'],
      linkedUser: findUser('supplier6@nirman.com')?._id,
    },
  ]);
  console.log(`🏪 Created ${vendors.length} vendors`);

  // ─── PROJECT ──────────────────────────────────────────────────────────────
  const project = await Project.create({
    name: 'Sunrise Residency – Block A',
    description: 'G+7 Residential Building with 56 flats, 2 BHK and 3 BHK configurations.',
    location: 'Sector 12, Gandhinagar, Gujarat',
    status: 'active',
    budget: 45000000,
    startDate: new Date('2025-01-15'),
    expectedEndDate: new Date('2026-12-31'),
    assignedEngineers:   [findUser('rinko@nirman.com')?._id],
    assignedContractors: [
      findUser('civil@nirman.com')?._id,
      findUser('plumbing@nirman.com')?._id,
      findUser('electric@nirman.com')?._id,
      findUser('tile@nirman.com')?._id,
    ],
    createdBy: findUser('pratik@nirman.com')?._id,
  });
  console.log(`🏗️  Created project: ${project.name}`);

  // ─── CONTRACTORS ──────────────────────────────────────────────────────────
  const contractors = await Contractor.create([
    { user: findUser('civil@nirman.com')?._id,      type: 'civil',      company: 'Dinesh Construction',     license: 'GJ-CIV-2022-001',  experience: 15, projects: [project._id] },
    { user: findUser('plumbing@nirman.com')?._id,   type: 'plumbing',   company: 'Haresh Plumbing Works',   license: 'GJ-PLB-2022-002',  experience: 10, projects: [project._id] },
    { user: findUser('color@nirman.com')?._id,      type: 'color',      company: 'Rakesh Paint Works',      experience: 8  },
    { user: findUser('lift@nirman.com')?._id,       type: 'lift',       company: 'Nilesh Elevators',        license: 'GJ-LIFT-2023-001', experience: 12 },
    { user: findUser('electric@nirman.com')?._id,   type: 'electrical', company: 'Hitesh Electricals',      license: 'GJ-ELC-2022-003',  experience: 11, projects: [project._id] },
    { user: findUser('tile@nirman.com')?._id,       type: 'tile',       company: 'Jitesh Tile Works',       experience: 7,  projects: [project._id] },
    { user: findUser('acp@nirman.com')?._id,        type: 'acp',        company: 'Manish ACP Solutions',    experience: 9  },
    { user: findUser('aluminium@nirman.com')?._id,  type: 'aluminium',  company: 'Kamlesh Aluminium Works', experience: 13 },
    { user: findUser('doorlock@nirman.com')?._id,   type: 'door_lock',  company: 'Vipul Door & Hardware',   experience: 6  },
  ]);
  console.log(`👷 Created ${contractors.length} contractors`);

  // ─── STORES (with placeholder camera config — ready for real IP) ──────────
  const stores = await Store.create([
    {
      name: 'Steel Yard',
      description: 'Open yard for steel bars, TMT, binding wire',
      location: 'North Corner, Site Entrance',
      storeType: 'open',
      materialCategories: ['steel', 'aggregate_sand'],
      project: project._id,
      camera: {
        enabled:  false,       // Set to true when real camera is installed
        brand:    'hikvision',
        ip:       '192.168.1.101',
        port:     80,
        username: 'admin',
        password: 'admin123',  // Update with actual camera password
        channel:  1,
      },
    },
    {
      name: 'Cement Godown',
      description: 'Semi-covered storage for cement bags, concrete blocks',
      location: 'West Side, Near Mixer',
      storeType: 'semi_open',
      materialCategories: ['cement', 'brick_block', 'concrete_rmc'],
      project: project._id,
      camera: {
        enabled:  false,
        brand:    'hikvision',
        ip:       '192.168.1.102',
        port:     80,
        username: 'admin',
        password: 'admin123',
        channel:  1,
      },
    },
    {
      name: 'Plumbing & Electrical Store',
      description: 'Locked indoor room for plumbing, electrical, tiles, ACP materials',
      location: 'Ground Floor, Room No. 3',
      storeType: 'closed',
      materialCategories: [
        'plumbing_pipes_fittings', 'bath_fittings_ceramic',
        'electrical_cables', 'electrical_accessories',
        'tiles_ceramic', 'acp_panels', 'aluminium_glass', 'doors_locks',
      ],
      project: project._id,
      camera: {
        enabled:  false,
        brand:    'cpplus',
        ip:       '192.168.1.103',
        port:     80,
        username: 'admin',
        password: 'admin123',
        channel:  1,
      },
    },
  ]);
  console.log(`🏪 Created ${stores.length} stores (cameras ready — enable after installation)`);

  console.log('✅ Demo data seeded successfully!');
};

module.exports = { seedData };

// ─── Standalone runner (npm run seed) ─────────────────────────────────────────
if (require.main === module) {
  const connectDB = async () => {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/constructionapp';
    if (!uri || uri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('⚡ Using in-memory MongoDB');
      } catch {}
    }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  };

  const run = async () => {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Vendor.deleteMany({}),
      Contractor.deleteMany({}),
      Store.deleteMany({}),
    ]);
    await seedData();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' Nirmaan – Demo Login Credentials  (password: demo1234)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MANAGEMENT');
    console.log('  Chairperson    : chairperson@nirman.com');
    console.log('  Director 1     : pratik@nirman.com       (Pratik Patel)');
    console.log('  Director 2     : krupesh@nirman.com      (Krupesh Patel)');
    console.log('  Builder        : builder@nirman.com');
    console.log('SITE');
    console.log('  Engineer 1     : rinko@nirman.com        (Rinko Shah)');
    console.log('CONTRACTORS');
    console.log('  Civil          : civil@nirman.com');
    console.log('  Plumbing       : plumbing@nirman.com');
    console.log('  Color/Paint    : color@nirman.com');
    console.log('  Lift           : lift@nirman.com');
    console.log('  Electrical     : electric@nirman.com');
    console.log('  Tile           : tile@nirman.com');
    console.log('  ACP            : acp@nirman.com');
    console.log('  Aluminium      : aluminium@nirman.com');
    console.log('  Door & Lock    : doorlock@nirman.com');
    console.log('SUPPLIERS');
    console.log('  Supplier 1     : supplier1@nirman.com    (Bharat Steel Suppliers)');
    console.log('  Supplier 2     : supplier2@nirman.com    (Shree Bricks & Blocks)');
    console.log('  Supplier 3     : supplier3@nirman.com    (Kavya Plumbing Supplies)');
    console.log('  Supplier 4     : supplier4@nirman.com    (Bright Electrical Mart)');
    console.log('  Supplier 5     : supplier5@nirman.com    (Ceramic Palace)');
    console.log('  Supplier 6     : supplier6@nirman.com    (Modern ACP & Aluminium)');
    console.log('DELIVERY');
    console.log('  Delivery Op.   : delivery@nirman.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  };

  run().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
}
