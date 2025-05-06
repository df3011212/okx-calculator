// 存／讀書籤
(function(){
  const KEY = "okx_history_v1";
  window.saveToHistory   = saveToHistory;
  window.renderHistory   = renderHistory;

  function saveToHistory(){
    const rec = {
      symbol:     document.getElementById("symbolInput").value,
      capital:    +document.getElementById("capital").value,
      entryPrice: +document.getElementById("entryPrice").value,
      marginRatio:+document.getElementById("marginRatio").value,
      stoploss:   +document.getElementById("stoploss").value,
      maxLoss:    +document.getElementById("maxLoss").value,
      time:       new Date().toLocaleString()
    };
    const h = JSON.parse(localStorage.getItem(KEY)||"[]");
    const last = h[0];
    if (last
        && last.symbol===rec.symbol
        && last.capital===rec.capital
        && last.marginRatio===rec.marginRatio
        && last.stoploss===rec.stoploss
        && last.maxLoss===rec.maxLoss){
      showCenterNotice("❌ 已存在相同紀錄，不重複儲存");
      return;
    }
    h.unshift(rec);
    if (h.length>10) h.length=10;
    localStorage.setItem(KEY,JSON.stringify(h));
    renderHistory();
    showNotice("✅ 保存成功，請到右下角書籤查收");
  }

  function renderHistory(){
    const lst = document.getElementById("historyList");
    const h   = JSON.parse(localStorage.getItem(KEY)||"[]");
    lst.innerHTML="";
    h.forEach((it,i)=>{
      const lr  = it.maxLoss/(it.capital*(it.marginRatio/100)*(it.stoploss/100));
      const pos = Math.round((it.capital*(it.marginRatio/100))*Math.floor(lr));
      const div = document.createElement("div");
      div.className="history-entry";
      div.innerHTML=`
        <div class="history-info">
          <b>${it.symbol}</b> @ ${it.entryPrice}
          ｜槓桿: ${Math.floor(lr)} 倍
          ｜總持倉量: $${pos.toLocaleString()} USDT
          <div class="history-time">${it.time}</div>
        </div>
        <div class="history-actions">
          <button data-i="${i}" class="app">套用</button>
          <button data-i="${i}" class="del">刪除</button>
        </div>
      `;
      lst.appendChild(div);
    });
    lst.querySelectorAll(".app")
       .forEach(b=>b.addEventListener("click",e=>applyHistory(+e.target.dataset.i)));
    lst.querySelectorAll(".del")
       .forEach(b=>b.addEventListener("click",e=>deleteHistory(+e.target.dataset.i)));
  }

  function applyHistory(i){
    const h = JSON.parse(localStorage.getItem(KEY)||"[]");
    const it= h[i]; if(!it) return;
    document.getElementById("symbolInput").value = it.symbol;
    ["capital","entryPrice","marginRatio","stoploss","maxLoss"]
      .forEach(id=>document.getElementById(id).value=it[id]);
    document.getElementById("historySidebar"); // no-op
    // 重新計算
    window.calculate();
  }

  function deleteHistory(i){
    if (!confirm("❓ 確定要刪除此條紀錄嗎？")) return;
    const h = JSON.parse(localStorage.getItem(KEY)||"[]");
    h.splice(i,1);
    localStorage.setItem(KEY,JSON.stringify(h));
    renderHistory();
  }

  function showNotice(txt){
    const n=document.createElement("div");
    n.textContent=txt;
    Object.assign(n.style,{
      position:"fixed",bottom:"20px",right:"20px",
      padding:"10px 14px",background:"#333",color:"#fff",
      borderRadius:"6px",boxShadow:"0 2px 6px rgba(0,0,0,0.3)",
      zIndex:2000,fontSize:"14px"
    });
    document.body.append(n);
    setTimeout(()=>n.remove(),3000);
  }
  function showCenterNotice(txt){
    const n=document.createElement("div");
    n.textContent=txt;
    Object.assign(n.style,{
      position:"fixed",top:"50%",left:"50%",
      transform:"translate(-50%,-50%)",
      padding:"12px 20px",background:"#dc3545",color:"#fff",
      borderRadius:"6px",boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
      zIndex:2000,fontSize:"16px",textAlign:"center"
    });
    document.body.append(n);
    setTimeout(()=>n.remove(),3000);
  }

  // 初始化
  window.renderHistory();
})();
