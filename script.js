
const inputs = document.querySelectorAll("input");
inputs.forEach(input => input.addEventListener("input", calculate));

document.getElementById("fontSize").addEventListener("input", () => {
  document.body.style.fontSize = document.getElementById("fontSize").value + "px";
});

function calculate() {
  const capital = parseFloat(document.getElementById("capital").value);         // 本金
  const marginRatio = parseFloat(document.getElementById("marginRatio").value) / 100; // 保證金%
  const stoplossRatio = parseFloat(document.getElementById("stoploss").value) / 100;  // 止損%
  const maxLoss = parseFloat(document.getElementById("maxLoss").value);         // 最大虧損
  const profitPct = parseFloat(document.getElementById("profitPct").value) / 100;     // 獲利%

  const margin = Math.round(capital * marginRatio); // B3
  const leverage = (capital * marginRatio * stoplossRatio) === 0 ? 0 : maxLoss / (capital * marginRatio * stoplossRatio); // B4
  const position = Math.round(margin * leverage); // B3 * B4
  const leverageProfit = Math.round(leverage * profitPct * 100); // B4 * B9
  const finalProfit = Math.round(leverage * margin * profitPct); // B4 * B3 * B9

  document.getElementById("marginResult").textContent = margin;
  document.getElementById("leverage").textContent = leverage.toFixed(2);
  document.getElementById("position").textContent = position;
  document.getElementById("leverageProfit").textContent = leverageProfit;
  document.getElementById("finalProfit").textContent = finalProfit;
}

calculate();
