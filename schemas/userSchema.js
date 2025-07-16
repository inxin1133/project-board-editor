const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true },
  name: String,
  phone: String,
  is2faVerified: { type: Boolean, default: false },
  tempPassword: String,
  state: { type: String, default: 'temp' },
  role: { type: String, default: 'general' },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date },
  deleteAt: { type: Date },
  statusMessage: { type: String, default: '' },
  lastLogin: { type: Date },
  profileImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User; 