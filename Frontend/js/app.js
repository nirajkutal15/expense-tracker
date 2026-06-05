// ================================================================
//  APP — Initialization, navigation, window.onload
// ================================================================
function showApp() {
  $('screen-auth').classList.remove('active');
  $('screen-app').classList.add('active');
  $('sidebar-username').textContent = username;
  $('dashboard-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('exp-date').value = new Date().toISOString().split('T')[0];

  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  ['dash-month', 'analytics-month', 'budget-month', 'insights-month'].forEach(id => { if ($(id)) $(id).value = m; });
  ['dash-year', 'analytics-year', 'budget-year', 'insights-year'].forEach(id => { if ($(id)) $(id).value = y; });

  loadDashboard();
}

// ================================================================
//  NAVIGATION
// ================================================================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const loaders = { expenses: loadAllExpenses, analytics: loadAnalytics, budget: loadBudget, insights: loadInsights, split: loadSplits };
  loaders[page]?.();
}

function populateYearSelects() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  const selects = ['dash-year', 'analytics-year', 'budget-year', 'insights-year', 'bud-year'];
  selects.forEach(id => {
    const el = $(id);
    if (el) {
      el.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      el.value = currentYear;
    }
  });
}

// ================================================================
//  BOOTSTRAP
// ================================================================
window.onload = () => {
  populateYearSelects();
  if (localStorage.getItem('ei_theme') === 'light') {
    document.body.classList.add('light');
    const t = $('theme-toggle');
    if (t) t.innerHTML = '<span class="nav-icon">🌙</span>Dark Mode';
  }
  if (token && userId) showApp();
};
