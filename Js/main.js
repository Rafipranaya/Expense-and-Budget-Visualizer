// ─── Locale / i18n Config ────────────────────────────────────────────────────
const LOCALES = {
  id: {
    lang      : 'id',
    currency  : 'IDR',
    locale    : 'id-ID',
    dateLocale: 'id-ID',
    ui: {
      title          : '💸 Expense & Budget Visualizer',
      subtitle       : 'Catat pengeluaran dan visualisasikan anggaran Anda secara real time.',
      totalSpent     : 'Total Pengeluaran',
      addTransaction : 'Tambah Transaksi',
      itemName       : 'Nama Item',
      itemNamePH     : 'mis. Makan siang di Warteg',
      amount         : 'Jumlah',
      amountPH       : 'mis. 25000',
      category       : 'Kategori',
      categoryPH     : '-- Pilih Kategori --',
      food           : '🍜 Makanan',
      transport      : '🚗 Transportasi',
      fun            : '🎮 Hiburan',
      btnAdd         : '+ Tambah Transaksi',
      chartTitle     : 'Pengeluaran per Kategori',
      chartEmpty     : 'Belum ada data.\nTambahkan transaksi untuk melihat grafik.',
      listTitle      : 'Daftar Transaksi',
      listEmpty      : 'Belum ada transaksi.\nIsi form untuk mulai mencatat!',
      errName        : 'Harap masukkan nama item.',
      errAmount      : 'Harap masukkan jumlah yang valid (lebih dari 0).',
      errCategory    : 'Harap pilih kategori.',
      toastAdded     : '✅ Transaksi ditambahkan!',
      toastDeleted   : '🗑️ Transaksi dihapus.',
      itemsCount     : (n) => `${n} item`,
      deleteLabel    : (name) => `Hapus ${name}`,
      catFood        : 'Makanan',
      catTransport   : 'Transportasi',
      catFun         : 'Hiburan',
    },
  },
  en: {
    lang      : 'en',
    currency  : 'USD',
    locale    : 'en-US',
    dateLocale: 'en-US',
    ui: {
      title          : '💸 Expense & Budget Visualizer',
      subtitle       : 'Track your spending and visualize your budget in real time.',
      totalSpent     : 'Total Spent',
      addTransaction : 'Add Transaction',
      itemName       : 'Item Name',
      itemNamePH     : 'e.g. Lunch at a café',
      amount         : 'Amount',
      amountPH       : 'e.g. 12.50',
      category       : 'Category',
      categoryPH     : '-- Select Category --',
      food           : '🍔 Food',
      transport      : '🚗 Transport',
      fun            : '🎮 Fun',
      btnAdd         : '+ Add Transaction',
      chartTitle     : 'Spending by Category',
      chartEmpty     : 'No data yet.\nAdd a transaction to see the chart.',
      listTitle      : 'Transaction List',
      listEmpty      : 'No transactions yet.\nFill in the form to get started!',
      errName        : 'Please enter an item name.',
      errAmount      : 'Please enter a valid amount greater than 0.',
      errCategory    : 'Please select a category.',
      toastAdded     : '✅ Transaction added!',
      toastDeleted   : '🗑️ Transaction deleted.',
      itemsCount     : (n) => `${n} item${n !== 1 ? 's' : ''}`,
      deleteLabel    : (name) => `Delete ${name}`,
      catFood        : 'Food',
      catTransport   : 'Transport',
      catFun         : 'Fun',
    },
  },
  ja: {
    lang      : 'ja',
    currency  : 'JPY',
    locale    : 'ja-JP',
    dateLocale: 'ja-JP',
    ui: {
      title          : '💸 支出・予算ビジュアライザー',
      subtitle       : '支出を記録して、予算をリアルタイムで可視化しましょう。',
      totalSpent     : '合計支出',
      addTransaction : '取引を追加',
      itemName       : 'アイテム名',
      itemNamePH     : '例：ランチ',
      amount         : '金額',
      amountPH       : '例：1200',
      category       : 'カテゴリー',
      categoryPH     : '-- カテゴリーを選択 --',
      food           : '🍱 食費',
      transport      : '🚃 交通費',
      fun            : '🎮 娯楽',
      btnAdd         : '＋ 取引を追加',
      chartTitle     : 'カテゴリー別支出',
      chartEmpty     : 'データがありません。\n取引を追加するとグラフが表示されます。',
      listTitle      : '取引一覧',
      listEmpty      : 'まだ取引がありません。\nフォームに入力して始めましょう！',
      errName        : 'アイテム名を入力してください。',
      errAmount      : '0より大きい有効な金額を入力してください。',
      errCategory    : 'カテゴリーを選択してください。',
      toastAdded     : '✅ 取引を追加しました！',
      toastDeleted   : '🗑️ 取引を削除しました。',
      itemsCount     : (n) => `${n} 件`,
      deleteLabel    : (name) => `${name} を削除`,
      catFood        : '食費',
      catTransport   : '交通費',
      catFun         : '娯楽',
    },
  },
};

