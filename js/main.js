// 啟動、綁定所有事件
window.addEventListener("DOMContentLoaded",()=>{
  // 載入幣種、市價、第一次計算
  loadSymbols();
  setInterval(fetchMarketPrice, 500);
  calculate();

  // 綁定 UI 互動
  document.getElementById("togglePriceBtn")
    .addEventListener("click",()=>{ window.toggleMarketPrice(); });

  document.getElementById("symbolInput")
    .addEventListener("input",()=>{ fetchMarketPrice(); calculate(); });

  document.querySelectorAll("input")
    .forEach(i=>i.addEventListener("input",calculate));

  document.getElementById("toggleHistoryBtn")
    .addEventListener("click",()=>{
      const sb=document.getElementById("historySidebar");
      sb.style.right = sb.style.right==="0px" ? "-350px" : "0px";
    });

  document.getElementById("saveBtn")
    .addEventListener("click", saveToHistory);

  // 書籤列表 & 功能選單
  bindFeatureMenu();
});
