// ================================================================
//  AI INSIGHTS — Smart spending analysis
// ================================================================
async function loadInsights() {
  const month = $('insights-month').value, year = $('insights-year').value;
  $('insights-container').innerHTML = '<div style="display:flex;align-items:center;gap:0.8rem;padding:1.5rem;color:var(--muted);font-size:0.85rem"><div class="spinner" style="margin:0"></div>Analysing your spending patterns...</div>';
  try {
    const [summaryRes, expensesRes] = await Promise.all([
      apiFetch(`/expenses/summary?month=${month}&year=${year}`),
      apiFetch('/expenses')
    ]);
    const summary = await summaryRes.json();
    const expenses = await expensesRes.json();
    const insights = generateInsights(summary.categoryBreakdown || {}, summary.totalSpent || 0, summary.dailyBreakdown || {}, expenses, parseInt(month), parseInt(year));
    renderInsights(insights);
  } catch (e) {
    $('insights-container').innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><div class="empty-text">Could not generate insights</div></div>';
  }
}

function generateInsights(cat, total, daily, allExp, month, year) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const insights = [];

  insights.push({
    icon: '💰', title: 'Monthly Overview',
    text: `You spent a total of <span class="insight-highlight">₹${total.toLocaleString('en-IN')}</span> in ${months[month - 1]} ${year} across <span class="insight-highlight">${Object.keys(cat).length} categories</span>.`
  });

  if (Object.keys(cat).length > 0) {
    const top = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];
    const pct = ((top[1] / total) * 100).toFixed(1);
    insights.push({
      icon: '🏆', title: 'Biggest Spend',
      text: `Your highest spending category is <span class="insight-highlight">${top[0]}</span> at <span class="insight-highlight">₹${top[1].toLocaleString('en-IN')}</span>, which is <span class="insight-highlight">${pct}%</span> of your total.`
    });
  }

  const daysWithSpend = Object.keys(daily).length;
  if (daysWithSpend > 0) {
    const avg = (total / daysWithSpend).toFixed(0);
    const maxDay = Object.entries(daily).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      icon: '📅', title: 'Daily Patterns',
      text: `You spent on <span class="insight-highlight">${daysWithSpend} days</span> with an average of <span class="insight-highlight">₹${parseInt(avg).toLocaleString('en-IN')}/day</span>. Highest spending day was <span class="insight-highlight">Day ${maxDay[0]}</span> with ₹${maxDay[1].toLocaleString('en-IN')}.`
    });
  }

  if (Object.keys(cat).length >= 3) {
    const top3 = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, a]) => `${c} (₹${a.toLocaleString('en-IN')})`).join(', ');
    insights.push({
      icon: '📊', title: 'Top 3 Categories',
      text: `Your top spending categories: <span class="insight-highlight">${top3}</span>. Review these areas to cut back.`
    });
  }

  const foodSpend = cat['Food'] || 0;
  if (foodSpend > 0 && total > 0) {
    const fp = ((foodSpend / total) * 100).toFixed(0);
    insights.push({
      icon: '💡', title: 'Saving Tip',
      text: fp > 40
        ? `Food spending is <span class="insight-highlight">${fp}%</span> of total. Cooking at home could save up to <span class="insight-highlight">₹${Math.round(foodSpend * 0.3).toLocaleString('en-IN')}/month</span>.`
        : `Food spending is a healthy <span class="insight-highlight">${fp}%</span> of total. Great balance!`
    });
  }

  return insights;
}

function renderInsights(insights) {
  if (!insights.length) {
    $('insights-container').innerHTML = '<div class="empty-state"><div class="empty-icon">✦</div><div class="empty-text">Add expenses to generate insights</div></div>';
    return;
  }
  $('insights-container').innerHTML = insights.map((ins, i) =>
    `<div class="insight-card" style="animation-delay:${i * 0.1}s"><div class="insight-header"><span class="insight-icon">${ins.icon}</span><span class="insight-title">${ins.title}</span></div><p class="insight-text">${ins.text}</p></div>`
  ).join('');
}
