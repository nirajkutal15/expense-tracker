// ================================================================
//  SPLIT BILL — Split expenses with friends
// ================================================================
function loadSplits() {
  if (!splits.length) {
    $('split-list').innerHTML = `<div class="empty-state"><div class="empty-icon">⊕</div><div class="empty-text">No splits yet.<br/>Click "+ New Split" to split a bill.</div></div>`;
    return;
  }
  $('split-list').innerHTML = splits.map((s, i) => `
    <div class="split-card">
      <div class="split-header">
        <div><div class="split-title-text">${s.title}</div><div style="font-size:0.75rem;color:var(--muted);margin-top:0.2rem">${s.members.length} people · Paid by ${s.paidBy}</div></div>
        <div><div class="split-total">₹${s.total.toLocaleString('en-IN')}</div><button class="btn btn-danger-sm" style="margin-top:0.4rem" onclick="deleteSplit(${i})">Remove</button></div>
      </div>
      ${s.members.map(m => `
        <div class="split-member">
          <span class="member-name">${m.name}</span>
          <div>${m.name === s.paidBy
            ? `<span class="member-amount paid">+₹${(s.total - m.share).toLocaleString('en-IN')}</span><span class="member-tag tag-paid">to receive</span>`
            : `<span class="member-amount owes">₹${m.share.toLocaleString('en-IN')}</span><span class="member-tag tag-owes">owes</span>`
          }</div>
        </div>`).join('')}
    </div>`).join('');
}

function calculateSplit() {
  const title = $('split-title').value.trim(),
        total = parseFloat($('split-amount').value),
        yourName = $('split-your-name').value.trim(),
        friendsRaw = $('split-friends').value.trim(),
        paidBy = $('split-paid-by').value.trim();
  if (!title || !total || !yourName || !paidBy) { toast('Fill in all fields', 'error'); return; }
  const friends = friendsRaw ? friendsRaw.split(',').map(f => f.trim()).filter(Boolean) : [];
  const allMembers = [yourName, ...friends];
  const share = Math.round((total / allMembers.length) * 100) / 100;
  splits.unshift({ title, total, paidBy, members: allMembers.map(name => ({ name, share })) });
  localStorage.setItem('ei_splits', JSON.stringify(splits));
  closePanel('overlay-split');
  toast(`Each person owes ₹${share.toLocaleString('en-IN')}`, 'success');
  loadSplits();
  $('split-title').value = ''; $('split-amount').value = ''; $('split-your-name').value = ''; $('split-friends').value = ''; $('split-paid-by').value = '';
}

function deleteSplit(i) {
  splits.splice(i, 1);
  localStorage.setItem('ei_splits', JSON.stringify(splits));
  loadSplits();
  toast('Removed', 'success');
}
