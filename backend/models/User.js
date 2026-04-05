const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: [
      'chairperson', 'director', 'builder', 'site_engineer',
      'civil_contractor', 'plumbing_contractor', 'color_contractor',
      'lift_contractor', 'electric_contractor', 'tile_contractor',
      'acp_contractor', 'aluminium_contractor', 'door_lock_contractor',
      'vendor', 'delivery_operator', 'admin'
    ],
    required: true
  },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
