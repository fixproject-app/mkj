/* ============================================================
   MKJ Web — app.js
   Motoran Karo Jasak — Sistem Pendaftaran & Merchandise Event
   Supabase SPA Client
   ============================================================ */

// ── Konfigurasi Supabase ──
// Ganti dengan Project URL dan Anon Key dari dashboard Supabase Anda
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── State Global ──
let currentProfile    = null;
let allRegistrations  = [];
let allMerchandise    = [];
let selectedMerch     = {};   // { merchandise_id: { qty, size, color } }
let currentRegId      = null; // ID registrasi terakhir dibuat
let currentTicketCode = null;
let currentGrandTotal = 75000;
let currentConfig     = {};
let selectedFile      = null;
let chartPayment      = null;
let chartDaily        = null;
let scannerStream     = null;
let qrScanner         = null;
let activeVerifyId    = null;
let realtimeChannel   = null;

/* ============================================================
   HELPER: LOADING OVERLAY
   ============================================================ */
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('d-none');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('d-none');
}

/* ============================================================
   HELPER: TOAST NOTIFIKASI
   ============================================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'error' ? 'exclamation-circle-fill' : 'info-circle-fill'} me-2"></i>${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ============================================================
   HELPER: WRAPPER SUPABASE CALL
   ============================================================ */
async function callSupabase(promise, successMessage) {
  showLoading();
  try {
    const { data, error } = await promise;
    if (error) throw error;
    if (successMessage) showToast(successMessage, 'success');
    return { success: true, data };
  } catch (err) {
    showToast(err.message || 'Terjadi kesalahan. Silakan coba lagi.', 'error');
    return { success: false, data: null, message: err.message };
  } finally {
    hideLoading();
  }
}

/* ============================================================
   HELPER: FORMAT MATA UANG
   ============================================================ */
function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

/* ============================================================
   HELPER: FORMAT TANGGAL
   ============================================================ */
function formatTanggal(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ============================================================
   HELPER: GENERATE KODE TIKET
   ============================================================ */
function generateTicketCode() {
  const tahun = new Date().getFullYear();
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `MKJ-${tahun}-${random}`;
}

/* ============================================================
   DARK MODE TOGGLE
   ============================================================ */
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('mkj_theme', isDark ? 'light' : 'dark');
}

(function initTheme() {
  const saved = localStorage.getItem('mkj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
function navigateTo(sectionId) {
  document.querySelectorAll('.app-section').forEach(el => el.classList.add('d-none'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.remove('d-none');

  // Cleanup scanner saat pindah halaman (guard: hanya panggil kalau sudah aktif)
  if (sectionId !== 'scanner' && typeof stopScanner === 'function') {
    // Hentikan stream kamera kalau ada
    if (typeof scannerStream !== 'undefined' && scannerStream) {
      scannerStream.getTracks().forEach(t => t.stop());
      scannerStream = null;
    }
    if (typeof qrScanner !== 'undefined' && qrScanner) {
      qrScanner.stop().catch(() => {});
      qrScanner = null;
    }
  }

  // Load data sesuai section
  if (sectionId === 'public')    loadPublicPage();
  if (sectionId === 'dashboard') loadDashboard();
}

/* ============================================================
   ADMIN TAB SWITCHER
   ============================================================ */
function switchAdminTab(tabId, btn) {
  // Sembunyikan semua tab
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('d-none'));
  // Hilangkan active semua nav item
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  // Tampilkan tab target
  const tab = document.getElementById(`admin-tab-${tabId}`);
  if (tab) tab.classList.remove('d-none');
  // Set active nav button
  if (btn) btn.classList.add('active');

  // Load data per tab
  if (tabId === 'overview')       loadDashboard();
  if (tabId === 'registrations')  loadAllRegistrations();
  if (tabId === 'merchandise')    loadMerchAdmin();
  if (tabId === 'scanner')        initScanner();
  if (tabId === 'settings')       loadSettings();
}

/* ============================================================
   AUTH FLOW
   ============================================================ */
async function signIn() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Email dan password harus diisi.', 'error'); return;
  }

  const result = await callSupabase(
    supabaseClient.auth.signInWithPassword({ email, password }),
    'Login berhasil! Selamat datang.'
  );

  if (result.success) {
    await loadCurrentProfile(result.data.user.id);
    navigateTo('dashboard');
  }
}

async function signOut() {
  // Hentikan kamera kalau aktif
  if (scannerStream) { scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; }
  if (qrScanner) { qrScanner.stop().catch(() => {}); qrScanner = null; }
  if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
  await supabaseClient.auth.signOut();
  currentProfile = null;
  navigateTo('login');
}

async function loadCurrentProfile(userId) {
  const result = await callSupabase(
    supabaseClient.from('profiles').select('*').eq('id', userId).single()
  );
  if (result.success) {
    currentProfile = result.data;
    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = currentProfile.nama || currentProfile.role || 'Admin';
  }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.innerHTML = `<i class="bi bi-eye${isPass ? '-slash' : ''}"></i>`;
}

// Pantau status auth Supabase
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    loadCurrentProfile(session.user.id);
    if (document.getElementById('section-login')?.classList.contains('d-none') === false) {
      navigateTo('dashboard');
    }
  }
});

/* ============================================================
   LOAD HALAMAN PUBLIK
   ============================================================ */
async function loadPublicPage() {
  await loadAppConfig();
  await loadMerchCatalog();
}

