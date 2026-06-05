// ================================================================
//  UTILS — Helper functions
// ================================================================
const $ = id => document.getElementById(id);

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function getCategoryClass(cat) {
  const m = {
    Food: 'badge-food',
    Transport: 'badge-transport',
    Shopping: 'badge-shopping',
    Entertainment: 'badge-entertainment',
    Bills: 'badge-bills',
    Education: 'badge-education'
  };
  return m[cat] || 'badge-other';
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
