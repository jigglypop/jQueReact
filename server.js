const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// WASM 파일의 MIME 타입 설정
app.use((req, res, next) => {
  if (req.url.endsWith('.wasm')) {
    res.type('application/wasm');
  }
  next();
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});