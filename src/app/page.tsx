"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Tipos ─────────────────────────────────────────────────────
type StatusOS = "EM_DIAGNOSTICO"|"AGUARDANDO_APROVACAO"|"APROVADO"|"EM_EXECUCAO"|"AGUARDANDO_PECA"|"CONCLUIDO"|"CANCELADO";
type Aba = "kanban"|"social"|"financeiro"|"clientes"|"agendamentos"|"nps"|"config";

interface OS { id:string; numero_os:number; placa_veiculo:string; modelo_veiculo:string|null; nome_cliente:string; telefone_cliente:string; relato_inicial:string|null; diagnostico_tecnico:string|null; status:StatusOS; valor_total:number|null; valor_total_pecas:number|null; valor_total_servicos:number|null; created_at:string; concluido_at:string|null; }
interface SocialPost { id:string; tipo:string; status:string; midia_url:string; legenda_final:string|null; legenda_ia:string|null; hashtags:string[]; estilo:string; publicado_at:string|null; created_at:string; instagram_post_id:string|null; facebook_post_id:string|null; }
interface Transacao { id:string; tipo:string; categoria:string; valor:number; descricao:string; data_competencia:string; created_at:string; }
interface Cliente { id:string; nome:string; telefone:string; total_os:number; ticket_medio:number; ultima_visita:string|null; }
interface Tenant { id:string; nome_oficina:string; telefone:string|null; telefone_dono:string|null; meta_page_id:string|null; meta_access_token:string|null; instagram_id:string|null; vagas_simultaneas:number; }

// ── Cores e ícones ────────────────────────────────────────────
const COLS: Record<StatusOS,{label:string;cor:string;bg:string}> = {
  EM_DIAGNOSTICO:      {label:"Diagnóstico",   cor:"#6366f1",bg:"#eef2ff"},
  AGUARDANDO_APROVACAO:{label:"Ag. Aprovação", cor:"#f59e0b",bg:"#fffbeb"},
  APROVADO:            {label:"Aprovado",       cor:"#10b981",bg:"#ecfdf5"},
  EM_EXECUCAO:         {label:"Em Execução",   cor:"#3b82f6",bg:"#eff6ff"},
  AGUARDANDO_PECA:     {label:"Ag. Peça",      cor:"#ef4444",bg:"#fef2f2"},
  CONCLUIDO:           {label:"Concluído",      cor:"#8b5cf6",bg:"#f5f3ff"},
  CANCELADO:           {label:"Cancelado",      cor:"#6b7280",bg:"#f9fafb"},
};
const PROXIMO: Partial<Record<StatusOS,StatusOS>> = {
  EM_DIAGNOSTICO:"AGUARDANDO_APROVACAO",
  AGUARDANDO_APROVACAO:"EM_EXECUCAO",
  APROVADO:"EM_EXECUCAO",
  EM_EXECUCAO:"CONCLUIDO",
  AGUARDANDO_PECA:"EM_EXECUCAO",
};

// ── Utils ─────────────────────────────────────────────────────
const moeda = (v:number) => `R$ ${v.toFixed(2).replace(".",",")}`;
const tempo = (d:string) => {
  const h = Math.floor((Date.now()-new Date(d).getTime())/3600000);
  return h < 24 ? `${h}h` : `${Math.floor(h/24)}d`;
};

// ════════════════════════════════════════════════════════════
// COMPONENTES
// ════════════════════════════════════════════════════════════

