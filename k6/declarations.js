import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Tăng dần lên 20 users
    { duration: '1m', target: 20 },  // Duy trì 20 users trong 1 phút
    { duration: '30s', target: 0 },  // Giảm dần về 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests phải hoàn thành trong 500ms
    http_req_failed: ['rate<0.01'],   // Tỉ lệ lỗi phải dưới 1%
  },
};

const BASE_URL = 'http://localhost:4000/api';
let authToken;

export function setup() {
  // Login để lấy token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'staff@example.com',
    password: 'password123'
  });
  authToken = loginRes.json('token');
  return authToken;
}

export default function(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Test API lấy danh sách kê khai
  const listRes = http.get(`${BASE_URL}/declarations`, params);
  check(listRes, {
    'declarations list status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });

  // Test API tạo kê khai mới
  const declaration = {
    object_type: 'HGD',
    bhxh_code: '1234567890',
    full_name: 'Test User',
    birth_date: '1990-01-01',
    gender: 'Nam',
    cccd: '123456789012',
    phone_number: '0123456789',
    receipt_date: '2024-01-01',
    receipt_number: '1234567',
    new_card_effective_date: '2024-01-01',
    months: '12',
    plan: 'TM',
    commune: 'Test Commune',
    hamlet: 'Test Hamlet',
    participant_number: '1',
    hospital_code: 'BV001'
  };

  const createRes = http.post(
    `${BASE_URL}/declarations`,
    JSON.stringify(declaration),
    params
  );

  check(createRes, {
    'create declaration status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500
  });

  sleep(1);
} 