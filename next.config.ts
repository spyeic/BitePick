import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  // `npm run dev` listens on the LAN; let phones and other computers on private networks load dev assets.
  allowedDevOrigins: ['10.*.*.*', '192.168.*.*', '172.*.*.*', '*.local'],
};
export default nextConfig;
