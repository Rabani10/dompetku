// ══════════════════════════════════════════════════════
//  DompetKu — Finance Tracker PWA
//  v3 — Custom Categories + Subcategories
// ══════════════════════════════════════════════════════

const DEFAULT_CATEGORIES = {
  income: [
    { name: '💼 Gaji',           subs: ['Gaji Pokok', 'Lembur', 'THR'] },
    { name: '💻 Freelance',      subs: ['Project', 'Konsultasi', 'Komisi'] },
    { name: '🎁 Bonus',          subs: ['Bonus Kinerja', 'Insentif', 'Reward'] },
    { name: '🔄 Refund',         subs: ['Refund Belanja', 'Refund Tiket', 'Cashback'] },
    { name: '💰 Pendapatan Lain',subs: ['Investasi', 'Hadiah', 'Lainnya'] },
  ],
  expense: [
    { name: '🍔 Makanan & Minuman',      subs: ['Sarapan', 'Makan Siang', 'Makan Malam', 'Jajan', 'Kopi', 'Groceries'] },
    { name: '🛍 Belanja',                subs: ['Online', 'Offline', 'Fashion', 'Elektronik'] },
    { name: '🚗 Transportasi',           subs: ['BBM', 'Ojol', 'Service Kendaraan', 'Parkir', 'Tol'] },
    { name: '⚡ Tagihan & Utilitas',     subs: ['Listrik', 'Air', 'Internet', 'AI Tools', 'Gas'] },
    { name: '📱 Pulsa & Paket Data',     subs: ['Pulsa', 'Paket Data', 'Roaming'] },
    { name: '💊 Kesehatan',              subs: ['Rumah Sakit', 'Klinik', 'Obat', 'Vitamin', 'BPJS'] },
    { name: '🎮 Hiburan',                subs: ['Film / Bioskop', 'Game', 'Streaming', 'Webtoon', 'Spotify', 'Konser'] },
    { name: '✨ Gaya Hidup',             subs: ['Nongkrong', 'Hobi', 'Salon / Barbershop', 'Rokok'] },
    { name: '📚 Pendidikan',             subs: ['Kursus', 'Buku', 'Seminar', 'Langganan Edu'] },
    { name: '🤲 Donasi / Zakat',         subs: ['Zakat', 'Infaq', 'Sedekah', 'Donasi'] },
    { name: '💸 Transfer Keluar',        subs: ['Transfer Bank', 'Kirim ke Keluarga', 'Bayar Hutang'] },
    { name: '🏦 Biaya Admin / Fee',      subs: ['Admin Bank', 'Biaya Transfer', 'Materai'] },
    { name: '🔧 Lainnya',               subs: ['Lainnya'] },
  ]
};

// ── STATE ──────────────────────────────────────────────
let state = {
  transactions: [],
  budgets: [],
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  currentType: 'income',
  selectedCat: '',
  selectedSub: '',
  currentMonth: new Date().getMonth(),
  currentYear:  new Date().getFullYear(),
  scriptUrl: '',
  userName: '',
  currency: 'IDR',
  synced: false
};

// ── INIT ───────────────────────────────────────────────
function init() {
  loadFromStorage();
  if (state.scriptUrl || localStorage.getItem('dompetku_skip')) {
    showApp();
  } else {
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('dompetku_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      if (!state.categories || !state.categories.income) {
        state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      }
    }
  } catch(e) { console.warn('Load failed', e); }
}

function saveToStorage() {
  try { localStorage.setItem('dompetku_state', JSON.stringify(state)); }
  catch(e) { console.warn('Save failed', e); }
}

function showApp() {
  document.getElementById('setup-screen').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';
  app.style.flexDirection = 'column';
  updateSyncStatus();
  refreshHome();
  updateSettings();
  document.getElementById('tx-date').value = todayStr();
}

