// ================================================================
//  CONFIG — Global state & constants
// ================================================================
const API = 'http://localhost:8081/api';
let token = localStorage.getItem('ei_token');
let userId = localStorage.getItem('ei_userId');
let username = localStorage.getItem('ei_username');
let allExpenses = [];
let pieChart = null, barChart = null, analyticsPieChart = null, analyticsBarChart = null;
let scannedData = null;
let currentReceiptBase64 = null;
let splits = [];
try {
  splits = JSON.parse(localStorage.getItem('ei_splits') || '[]');
} catch (e) {
  console.error('Failed to parse splits from localStorage:', e);
}