// ─── State ───────────────────────────────────────────────────────────────────
let transactions  = JSON.parse(localStorage.getItem('ebv_transactions') || '[]');
let currentLocale = localStorage.getItem('ebv_locale') || 'id';
let chartInstance = null;

// Cached formatters — Intl objects are expensive to construct; reuse them
let _currencyFmt = null;
let _dateFmt     = null;
let _lastLocale  = null;

function getFormatters() {
  if (_lastLocale !== currentLocale) {
    const cfg = LOCALES[currentLocale];
    _currencyFmt = new Intl.NumberFormat(cfg.locale, {
      style                : 'currency',
      currency             : cfg.currency,
      maximumFractionDigits: cfg.currency === 'JPY' ? 0 : 2,
    });
    _dateFmt = new Intl.DateTimeFormat(cfg.dateLocale, {
      day  : '2-digit',
      month: 'short',
      year : 'numeric',
    });
    _lastLocale = currentLocale;
  }
  return { currency: _currencyFmt, date: _dateFmt };
}

const t            = () => LOCALES[currentLocale];
const formatCurrency = (n) => getFormatters().currency.format(n);
const formatDate     = (ts) => getFormatters().date.format(new Date(ts));

// ─── DOM Refs (cached once) ───────────────────────────────────────────────────
const form          = document.getElementById('expense-form');
const nameInput     = document.getElementById('item-name');
const amountInput   = document.getElementById('item-amount');
const categoryInput = document.getElementById('item-category');
const txList        = document.getElementById('transaction-list');
const listEmpty     = document.getElementById('list-empty');
const chartEmpty    = document.getElementById('chart-empty');
const txCount       = document.getElementById('tx-count');
const totalEl       = document.getElementById('total-balance');
const catFoodEl     = document.getElementById('cat-food');
const catTransportEl= document.getElementById('cat-transport');
const catFunEl      = document.getElementById('cat-fun');
const toast         = document.getElementById('toast');
const nameErr       = document.getElementById('error-name');
const amountErr     = document.getElementById('error-amount');
const categoryErr   = document.getElementById('error-category');
const amountLabel   = document.getElementById('amount-label');

// ─── XSS Helper ───────────────────────────────────────────────────────────────
// Using a temporary element is faster and safer than manual replace chains
const _escDiv = document.createElement('div');
function escapeHtml(str) {
  _escDiv.textContent = str;
  return _escDiv.innerHTML;
}

// ─── Category label map (re-evaluated on locale change) ─────────────────────
function catLabel(category) {
  switch (category) {
    case 'Food'     : return t().ui.catFood;
    case 'Transport': return t().ui.catTransport;
    case 'Fun'      : return t().ui.catFun;
    default         : return category;
  }
}

