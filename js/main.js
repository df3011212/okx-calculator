// ✅ 初始化 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDY36t7W_yMQ0E7CWX2HQAs262XQmQqB3A",
  authDomain: "okxtradingapp.firebaseapp.com",
  projectId: "okxtradingapp",
  storageBucket: "okxtradingapp.appspot.com",
  messagingSenderId: "1055694692087",
  appId: "1:1055694692087:web:83bfd47ec5c1f19f653df2",
  measurementId: "G-QY4RMELT45"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 匿名登入（避免需要帳號登入）
firebase.auth().signInAnonymously().catch(console.error);




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
    const capitalNum = parseFloat(record.本金);
    const marginRatioNum = parseFloat(record.保證金比例);
    const stoplossNum = parseFloat(record.止損比例);
    const maxLossNum = parseFloat(record.最大虧損);

    const leverage = Math.round(maxLossNum / ((capitalNum * marginRatioNum / 100) * (stoplossNum / 100)));
    const position = Math.round(capitalNum * (marginRatioNum / 100) * leverage);

    const div = document.createElement("div");
    div.className = "bookmark-card";
    const date = new Date(record.timestamp);
    const dateStr = date.toLocaleString("zh-TW");

    div.innerHTML = `
      <div><strong>${record.幣種}</strong> @ ${record.開倉價格}｜槓桿: ${leverage} 倍｜總持倉量: $${position.toLocaleString()} USDT</div>
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

  document.getElementById("symbolInput").value = r.幣種;
  document.getElementById("capital").value = r.本金;
  document.getElementById("entryPrice").value = r.開倉價格;
  document.getElementById("marginRatio").value = r.保證金比例;
  document.getElementById("stoploss").value = r.止損比例;
  document.getElementById("maxLoss").value = r.最大虧損;

  document.getElementById("symbolInput").dispatchEvent(new Event("input"));
};



window.deleteHistory = function(index) {
  if (!confirm("確定要刪除這筆書籤紀錄嗎？")) return;
  let history = JSON.parse(localStorage.getItem("saved_history") || "[]");
  history.splice(index, 1);
  localStorage.setItem("saved_history", JSON.stringify(history));
  renderSavedHistory();
};

async function saveToHistory() {
  const symbol = document.getElementById("symbolInput").value.trim();
  const capital = document.getElementById("capital").value.trim();
  const entryPrice = document.getElementById("entryPrice").value.trim();
  const marginRatio = document.getElementById("marginRatio").value.trim();
  const stoploss = document.getElementById("stoploss").value.trim();
  const maxLoss = document.getElementById("maxLoss").value.trim();
  const timestamp = Date.now();

  const ip = await fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip)
    .catch(() => "unknown");

  const record = {
    幣種: symbol,
    本金: capital,
    開倉價格: entryPrice,
    保證金比例: marginRatio,
    止損比例: stoploss,
    最大虧損: maxLoss,
    儲存時間: new Date(timestamp).toLocaleString("zh-TW"),
    timestamp,
    IP: ip
  };

  // ✅ localStorage 書籤儲存
  let history = JSON.parse(localStorage.getItem("saved_history") || "[]");
  const isDuplicate = history.some(item => item.幣種 === record.幣種 && item.開倉價格 === record.開倉價格);
  if (isDuplicate) {
    alert("❌ 已存在相同紀錄，不重複儲存");
    return;
  }
  history.unshift(record);
  if (history.length > 10) history.length = 10;
  localStorage.setItem("saved_history", JSON.stringify(history));
  renderSavedHistory();

  // ✅ Firebase 分 IP 儲存
  db.collection("orders").doc(ip).set({
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  db.collection("orders").doc(ip).collection("records").add(record)
    .then(() => {
      console.log("✅ 書籤紀錄儲存成功");
      alert("✅ 開單紀錄已儲存至書籤紀錄");
    })
    .catch(err => {
      console.error("❌ 書籤紀錄 儲存失敗", err);
      alert("❌ 儲存到 書籤紀錄 失敗");
    });
}
