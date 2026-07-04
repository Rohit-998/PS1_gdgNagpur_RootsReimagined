import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password_hash: { type: String }, // Optional for Google SSO users
  googleId: { type: String, unique: true, sparse: true }, // Optional, unique if present
  role: { type: String, enum: ['unassigned', 'consumer', 'pharmacy', 'manufacturer', 'regulator'], default: 'unassigned' },
  // For pharmacy/manufacturer
  organization: { type: String },
  api_key: { type: String, unique: true, sparse: true }, // For programmatic access
  // For manufacturer linking
  manufacturer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  // Status
  active: { type: Boolean, default: true },
  last_login: { type: Date },
}, { timestamps: true });

// Generate API key
userSchema.methods.generateApiKey = function() {
  this.api_key = `mg_${crypto.randomBytes(32).toString('hex')}`;
  return this.api_key;
};

// Hash password using crypto (no bcrypt dependency needed)
userSchema.statics.hashPassword = function(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Verify password
userSchema.statics.verifyPassword = function(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === computedHash;
};

userSchema.index({ email: 1 });
userSchema.index({ api_key: 1 });
userSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