// ─── Apply i18n to DOM ────────────────────────────────────────────────────────
function applyLocale() {
  const ui = t().ui;
  document.documentElement.lang = t().lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = ui[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = ui[el.dataset.i18nPh];
    if (v !== undefined) el.placeholder = v;
  });

  amountLabel.textContent = `${ui.amount} (${t().currency})`;

  document.getElementById('cat-opt-food').textContent        = ui.food;
  document.getElementById('cat-opt-transport').textContent   = ui.transport;
  document.getElementById('cat-opt-fun').textContent         = ui.fun;
  document.getElementById('cat-opt-placeholder').textContent = ui.categoryPH;

  const chartEmptyP = chartEmpty.querySelector('p');
  if (chartEmptyP) {
    const [l1, l2] = ui.chartEmpty.split('\n');
    chartEmptyP.innerHTML = `${l1}<br/>${l2}`;
  }

  const listEmptyP = listEmpty.querySelector('p');
  if (listEmptyP) {
    const [l1, l2] = ui.listEmpty.split('\n');
    listEmptyP.innerHTML = `${l1}<br/>${l2}`;
  }

  document.querySelectorAll('.locale-btn').forEach(btn => {
    const active = btn.dataset.locale === currentLocale;
    btn.classList.toggle('bg-indigo-600',    active);
    btn.classList.toggle('text-white',       active);
    btn.classList.toggle('border-indigo-500',active);
    btn.classList.toggle('bg-gray-800',     !active);
    btn.classList.toggle('text-gray-400',   !active);
    btn.classList.toggle('border-gray-700', !active);
  });
}

// ─── Locale Switcher ──────────────────────────────────────────────────────────
document.querySelectorAll('.locale-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.locale === currentLocale) return; // no-op if already active
    currentLocale = btn.dataset.locale;
    localStorage.setItem('ebv_locale', currentLocale);
    applyLocale();
    render();
  });
});

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, color = 'bg-green-600') {
  if (_toastTimer) clearTimeout(_toastTimer);
  toast.className = toast.className.replace(/bg-\w+-\d+/, color);
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  _toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
    _toastTimer = null;
  }, 2200);
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function saveToStorage() {
  localStorage.setItem('ebv_transactions', JSON.stringify(transactions));
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateForm() {
  const ui = t().ui;
  let valid = true;

  nameErr.classList.add('hidden');
  amountErr.classList.add('hidden');
  categoryErr.classList.add('hidden');

  if (!nameInput.value.trim()) {
    nameErr.textContent = ui.errName;
    nameErr.classList.remove('hidden');
    valid = false;
  }
  if (!amountInput.value || Number(amountInput.value) <= 0) {
    amountErr.textContent = ui.errAmount;
    amountErr.classList.remove('hidden');
    valid = false;
  }
  if (!categoryInput.value) {
    categoryErr.textContent = ui.errCategory;
    categoryErr.classList.remove('hidden');
    valid = false;
  }

  return valid;
}

// ─── Form Submit ──────────────────────────────────────────────────────────────
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const tx = {
    id      : Date.now(),
    name    : nameInput.value.trim(),
    amount  : parseFloat(amountInput.value),
    category: categoryInput.value,
  };

  transactions.unshift(tx);
  saveToStorage();
  render();
  form.reset();
  showToast(t().ui.toastAdded);
});

