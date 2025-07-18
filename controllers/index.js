const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const dbConnect = process.env.MONGODB_CONNECT;

// MongoDB 연결
mongoose.connect(dbConnect, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'projectBoard-editor',
});

// 이메일 전송기
const transporter = nodemailer.createTransport({
  service: 'gmail', // 실제 서비스에 맞게 변경 필요
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 공통 유틸리티 함수들
const utils = {
  // 이메일 전송 함수
  sendEmail: async (to, subject, text) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
      });
      return true;
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      return false;
    }
  },

  // 2차 인증 코드 생성
  generate2faCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // 임시 비밀번호 생성
  generateTempPassword: () => {
    return Math.random().toString(36).slice(-8);
  },

  // 권한 체크 함수
  checkPermission: (userRole, requiredRole = 'general') => {
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    return true; // general 권한은 모든 로그인 사용자
  },

  // 파일 삭제 함수
  deleteFile: (filePath) => {
    const fs = require('fs');
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
    }
    return false;
  }
};

module.exports = {
  transporter,
  utils
};
