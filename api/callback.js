import fetch from 'node-fetch';

export default async function handler(req, res) {
  const code = req.query.code;
  const CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const REDIRECT_URI  = process.env.GITHUB_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri:  REDIRECT_URI
  });
  const tokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    { method:'POST', headers:{ 'Accept':'application/json' }, body: params }
  );
  const { access_token } = await tokenRes.json();
  res.setHeader('Set-Cookie',
    `gh_token=${access_token}; Path=/; HttpOnly; SameSite=Lax`
  );
  res.redirect(process.env.FRONTEND_URL);
}