async function loadAppConfig() {
  const result = await callSupabase(
    supabaseClient.from('app_config').select('*')
  );
  if (!result.success) return;

  const config = {};
  result.data.forEach(row => { config[row.key] = row.value; });
  currentConfig = config;

  // Terapkan ke UI public
  if (config.eventDate) {
    const d = new Date(config.eventDate);
    const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const el = document.getElementById('hero-date');
    if (el) el.textContent = dateStr;
  }
  const locEl = document.getElementById('hero-location');
  if (locEl) locEl.textContent = config.eventLocation || '—';

  const priceEl = document.getElementById('hero-price');
  if (priceEl) priceEl.textContent = Number(config.ticketPrice || 75000).toLocaleString('id-ID');

  const tagEl = document.getElementById('tagline-display');
  if (tagEl && config.tagline) tagEl.textContent = `"${config.tagline}"`;

  // Terapkan ke payment page
  const bankNameEl = document.getElementById('bank-name-display');
  if (bankNameEl) bankNameEl.textContent = config.bankName || '—';
  const bankAccEl = document.getElementById('bank-account-display');
  if (bankAccEl) bankAccEl.textContent = config.bankAccount || '—';
  const bankHoldEl = document.getElementById('bank-holder-display');
  if (bankHoldEl) bankHoldEl.textContent = config.bankHolder || '—';
}

/* ============================================================
   KATALOG MERCHANDISE (PUBLIK)
   ============================================================ */
async function loadMerchCatalog() {
  const result = await callSupabase(
    supabaseClient.from('merchandise_items').select('*').eq('is_active', true).order('created_at')
  );
  if (!result.success) return;

  allMerchandise = result.data;
  renderMerchCatalog(allMerchandise);
}

