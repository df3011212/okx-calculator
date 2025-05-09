// js/main.js
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
  document.getElementById("togglePriceBtn").addEventListener("click", () => window.toggleMarketPrice());
  document.getElementById("symbolInput").addEventListener("input", () => { fetchMarketPrice(); calculate(); });
  document.querySelectorAll("input").forEach(i => i.addEventListener("input", calculate));
  document.getElementById("toggleHistoryBtn").addEventListener("click", () => {
    renderSavedHistory();
    const sb = document.getElementById("historySidebar");
    sb.style.right = sb.style.right === "0px" ? "-350px" : "0px";
  });
  document.getElementById("saveBtn").addEventListener("click", saveToHistory);
  bindFeatureMenu();

  // 搜尋、最愛、歷史... (省略，本段保留原本 code)
});

// ===== GitHub 同步功能 =====
// 注意：請確認 index.html 中以 <script type="module" src="js/main.js"></script> 引入此檔
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import { createOAuthDeviceAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-device";

const CLIENT_ID = "<YOUR_CLIENT_ID>";  // 請填入你的 GitHub OAuth App Client ID
let octokit = null;

// 登入取得 device_code
async function loginWithGithub() {
  const auth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: CLIENT_ID,
    scopes: ["gist"]
  });
  const { user_code, verification_uri } = await auth({ type: "request-device-code" });
  alert(`請開啟：${verification_uri}\n並輸入授權碼：${user_code}`);
  const { authentication } = await auth({ type: "poll" });
  localStorage.setItem("gh_token", authentication.token);
  octokit = new Octokit({ auth: authentication.token });
}

function getOctokit() {
  if (octokit) return octokit;
  const token = localStorage.getItem("gh_token");
  if (!token) throw new Error("尚未登入 GitHub");
  octokit = new Octokit({ auth: token });
  return octokit;
}

async function saveToGist(data) {
  const oct = getOctokit();
  const payload = { files: { "okx-data.json": { content: JSON.stringify(data, null, 2) } }, public: false };
  const id = localStorage.getItem("gist_id");
  if (id) {
    await oct.gists.update({ gist_id: id, ...payload });
  } else {
    const res = await oct.gists.create(payload);
    localStorage.setItem("gist_id", res.data.id);
  }
}

async function loadFromGist() {
  const oct = getOctokit();
  const id = localStorage.getItem("gist_id");
  if (!id) throw new Error("尚未建立同步 Gist");
  const res = await oct.gists.get({ gist_id: id });
  return JSON.parse(res.data.files["okx-data.json"].content);
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn")?.addEventListener("click", async () => {
    try { await loginWithGithub(); alert("GitHub 登入成功"); }
    catch (e) { console.error(e); alert("登入失敗"); }
  });
  document.getElementById("saveBtn")?.addEventListener("click", async () => {
    try {
      const data = { bookmarks: JSON.parse(localStorage.getItem("saved_history") || "[]") };
      await saveToGist(data);
      alert("已同步到 GitHub");
    } catch (e) { console.error(e); alert("同步失敗"); }
  });
  document.getElementById("loadBtn")?.addEventListener("click", async () => {
    try {
      const data = await loadFromGist();
      localStorage.setItem("saved_history", JSON.stringify(data.bookmarks));
      window.location.reload();
    } catch (e) { console.error(e); alert("載入失敗"); }
  });
});
