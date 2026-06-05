// ================================================================
//  BUDGET — Set and track monthly category limits
// ================================================================
async function submitBudget() {
  const category = $('bud-category').value,
        monthlyLimit = parseFloat($('bud-limit').value),
        month = parseInt($('bud-month').value),
        year = parseInt($('bud-year').value);
  if (!category || !monthlyLimit) { toast('Fill in all fields', 'error'); return; }
  try {
    const res = await apiFetch('/budgets', { method: 'POST', body: JSON.stringify({ category, monthlyLimit, month, year }) });
    if (!res.ok) throw new Error('Failed');
    closePanel('overlay-budget');
    toast('Budget set!', 'success');
    loadBudget();
  } catch (e) { toast('Failed', 'error'); }
}

async function loadBudget() {
  const month = $('budget-month').value, year = $('budget-year').value;
  try {
    const res = await apiFetch(`/budgets?month=${month}&year=${year}`);
    const data = await res.json();
    if (!data.length) {
      $('budget-grid').innerHTML = `<div class="empty-state" style="grid-column:span 3"><div class="empty-icon">◇</div><div class="empty-text">No budgets set.<br/>Click "+ Set Budget" to get started.</div></div>`;
      return;
    }
    $('budget-grid').innerHTML = data.map((b, i) => {
      const pct = Math.min(b.percentage || 0, 100).toFixed(0);
      const fc = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe';
      return `<div class="budget-card" style="animation-delay:${i * 0.05}s">
        <div class="budget-cat"><span class="category-badge ${getCategoryClass(b.category)}">${b.category}</span>${b.exceeded ? '<span style="font-size:0.7rem;color:var(--red)">⚠ Exceeded</span>' : ''}</div>
        <div class="budget-amounts"><span>Spent: <strong class="budget-spent">₹${(b.spent || 0).toLocaleString('en-IN')}</strong></span><span>Limit: ₹${b.limit.toLocaleString('en-IN')}</span></div>
        <div class="progress-bar"><div class="progress-fill ${fc}" style="width:${pct}%"></div></div>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:0.5rem;text-align:right">${pct}% used · ₹${(b.remaining || 0).toLocaleString('en-IN')} remaining</div>
      </div>`;
    }).join('');
  } catch (e) { toast('Could not load budgets', 'error'); }
}
