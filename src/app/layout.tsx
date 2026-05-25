import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Mecani.AI', description: 'Dashboard de Gestão de Oficinas' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}