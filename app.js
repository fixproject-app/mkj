// ============================================================
// MKJ Web (Motoran Karo Jasak #1) — Client Logic (app.js)
// Single Page Application (SPA) Controller with Supabase Client
// ============================================================

// 1. Konfigurasi Supabase Project (Ganti dengan kredensial project Anda)
const SUPABASE_URL = 'https://srsifsztyrwsjijismvu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5y0_SGaMs4orUa73JtAC5A_iylznVCP';

const supabase = (typeof window.supabase !== 'undefined' && SUPABASE_URL.indexOf('YOUR_PROJECT') === -1)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// State Aplikasi Global
let appState = {
  currentSection: 'register',
  currentUser: null,
  ticketPrice: 75000,
  merchandiseList: [],
  selectedMerch: {}, // { merchId: { qty: 1, size: 'L', color: 'Hitam', price: 85000, name: '...' } }
  activeRegistration: null, // Data pendaftaran yang baru disubmit
  selectedReceiptFile: null,
  allRegistrations: [],
  html5QrScanner: null,
  realtimeSubscription: null,
  appConfig: {
    bank_name: 'BCA (Bank Central Asia)',
    bank_account_number: '0901234567',
    bank_account_holder: 'PANITIA EVENT MKJ',
    ticket_price: '75000',
    admin_whatsapp: '6281234567890'
  }
};

// ── 2. Helper UI: Loading Overlay & Toast ──
function showLoading(text = 'Memproses data...') {
  const el = document.getElementById('loading-overlay');
  const txt = document.getElementById('loading-text');
  if (txt) txt.textContent = text;
  if (el) el.classList.remove('d-none');
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('d-none');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'} me-2"></i>${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── 3. Helper Supabase Call ──
async function callSupabase(promise, successMessage = null) {
  showLoading();
  try {
    if (!supabase) {
      throw new Error('Supabase client belum dikonfigurasi. Silakan masukkan SUPABASE_URL & ANON_KEY di app.js.');
    }
    const { data, error } = await promise;
    if (error) throw error;
    if (successMessage) showToast(successMessage, 'success');
    return { success: true, data };
  } catch (err) {
    console.error('Supabase Error:', err);
    showToast(err.message || 'Terjadi kesalahan komunikasi dengan server.', 'error');
    return { success: false, data: null, error: err };
  } finally {
    hideLoading();
  }
}

// ── 4. Format Rupiah ──
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

// ── 5. SPA Navigation Router ──
function navigateTo(sectionId) {
  // Hentikan scanner jika pindah dari scanner
  if (appState.currentSection === 'admin-scanner' && sectionId !== 'admin-scanner') {
    stopScanner();
  }

  document.querySelectorAll('.app-section').forEach(el => el.classList.add('d-none'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) {
    target.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  appState.currentSection = sectionId;

  // Lifecycle handler per section
  if (sectionId === 'register') {
    loadMerchandiseCatalog();
    calculateOrderSummary();
  } else if (sectionId === 'admin-dashboard') {
    if (!appState.currentUser) {
      navigateTo('admin-login');
      return;
    }
    loadDashboardRegistrations();
    initRealtimeChannel();
  } else if (sectionId === 'admin-scanner') {
    if (!appState.currentUser) {
      navigateTo('admin-login');
      return;
    }
    initQrScanner();
  } else if (sectionId === 'admin-merch') {
    loadAdminMerchandiseList();
  } else if (sectionId === 'admin-config') {
    loadAppConfigIntoForm();
  }
}

// ── 6. Inisialisasi Aplikasi Saat Halaman Dimuat ──
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadAppConfig();
  await loadMerchandiseCatalog();
  calculateOrderSummary();

  // Cek sesi login admin jika supabase aktif
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      appState.currentUser = session.user;
      updateAdminNavUI(true);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      appState.currentUser = session?.user || null;
      updateAdminNavUI(!!session);
    });
  }
});

function updateAdminNavUI(isLoggedIn) {
  const btnAdmin = document.getElementById('nav-btn-admin');
  const btnScanner = document.getElementById('nav-btn-scanner');
  const adminLabel = document.getElementById('admin-btn-label');

  if (isLoggedIn) {
    if (adminLabel) adminLabel.textContent = 'Dashboard';
    if (btnScanner) btnScanner.classList.remove('d-none');
    if (btnAdmin) btnAdmin.onclick = () => navigateTo('admin-dashboard');
  } else {
    if (adminLabel) adminLabel.textContent = 'Admin';
    if (btnScanner) btnScanner.classList.add('d-none');
    if (btnAdmin) btnAdmin.onclick = () => navigateTo('admin-login');
  }
}

