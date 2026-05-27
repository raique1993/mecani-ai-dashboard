'use client'
import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const params = window.location.search
    window.location.replace('https://raique1993.github.io/mecani-ai-portais/portal-agendamento.html' + params)
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'sans-serif',flexDirection:'column',gap:16}}>
      <div style={{fontSize:48}}>🔧</div>
      <div style={{fontSize:16,color:'#888'}}>Redirecionando para Agendamento Online...</div>
    </div>
  )
}
