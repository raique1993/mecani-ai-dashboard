'use client'
import { useEffect } from 'react'

export default function portal-agendamentoPage() {
  useEffect(() => {
    window.location.href = '/portal-agendamento.html'
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔧</div>
        <div style={{fontSize:16}}>Carregando Agendamento Online...</div>
      </div>
    </div>
  )
}
