// ================================================================
//  RECEIPT SCANNER — file handling, Claude AI Vision via Backend
// ================================================================

let currentMediaType = 'image/jpeg';

// --- FILE HANDLING ---
function handleDragOver(e) { e.preventDefault(); $('upload-zone').classList.add('dragover'); }
function handleDragLeave() { $('upload-zone').classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault(); $('upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processImageFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processImageFile(file);
}

function processImageFile(file) {
  currentMediaType = file.type;
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    currentReceiptBase64 = base64.split(',')[1];
    const preview = $('receipt-preview');
    preview.src = base64;
    preview.style.display = 'block';
    $('scan-btn').style.display = 'block';
    setScanStatus('idle', 'Receipt loaded. Click "Scan with AI" to extract details.');
    $('extracted-data').style.display = 'none';
    $('ai-raw').style.display = 'none';
    scannedData = null;
  };
  reader.readAsDataURL(file);
}

function setScanStatus(type, msg) {
  const el = $('scan-status');
  el.className = `scan-status ${type}`;
  el.innerHTML = type === 'scanning' ? `<span class="spinner-sm"></span> ${msg}` : msg;
}

// --- CLAUDE AI VISION SCAN (via Spring Boot backend) ---
async function scanReceipt() {
  if (!currentReceiptBase64) {
    toast('Please upload a receipt image first', 'error');
    return;
  }

  $('scan-btn').disabled = true;
  $('scan-btn').textContent = 'Scanning...';
  $('extracted-data').style.display = 'none';
  setScanStatus('scanning', 'AI is reading your receipt...');

  try {
    const res = await apiFetch('/receipt/scan', {
      method: 'POST',
      body: JSON.stringify({
        image: currentReceiptBase64,
        mediaType: currentMediaType || 'image/jpeg'
      })
    });

    if (!res.ok) throw new Error('Scan failed — check backend logs');

    const data = await res.json();
    let parsed;
    try {
      parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    } catch (parseErr) {
      console.error('Gemini json parsing failed:', parseErr, data.result);
      throw new Error('AI response was not valid JSON.');
    }

    scannedData = parsed;
    $('ext-amount').textContent = `₹${parseFloat(parsed.amount || 0).toLocaleString('en-IN')}`;
    $('ext-category').innerHTML = `<span class="category-badge ${getCategoryClass(parsed.category)}">${parsed.category || 'Other'}</span>`;
    $('ext-description').textContent = parsed.description || 'Unknown merchant';
    $('ext-date').textContent = parsed.date || new Date().toISOString().split('T')[0];

    if (parsed.items) {
      $('ext-items').textContent = parsed.items;
      $('ext-items-section').style.display = 'block';
    } else {
      $('ext-items-section').style.display = 'none';
    }

    $('extracted-data').style.display = 'block';
    if ($('ai-raw-text')) {
      $('ai-raw-text').textContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
      $('ai-raw').style.display = 'block';
    }
    setScanStatus('success', `✓ Scanned! Confidence: ${parsed.confidence || 'medium'}`);
    toast('Receipt scanned!', 'success');

  } catch (e) {
    setScanStatus('error', `✗ Error: ${e.message}`);
    toast('Scan failed: ' + e.message, 'error');
  } finally {
    $('scan-btn').disabled = false;
    $('scan-btn').textContent = '✦ Scan with AI';
  }
}

// --- ADD SCANNED EXPENSE ---
async function addScannedExpense() {
  if (!scannedData) { toast('No scanned data available', 'error'); return; }
  try {
    const res = await apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(scannedData.amount) || 0,
        category: scannedData.category || 'Other',
        description: scannedData.description || 'Receipt scan',
        date: scannedData.date || new Date().toISOString().split('T')[0]
      })
    });
    if (!res.ok) throw new Error('Failed to save');
    toast('Expense added from receipt!', 'success');
    scannedData = null;
    currentReceiptBase64 = null;
    $('receipt-preview').style.display = 'none';
    $('receipt-preview').src = '';
    $('scan-btn').style.display = 'none';
    $('extracted-data').style.display = 'none';
    $('ai-raw').style.display = 'none';
    $('receipt-file').value = '';
    setScanStatus('idle', 'Receipt added! Upload another receipt to continue.');
    loadDashboard();
  } catch (e) { toast('Failed to save expense', 'error'); }
}