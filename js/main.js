
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
  const list = document.getElementById("historyList");
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