// ── 7. Memuat & Mengelola Konfigurasi Aplikasi ──
async function loadAppConfig() {
  if (!supabase) return;
  const { data, error } = await supabase.from('app_config').select('*');
  if (data && !error) {
    data.forEach(item => {
      appState.appConfig[item.key] = item.value;
    });
    if (appState.appConfig.ticket_price) {
      appState.ticketPrice = parseInt(appState.appConfig.ticket_price, 10) || 75000;
      const dispEl = document.getElementById('disp-ticket-price');
      if (dispEl) dispEl.textContent = formatRupiah(appState.ticketPrice);
    }
  }
}

function loadAppConfigIntoForm() {
  document.getElementById('cfg-bank-name').value = appState.appConfig.bank_name || '';
  document.getElementById('cfg-bank-acc-num').value = appState.appConfig.bank_account_number || '';
  document.getElementById('cfg-bank-acc-holder').value = appState.appConfig.bank_account_holder || '';
  document.getElementById('cfg-ticket-price').value = appState.appConfig.ticket_price || 75000;
  document.getElementById('cfg-admin-wa').value = appState.appConfig.admin_whatsapp || '';
}

async function saveAppConfig(e) {
  e.preventDefault();
  const updates = [
    { key: 'bank_name', value: document.getElementById('cfg-bank-name').value },
    { key: 'bank_account_number', value: document.getElementById('cfg-bank-acc-num').value },
    { key: 'bank_account_holder', value: document.getElementById('cfg-bank-acc-holder').value },
    { key: 'ticket_price', value: document.getElementById('cfg-ticket-price').value },
    { key: 'admin_whatsapp', value: document.getElementById('cfg-admin-wa').value }
  ];

  for (const item of updates) {
    await callSupabase(supabase.from('app_config').upsert(item));
  }
  await loadAppConfig();
  showToast('Pengaturan berhasil disimpan!', 'success');
  navigateTo('admin-dashboard');
}

// ── 8. Katalog Merchandise & Kalkulasi Pesanan ──
async function loadMerchandiseCatalog() {
  const container = document.getElementById('merch-items-container');
  if (!container) return;

  let items = [];
  if (supabase) {
    const res = await supabase.from('merchandise_items').select('*').eq('is_active', true);
    if (res.data) items = res.data;
  } else {
    // Fallback Mock Data
    items = [{
      id: 'mock-1',
      name: 'OFFICIAL T-SHIRT MKJ #1',
      description: 'Bahan Cotton Combed 24s premium, sablon discharge berkualitas tinggi, nyaman & sejuk dipakai berkendara bareng ayah.',
      price: 85000,
      photo_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      available_colors: ['Hitam', 'Orange']
    }];
  }

  appState.merchandiseList = items;
  container.innerHTML = '';

  items.forEach(item => {
    const isSelected = !!appState.selectedMerch[item.id];
    const currentQty = isSelected ? appState.selectedMerch[item.id].qty : 1;
    const currentSize = isSelected ? appState.selectedMerch[item.id].size : item.available_sizes[0];
    const currentColor = isSelected ? appState.selectedMerch[item.id].color : item.available_colors[0];

    const card = document.createElement('div');
    card.className = `merch-card ${isSelected ? 'selected' : ''}`;
    card.id = `merch-card-${item.id}`;
    card.innerHTML = `
      <div class="merch-img-container">
        <img src="${item.photo_url || 'https://via.placeholder.com/400x300?text=Kaos+MKJ'}" alt="${item.name}" class="merch-img" />
        <div class="merch-price-tag">${formatRupiah(item.price)}</div>
      </div>
      <div class="merch-body">
        <h3 class="fs-5 text-white fw-bold mb-1">${item.name}</h3>
        <p class="text-muted small mb-3">${item.description || ''}</p>

        <!-- Pilihan Ukuran -->
        <label class="form-label">Pilih Ukuran:</label>
        <div class="size-pill-group" id="size-group-${item.id}">
          ${item.available_sizes.map(sz => `
            <div class="size-pill ${sz === currentSize ? 'active' : ''}" onclick="selectMerchSize('${item.id}', '${sz}')">${sz}</div>
          `).join('')}
        </div>

        <!-- Pilihan Warna -->
        <label class="form-label">Pilih Warna:</label>
        <div class="color-radio-group" id="color-group-${item.id}">
          ${item.available_colors.map(col => `
            <div class="color-option ${col === currentColor ? 'active' : ''}" onclick="selectMerchColor('${item.id}', '${col}')">
              <i class="fa-solid fa-circle" style="color: ${col.toLowerCase() === 'orange' ? '#ff5500' : '#333'}"></i> ${col}
            </div>
          `).join('')}
        </div>

        <!-- Stepper & Tambah Tombol -->
        <div class="d-flex align-items-center justify-content-between pt-2 border-top border-dark mt-2">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="stepper-btn" onclick="adjustMerchQty('${item.id}', -1)">-</button>
            <span class="fw-bold px-2 text-white" id="qty-label-${item.id}">${currentQty}</span>
            <button type="button" class="stepper-btn" onclick="adjustMerchQty('${item.id}', 1)">+</button>
          </div>
          <button type="button" class="btn btn-sm ${isSelected ? 'btn-danger' : 'btn-warning text-dark fw-bold'}" onclick="toggleSelectMerch('${item.id}')">
            <i class="fa-solid ${isSelected ? 'fa-trash' : 'fa-cart-plus'} me-1"></i> ${isSelected ? 'Batal Tambah' : 'Tambah Kaos'}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function selectMerchSize(merchId, size) {
  const item = appState.merchandiseList.find(m => m.id === merchId);
  if (!item) return;

  if (!appState.selectedMerch[merchId]) {
    appState.selectedMerch[merchId] = {
      qty: 1,
      size: size,
      color: item.available_colors[0],
      price: item.price,
      name: item.name
    };
  } else {
    appState.selectedMerch[merchId].size = size;
  }
  document.querySelectorAll(`#size-group-${merchId} .size-pill`).forEach(el => {
    el.classList.toggle('active', el.textContent.trim() === size);
  });
  highlightMerchCard(merchId, true);
  calculateOrderSummary();
}

