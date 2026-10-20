const upstream = process.env.API_UPSTREAM;
if (!upstream) {
  throw new Error('Set API_UPSTREAM to the API production domain, for example https://voting-apps-back-abc.vercel.app');
}
const apiOrigin = new URL(upstream).origin;

export const config = {
  rewrites: [
    { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
    { source: '/(.*)', destination: '/index.html' },
  ],
  headers: [
    {
      source: '/assets/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
};
