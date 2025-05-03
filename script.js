
function updateFontSize() {
    const size = document.getElementById("fontSize").value;
    document.body.style.fontSize = size + "px";
}

function calculate() {
    const capital = parseFloat(document.getElementById("capital").value);
    const marginRatio = parseFloat(document.getElementById("marginRatio").value) / 100;
    const stoplossRatio = parseFloat(document.getElementById("stoplossRatio").value) / 100;
    const maxLoss = parseFloat(document.getElementById("maxLoss").value);
    const profitRatio = parseFloat(document.getElementById("profitRatio")?.value || "0") / 100;

    const margin = capital * marginRatio;
    const leverage = capital / margin;
    const totalPosition = maxLoss / stoplossRatio;
    const leveragedProfit = profitRatio * leverage;
    const finalProfit = capital * leveragedProfit;

    document.getElementById("marginOutput").innerText = `保證金：${margin.toFixed(2)} USDT`;
    document.getElementById("leverageOutput").innerText = `槓桿倍數：${leverage.toFixed(2)} 倍`;
    document.getElementById("totalPositionOutput").innerText = `總持倉量：${totalPosition.toFixed(2)} USDT`;

    const profitOutput = document.getElementById("leveragedProfitOutput");
    const finalProfitOutput = document.getElementById("finalProfitOutput");

    if (profitOutput && finalProfitOutput) {
        profitOutput.innerText = `槓桿獲利 %：${(leveragedProfit * 100).toFixed(2)} %`;
        finalProfitOutput.innerText = `最終獲利：${finalProfit.toFixed(2)} USDT`;
    }
}

document.addEventListener("input", calculate);
window.onload = () => {
    updateFontSize();
    calculate();
};
