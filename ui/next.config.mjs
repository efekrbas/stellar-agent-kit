import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Use monorepo root so hoisted node_modules (sonner, next-themes, zod, etc.) resolve
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
}

export default nextConfig