function selectMerchColor(merchId, color) {
  const item = appState.merchandiseList.find(m => m.id === merchId);
  if (!item) return;

  if (!appState.selectedMerch[merchId]) {
    appState.selectedMerch[merchId] = {
      qty: 1,
      size: item.available_sizes[0],
      color: color,
      price: item.price,
      name: item.name
    };
  } else {
    appState.selectedMerch[merchId].color = color;
  }
  document.querySelectorAll(`#color-group-${merchId} .color-option`).forEach(el => {
    el.classList.toggle('active', el.textContent.includes(color));
  });
  highlightMerchCard(merchId, true);
  calculateOrderSummary();
}

function adjustMerchQty(merchId, delta) {
  const item = appState.merchandiseList.find(m => m.id === merchId);
  if (!item) return;

  if (!appState.selectedMerch[merchId]) {
    if (delta > 0) {
      appState.selectedMerch[merchId] = {
        qty: 1,
        size: item.available_sizes[0],
        color: item.available_colors[0],
        price: item.price,
        name: item.name
      };
      highlightMerchCard(merchId, true);
    }
  } else {
    let newQty = appState.selectedMerch[merchId].qty + delta;
    if (newQty <= 0) {
      delete appState.selectedMerch[merchId];
      highlightMerchCard(merchId, false);
    } else {
      appState.selectedMerch[merchId].qty = newQty;
    }
  }

  const label = document.getElementById(`qty-label-${merchId}`);
  if (label) label.textContent = appState.selectedMerch[merchId] ? appState.selectedMerch[merchId].qty : 1;
  calculateOrderSummary();
}

function toggleSelectMerch(merchId) {
  const item = appState.merchandiseList.find(m => m.id === merchId);
  if (!item) return;

  if (appState.selectedMerch[merchId]) {
    delete appState.selectedMerch[merchId];
    highlightMerchCard(merchId, false);
  } else {
    appState.selectedMerch[merchId] = {
      qty: 1,
      size: item.available_sizes[0],
      color: item.available_colors[0],
      price: item.price,
      name: item.name
    };
    highlightMerchCard(merchId, true);
  }
  loadMerchandiseCatalog();
  calculateOrderSummary();
}

function highlightMerchCard(merchId, isSelected) {
  const card = document.getElementById(`merch-card-${merchId}`);
  if (card) card.classList.toggle('selected', isSelected);
}

function calculateOrderSummary() {
  let merchTotal = 0;
  let merchCount = 0;

  Object.values(appState.selectedMerch).forEach(item => {
    merchTotal += (item.qty * item.price);
    merchCount += item.qty;
  });

  const grandTotal = appState.ticketPrice + merchTotal;

  const breakdownEl = document.getElementById('summary-breakdown-text');
  const totalEl = document.getElementById('summary-total-amount');

  if (breakdownEl) {
    breakdownEl.textContent = `Tiket: ${formatRupiah(appState.ticketPrice)} ${merchCount > 0 ? `+ Merch (${merchCount} pcs)` : ''}`;
  }
  if (totalEl) {
    totalEl.textContent = formatRupiah(grandTotal);
  }

  return { ticketPrice: appState.ticketPrice, merchTotal, grandTotal };
}

// ── 9. Submit Pendaftaran Peserta (Publik) ──
function submitRegistration() {
  const form = document.getElementById('form-registration');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fatherName = document.getElementById('reg-father-name').value.trim();
  const childName = document.getElementById('reg-child-name').value.trim();
  const childAge = parseInt(document.getElementById('reg-child-age').value, 10);
  const rawWa = document.getElementById('reg-whatsapp').value.trim();
  const address = document.getElementById('reg-address').value.trim();

  // Format Nomor WhatsApp
  let formattedWa = rawWa.replace(/\D/g, '');
  if (formattedWa.startsWith('0')) formattedWa = '62' + formattedWa.substring(1);
  else if (!formattedWa.startsWith('62')) formattedWa = '62' + formattedWa;

  const totals = calculateOrderSummary();
  const ticketCode = 'MKJ-' + Math.floor(100000 + Math.random() * 900000);

  const registrationData = {
    ticket_code: ticketCode,
    father_name: fatherName,
    child_name: childName,
    child_age: childAge,
    whatsapp_number: formattedWa,
    address: address,
    ticket_price: totals.ticketPrice,
    merch_total: totals.merchTotal,
    grand_total: totals.grandTotal,
    payment_status: 'pending',
    checkin_status: false
  };

  executeRegistrationSave(registrationData);
}

