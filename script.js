
const inputs = document.querySelectorAll("input");
inputs.forEach(input => input.addEventListener("input", calculate));

document.getElementById("fontSize").addEventListener("input", () => {
  document.body.style.fontSize = document.getElementById("fontSize").value + "px";
});

function calculate() {
  const capital = parseFloat(document.getElementById("capital").value);
  const marginRatio = parseFloat(document.getElementById("marginRatio").value);
  const stoploss = parseFloat(document.getElementById("stoploss").value);
  const maxLoss = parseFloat(document.getElementById("maxLoss").value);
  const profitPct = parseFloat(document.getElementById("profitPct").value);

  const margin = Math.round(capital * (marginRatio / 100));
  const leverage = stoploss === 0 ? 0 : Math.round(maxLoss / (margin * (stoploss / 100)));
  const position = margin * leverage;

  const leverageProfit = leverage * profitPct;
  const finalProfit = Math.round(position * (profitPct / 100));

  document.getElementById("marginResult").textContent = margin;
  document.getElementById("leverage").textContent = leverage;
  document.getElementById("position").textContent = position;

  document.getElementById("leverageProfit").textContent = Math.round(leverageProfit);
  document.getElementById("finalProfit").textContent = finalProfit;
}

calculate();
