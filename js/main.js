// 啟動、綁定所有事件
window.addEventListener("DOMContentLoaded", () => {
  loadSymbols();
  setInterval(fetchMarketPrice, 500);
  calculate();
  fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP")
  .then(res => res.json())
  .then(data => {
    window.coinList = data.data
      .filter(i => i.settleCcy === "USDT" && i.instId.endsWith("-SWAP"))
      .map(i => i.instId.replace(/-/g, "").replace("SWAP", ".P"));
  });


// 綁定 UI 互動
document.getElementById("togglePriceBtn")
  .addEventListener("click", () => { window.toggleMarketPrice(); });

document.getElementById("symbolInput")
  .addEventListener("input", () => { fetchMarketPrice(); calculate(); });

document.querySelectorAll("input")
  .forEach(i => i.addEventListener("input", calculate));

document.getElementById("toggleHistoryBtn")
  .addEventListener("click", () => {
    renderSavedHistory();
    const sb = document.getElementById("historySidebar");
    sb.style.right = sb.style.right === "0px" ? "-350px" : "0px";
  });

document.getElementById("saveBtn")
  .addEventListener("click", saveToHistory);

bindFeatureMenu();

const symbolInput = document.getElementById("symbolInput");
const cryptoSearchInput = document.getElementById("cryptoSearchInput");
const searchResult = document.getElementById("searchResult");

// === 彈窗邏輯 ===
symbolInput.addEventListener("focus", () => {
  document.getElementById("cryptoSearchModalOverlay").style.display = "flex";
  renderCryptoHistory();
  renderFavorites();
});

// 關閉彈窗功能
window.closeCryptoSearch = function () {
  document.getElementById("cryptoSearchModalOverlay").style.display = "none";
}

// 搜尋功能
cryptoSearchInput.addEventListener("input", () => {
  const keyword = cryptoSearchInput.value.trim().toUpperCase();
  searchResult.innerHTML = "";
  if (!keyword) return;

  const results = (window.coinList || []).filter(c => c.includes(keyword));


  results.forEach(coin => {
    const div = document.createElement("div");
    div.className = "crypto-item";

    const span = document.createElement("span");
    span.textContent = coin;

    const star = document.createElement("button");
    star.innerHTML = "⭐";
    star.onclick = () => toggleFavorite(coin);

    div.appendChild(span);
    div.appendChild(star);
    div.onclick = (e) => {
      if (e.target === star) return;
      symbolInput.value = coin;
      closeCryptoSearch();
      addToCryptoHistory(coin);
      symbolInput.dispatchEvent(new Event("input"));
    };

    searchResult.appendChild(div);
  });
});

// 清除歷史
window.clearCryptoHistory = function () {
  localStorage.removeItem("crypto_history");
  document.getElementById("historyList").innerHTML = '<p style="color:#888">（已清除）</p>';
};
});

// === 最愛幣種 ===
let favorites = JSON.parse(localStorage.getItem("crypto_favorites") || "[]");

function renderFavorites() {
const favoriteList = document.getElementById("favoriteList");
favoriteList.innerHTML = "";
favorites.forEach(coin => {
  const div = document.createElement("div");
  div.className = "favorite-item";
  div.innerHTML = `
    <span class="coin-name">${coin}</span>
    <button class="remove">🗑</button>
  `;
  div.querySelector(".coin-name").addEventListener("click", () => {
    document.getElementById("symbolInput").value = coin;
    closeCryptoSearch();
    document.getElementById("symbolInput").dispatchEvent(new Event("input"));
  });
  div.querySelector(".remove").addEventListener("click", () => {
    favorites = favorites.filter(c => c !== coin);
    localStorage.setItem("crypto_favorites", JSON.stringify(favorites));
    renderFavorites();
  });
  favoriteList.appendChild(div);
});
}
renderFavorites();

