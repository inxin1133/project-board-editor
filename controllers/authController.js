const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const dbConnect = process.env.MONGODB_CONNECT;

// MongoDB 연결
mongoose.connect( dbConnect, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'projectBoard',
});

// User 스키마
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  phone: String,
  is2faVerified: { type: Boolean, default: false },
  tempPassword: String,
});
const User = mongoose.model('User', userSchema, 'users');

// 이메일 전송기
const transporter = nodemailer.createTransport({
  service: 'gmail', // 실제 서비스에 맞게 변경 필요
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.signup = async (req, res) => {
  // 회원가입 처리
};

exports.verify2fa = async (req, res) => {
  // 2차 인증 처리
};

exports.login = async (req, res) => {
  // 로그인 처리
};

exports.findId = async (req, res) => {
  // 아이디 찾기 처리
};

exports.findPw = async (req, res) => {
  // 비밀번호 찾기 처리
}; 