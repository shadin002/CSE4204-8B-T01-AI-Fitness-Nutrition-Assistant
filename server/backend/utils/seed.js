require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured');
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDB();

  // Bootstrap only. Once an administrator exists, never overwrite its
  // name, email or password from environment variables. This keeps
  // later Account Settings changes from being undone by npm run seed.
  const existingAdmin = await User.findOne({ role: 'admin' }).select('name email role');
  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
    await mongoose.connection.close();
    return;
  }

  const emailOwner = await User.findOne({ email }).select('email role');
  if (emailOwner) {
    throw new Error(`ADMIN_EMAIL is already used by a non-admin account: ${email}`);
  }

  await User.create({ name, email, password, role: 'admin' });
  console.log(`Admin created: ${email}`);
  await mongoose.connection.close();
}

seedAdmin().catch(async (err) => {
  console.error(`Admin seed failed: ${err.message}`);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});