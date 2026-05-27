'use client'
import { useEffect } from 'react'

export default function portal-mecanicoPage() {
  useEffect(() => {
    window.location.href = '/portal-mecanico.html'
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔧</div>
        <div style={{fontSize:16}}>Carregando Portal do Mecânico...</div>
      </div>
    </div>
  )
}
