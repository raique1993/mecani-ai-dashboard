'use client'
import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    window.location.replace('/api/portal-cliente')
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔧</div>
        <p style={{fontSize:16,color:'#888'}}>Carregando Portal do Cliente...</p>
      </div>
    </div>
  )
}
