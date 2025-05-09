import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import { createOAuthDeviceAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-device";

const CLIENT_ID = "<你在 GitHub OAuth App 里拿到的 Client ID>";
let octokit = null;

async function loginWithGithub() {
  const auth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: CLIENT_ID,
    scopes: ["gist"]
  });
  const { user_code, verification_uri } = await auth({ type: "request-device-code" });
  alert(`請到\n${verification_uri}\n輸入授權碼：\n\n${user_code}`);
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
  const octo = getOctokit();
  const payload = {
    files: { "okx-data.json": { content: JSON.stringify(data, null, 2) } },
    public: false
  };
  const gistId = localStorage.getItem("gist_id");
  if (gistId) {
    await octo.gists.update({ gist_id: gistId, ...payload });
  } else {
    const res = await octo.gists.create(payload);
    localStorage.setItem("gist_id", res.data.id);
  }
}

async function loadFromGist() {
  const octo = getOctokit();
  const gistId = localStorage.getItem("gist_id");
  if (!gistId) throw new Error("尚未建立 Sync Gist");
  const res = await octo.gists.get({ gist_id: gistId });
  return JSON.parse(res.data.files["okx-data.json"].content);
}

// —— 挂载 UI 按钮 —— 
document.getElementById("loginBtn")?.addEventListener("click", loginWithGithub);

document.getElementById("saveBtn")?.addEventListener("click", async () => {
  const data = {
    bookmarks: JSON.parse(localStorage.getItem("saved_history") || "[]"),
    records:   JSON.parse(localStorage.getItem("saved_history") || "[]")
  };
  try {
    await saveToGist(data);
    alert("同步成功！");
  } catch (e) {
    console.error(e);
    alert("同步失敗");
  }
});

document.getElementById("loadBtn")?.addEventListener("click", async () => {
  try {
    const data = await loadFromGist();
    localStorage.setItem("saved_history", JSON.stringify(data.bookmarks));
    window.location.reload();
  } catch (e) {
    console.error(e);
    alert("載入失敗");
  }
});