function renderMerchCatalog(items) {
  const grid = document.getElementById('merch-catalog-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = '<p class="text-muted text-center py-4">Belum ada merchandise tersedia.</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="merch-card" id="merch-card-${item.id}">
      ${item.photo_url
        ? `<img src="${item.photo_url}" alt="${item.name}" class="merch-photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="merch-photo-placeholder" style="display:none"><i class="bi bi-bag-heart"></i><span>${item.name}</span></div>`
        : `<div class="merch-photo-placeholder"><i class="bi bi-bag-heart"></i><span>${item.name}</span></div>`
      }
      <div class="merch-name">${item.name}</div>
      <div class="merch-desc">${item.description || ''}</div>
      <div class="merch-price">${formatRupiah(item.price)}</div>

      <div class="merch-select-row">
        <div>
          <span class="merch-select-label">Ukuran</span>
          <select class="form-input-custom" id="size-${item.id}" style="font-size:12px;padding:6px 8px">
            ${item.available_sizes.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <span class="merch-select-label">Warna</span>
          <select class="form-input-custom" id="color-${item.id}" style="font-size:12px;padding:6px 8px">
            ${item.available_colors.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="merch-toggle-row">
        <div class="qty-stepper" id="qty-stepper-${item.id}">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-value" id="qty-val-${item.id}">0</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', +1)">+</button>
        </div>
        <label class="toggle-label">
          <input type="checkbox" class="toggle-checkbox" id="chk-${item.id}"
            onchange="toggleMerch('${item.id}', ${item.price}, this.checked)" />
          Pesan
        </label>
      </div>
    </div>
  `).join('');
}

function changeQty(itemId, delta) {
  const current = parseInt(document.getElementById(`qty-val-${itemId}`).textContent) || 0;
  const newQty = Math.max(0, current + delta);
  document.getElementById(`qty-val-${itemId}`).textContent = newQty;

  const isSelected = selectedMerch[itemId] !== undefined;
  if (isSelected) {
    if (newQty === 0) {
      document.getElementById(`chk-${itemId}`).checked = false;
      toggleMerch(itemId, null, false);
    } else {
      selectedMerch[itemId].qty = newQty;
      updateOrderSummary();
    }
  }
}

function toggleMerch(itemId, price, isChecked) {
  const card = document.getElementById(`merch-card-${itemId}`);
  const item = allMerchandise.find(m => m.id === itemId);
  if (!item) return;

  if (isChecked) {
    const qty = Math.max(1, parseInt(document.getElementById(`qty-val-${itemId}`).textContent) || 1);
    const size  = document.getElementById(`size-${itemId}`)?.value;
    const color = document.getElementById(`color-${itemId}`)?.value;
    document.getElementById(`qty-val-${itemId}`).textContent = qty;
    selectedMerch[itemId] = { qty, size, color, price: item.price, name: item.name };
    card?.classList.add('selected');
  } else {
    delete selectedMerch[itemId];
    document.getElementById(`qty-val-${itemId}`).textContent = '0';
    card?.classList.remove('selected');
  }
  updateOrderSummary();
}

function updateOrderSummary() {
  const ticketPrice = parseInt(currentConfig.ticketPrice || 75000);
  let merchTotal = 0;
  const lines = [];

  Object.entries(selectedMerch).forEach(([id, data]) => {
    const subtotal = data.qty * data.price;
    merchTotal += subtotal;
    lines.push(`<div class="order-line"><span>${data.qty}× ${data.name} (${data.size}, ${data.color})</span><span>${formatRupiah(subtotal)}</span></div>`);
  });

  currentGrandTotal = ticketPrice + merchTotal;

  document.getElementById('merch-summary-lines').innerHTML = lines.join('');
  document.getElementById('grand-total-display').textContent = formatRupiah(currentGrandTotal);
}

/* ============================================================
   SUBMIT REGISTRASI
   ============================================================ */
async function submitRegistration() {
  // Validasi input
  const fatherName = document.getElementById('father-name').value.trim();
  const childName  = document.getElementById('child-name').value.trim();
  const childAge   = document.getElementById('child-age').value;
  const waNumber   = document.getElementById('whatsapp-number').value.trim();
  const address    = document.getElementById('address').value.trim();

  if (!fatherName || !childName || !childAge || !waNumber || !address) {
    showToast('Harap isi semua data yang wajib diisi (*).', 'error'); return;
  }

  const ticketCode  = generateTicketCode();
  const ticketPrice = parseInt(currentConfig.ticketPrice || 75000);
  let   merchTotal  = 0;
  Object.values(selectedMerch).forEach(d => { merchTotal += d.qty * d.price; });
  const grandTotal = ticketPrice + merchTotal;

  // Insert ke tabel registrations
  const regResult = await callSupabase(
    supabaseClient.from('registrations').insert({
      ticket_code:    ticketCode,
      father_name:    fatherName,
      child_name:     childName,
      child_age:      parseInt(childAge),
      whatsapp_number: waNumber,
      address:        address,
      ticket_price:   ticketPrice,
      merch_total:    merchTotal,
      grand_total:    grandTotal,
      payment_status: 'pending'
    }).select().single(),
    null
  );

  if (!regResult.success) return;
  const reg = regResult.data;
  currentRegId      = reg.id;
  currentTicketCode = reg.ticket_code;

  // Insert item merchandise jika ada
  const merchItems = Object.entries(selectedMerch).map(([id, data]) => ({
    registration_id: reg.id,
    merchandise_id:  id,
    item_name:       data.name,
    size:            data.size,
    color:           data.color,
    quantity:        data.qty,
    price_per_item:  data.price,
    subtotal:        data.qty * data.price
  }));

  if (merchItems.length > 0) {
    await callSupabase(
      supabaseClient.from('registration_merchandise').insert(merchItems),
      null
    );
  }

  // Pindah ke halaman pembayaran
  populatePaymentPage(reg, grandTotal, fatherName, childName);
  navigateTo('payment');
  showToast('Pendaftaran berhasil! Silakan selesaikan pembayaran.', 'success');
}

function populatePaymentPage(reg, grandTotal, fatherName, childName) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('pay-ticket-code', reg.ticket_code);
  setEl('pay-father-name', reg.father_name || fatherName);
  setEl('pay-child-name',  reg.child_name  || childName);
  setEl('pay-grand-total', formatRupiah(grandTotal));
  setEl('pay-amount-display', formatRupiah(grandTotal));

  // Refresh bank info dari config
  const bankNameEl = document.getElementById('bank-name-display');
  if (bankNameEl) bankNameEl.textContent = currentConfig.bankName || '—';
  const bankAccEl  = document.getElementById('bank-account-display');
  if (bankAccEl)  bankAccEl.textContent = currentConfig.bankAccount || '—';
  const bankHoldEl = document.getElementById('bank-holder-display');
  if (bankHoldEl) bankHoldEl.textContent = currentConfig.bankHolder || '—';

  // Merchandise lines di payment page
  const linesEl = document.getElementById('pay-merch-lines');
  if (linesEl) {
    linesEl.innerHTML = Object.entries(selectedMerch).map(([id, data]) =>
      `<div class="info-row"><span>${data.qty}× ${data.name}</span><strong>${formatRupiah(data.qty * data.price)}</strong></div>`
    ).join('');
  }
}

/* ============================================================
   UPLOAD BUKTI BAYAR
   ============================================================ */
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran file melebihi 5MB. Pilih file yang lebih kecil.', 'error');
    input.value = ''; return;
  }

  selectedFile = file;
  document.getElementById('file-preview-name').textContent = file.name;
  document.getElementById('file-preview-wrap').classList.remove('d-none');
  document.getElementById('btn-upload-receipt').disabled = false;
}

function removeFile() {
  selectedFile = null;
  document.getElementById('receipt-file').value = '';
  document.getElementById('file-preview-wrap').classList.add('d-none');
  document.getElementById('btn-upload-receipt').disabled = true;
}

async function uploadReceipt() {
  if (!selectedFile || !currentRegId) {
    showToast('Pilih file bukti pembayaran terlebih dahulu.', 'error'); return;
  }

  const ext  = selectedFile.name.split('.').pop();
  const path = `receipts/${currentRegId}_${Date.now()}.${ext}`;

  showLoading();
  try {
    const { data: uploadData, error: uploadErr } = await supabaseClient.storage
      .from('payment-receipts').upload(path, selectedFile);
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabaseClient.storage.from('payment-receipts').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Update registrasi dengan URL bukti bayar
    const { error: updateErr } = await supabaseClient.from('registrations')
      .update({ payment_receipt_url: publicUrl })
      .eq('id', currentRegId);
    if (updateErr) throw updateErr;

    showToast('Bukti pembayaran berhasil dikirim! Tim kami akan segera memverifikasi.', 'success');

    // Arahkan ke halaman status
    setTimeout(() => {
      navigateTo('status');
      checkTicketStatus(currentTicketCode);
    }, 1500);
  } catch (err) {
    showToast(err.message || 'Gagal upload. Coba lagi.', 'error');
  } finally {
    hideLoading();
  }
}

/* Drag-and-drop handler */
const dropZone = document.getElementById('upload-drop-zone');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent-orange-h)'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--accent-orange)'; });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-orange)';
    const file = e.dataTransfer.files[0];
    if (file) {
      const inp = document.getElementById('receipt-file');
      const dt = new DataTransfer(); dt.items.add(file);
      inp.files = dt.files;
      handleFileSelect(inp);
    }
  });
}

/* ============================================================
   COPY TO CLIPBOARD
   ============================================================ */
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim())
    .then(() => showToast('Nomor rekening disalin!', 'info'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = el.textContent; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      showToast('Nomor rekening disalin!', 'info');
    });
}

function copyAmountToClipboard() {
  const rawAmt = String(currentGrandTotal);
  navigator.clipboard.writeText(rawAmt)
    .then(() => showToast('Nominal transfer disalin!', 'info'))
    .catch(() => showToast('Gagal salin. Salin manual.', 'error'));
}

/* ============================================================
   CEK STATUS TIKET (PUBLIK)
   ============================================================ */
async function checkTicketStatus(codeOverride) {
  const code = codeOverride || document.getElementById('check-ticket-code')?.value.trim().toUpperCase();
  if (!code) { showToast('Masukkan kode tiket terlebih dahulu.', 'error'); return; }

  const result = await callSupabase(
    supabaseClient.from('registrations').select('*').eq('ticket_code', code).single()
  );

  if (!result.success || !result.data) {
    showToast('Kode tiket tidak ditemukan.', 'error'); return;
  }

  const reg = result.data;
  renderStatusPage(reg);
  navigateTo('status');
}

function renderStatusPage(reg) {
  const statusMap = {
    pending:  { icon: 'bi-hourglass-split', cls: 'pending', title: 'PENDAFTARAN DALAM PROSES', sub: 'Tim kami sedang memverifikasi bukti pembayaran Anda.' },
    verified: { icon: 'bi-check-circle-fill', cls: 'verified', title: 'PEMBAYARAN TERVERIFIKASI!', sub: 'Tiket Anda aktif. Sampai jumpa di lokasi event!' },
    rejected: { icon: 'bi-x-circle-fill', cls: 'rejected', title: 'PEMBAYARAN DITOLAK', sub: 'Bukti pembayaran tidak valid. Silakan upload ulang atau hubungi admin.' }
  };

  const s = statusMap[reg.payment_status] || statusMap.pending;

  const iconEl = document.getElementById('status-main-icon');
  if (iconEl) { iconEl.className = `bi ${s.icon} status-icon ${s.cls}`; iconEl.style.fontSize = '3.5rem'; }

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('status-title-text',    s.title);
  setEl('status-subtitle-text', s.sub);
  setEl('st-ticket-code',       reg.ticket_code);
  setEl('st-father-name',       reg.father_name);
  setEl('st-child-name',        reg.child_name);
  setEl('st-grand-total',       formatRupiah(reg.grand_total));

  const statusEl = document.getElementById('st-payment-status');
  if (statusEl) {
    const labelMap = { pending: 'Menunggu Verifikasi', verified: 'Terverifikasi ✓', rejected: 'Ditolak ✗' };
    statusEl.textContent = labelMap[reg.payment_status] || reg.payment_status;
    statusEl.style.color = s.cls === 'verified' ? 'var(--accent-green)' : s.cls === 'rejected' ? 'var(--color-rejected)' : 'var(--color-pending)';
  }

  const checkinEl = document.getElementById('st-checkin-status');
  if (checkinEl) {
    checkinEl.textContent = reg.checkin_status ? `Sudah Check-in (${formatTanggal(reg.checkin_at)})` : 'Belum Check-in';
    checkinEl.style.color = reg.checkin_status ? 'var(--accent-green)' : 'var(--text-muted)';
  }
}

/* ============================================================
   DASHBOARD ADMIN — LOAD DATA
   ============================================================ */
async function loadDashboard() {
  const result = await callSupabase(
    supabaseClient.from('registrations').select('*').order('created_at', { ascending: false })
  );
  if (!result.success) return;

  allRegistrations = result.data;
  renderKPICards(allRegistrations);
  renderRecentTable(allRegistrations.slice(0, 8));
  renderPaymentChart(allRegistrations);
  renderDailyChart(allRegistrations);
  renderAIInsight(allRegistrations);
  subscribeRealtime();
}

function renderKPICards(data) {
  const total    = data.length;
  const verified = data.filter(r => r.payment_status === 'verified');
  const pending  = data.filter(r => r.payment_status === 'pending').length;
  const checkins = data.filter(r => r.checkin_status).length;
  const revenue  = verified.reduce((sum, r) => sum + (r.grand_total || 0), 0);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('kpi-total',   total);
  setEl('kpi-revenue', formatRupiah(revenue));
  setEl('kpi-pending', pending);
  setEl('kpi-checkin', `${checkins} / ${total}`);
}

function renderRecentTable(data) {
  const tbody = document.getElementById('recent-reg-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.length === 0
    ? '<tr><td colspan="6" class="text-center text-muted py-3">Belum ada data.</td></tr>'
    : data.map(reg => `
      <tr>
        <td><span class="font-mono" style="color:var(--accent-orange);font-size:12px">${reg.ticket_code}</span></td>
        <td>${reg.father_name}</td>
        <td>${reg.child_name}</td>
        <td class="font-mono">${formatRupiah(reg.grand_total)}</td>
        <td>${renderStatusBadge(reg.payment_status)}</td>
        <td>
          <button class="btn-table-action" onclick="openVerifyModal('${reg.id}')">
            <i class="bi bi-eye-fill"></i> Detail
          </button>
        </td>
      </tr>
    `).join('');
}

function renderStatusBadge(status) {
  const map = {
    pending:  '<span class="status-badge badge-pending">Pending</span>',
    verified: '<span class="status-badge badge-verified">Verified</span>',
    rejected: '<span class="status-badge badge-rejected">Rejected</span>'
  };
  return map[status] || `<span class="status-badge">${status}</span>`;
}

function renderPaymentChart(data) {
  const canvas = document.getElementById('chart-payment-status');
  if (!canvas) return;

  const pending  = data.filter(r => r.payment_status === 'pending').length;
  const verified = data.filter(r => r.payment_status === 'verified').length;
  const rejected = data.filter(r => r.payment_status === 'rejected').length;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';

  if (chartPayment) chartPayment.destroy();
  chartPayment = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Pending', 'Terverifikasi', 'Ditolak'],
      datasets: [{
        data: [pending, verified, rejected],
        backgroundColor: ['rgba(251,191,36,0.6)', 'rgba(163,230,53,0.6)', 'rgba(248,113,113,0.6)'],
        borderColor:     ['#FBBF24', '#A3E635', '#F87171'],
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
        x: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

function renderDailyChart(data) {
  const canvas = document.getElementById('chart-daily-reg');
  if (!canvas) return;

  // Grouping per hari (7 hari terakhir)
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    days[key] = 0;
  }
  data.forEach(r => {
    const d   = new Date(r.created_at);
    const key = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    if (days[key] !== undefined) days[key]++;
  });

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  if (chartDaily) chartDaily.destroy();
  chartDaily = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Object.keys(days),
      datasets: [{
        label: 'Pendaftar',
        data: Object.values(days),
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255,107,0,0.1)',
        borderWidth: 2,
        fill: true, tension: 0.4,
        pointBackgroundColor: '#FF6B00', pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
        x: { ticks: { color: textColor }, grid: { display: false } }
      }
    }
  });
}

function renderAIInsight(data) {
  const el = document.getElementById('ai-insight-text');
  if (!el) return;

  const total    = data.length;
  const verified = data.filter(r => r.payment_status === 'verified').length;
  const pending  = data.filter(r => r.payment_status === 'pending').length;
  const rejected = data.filter(r => r.payment_status === 'rejected').length;
  const checkins = data.filter(r => r.checkin_status).length;
  const revenue  = data.filter(r => r.payment_status === 'verified').reduce((s, r) => s + r.grand_total, 0);
  const convRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

  el.textContent = `Total ${total} peserta terdaftar dengan tingkat konversi pembayaran ${convRate}% (${verified} terverifikasi, ${pending} menunggu, ${rejected} ditolak). Total pendapatan terverifikasi ${formatRupiah(revenue)}. Check-in hari-H: ${checkins} dari ${verified} peserta yang bayar (${total > 0 ? ((checkins / Math.max(verified, 1)) * 100).toFixed(0) : 0}%). ${pending > 0 ? `⚠ Ada ${pending} pembayaran menunggu verifikasi manual.` : ''}`;
}

/* ============================================================
   LOAD SEMUA REGISTRASI (Tab Peserta)
   ============================================================ */
async function loadAllRegistrations() {
  const result = await callSupabase(
    supabaseClient.from('registrations').select('*').order('created_at', { ascending: false })
  );
  if (!result.success) return;
  allRegistrations = result.data;
  renderAllRegTable(allRegistrations);
}

function renderAllRegTable(data) {
  const tbody = document.getElementById('all-reg-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.length === 0
    ? '<tr><td colspan="9" class="text-center text-muted py-3">Tidak ada data.</td></tr>'
    : data.map(reg => `
      <tr>
        <td><span class="font-mono" style="color:var(--accent-orange);font-size:11px">${reg.ticket_code}</span></td>
        <td>${reg.father_name}</td>
        <td>${reg.child_name}</td>
        <td>${reg.child_age} thn</td>
        <td><a href="https://wa.me/${reg.whatsapp_number}" target="_blank" style="color:var(--accent-green)">${reg.whatsapp_number}</a></td>
        <td class="font-mono">${formatRupiah(reg.grand_total)}</td>
        <td>${renderStatusBadge(reg.payment_status)}</td>
        <td>${reg.checkin_status ? '<span class="status-badge badge-checkin">✓ Check-in</span>' : '<span class="status-badge" style="background:rgba(107,114,128,0.15);color:#6B7280">Belum</span>'}</td>
        <td style="white-space:nowrap">
          <button class="btn-table-action me-1" onclick="openVerifyModal('${reg.id}')">
            <i class="bi bi-eye-fill"></i>
          </button>
          <button class="btn-table-action danger" onclick="deleteRegistration('${reg.id}', '${reg.ticket_code}')">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>
    `).join('');
}

function filterRegistrations(search) {
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const q = (search || '').toLowerCase();
  const filtered = allRegistrations.filter(r => {
    const matchSearch = !q || r.father_name.toLowerCase().includes(q)
      || r.child_name.toLowerCase().includes(q)
      || r.ticket_code.toLowerCase().includes(q)
      || (r.whatsapp_number || '').includes(q);
    const matchStatus = !statusFilter || r.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });
  renderAllRegTable(filtered);
}

function exportCSV() {
  const header = ['Kode Tiket', 'Nama Ayah', 'Nama Anak', 'Usia Anak', 'WhatsApp', 'Alamat', 'Total', 'Status Bayar', 'Status Check-in', 'Tgl Daftar'];
  const rows = allRegistrations.map(r => [
    r.ticket_code, r.father_name, r.child_name, r.child_age,
    r.whatsapp_number, `"${r.address}"`, r.grand_total,
    r.payment_status, r.checkin_status ? 'Hadir' : 'Belum',
    new Date(r.created_at).toLocaleDateString('id-ID')
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `MKJ_Peserta_${Date.now()}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('File CSV berhasil diunduh.', 'success');
}

/* ============================================================
   MODAL VERIFIKASI BUKTI BAYAR
   ============================================================ */
async function openVerifyModal(regId) {
  const result = await callSupabase(
    supabaseClient.from('registrations').select(`*, registration_merchandise(*)`).eq('id', regId).single()
  );
  if (!result.success) return;

  const reg = result.data;
  activeVerifyId = reg.id;

  document.getElementById('modal-verify-title').textContent = `Detail — ${reg.ticket_code}`;

  // Preview bukti bayar
  const previewArea = document.getElementById('proof-preview-area');
  if (reg.payment_receipt_url) {
    const isPdf = reg.payment_receipt_url.toLowerCase().includes('.pdf');
    previewArea.innerHTML = isPdf
      ? `<iframe src="${reg.payment_receipt_url}" class="proof-iframe" title="Bukti Bayar PDF"></iframe>`
      : `<img src="${reg.payment_receipt_url}" class="proof-img" alt="Bukti Bayar"
          onclick="window.open('${reg.payment_receipt_url}', '_blank')" style="cursor:zoom-in" />`;
  } else {
    previewArea.innerHTML = `<div class="proof-placeholder"><i class="bi bi-image text-muted" style="font-size:3rem"></i><p class="text-muted mt-2 small">Belum ada bukti pembayaran</p></div>`;
  }

  // Info pendaftaran
  const merch = reg.registration_merchandise || [];
  const infoList = document.getElementById('verify-info-list');
  infoList.innerHTML = [
    { label: 'Kode Tiket',    value: reg.ticket_code },
    { label: 'Nama Ayah',    value: reg.father_name },
    { label: 'Nama Anak',    value: `${reg.child_name} (${reg.child_age} thn)` },
    { label: 'WhatsApp',     value: reg.whatsapp_number },
    { label: 'Alamat',       value: reg.address },
    { label: 'Tiket',        value: formatRupiah(reg.ticket_price) },
    ...merch.map(m => ({ label: m.item_name, value: `${m.quantity}× ${m.size} / ${m.color} = ${formatRupiah(m.subtotal)}` })),
    { label: 'Total Bayar',  value: formatRupiah(reg.grand_total), highlight: true },
    { label: 'Status Bayar', value: reg.payment_status.toUpperCase() },
    { label: 'Status Check-in', value: reg.checkin_status ? `Hadir (${formatTanggal(reg.checkin_at)})` : 'Belum Hadir' },
    { label: 'Tgl Daftar',  value: formatTanggal(reg.created_at) }
  ].map(item => `
    <div class="verify-info-item">
      <span class="verify-info-label">${item.label}</span>
      <span class="verify-info-value" style="${item.highlight ? 'color:var(--accent-orange);font-weight:700' : ''}">${item.value}</span>
    </div>
  `).join('');

  openModal('modal-verify');
}

async function updatePaymentStatus(newStatus) {
  if (!activeVerifyId) return;
  const result = await callSupabase(
    supabaseClient.from('registrations').update({ payment_status: newStatus }).eq('id', activeVerifyId).select().single(),
    newStatus === 'verified' ? 'Pembayaran berhasil diverifikasi!' : 'Pembayaran ditolak.'
  );
  if (result.success) {
    closeModal('modal-verify');
    loadDashboard();
    loadAllRegistrations();
  }
}

async function deleteRegistration(regId, ticketCode) {
  if (!confirm(`Hapus pendaftaran ${ticketCode}? Tindakan ini tidak bisa dibatalkan.`)) return;
  const result = await callSupabase(
    supabaseClient.from('registrations').delete().eq('id', regId),
    `Pendaftaran ${ticketCode} berhasil dihapus.`
  );
  if (result.success) { loadAllRegistrations(); loadDashboard(); }
}

/* ============================================================
   MASTER MERCHANDISE ADMIN
   ============================================================ */
async function loadMerchAdmin() {
  const result = await callSupabase(
    supabaseClient.from('merchandise_items').select('*').order('created_at')
  );
  if (!result.success) return;

  const tbody = document.getElementById('merch-admin-tbody');
  if (!tbody) return;

  tbody.innerHTML = result.data.length === 0
    ? '<tr><td colspan="6" class="text-center text-muted py-3">Belum ada item merchandise.</td></tr>'
    : result.data.map(item => `
      <tr>
        <td>
          <div style="font-weight:600;font-size:13px">${item.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${item.description || ''}</div>
        </td>
        <td class="font-mono">${formatRupiah(item.price)}</td>
        <td style="font-size:11px">${(item.available_sizes || []).join(', ')}</td>
        <td style="font-size:11px">${(item.available_colors || []).join(', ')}</td>
        <td>${item.is_active
          ? '<span class="status-badge badge-verified">Aktif</span>'
          : '<span class="status-badge" style="background:rgba(107,114,128,0.15);color:#6B7280">Nonaktif</span>'}</td>
        <td style="white-space:nowrap">
          <button class="btn-table-action me-1" onclick="openMerchModal('${item.id}')">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn-table-action danger" onclick="deleteMerch('${item.id}', '${item.name.replace(/'/g,'')}')">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>
    `).join('');
}

async function openMerchModal(itemId) {
  document.getElementById('merch-id').value = '';
  document.getElementById('merch-name').value  = '';
  document.getElementById('merch-desc').value  = '';
  document.getElementById('merch-price').value = '';
  document.getElementById('merch-photo').value = '';
  document.getElementById('merch-sizes').value = '';
  document.getElementById('merch-colors').value = '';
  document.getElementById('merch-active').value = 'true';
  document.getElementById('modal-merch-title').textContent = 'Tambah Merchandise';

  if (itemId) {
    document.getElementById('modal-merch-title').textContent = 'Edit Merchandise';
    const result = await callSupabase(
      supabaseClient.from('merchandise_items').select('*').eq('id', itemId).single()
    );
    if (result.success) {
      const it = result.data;
      document.getElementById('merch-id').value     = it.id;
      document.getElementById('merch-name').value   = it.name;
      document.getElementById('merch-desc').value   = it.description || '';
      document.getElementById('merch-price').value  = it.price;
      document.getElementById('merch-photo').value  = it.photo_url || '';
      document.getElementById('merch-sizes').value  = (it.available_sizes || []).join(', ');
      document.getElementById('merch-colors').value = (it.available_colors || []).join(', ');
      document.getElementById('merch-active').value = String(it.is_active);
    }
  }
  openModal('modal-merch');
}

async function saveMerch() {
  const id      = document.getElementById('merch-id').value;
  const name    = document.getElementById('merch-name').value.trim();
  const desc    = document.getElementById('merch-desc').value.trim();
  const price   = parseFloat(document.getElementById('merch-price').value);
  const photo   = document.getElementById('merch-photo').value.trim();
  const sizes   = document.getElementById('merch-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const colors  = document.getElementById('merch-colors').value.split(',').map(c => c.trim()).filter(Boolean);
  const active  = document.getElementById('merch-active').value === 'true';

  if (!name || !price || sizes.length === 0 || colors.length === 0) {
    showToast('Nama, harga, ukuran, dan warna wajib diisi.', 'error'); return;
  }

  const payload = {
    name, description: desc, price,
    photo_url: photo || null,
    available_sizes: sizes, available_colors: colors,
    is_active: active
  };

  const promise = id
    ? supabaseClient.from('merchandise_items').update(payload).eq('id', id).select().single()
    : supabaseClient.from('merchandise_items').insert(payload).select().single();

  const result = await callSupabase(promise, id ? 'Merchandise berhasil diperbarui.' : 'Merchandise berhasil ditambahkan.');
  if (result.success) { closeModal('modal-merch'); loadMerchAdmin(); }
}

async function deleteMerch(itemId, name) {
  if (!confirm(`Hapus "${name}"? Stok pesanan terdahulu tidak terpengaruh.`)) return;
  const result = await callSupabase(
    supabaseClient.from('merchandise_items').delete().eq('id', itemId),
    `"${name}" berhasil dihapus.`
  );
  if (result.success) loadMerchAdmin();
}

/* ============================================================
   QR / BARCODE SCANNER
   ============================================================ */
function initScanner() {
  const placeholder = document.getElementById('scanner-placeholder');
  const video = document.getElementById('scanner-video');
  if (placeholder) placeholder.style.display = 'flex';
  if (video) video.style.display = 'none';
}

async function startScanner() {
  const placeholder = document.getElementById('scanner-placeholder');
  const video = document.getElementById('scanner-video');
  const btnStart = document.getElementById('btn-start-scan');
  const btnStop  = document.getElementById('btn-stop-scan');

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    if (video) { video.srcObject = scannerStream; video.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (btnStart) btnStart.classList.add('d-none');
    if (btnStop)  btnStop.classList.remove('d-none');

    // html5-qrcode sebagai scanner engine
    if (window.Html5Qrcode) {
      qrScanner = new Html5Qrcode('scanner-viewport', { verbose: false });
      qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          processCheckin(decodedText);
          stopScanner();
        },
        () => {}
      ).catch(() => {});
    } else {
      showToast('Library scanner tidak tersedia. Gunakan input manual.', 'info');
    }
  } catch (err) {
    showToast('Tidak dapat mengakses kamera. Periksa izin browser.', 'error');
  }
}

function stopScanner() {
  if (qrScanner) { qrScanner.stop().catch(() => {}); qrScanner = null; }
  if (scannerStream) { scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; }
  const placeholder = document.getElementById('scanner-placeholder');
  const video = document.getElementById('scanner-video');
  const btnStart = document.getElementById('btn-start-scan');
  const btnStop  = document.getElementById('btn-stop-scan');
  if (placeholder) placeholder.style.display = 'flex';
  if (video) { video.srcObject = null; video.style.display = 'none'; }
  if (btnStart) btnStart.classList.remove('d-none');
  if (btnStop)  btnStop.classList.add('d-none');
}

async function processCheckin(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) { showToast('Masukkan kode tiket.', 'error'); return; }

  const result = await callSupabase(
    supabaseClient.from('registrations').select('*').eq('ticket_code', code).single()
  );

  const resultArea = document.getElementById('scan-result-area');
  const resultCard = document.getElementById('scan-result-card');
  const resultIcon = document.getElementById('scan-result-icon');
  const resultMsg  = document.getElementById('scan-result-message');
  const resultDet  = document.getElementById('scan-result-detail');

  if (resultArea) resultArea.classList.remove('d-none');

  if (!result.success || !result.data) {
    if (resultCard) resultCard.className = 'scan-result-card error';
    if (resultIcon) resultIcon.innerHTML = '<i class="bi bi-x-circle-fill" style="color:var(--color-rejected);font-size:3rem"></i>';
    if (resultMsg)  resultMsg.textContent = 'TIKET TIDAK DITEMUKAN';
    if (resultDet)  resultDet.textContent = `Kode: ${code}`;
    showToast('Tiket tidak ditemukan!', 'error');
    playBeep(false); return;
  }

  const reg = result.data;

  if (reg.payment_status !== 'verified') {
    if (resultCard) resultCard.className = 'scan-result-card error';
    if (resultIcon) resultIcon.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="color:var(--color-pending);font-size:3rem"></i>';
    if (resultMsg)  resultMsg.textContent = 'PEMBAYARAN BELUM TERVERIFIKASI';
    if (resultDet)  resultDet.textContent = `${reg.father_name} & ${reg.child_name} — Status: ${reg.payment_status}`;
    showToast('Pembayaran belum terverifikasi!', 'error');
    playBeep(false); return;
  }

  if (reg.checkin_status) {
    if (resultCard) resultCard.className = 'scan-result-card error';
    if (resultIcon) resultIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="color:var(--color-pending);font-size:3rem"></i>';
    if (resultMsg)  resultMsg.textContent = 'TIKET SUDAH DIGUNAKAN';
    if (resultDet)  resultDet.textContent = `${reg.father_name} & ${reg.child_name} — Check-in: ${formatTanggal(reg.checkin_at)}`;
    showToast('Tiket ini sudah check-in sebelumnya!', 'error');
    playBeep(false); return;
  }

  // Proses check-in
  const updateResult = await callSupabase(
    supabaseClient.from('registrations').update({
      checkin_status: true,
      checkin_at: new Date().toISOString()
    }).eq('id', reg.id),
    null
  );

  if (updateResult.success) {
    if (resultCard) resultCard.className = 'scan-result-card success';
    if (resultIcon) resultIcon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:var(--accent-green);font-size:3rem"></i>';
    if (resultMsg)  resultMsg.textContent = 'CHECK-IN BERHASIL!';
    if (resultDet)  resultDet.textContent = `${reg.father_name} & ${reg.child_name} | ${reg.ticket_code}`;
    showToast(`✓ Check-in berhasil: ${reg.father_name} & ${reg.child_name}`, 'success');
    playBeep(true);

    // Clear manual input
    const manualInput = document.getElementById('manual-ticket-code');
    if (manualInput) manualInput.value = '';
  }
}

function playBeep(success) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 300;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* Browser tanpa AudioContext */ }
}

