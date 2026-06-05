// ================================================================
//  DASHBOARD — Stats, charts, recent expenses
// ================================================================
async function loadDashboard() {
  const month = $('dash-month').value, year = $('dash-year').value;
  try {
    const [summaryRes, expensesRes] = await Promise.all([
      apiFetch(`/expenses/summary?month=${month}&year=${year}`),
      apiFetch('/expenses')
    ]);
    const summary = await summaryRes.json();
    const expenses = await expensesRes.json();
    allExpenses = expenses;

    const total = summary.totalSpent || 0,
          cat = summary.categoryBreakdown || {},
          daily = summary.dailyBreakdown || {};

    const selectedMonthStr = String(month).padStart(2, '0');
    const monthlyExpenses = expenses.filter(e => {
      if (!e.date) return false;
      const parts = e.date.split('-');
      return parts[0] === year && parts[1] === selectedMonthStr;
    });

    $('stat-total').textContent = `₹${total.toLocaleString('en-IN')}`;
    $('stat-count').textContent = monthlyExpenses.length;
    const days = Object.keys(daily).length;
    $('stat-avg').textContent = `₹${days > 0 ? Math.round(total / days).toLocaleString('en-IN') : 0}`;
    const topCat = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];
    $('stat-top').textContent = topCat ? topCat[0] : '—';

    renderPieChart('pie-chart', cat, pieChart, c => pieChart = c);
    renderBarChart('bar-chart', daily, barChart, c => barChart = c);
    renderExpenseRows('recent-expenses-body', [...monthlyExpenses].reverse().slice(0, 5), false);
  } catch (e) {
    toast('Could not load dashboard. Is your backend running?', 'error');
  }
}
