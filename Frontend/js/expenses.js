// ================================================================
//  EXPENSES — CRUD, filtering, rendering, CSV export
// ================================================================
async function loadAllExpenses() {
  try {
    const res = await apiFetch('/expenses');
    allExpenses = await res.json();
    $('expense-count-label').textContent = `${allExpenses.length} total expenses`;
    renderExpenseRows('all-expenses-body', allExpenses, true);
  } catch (e) { toast('Could not load expenses', 'error'); }
}

function applyFilters() {
  const cat = $('filter-category').value,
        from = $('filter-from').value,
        to = $('filter-to').value;
  let f = [...allExpenses];
  if (cat) f = f.filter(e => e.category === cat);
  if (from) f = f.filter(e => e.date >= from);
  if (to) f = f.filter(e => e.date <= to);
  renderExpenseRows('all-expenses-body', f, true);
}

function clearFilters() {
  $('filter-category').value = '';
  $('filter-from').value = '';
  $('filter-to').value = '';
  renderExpenseRows('all-expenses-body', allExpenses, true);
}

function renderExpenseRows(tbodyId, expenses, showDelete) {
  if (!expenses.length) {
    $(tbodyId).innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">No expenses found</td></tr>`;
    return;
  }
  $(tbodyId).innerHTML = expenses.map(e => `
    <tr>
      <td>${e.description || '—'}</td>
      <td><span class="category-badge ${getCategoryClass(e.category)}">${e.category}</span></td>
      <td style="color:var(--muted);font-size:0.8rem">${formatDate(e.date)}</td>
      <td class="amount-cell">₹${(e.amount || 0).toLocaleString('en-IN')}</td>
      ${showDelete ? `<td><button class="btn btn-danger-sm" onclick="deleteExpense(${e.id})">Delete</button></td>` : '<td></td>'}
    </tr>`).join('');
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
    toast('Deleted', 'success');
    loadAllExpenses();
    loadDashboard();
  } catch (e) { toast('Failed', 'error'); }
}

async function submitExpense() {
  const amount = parseFloat($('exp-amount').value),
        category = $('exp-category').value,
        description = $('exp-description').value.trim(),
        date = $('exp-date').value;
  if (!amount || !category || !date) { toast('Fill in all required fields', 'error'); return; }
  try {
    const res = await apiFetch('/expenses', { method: 'POST', body: JSON.stringify({ amount, category, description, date }) });
    if (!res.ok) throw new Error('Failed');
    closePanel('overlay-expense');
    toast(`₹${amount} added to ${category}`, 'success');
    $('exp-amount').value = ''; $('exp-category').value = ''; $('exp-description').value = '';
    loadAllExpenses();
    loadDashboard();
  } catch (e) { toast('Failed to add expense', 'error'); }
}

function exportCSV() {
  apiFetch('/expenses/export/csv')
    .then(r => r.blob()).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click();
      window.URL.revokeObjectURL(url);
      toast('CSV downloaded!', 'success');
    }).catch(() => toast('Export failed', 'error'));
}