async function executeRegistrationSave(regData) {
  if (!supabase) {
    // Mode demo tanpa backend
    appState.activeRegistration = { id: 'mock-reg-id', ...regData };
    setupPaymentPage(appState.activeRegistration);
    navigateTo('payment');
    showToast('Pendaftaran berhasil dicatat (Mode Demo)', 'success');
    return;
  }

  showLoading('Menyimpan pendaftaran...');
  try {
    const { data: insertedReg, error: regErr } = await supabase
      .from('registrations')
      .insert(regData)
      .select()
      .single();

    if (regErr) throw regErr;

    // Simpan item merchandise jika ada yang dipesan
    const merchEntries = Object.entries(appState.selectedMerch);
    if (merchEntries.length > 0) {
      const itemsToInsert = merchEntries.map(([merchId, item]) => ({
        registration_id: insertedReg.id,
        merchandise_id: merchId.startsWith('mock') ? null : merchId,
        item_name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.qty,
        price_per_item: item.price,
        subtotal: item.qty * item.price
      }));

      await supabase.from('registration_merchandise').insert(itemsToInsert);
    }

    appState.activeRegistration = insertedReg;
    setupPaymentPage(insertedReg);
    navigateTo('payment');
    showToast('Pendaftaran berhasil dicatat!', 'success');
  } catch (err) {
    console.error('Error saving registration:', err);
    showToast(err.message || 'Gagal menyimpan pendaftaran.', 'error');
  } finally {
    hideLoading();
  }
}

function setupPaymentPage(reg) {
  document.getElementById('pay-bank-name').textContent = appState.appConfig.bank_name || 'BANK BCA';
  document.getElementById('pay-ticket-code').textContent = reg.ticket_code;
  document.getElementById('pay-account-num').textContent = appState.appConfig.bank_account_number || '0901234567';
  document.getElementById('pay-account-holder').textContent = appState.appConfig.bank_account_holder || 'PANITIA EVENT MKJ';
  document.getElementById('pay-grand-total').textContent = formatRupiah(reg.grand_total);
}

// ── 10. Upload Bukti Pembayaran ke Supabase Storage ──
function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran file maksimal 5MB!', 'error');
    event.target.value = '';
    return;
  }

  appState.selectedReceiptFile = file;

  // Render preview
  const previewContainer = document.getElementById('file-preview-container');
  const previewImg = document.getElementById('file-preview-img');
  const nameLabel = document.getElementById('file-name-label');

  nameLabel.textContent = file.name;

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.src = 'https://via.placeholder.com/300x150?text=Dokumen+PDF';
    previewContainer.classList.remove('d-none');
  }
}

function removeSelectedFile() {
  appState.selectedReceiptFile = null;
  document.getElementById('file-payment-receipt').value = '';
  document.getElementById('file-preview-container').classList.add('d-none');
}

async function uploadReceiptAndFinish() {
  if (!appState.selectedReceiptFile) {
    showToast('Silakan pilih file bukti transfer terlebih dahulu!', 'warning');
    return;
  }

  if (!appState.activeRegistration) {
    showToast('Data pendaftaran tidak ditemukan.', 'error');
    navigateTo('register');
    return;
  }

  showLoading('Mengunggah bukti pembayaran...');
  try {
    let receiptUrl = 'https://via.placeholder.com/400x600?text=Bukti+Transfer';

    if (supabase) {
      const file = appState.selectedReceiptFile;
      const fileExt = file.name.split('.').pop();
      const filePath = `receipts/${appState.activeRegistration.ticket_code}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      receiptUrl = publicUrlData.publicUrl;

      // Update URL struk di tabel registrations
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({ payment_receipt_url: receiptUrl })
        .eq('id', appState.activeRegistration.id);

      if (updateErr) throw updateErr;
    }

    showToast('Bukti transfer berhasil dikirim! Panitia akan segera memverifikasi.', 'success');
    navigateTo('status');
    displayTicketStatusResult({
      ...appState.activeRegistration,
      payment_receipt_url: receiptUrl
    });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    showToast(err.message || 'Gagal mengunggah bukti transfer.', 'error');
  } finally {
    hideLoading();
  }
}

// ── 11. Cek Status Pendaftaran & Tiket (Publik) ──
async function searchTicketStatus() {
  const query = document.getElementById('input-search-ticket').value.trim();
  if (!query) {
    showToast('Masukkan nomor WhatsApp atau kode tiket!', 'warning');
    return;
  }

  let formattedQuery = query;
  if (query.startsWith('0')) formattedQuery = '62' + query.substring(1);

  showLoading('Mencari data tiket...');
  try {
    let result = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, registration_merchandise(*)')
        .or(`ticket_code.eq.${query.toUpperCase()},whatsapp_number.eq.${formattedQuery}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      result = data;
    } else {
      result = appState.activeRegistration;
    }

    if (!result) {
      showToast('Data tiket tidak ditemukan. Pastikan nomor WhatsApp atau kode tiket benar.', 'error');
      document.getElementById('ticket-result-container').classList.add('d-none');
    } else {
      displayTicketStatusResult(result);
    }
  } catch (err) {
    console.error('Search ticket error:', err);
    showToast(err.message || 'Gagal mencari tiket.', 'error');
  } finally {
    hideLoading();
  }
}

