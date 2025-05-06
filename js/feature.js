// 功能選單開關、載入功能
(function(){
  const modules = {
    manualAvg: window.initManualAvg,
    specifiedAvg: window.initSpecifiedAvg,
    quickRevenge: window.initQuickRevenge,
    advRevenge: window.initAdvRevenge
  };

  window.bindFeatureMenu = function(){
    const btnOpen  = document.getElementById("newFeatureBtn");
    const btnClose = document.getElementById("featureCloseBtn");
    const menu     = document.getElementById("featureMenu");
    const content  = document.getElementById("featureContent");

    btnOpen.addEventListener("click",()=>{
      menu.classList.toggle("feature-menu-visible");
      menu.classList.toggle("feature-menu-hidden");
    });
    btnClose.addEventListener("click",()=>{
      menu.classList.add("feature-menu-hidden");
      menu.classList.remove("feature-menu-visible");
      content.style.display="none";
    });
    document.querySelectorAll("#featureMenu .feature-menu-grid button")
      .forEach(b=>{
        b.addEventListener("click",e=>{
          const f = e.target.getAttribute("data-feature");
          content.style.display="block";
          modules[f]?.();
        });
      });
  };
})();
