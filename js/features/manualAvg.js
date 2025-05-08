// js/features/manualAvg.js
window.initManualAvg = function() {
  const section = document.getElementById('manualAvgSection');
  // 隱藏排行榜並顯示均價計算區
  document.getElementById('rankingSection').style.display = 'none';
  section.style.display = 'block';

  // 注入 UI HTML，只保留 USDT 模式，並新增關閉按鈕
  section.innerHTML = `
    <div class="manual-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <h2 style="margin:0;">OKX 開倉均價計算器</h2>
      <button id="closeManualAvg" class="close-btn" style="font-size:14px; 6px;width:auto;min-width:50px;">關閉</button>
    </div>
    <label>搜尋幣種：
      <input list="symbols" id="symbol" placeholder="例如 BTCUSDT.P" />
      <datalist id="symbols"></datalist>
    </label>
    <div>
      更新間隔(ms)：<input type="number" id="interval" value="2000" />
    </div>
    <div id="entries" class="entries"></div>
    <button id="addEntry">新增一行</button>
    <div class="result" id="result">平均開倉價：--</div>
    <div id="priceInfo"></div>
  `;

  const get = sel => section.querySelector(sel);
  // 關閉按鈕事件：隱藏手動均價區塊並顯示排行榜
  get('#closeManualAvg').addEventListener('click', () => {
    section.style.display = 'none';
    document.getElementById('rankingSection').style.display = 'block';
  });

  let currentInstId = '';
  let timer = null;
  // 存儲每個合約的 lotSz（若有）
  const instMap = new Map();

  // 載入所有 USDT 永續合約，並記錄 lotSz
  async function loadSymbols() {
    try {
      const res = await fetch('https://www.okx.com/api/v5/public/instruments?instType=SWAP');
      const data = await res.json();
      const list = get('#symbols');
      list.innerHTML = '';
      data.data.forEach(i => {
        if (i.instId.endsWith('-USDT-SWAP')) {
          const [base, quote] = i.instId.split('-');
          const display = `${base}${quote}.P`;
          instMap.set(display, { instId: i.instId, lotSize: parseFloat(i.lotSz) || 1 });
          const opt = document.createElement('option');
          opt.value = display;
          list.append(opt);
        }
      });
    } catch (e) {
      console.error('載入合約列表錯誤', e);
    }
  }

  // 將顯示字串轉回 API instId
  function toInstId(symP) {
    const [bq, suf] = symP.split('.');
    if (suf === 'P' && bq.length > 4) {
      const base = bq.slice(0, -4);
      const quote = bq.slice(-4);
      return `${base}-${quote}-SWAP`;
    }
    return '';
  }

  // 取得並顯示現價，然後觸發計算
  async function loadTicker(instId) {
    if (!instId) return;
    try {
      const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`);
      const p = (await r.json()).data[0].last;
      get('#priceInfo').innerText = `現價：${p}`;
      calcAvg();
    } catch (e) {
      console.error('取得市價錯誤', e);
      get('#priceInfo').innerText = '⚠ 無法取得價格';
    }
  }

  // 計算平均開倉價
  function calcAvg() {
    const symbolDisplay = get('#symbol').value;
    const rows = section.querySelectorAll('.row');
    let avg = 0;

    if (symbolDisplay === 'ETHUSDT.P') {
      let totalQty = 0, totalVal = 0;
      rows.forEach(row => {
        const p = parseFloat(row.querySelector('.price').value);
        const u = parseFloat(row.querySelector('.usdt')?.value || 0);
        if (p > 0 && u > 0) {
          const qty = Math.floor((u / p) * 1000) / 1000; // ETH → 3位小數
          totalQty += qty;
          totalVal += qty * p;
        }
      });
      avg = totalQty ? (totalVal / totalQty) : 0;

    } else if (symbolDisplay === 'SOLUSDT.P') {
      let totalQty = 0, totalVal = 0;
      rows.forEach(row => {
        const p = parseFloat(row.querySelector('.price').value);
        const u = parseFloat(row.querySelector('.usdt')?.value || 0);
        if (p > 0 && u > 0) {
          const qty = Math.floor((u / p) * 100) / 100; // SOL → 2位小數
          totalQty += qty;
          totalVal += qty * p;
        }
      });
      avg = totalQty ? (totalVal / totalQty) : 0;

    } else if (symbolDisplay === 'BTCUSDT.P') {
      let totalQty = 0, totalVal = 0;
      rows.forEach(row => {
        const p = parseFloat(row.querySelector('.price').value);
        const u = parseFloat(row.querySelector('.usdt')?.value || 0);
        if (p > 0 && u > 0) {
          const qty = u / p;
          totalQty += qty;
          totalVal += u;
        }
      });
      avg = totalQty ? (totalVal / totalQty) : 0;

    } else {
      let sum = 0, count = 0;
      rows.forEach(row => {
        const p = parseFloat(row.querySelector('.price').value);
        if (p > 0) {
          sum += p;
          count++;
        }
      });
      avg = count ? (sum / count) : 0;
    }

    get('#result').innerText = `平均開倉價：${avg.toFixed(4)} USDT`;
  }

  // 新增一行輸入
  function addEntry() {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input class="price" type="number" step="0.0000001" placeholder="價格 (USDT)" />
      <input class="usdt"  type="number" step="0.01"      placeholder="投入 USDT" />
    `;
    get('#entries').append(row);
  }

  // 自動刷新設定
  function updateInterval() {
    clearInterval(timer);
    const ms = parseInt(get('#interval').value, 10);
    timer = setInterval(() => {
      if (currentInstId) loadTicker(currentInstId);
    }, ms);
  }

  // 綁定事件
  get('#symbol').addEventListener('change', e => {
    const symbol = e.target.value;
    const instId = toInstId(symbol);
    if (!instId) return;
    currentInstId = instId;
    const container = get('#entries');
    container.innerHTML = '';
    for (let i = 0; i < 2; i++) addEntry();
    const newRows = container.querySelectorAll('.row');
    newRows[0].querySelector('.price').value = '50000';
    newRows[1].querySelector('.price').value = '52000';
    newRows.forEach(row => row.querySelector('.usdt').value = '10000');
    loadTicker(currentInstId);
  });
  document.getElementById('addEntry').addEventListener('click', addEntry);
  document.getElementById('interval').addEventListener('change', updateInterval);

  // 初始化
  loadSymbols();
  addEntry();
  updateInterval();
};
