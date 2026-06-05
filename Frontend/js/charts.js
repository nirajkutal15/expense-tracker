// ================================================================
//  CHARTS — Pie & Bar chart rendering (Chart.js)
// ================================================================
function renderPieChart(canvasId, data, existing, setter) {
  if (existing) existing.destroy();
  const labels = Object.keys(data), values = Object.values(data);
  const colors = ['#7c6af7', '#f76a8a', '#fbbf24', '#60a5fa', '#4ade80', '#f97316', '#a78bfa'];
  setter(new Chart($(canvasId), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#6b6b80', font: { size: 11 }, padding: 12 } }
      },
      cutout: '65%'
    }
  }));
}

function renderBarChart(canvasId, data, existing, setter) {
  if (existing) existing.destroy();
  setter(new Chart($(canvasId), {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: 'rgba(124,106,247,0.6)',
        borderColor: '#7c6af7',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6b6b80', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#6b6b80', font: { size: 10 } }, grid: { color: document.body.classList.contains('light') ? 'rgba(0,0,0,0.08)' : 'rgba(42,42,56,0.8)' } }
      }
    }
  }));
}
