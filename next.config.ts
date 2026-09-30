import type { NextConfig } from "next";

// Old imweb menu paths. Board paths themselves are unchanged; `?idx=` post links and
// the renamed boards (/25, /notice-gallery-20xx) are redirected in app/(site)/[board]/page.tsx.
const legacyPaths: [string, string][] = [
  ["/Class", "/notice-association"],
  ["/27", "/notice-membership"],
  ["/43", "/notice-contest"],
  ["/certificate", "/certificate-guide"],
  ["/about", "/about-history"],
  ["/application-form-1", "/application-form"],
  ["/54", "/"],
  ["/59", "/"],
  ["/60", "/"],
  ["/61", "/"],
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Blocking <head> metadata for every client, so KakaoTalk/Daum link previews work.
  htmlLimitedBots: /.*/,
  images: { minimumCacheTTL: 2678400 },
  experimental: {
    globalNotFound: true,
    // Admins need 45mb, but Next buffers every multipart POST up to this size, anonymous ones
    // included, so nginx caps the other paths (deploy/host-nginx.example.conf).
    serverActions: { bodySizeLimit: "45mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return legacyPaths.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
