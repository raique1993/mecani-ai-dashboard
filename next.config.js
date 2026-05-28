/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcjynyfusqkqtdohnyzq.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gNJhc4WCS9MnnmDAL2T6Vg_AQ71_Vid',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecaniia.com.br',
    NEXT_PUBLIC_PORTAIS_URL: process.env.NEXT_PUBLIC_PORTAIS_URL || 'https://mecaniia.com.br',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://tcjynyfusqkqtdohnyzq.supabase.co wss://tcjynyfusqkqtdohnyzq.supabase.co;" },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/mecanico', destination: 'https://mecaniia.com.br/portal-mecanico.html', permanent: false },
      { source: '/cliente', destination: 'https://mecaniia.com.br/portal-cliente.html', permanent: false },
      { source: '/agendar', destination: 'https://mecaniia.com.br/portal-agendamento.html', permanent: false },
    ]
  },
}

module.exports = nextConfig
