// ================================================================
//  THEME — Dark/Light mode toggle
// ================================================================
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  $('theme-toggle').innerHTML = `<span class="nav-icon">${isLight ? '🌙' : '☀️'}</span>${isLight ? 'Dark Mode' : 'Light Mode'}`;
  localStorage.setItem('ei_theme', isLight ? 'light' : 'dark');
}

// ================================================================
//  PANEL HELPERS — Open/close overlays
// ================================================================
function openPanel(id) {
  $(id).classList.add('active');
  if (id === 'overlay-budget') {
    if ($('bud-month') && $('budget-month')) $('bud-month').value = $('budget-month').value;
    if ($('bud-year') && $('budget-year')) $('bud-year').value = $('budget-year').value;
  }
}
function closePanel(id) { $(id).classList.remove('active'); }

// Close overlay on background click (runs after DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
  });
});