// ── Card OS ───────────────────────────────────────────────────
function CardOS({os,onAvancar}:{os:OS;onAvancar:(id:string,s:StatusOS)=>void}) {
  const [open,setOpen] = useState(false);
  const prox = PROXIMO[os.status];
  const h = Math.floor((Date.now()-new Date(os.created_at).getTime())/3600000);
  const urgente = h > 24;
  return (
    <div onClick={()=>setOpen(!open)} style={{background:"#fff",borderRadius:10,border:`1px solid ${urgente?"#fecaca":"#e5e7eb"}`,padding:"12px 14px",marginBottom:8,cursor:"pointer",boxShadow:open?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.04)",transition:"box-shadow .15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:1}}>OS #{os.numero_os}</div>
          <div style={{fontSize:14,fontWeight:700,color:"#111827",marginTop:2}}>{os.placa_veiculo}</div>
        </div>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:urgente?"#fee2e2":"#f3f4f6",color:urgente?"#dc2626":"#6b7280",fontWeight:600}}>{tempo(os.created_at)}</span>
      </div>
      <div style={{fontSize:12,color:"#4b5563"}}>{os.modelo_veiculo||"Veículo não informado"}</div>
      <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{os.nome_cliente}</div>
      {open&&(
        <div style={{marginTop:10,borderTop:"1px solid #f3f4f6",paddingTop:10}}>
          {os.relato_inicial&&<p style={{fontSize:12,color:"#374151",marginBottom:6,lineHeight:1.5}}>{os.relato_inicial}</p>}
          {os.diagnostico_tecnico&&<p style={{fontSize:12,color:"#374151",marginBottom:6,lineHeight:1.5,background:"#f9fafb",padding:"6px 8px",borderRadius:6}}>{os.diagnostico_tecnico}</p>}
          <div style={{fontSize:11,color:"#9ca3af"}}>📞 {os.telefone_cliente}</div>
          {os.valor_total&&os.valor_total>0&&<div style={{fontSize:13,fontWeight:700,color:"#059669",marginTop:4}}>{moeda(os.valor_total)}</div>}
          {prox&&<button onClick={e=>{e.stopPropagation();onAvancar(os.id,prox);}} style={{marginTop:10,width:"100%",padding:"7px 0",background:"#111827",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>Avançar →</button>}
        </div>
      )}
    </div>
  );
}

