require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Project = require('../models/Project');
const Vendor = require('../models/Vendor');
const Contractor = require('../models/Contractor');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/constructionapp');
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Vendor.deleteMany({}),
    Contractor.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  const password = 'demo1234';

  // ─── USERS ────────────────────────────────────────────────
  const users = await User.create([
    { name: 'Ramesh Patel',        email: 'chairperson@demo.com',  password, role: 'chairperson',         phone: '9876500001', company: 'Patel Group' },
    { name: 'Suresh Shah',         email: 'director@demo.com',     password, role: 'director',             phone: '9876500002', company: 'Patel Group' },
    { name: 'Mahesh Mehta',        email: 'builder@demo.com',      password, role: 'builder',              phone: '9876500003', company: 'Patel Group' },
    { name: 'Rajesh Kumar',        email: 'engineer@demo.com',     password, role: 'site_engineer',        phone: '9876500004', company: 'Patel Group' },
    // Contractors
    { name: 'Dinesh Civil',        email: 'civil@demo.com',        password, role: 'civil_contractor',     phone: '9876500005', company: 'Dinesh Construction' },
    { name: 'Haresh Plumber',      email: 'plumbing@demo.com',     password, role: 'plumbing_contractor',  phone: '9876500006', company: 'Haresh Plumbing Works' },
    { name: 'Rakesh Painter',      email: 'color@demo.com',        password, role: 'color_contractor',     phone: '9876500007', company: 'Rakesh Paint Works' },
    { name: 'Nilesh Lifts',        email: 'lift@demo.com',         password, role: 'lift_contractor',      phone: '9876500008', company: 'Nilesh Elevators' },
    { name: 'Hitesh Electric',     email: 'electric@demo.com',     password, role: 'electric_contractor',  phone: '9876500009', company: 'Hitesh Electricals' },
    { name: 'Jitesh Tiles',        email: 'tile@demo.com',         password, role: 'tile_contractor',      phone: '9876500010', company: 'Jitesh Tile Works' },
    { name: 'Manish ACP',          email: 'acp@demo.com',          password, role: 'acp_contractor',       phone: '9876500011', company: 'Manish ACP Solutions' },
    { name: 'Kamlesh Aluminium',   email: 'aluminium@demo.com',    password, role: 'aluminium_contractor', phone: '9876500012', company: 'Kamlesh Aluminium Works' },
    { name: 'Vipul Doors',         email: 'doorlock@demo.com',     password, role: 'door_lock_contractor', phone: '9876500013', company: 'Vipul Door & Hardware' },
    // Vendor & Delivery
    { name: 'Steel Vendor Portal', email: 'vendor@demo.com',       password, role: 'vendor',               phone: '9876500014', company: 'Bharat Steel Suppliers' },
    { name: 'Ramji Driver',        email: 'delivery@demo.com',     password, role: 'delivery_operator',    phone: '9876500015' },
  ]);

  const findUser = (email) => users.find(u => u.email === email);
  console.log(`👥 Created ${users.length} users`);

  // ─── VENDORS ──────────────────────────────────────────────
  const vendors = await Vendor.create([
    {
      name: 'Bharat Steel Suppliers',
      email: 'vendor@demo.com',
      phone: '9876500014',
      address: 'Industrial Area, Phase 2, Ahmedabad',
      gst: '24AABCB1234A1ZD',
      contactPerson: 'Bharat Shah',
      materialCategories: ['steel', 'cement'],
      linkedUser: findUser('vendor@demo.com')?._id
    },
    {
      name: 'Shree Bricks & Blocks',
      email: 'bricks@demo.com',
      phone: '9876500020',
      address: 'Kathwada Road, Ahmedabad',
      gst: '24AABCS5678A1ZE',
      contactPerson: 'Shree Patel',
      materialCategories: ['brick_block', 'concrete_rmc', 'cement'],
    },
    {
      name: 'Kavya Plumbing Supplies',
      email: 'plumbsupply@demo.com',
      phone: '9876500021',
      address: 'Ring Road, Surat',
      contactPerson: 'Kavya Desai',
      materialCategories: ['plumbing_pipes_fittings', 'bath_fittings_ceramic'],
    },
    {
      name: 'Bright Electrical Mart',
      email: 'electricmart@demo.com',
      phone: '9876500022',
      address: 'Odhav, Ahmedabad',
      contactPerson: 'Bright Joshi',
      materialCategories: ['electrical_cables', 'electrical_accessories'],
    },
    {
      name: 'Ceramic Palace',
      email: 'ceramicpalace@demo.com',
      phone: '9876500023',
      address: 'Morbi, Gujarat',
      gst: '24AABCP9999A1ZF',
      contactPerson: 'Hemal Patel',
      materialCategories: ['tiles_ceramic', 'bath_fittings_ceramic'],
    },
    {
      name: 'Modern ACP & Aluminium',
      email: 'modernacp@demo.com',
      phone: '9876500024',
      address: 'GIDC Vatva, Ahmedabad',
      contactPerson: 'Ketan Modi',
      materialCategories: ['acp_panels', 'aluminium_glass', 'doors_locks'],
    },
  ]);
  console.log(`🏪 Created ${vendors.length} vendors`);

  // ─── PROJECT ──────────────────────────────────────────────
  const project = await Project.create({
    name: 'Sunrise Residency – Block A',
    description: 'G+7 Residential Building with 56 flats, 2 BHK and 3 BHK configurations.',
    location: 'Sector 12, Gandhinagar, Gujarat',
    status: 'active',
    budget: 45000000,
    startDate: new Date('2025-01-15'),
    expectedEndDate: new Date('2026-12-31'),
    assignedEngineers: [findUser('engineer@demo.com')?._id],
    assignedContractors: [
      findUser('civil@demo.com')?._id,
      findUser('plumbing@demo.com')?._id,
      findUser('electric@demo.com')?._id,
      findUser('tile@demo.com')?._id,
    ],
    createdBy: findUser('director@demo.com')?._id,
  });
  console.log(`🏗️  Created project: ${project.name}`);

  // ─── CONTRACTORS ──────────────────────────────────────────
  const contractors = await Contractor.create([
    { user: findUser('civil@demo.com')?._id,      type: 'civil',      company: 'Dinesh Construction',     license: 'GJ-CIV-2022-001', experience: 15, projects: [project._id] },
    { user: findUser('plumbing@demo.com')?._id,   type: 'plumbing',   company: 'Haresh Plumbing Works',   license: 'GJ-PLB-2022-002', experience: 10, projects: [project._id] },
    { user: findUser('color@demo.com')?._id,      type: 'color',      company: 'Rakesh Paint Works',      experience: 8  },
    { user: findUser('lift@demo.com')?._id,       type: 'lift',       company: 'Nilesh Elevators',        license: 'GJ-LIFT-2023-001', experience: 12 },
    { user: findUser('electric@demo.com')?._id,   type: 'electrical', company: 'Hitesh Electricals',      license: 'GJ-ELC-2022-003', experience: 11, projects: [project._id] },
    { user: findUser('tile@demo.com')?._id,       type: 'tile',       company: 'Jitesh Tile Works',       experience: 7,  projects: [project._id] },
    { user: findUser('acp@demo.com')?._id,        type: 'acp',        company: 'Manish ACP Solutions',    experience: 9  },
    { user: findUser('aluminium@demo.com')?._id,  type: 'aluminium',  company: 'Kamlesh Aluminium Works', experience: 13 },
    { user: findUser('doorlock@demo.com')?._id,   type: 'door_lock',  company: 'Vipul Door & Hardware',   experience: 6  },
  ]);
  console.log(`👷 Created ${contractors.length} contractors`);

  console.log('\n🎉 Seed completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Login Credentials (password: demo1234)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Chairperson  : chairperson@demo.com');
  console.log('Director     : director@demo.com');
  console.log('Builder      : builder@demo.com');
  console.log('Site Engineer: engineer@demo.com');
  console.log('Civil Cont.  : civil@demo.com');
  console.log('Plumbing     : plumbing@demo.com');
  console.log('Color        : color@demo.com');
  console.log('Lift         : lift@demo.com');
  console.log('Electric     : electric@demo.com');
  console.log('Tile         : tile@demo.com');
  console.log('ACP          : acp@demo.com');
  console.log('Aluminium    : aluminium@demo.com');
  console.log('Door & Lock  : doorlock@demo.com');
  console.log('Vendor       : vendor@demo.com');
  console.log('Delivery Op. : delivery@demo.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
