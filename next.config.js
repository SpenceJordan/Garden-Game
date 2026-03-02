/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/Plant.html',
      },
    ];
  },
};

module.exports = nextConfig
