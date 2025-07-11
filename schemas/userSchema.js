const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  phone: String,
  is2faVerified: { type: Boolean, default: false },
  tempPassword: String,
  state: { type: String, default: 'temp' },
  role: { type: String, default: 'general' },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date },
  deleteAt: { type: Date },
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User; 