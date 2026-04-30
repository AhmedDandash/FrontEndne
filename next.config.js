/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  async rewrites() {
    // Use proxy to bypass CORS
    // Backend URL can be configured via BACKEND_API_URL env variable
    const backendUrl = process.env.BACKEND_API_URL || 'https://sigma-api.runasp.net';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
