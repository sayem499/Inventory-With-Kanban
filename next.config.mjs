/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: "/api/product/:path*",
            destination: `${process.env.NEXT_PUBLIC_EXTERNAL_API_URL}/product/:path*`,
          },
        ];
      },

};

export default nextConfig;