function displayTicketStatusResult(reg) {
  const container = document.getElementById('ticket-result-container');
  if (!container) return;

  const isVerified = reg.payment_status === 'verified';
  const isRejected = reg.payment_status === 'rejected';

  container.innerHTML = `
    <div class="bank-card border-${isVerified ? 'success' : isRejected ? 'danger' : 'warning'}">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge-status ${isVerified ? 'badge-verified' : isRejected ? 'badge-rejected' : 'badge-pending'}">
          <i class="fa-solid ${isVerified ? 'fa-circle-check' : isRejected ? 'fa-circle-xmark' : 'fa-clock'}"></i>
          ${isVerified ? 'LUNAS / VERIFIED' : isRejected ? 'DITOLAK' : 'MENUNGGU VERIFIKASI'}
        </span>
        <span class="font-display fs-5 text-warning">${reg.ticket_code}</span>
      </div>

      <div class="mb-2">
        <div class="text-muted small">Peserta Touring:</div>
        <div class="fw-bold text-white fs-5">${reg.father_name} & ${reg.child_name} (${reg.child_age} Thn)</div>
      </div>

      <div class="row g-2 my-2 py-2 border-top border-bottom border-dark">
        <div class="col-6">
          <span class="text-muted small">No WhatsApp:</span>
          <div class="text-white">${reg.whatsapp_number}</div>
        </div>
        <div class="col-6">
          <span class="text-muted small">Total Tagihan:</span>
          <div class="text-warning fw-bold font-display fs-5">${formatRupiah(reg.grand_total)}</div>
        </div>
      </div>

      <div class="mb-3">
        <span class="text-muted small">Status Check-in di Venue:</span>
        <div class="mt-1">
          <span class="badge bg-${reg.checkin_status ? 'success' : 'secondary'}">
            <i class="fa-solid ${reg.checkin_status ? 'fa-circle-check' : 'fa-hourglass-start'} me-1"></i>
            ${reg.checkin_status ? 'SUDAH CHECK-IN' : 'BELUM CHECK-IN'}
          </span>
        </div>
      </div>

      ${isVerified ? `
        <div class="alert alert-success bg-dark border-success text-white small mb-0">
          <i class="fa-solid fa-circle-check text-success me-2"></i>
          Pembayaran Anda telah diverifikasi! Panitia akan mengirimkan tiket PDF resmi dan barcode via WhatsApp.
        </div>
      ` : `
        <div class="alert alert-warning bg-dark border-warning text-white small mb-0">
          <i class="fa-solid fa-info-circle text-warning me-2"></i>
          ${reg.payment_receipt_url ? 'Bukti bayar sedang dalam antrean verifikasi tim panitia.' : 'Silakan upload bukti transfer agar slot tiket segera diamankan.'}
        </div>
      `}
    </div>
  `;
  container.classList.remove('d-none');
}

// ── 12. Admin Authentication & Dashboard ──
async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  if (!supabase) {
    appState.currentUser = { email: email, role: 'admin' };
    updateAdminNavUI(true);
    navigateTo('admin-dashboard');
    showToast('Masuk sebagai Admin (Demo Mode)', 'success');
    return;
  }

  showLoading('Memvalidasi login admin...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    appState.currentUser = data.user;
    updateAdminNavUI(true);
    navigateTo('admin-dashboard');
    showToast('Selamat datang di Dashboard Admin!', 'success');
  } catch (err) {
    console.error('Login error:', err);
    showToast(err.message || 'Email atau password admin salah.', 'error');
  } finally {
    hideLoading();
  }
}

async function handleAdminLogout() {
  if (supabase) await supabase.auth.signOut();
  appState.currentUser = null;
  updateAdminNavUI(false);
  navigateTo('register');
  showToast('Berhasil keluar.', 'success');
}