// ─── Delete — single delegated listener on the list ──────────────────────────
txList.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  // Animate out, then delete
  const item = btn.closest('li');
  if (item) {
    item.style.cssText = 'transition:opacity 0.18s,transform 0.18s;opacity:0;transform:translateX(24px)';
    item.addEventListener('transitionend', () => {
      transactions = transactions.filter(tx => tx.id !== id);
      saveToStorage();
      render();
      showToast(t().ui.toastDeleted, 'bg-red-600');
    }, { once: true });
  } else {
    transactions = transactions.filter(tx => tx.id !== id);
    saveToStorage();
    render();
    showToast(t().ui.toastDeleted, 'bg-red-600');
  }
});

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
  const ui = t().ui;

  if (transactions.length === 0) {
    txList.innerHTML = '';
    listEmpty.classList.remove('hidden');
    txCount.textContent = ui.itemsCount(0);
    return;
  }

  listEmpty.classList.add('hidden');
  txCount.textContent = ui.itemsCount(transactions.length);

  // Build all items into a DocumentFragment — single DOM reflow
  const fragment = document.createDocumentFragment();
  const isFirst  = txList.children.length === 0; // entering from empty state

  transactions.forEach((tx, idx) => {
    const cat = tx.category.toLowerCase();
    const li  = document.createElement('li');
    li.className = 'transaction-item';

    // Only animate: top item on fresh add, or all items on first render
    if (idx === 0 || isFirst) li.classList.add('tx-enter');

    // Build inner HTML — avoid extra wrapper divs
    li.innerHTML =
      `<div class="flex-1 min-w-0">` +
        `<p class="text-sm font-medium text-gray-100 truncate">${escapeHtml(tx.name)}</p>` +
        `<div class="flex items-center gap-2 mt-1">` +
          `<span class="badge badge-${cat}">${escapeHtml(catLabel(tx.category))}</span>` +
          `<span class="text-xs text-gray-500">${formatDate(tx.id)}</span>` +
        `</div>` +
      `</div>` +
      `<p class="text-sm font-semibold text-white flex-shrink-0">${formatCurrency(tx.amount)}</p>` +
      `<button class="delete-btn" aria-label="${escapeHtml(ui.deleteLabel(tx.name))}" data-id="${tx.id}">` +
        `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">` +
          `<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18"/>` +
        `</svg>` +
      `</button>`;

    fragment.appendChild(li);
  });

  // Replace list content in one shot
  txList.replaceChildren(fragment);
}

// ─── Render Balance ───────────────────────────────────────────────────────────
function renderBalance() {
  let food = 0, transport = 0, fun = 0;
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if      (tx.category === 'Food')      food      += tx.amount;
    else if (tx.category === 'Transport') transport += tx.amount;
    else if (tx.category === 'Fun')       fun       += tx.amount;
  }

  totalEl.textContent       = formatCurrency(food + transport + fun);
  catFoodEl.textContent     = formatCurrency(food);
  catTransportEl.textContent= formatCurrency(transport);
  catFunEl.textContent      = formatCurrency(fun);
}

// ─── Chart — debounced so rapid locale switches don't fire multiple updates ──
let _chartRafId = null;
function renderChart() {
  if (_chartRafId) cancelAnimationFrame(_chartRafId);
  _chartRafId = requestAnimationFrame(_doRenderChart);
}

function _doRenderChart() {
  _chartRafId = null;

  let food = 0, transport = 0, fun = 0;
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if      (tx.category === 'Food')      food      += tx.amount;
    else if (tx.category === 'Transport') transport += tx.amount;
    else if (tx.category === 'Fun')       fun       += tx.amount;
  }

  const data    = [food, transport, fun];
  const hasData = food > 0 || transport > 0 || fun > 0;
  const labels  = [t().ui.catFood, t().ui.catTransport, t().ui.catFun];

  chartEmpty.style.display = hasData ? 'none' : 'flex';

  if (chartInstance) {
    chartInstance.data.labels            = labels;
    chartInstance.data.datasets[0].data  = data;
    chartInstance.options.plugins.tooltip.callbacks.label =
      (c) => `  ${c.label}: ${formatCurrency(c.parsed)}`;
    chartInstance.update('none'); // 'none' skips animation on update — smoother on low-end
    return;
  }

  const ctx = document.getElementById('expense-chart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor     : ['#f97316', '#3b82f6', '#a855f7'],
        hoverBackgroundColor: ['#fb923c', '#60a5fa', '#c084fc'],
        borderColor         : '#111827',
        borderWidth         : 3,
        hoverOffset         : 6,
      }],
    },
    options: {
      cutout  : '68%',
      plugins : {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (c) => `  ${c.label}: ${formatCurrency(c.parsed)}` },
        },
      },
      // Shorter, GPU-friendly animation on initial draw only
      animation: { duration: 350, easing: 'easeOutQuart' },
    },
  });
}

// ─── Master Render ────────────────────────────────────────────────────────────
function render() {
  renderBalance();
  renderList();
  renderChart();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
applyLocale();
render();
