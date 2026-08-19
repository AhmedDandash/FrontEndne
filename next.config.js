/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  async rewrites() {
    // Use proxy to bypass CORS
    // Backend URL can be configured via BACKEND_API_URL env variable
    const backendUrl = process.env.BACKEND_API_URL;

    if (!backendUrl && process.env.NODE_ENV === 'production') {
      // Refuse to boot rather than silently proxy production traffic to the
      // staging backend because someone forgot to set the env var.
      throw new Error(
        'BACKEND_API_URL is not set. A production build must explicitly declare its backend target.'
      );
    }

    const resolvedBackendUrl = backendUrl || 'https://sigma-api.runasp.net';
    // eslint-disable-next-line no-console
    console.log(`[next.config] Proxying /api/* and /health -> ${resolvedBackendUrl}`);

    return [
      {
        source: '/api/:path*',
        destination: `${resolvedBackendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${resolvedBackendUrl}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