// ── 13. Dashboard Realtime Registrations & KPI ──
async function loadDashboardRegistrations() {
  showLoading('Memuat data pendaftaran...');
  try {
    let data = [];
    if (supabase) {
      const res = await supabase
        .from('registrations')
        .select('*, registration_merchandise(*)')
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      data = res.data || [];
    } else {
      data = [
        {
          id: '1',
          ticket_code: 'MKJ-2026-001',
          father_name: 'Budi Santoso',
          child_name: 'Arka Santoso',
          child_age: 7,
          whatsapp_number: '6281234567891',
          grand_total: 160000,
          payment_receipt_url: 'https://images.unsplash.com/photo-1554415707-9e49017a1430?w=400',
          payment_status: 'verified',
          checkin_status: true,
          registration_merchandise: [{ item_name: 'OFFICIAL T-SHIRT MKJ #1', size: 'L', color: 'Hitam', quantity: 1 }]
        },
        {
          id: '2',
          ticket_code: 'MKJ-2026-002',
          father_name: 'Ahmad Fauzi',
          child_name: 'Raihan Fauzi',
          child_age: 5,
          whatsapp_number: '6281298765432',
          grand_total: 75000,
          payment_receipt_url: 'https://images.unsplash.com/photo-1554415707-9e49017a1430?w=400',
          payment_status: 'pending',
          checkin_status: false,
          registration_merchandise: []
        }
      ];
    }

    appState.allRegistrations = data;
    updateKpiMetrics(data);
    renderRegistrationsTable(data);
    document.getElementById('last-sync-time').textContent = 'Update: ' + new Date().toLocaleTimeString('id-ID');
  } catch (err) {
    console.error('Error loading registrations:', err);
    showToast(err.message || 'Gagal memuat data pendaftaran.', 'error');
  } finally {
    hideLoading();
  }
}

function updateKpiMetrics(registrations) {
  const total = registrations.length;
  let verifiedMoney = 0;
  let pendingCount = 0;
  let checkinCount = 0;

  registrations.forEach(r => {
    if (r.payment_status === 'verified') {
      verifiedMoney += Number(r.grand_total || 0);
    }
    if (r.payment_status === 'pending') {
      pendingCount++;
    }
    if (r.checkin_status) {
      checkinCount++;
    }
  });

  const percent = total > 0 ? Math.round((checkinCount / total) * 100) : 0;

  document.getElementById('kpi-total-reg').textContent = total;
  document.getElementById('kpi-total-money').textContent = formatRupiah(verifiedMoney);
  document.getElementById('kpi-pending-count').textContent = pendingCount;
  document.getElementById('kpi-checkin-count').textContent = `${checkinCount} / ${total}`;
  document.getElementById('kpi-checkin-percent').textContent = `${percent}% Kehadiran`;
}

function renderRegistrationsTable(registrations) {
  const tbody = document.getElementById('registrations-tbody');
  if (!tbody) return;

  if (registrations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Belum ada data pendaftaran.</td></tr>`;
    return;
  }

  tbody.innerHTML = registrations.map(reg => {
    const isVerified = reg.payment_status === 'verified';
    const isRejected = reg.payment_status === 'rejected';
    const hasMerch = reg.registration_merchandise && reg.registration_merchandise.length > 0;
    const merchDesc = hasMerch
      ? reg.registration_merchandise.map(m => `${m.quantity}x ${m.item_name} (${m.size}/${m.color})`).join(', ')
      : 'Tiket Saja';

    return `
      <tr>
        <td><strong class="text-warning font-display">${reg.ticket_code}</strong></td>
        <td>
          <div class="fw-bold text-white">${reg.father_name}</div>
          <div class="small text-muted">Anak: ${reg.child_name} (${reg.child_age}th)</div>
        </td>
        <td>
          <a href="https://wa.me/${reg.whatsapp_number}" target="_blank" class="text-white text-decoration-none small">
            <i class="fa-brands fa-whatsapp text-success me-1"></i> ${reg.whatsapp_number}
          </a>
        </td>
        <td>
          <div class="text-warning fw-bold">${formatRupiah(reg.grand_total)}</div>
          <div class="small text-muted text-truncate" style="max-width: 180px;" title="${merchDesc}">${merchDesc}</div>
        </td>
        <td>
          ${reg.payment_receipt_url ? `
            <button class="btn btn-sm btn-outline-warning" onclick="openProofModal('${reg.id}')">
              <i class="fa-solid fa-image me-1"></i> Cek Struk
            </button>
          ` : `<span class="badge bg-secondary">Belum Upload</span>`}
        </td>
        <td>
          <span class="badge-status ${isVerified ? 'badge-verified' : isRejected ? 'badge-rejected' : 'badge-pending'}">
            ${reg.payment_status}
          </span>
        </td>
        <td>
          <span class="badge bg-${reg.checkin_status ? 'success' : 'secondary'}">
            ${reg.checkin_status ? 'SUDAH' : 'BELUM'}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-sm btn-outline-success" title="Setujui Pembayaran" onclick="updatePaymentStatusDirect('${reg.id}', 'verified')">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" title="Tolak" onclick="updatePaymentStatusDirect('${reg.id}', 'rejected')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterRegistrationTable() {
  const searchTerm = document.getElementById('table-search-input').value.toLowerCase();
  const paymentFilter = document.getElementById('filter-payment-status').value;
  const checkinFilter = document.getElementById('filter-checkin-status').value;

  const filtered = appState.allRegistrations.filter(r => {
    const matchSearch =
      r.ticket_code.toLowerCase().includes(searchTerm) ||
      r.father_name.toLowerCase().includes(searchTerm) ||
      r.child_name.toLowerCase().includes(searchTerm) ||
      r.whatsapp_number.includes(searchTerm);

    const matchPayment = paymentFilter === 'all' || r.payment_status === paymentFilter;
    const matchCheckin =
      checkinFilter === 'all' ||
      (checkinFilter === 'checked' && r.checkin_status) ||
      (checkinFilter === 'not_checked' && !r.checkin_status);

    return matchSearch && matchPayment && matchCheckin;
  });

  renderRegistrationsTable(filtered);
}

// ── 14. Realtime Subscription ──
function initRealtimeChannel() {
  if (!supabase || appState.realtimeSubscription) return;

  appState.realtimeSubscription = supabase
    .channel('realtime:registrations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
      loadDashboardRegistrations();
    })
    .subscribe();
}

