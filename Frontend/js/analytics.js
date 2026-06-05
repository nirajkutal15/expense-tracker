// ================================================================
//  ANALYTICS — Monthly spending analysis
// ================================================================
async function loadAnalytics() {
  const month = $('analytics-month').value, year = $('analytics-year').value;
  try {
    const res = await apiFetch(`/expenses/summary?month=${month}&year=${year}`);
    const summary = await res.json();
    const cat = summary.categoryBreakdown || {},
          daily = summary.dailyBreakdown || {},
          total = summary.totalSpent || 0;

    renderPieChart('analytics-pie-chart', cat, analyticsPieChart, c => analyticsPieChart = c);
    renderBarChart('analytics-bar-chart', daily, analyticsBarChart, c => analyticsBarChart = c);

    $('analytics-breakdown').innerHTML = Object.entries(cat).sort((a, b) => b[1] - a[1]).map(([c, amt]) => {
      const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
      const fc = pct >= 80 ? 'danger' : pct >= 60 ? 'warning' : 'safe';
      return `<div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem">
          <span class="category-badge ${getCategoryClass(c)}">${c}</span>
          <span style="font-size:0.85rem;font-weight:500">₹${amt.toLocaleString('en-IN')} (${pct}%)</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${fc}" style="width:${pct}%"></div></div>
      </div>`;
    }).join('') || '<div style="color:var(--muted);font-size:0.85rem;padding:1rem">No data</div>';
  } catch (e) { toast('Could not load analytics', 'error'); }
}
