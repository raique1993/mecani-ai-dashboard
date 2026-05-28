/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcjynyfusqkqtdohnyzq.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gNJhc4WCS9MnnmDAL2T6Vg_AQ71_Vid',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecaniia.com.br',
    NEXT_PUBLIC_PORTAIS_URL: process.env.NEXT_PUBLIC_PORTAIS_URL || 'https://mecaniia.com.br',
  },
  async redirects() {
    return [
      {
        source: '/mecanico',
        destination: 'https://mecaniia.com.br/portal-mecanico.html',
        permanent: false,
      },
      {
        source: '/cliente',
        destination: 'https://mecaniia.com.br/portal-cliente.html',
        permanent: false,
      },
      {
        source: '/agendar',
        destination: 'https://mecaniia.com.br/portal-agendamento.html',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