// ── 15. Modal Verifikasi Pembayaran ──
let activeModalRegId = null;

function openProofModal(regId) {
  const reg = appState.allRegistrations.find(r => r.id === regId);
  if (!reg) return;

  activeModalRegId = regId;
  document.getElementById('modal-proof-img').src = reg.payment_receipt_url || '';
  document.getElementById('modal-proof-code').textContent = reg.ticket_code;
  document.getElementById('modal-proof-father').textContent = reg.father_name;
  document.getElementById('modal-proof-child').textContent = `${reg.child_name} (${reg.child_age} Thn)`;
  document.getElementById('modal-proof-total').textContent = formatRupiah(reg.grand_total);

  const hasMerch = reg.registration_merchandise && reg.registration_merchandise.length > 0;
  document.getElementById('modal-proof-merch').textContent = hasMerch
    ? reg.registration_merchandise.map(m => `${m.quantity}x ${m.item_name} (${m.size}/${m.color})`).join(', ')
    : 'Tiket Saja (Tanpa Merch)';

  const modal = new bootstrap.Modal(document.getElementById('modal-proof-preview'));
  modal.show();
}

async function confirmVerifyPayment(status) {
  if (!activeModalRegId) return;
  await updatePaymentStatusDirect(activeModalRegId, status);
  const modalEl = document.getElementById('modal-proof-preview');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

async function updatePaymentStatusDirect(regId, status) {
  if (supabase) {
    await callSupabase(
      supabase.from('registrations').update({ payment_status: status }).eq('id', regId),
      `Status pembayaran diubah menjadi ${status}!`
    );
    loadDashboardRegistrations();
  } else {
    const target = appState.allRegistrations.find(r => r.id === regId);
    if (target) target.payment_status = status;
    updateKpiMetrics(appState.allRegistrations);
    renderRegistrationsTable(appState.allRegistrations);
    showToast(`Status pembayaran diubah menjadi ${status}! (Demo Mode)`, 'success');
  }
}

// ── 16. Smartphone QR Scanner Check-in ──
function initQrScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Library scanner belum siap.', 'error');
    return;
  }

  if (appState.html5QrScanner) {
    stopScanner();
  }

  appState.html5QrScanner = new Html5Qrcode('qr-reader');
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  appState.html5QrScanner.start(
    { facingMode: 'environment' },
    config,
    onQrCodeSuccess,
    (err) => { /* ignore frame errors */ }
  ).catch(err => {
    console.error('Camera start error:', err);
    showToast('Gagal mengakses kamera. Izinkan akses kamera pada browser Anda.', 'error');
  });
}

function stopScanner() {
  if (appState.html5QrScanner) {
    try {
      appState.html5QrScanner.stop().then(() => {
        appState.html5QrScanner.clear();
        appState.html5QrScanner = null;
      });
    } catch (e) {
      appState.html5QrScanner = null;
    }
  }
}

function restartScanner() {
  stopScanner();
  setTimeout(() => initQrScanner(), 300);
}

function switchCamera() {
  restartScanner();
}

function onQrCodeSuccess(decodedText) {
  if (!decodedText) return;
  stopScanner();
  processTicketCheckin(decodedText.trim());
}