// ── SETUP ──────────────────────────────────────────────
function setupApp() {
  const url  = document.getElementById('setup-url').value.trim();
  const name = document.getElementById('setup-name').value.trim() || 'Pengguna';
  const curr = document.getElementById('setup-currency').value;
  if (!url) { showToast('⚠️ Masukkan Web App URL dulu'); return; }
  state.scriptUrl = url; state.userName = name; state.currency = curr; state.synced = false;
  saveToStorage(); showApp(); showToast('✅ Setup berhasil!');
}
function skipSetup() {
  state.userName = 'Pengguna'; state.currency = 'IDR'; state.scriptUrl = '';
  localStorage.setItem('dompetku_skip','1');
  saveToStorage(); showApp();
  showToast('ℹ️ Mode lokal aktif');
}
function updateUrl() {
  const url = document.getElementById('update-url-input').value.trim();
  if (!url) { showToast('⚠️ URL tidak boleh kosong'); return; }
  state.scriptUrl = url; state.synced = false;
  saveToStorage(); updateSyncStatus(); updateSettings();
  showToast('✅ URL diperbarui');
}

// ── CURRENCY ───────────────────────────────────────────
const SYM = { IDR:'Rp', USD:'$', SGD:'S$', MYR:'RM' };
function fmt(amount) {
  const s = SYM[state.currency] || 'Rp';
  if (state.currency === 'IDR') return s + ' ' + Math.abs(amount).toLocaleString('id-ID');
  return s + ' ' + Math.abs(amount).toFixed(2);
}
function fmtShort(v) {
  if (v >= 1_000_000) return (v/1_000_000).toFixed(1)+'jt';
  if (v >= 1_000)     return (v/1_000).toFixed(0)+'rb';
  return v;
}

// ── MODAL ──────────────────────────────────────────────
function openModal(type='income') {
  state.currentType = type; state.selectedCat = ''; state.selectedSub = '';
  document.getElementById('tx-modal').classList.add('open');
  ['tx-amount','tx-desc','tx-note'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('tx-date').value = todayStr();
  updateTypeToggle(); renderCatGrid(); renderSubGrid();
  setTimeout(() => document.getElementById('tx-amount').focus(), 350);
}
function closeModal() { document.getElementById('tx-modal').classList.remove('open'); }
function closeModalOutside(e) { if (e.target === document.getElementById('tx-modal')) closeModal(); }
function switchType(type) {
  state.currentType = type; state.selectedCat = ''; state.selectedSub = '';
  updateTypeToggle(); renderCatGrid(); renderSubGrid();
}
function updateTypeToggle() {
  document.getElementById('modal-title').textContent = state.currentType==='income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran';
  document.getElementById('toggle-income').className  = 'type-btn'+(state.currentType==='income'  ? ' active-income'  : '');
  document.getElementById('toggle-expense').className = 'type-btn'+(state.currentType==='expense' ? ' active-expense' : '');
}

function renderCatGrid() {
  const cats = state.categories[state.currentType] || [];
  document.getElementById('cat-grid').innerHTML = cats.map(c =>
    `<div class="cat-chip ${state.selectedCat===c.name?'selected':''}" onclick="selectCat(${JSON.stringify(c.name)})">${c.name}</div>`
  ).join('');
}

function selectCat(catName) {
  state.selectedCat = catName; state.selectedSub = '';
  renderCatGrid(); renderSubGrid();
}

function renderSubGrid() {
  const wrap = document.getElementById('sub-wrap');
  if (!state.selectedCat) { wrap.style.display='none'; return; }
  const cat = (state.categories[state.currentType]||[]).find(c=>c.name===state.selectedCat);
  if (!cat || !cat.subs || cat.subs.length===0) { wrap.style.display='none'; return; }
  wrap.style.display='block';
  document.getElementById('sub-grid').innerHTML = cat.subs.map(s =>
    `<div class="cat-chip sub-chip ${state.selectedSub===s?'selected':''}" onclick="selectSub(${JSON.stringify(s)})">${s}</div>`
  ).join('');
}

function selectSub(sub) { state.selectedSub = sub; renderSubGrid(); }

// ── TRANSACTIONS ───────────────────────────────────────
function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const desc   = document.getElementById('tx-desc').value.trim();
  const date   = document.getElementById('tx-date').value;
  const note   = document.getElementById('tx-note').value.trim();
  if (!amount||amount<=0) { showToast('⚠️ Masukkan jumlah yang valid'); return; }
  if (!desc)              { showToast('⚠️ Masukkan keterangan'); return; }
  if (!state.selectedCat) { showToast('⚠️ Pilih kategori dulu'); return; }
  if (!date)              { showToast('⚠️ Pilih tanggal'); return; }

  const tx = {
    id: Date.now().toString(),
    type: state.currentType,
    amount, desc,
    category: state.selectedCat,
    subcategory: state.selectedSub || '',
    date, note, synced: false
  };
  state.transactions.unshift(tx);
  saveToStorage(); closeModal(); refreshHome(); refreshAllTx();
  showToast(tx.type==='income' ? '✅ Pemasukan ditambahkan' : '✅ Pengeluaran ditambahkan');
  if (state.scriptUrl) autoSync(tx);
}

