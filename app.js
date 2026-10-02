<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>MKJ Web — Motoran Karo Jasak</title>
  <meta name="description" content="Platform pendaftaran event motoran ayah-anak, pemesanan merchandise resmi, dan manajemen check-in tiket." />

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

  <!-- Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />

  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />

  <!-- Custom CSS -->
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- ============================================================ -->
  <!-- LOADING OVERLAY                                              -->
  <!-- ============================================================ -->
  <div id="loading-overlay" class="d-none">
    <div class="loading-inner">
      <div class="spinner-ring"></div>
      <span class="loading-text">Loading...</span>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- TOAST CONTAINER                                              -->
  <!-- ============================================================ -->
  <div id="toast-container"></div>

  <!-- ============================================================ -->
  <!-- APP WRAPPER                                                   -->
  <!-- ============================================================ -->
  <div id="app">

    <!-- ======================================================= -->
    <!-- SECTION: HALAMAN PUBLIK (Form Registrasi)               -->
    <!-- ======================================================= -->
    <div id="section-public" class="app-section">

      <!-- Header Publik -->
      <header class="public-header">
        <div class="container py-3">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="mkj-logo-badge">MKJ</div>
              <div>
                <div class="mkj-brand-name">MOTORAN KARO JASAK</div>
                <div class="mkj-brand-sub" id="header-event-date">Event Touring Ayah &amp; Anak</div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn-icon-ghost" onclick="toggleDarkMode()" title="Toggle dark mode">
                <i class="bi bi-circle-half" id="theme-icon"></i>
              </button>
              <a href="#" class="btn-admin-link" onclick="navigateTo('login'); return false;">
                <i class="bi bi-shield-lock-fill me-1"></i>Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Banner -->
      <div class="public-hero">
        <div class="container">
          <div class="hero-content text-center">
            <div class="hero-badge mb-3">🏍️ EVENT RESMI 2026</div>
            <h1 class="hero-title">GAS BARENG,<br>KENANGAN BARENG</h1>
            <p class="hero-sub" id="hero-tagline">Bersama Ayah Tercinta — Event Motoran Spesial Ayah &amp; Anak</p>
            <div class="hero-meta" id="hero-event-info">
              <span><i class="bi bi-calendar3"></i> <span id="hero-date">Loading...</span></span>
              <span><i class="bi bi-geo-alt-fill"></i> <span id="hero-location">Loading...</span></span>
              <span><i class="bi bi-ticket-fill"></i> Tiket Rp <span id="hero-price">75.000</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Form Area -->
      <div class="container py-4 pb-5">
        <div class="row justify-content-center">
          <div class="col-12 col-md-10 col-lg-8 col-xl-7">

            <!-- ---- STEP 1: Data Peserta ---- -->
            <div class="form-card mb-4">
              <div class="form-card-header">
                <div class="step-badge">1</div>
                <div>
                  <h2 class="form-card-title">Data Peserta &amp; Tiket</h2>
                  <p class="form-card-sub">Isi data ayah dan anak yang akan mengikuti touring</p>
                </div>
                <div class="ticket-price-badge">Rp 75.000</div>
              </div>
              <div class="form-card-body">
                <div class="row g-3">
                  <div class="col-12 col-sm-6">
                    <label class="form-label-custom">Nama Lengkap Ayah *</label>
                    <input type="text" id="father-name" class="form-input-custom" placeholder="Contoh: Budi Santoso" required />
                  </div>
                  <div class="col-12 col-sm-6">
                    <label class="form-label-custom">Nama Lengkap Anak *</label>
                    <input type="text" id="child-name" class="form-input-custom" placeholder="Contoh: Arka Pratama" required />
                  </div>
                  <div class="col-12 col-sm-6">
                    <label class="form-label-custom">Usia Anak (Tahun) *</label>
                    <select id="child-age" class="form-input-custom">
                      <option value="">Pilih usia...</option>
                      <option value="3">3 Tahun</option>
                      <option value="4">4 Tahun</option>
                      <option value="5">5 Tahun</option>
                      <option value="6">6 Tahun</option>
                      <option value="7">7 Tahun</option>
                      <option value="8">8 Tahun</option>
                      <option value="9">9 Tahun</option>
                      <option value="10">10 Tahun</option>
                      <option value="11">11 Tahun</option>
                      <option value="12">12 Tahun</option>
                      <option value="13">13 Tahun</option>
                      <option value="14">14+ Tahun</option>
                    </select>
                  </div>
                  <div class="col-12 col-sm-6">
                    <label class="form-label-custom">No. WhatsApp Aktif *</label>
                    <input type="tel" id="whatsapp-number" class="form-input-custom" placeholder="0812-xxxx-xxxx" required />
                    <small class="form-hint">Tiket barcode dikirim via WhatsApp</small>
                  </div>
                  <div class="col-12">
                    <label class="form-label-custom">Alamat Domisili Lengkap *</label>
                    <textarea id="address" class="form-input-custom" rows="2" placeholder="Alamat lengkap untuk koordinasi rute touring..." required></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- ---- STEP 2: Katalog Merchandise ---- -->
            <div class="form-card mb-4">
              <div class="form-card-header">
                <div class="step-badge">2</div>
                <div>
                  <h2 class="form-card-title">Merchandise Resmi</h2>
                  <p class="form-card-sub">Pilih merchandise eksklusif event (opsional)</p>
                </div>
              </div>
              <div class="form-card-body">
                <div id="merch-catalog-grid" class="merch-grid">
                  <!-- Diisi oleh JavaScript -->
                  <div class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm me-2"></div>
                    Memuat katalog merchandise...
                  </div>
                </div>
              </div>
            </div>

            <!-- ---- STEP 3: Ringkasan & Tombol Daftar ---- -->
            <div class="order-summary-card mb-4">
              <div class="order-summary-header">
                <span class="order-summary-label">RINGKASAN PESANAN</span>
              </div>
              <div class="order-summary-body">
                <div class="order-line">
                  <span>Tiket Event</span>
                  <span>Rp 75.000</span>
                </div>
                <div id="merch-summary-lines">
                  <!-- Diisi JavaScript -->
                </div>
                <div class="order-total-line">
                  <span>TOTAL TAGIHAN</span>
                  <span id="grand-total-display">Rp 75.000</span>
                </div>
              </div>
              <button id="btn-submit-reg" class="btn-primary-orange w-100" onclick="submitRegistration()">
                <i class="bi bi-arrow-right-circle-fill me-2"></i>
                Lanjut ke Pembayaran &amp; Upload Bukti
              </button>
            </div>

          </div><!-- /col -->
        </div><!-- /row -->
      </div><!-- /container -->
    </div><!-- /section-public -->


    <!-- ======================================================= -->
    <!-- SECTION: KONFIRMASI PEMBAYARAN & UPLOAD BUKTI           -->
    <!-- ======================================================= -->
    <div id="section-payment" class="app-section d-none">
      <header class="public-header">
        <div class="container py-3">
          <div class="d-flex align-items-center gap-3">
            <button class="btn-back" onclick="navigateTo('public')">
              <i class="bi bi-arrow-left"></i>
            </button>
            <div class="mkj-logo-badge">MKJ</div>
            <div class="mkj-brand-name">KONFIRMASI PEMBAYARAN</div>
          </div>
        </div>
      </header>

      <div class="container py-4 pb-5">
        <div class="row justify-content-center">
          <div class="col-12 col-md-8 col-lg-6">

            <!-- Success Banner -->
            <div class="success-banner mb-4">
              <div class="success-icon"><i class="bi bi-check-circle-fill"></i></div>
              <h2 class="success-title">PENDAFTARAN BERHASIL DICATAT!</h2>
              <p class="success-sub">Selesaikan pembayaran untuk mengaktifkan tiket Anda</p>
            </div>

            <!-- Info Tiket -->
            <div class="ticket-info-card mb-4">
              <div class="ticket-info-header">
                <span>DETAIL PENDAFTARAN</span>
                <span id="pay-ticket-code" class="ticket-code-badge">MKJ-2026-XXXX</span>
              </div>
              <div class="ticket-info-body">
                <div class="info-row"><span>Nama Ayah</span><strong id="pay-father-name">—</strong></div>
                <div class="info-row"><span>Nama Anak</span><strong id="pay-child-name">—</strong></div>
                <div class="info-row"><span>Tiket Event</span><strong>Rp 75.000</strong></div>
                <div id="pay-merch-lines"></div>
                <div class="info-row total"><span>TOTAL BAYAR</span><strong id="pay-grand-total" class="total-amount">Rp 75.000</strong></div>
              </div>
            </div>

            <!-- Instruksi Transfer -->
            <div class="bank-transfer-card mb-4">
              <div class="bank-card-header">
                <i class="bi bi-bank2 me-2"></i>INSTRUKSI TRANSFER BANK
              </div>
              <div class="bank-card-body">
                <div class="bank-info-grid">
                  <div class="bank-info-item">
                    <span class="bank-label">BANK</span>
                    <span class="bank-value" id="bank-name-display">BCA</span>
                  </div>
                  <div class="bank-info-item">
                    <span class="bank-label">NO. REKENING</span>
                    <div class="bank-account-wrap">
                      <span class="bank-account" id="bank-account-display">1234567890</span>
                      <button class="btn-copy" onclick="copyToClipboard('bank-account-display')" title="Salin nomor rekening">
                        <i class="bi bi-copy"></i>
                      </button>
                    </div>
                  </div>
                  <div class="bank-info-item">
                    <span class="bank-label">ATAS NAMA</span>
                    <span class="bank-value" id="bank-holder-display">—</span>
                  </div>
                  <div class="bank-info-item">
                    <span class="bank-label">NOMINAL</span>
                    <div class="bank-account-wrap">
                      <span class="bank-account accent-orange" id="pay-amount-display">Rp 75.000</span>
                      <button class="btn-copy" onclick="copyAmountToClipboard()" title="Salin nominal">
                        <i class="bi bi-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="bank-note">
                  <i class="bi bi-info-circle me-1"></i>
                  Transfer sesuai nominal tepat agar verifikasi lebih cepat
                </div>
              </div>
            </div>

            <!-- Upload Bukti Bayar -->
            <div class="form-card mb-4">
              <div class="form-card-header">
                <div class="step-badge">3</div>
                <div>
                  <h2 class="form-card-title">Upload Bukti Transfer</h2>
                  <p class="form-card-sub">JPG/PNG/PDF, maks 5MB</p>
                </div>
              </div>
              <div class="form-card-body">
                <div id="upload-drop-zone" class="upload-drop-zone" onclick="document.getElementById('receipt-file').click()">
                  <i class="bi bi-cloud-upload upload-icon"></i>
                  <p class="upload-title">Klik atau drag &amp; drop file bukti transfer</p>
                  <p class="upload-sub">Format: JPG, PNG, atau PDF • Maks 5MB</p>
                  <input type="file" id="receipt-file" accept="image/*,.pdf" class="d-none" onchange="handleFileSelect(this)" />
                </div>
                <div id="file-preview-wrap" class="d-none mt-3">
                  <div class="file-preview-item">
                    <i class="bi bi-file-check-fill text-success me-2"></i>
                    <span id="file-preview-name">—</span>
                    <button class="btn-remove-file ms-auto" onclick="removeFile()">
                      <i class="bi bi-x-circle-fill"></i>
                    </button>
                  </div>
                </div>
                <button id="btn-upload-receipt" class="btn-primary-orange w-100 mt-3" onclick="uploadReceipt()" disabled>
                  <i class="bi bi-cloud-upload-fill me-2"></i>
                  Kirim Bukti Pembayaran
                </button>
              </div>
            </div>

            <!-- Tagline -->
            <div class="tagline-banner text-center mb-4">
              <p class="tagline-text" id="tagline-display">"MOTORAN KARO JASAK — Gas Bareng, Kenangan Bareng, Bersama Ayah Tercinta."</p>
            </div>

          </div>
        </div>
      </div>
    </div><!-- /section-payment -->


    <!-- ======================================================= -->
    <!-- SECTION: STATUS PENDAFTARAN                             -->
    <!-- ======================================================= -->
    <div id="section-status" class="app-section d-none">
      <header class="public-header">
        <div class="container py-3">
          <div class="d-flex align-items-center gap-3">
            <button class="btn-back" onclick="navigateTo('public')">
              <i class="bi bi-arrow-left"></i>
            </button>
            <div class="mkj-logo-badge">MKJ</div>
            <div class="mkj-brand-name">STATUS PENDAFTARAN</div>
          </div>
        </div>
      </header>

      <div class="container py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-md-7 col-lg-5">

            <!-- Status Card -->
            <div class="status-card mb-4" id="status-result-card">
              <div class="status-icon-wrap" id="status-icon-area">
                <i class="bi bi-hourglass-split status-icon pending" id="status-main-icon"></i>
              </div>
              <h2 class="status-title" id="status-title-text">PENDAFTARAN DALAM PROSES</h2>
              <p class="status-subtitle" id="status-subtitle-text">Tim kami sedang memverifikasi bukti pembayaran Anda</p>

              <div class="status-details" id="status-details-area">
                <div class="info-row"><span>Kode Tiket</span><strong id="st-ticket-code">—</strong></div>
                <div class="info-row"><span>Nama Ayah</span><strong id="st-father-name">—</strong></div>
                <div class="info-row"><span>Nama Anak</span><strong id="st-child-name">—</strong></div>
                <div class="info-row"><span>Total Tagihan</span><strong id="st-grand-total">—</strong></div>
                <div class="info-row"><span>Status Bayar</span><strong id="st-payment-status">—</strong></div>
                <div class="info-row"><span>Status Check-in</span><strong id="st-checkin-status">—</strong></div>
              </div>
            </div>

            <!-- Tombol Tiket Digital -->
            <div id="btn-ticket-wrap" class="d-none mb-3">
              <button class="btn-primary-orange w-100" onclick="openTicketPage()">
                <i class="bi bi-ticket-perforated-fill me-2"></i>
                Lihat &amp; Download Tiket Digital
              </button>
            </div>

            <!-- Cek Status Form -->
            <div class="form-card">
              <div class="form-card-header">
                <div class="step-badge"><i class="bi bi-search"></i></div>
                <div>
                  <h2 class="form-card-title">Cek Status Tiket</h2>
                  <p class="form-card-sub">Masukkan kode tiket Anda</p>
                </div>
              </div>
              <div class="form-card-body">
                <div class="input-group-custom">
                  <input type="text" id="check-ticket-code" class="form-input-custom" placeholder="Contoh: MKJ-2026-0001" />
                  <button class="btn-primary-orange" onclick="checkTicketStatus()">
                    <i class="bi bi-search me-1"></i>Cek
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div><!-- /section-status -->


    <!-- ======================================================= -->
    <!-- SECTION: TIKET DIGITAL                                  -->
    <!-- ======================================================= -->
    <div id="section-ticket" class="app-section d-none">
      <header class="public-header">
        <div class="container py-3">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <button class="btn-back" onclick="navigateTo('status')">
                <i class="bi bi-arrow-left"></i>
              </button>
              <div class="mkj-logo-badge">MKJ</div>
              <div class="mkj-brand-name">TIKET DIGITAL</div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn-primary-orange" onclick="downloadTicket()">
                <i class="bi bi-download me-2"></i>Download PNG
              </button>
              <button class="btn-sm-outline" onclick="shareTicket()">
                <i class="bi bi-share me-1"></i>Bagikan
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="container py-4 pb-5">
        <div class="row justify-content-center">
          <div class="col-12 col-md-8 col-lg-6">

            <!-- INFO: Status Tiket -->
            <div id="ticket-status-notice" class="ticket-notice mb-3 d-none">
              <i class="bi bi-info-circle-fill me-2"></i>
              <span id="ticket-notice-text"></span>
            </div>

            <!-- TIKET DIGITAL — area yang akan di-screenshot -->
            <div id="ticket-card" class="ticket-card">

              <!-- Header Tiket -->
              <div class="ticket-header">
                <div class="ticket-header-left">
                  <div class="ticket-logo">MKJ</div>
                  <div>
                    <div class="ticket-event-name">MOTORAN KARO JASAK</div>
                    <div class="ticket-event-sub">Event Touring Ayah &amp; Anak</div>
                  </div>
                </div>
                <div class="ticket-year">2026</div>
              </div>

              <!-- Body Tiket -->
              <div class="ticket-body">
                <!-- Info Peserta -->
                <div class="ticket-info-section">
                  <div class="ticket-field">
                    <span class="ticket-field-label">NAMA AYAH</span>
                    <span class="ticket-field-value" id="tkt-father-name">—</span>
                  </div>
                  <div class="ticket-field">
                    <span class="ticket-field-label">NAMA ANAK</span>
                    <span class="ticket-field-value" id="tkt-child-name">—</span>
                  </div>
                  <div class="ticket-field-row">
                    <div class="ticket-field">
                      <span class="ticket-field-label">USIA ANAK</span>
                      <span class="ticket-field-value" id="tkt-child-age">—</span>
                    </div>
                    <div class="ticket-field">
                      <span class="ticket-field-label">TANGGAL EVENT</span>
                      <span class="ticket-field-value" id="tkt-event-date">—</span>
                    </div>
                  </div>
                  <div class="ticket-field">
                    <span class="ticket-field-label">LOKASI</span>
                    <span class="ticket-field-value" id="tkt-event-location">—</span>
                  </div>
                </div>

                <!-- Divider Sobek -->
                <div class="ticket-tear-divider">
                  <div class="tear-circle left"></div>
                  <div class="tear-line"></div>
                  <div class="tear-circle right"></div>
                </div>

                <!-- Kode & QR Section -->
                <div class="ticket-code-section">
                  <div class="ticket-code-left">
                    <!-- QR Code -->
                    <div class="ticket-qr-wrap">
                      <div id="ticket-qr-code"></div>
                    </div>
                    <div class="ticket-qr-label">Scan untuk verifikasi</div>
                  </div>
                  <div class="ticket-code-right">
                    <div class="ticket-code-label">KODE TIKET</div>
                    <div class="ticket-code-value" id="tkt-ticket-code">MKJ-2026-XXXX</div>
                    <!-- Barcode -->
                    <div class="ticket-barcode-wrap">
                      <svg id="ticket-barcode"></svg>
                    </div>
                    <div class="ticket-status-badge" id="tkt-status-badge">
                      <span id="tkt-status-text">PENDING</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Tiket -->
              <div class="ticket-footer">
                <span id="tkt-tagline">Gas Bareng, Kenangan Bareng, Bersama Ayah Tercinta.</span>
                <span class="ticket-footer-url">mkj-chi.vercel.app</span>
              </div>

            </div><!-- /ticket-card -->

            <!-- Cek Tiket Lain -->
            <div class="form-card mt-4">
              <div class="form-card-header">
                <div class="step-badge"><i class="bi bi-search"></i></div>
                <div>
                  <h2 class="form-card-title">Cek Tiket Lain</h2>
                  <p class="form-card-sub">Masukkan kode tiket untuk melihat tiket digital</p>
                </div>
              </div>
              <div class="form-card-body">
                <div class="input-group-custom">
                  <input type="text" id="ticket-check-input" class="form-input-custom text-uppercase"
                    placeholder="Contoh: MKJ-2026-0001"
                    onkeydown="if(event.key==='Enter') loadTicketByCode(this.value)" />
                  <button class="btn-primary-orange" onclick="loadTicketByCode(document.getElementById('ticket-check-input').value)">
                    <i class="bi bi-ticket-fill me-1"></i>Tampilkan
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div><!-- /section-ticket -->


    <!-- ======================================================= -->
    <!-- SECTION: LOGIN ADMIN                                    -->
    <!-- ======================================================= -->
    <div id="section-login" class="app-section d-none">
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <div class="mkj-logo-badge lg">MKJ</div>
          </div>
          <h2 class="login-title">ADMIN PORTAL</h2>
          <p class="login-sub">Motoran Karo Jasak — Event Management</p>

          <div class="mb-3">
            <label class="form-label-custom">Email Admin</label>
            <input type="email" id="login-email" class="form-input-custom" placeholder="admin@mkj.id" />
          </div>
          <div class="mb-4">
            <label class="form-label-custom">Password</label>
            <div class="password-wrap">
              <input type="password" id="login-password" class="form-input-custom" placeholder="Password" onkeydown="if(event.key==='Enter')signIn()" />
              <button class="btn-toggle-pass" onclick="togglePassword('login-password', this)">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </div>
          <button class="btn-primary-orange w-100" onclick="signIn()">
            <i class="bi bi-shield-lock-fill me-2"></i>Masuk ke Dashboard Admin
          </button>
          <div class="login-back mt-3 text-center">
            <a href="#" onclick="navigateTo('public'); return false;" class="text-muted small">
              ← Kembali ke halaman pendaftaran
            </a>
          </div>
        </div>
      </div>
    </div><!-- /section-login -->


    <!-- ======================================================= -->
    <!-- SECTION: DASHBOARD ADMIN                                -->
    <!-- ======================================================= -->
    <div id="section-dashboard" class="app-section d-none">

      <!-- Admin Navbar -->
      <nav class="admin-navbar">
        <div class="admin-nav-brand">
          <div class="mkj-logo-badge sm">MKJ</div>
          <span class="admin-nav-title">Admin Panel</span>
        </div>
        <div class="admin-nav-menu">
          <button class="admin-nav-item active" data-section="overview" onclick="switchAdminTab('overview', this)">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </button>
          <button class="admin-nav-item" data-section="registrations" onclick="switchAdminTab('registrations', this)">
            <i class="bi bi-people-fill"></i>
            <span>Peserta</span>
          </button>
          <button class="admin-nav-item" data-section="merchandise" onclick="switchAdminTab('merchandise', this)">
            <i class="bi bi-bag-fill"></i>
            <span>Merch</span>
          </button>
          <button class="admin-nav-item" data-section="scanner" onclick="switchAdminTab('scanner', this)">
            <i class="bi bi-qr-code-scan"></i>
            <span>Scan QR</span>
          </button>
          <button class="admin-nav-item" data-section="settings" onclick="switchAdminTab('settings', this)">
            <i class="bi bi-gear-fill"></i>
            <span>Pengaturan</span>
          </button>
        </div>
        <div class="admin-nav-actions">
          <button class="btn-icon-ghost" onclick="toggleDarkMode()" title="Toggle tema">
            <i class="bi bi-circle-half"></i>
          </button>
          <span class="admin-user-badge" id="admin-user-name">Admin</span>
          <button class="btn-logout" onclick="signOut()">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </nav>

      <!-- Admin Content Area -->
      <div class="admin-content">

        <!-- ---- TAB: OVERVIEW DASHBOARD ---- -->
        <div id="admin-tab-overview" class="admin-tab active">
          <div class="admin-page-header">
            <h1 class="admin-page-title">Dashboard Realtime</h1>
            <div class="admin-header-actions">
              <div class="realtime-dot"><span class="dot-pulse"></span>Live</div>
              <button class="btn-sm-outline" onclick="loadDashboard()">
                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid mb-4">
            <div class="kpi-card">
              <div class="kpi-icon orange"><i class="bi bi-people-fill"></i></div>
              <div>
                <div class="kpi-value" id="kpi-total">0</div>
                <div class="kpi-label">Total Pendaftar</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green"><i class="bi bi-cash-coin"></i></div>
              <div>
                <div class="kpi-value" id="kpi-revenue">Rp 0</div>
                <div class="kpi-label">Uang Masuk Terverifikasi</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon blue"><i class="bi bi-hourglass-split"></i></div>
              <div>
                <div class="kpi-value" id="kpi-pending">0</div>
                <div class="kpi-label">Menunggu Verifikasi</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon yellow"><i class="bi bi-qr-code-scan"></i></div>
              <div>
                <div class="kpi-value" id="kpi-checkin">0 / 0</div>
                <div class="kpi-label">Check-in vs Belum</div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="row g-3 mb-4">
            <div class="col-12 col-md-7">
              <div class="chart-card">
                <div class="chart-card-header">
                  <span>Status Pembayaran</span>
                </div>
                <div class="chart-body">
                  <canvas id="chart-payment-status" height="200"></canvas>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <div class="chart-card">
                <div class="chart-card-header">
                  <span>Pendaftaran per Hari</span>
                </div>
                <div class="chart-body">
                  <canvas id="chart-daily-reg" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Insight -->
          <div class="ai-insight-card mb-4">
            <div class="ai-insight-header">
              <i class="bi bi-lightbulb-fill me-2 text-warning"></i>
              <span>Ringkasan AI</span>
            </div>
            <p class="ai-insight-text" id="ai-insight-text">Memuat analisis data...</p>
          </div>

          <!-- Tabel Pendaftaran Terbaru -->
          <div class="data-table-card">
            <div class="data-table-header">
              <span>Pendaftaran Terbaru</span>
              <button class="btn-sm-outline" onclick="switchAdminTab('registrations', document.querySelector('[data-section=registrations]'))">
                Lihat Semua <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
            <div class="table-responsive">
              <table class="data-table" id="recent-reg-table">
                <thead>
                  <tr>
                    <th>Kode Tiket</th>
                    <th>Nama Ayah</th>
                    <th>Nama Anak</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="recent-reg-tbody">
                  <tr><td colspan="6" class="text-center text-muted py-3">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ---- TAB: DAFTAR PESERTA ---- -->
        <div id="admin-tab-registrations" class="admin-tab d-none">
          <div class="admin-page-header">
            <h1 class="admin-page-title">Data Peserta</h1>
            <div class="admin-header-actions">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input type="text" id="search-reg" placeholder="Cari nama, kode tiket..." oninput="filterRegistrations(this.value)" />
              </div>
              <select id="filter-status" class="filter-select" onchange="filterRegistrations(document.getElementById('search-reg').value)">
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <button class="btn-sm-outline" onclick="exportCSV()">
                <i class="bi bi-download me-1"></i>Export CSV
              </button>
              <button class="btn-sm-outline" onclick="openAdminTicketModal()">
                <i class="bi bi-ticket-perforated-fill me-1"></i>Cetak Tiket
              </button>
            </div>
          </div>
          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Kode Tiket</th>
                    <th>Nama Ayah</th>
                    <th>Nama Anak</th>
                    <th>Usia</th>
                    <th>WhatsApp</th>
                    <th>Total Bayar</th>
                    <th>Status</th>
                    <th>Check-in</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="all-reg-tbody">
                  <tr><td colspan="9" class="text-center text-muted py-3">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ---- TAB: MASTER MERCHANDISE ---- -->
        <div id="admin-tab-merchandise" class="admin-tab d-none">
          <div class="admin-page-header">
            <h1 class="admin-page-title">Master Merchandise</h1>
            <button class="btn-primary-orange" onclick="openMerchModal()">
              <i class="bi bi-plus-lg me-1"></i>Tambah Item
            </button>
          </div>
          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nama Item</th>
                    <th>Harga</th>
                    <th>Ukuran Tersedia</th>
                    <th>Warna Tersedia</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="merch-admin-tbody">
                  <tr><td colspan="6" class="text-center text-muted py-3">Memuat data...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ---- TAB: SCANNER QR ---- -->
        <div id="admin-tab-scanner" class="admin-tab d-none">
          <div class="admin-page-header">
            <h1 class="admin-page-title">Scanner Check-in</h1>
          </div>
          <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-5">
              <div class="scanner-card mb-4">
                <div class="scanner-viewport" id="scanner-viewport">
                  <video id="scanner-video" class="scanner-video" autoplay muted playsinline></video>
                  <div class="scanner-overlay">
                    <div class="scanner-frame">
                      <div class="scan-corner tl"></div>
                      <div class="scan-corner tr"></div>
                      <div class="scan-corner bl"></div>
                      <div class="scan-corner br"></div>
                      <div class="scan-line" id="scan-line"></div>
                    </div>
                  </div>
                  <div class="scanner-placeholder" id="scanner-placeholder">
                    <i class="bi bi-camera-video-off text-muted" style="font-size:3rem"></i>
                    <p class="text-muted mt-2">Kamera belum aktif</p>
                  </div>
                </div>
                <div class="scanner-controls">
                  <button class="btn-primary-orange w-100" id="btn-start-scan" onclick="startScanner()">
                    <i class="bi bi-camera-fill me-2"></i>Aktifkan Kamera &amp; Scan
                  </button>
                  <button class="btn-sm-outline w-100 mt-2 d-none" id="btn-stop-scan" onclick="stopScanner()">
                    <i class="bi bi-stop-circle me-1"></i>Hentikan Scanner
                  </button>
                </div>
              </div>

              <!-- Manual Input -->
              <div class="form-card mb-4">
                <div class="form-card-header">
                  <div class="step-badge"><i class="bi bi-keyboard"></i></div>
                  <div>
                    <h2 class="form-card-title">Input Manual</h2>
                    <p class="form-card-sub">Masukkan kode tiket secara manual</p>
                  </div>
                </div>
                <div class="form-card-body">
                  <div class="input-group-custom">
                    <input type="text" id="manual-ticket-code" class="form-input-custom text-uppercase"
                      placeholder="MKJ-2026-XXXX" onkeydown="if(event.key==='Enter')processCheckin(this.value)" />
                    <button class="btn-primary-orange" onclick="processCheckin(document.getElementById('manual-ticket-code').value)">
                      <i class="bi bi-check-lg me-1"></i>Check-in
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hasil Scan -->
              <div id="scan-result-area" class="d-none">
                <div class="scan-result-card" id="scan-result-card">
                  <div class="scan-result-icon" id="scan-result-icon"></div>
                  <div class="scan-result-message" id="scan-result-message"></div>
                  <div class="scan-result-detail" id="scan-result-detail"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ---- TAB: PENGATURAN ---- -->
        <div id="admin-tab-settings" class="admin-tab d-none">
          <div class="admin-page-header">
            <h1 class="admin-page-title">Pengaturan Aplikasi</h1>
          </div>
          <div class="row">
            <div class="col-12 col-lg-8">
              <div class="form-card mb-4">
                <div class="form-card-header">
                  <div class="step-badge"><i class="bi bi-gear-fill"></i></div>
                  <div>
                    <h2 class="form-card-title">Informasi Event</h2>
                    <p class="form-card-sub">Konfigurasi detail event dan rekening bank</p>
                  </div>
                </div>
                <div class="form-card-body">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label-custom">Nama Aplikasi</label>
                      <input type="text" id="cfg-appName" class="form-input-custom" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">Tanggal Event</label>
                      <input type="date" id="cfg-eventDate" class="form-input-custom" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">Lokasi Event</label>
                      <input type="text" id="cfg-eventLocation" class="form-input-custom" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">Harga Tiket (Rp)</label>
                      <input type="number" id="cfg-ticketPrice" class="form-input-custom" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">WhatsApp Admin</label>
                      <input type="text" id="cfg-whatsappAdmin" class="form-input-custom" placeholder="628xxx" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">Nama Bank</label>
                      <input type="text" id="cfg-bankName" class="form-input-custom" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label-custom">No. Rekening</label>
                      <input type="text" id="cfg-bankAccount" class="form-input-custom" />
                    </div>
                    <div class="col-12">
                      <label class="form-label-custom">Nama Pemegang Rekening</label>
                      <input type="text" id="cfg-bankHolder" class="form-input-custom" />
                    </div>
                    <div class="col-12">
                      <label class="form-label-custom">Tagline Event</label>
                      <input type="text" id="cfg-tagline" class="form-input-custom" />
                    </div>
                  </div>
                  <button class="btn-primary-orange mt-4" onclick="saveSettings()">
                    <i class="bi bi-floppy-fill me-2"></i>Simpan Pengaturan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /admin-content -->
    </div><!-- /section-dashboard -->

  </div><!-- /app -->


  <!-- ============================================================ -->
  <!-- MODAL: VERIFIKASI BUKTI BAYAR                               -->
  <!-- ============================================================ -->
  <div class="modal-overlay d-none" id="modal-verify">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-verify-title">Detail Pendaftaran</h3>
        <button class="modal-close" onclick="closeModal('modal-verify')"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <div class="proof-preview-wrap" id="proof-preview-area">
              <div class="proof-placeholder">
                <i class="bi bi-image text-muted" style="font-size:3rem"></i>
                <p class="text-muted mt-2 small">Tidak ada bukti bayar</p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="verify-info-list" id="verify-info-list">
              <!-- Diisi JavaScript -->
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-danger" id="btn-reject" onclick="updatePaymentStatus('rejected')">
          <i class="bi bi-x-circle-fill me-1"></i>Tolak
        </button>
        <button class="btn-success" id="btn-verify" onclick="updatePaymentStatus('verified')">
          <i class="bi bi-check-circle-fill me-1"></i>Verifikasi
        </button>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- MODAL: TAMBAH/EDIT MERCHANDISE                              -->
  <!-- ============================================================ -->
  <div class="modal-overlay d-none" id="modal-merch">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-merch-title">Tambah Merchandise</h3>
        <button class="modal-close" onclick="closeModal('modal-merch')"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="merch-id" />
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label-custom">Nama Item *</label>
            <input type="text" id="merch-name" class="form-input-custom" />
          </div>
          <div class="col-12">
            <label class="form-label-custom">Deskripsi</label>
            <textarea id="merch-desc" class="form-input-custom" rows="2"></textarea>
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label-custom">Harga (Rp) *</label>
            <input type="number" id="merch-price" class="form-input-custom" min="0" />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label-custom">URL Foto</label>
            <input type="url" id="merch-photo" class="form-input-custom" placeholder="https://..." />
          </div>
          <div class="col-12">
            <label class="form-label-custom">Ukuran Tersedia (pisahkan dengan koma)</label>
            <input type="text" id="merch-sizes" class="form-input-custom" placeholder="S, M, L, XL, XXL" />
          </div>
          <div class="col-12">
            <label class="form-label-custom">Warna Tersedia (pisahkan dengan koma)</label>
            <input type="text" id="merch-colors" class="form-input-custom" placeholder="Hitam, Putih, Orange" />
          </div>
          <div class="col-12">
            <label class="form-label-custom">Status</label>
            <select id="merch-active" class="form-input-custom">
              <option value="true">Aktif (Tampil di katalog)</option>
              <option value="false">Nonaktif (Tersembunyi)</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-sm-outline" onclick="closeModal('modal-merch')">Batal</button>
        <button class="btn-primary-orange" onclick="saveMerch()">
          <i class="bi bi-floppy-fill me-1"></i>Simpan
        </button>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- CDN Scripts                                                  -->
  <!-- ============================================================ -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- html5-qrcode untuk scanner barcode/QR -->
  <script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  <!-- QRCode.js untuk generate QR Code tiket -->
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <!-- JsBarcode untuk generate Barcode tiket -->
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <!-- html2canvas untuk download tiket sebagai PNG -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