async function processTicketCheckin(ticketCode) {
  if (!ticketCode) {
    showToast('Masukkan kode tiket!', 'warning');
    return;
  }

  showLoading('Memvalidasi tiket peserta...');
  try {
    let reg = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, registration_merchandise(*)')
        .eq('ticket_code', ticketCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      reg = data;
    } else {
      reg = appState.allRegistrations.find(r => r.ticket_code.toUpperCase() === ticketCode.toUpperCase());
    }

    if (!reg) {
      showScanResultModal(false, 'TIKET TIDAK DITEMUKAN', `Kode "${ticketCode}" tidak terdaftar di sistem.`, null);
      return;
    }

    if (reg.payment_status !== 'verified') {
      showScanResultModal(false, 'PEMBAYARAN BELUM LUNAS', `Tiket ${ticketCode} berstatus "${reg.payment_status}". Arahkan peserta ke meja penyelesaian administrasi.`, reg);
      return;
    }

    if (reg.checkin_status) {
      showScanResultModal(false, 'TIKET SUDAH CHECK-IN', `Tiket ${ticketCode} sudah pernah digunakan check-in sebelumnya!`, reg);
      return;
    }

    // Eksekusi Check-in Berhasil
    if (supabase) {
      await supabase
        .from('registrations')
        .update({ checkin_status: true, checkin_at: new Date().toISOString() })
        .eq('id', reg.id);
    } else {
      reg.checkin_status = true;
    }

    showScanResultModal(true, 'CHECK-IN BERHASIL!', `Selamat datang di event Motoran Karo Jasak #1!`, reg);
  } catch (err) {
    console.error('Checkin error:', err);
    showToast(err.message || 'Gagal memproses check-in tiket.', 'error');
  } finally {
    hideLoading();
  }
}

function showScanResultModal(isSuccess, title, subtitle, reg) {
  const iconContainer = document.getElementById('scan-icon-container');
  const titleEl = document.getElementById('scan-result-title');
  const subEl = document.getElementById('scan-result-subtitle');
  const detailsEl = document.getElementById('scan-result-details');

  iconContainer.innerHTML = isSuccess
    ? `<i class="fa-solid fa-circle-check text-success"></i>`
    : `<i class="fa-solid fa-circle-xmark text-danger"></i>`;

  titleEl.textContent = title;
  titleEl.className = `font-display mb-1 ${isSuccess ? 'text-success' : 'text-danger'}`;
  subEl.textContent = subtitle;

  if (reg) {
    const hasMerch = reg.registration_merchandise && reg.registration_merchandise.length > 0;
    detailsEl.innerHTML = `
      <div class="small mb-1">Kode Tiket: <strong class="text-warning">${reg.ticket_code}</strong></div>
      <div class="small mb-1">Nama Ayah: <strong class="text-white">${reg.father_name}</strong></div>
      <div class="small mb-1">Nama Anak: <strong class="text-white">${reg.child_name} (${reg.child_age} Thn)</strong></div>
      <div class="small mb-1">WhatsApp: <strong class="text-white">${reg.whatsapp_number}</strong></div>
      <hr class="border-secondary my-2" />
      <div class="small fw-bold text-warning mb-1">PENGAMBILAN MERCHANDISE DI MEJA REGISTRASI:</div>
      <div class="small text-white">${hasMerch ? reg.registration_merchandise.map(m => `📦 <strong>${m.quantity}x ${m.item_name}</strong> (Size: ${m.size} | Warna: ${m.color})`).join('<br>') : '🎫 <em>Paket Standar (Sticker, Kupon, Medali)</em>'}</div>
    `;
    detailsEl.classList.remove('d-none');
  } else {
    detailsEl.classList.add('d-none');
  }

  const modal = new bootstrap.Modal(document.getElementById('modal-scan-result'));
  modal.show();
}

// ── 17. Export Data ke CSV ──
function exportDataToCSV() {
  if (appState.allRegistrations.length === 0) {
    showToast('Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const headers = ['Kode Tiket', 'Nama Ayah', 'Nama Anak', 'Usia Anak', 'WhatsApp', 'Alamat', 'Total Biaya', 'Status Bayar', 'Status Checkin', 'Merchandise'];
  const rows = appState.allRegistrations.map(r => {
    const merch = (r.registration_merchandise || []).map(m => `${m.quantity}x ${m.item_name} (${m.size}/${m.color})`).join('; ');
    return [
      r.ticket_code,
      `"${r.father_name}"`,
      `"${r.child_name}"`,
      r.child_age,
      `"${r.whatsapp_number}"`,
      `"${r.address.replace(/"/g, '""')}"`,
      r.grand_total,
      r.payment_status,
      r.checkin_status ? 'Sudah' : 'Belum',
      `"${merch}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MKJ_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── 18. Utilities: Copy Text & Nominal ──
function copyText(elementId, msg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim());
  showToast(msg || 'Teks disalin ke clipboard!', 'success');
}

function copyNominal(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const rawNum = el.textContent.replace(/\D/g, '');
  navigator.clipboard.writeText(rawNum);
  showToast('Nominal transfer disalin!', 'success');
}

// ── 19. Theme Switcher ──
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mkj_theme', next);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun text-warning';
  }
}

function initTheme() {
  const saved = localStorage.getItem('mkj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = saved === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun text-warning';
  }
}