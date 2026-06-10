// ================================================================
//  RECEIPT SCANNER — file handling, Gemini AI Vision via Backend
// ================================================================

let currentMediaType = 'image/jpeg';

// --- FILE HANDLING ---
function handleDragOver(e) { e.preventDefault(); $('upload-zone').classList.add('dragover'); }
function handleDragLeave() { $('upload-zone').classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault(); $('upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processImageFile(file);
  else toast('Please drop an image file (JPG, PNG, WEBP)', 'error');
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processImageFile(file);
}

function processImageFile(file) {
  // Validate file size — base64 encoding adds ~33%, so warn if source is very large
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB.`, 'error');
    return;
  }

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
  reader.onerror = () => {
    toast('Failed to read the image file', 'error');
  };
  reader.readAsDataURL(file);
}

function setScanStatus(type, msg) {
  const el = $('scan-status');
  el.className = `scan-status ${type}`;
  el.innerHTML = type === 'scanning' ? `<span class="spinner-sm"></span> ${msg}` : msg;
}

// --- GEMINI AI VISION SCAN (via Spring Boot backend) ---
async function scanReceipt() {
  if (!currentReceiptBase64) {
    toast('Please upload a receipt image first', 'error');
    return;
  }

  $('scan-btn').disabled = true;
  $('scan-btn').textContent = 'Scanning...';
  $('extracted-data').style.display = 'none';
  setScanStatus('scanning', 'AI is reading your receipt — this may take a few seconds...');

  try {
    const res = await apiFetch('/receipt/scan', {
      method: 'POST',
      body: JSON.stringify({
        image: currentReceiptBase64,
        mediaType: currentMediaType || 'image/jpeg'
      })
    });

    // Handle non-OK responses by reading the error body
    if (!res.ok) {
      let errorMsg = 'Scan failed';
      try {
        const errBody = await res.json();
        errorMsg = errBody.error || errBody.message || JSON.stringify(errBody);
      } catch (_) {
        try {
          errorMsg = await res.text();
        } catch (__) {
          errorMsg = `Server returned status ${res.status}`;
        }
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();

    // Parse the result — could be a JSON string or already an object
    let parsed;
    try {
      if (typeof data.result === 'string') {
        parsed = JSON.parse(data.result);
      } else if (typeof data.result === 'object' && data.result !== null) {
        parsed = data.result;
      } else {
        throw new Error('Unexpected result format');
      }
    } catch (parseErr) {
      console.error('JSON parsing failed:', parseErr, 'Raw result:', data.result);
      throw new Error('AI response was not valid JSON. Check the raw output below.');
    }

    scannedData = parsed;

    // Display extracted data with safe fallbacks
    const amount = parseFloat(parsed.amount || 0);
    $('ext-amount').textContent = `₹${amount.toLocaleString('en-IN')}`;
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
    toast('Receipt scanned successfully!', 'success');

  } catch (e) {
    console.error('Scan error:', e);
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
    const expenseData = {
      amount: parseFloat(scannedData.amount) || 0,
      category: scannedData.category || 'Other',
      description: scannedData.description || 'Receipt scan',
      date: scannedData.date || new Date().toISOString().split('T')[0]
    };

    if (expenseData.amount <= 0) {
      toast('Invalid amount detected. Please add manually.', 'error');
      return;
    }

    const res = await apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });

    if (!res.ok) {
      let errorMsg = 'Failed to save';
      try {
        const errBody = await res.json();
        errorMsg = errBody.error || errBody.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    toast(`₹${expenseData.amount.toLocaleString('en-IN')} added to ${expenseData.category}!`, 'success');
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
  } catch (e) {
    console.error('Save error:', e);
    toast('Failed to save expense: ' + e.message, 'error');
  }
}