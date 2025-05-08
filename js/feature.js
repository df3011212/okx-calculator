// 功能選單開關、載入功能
(function(){
  const modules = {
    manualAvg:    window.initManualAvg,
    specifiedAvg: window.initSpecifiedAvg,
    quickRevenge: window.initQuickRevenge,
    advRevenge:   window.initAdvRevenge,
    ranking:      window.initRanking
  };

  window.bindFeatureMenu = function(){
    const btnOpen   = document.getElementById("newFeatureBtn");
    const btnClose  = document.getElementById("featureCloseBtn");
    const menu      = document.getElementById("featureMenu");
    const content   = document.getElementById("featureContent");
    const rankingEl = document.getElementById("rankingSection");
    const manualEl  = document.getElementById("manualAvgSection");

    // 開／關選單
    btnOpen.addEventListener("click", () => {
      menu.classList.toggle("feature-menu-visible");
      menu.classList.toggle("feature-menu-hidden");
    });
    btnClose.addEventListener("click", () => {
      menu.classList.add("feature-menu-hidden");
      menu.classList.remove("feature-menu-visible");
      content.style.display = "none";
    });

    // 綁定功能按鈕
    document.querySelectorAll("#featureMenu .feature-menu-grid button")
      .forEach(button => {
        button.addEventListener("click", e => {
          const key = e.target.getAttribute("data-feature");

          // 先關閉 overlay 面板，而且隱藏兩個主頁區塊
          content.style.display      = "none";
          rankingEl.style.display    = "none";
          manualEl.style.display     = "none";
          menu.classList.remove("feature-menu-visible");
          menu.classList.add("feature-menu-hidden");

          if (key === "ranking" || key === "manualAvg") {
            // 主頁底下顯示排行榜或手動均價
            if (key === "ranking") {
              rankingEl.style.display = "block";
            } else {
              manualEl.style.display = "block";
            }
            modules[key]();  // 執行 window.initRanking or initManualAvg
          } else {
            // 其它功能都走 overlay 注入流程
            content.style.display = "block";
            modules[key]?.();
          }
        });
      });
  };
})();