/* ============================================================
   PENGATURAN ADMIN
   ============================================================ */
async function loadSettings() {
  const result = await callSupabase(supabaseClient.from('app_config').select('*'));
  if (!result.success) return;

  const config = {};
  result.data.forEach(row => { config[row.key] = row.value; });

  const setVal = (id, key) => {
    const el = document.getElementById(id);
    if (el && config[key] !== undefined) el.value = config[key];
  };

  setVal('cfg-appName',        'appName');
  setVal('cfg-eventDate',      'eventDate');
  setVal('cfg-eventLocation',  'eventLocation');
  setVal('cfg-ticketPrice',    'ticketPrice');
  setVal('cfg-whatsappAdmin',  'whatsappAdmin');
  setVal('cfg-bankName',       'bankName');
  setVal('cfg-bankAccount',    'bankAccount');
  setVal('cfg-bankHolder',     'bankHolder');
  setVal('cfg-tagline',        'tagline');
}

async function saveSettings() {
  const fields = {
    appName:       document.getElementById('cfg-appName')?.value,
    eventDate:     document.getElementById('cfg-eventDate')?.value,
    eventLocation: document.getElementById('cfg-eventLocation')?.value,
    ticketPrice:   document.getElementById('cfg-ticketPrice')?.value,
    whatsappAdmin: document.getElementById('cfg-whatsappAdmin')?.value,
    bankName:      document.getElementById('cfg-bankName')?.value,
    bankAccount:   document.getElementById('cfg-bankAccount')?.value,
    bankHolder:    document.getElementById('cfg-bankHolder')?.value,
    tagline:       document.getElementById('cfg-tagline')?.value
  };

  const upserts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([key, value]) => ({ key, value }));

  const result = await callSupabase(
    supabaseClient.from('app_config').upsert(upserts, { onConflict: 'key' }),
    'Pengaturan berhasil disimpan!'
  );

  if (result.success) await loadAppConfig();
}

/* ============================================================
   REALTIME SUBSCRIPTION
   ============================================================ */
function subscribeRealtime() {
  if (realtimeChannel) return; // Sudah subscribe
  realtimeChannel = supabaseClient
    .channel('realtime:registrations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
      // Reload dashboard secara silent saat ada perubahan
      loadAllRegistrations();
      callSupabase(
        supabaseClient.from('registrations').select('*').order('created_at', { ascending: false })
      ).then(result => {
        if (result.success) {
          allRegistrations = result.data;
          renderKPICards(allRegistrations);
          renderRecentTable(allRegistrations.slice(0, 8));
          renderAIInsight(allRegistrations);
        }
      });
    })
    .subscribe();
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('d-none');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('d-none');
  document.body.style.overflow = '';
  if (modalId === 'modal-verify') activeVerifyId = null;
}

// Klik overlay untuk tutup modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('d-none');
    document.body.style.overflow = '';
    activeVerifyId = null;
  }
});

/* ============================================================
   INIT APLIKASI
   ============================================================ */
(async function init() {
  // Cek apakah user sudah login
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await loadCurrentProfile(session.user.id);
    navigateTo('dashboard');
  } else {
    navigateTo('public');
  }
})();