// 歷史與最愛邏輯
function addToCryptoHistory(symbol) {
let history = JSON.parse(localStorage.getItem("crypto_history") || "[]");
history = history.filter(s => s !== symbol);
history.unshift(symbol);
if (history.length > 10) history.length = 10;
localStorage.setItem("crypto_history", JSON.stringify(history));
renderCryptoHistory();
}

function renderCryptoHistory() {
const list = document.getElementById("recentSearchList");
const history = JSON.parse(localStorage.getItem("crypto_history") || "[]");
list.innerHTML = "";
history.forEach(symbol => {
  const div = document.createElement("div");
  div.className = "crypto-item";
  div.textContent = symbol;
  div.onclick = () => {
    document.getElementById("symbolInput").value = symbol;
    closeCryptoSearch();
    document.getElementById("symbolInput").dispatchEvent(new Event("input"));
  };
  list.appendChild(div);
});
}

function toggleFavorite(symbol) {
let fav = JSON.parse(localStorage.getItem("crypto_favorites") || "[]");
if (fav.includes(symbol)) {
  fav = fav.filter(f => f !== symbol);
} else {
  fav.unshift(symbol);
  if (fav.length > 20) fav.length = 20;
}
localStorage.setItem("crypto_favorites", JSON.stringify(fav));
renderFavorites();
}

function renderFavorites() {
const favoriteList = document.getElementById("favoriteList");
const favorites = JSON.parse(localStorage.getItem("crypto_favorites") || "[]");
favoriteList.innerHTML = "";
favorites.forEach(coin => {
  const btn = document.createElement("button");
  btn.className = "crypto-item";
  btn.innerHTML = `
    ${coin}
    <button class="remove" title="移除最愛">🗑</button>
  `;
  btn.onclick = () => {
    symbolInput.value = coin;
    closeCryptoSearch();
    symbolInput.dispatchEvent(new Event("input"));
  };
  btn.querySelector(".remove").onclick = e => {
    e.stopPropagation();
    const newList = favorites.filter(c => c !== coin);
    localStorage.setItem("crypto_favorites", JSON.stringify(newList));
    renderFavorites();
  };
  favoriteList.appendChild(btn);
});
}
// 一鍵清除搜尋結果
function clearSearchResult() {
document.getElementById("searchResult").innerHTML = "";
}

// 市價 / 限價 切換狀態

let useMarketPrice = true;

window.toggleMarketPrice = function () {
useMarketPrice = !useMarketPrice;

const entryInput = document.getElementById("entryPrice");
const toggleBtn = document.getElementById("togglePriceBtn");

toggleBtn.textContent = useMarketPrice ? "使用限價" : "使用市價";

if (useMarketPrice) {
  entryInput.setAttribute("readonly", true);
  fetchMarketPrice(); // ⬅ 市價模式才抓並顯示
} else {
  entryInput.removeAttribute("readonly");
  entryInput.value = ""; // ⬅ 限價時清除欄位
}
};

