// next.config.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // You can set Turbopack root if needed
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
