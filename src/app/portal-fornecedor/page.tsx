'use client'
import { useEffect } from 'react'

export default function portal-fornecedorPage() {
  useEffect(() => {
    window.location.href = '/portal-fornecedor.html'
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔧</div>
        <div style={{fontSize:16}}>Carregando Portal do Fornecedor...</div>
      </div>
    </div>
  )
}
