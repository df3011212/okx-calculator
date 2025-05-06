// 這個檔負責載入幣種、市價、計算核心
(function(){
  window.calculate = calculate;
  window.loadSymbols = loadSymbols;
  window.fetchMarketPrice = fetchMarketPrice;
  window.instIdToDisplay = instIdToDisplay;
  window.displayToInstId = displayToInstId;

  let useMarketPrice = true;
  window.toggleMarketPrice = ()=> useMarketPrice = !useMarketPrice;

  function instIdToDisplay(id) {
    const p = id.split("-");
    return p[0] + p[1] + ".P";
  }
  function displayToInstId(d) {
    if (!d.endsWith(".P")) return d;
    const code = d.slice(0, -2);
    const base = code.slice(0, -4);
    const quote= code.slice(-4);
    return `${base}-${quote}-SWAP`;
  }

  async function loadSymbols(){
    const res = await fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP");
    const data= await res.json();
    const dl  = document.getElementById("symbolList");
    data.data.filter(i=>i.settleCcy==="USDT"&&i.instId.endsWith("-SWAP"))
      .forEach(i=>{
        const opt=document.createElement("option");
        opt.value=instIdToDisplay(i.instId);
        dl.append(opt);
      });
    document.getElementById("symbolInput").value = instIdToDisplay("OP-USDT-SWAP");
  }

  async function fetchMarketPrice(){
    try {
      const inst = displayToInstId(document.getElementById("symbolInput").value);
      const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${inst}`);
      const j = await r.json();
      const p = parseFloat(j.data?.[0]?.last);
      if (useMarketPrice && !isNaN(p)) {
        document.getElementById("entryPrice").value = p;
        calculate();
      }
    } catch{}
  }

  function calculate(){
    const cap  = +document.getElementById("capital").value;
    const mr   = +document.getElementById("marginRatio").value/100;
    const sr   = +document.getElementById("stoploss").value/100;
    const ml   = +document.getElementById("maxLoss").value;
    const ep   = +document.getElementById("entryPrice").value;

    const B3 = cap*mr;
    const B4 = ml/(B3*sr);
    document.getElementById("leverage").textContent = Math.round(B4);

    const position = Math.round(B3*B4);
    document.getElementById("position").textContent = `$${position.toLocaleString()} USDT`;

    const longM  = (position/B4)*1.0188;
    const shortM = (position/B4)*1.00125;
    const avail  = Math.round((cap-longM)*100)/100;
    const liq    = B4>0
                   ? Math.round((ep*(1-1/B4))*100000)/100000
                   : 0;
    const req    = position*0.00803;
    const rate   = req>0 ? (longM/req)*100 : 0;

    document.getElementById("longMargin").textContent       = longM.toFixed(2);
    document.getElementById("shortMargin").textContent      = shortM.toFixed(2);
    document.getElementById("available").textContent        = avail;
    document.getElementById("liqPrice").textContent         = liq;
    document.getElementById("maintMarginRatio").textContent = rate.toFixed(2);
  }
})();
