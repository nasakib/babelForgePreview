/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'troika-three-text', 'webgl-sdf-generator', 'bidi-js'],
}

module.exports = nextConfig
