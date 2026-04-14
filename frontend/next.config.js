/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles only the files needed to run the server,
  // dramatically reducing the final Docker image size.
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  },
}

module.exports = nextConfig