function deleteTransaction(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  state.transactions = state.transactions.filter(t=>t.id!==id);
  saveToStorage(); refreshHome(); refreshAllTx();
  showToast('🗑 Transaksi dihapus');
}

// ── MONTH ──────────────────────────────────────────────
function txForMonth(m,y) {
  return state.transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===m&&d.getFullYear()===y; });
}
function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth>11){state.currentMonth=0;state.currentYear++;}
  if (state.currentMonth<0) {state.currentMonth=11;state.currentYear--;}
  refreshHome();
}

// ── HOME ───────────────────────────────────────────────
const MONTHS_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function refreshHome() {
  document.getElementById('month-display').textContent=`${MONTHS_ID[state.currentMonth]} ${state.currentYear}`;
  const txs     = txForMonth(state.currentMonth, state.currentYear);
  const income  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income-expense;
  const balEl   = document.getElementById('balance-display');
  balEl.textContent = fmt(balance);
  balEl.style.color = balance>=0?'var(--income)':'var(--expense)';
  document.getElementById('income-display').textContent  = fmt(income);
  document.getElementById('expense-display').textContent = fmt(expense);
  renderBudgetHome(txs);
  const recent = txs.slice(0,8);
  document.getElementById('tx-count').textContent = txs.length>0?`(${txs.length})`:'';
  document.getElementById('tx-list').innerHTML = recent.length===0
    ? '<div class="empty-state"><div class="empty-icon">📭</div>Belum ada transaksi bulan ini</div>'
    : recent.map(txItemHTML).join('');
}