function fetchMarketPrice() {
  const symbol = document.getElementById("symbolInput").value.trim();
  if (!symbol) return;

  const instId = symbol
    .replace(".P", "")
    .replace(/(USDT|BTC|ETH)$/i, "-$1")
    + "-SWAP";

  console.log("查詢實際 instId:", instId);

  fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`)
    .then(res => res.json())
    .then(data => {
      if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        console.error("❌ 市價抓取失敗：Instrument 不存在", data);
        return;
      }
      const price = parseFloat(data.data[0].last);
      if (!isNaN(price) && useMarketPrice) {
        document.getElementById("entryPrice").value = price;
      }
    })
    .catch(err => console.error("市價抓取失敗", err));
}



function renderSavedHistory() {
  const list = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("saved_history") || "[]");
  list.innerHTML = "";

  if (!history.length) {
    list.innerHTML = "<p style='color: #888;'>（尚無書籤紀錄）</p>";
    return;
  }

  history.forEach((record, index) => {
    const div = document.createElement("div");
    div.className = "bookmark-card";
    const date = new Date(record.timestamp);
    const dateStr = date.toLocaleString("zh-TW", {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      hour12: true
    });

    const leverage = Math.round((record.maxLoss / ((record.capital * record.marginRatio / 100) * (record.stoploss / 100))));
    const position = Math.round(record.capital * (record.marginRatio / 100) * leverage);

    div.innerHTML = `
      <div><strong>${record.symbol}</strong> @ ${record.entryPrice}｜槓桿: ${leverage} 倍｜總持倉量: $${position.toLocaleString()} USDT</div>
      <div style="font-size: 14px; color: #666; margin: 6px 0;">${dateStr}</div>
      <div class="bookmark-actions">
        <button onclick="applyHistory(${index})" class="apply-btn">套用</button>
        <button onclick="deleteHistory(${index})" class="delete-btn">刪除</button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.applyHistory = function(index) {
  const history = JSON.parse(localStorage.getItem("saved_history") || "[]");
  const r = history[index];
  if (!r) return;

  document.getElementById("symbolInput").value = r.symbol;
  document.getElementById("capital").value = r.capital;
  document.getElementById("entryPrice").value = r.entryPrice;
  document.getElementById("marginRatio").value = r.marginRatio;
  document.getElementById("stoploss").value = r.stoploss;
  document.getElementById("maxLoss").value = r.maxLoss;

  document.getElementById("symbolInput").dispatchEvent(new Event("input"));
};


window.deleteHistory = function(index) {
  if (!confirm("確定要刪除這筆書籤紀錄嗎？")) return;
  let history = JSON.parse(localStorage.getItem("saved_history") || "[]");
  history.splice(index, 1);
  localStorage.setItem("saved_history", JSON.stringify(history));
  renderSavedHistory();
};

function saveToHistory() {
  const symbol = document.getElementById("symbolInput").value.trim();
  const capital = document.getElementById("capital").value.trim();
  const entryPrice = document.getElementById("entryPrice").value.trim();
  const marginRatio = document.getElementById("marginRatio").value.trim();
  const stoploss = document.getElementById("stoploss").value.trim();
  const maxLoss = document.getElementById("maxLoss").value.trim();

  const record = {
    symbol,
    capital,
    entryPrice,
    marginRatio,
    stoploss,
    maxLoss,
    timestamp: Date.now()
  };

  let history = JSON.parse(localStorage.getItem("saved_history") || "[]");

  const isDuplicate = history.some(item => item.symbol === record.symbol && item.entryPrice === record.entryPrice);
  if (isDuplicate) {
    const msg = document.createElement("div");
    msg.textContent = "❌ 已存在相同紀錄，不重複儲存";
    msg.style.cssText = "background:#c00;color:#fff;padding:8px 16px;border-radius:8px;position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
    return;
  }

  history.unshift(record);
  if (history.length > 10) history.length = 10;
  localStorage.setItem("saved_history", JSON.stringify(history));
  renderSavedHistory();

  const ok = document.createElement("div");
  ok.textContent = "✅ 儲存紀錄成功";
  ok.style.cssText = "background:#28a745;color:#fff;padding:8px 16px;border-radius:8px;position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;";
  document.body.appendChild(ok);
  setTimeout(() => ok.remove(), 1500);
}

async function showLoginQRCode() {
  try {
    // 向 Serverless Function 取得授權網址
    const resp = await fetch('/api/auth-url');
    const { url } = await resp.json();
    // 用 Google Chart API 產生 QR 圖片
    const qrImg = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(url)}`;
    // 把圖片插到畫面上
    const container = document.getElementById('qrContainer');
    container.innerHTML = `<img src="${qrImg}" alt="Scan to login" />`;
  } catch (e) {
    console.error(e);
    alert('無法取得登入 QR，請稍後再試');
  }
}

// 綁定按鈕
document.getElementById('qrLoginBtn').addEventListener('click', showLoginQRCode);
