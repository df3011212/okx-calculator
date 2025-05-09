export default function handler(req, res) {
  const CLIENT_ID    = process.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&scope=gist` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.status(200).json({ url });
}