function txItemHTML(t) {
  const inc  = t.type==='income';
  const emoji = t.category.split(' ')[0];
  const catName = t.category.substring(t.category.indexOf(' ')+1);
  const subLabel = t.subcategory ? `<span class="sub-label">${t.subcategory}</span>` : '';
  return `
    <div class="tx-item">
      <div class="tx-icon" style="background:${inc?'rgba(63,185,80,0.15)':'rgba(248,81,73,0.15)'}">
        ${emoji}
      </div>
      <div class="tx-info">
        <div class="tx-name">${escHtml(t.desc)}</div>
        <div class="tx-meta">${catName}${t.subcategory?' · '+t.subcategory:''} · ${fmtDate(t.date)}</div>
      </div>
      <div style="text-align:right">
        <div class="tx-amount ${inc?'income-text':'expense-text'}">${inc?'+':'−'}${fmt(t.amount)}</div>
        <button class="delete-btn" onclick="deleteTransaction('${t.id}')">✕</button>
      </div>
    </div>`;
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── BUDGET ─────────────────────────────────────────────
const BCOLORS=['#58A6FF','#3FB950','#D29922','#BC8CFF','#79C0FF','#56D364','#E3B341','#F85149','#FFA657','#FF7B72'];

function renderBudgetHome(txs) {
  const list=document.getElementById('budget-list');
  const countEl=document.getElementById('budget-count');
  if (state.budgets.length===0){
    list.innerHTML=`<div style="font-size:12px;color:var(--muted);padding:8px 0;">Belum ada budget. Atur di tab Budget 🎯</div>`;
    countEl.textContent=''; return;
  }
  countEl.textContent=`(${state.budgets.length})`;
  list.innerHTML=state.budgets.map((b,i)=>{
    const spent=txs.filter(t=>t.type==='expense'&&t.category===b.category).reduce((s,t)=>s+t.amount,0);
    const pct=Math.min((spent/b.amount)*100,100);
    const color=pct>=90?'#F85149':pct>=70?'#D29922':BCOLORS[i%BCOLORS.length];
    return `<div class="budget-item">
      <div class="budget-header">
        <div class="budget-cat">${b.category}</div>
        <div class="budget-nums">${fmt(spent)} / <strong>${fmt(b.amount)}</strong></div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('');
}

function saveBudget() {
  const cat=document.getElementById('budget-cat-input').value;
  const amount=parseFloat(document.getElementById('budget-amount-input').value);
  if (!cat)          {showToast('⚠️ Pilih kategori');return;}
  if (!amount||amount<=0){showToast('⚠️ Masukkan jumlah');return;}
  const idx=state.budgets.findIndex(b=>b.category===cat);
  if (idx>=0) state.budgets[idx].amount=amount; else state.budgets.push({category:cat,amount});
  saveToStorage(); renderBudgetFull(); refreshHome();
  document.getElementById('budget-amount-input').value='';
  showToast('✅ Budget disimpan');
}
function deleteBudget(cat) {
  state.budgets=state.budgets.filter(b=>b.category!==cat);
  saveToStorage(); renderBudgetFull(); refreshHome();
  showToast('🗑 Budget dihapus');
}
function renderBudgetFull() {
  const txs=txForMonth(state.currentMonth,state.currentYear);
  document.getElementById('budget-list-full').innerHTML=state.budgets.length===0
    ?'<div class="empty-state"><div class="empty-icon">🎯</div>Belum ada budget</div>'
    :state.budgets.map((b,i)=>{
      const spent=txs.filter(t=>t.type==='expense'&&t.category===b.category).reduce((s,t)=>s+t.amount,0);
      const pct=Math.min((spent/b.amount)*100,100);
      const color=pct>=90?'#F85149':pct>=70?'#D29922':BCOLORS[i%BCOLORS.length];
      return `<div class="budget-item">
        <div class="budget-header">
          <div class="budget-cat">${b.category}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="budget-nums">${fmt(spent)} / <strong>${fmt(b.amount)}</strong></div>
            <button class="delete-btn" onclick="deleteBudget(${JSON.stringify(b.category)})">✕</button>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;">${pct.toFixed(0)}% terpakai</div>
      </div>`;
    }).join('');

  const sel=document.getElementById('budget-cat-input');
  sel.innerHTML='<option value="">Pilih kategori</option>'+
    state.categories.expense.map(c=>`<option value="${escHtml(c.name)}">${c.name}</option>`).join('');
}

// ── ALL TRANSACTIONS ───────────────────────────────────
let txFilter='all';
function filterTx(f,btn){
  txFilter=f;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); refreshAllTx();
}
function refreshAllTx(){
  let txs=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(txFilter==='income')  txs=txs.filter(t=>t.type==='income');
  if(txFilter==='expense') txs=txs.filter(t=>t.type==='expense');
  const list=document.getElementById('all-tx-list');
  list.innerHTML=txs.length===0
    ?'<div class="empty-state"><div class="empty-icon">📭</div>Tidak ada transaksi</div>'
    :txs.map(txItemHTML).join('');
}

// ── NAVIGATE ───────────────────────────────────────────
function navigate(page,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  el.classList.add('active');
  if(page==='tx')       refreshAllTx();
  if(page==='charts')   setTimeout(renderCharts,120);
  if(page==='budget')   renderBudgetFull();
  if(page==='settings') updateSettings();
  if(page==='catmgr')   renderCatManager();
}

// ── CATEGORY MANAGER ───────────────────────────────────
let catMgrType = 'expense';

function renderCatManager() {
  document.getElementById('catmgr-income-btn').className  = 'tab-btn'+(catMgrType==='income' ?' active':'');
  document.getElementById('catmgr-expense-btn').className = 'tab-btn'+(catMgrType==='expense'?' active':'');

  const cats = state.categories[catMgrType] || [];
  const list = document.getElementById('cat-manager-list');

  if (cats.length===0) {
    list.innerHTML='<div class="empty-state"><div class="empty-icon">📂</div>Belum ada kategori</div>';
    return;
  }

  list.innerHTML = cats.map((cat,ci) => `
    <div class="cat-mgr-item">
      <div class="cat-mgr-header">
        <div class="cat-mgr-name">${cat.name}</div>
        <div style="display:flex;gap:6px;">
          <button class="mgr-btn mgr-btn-add" onclick="promptAddSub(${ci})">+ Sub</button>
          <button class="mgr-btn mgr-btn-del" onclick="deleteCat(${ci})">✕</button>
        </div>
      </div>
      <div class="sub-tags">
        ${(cat.subs||[]).map((s,si)=>`
          <div class="sub-tag">
            ${escHtml(s)}
            <span class="sub-tag-del" onclick="deleteSub(${ci},${si})">×</span>
          </div>`).join('')}
        ${(cat.subs||[]).length===0?'<span style="font-size:11px;color:var(--muted);">Belum ada subkategori</span>':''}
      </div>
    </div>
  `).join('');
}

function switchCatMgr(type) {
  catMgrType = type; renderCatManager();
}

function promptAddCat() {
  const emoji = prompt('Emoji kategori (contoh: 🍔):','');
  if (emoji===null) return;
  const name  = prompt('Nama kategori:','');
  if (!name||!name.trim()) { showToast('⚠️ Nama tidak boleh kosong'); return; }
  const full  = (emoji.trim()||'📌') + ' ' + name.trim();
  const exists = state.categories[catMgrType].find(c=>c.name===full);
  if (exists) { showToast('⚠️ Kategori sudah ada'); return; }
  state.categories[catMgrType].push({ name: full, subs: [] });
  saveToStorage(); renderCatManager();
  showToast('✅ Kategori ditambahkan');
}

function deleteCat(ci) {
  const cat = state.categories[catMgrType][ci];
  if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
  state.categories[catMgrType].splice(ci,1);
  saveToStorage(); renderCatManager();
  showToast('🗑 Kategori dihapus');
}

function promptAddSub(ci) {
  const sub = prompt('Nama subkategori baru:','');
  if (sub===null||!sub.trim()) return;
  if (!state.categories[catMgrType][ci].subs) state.categories[catMgrType][ci].subs=[];
  state.categories[catMgrType][ci].subs.push(sub.trim());
  saveToStorage(); renderCatManager();
  showToast('✅ Subkategori ditambahkan');
}

function deleteSub(ci,si) {
  state.categories[catMgrType][ci].subs.splice(si,1);
  saveToStorage(); renderCatManager();
  showToast('🗑 Subkategori dihapus');
}

function resetCategories() {
  if (!confirm('Reset semua kategori ke default?')) return;
  state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  saveToStorage(); renderCatManager();
  showToast('✅ Kategori direset ke default');
}

// ── SETTINGS ───────────────────────────────────────────
function updateSettings() {
  document.getElementById('settings-name').textContent      = state.userName||'—';
  document.getElementById('settings-currency').textContent  = state.currency;
  document.getElementById('settings-connected').textContent = state.scriptUrl?'✅ Terhubung':'❌ Tidak terhubung';
  document.getElementById('settings-tx-count').textContent  = state.transactions.length;
}
function updateSyncStatus() {
  document.getElementById('sync-text').textContent = state.scriptUrl?(state.synced?'Tersinkron':'Belum sync'):'Lokal';
}
function resetApp() {
  if (!confirm('Hapus semua data? Aksi ini tidak bisa dibatalkan.')) return;
  state.transactions=[]; state.budgets=[]; state.synced=false;
  saveToStorage(); refreshHome(); updateSettings();
  showToast('🗑 Data dihapus');
}

// ── GOOGLE SHEETS SYNC ─────────────────────────────────
async function autoSync(tx) {
  if (!state.scriptUrl) return;
  try {
    await fetch(state.scriptUrl,{method:'POST',mode:'no-cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'addTransaction',data:tx})});
    tx.synced=true; saveToStorage();
  } catch(e){console.warn('Auto sync failed:',e);}
}
async function syncToSheets() {
  if (!state.scriptUrl){showToast('⚠️ Belum ada URL Apps Script');return;}
  showToast('⟳ Menyinkronkan...');
  const unsync=state.transactions.filter(t=>!t.synced);
  if(unsync.length===0){showToast('✅ Semua data sudah tersinkron');return;}
  let success=0;
  for(const tx of unsync){
    try{
      await fetch(state.scriptUrl,{method:'POST',mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'addTransaction',data:tx})});
      tx.synced=true; success++;
    }catch(e){}
  }
  saveToStorage(); state.synced=success===unsync.length;
  updateSyncStatus(); showToast(`✅ ${success}/${unsync.length} transaksi tersinkron`);
}
function exportCSV() {
  const rows=[['ID','Tanggal','Tipe','Kategori','Subkategori','Deskripsi','Jumlah','Catatan']];
  state.transactions.forEach(t=>rows.push([t.id,t.date,t.type,t.category,t.subcategory||'',t.desc,t.amount,t.note||'']));
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`dompetku_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  showToast('📥 CSV berhasil diunduh');
}

// ══════════════════════════════════════════════════════
//  BUILT-IN CHART ENGINE — Canvas 2D, zero dependencies
// ══════════════════════════════════════════════════════
const CHART_COLORS=['#58A6FF','#3FB950','#D29922','#BC8CFF','#79C0FF','#56D364','#E3B341','#F85149','#FFA657','#FF7B72','#A371F7','#39D353'];

function renderCharts(){ renderBarChart(); renderDonutChart(); }

function renderBarChart() {
  const canvas=document.getElementById('trendChart');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.parentElement.clientWidth-32, H=200, dpr=window.devicePixelRatio||1;
  canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx.scale(dpr,dpr); ctx.clearRect(0,0,W,H);

  const now=new Date(); const labels=[],incomes=[],expenses=[];
  for(let i=5;i>=0;i--){
    let m=now.getMonth()-i,y=now.getFullYear();
    if(m<0){m+=12;y--;}
    labels.push(['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m]);
    const txs=txForMonth(m,y);
    incomes.push(txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
    expenses.push(txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }

  const padL=52,padR=8,padT=12,padB=44;
  const cW=W-padL-padR,cH=H-padT-padB;
  const maxVal=Math.max(...incomes,...expenses,1);
  const n=labels.length, groupW=cW/n, bW=Math.min(groupW*0.32,18);

  ctx.strokeStyle='rgba(48,54,61,0.6)'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const gy=padT+cH*(1-i/4);
    ctx.beginPath(); ctx.moveTo(padL,gy); ctx.lineTo(W-padR,gy); ctx.stroke();
    ctx.fillStyle='#8B949E'; ctx.font='10px monospace'; ctx.textAlign='right';
    ctx.fillText(fmtShort(maxVal*(i/4)),padL-6,gy+4);
  }

  labels.forEach((label,i)=>{
    const cx=padL+i*groupW+groupW/2;
    const ih=(incomes[i]/maxVal)*cH||0;
    if(ih>0){roundRect(ctx,cx-bW-2,padT+cH-ih,bW,ih,3);ctx.fillStyle='rgba(63,185,80,0.8)';ctx.fill();}
    const eh=(expenses[i]/maxVal)*cH||0;
    if(eh>0){roundRect(ctx,cx+2,padT+cH-eh,bW,eh,3);ctx.fillStyle='rgba(248,81,73,0.8)';ctx.fill();}
    ctx.fillStyle='#8B949E';ctx.font='10px monospace';ctx.textAlign='center';
    ctx.fillText(label,cx,H-padB+15);
  });

  ctx.fillStyle='rgba(63,185,80,0.85)';ctx.fillRect(padL,H-10,10,8);
  ctx.fillStyle='#8B949E';ctx.font='10px monospace';ctx.textAlign='left';
  ctx.fillText('Pemasukan',padL+14,H-3);
  ctx.fillStyle='rgba(248,81,73,0.85)';ctx.fillRect(padL+100,H-10,10,8);
  ctx.fillStyle='#8B949E';ctx.fillText('Pengeluaran',padL+114,H-3);
}

function renderDonutChart() {
  const canvas=document.getElementById('categoryChart');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const SIZE=Math.min(canvas.parentElement.clientWidth-32,220),dpr=window.devicePixelRatio||1;
  canvas.width=SIZE*dpr;canvas.height=SIZE*dpr;
  canvas.style.width=SIZE+'px';canvas.style.height=SIZE+'px';
  ctx.scale(dpr,dpr);ctx.clearRect(0,0,SIZE,SIZE);

  const txs=txForMonth(state.currentMonth,state.currentYear);
  const catMap={};
  txs.filter(t=>t.type==='expense').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const entries=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,e)=>s+e[1],0);
  const legend=document.getElementById('cat-legend');

  if(total===0){
    const cx=SIZE/2,cy=SIZE/2,r=SIZE*0.38,ri=SIZE*0.22;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='rgba(48,54,61,0.5)';ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,ri,0,Math.PI*2);ctx.fillStyle='#161B22';ctx.fill();
    ctx.fillStyle='#8B949E';ctx.font='11px monospace';ctx.textAlign='center';
    ctx.fillText('Belum ada',cx,cy-5);ctx.fillText('pengeluaran',cx,cy+10);
    legend.innerHTML=''; return;
  }

  const cx=SIZE/2,cy=SIZE/2,r=SIZE*0.42,ri=SIZE*0.25;
  let angle=-Math.PI/2;
  entries.forEach((e,i)=>{
    const sweep=(e[1]/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+sweep);ctx.closePath();
    ctx.fillStyle=CHART_COLORS[i%CHART_COLORS.length];ctx.fill();
    ctx.strokeStyle='#161B22';ctx.lineWidth=2;ctx.stroke();
    angle+=sweep;
  });
  ctx.beginPath();ctx.arc(cx,cy,ri,0,Math.PI*2);ctx.fillStyle='#161B22';ctx.fill();
  ctx.fillStyle='#E6EDF3';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  ctx.fillText(fmtShort(total),cx,cy+4);
  ctx.fillStyle='#8B949E';ctx.font='10px monospace';ctx.fillText('total',cx,cy+18);

  legend.innerHTML=entries.map((e,i)=>`
    <div class="legend-item">
      <div class="legend-dot" style="background:${CHART_COLORS[i%CHART_COLORS.length]}"></div>
      <div class="legend-name">${e[0]}</div>
      <div class="legend-val">${fmt(e[1])} <span style="color:var(--muted);font-size:10px;">(${((e[1]/total)*100).toFixed(0)}%)</span></div>
    </div>`).join('');
}

function roundRect(ctx,x,y,w,h,r){
  if(h<=0||w<=0)return; r=Math.min(r,h/2,w/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h);
  ctx.lineTo(x,y+h);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

// ── HELPERS ────────────────────────────────────────────
function todayStr(){return new Date().toISOString().slice(0,10);}
function fmtDate(dateStr){const d=new Date(dateStr);return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'});}
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

init();
