const mongoose = require('mongoose');
const path = require('path');
const fs   = require('fs');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use MongoMemoryServer if no URI given OR if pointing to localhost (no real Mongo installed)
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '..', 'data', 'db');
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

      try {
        const mongod = await MongoMemoryServer.create({
          instance: { dbPath, storageEngine: 'wiredTiger' },
        });
        uri = mongod.getUri();
        console.log('💾 Persistent local MongoDB at backend/data/db/');
      } catch (memErr) {
        // wiredTiger persistence failed (permissions or version) — fall back to in-memory
        console.warn('⚠️  Persistent DB failed, falling back to in-memory:', memErr.message);
        const { MongoMemoryServer: MMS2 } = require('mongodb-memory-server');
        const mongod = await MMS2.create();
        uri = mongod.getUri();
        console.log('⚡ Using in-memory MongoDB (data resets on restart)');
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