// ── Aba Kanban ────────────────────────────────────────────────
function AbaKanban() {
  const [ordens,setOrdens] = useState<OS[]>([]);
  const [busca,setBusca] = useState("");
  const [loading,setLoading] = useState(true);

  const carregar = useCallback(async()=>{
    const{data}=await supabase.from("ordens_servico").select("*").not("status","in",'("CANCELADO")').order("created_at",{ascending:false}).limit(300);
    if(data)setOrdens(data);setLoading(false);
  },[]);

  useEffect(()=>{
    carregar();
    const ch = supabase.channel("os-rt").on("postgres_changes",{event:"*",schema:"public",table:"ordens_servico"},carregar).subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[carregar]);

  const avancar=async(id:string,s:StatusOS)=>{
    await supabase.from("ordens_servico").update({status:s,...(s==="CONCLUIDO"?{concluido_at:new Date().toISOString()}:{})}).eq("id",id);
  };

  const filtradas = busca.trim()?ordens.filter(o=>o.placa_veiculo.toLowerCase().includes(busca.toLowerCase())||o.nome_cliente.toLowerCase().includes(busca.toLowerCase())||String(o.numero_os).includes(busca)):ordens;
  const hoje = new Date().toDateString();
  const aberto = ordens.filter(o=>o.status!=="CONCLUIDO"&&o.status!=="CANCELADO").length;
  const entradas = ordens.filter(o=>new Date(o.created_at).toDateString()===hoje).length;
  const receita = ordens.filter(o=>o.status==="CONCLUIDO"&&o.concluido_at&&new Date(o.concluido_at).toDateString()===hoje).reduce((a,o)=>a+(o.valor_total||0),0);

  if(loading)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:400,color:"#9ca3af"}}>Carregando...</div>;

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[{label:"Em aberto",valor:aberto,cor:"#6366f1"},{label:"Entradas hoje",valor:entradas,cor:"#10b981"},{label:"Receita hoje",valor:moeda(receita),cor:"#f59e0b"}].map(m=>(
          <div key={m.label} style={{flex:"1 1 160px",padding:"12px 16px",borderRadius:10,border:`1px solid ${m.cor}22`,background:`${m.cor}08`}}>
            <div style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{m.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.cor,marginTop:2}}>{m.valor}</div>
          </div>
        ))}
        <input type="text" placeholder="Buscar placa, cliente ou OS..." value={busca} onChange={e=>setBusca(e.target.value)} style={{flex:"1 1 200px",padding:"10px 14px",borderRadius:8,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",alignItems:"flex-start",paddingBottom:12}}>
        {(Object.keys(COLS) as StatusOS[]).filter(s=>s!=="CANCELADO").map(col=>{
          const cards=filtradas.filter(o=>o.status===col);
          const {label,cor,bg}=COLS[col];
          return(
            <div key={col} style={{minWidth:230,flex:"0 0 230px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:cor}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>{label}</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:20,background:bg,color:cor}}>{cards.length}</span>
              </div>
              <div style={{minHeight:60}}>
                {cards.length===0?<div style={{padding:16,textAlign:"center",color:"#d1d5db",fontSize:12,border:"1.5px dashed #e5e7eb",borderRadius:10}}>Nenhuma OS</div>:cards.map(os=><CardOS key={os.id} os={os} onAvancar={avancar}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba Social ────────────────────────────────────────────────
function AbaSocial() {
  const [posts,setPosts] = useState<SocialPost[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("social_posts").select("*").order("created_at",{ascending:false}).limit(50).then(({data})=>{if(data)setPosts(data);setLoading(false);});
  },[]);

  const STATUS_CORES: Record<string,{cor:string;bg:string;label:string}> = {
    RASCUNHO:{cor:"#6b7280",bg:"#f9fafb",label:"Rascunho"},
    AGUARDANDO_APROVACAO:{cor:"#f59e0b",bg:"#fffbeb",label:"Aguardando"},
    APROVADO:{cor:"#3b82f6",bg:"#eff6ff",label:"Aprovado"},
    PUBLICADO:{cor:"#10b981",bg:"#ecfdf5",label:"Publicado"},
    REJEITADO:{cor:"#ef4444",bg:"#fef2f2",label:"Rejeitado"},
  };

  const publicados = posts.filter(p=>p.status==="PUBLICADO").length;
  const pendentes = posts.filter(p=>p.status==="AGUARDANDO_APROVACAO").length;

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
        {[{label:"Publicados",valor:publicados,cor:"#10b981"},{label:"Aguardando aprovação",valor:pendentes,cor:"#f59e0b"},{label:"Total de posts",valor:posts.length,cor:"#6366f1"}].map(m=>(
          <div key={m.label} style={{flex:"1 1 160px",padding:"12px 16px",borderRadius:10,border:`1px solid ${m.cor}22`,background:`${m.cor}08`}}>
            <div style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{m.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.cor,marginTop:2}}>{m.valor}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"14px 16px",marginBottom:20,fontSize:13,color:"#92400e"}}>
        💡 <strong>Como usar:</strong> Mande uma foto ou vídeo no WhatsApp da oficina. A IA analisa, gera legenda e hashtags, e envia a prévia para você aprovar antes de publicar.
      </div>

      {loading?<div style={{textAlign:"center",color:"#9ca3af",padding:40}}>Carregando...</div>:(
        posts.length===0?(
          <div style={{textAlign:"center",padding:60,color:"#9ca3af"}}>
            <div style={{fontSize:40,marginBottom:12}}>📱</div>
            <div style={{fontWeight:600,marginBottom:6}}>Nenhum post ainda</div>
            <div style={{fontSize:13}}>Mande uma foto no WhatsApp com #post para começar</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
            {posts.map(p=>{
              const sc = STATUS_CORES[p.status]||STATUS_CORES.RASCUNHO;
              return(
                <div key={p.id} style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  {p.midia_url&&<div style={{height:180,background:"#f3f4f6",overflow:"hidden",position:"relative"}}>
                    <img src={p.midia_url} alt="post" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                    <div style={{position:"absolute",top:8,right:8}}>
                      <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,background:sc.bg,color:sc.cor}}>{sc.label}</span>
                    </div>
                    <div style={{position:"absolute",top:8,left:8}}>
                      <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,background:"rgba(0,0,0,0.6)",color:"#fff"}}>{p.tipo?.toUpperCase()}</span>
                    </div>
                  </div>}
                  <div style={{padding:"14px 16px"}}>
                    <p style={{fontSize:13,color:"#374151",lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {p.legenda_final||p.legenda_ia||"Sem legenda"}
                    </p>
                    {p.instagram_post_id&&<div style={{fontSize:11,color:"#10b981"}}>✅ Instagram</div>}
                    {p.facebook_post_id&&<div style={{fontSize:11,color:"#3b82f6"}}>✅ Facebook</div>}
                    <div style={{fontSize:11,color:"#9ca3af",marginTop:8}}>{new Date(p.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ── Aba Financeiro ────────────────────────────────────────────
function AbaFinanceiro() {
  const [trans,setTrans] = useState<Transacao[]>([]);
  const [loading,setLoading] = useState(true);
  const [filtro,setFiltro] = useState<"tudo"|"ENTRADA"|"SAIDA">("tudo");

  useEffect(()=>{
    supabase.from("fluxo_caixa").select("*").order("data_competencia",{ascending:false}).limit(200).then(({data})=>{if(data)setTrans(data);setLoading(false);});
  },[]);

  const filtradas = filtro==="tudo"?trans:trans.filter(t=>t.tipo===filtro);
  const totalEntrada = trans.filter(t=>t.tipo==="ENTRADA").reduce((a,t)=>a+t.valor,0);
  const totalSaida = trans.filter(t=>t.tipo==="SAIDA").reduce((a,t)=>a+t.valor,0);
  const saldo = totalEntrada - totalSaida;

  const hoje = new Date().toDateString();
  const entradaHoje = trans.filter(t=>t.tipo==="ENTRADA"&&new Date(t.data_competencia).toDateString()===hoje).reduce((a,t)=>a+t.valor,0);

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
        {[
          {label:"Saldo total",valor:moeda(saldo),cor:saldo>=0?"#10b981":"#ef4444"},
          {label:"Total entradas",valor:moeda(totalEntrada),cor:"#10b981"},
          {label:"Total saídas",valor:moeda(totalSaida),cor:"#ef4444"},
          {label:"Receita hoje",valor:moeda(entradaHoje),cor:"#6366f1"},
        ].map(m=>(
          <div key={m.label} style={{flex:"1 1 160px",padding:"12px 16px",borderRadius:10,border:`1px solid ${m.cor}22`,background:`${m.cor}08`}}>
            <div style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{m.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:m.cor,marginTop:2}}>{m.valor}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {(["tudo","ENTRADA","SAIDA"] as const).map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{padding:"6px 16px",borderRadius:20,border:"1px solid #e5e7eb",background:filtro===f?"#111827":"#fff",color:filtro===f?"#fff":"#374151",fontSize:13,fontWeight:500,cursor:"pointer"}}>
            {f==="tudo"?"Tudo":f==="ENTRADA"?"Entradas":"Saídas"}
          </button>
        ))}
      </div>
      {loading?<div style={{textAlign:"center",color:"#9ca3af",padding:40}}>Carregando...</div>:(
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#f9fafb"}}>
              {["Data","Descrição","Categoria","Tipo","Valor"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:"#6b7280",borderBottom:"1px solid #e5e7eb"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtradas.length===0?<tr><td colSpan={5} style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Nenhuma transação</td></tr>:
              filtradas.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                  <td style={{padding:"10px 16px",fontSize:13,color:"#6b7280"}}>{new Date(t.data_competencia+"T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td style={{padding:"10px 16px",fontSize:13,color:"#111827"}}>{t.descricao}</td>
                  <td style={{padding:"10px 16px",fontSize:12}}><span style={{padding:"2px 8px",borderRadius:20,background:"#f3f4f6",color:"#6b7280"}}>{t.categoria}</span></td>
                  <td style={{padding:"10px 16px",fontSize:12}}><span style={{padding:"2px 8px",borderRadius:20,background:t.tipo==="ENTRADA"?"#ecfdf5":"#fef2f2",color:t.tipo==="ENTRADA"?"#059669":"#dc2626",fontWeight:600}}>{t.tipo}</span></td>
                  <td style={{padding:"10px 16px",fontSize:13,fontWeight:700,color:t.tipo==="ENTRADA"?"#059669":"#dc2626"}}>{t.tipo==="SAIDA"?"-":""}{moeda(t.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Aba Clientes ──────────────────────────────────────────────
function AbaClientes() {
  const [clientes,setClientes] = useState<Cliente[]>([]);
  const [busca,setBusca] = useState("");
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("clientes").select("*").order("ultima_visita",{ascending:false,nullsFirst:false}).limit(200).then(({data})=>{if(data)setClientes(data);setLoading(false);});
  },[]);

  const filtrados = busca.trim()?clientes.filter(c=>c.nome.toLowerCase().includes(busca.toLowerCase())||c.telefone.includes(busca)):clientes;

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 160px",padding:"12px 16px",borderRadius:10,border:"1px solid #6366f122",background:"#6366f108"}}>
          <div style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Total de clientes</div>
          <div style={{fontSize:24,fontWeight:700,color:"#6366f1",marginTop:2}}>{clientes.length}</div>
        </div>
        <div style={{flex:"1 1 160px",padding:"12px 16px",borderRadius:10,border:"1px solid #10b98122",background:"#10b98108"}}>
          <div style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Ticket médio geral</div>
          <div style={{fontSize:24,fontWeight:700,color:"#10b981",marginTop:2}}>{moeda(clientes.reduce((a,c)=>a+c.ticket_medio,0)/Math.max(clientes.length,1))}</div>
        </div>
        <input type="text" placeholder="Buscar cliente ou telefone..." value={busca} onChange={e=>setBusca(e.target.value)} style={{flex:"1 1 200px",padding:"10px 14px",borderRadius:8,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
      </div>
      {loading?<div style={{textAlign:"center",color:"#9ca3af",padding:40}}>Carregando...</div>:(
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#f9fafb"}}>
              {["Nome","Telefone","Total OS","Ticket Médio","Última visita"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:12,fontWeight:600,color:"#6b7280",borderBottom:"1px solid #e5e7eb"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtrados.length===0?<tr><td colSpan={5} style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Nenhum cliente encontrado</td></tr>:
              filtrados.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                  <td style={{padding:"10px 16px",fontSize:13,fontWeight:500,color:"#111827"}}>{c.nome}</td>
                  <td style={{padding:"10px 16px",fontSize:13,color:"#6b7280"}}>{c.telefone}</td>
                  <td style={{padding:"10px 16px",fontSize:13,color:"#374151",textAlign:"center"}}>{c.total_os}</td>
                  <td style={{padding:"10px 16px",fontSize:13,fontWeight:600,color:"#059669"}}>{moeda(c.ticket_medio)}</td>
                  <td style={{padding:"10px 16px",fontSize:12,color:"#9ca3af"}}>{c.ultima_visita?new Date(c.ultima_visita).toLocaleDateString("pt-BR"):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Aba Configurações ─────────────────────────────────────────
function AbaConfig() {
  const [tenant,setTenant] = useState<Tenant|null>(null);
  const [form,setForm] = useState({nome_oficina:"",telefone:"",telefone_dono:"",meta_page_id:"",meta_access_token:"",instagram_id:"",vagas_simultaneas:5});
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);

  useEffect(()=>{
    supabase.from("tenants").select("*").eq("id","process.env.NEXT_PUBLIC_TENANT_ID || "a1b2c3d4-0000-0000-0000-000000000001"").single().then(({data})=>{
      if(data){setTenant(data);setForm({nome_oficina:data.nome_oficina||"",telefone:data.telefone||"",telefone_dono:data.telefone_dono||"",meta_page_id:data.meta_page_id||"",meta_access_token:data.meta_access_token||"",instagram_id:data.instagram_id||"",vagas_simultaneas:data.vagas_simultaneas||5});}
    });
  },[]);

  const salvar=async()=>{
    setSaving(true);
    await supabase.from("tenants").update(form).eq("id","process.env.NEXT_PUBLIC_TENANT_ID || "a1b2c3d4-0000-0000-0000-000000000001"");
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const inp=(label:string,key:keyof typeof form,type="text",placeholder="")=>(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>{label}</label>
      <input type={type} value={String(form[key])} onChange={e=>setForm({...form,[key]:type==="number"?Number(e.target.value):e.target.value})} placeholder={placeholder} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e5e7eb",fontSize:14,outline:"none",background:"#fafafa"}}/>
    </div>
  );

  return (
    <div style={{maxWidth:700}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:24,marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:20}}>🏪 Dados da Oficina</h3>
        {inp("Nome da oficina","nome_oficina","text","Ex: Auto Mecânica Silva")}
        {inp("Telefone","telefone","text","Ex: 61999990000")}
        {inp("Telefone do dono (WhatsApp)","telefone_dono","text","Ex: 61999990000")}
        {inp("Vagas simultâneas no pátio","vagas_simultaneas","number","5")}
      </div>

      <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:24,marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:8}}>📱 Redes Sociais (Instagram & Facebook)</h3>
        <div style={{background:"#eff6ff",borderRadius:8,padding:12,marginBottom:20,fontSize:13,color:"#1d4ed8",lineHeight:1.6}}>
          <strong>Como configurar:</strong><br/>
          1. Acesse <strong>business.facebook.com</strong> e crie uma Página<br/>
          2. Vá em <strong>Configurações → Acesso à API</strong><br/>
          3. Gere um Token de Acesso Permanente para a Página<br/>
          4. Cole o Page ID e o Token abaixo<br/>
          5. Para o Instagram, vincule ao Facebook Business e copie o Instagram Account ID
        </div>
        {inp("Facebook Page ID","meta_page_id","text","Ex: 123456789012345")}
        {inp("Meta Access Token (Facebook + Instagram)","meta_access_token","text","EAAxxxxx...")}
        {inp("Instagram Account ID","instagram_id","text","Ex: 17841400000000000")}
      </div>

      <button onClick={salvar} disabled={saving} style={{width:"100%",padding:"14px",background:saved?"#10b981":saving?"#9ca3af":"#111827",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:saving?"not-allowed":"pointer",transition:"background .2s"}}>
        {saved?"✅ Salvo!":saving?"Salvando...":"Salvar configurações"}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════

// ── Aba Agendamentos ──────────────────────────────────────────
function AbaAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("agendamentos")
      .select("*")
      .order("data_agendamento", { ascending: true })
      .limit(50)
      .then(({ data }) => { setAgendamentos(data||[]); setLoading(false); });
  }, []);

  const statusColor: Record<string,string> = {
    PENDENTE: "#f59e0b", CONFIRMADO: "#22c55e", CANCELADO: "#ef4444",
    CONCLUIDO: "#6366f1", REAGENDADO: "#8b5cf6"
  };

  if(loading) return <div style={{textAlign:"center",padding:40,color:"#9ca3af"}}>Carregando...</div>;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        {[
          {label:"Total",val:agendamentos.length,color:"#6366f1"},
          {label:"Confirmados",val:agendamentos.filter(a=>a.status==="CONFIRMADO").length,color:"#22c55e"},
          {label:"Pendentes",val:agendamentos.filter(a=>a.status==="PENDENTE").length,color:"#f59e0b"},
          {label:"Hoje",val:agendamentos.filter(a=>a.data_agendamento?.startsWith(new Date().toISOString().split("T")[0])).length,color:"#ec4899"},
        ].map(m=>(
          <div key={m.label} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"16px 14px",textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:m.color}}>{m.val}</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:600,fontSize:14}}>📅 Próximos agendamentos</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f9fafb"}}>
              {["Cliente","Telefone","Serviço","Data","Horário","Status"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {agendamentos.length===0?(
                <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#9ca3af"}}>Nenhum agendamento ainda</td></tr>
              ):agendamentos.slice(0,20).map(a=>(
                <tr key={a.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"12px 14px",fontWeight:600}}>{a.nome_cliente||"—"}</td>
                  <td style={{padding:"12px 14px",color:"#6b7280"}}>{a.telefone_cliente||"—"}</td>
                  <td style={{padding:"12px 14px"}}>{a.servico||"—"}</td>
                  <td style={{padding:"12px 14px",color:"#6b7280"}}>{a.data_agendamento?new Date(a.data_agendamento+"T12:00").toLocaleDateString("pt-BR"):"—"}</td>
                  <td style={{padding:"12px 14px",color:"#6b7280"}}>{a.horario||"—"}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{padding:"3px 9px",borderRadius:100,fontSize:11,fontWeight:700,background:`${statusColor[a.status||"PENDENTE"]}18`,color:statusColor[a.status||"PENDENTE"]}}>
                      {a.status||"PENDENTE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Aba NPS ──────────────────────────────────────────────────
function AbaNPS() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("avaliacoes_nps")
      .select("*")
      .eq("respondido", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setAvaliacoes(data||[]); setLoading(false); });
  }, []);

  const media = avaliacoes.length ? 
    (avaliacoes.reduce((a,n)=>a+(n.nota||0),0)/avaliacoes.length).toFixed(1) : "—";
  const promotores = avaliacoes.filter(a=>a.nota>=9).length;
  const detratores = avaliacoes.filter(a=>a.nota<=6).length;
  const npsScore = avaliacoes.length ? 
    Math.round(((promotores-detratores)/avaliacoes.length)*100) : 0;

  if(loading) return <div style={{textAlign:"center",padding:40,color:"#9ca3af"}}>Carregando...</div>;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        {[
          {label:"Nota média",val:media,color:"#22c55e"},
          {label:"NPS Score",val:npsScore,color:"#6366f1"},
          {label:"Promotores",val:promotores,color:"#22c55e"},
          {label:"Detratores",val:detratores,color:"#ef4444"},
        ].map(m=>(
          <div key={m.label} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"16px 14px",textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:m.color}}>{m.val}</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6"}}>
          <span style={{fontWeight:600,fontSize:14}}>⭐ Avaliações recentes</span>
        </div>
        {avaliacoes.length===0?(
          <div style={{textAlign:"center",padding:32,color:"#9ca3af"}}>Nenhuma avaliação ainda — o NPS é enviado automaticamente 72h após a conclusão da OS</div>
        ):avaliacoes.slice(0,15).map(a=>(
          <div key={a.id} style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"flex-start",gap:14}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:a.nota>=9?"#dcfce7":a.nota>=7?"#fef9c3":"#fee2e2",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,fontWeight:800,color:a.nota>=9?"#16a34a":a.nota>=7?"#ca8a04":"#dc2626",flexShrink:0}}>
              {a.nota}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{a.nome_cliente||"Cliente"}</div>
              {a.comentario&&<div style={{fontSize:13,color:"#6b7280",fontStyle:"italic"}}>"{a.comentario}"</div>}
              <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{new Date(a.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function Dashboard() {
  const [aba,setAba] = useState<Aba>("kanban");

  const ABAS: {id:Aba;label:string;icon:string}[] = [
    {id:"kanban",label:"Ordens de Serviço",icon:"🔧"},
    {id:"social",label:"Redes Sociais",icon:"📱"},
    {id:"financeiro",label:"Financeiro",icon:"💰"},
    {id:"clientes",label:"Clientes",icon:"👤"},
    {id:"config",label:"Configurações",icon:"⚙️"},
  ];

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f9fafb",minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🔧</span>
          <span style={{fontSize:16,fontWeight:700,color:"#111827"}}>Mecani<span style={{color:"#6366f1"}}>.AI</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
          <span style={{fontSize:12,color:"#6b7280"}}>Sistema ativo</span>
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 56px)"}}>
        {/* Sidebar */}
        <div style={{width:220,background:"#fff",borderRight:"1px solid #e5e7eb",padding:"16px 12px",flexShrink:0}}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:aba===a.id?"#f3f4f6":"transparent",color:aba===a.id?"#111827":"#6b7280",fontSize:13,fontWeight:aba===a.id?600:400,cursor:"pointer",marginBottom:4,textAlign:"left",transition:"all .15s"}}>
              <span style={{fontSize:16}}>{a.icon}</span>{a.label}
            </button>
          ))}
          <div style={{marginTop:"auto",borderTop:"1px solid #f3f4f6",paddingTop:16,marginTop:24}}>
            <div style={{fontSize:11,color:"#d1d5db",textAlign:"center"}}>Mecani.AI v2.0</div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
          <div style={{marginBottom:20}}>
            <h1 style={{fontSize:20,fontWeight:700,color:"#111827"}}>{ABAS.find(a=>a.id===aba)?.icon} {ABAS.find(a=>a.id===aba)?.label}</h1>
          </div>
          {aba==="kanban"&&<AbaKanban/>}
          {aba==="social"&&<AbaSocial/>}
          {aba==="financeiro"&&<AbaFinanceiro/>}
          {aba==="clientes"&&<AbaClientes/>}
          {aba==="agendamentos"&&<AbaAgendamentos/>}
          {aba==="nps"&&<AbaNPS/>}
          {aba==="config"&&<AbaConfig/>}
        </div>
      </div>
    </div>
  );
}
