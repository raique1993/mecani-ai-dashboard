import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = url.searchParams.toString()
  const dest = 'https://raique1993.github.io/mecani-ai-portais/portal-admin.html' + (params ? '?' + params : '')
  return NextResponse.redirect(dest, { status: 302 })
}
