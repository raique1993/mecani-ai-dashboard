"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StatusOS = "EM_DIAGNOSTICO"|"AGUARDANDO_APROVACAO"|"EM_EXECUCAO"|"AGUARDANDO_PECA"|"CONCLUIDO"|"CANCELADO";

interface OS {
  id: string; numero_os: number; placa_veiculo: string;
  modelo_veiculo: string|null; nome_cliente: string;
  telefone_cliente: string; relato_inicial: string|null;
  status: StatusOS; valor_total: number|null; created_at: string;
}

const COLUNAS = [
  { status: "EM_DIAGNOSTICO" as StatusOS, label: "Diagnóstico", cor: "#6366f1", bg: "#eef2ff" },
  { status: "AGUARDANDO_APROVACAO" as StatusOS, label: "Ag. Aprovação", cor: "#f59e0b", bg: "#fffbeb" },
  { status: "EM_EXECUCAO" as StatusOS, label: "Em Execução", cor: "#10b981", bg: "#ecfdf5" },
  { status: "AGUARDANDO_PECA" as StatusOS, label: "Ag. Peça", cor: "#ef4444", bg: "#fef2f2" },
  { status: "CONCLUIDO" as StatusOS, label: "Concluído", cor: "#8b5cf6", bg: "#f5f3ff" },
];

const PROXIMO: Partial<Record<StatusOS, StatusOS>> = {
  EM_DIAGNOSTICO: "AGUARDANDO_APROVACAO",
  AGUARDANDO_APROVACAO: "EM_EXECUCAO",
  EM_EXECUCAO: "CONCLUIDO",
  AGUARDANDO_PECA: "EM_EXECUCAO",
};

function Card({ os, onAvancar }: { os: OS; onAvancar: (id: string, s: StatusOS) => void }) {
  const [open, setOpen] = useState(false);
  const tempo = Math.floor((Date.now() - new Date(os.created_at).getTime()) / 3600000);
  const prox = PROXIMO[os.status];
  return (
    <div onClick={() => setOpen(!open)} style={{ background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", padding:"12px 14px", marginBottom:8, cursor:"pointer", boxShadow: open?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:1 }}>OS #{os.numero_os}</div>
          <div style={{ fontSize:14, fontWeight:600, color:"#111827", marginTop:2 }}>{os.placa_veiculo}</div>
        </div>
        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: tempo>24?"#fee2e2":"#f3f4f6", color: tempo>24?"#dc2626":"#6b7280", fontWeight:600 }}>{tempo}h</span>
      </div>
      <div style={{ fontSize:12, color:"#4b5563" }}>{os.modelo_veiculo ?? "Veículo não informado"}</div>
      <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{os.nome_cliente}</div>
      {open && (
        <div style={{ marginTop:10, borderTop:"1px solid #f3f4f6", paddingTop:10 }}>
          {os.relato_inicial && <p style={{ fontSize:12, color:"#374151", marginBottom:8 }}>{os.relato_inicial}</p>}
          <div style={{ fontSize:11, color:"#9ca3af" }}>📞 {os.telefone_cliente}</div>
          {os.valor_total && os.valor_total > 0 && (
            <div style={{ fontSize:13, fontWeight:700, color:"#059669", marginTop:4 }}>R$ {os.valor_total.toFixed(2).replace(".",",")}</div>
          )}
          {prox && (
            <button onClick={(e) => { e.stopPropagation(); onAvancar(os.id, prox); }}
              style={{ marginTop:10, width:"100%", padding:"7px 0", background:"#111827", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Avançar →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    const { data } = await supabase.from("ordens_servico").select("*").not("status","in",'("CANCELADO")').order("created_at",{ascending:false}).limit(200);
    if (data) setOrdens(data);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    const canal = supabase.channel("os-rt").on("postgres_changes",{event:"*",schema:"public",table:"ordens_servico"},()=>carregar()).subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const avancar = async (id: string, status: StatusOS) => {
    await supabase.from("ordens_servico").update({ status, ...(status==="CONCLUIDO"?{concluido_at:new Date().toISOString()}:{}) }).eq("id",id);
  };

  const filtradas = busca.trim() ? ordens.filter(o =>
    o.placa_veiculo.toLowerCase().includes(busca.toLowerCase()) ||
    o.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
    String(o.numero_os).includes(busca)
  ) : ordens;

  const totalAberto = ordens.filter(o => o.status !== "CONCLUIDO").length;
  const totalHoje = ordens.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const receitaHoje = ordens.filter(o => o.status==="CONCLUIDO" && new Date(o.created_at).toDateString()===new Date().toDateString()).reduce((a,o)=>a+(o.valor_total??0),0);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <div style={{ textAlign:"center", color:"#6b7280" }}><div style={{ fontSize:32 }}>🔧</div><div>Carregando Mecani.AI...</div></div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f9fafb", minHeight:"100vh" }}>
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🔧</span>
          <span style={{ fontSize:16, fontWeight:700, color:"#111827" }}>Mecani.AI</span>
        </div>
        <input type="text" placeholder="Buscar placa, cliente ou OS..." value={busca} onChange={e=>setBusca(e.target.value)}
          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:13, width:260, outline:"none" }} />
      </div>
      <div style={{ display:"flex", gap:12, padding:"16px 24px", borderBottom:"1px solid #e5e7eb", background:"#fff" }}>
        {[{label:"Em aberto",valor:totalAberto,cor:"#6366f1"},{label:"Entradas hoje",valor:totalHoje,cor:"#10b981"},{label:"Receita hoje",valor:"R$ "+receitaHoje.toFixed(2).replace(".",","),cor:"#f59e0b"}].map(m=>(
          <div key={m.label} style={{ flex:1, padding:"10px 16px", borderRadius:8, border:"1px solid "+m.cor+"22", background:m.cor+"08" }}>
            <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:m.cor, marginTop:2 }}>{m.valor}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, padding:20, overflowX:"auto", alignItems:"flex-start", minHeight:"calc(100vh - 130px)" }}>
        {COLUNAS.map(col => {
          const cards = filtradas.filter(o => o.status === col.status);
          return (
            <div key={col.status} style={{ minWidth:240, flex:"0 0 240px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:col.cor }} />
                  <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{col.label}</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20, background:col.bg, color:col.cor }}>{cards.length}</span>
              </div>
              <div style={{ minHeight:80 }}>
                {cards.length===0
                  ? <div style={{ padding:20, textAlign:"center", color:"#d1d5db", fontSize:12, border:"1.5px dashed #e5e7eb", borderRadius:10 }}>Nenhuma OS</div>
                  : cards.map(os => <Card key={os.id} os={os} onAvancar={avancar} />)
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}