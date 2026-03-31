import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './supabase';

// ── Product index (loaded from Supabase) ─────────────────
let PR = [];
let PRMAP = {};
let CATS = ['ทั้งหมด'];
let CAT_LIST = [];

function buildProductIndex(products) {
  PR = products;
  PRMAP = {};
  PR.forEach(p => { PRMAP[p[0]] = {sku:p[0],name:p[1],cat:p[2],sell:p[3],cost:p[4]}; });
  CATS = ['ทั้งหมด',...Array.from(new Set(PR.map(p=>p[2]))).sort()];
  CAT_LIST = Array.from(new Set(PR.map(p=>p[2]))).sort();
}

const VAT_RATE = 0.07;



const fmt   = n => Math.round(n).toLocaleString('th-TH');
const fmtD  = n => Number(n).toFixed(2);
const fmtP  = n => Number(n).toFixed(1)+'%';
const thDT  = d => new Date(d).toLocaleString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

function statType(q,s){ return q===0?'out':q<=s?'low':'ok'; }
function statLabel(t){ return t==='out'?'❌ หมดสต็อก':t==='low'?'⚠️ ใกล้หมด':'✅ ปกติ'; }

// ── Design tokens ────────────────────────────────────────
const T = {
  // Santi Panich Brand Colors
  dark:'#B01020',    // Primary Red (brand)
  mid: '#C8102E',    // Brand Red
  light:'#FFF5F5',   // Red tint bg
  gold:'#B8860B', goldLight:'#FDF6E3',
  green:'#16A34A', greenLight:'#DCFCE7',
  red:'#C8102E',   redLight:'#FEE2E2',
  amber:'#D97706', amberLight:'#FEF3C7',
  blue:'#1D4ED8',  blueLight:'#DBEAFE',
  gray:'#6B7280',  grayLight:'#F9FAFB',
  border:'#E5E7EB', borderDark:'#D1D5DB',
  white:'#FFFFFF',  bg:'#FAFAFA',
  text:'#1A1A1A',   textMuted:'#6B7280',
  radius:6, radiusLg:10, radiusFull:9999,
};

const S = {
  wrap:{ maxWidth:1200,margin:'0 auto',padding:'0 8px 70px',fontFamily:"'IBM Plex Sans Thai','Noto Sans Thai','Helvetica Neue',Arial,sans-serif",fontSize:13,color:T.text,background:T.bg,minHeight:'100vh' },
  hdr:{ background:T.dark,color:'#FFFFFF',padding:'0 20px',borderRadius:0,marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 12px rgba(176,16,32,0.25)',height:56,position:'sticky',top:0,zIndex:100 },
  nav:{ display:'flex',gap:2,marginBottom:16,marginTop:8,flexWrap:'wrap',padding:'4px',background:T.white,borderRadius:T.radius,border:`1px solid ${T.border}`,boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
  card:{ background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,padding:'12px 14px',marginBottom:10,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle:{ fontWeight:700,fontSize:12,color:'#1A1A1A',marginBottom:12,display:'flex',alignItems:'center',gap:8,textTransform:'uppercase',letterSpacing:'0.06em',borderLeft:'3px solid #C8102E',paddingLeft:8 },
  kgrid:{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,marginBottom:12 },
  inp:{ padding:'8px 11px',border:`1.5px solid ${T.borderDark}`,borderRadius:T.radius,fontSize:13,outline:'none',background:T.white,color:T.text,transition:'border-color 0.15s',fontFamily:'inherit' },
  tbl:{ width:'100%',borderCollapse:'separate',borderSpacing:0,fontSize:12 },
  th:{ background:'#C8102E',color:'#FFFFFF',padding:'9px 10px',textAlign:'left',fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase' },
  thFirst:{ borderRadius:'4px 0 0 0' }, thLast:{ borderRadius:'0 4px 0 0' },
  tow:{ overflowX:'auto',borderRadius:T.radius,border:`1px solid ${T.border}` },
  row:{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' },
};

const btn=(v='dk',ex={})=>{
  const m={
    dk:{ bg:'#1A1A1A',fg:'#FFFFFF',hov:'#333' },
    bl:{ bg:'#1A5276',fg:'#fff',hov:'#154360' },
    gr:{ bg:'#16A34A',fg:'#fff',hov:'#15803d' },
    rd:{ bg:T.red,fg:'#fff',hov:'#A00C1E' },
    gy:{ bg:'#E5E7EB',fg:'#374151',hov:'#D1D5DB' },
    am:{ bg:T.amber,fg:'#fff',hov:'#b45309' },
    gl:{ bg:T.gold,fg:'#fff',hov:'#a07218' },
    brand:{ bg:T.dark,fg:'#fff',hov:T.mid },
    out:{ bg:'transparent',fg:'#1A1A1A',hov:'#f5f5f5',border:'1px solid #1A1A1A' },
  };
  const s=m[v]||m.dk;
  return { padding:'8px 16px',background:s.bg,color:s.fg,border:s.border||'none',borderRadius:T.radius,fontWeight:500,cursor:'pointer',fontSize:13,fontFamily:'inherit',...ex };
};
const nbtn=a=>({ padding:'8px 14px',borderRadius:T.radius,border:'none',background:a?'#1A1A1A':'transparent',color:a?'#FFFFFF':T.textMuted,fontWeight:a?700:400,cursor:'pointer',fontSize:12,fontFamily:'inherit',transition:'all 0.15s',letterSpacing:a?'0.04em':'0' });
const tdr=i=>({ padding:'8px 10px',borderBottom:`1px solid ${T.border}`,background:i%2===0?'#FAFAFA':'#FFFFFF',fontSize:12 });
const bdg=t=>t==='out'
  ?{ background:'#FEE2E2',color:'#C8102E',borderRadius:2,padding:'2px 8px',fontSize:10,fontWeight:700,display:'inline-block',whiteSpace:'nowrap',letterSpacing:'0.04em',textTransform:'uppercase' }
  :t==='low'
  ?{ background:'#FEF3C7',color:'#B45309',borderRadius:2,padding:'2px 8px',fontSize:10,fontWeight:700,display:'inline-block',whiteSpace:'nowrap',letterSpacing:'0.04em',textTransform:'uppercase' }
  :{ background:'#DCFCE7',color:'#15803D',borderRadius:2,padding:'2px 8px',fontSize:10,fontWeight:700,display:'inline-block',whiteSpace:'nowrap',letterSpacing:'0.04em',textTransform:'uppercase' };

// ── KPI Card ──────────────────────────────────────────────
function KPI({label,value,sub,color=T.dark,bg=T.grayLight,icon}){
  return (
    <div style={{...S.card,padding:'14px 16px',marginBottom:0,background:bg,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:4,display:'flex',alignItems:'center',gap:4}}>{icon&&<span>{icon}</span>}{label}</div>
      <div style={{fontSize:22,fontWeight:700,color,lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:T.textMuted,marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function BarChart({data,vk,lk,color=T.dark,h=140}){
  const max=Math.max(...data.map(d=>d[vk]),1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:h,paddingTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <div style={{fontSize:9,color:T.textMuted,textAlign:'center'}}>{fmt(d[vk])}</div>
          <div style={{width:'100%',background:color,borderRadius:'4px 4px 0 0',height:Math.max((d[vk]/max)*(h-28),2),transition:'height 0.4s ease'}}/>
          <div style={{fontSize:9,color:T.textMuted,textAlign:'center',maxWidth:52,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d[lk]}</div>
        </div>
      ))}
    </div>
  );
}

// ── XLSX helpers ──────────────────────────────────────────
function useXLSX(){
  const [ok,setOk]=useState(!!window.XLSX);
  useEffect(()=>{
    if(window.XLSX){setOk(true);return;}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=()=>setOk(true); document.head.appendChild(s);
  },[]);
  return ok;
}
function exportXLSX(filename,sheets){
  const wb=window.XLSX.utils.book_new();
  sheets.forEach(({name,data,headers})=>{
    const ws=window.XLSX.utils.aoa_to_sheet([headers,...data]);
    ws['!cols']=headers.map(h=>({wch:Math.max(h.length*1.8,12)}));
    // Style header row
    const range=window.XLSX.utils.decode_range(ws['!ref']);
    for(let c=range.s.c;c<=range.e.c;c++){
      const cell=ws[window.XLSX.utils.encode_cell({r:0,c})];
      if(cell){ cell.s={fill:{fgColor:{rgb:'1B3A2D'}},font:{color:{rgb:'EFF7F3'},bold:true}}; }
    }
    window.XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));
  });
  window.XLSX.writeFile(wb,filename);
}

// ── Customer Search ───────────────────────────────────────
function CustomerSearch({value,onSelect}){
  const [q,setQ]=useState(''); const [res,setRes]=useState([]); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(false); const timer=useRef();
  const search=async text=>{
    if(!text.trim()){setRes([]);return;}
    setLoading(true);
    const {data}=await supabase.from('customers').select('customer_id,name,contact_phone').or(`name.ilike.%${text}%,customer_id.ilike.%${text}%,contact_phone.ilike.%${text}%`).limit(10);
    setRes(data||[]); setLoading(false);
  };
  return (
    <div style={{position:'relative',flex:1,minWidth:180}}>
      <input style={{...S.inp,width:'100%'}} placeholder="ค้นหาชื่อลูกค้า / รหัส / เบอร์" value={q}
        onChange={e=>{setQ(e.target.value);setOpen(true);clearTimeout(timer.current);timer.current=setTimeout(()=>search(e.target.value),400);}}
        onFocus={()=>q&&setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)}/>
      {open&&(res.length>0||loading)&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,zIndex:200,maxHeight:220,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
          {loading&&<div style={{padding:'10px 14px',color:T.textMuted,fontSize:12}}>กำลังค้นหา...</div>}
          {res.map(c=>(
            <div key={c.customer_id} style={{padding:'9px 14px',cursor:'pointer',borderBottom:`1px solid ${T.border}`}} onMouseDown={()=>{setQ(c.name);setOpen(false);onSelect(c);}}>
              <div style={{fontWeight:500,fontSize:13}}>{c.name}</div>
              <div style={{color:T.textMuted,fontSize:11}}>{c.customer_id}{c.contact_phone?' · '+c.contact_phone:''}</div>
            </div>
          ))}
        </div>
      )}
      {value&&<div style={{marginTop:4,fontSize:11,color:T.green,fontWeight:500}}>✓ {value.name} ({value.customer_id})</div>}
    </div>
  );
}

// ── Drag & Drop Import Zone ───────────────────────────────
function DropZone({onFile,accept,label,sublabel}){
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const handle=f=>{if(f&&onFile)onFile(f);};
  return (
    <div style={{border:`2px dashed ${drag?T.dark:T.borderDark}`,borderRadius:T.radiusLg,padding:'32px 20px',textAlign:'center',cursor:'pointer',background:drag?T.light:T.grayLight,transition:'all 0.2s'}}
      onClick={()=>ref.current.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)handle(f);}}>
      <div style={{fontSize:32,marginBottom:8}}>📂</div>
      <div style={{fontWeight:600,color:T.dark,marginBottom:4}}>{label}</div>
      <div style={{fontSize:12,color:T.textMuted}}>{sublabel}</div>
      <input ref={ref} type="file" accept={accept} style={{display:'none'}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
function Dashboard({stock,sales}){
  const xlsxOk=useXLSX();
  const m=useMemo(()=>{
    const stVal=PR.reduce((s,p)=>{const d=stock[p[0]]||{qty:0,cost:p[4]};return s+d.qty*d.cost;},0);
    const outN=PR.filter(p=>(stock[p[0]]?.qty||0)===0).length;
    const lowN=PR.filter(p=>{const d=stock[p[0]]||{qty:0,safety:10};return d.qty>0&&d.qty<=d.safety;}).length;
    const now2=new Date();
    const todS=sales.filter(s=>new Date(s.date).toDateString()===now2.toDateString());
    const monS=sales.filter(s=>{const d=new Date(s.date);return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();});
    const todRev=todS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
    const monRev=monS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
    const todCost=todS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    const monCost=monS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    return {stVal,outN,lowN,todRev,monRev,todProfit:todRev-todCost,monProfit:monRev-monCost,todTx:todS.length,monTx:monS.length};
  },[stock,sales]);

  const catSales=useMemo(()=>{
    const now2=new Date();
    const monS=sales.filter(s=>{const d=new Date(s.date);return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();});
    const map={};
    monS.forEach(t=>t.items.forEach(it=>{const cat=PRMAP[it.sku]?.cat||'อื่นๆ';if(!map[cat])map[cat]={cat,rev:0};map[cat].rev+=it.final_price||it.subtotal||0;}));
    return Object.values(map).sort((a,b)=>b.rev-a.rev).slice(0,8);
  },[sales]);

  const daily7=useMemo(()=>{
    const days=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toDateString();const dayS=sales.filter(s=>new Date(s.date).toDateString()===ds);days.push({label:d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit'}),rev:dayS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0)});}
    return days;
  },[sales]);

  const catStock=useMemo(()=>{
    const map={};
    PR.forEach(p=>{const d=stock[p[0]]||{qty:0,cost:p[4]};if(!map[p[2]])map[p[2]]={cat:p[2],items:0,val:0,out:0,low:0};map[p[2]].items++;map[p[2]].val+=d.qty*d.cost;const t=statType(d.qty,d.safety||10);if(t==='out')map[p[2]].out++;else if(t==='low')map[p[2]].low++;});
    return Object.values(map).sort((a,b)=>b.val-a.val);
  },[stock]);

  const alerts=PR.filter(p=>statType(stock[p[0]]?.qty||0,stock[p[0]]?.safety||10)!=='ok').slice(0,15);

  return (
    <div>
      <div style={{...S.row,justifyContent:'space-between',marginBottom:12}}>
        <span style={{fontWeight:600,fontSize:15,color:T.dark}}>ภาพรวมระบบ</span>
        <button style={btn('gr',{fontSize:12})} onClick={()=>xlsxOk&&exportXLSX('dashboard.xlsx',[{name:'KPI',headers:['รายการ','ค่า'],data:[['มูลค่าสต็อก',fmt(m.stVal)],['ยอดขายวันนี้',fmt(m.todRev)],['กำไรวันนี้',fmt(m.todProfit)],['ยอดขายเดือนนี้',fmt(m.monRev)],['กำไรเดือนนี้',fmt(m.monProfit)]]}])} disabled={!xlsxOk}>
          📥 Export
        </button>
      </div>
      <div style={S.kgrid}>
        <KPI label="สินค้าทั้งหมด" value={PR.length+' SKU'} icon="📦" bg={T.blueLight} color={T.blue}/>
        <KPI label="มูลค่าสต็อกรวม" value={'฿'+fmt(m.stVal)} icon="💰" bg={T.greenLight} color={T.green}/>
        <KPI label="ยอดขายวันนี้" value={'฿'+fmt(m.todRev)} sub={m.todTx+' บิล'} icon="💳" bg={T.goldLight} color={T.gold}/>
        <KPI label="กำไรวันนี้" value={'฿'+fmt(m.todProfit)} icon="📈" bg={m.todProfit>=0?T.greenLight:T.redLight} color={m.todProfit>=0?T.green:T.red}/>
        <KPI label="ยอดขายเดือนนี้" value={'฿'+fmt(m.monRev)} sub={m.monTx+' บิล'} icon="📅" bg={T.blueLight} color={T.blue}/>
        <KPI label="กำไรเดือนนี้" value={'฿'+fmt(m.monProfit)} icon="💹" bg={m.monProfit>=0?T.greenLight:T.redLight} color={m.monProfit>=0?T.green:T.red}/>
        <KPI label="หมดสต็อก" value={m.outN+' รายการ'} icon="❌" bg={T.redLight} color={T.red}/>
        <KPI label="ใกล้หมด" value={m.lowN+' รายการ'} icon="⚠️" bg={T.amberLight} color={T.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}><div style={S.cardTitle}>📊 ยอดขาย 7 วันล่าสุด</div><BarChart data={daily7} vk="rev" lk="label" color={T.dark} h={140}/></div>
        <div style={S.card}><div style={S.cardTitle}>📂 ยอดขายแยกหมวด (เดือนนี้)</div>{catSales.length===0?<div style={{textAlign:'center',color:T.textMuted,padding:24}}>ยังไม่มียอดขาย</div>:<BarChart data={catSales} vk="rev" lk="cat" color={T.mid} h={140}/>}</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>📦 สต็อกแยกหมวดหมู่</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['หมวดสินค้า','รายการ','มูลค่าสต็อก (฿)','หมดสต็อก','ใกล้หมด'].map((h,i)=><th key={i} style={{...S.th,...(i===0?S.thFirst:{}),...(i===4?S.thLast:{})}}>{h}</th>)}</tr></thead>
          <tbody>{catStock.map((c,i)=><tr key={c.cat}><td style={{...tdr(i),fontWeight:500}}>{c.cat}</td><td style={tdr(i)}>{c.items}</td><td style={tdr(i)}>฿{fmt(c.val)}</td><td style={{...tdr(i),color:c.out>0?T.red:T.textMuted}}>{c.out>0?c.out:'-'}</td><td style={{...tdr(i),color:c.low>0?T.amber:T.textMuted}}>{c.low>0?c.low:'-'}</td></tr>)}</tbody>
        </table></div>
      </div>
      {alerts.length>0&&<div style={S.card}>
        <div style={S.cardTitle}>⚠️ รายการต้องดูแล ({alerts.length})</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['SKU','ชื่อสินค้า','หมวด','สต็อก','Safety','สถานะ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{alerts.map((p,i)=>{const d=stock[p[0]]||{qty:0,safety:10};const t=statType(d.qty,d.safety);return <tr key={p[0]}>{[p[0],p[1],p[2],d.qty,d.safety].map((v,j)=><td key={j} style={tdr(i)}>{v}</td>)}<td style={tdr(i)}><span style={bdg(t)}>{statLabel(t)}</span></td></tr>;})}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// STOCK PAGE
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// LINE NOTIFY
// ════════════════════════════════════════════════════════
const LINE_TOKEN_KEY = 'line_notify_token';

async function sendLineNotify(token, message) {
  // ส่งผ่าน Supabase Edge Function หรือ proxy
  // เพราะ LINE Notify ไม่รองรับ CORS จาก browser โดยตรง
  try {
    const res = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'message=' + encodeURIComponent(message),
      mode: 'no-cors',
    });
    return true;
  } catch(e) {
    console.error('LINE Notify error:', e);
    return false;
  }
}

async function sendStockAlert(stock) {
  const token = localStorage.getItem(LINE_TOKEN_KEY);
  if (!token) return;

  const outItems = PR.filter(p => (stock[p[0]]?.qty||0) === 0);
  const lowItems = PR.filter(p => {
    const d = stock[p[0]]||{qty:0,safety:10};
    return d.qty > 0 && d.qty <= d.safety;
  });

  if (outItems.length === 0 && lowItems.length === 0) return;

  let msg = '\n🔔 แจ้งเตือนสต็อก — สันติพาณิชย์\n';
  msg += '━━━━━━━━━━━━━━━━━━━━\n';

  if (outItems.length > 0) {
    msg += `\n❌ หมดสต็อก (${outItems.length} รายการ)\n`;
    outItems.slice(0, 10).forEach(p => {
      msg += `• ${p[1]}\n`;
    });
    if (outItems.length > 10) msg += `  ...และอีก ${outItems.length-10} รายการ\n`;
  }

  if (lowItems.length > 0) {
    msg += `\n⚠️ ใกล้หมด (${lowItems.length} รายการ)\n`;
    lowItems.slice(0, 10).forEach(p => {
      const d = stock[p[0]]||{qty:0,safety:10};
      msg += `• ${p[1]} (เหลือ ${d.qty}/${d.safety})\n`;
    });
    if (lowItems.length > 10) msg += `  ...และอีก ${lowItems.length-10} รายการ\n`;
  }

  msg += '━━━━━━━━━━━━━━━━━━━━';
  await sendLineNotify(token, msg);
}

// LINE Notify Settings Component
function LineNotifySettings({stock}) {
  const [token, setToken] = useState(() => localStorage.getItem(LINE_TOKEN_KEY)||'');
  const [saved, setSaved]   = useState(!!localStorage.getItem(LINE_TOKEN_KEY));
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  const saveToken = () => {
    if (!token.trim()) {
      localStorage.removeItem(LINE_TOKEN_KEY);
      setSaved(false);
      setTestMsg('ลบ Token แล้ว');
      return;
    }
    localStorage.setItem(LINE_TOKEN_KEY, token.trim());
    setSaved(true);
    setTestMsg('✅ บันทึก Token แล้ว');
  };

  const testNotify = async () => {
    const t = localStorage.getItem(LINE_TOKEN_KEY);
    if (!t) { setTestMsg('❌ กรุณาบันทึก Token ก่อน'); return; }
    setTesting(true); setTestMsg('');
    const ok = await sendLineNotify(t,
      '\n✅ ทดสอบการแจ้งเตือน\nสันติพาณิชย์ Stock System พร้อมใช้งานแล้ว!');
    setTestMsg(ok ? '✅ ส่งสำเร็จ! ตรวจสอบ LINE ได้เลย' : '⚠️ ส่งแล้ว (LINE Notify อาจใช้เวลาสักครู่)');
    setTesting(false);
  };

  const sendAlert = async () => {
    setTesting(true); setTestMsg('');
    await sendStockAlert(stock);
    setTestMsg('✅ ส่งรายงานสต็อกไปยัง LINE แล้ว');
    setTesting(false);
  };

  const outN = PR.filter(p=>(stock[p[0]]?.qty||0)===0).length;
  const lowN = PR.filter(p=>{const d=stock[p[0]]||{qty:0,safety:10};return d.qty>0&&d.qty<=d.safety;}).length;

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>🔔 แจ้งเตือนสต็อกผ่าน LINE Notify</div>

      {/* Status */}
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <div style={{...S.kcard,flex:1,background:outN>0?T.redLight:T.greenLight}}>
          <div style={{fontSize:11,color:T.textMuted}}>❌ หมดสต็อก</div>
          <div style={{fontSize:20,fontWeight:700,color:outN>0?T.red:T.green}}>{outN} รายการ</div>
        </div>
        <div style={{...S.kcard,flex:1,background:lowN>0?T.amberLight:T.greenLight}}>
          <div style={{fontSize:11,color:T.textMuted}}>⚠️ ใกล้หมด</div>
          <div style={{fontSize:20,fontWeight:700,color:lowN>0?T.amber:T.green}}>{lowN} รายการ</div>
        </div>
      </div>

      {/* Token input */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>
          LINE Notify Token
          {saved && <span style={{marginLeft:8,color:T.green,fontSize:11}}>✅ บันทึกแล้ว</span>}
        </div>
        <div style={{display:'flex',gap:8}}>
          <input type="password" style={{...S.inp,flex:1}} placeholder="เช่น abc123xyz..."
            value={token} onChange={e=>setToken(e.target.value)}/>
          <button style={btn('dk')} onClick={saveToken}>บันทึก</button>
        </div>
      </div>

      {/* How to get token */}
      <div style={{background:T.blueLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12,fontSize:12,color:T.blue,lineHeight:1.8}}>
        <b>วิธีรับ LINE Notify Token:</b><br/>
        1. เปิด <b>line.me/th/notify</b> → Login ด้วย LINE<br/>
        2. กด <b>"Generate token"</b> → ตั้งชื่อ → เลือก group LINE ที่ต้องการรับแจ้งเตือน<br/>
        3. Copy token มาวางช่องด้านบน → กด บันทึก<br/>
        4. กด <b>ทดสอบส่ง</b> เพื่อยืนยันว่าใช้งานได้
      </div>

      {/* Action buttons */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button style={btn('gr')} onClick={testNotify} disabled={testing||!saved}>
          {testing?'กำลังส่ง...':'📤 ทดสอบส่ง'}
        </button>
        <button style={btn('am')} onClick={sendAlert} disabled={testing||!saved||(!outN&&!lowN)}>
          {testing?'กำลังส่ง...':'🔔 ส่งรายงานสต็อกตอนนี้'}
        </button>
      </div>

      {testMsg&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:T.radius,fontSize:12,
        background:testMsg.startsWith('✅')?T.greenLight:testMsg.startsWith('⚠️')?T.amberLight:T.redLight,
        color:testMsg.startsWith('✅')?T.green:testMsg.startsWith('⚠️')?T.amber:T.red,fontWeight:500}}>
        {testMsg}
      </div>}

      <div style={{marginTop:10,fontSize:11,color:T.textMuted,lineHeight:1.7}}>
        💡 Token จะถูกเก็บไว้ในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น<br/>
        แต่ละเครื่องต้องตั้งค่า Token แยกกัน หรือจะฝาก Admin ส่งแจ้งเตือนแทนก็ได้
      </div>
    </div>
  );
}


function StockPage({stock,setStock,profile}){
  const [kw,setKw]=useState('');const [cat,setCat]=useState('ทั้งหมด');const [stF,setStF]=useState('ทั้งหมด');
  const [edits,setEdits]=useState({});const [saving,setSaving]=useState(false);const [msg,setMsg]=useState('');
  const [importMsg,setImportMsg]=useState('');const [importing,setImporting]=useState(false);
  const xlsxOk=useXLSX();

  const filtered=useMemo(()=>{
    const k=kw.toLowerCase().trim();const words=k?k.split(/\s+/).filter(Boolean):[];
    return PR.filter(p=>{
      const hay=(p[0]+' '+p[1]+' '+p[2]+' '+p[3]+' '+p[4]).toLowerCase();
      const mkw=!k||words.every(w=>hay.includes(w));
      const mc=cat==='ทั้งหมด'||p[2]===cat;
      const d=stock[p[0]]||{qty:0,safety:10};const t=statType(d.qty,d.safety);
      const ms=stF==='ทั้งหมด'||(stF==='ปกติ'&&t==='ok')||(stF==='ใกล้หมด'&&t==='low')||(stF==='หมดสต็อก'&&t==='out');
      return mkw&&mc&&ms;
    });
  },[kw,cat,stF,stock]);

  const saveAll=async()=>{
    setSaving(true);setMsg('');
    const updates=Object.entries(edits).map(([sku,v])=>({sku,qty:parseInt(v.qty)||0,safety:parseInt(v.safety)||10,cost:parseFloat(v.cost)||0}));
    const {error}=await supabase.from('stock').upsert(updates,{onConflict:'sku'});
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    const ns={...stock};updates.forEach(u=>{ns[u.sku]={qty:u.qty,safety:u.safety,cost:u.cost};});
    setStock(ns);setEdits({});setMsg('✅ บันทึก '+updates.length+' รายการ');setSaving(false);
    // ส่งแจ้งเตือน LINE ถ้ามีสต็อกต่ำ
    sendStockAlert(ns);
  };

  // Export stock count template
  const exportTemplate=()=>{
    if(!xlsxOk)return;
    exportXLSX('stock_count_template.xlsx',[{
      name:'นับสต็อก',
      headers:['SKU','ชื่อสินค้า','หมวดสินค้า','ราคาทุน (ปัจจุบัน)','ราคาทุนใหม่ (แก้ได้-ว่าง=ไม่เปลี่ยน)','Safety (ปัจจุบัน)','Safety ใหม่ (แก้ได้-ว่าง=ไม่เปลี่ยน)','จำนวนที่นับได้ (ว่าง=ไม่เปลี่ยน)','หมายเหตุ'],
      data:PR.map(p=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[p[0],p[1],p[2],fmtD(d.cost),'',d.safety,'','',''];})
    }]);
  };

  // Import stock count file
  const importStockFile=async file=>{
    if(!xlsxOk||!file)return;
    setImporting(true);setImportMsg('');
    try{
      const buf=await file.arrayBuffer();
      const wb=window.XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const header=rows[0].map(h=>String(h||'').toLowerCase());
      const skuCol  = header.findIndex(h=>h.includes('sku'));
      const qtyCol  = header.findIndex(h=>h.includes('นับ')||h.includes('จำนวน')||h.includes('qty'));
      const sfCol   = header.findIndex(h=>h.includes('safety'));
      const costCol = header.findIndex(h=>h.includes('ราคาทุน')||h.includes('ต้นทุน')||h.includes('cost'));
      if(skuCol<0){setImportMsg('❌ ไม่พบคอลัมน์ SKU');setImporting(false);return;}
      if(qtyCol<0&&costCol<0){setImportMsg('❌ ไม่พบคอลัมน์จำนวน หรือราคาทุน (ต้องมีอย่างน้อย 1 อย่าง)');setImporting(false);return;}
      const updates=[];
      let updQty=0, updCost=0;
      for(let i=1;i<rows.length;i++){
        const row=rows[i];
        const sku=String(row[skuCol]||'').trim();
        if(!sku||!PRMAP[sku])continue;
        // qty — ปล่อยว่างได้ ถ้าว่างใช้ค่าเดิม
        const qtyRaw = qtyCol>=0 ? row[qtyCol] : '';
        const qty    = qtyRaw!=='' ? parseInt(qtyRaw) : (stock[sku]?.qty??0);
        if(isNaN(qty)||qty<0) continue;
        // safety stock
        const sfRaw  = sfCol>=0 ? row[sfCol] : '';
        const sf     = sfRaw!=='' ? parseInt(sfRaw) : (stock[sku]?.safety||10);
        // ราคาทุน — ปล่อยว่างได้ ถ้าว่างใช้ค่าเดิม
        const costRaw = costCol>=0 ? row[costCol] : '';
        const cost    = costRaw!=='' ? parseFloat(costRaw) : (stock[sku]?.cost||PRMAP[sku].cost);
        if(isNaN(cost)||cost<0) continue;
        if(qtyRaw!=='') updQty++;
        if(costRaw!=='') updCost++;
        updates.push({sku, qty, safety:isNaN(sf)?10:sf, cost});
      }
      if(!updates.length){setImportMsg('❌ ไม่พบข้อมูลที่ valid');setImporting(false);return;}
      const {error}=await supabase.from('stock').upsert(updates,{onConflict:'sku'});
      if(error){setImportMsg('❌ '+error.message);setImporting(false);return;}
      const ns={...stock};
      updates.forEach(u=>{ns[u.sku]={qty:u.qty,safety:u.safety,cost:u.cost};});
      setStock(ns);
      const parts=[];
      if(updQty>0)  parts.push('สต็อก '+updQty+' รายการ');
      if(updCost>0) parts.push('ราคาทุน '+updCost+' รายการ');
      setImportMsg('✅ อัพเดท '+parts.join(' · ')+' เรียบร้อย!');
    }catch(e){setImportMsg('❌ อ่านไฟล์ไม่ได้: '+e.message);}
    setImporting(false);
  };

  // Export stock report
  const exportStock=()=>{
    if(!xlsxOk)return;
    const sheets=[{name:'สต็อกทั้งหมด',headers:['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],data:PR.map((p,i)=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[i+1,p[0],p[1],p[2],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];})},
    ...CAT_LIST.map(c=>({name:c.slice(0,31),headers:['SKU','ชื่อสินค้า','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],data:PR.filter(p=>p[2]===c).map(p=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[p[0],p[1],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];})}))]
    exportXLSX('stock_report.xlsx',sheets);
  };

  return (
    <div>
      {/* Import/Export Tools */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}>
          <div style={S.cardTitle}>📥 นำเข้าข้อมูลสต็อก (ลากวางไฟล์)</div>
          <DropZone onFile={importStockFile} accept=".xlsx,.xls,.csv" label="ลากไฟล์ Excel มาวางที่นี่" sublabel="รองรับไฟล์ .xlsx .xls .csv | ดาวน์โหลด template ก่อนกรอก"/>
          {importing&&<div style={{marginTop:8,color:T.textMuted,fontSize:12}}>⏳ กำลังประมวลผล...</div>}
          {importMsg&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:importMsg.startsWith('✅')?T.greenLight:T.redLight,color:importMsg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{importMsg}</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📤 ดาวน์โหลด</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button style={{...btn('dk'),textAlign:'left'}} onClick={exportTemplate} disabled={!xlsxOk}>📋 Template นับสต็อก (กรอกแล้ว import กลับได้)</button>
            <button style={{...btn('out'),textAlign:'left'}} onClick={exportStock} disabled={!xlsxOk}>📊 รายงานสต็อกแยกหมวด Excel</button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={S.card}>
        <div style={{...S.row,gap:8}}>
          <input style={{...S.inp,flex:2,minWidth:160}} placeholder="ค้นหาชื่อ / SKU / ราคา (หลายคำคั่นช่องว่าง)" value={kw} onChange={e=>setKw(e.target.value)}/>
          <select style={S.inp} value={cat} onChange={e=>setCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
          <select style={S.inp} value={stF} onChange={e=>setStF(e.target.value)}>{['ทั้งหมด','ปกติ','ใกล้หมด','หมดสต็อก'].map(s=><option key={s}>{s}</option>)}</select>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>พบ {filtered.length} รายการ</span>
        </div>
      </div>

      {Object.keys(edits).length>0&&(
        <div style={{...S.card,background:T.greenLight,border:`1px solid ${T.green}`}}>
          <div style={S.row}>
            <button style={btn('gr')} onClick={saveAll} disabled={saving}>{saving?'กำลังบันทึก...':`💾 บันทึก ${Object.keys(edits).length} รายการ`}</button>
            <button style={btn('gy')} onClick={()=>setEdits({})}>ยกเลิก</button>
            {msg&&<span style={{fontSize:12,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{msg}</span>}
          </div>
        </div>
      )}

      <div style={S.tow}>
        <table style={S.tbl}>
          <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่า','สถานะ','แก้ไข'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((p,i)=>{
              const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};const t=statType(d.qty,d.safety);const ed=edits[p[0]];
              return <tr key={p[0]}>
                <td style={tdr(i)}>{i+1}</td>
                <td style={{...tdr(i),color:T.blue,fontWeight:600}}>{p[0]}</td>
                <td style={tdr(i)}>{p[1]}</td>
                <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{p[2]}</td>
                <td style={tdr(i)}>฿{fmt(p[3])}</td>
                <td style={tdr(i)}>฿{fmtD(ed?ed.cost:d.cost)}</td>
                <td style={tdr(i)}>{ed?<input type="number" min="0" style={{...S.inp,width:70,padding:'4px 6px',borderColor:T.blue,background:T.blueLight,color:T.blue,fontWeight:600,textAlign:'center'}} value={ed.qty} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],qty:e.target.value}}))}/>:<b style={{color:T.blue}}>{d.qty}</b>}</td>
                <td style={tdr(i)}>{ed?<input type="number" min="0" style={{...S.inp,width:60,padding:'4px 6px',borderColor:T.amber,background:T.amberLight,color:T.amber,textAlign:'center'}} value={ed.safety} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],safety:e.target.value}}))}/>:d.safety}</td>
                <td style={tdr(i)}>฿{fmt(d.qty*d.cost)}</td>
                <td style={tdr(i)}><span style={bdg(t)}>{statLabel(t)}</span></td>
                <td style={tdr(i)}>{ed?<button style={btn('gy',{padding:'3px 10px',fontSize:11})} onClick={()=>setEdits(v=>{const n={...v};delete n[p[0]];return n;})}>✕</button>:<button style={btn('dk',{padding:'3px 10px',fontSize:11})} onClick={()=>{const d2=stock[p[0]]||{qty:0,safety:10,cost:p[4]};setEdits(v=>({...v,[p[0]]:{qty:d2.qty,safety:d2.safety,cost:d2.cost}}));}}>แก้ไข</button>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SALES PAGE — รวมขาย + เอกสาร (Unified)
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// SALES PAGE — รวมขาย + เอกสาร เป็นหน้าเดียว
// ════════════════════════════════════════════════════════════════
function SalesPage({stock, setStock, setSales, sales, staff, seeCost, seeProfit}){
  // ── Cart & product search ─────────────────────────────────
  const [kw,          setKw]          = useState('');
  const [cart,        setCart]        = useState([]);
  // ── Customer ──────────────────────────────────────────────
  const [customer,    setCustomer]    = useState(null);
  const [custTaxId,   setCustTaxId]   = useState('');
  const [custAddr,    setCustAddr]    = useState('');
  // ── Staff & commission ────────────────────────────────────
  const [selectedStaff, setSelectedStaff] = useState('');
  const [commOverride,  setCommOverride]  = useState(''); // override per-bill
  // ── Document settings ─────────────────────────────────────
  const [docType,     setDocType]     = useState('receipt'); // quotation/invoice/receipt/tax_invoice
  const [docStatus,   setDocStatus]   = useState('paid');    // draft/sent/paid
  const [dueDate,     setDueDate]     = useState('');
  const [refDoc,      setRefDoc]      = useState('');
  // ── Pricing ───────────────────────────────────────────────
  const [globalDisc,  setGlobalDisc]  = useState('');
  const [channel,     setChannel]     = useState('In-store');
  const [note,        setNote]        = useState('');
  // ── UI state ──────────────────────────────────────────────
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [tab,         setTab]         = useState('create'); // create / history
  const [orders,      setOrders]      = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  // ── Edit order state ──────────────────────────────────────
  const [editOrder,   setEditOrder]   = useState(null);
  const [editItems,   setEditItems]   = useState([]);
  const [editCustName, setEditCustName] = useState('');
  const [editCustAddr, setEditCustAddr] = useState('');
  const [editCustTax,  setEditCustTax]  = useState('');
  const [editDisc,     setEditDisc]     = useState('');
  const [editNote,     setEditNote]     = useState('');
  const [editDueDate,  setEditDueDate]  = useState('');
  const [editDocType,  setEditDocType]  = useState('receipt');
  const [editStaff,    setEditStaff]    = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [editKw,       setEditKw]       = useState('');
  // ── Filters ───────────────────────────────────────────────
  const [filterPeriod, setFilterPeriod] = useState('this_month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType,   setFilterType]   = useState('all');
  const [quickMonth,   setQuickMonth]   = useState(()=>{
    const n=new Date(); return n.getFullYear()+'-'+(n.getMonth()+1).toString().padStart(2,'0');
  });
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const xlsxOk = useXLSX();

  useEffect(()=>{ loadOrders(); },[]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const {data} = await supabase.from('sales_orders')
      .select('*').order('created_at',{ascending:false}).limit(500);
    setOrders(data||[]);
    setLoadingOrders(false);
  };

  // ── Product search suggestions ───────────────────────────
  const sugs = useMemo(()=>{
    if(!kw.trim()) return [];
    const words = kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>words.every(w=>(p[0]+' '+p[1]+' '+p[2]).toLowerCase().includes(w))).slice(0,12);
  },[kw]);

  // ── calcItem: per-item VAT logic ─────────────────────────
  const calcItem = x => {
    const base = x.sell * x.qty;
    if(x.vatMode==='included'){
      const vatAmt = base * VAT_RATE / (1+VAT_RATE);
      return {base, vatAmt, total:base};
    }
    if(x.vatMode==='add'){
      const vatAmt = base * VAT_RATE;
      return {base, vatAmt, total:base+vatAmt};
    }
    return {base, vatAmt:0, total:base};
  };

  // ── Cart totals ───────────────────────────────────────────
  const totals = useMemo(()=>{
    let subtotal=0, vatSum=0, grandTotal=0;
    cart.forEach(x=>{
      const c=calcItem(x);
      subtotal  += x.vatMode==='included' ? c.base-c.vatAmt : c.base;
      vatSum    += c.vatAmt;
      grandTotal+= c.total;
    });
    const discAmt   = parseFloat(globalDisc)||0;
    const afterDisc = Math.max(0, grandTotal-discAmt);
    const cost      = cart.reduce((s,x)=>s+x.cost*x.qty,0);
    const profit    = afterDisc - cost;
    return {subtotal, vatSum, grandTotal, discAmt, afterDisc, cost, profit};
  },[cart,globalDisc]);

  // ── Add to cart ───────────────────────────────────────────
  const addToCart = p => {
    setCart(c=>{
      const ex=c.find(x=>x.sku===p[0]);
      if(ex) return c.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);
      return [...c,{sku:p[0],name:p[1],cat:p[2],unitPrice:p[3],sell:p[3],cost:stock[p[0]]?.cost||p[4],qty:1,vatMode:'none',discount_pct:0}];
    });
    setKw('');
  };

  // ── Commission calc ───────────────────────────────────────
  const calcComm = (staffObj, totalsObj, overrideRate='') => {
    if(!staffObj) return 0;
    const rate = overrideRate!=='' ? parseFloat(overrideRate)||0 : parseFloat(staffObj.commission_rate)||0;
    if(staffObj.commission_type==='percent_revenue') return totalsObj.afterDisc * rate/100;
    if(staffObj.commission_type==='percent_profit')  return totalsObj.profit * rate/100;
    if(staffObj.commission_type==='fixed')           return rate;
    return 0;
  };

  // ── Current staff obj ─────────────────────────────────────
  const staffObj = staff.find(s=>s.id===selectedStaff)||null;
  const commAmt  = calcComm(staffObj, totals, commOverride);

  // ── Generate doc number ───────────────────────────────────
  const genDocNum = type => {
    const prefix = DOC_LABELS[type]?.prefix||'DOC';
    return prefix+'-'+Date.now().toString().slice(-9);
  };

  // ── SAVE SALE ─────────────────────────────────────────────
  const saveSale = async () => {
    if(!cart.length){setMsg('❌ ยังไม่มีรายการสินค้า');return;}
    setSaving(true); setMsg('');
    const items = cart.map(x=>{
      const c=calcItem(x);
      return {sku:x.sku,name:x.name,cat:x.cat,qty:x.qty,unit_price:x.unitPrice,sell:x.sell,
              cost:x.cost,vat_mode:x.vatMode,discount_pct:x.discount_pct||0,
              vat_amount:c.vatAmt,subtotal:c.total};
    });

    const isPaid = docStatus==='paid';

    // ① Save to sales_orders
    const orderData = {
      doc_number:       genDocNum(docType),
      doc_type:         docType,
      status:           docStatus,
      customer_id:      customer?.customer_id||null,
      customer_name:    customer?.name||'',
      customer_address: custAddr||(customer?.address||''),
      customer_tax_id:  custTaxId,
      items,
      subtotal:         totals.subtotal,
      discount_amount:  totals.discAmt,
      after_discount:   totals.afterDisc,
      vat_amount:       totals.vatSum,
      total:            totals.afterDisc,
      payment_method:   isPaid?channel:'',
      note,
      due_date:         dueDate||null,
      ref_doc:          refDoc,
      staff_name:       staffObj?.name||'',
      commission_amount:Math.round(commAmt*100)/100,
    };
    const {data:newOrder, error:oErr} = await supabase.from('sales_orders').insert([orderData]).select().single();
    if(oErr){setMsg('❌ '+oErr.message);setSaving(false);return;}

    // ② If paid: also save to sales table + deduct stock
    if(isPaid){
      const saleData = {
        items,
        total:           totals.grandTotal,
        discount_amount: totals.discAmt,
        total_after_discount: totals.afterDisc,
        vat_amount:      totals.vatSum,
        total_after_vat: totals.afterDisc,
        note, channel,
        customer_id:   customer?.customer_id||null,
        customer_name: customer?.name||null,
        staff_id:      selectedStaff||null,
        staff_name:    staffObj?.name||null,
        commission_amount: Math.round(commAmt*100)/100,
      };
      await supabase.from('sales').insert([saleData]);
      // Deduct stock
      const ns={...stock}; const ups=[];
      for(const it of items){
        const cur=ns[it.sku]?.qty||0;
        ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};
        ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
      }
      await supabase.from('stock').upsert(ups,{onConflict:'sku'});
      setStock(ns);
      // Sync to sales state for dashboard
      const soEntry = {
        id:'SO-'+newOrder.id, date:newOrder.created_at||new Date().toISOString(),
        items:items.map(it=>({...it,subtotal:it.subtotal||(it.sell||0)*it.qty})),
        total:totals.afterDisc, discount_amount:totals.discAmt,
        total_after_discount:totals.afterDisc, vat_amount:totals.vatSum,
        total_after_vat:totals.afterDisc, note, channel,
        customer_id:customer?.customer_id||null, customer_name:customer?.name||'',
        staff_name:staffObj?.name||'', commission_amount:Math.round(commAmt*100)/100,
        _source:'sales_order', _doc_number:orderData.doc_number,
      };
      setSales(prev=>[soEntry,...prev]);
    }

    // ③ Update local orders list
    setOrders(prev=>[newOrder,...prev]);
    const label = {draft:'ร่าง',sent:'ส่งแล้ว',paid:'ชำระแล้ว'}[docStatus]||docStatus;
    setMsg(`✅ ${DOC_LABELS[docType]?.th||'เอกสาร'} ${orderData.doc_number} — ${label}`);

    // ④ Print document
    setTimeout(()=>printDoc(newOrder), 300);

    // ⑤ Reset form
    resetForm();
    setSaving(false);
  };

  const resetForm = () => {
    setCart([]); setCustomer(null); setCustTaxId(''); setCustAddr('');
    setSelectedStaff(''); setCommOverride('');
    setGlobalDisc(''); setNote(''); setRefDoc(''); setDueDate('');
    setDocType('receipt'); setDocStatus('paid');
  };

  // ── Mark paid (from history) ─────────────────────────────
  const markPaid = async (order) => {
    const {error} = await supabase.from('sales_orders').update({
      status:'paid', payment_method:'transfer', payment_date:new Date().toISOString().split('T')[0]
    }).eq('id',order.id);
    if(error){setMsg('❌ '+error.message);return;}
    // Deduct stock
    const ns={...stock}; const ups=[];
    for(const it of order.items){
      const cur=ns[it.sku]?.qty||0;
      ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};
      ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
    }
    await supabase.from('stock').upsert(ups,{onConflict:'sku'});
    setStock(ns);
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,status:'paid',payment_method:'transfer'}:o));
    setSales(prev=>[{
      id:'SO-'+order.id, date:order.created_at, items:(order.items||[]).map((it)=>({...it,subtotal:it.subtotal||(it.sell||0)*it.qty})),
      total:order.total||0, discount_amount:order.discount_amount||0,
      total_after_discount:order.after_discount||order.total||0,
      vat_amount:order.vat_amount||0, total_after_vat:order.total||0,
      note:order.note||'', channel:'คำสั่งซื้อ',
      customer_id:order.customer_id, customer_name:order.customer_name||'',
      staff_name:order.staff_name||'', commission_amount:order.commission_amount||0,
      _source:'sales_order', _doc_number:order.doc_number,
    },...prev]);
    setMsg('✅ อัพเดทชำระแล้ว');
    printDoc({...order,status:'paid',doc_type:'tax_invoice',payment_method:'transfer'});
  };

  const cancelOrder = async id => {
    await supabase.from('sales_orders').update({status:'cancelled'}).eq('id',id);
    setOrders(prev=>prev.map(o=>o.id===id?{...o,status:'cancelled'}:o));
  };

  // ── Open edit ─────────────────────────────────────────────
  const openEdit = o => {
    setEditOrder(o); setEditItems((o.items||[]).map(it=>({...it})));
    setEditCustName(o.customer_name||''); setEditCustAddr(o.customer_address||'');
    setEditCustTax(o.customer_tax_id||''); setEditDisc(String(o.discount_amount||0));
    setEditNote(o.note||''); setEditDueDate(o.due_date||'');
    setEditDocType(o.doc_type||'receipt'); setEditStaff(o.staff_name||''); setEditKw('');
  };

  const saveEdit = async () => {
    if(!editOrder) return;
    setEditSaving(true);
    const disc=parseFloat(editDisc)||0;
    const sub=editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||0)*(1-(x.discount_pct||0)/100),0);
    const afterD=Math.max(0,sub-disc);
    const vatAmt=editOrder.vat_amount>0?afterD*0.07:0;
    const total=afterD+vatAmt;
    const updated = {
      doc_type:editDocType, customer_name:editCustName, customer_address:editCustAddr,
      customer_tax_id:editCustTax, items:editItems,
      subtotal:sub, discount_amount:disc, after_discount:afterD, vat_amount:vatAmt, total,
      note:editNote, due_date:editDueDate||null, staff_name:editStaff, updated_at:new Date().toISOString(),
    };
    const {error}=await supabase.from('sales_orders').update(updated).eq('id',editOrder.id);
    if(error){setMsg('❌ '+error.message);setEditSaving(false);return;}
    const newOrder={...editOrder,...updated};
    setOrders(prev=>prev.map(o=>o.id===editOrder.id?newOrder:o));
    setMsg('✅ แก้ไข '+editOrder.doc_number+' เรียบร้อย');
    setEditSaving(false); setEditOrder(null);
    setTimeout(()=>printDoc(newOrder),300);
  };

  // ── Filter orders ─────────────────────────────────────────
  const filtered = useMemo(()=>{
    const now=new Date();
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
    const lastMonth=new Date(now.getFullYear(),now.getMonth()-1,1);
    const lastMonthEnd=new Date(now.getFullYear(),now.getMonth(),0);
    const yearStart=new Date(now.getFullYear(),0,1);
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return orders.filter(o=>{
      const d=new Date(o.created_at);
      let inP=true;
      if(filterPeriod==='today')         inP=d>=today;
      else if(filterPeriod==='this_month') inP=d>=monthStart;
      else if(filterPeriod==='last_month') inP=d>=lastMonth&&d<=lastMonthEnd;
      else if(filterPeriod==='this_year')  inP=d>=yearStart;
      else if(filterPeriod==='month_pick'){
        const [y,m]=quickMonth.split('-');
        inP=d.getFullYear()===parseInt(y)&&d.getMonth()===parseInt(m)-1;
      } else if(filterPeriod==='custom'&&customStart&&customEnd){
        const cs=new Date(customStart); const ce=new Date(customEnd); ce.setHours(23,59,59);
        inP=d>=cs&&d<=ce;
      }
      const inS=filterStatus==='all'||o.status===filterStatus;
      const inT=filterType==='all'||o.doc_type===filterType;
      return inP&&inS&&inT;
    });
  },[orders,filterPeriod,filterStatus,filterType,quickMonth,customStart,customEnd]);

  const summary = useMemo(()=>{
    const paid=filtered.filter(o=>o.status==='paid');
    const pend=filtered.filter(o=>o.status==='sent');
    return {rev:paid.reduce((s,o)=>s+o.total,0),pend:pend.reduce((s,o)=>s+o.total,0),paidN:paid.length,pendN:pend.length};
  },[filtered]);

  const TYPE_LABEL = {quotation:'ใบเสนอราคา',invoice:'ใบแจ้งหนี้',receipt:'ใบเสร็จ',tax_invoice:'ใบกำกับภาษี'};
  const STATUS_STYLE = {draft:{background:'#E5E7EB',color:'#374151'},sent:{background:T.blueLight,color:T.blue},paid:{background:T.greenLight,color:T.green},cancelled:{background:T.redLight,color:T.red}};
  const STATUS_LABEL = {draft:'📝 ร่าง',sent:'📤 รอชำระ',paid:'✅ ชำระแล้ว',cancelled:'❌ ยกเลิก'};

  // ── Staff commission display ──────────────────────────────
  const commRateDisplay = s => s.commission_type==='percent_revenue'?s.commission_rate+'% ยอดขาย':s.commission_type==='percent_profit'?s.commission_rate+'% กำไร':'฿'+s.commission_rate+'/ออเดอร์';

  return(
    <div>
      {/* Tab switcher */}
      <div style={{...S.nav,marginBottom:12}}>
        <button style={{...nbtn(tab==='create'),flex:1,textAlign:'center'}} onClick={()=>setTab('create')}>➕ สร้างรายการขาย</button>
        <button style={{...nbtn(tab==='history'),flex:1,textAlign:'center'}} onClick={()=>setTab('history')}>📋 ประวัติ ({orders.length})</button>
      </div>

      {msg&&<div style={{...S.card,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500,marginBottom:10}}>{msg}</div>}

      {/* ── CREATE TAB ─────────────────────────────────────── */}
      {tab==='create'&&(
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,340px)',gap:12}}>

          {/* LEFT: Product search + cart */}
          <div>
            {/* Doc type selector */}
            <div style={S.card}>
              <div style={S.cardTitle}>📄 ประเภทเอกสาร</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {Object.entries(TYPE_LABEL).map(([v,l])=>(
                  <button key={v} style={{
                    padding:'7px 14px',border:`1.5px solid ${docType===v?T.dark:'#ddd'}`,
                    borderRadius:T.radius,background:docType===v?T.dark:'transparent',
                    color:docType===v?'#fff':T.text,fontWeight:docType===v?700:400,
                    cursor:'pointer',fontSize:12,fontFamily:'inherit'
                  }} onClick={()=>setDocType(v)}>{l}</button>
                ))}
              </div>
              {/* Status */}
              <div style={{display:'flex',gap:6}}>
                {[['draft','📝 บันทึกร่าง','#E5E7EB','#374151'],['sent','📤 ส่งลูกค้า/รอชำระ',T.blueLight,T.blue],['paid','✅ ชำระแล้ว + ตัดสต็อก',T.greenLight,T.green]].map(([v,l,bg,col])=>(
                  <button key={v} style={{
                    padding:'6px 12px',border:`1.5px solid ${docStatus===v?col:'#ddd'}`,
                    borderRadius:T.radius,background:docStatus===v?bg:'transparent',
                    color:docStatus===v?col:T.textMuted,fontWeight:docStatus===v?700:400,
                    cursor:'pointer',fontSize:11,fontFamily:'inherit',flex:1
                  }} onClick={()=>setDocStatus(v)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Product search */}
            <div style={S.card}>
              <div style={S.cardTitle}>🔍 ค้นหาสินค้า</div>
              <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า / SKU / หมวดหมู่" value={kw} onChange={e=>setKw(e.target.value)} autoComplete="off"/>
              {sugs.length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:8}}>
                  {sugs.map(p=>(
                    <button key={p[0]} style={{padding:'5px 10px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:11,fontFamily:'inherit'}} onClick={()=>addToCart(p)}>
                      <span style={{fontWeight:600}}>{p[1]}</span>
                      <span style={{color:T.textMuted,marginLeft:4,fontSize:10}}>{p[2]}</span>
                      <span style={{color:T.green,marginLeft:4}}>฿{fmt(p[3])}</span>
                      <span style={{color:stock[p[0]]?.qty>0?T.textMuted:T.red,marginLeft:4,fontSize:10}}>({stock[p[0]]?.qty||0})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart table */}
            {cart.length>0&&(
              <div style={S.card}>
                <div style={{...S.cardTitle,justifyContent:'space-between'}}>
                  <span>🛒 รายการ ({cart.length})</span>
                  <button style={btn('gy',{fontSize:11,padding:'3px 8px'})} onClick={()=>setCart([])}>ล้าง</button>
                </div>
                <div style={S.tow}>
                  <table style={S.tbl}>
                    <thead><tr>
                      {['สินค้า','ราคา','จำนวน','VAT','ส่วนลด%','รวม',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {cart.map((x,i)=>{
                        const c=calcItem(x);
                        return(
                          <tr key={x.sku}>
                            <td style={tdr(i)}>
                              <div style={{fontWeight:500,fontSize:12}}>{x.name}</div>
                              <div style={{fontSize:10,color:T.textMuted}}>{x.sku}</div>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="0" step="0.01" style={{...S.inp,width:80,padding:'3px 5px'}} value={x.sell}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,sell:parseFloat(e.target.value)||0}:it))}/>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="1" style={{...S.inp,width:52,padding:'3px 5px',textAlign:'center'}} value={x.qty}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,qty:Math.max(1,parseInt(e.target.value)||1)}:it))}/>
                            </td>
                            <td style={tdr(i)}>
                              <select style={{...S.inp,padding:'3px 4px',fontSize:11,width:75}} value={x.vatMode}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,vatMode:e.target.value}:it))}>
                                <option value="none">ไม่มี</option>
                                <option value="included">รวมใน</option>
                                <option value="add">บวกเพิ่ม</option>
                              </select>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="0" max="100" step="0.5" style={{...S.inp,width:55,padding:'3px 5px'}} value={x.discount_pct||0}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,discount_pct:parseFloat(e.target.value)||0,sell:it.unitPrice*(1-(parseFloat(e.target.value)||0)/100)}:it))}/>
                            </td>
                            <td style={{...tdr(i),fontWeight:600,color:T.dark}}>฿{fmt(c.total)}</td>
                            <td style={tdr(i)}>
                              <button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:18,lineHeight:1}} onClick={()=>setCart(c=>c.filter(it=>it.sku!==x.sku))}>×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Summary + customer + staff */}
          <div>
            {/* Summary */}
            <div style={S.card}>
              <div style={S.cardTitle}>💰 สรุปยอด</div>
              <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0'}}><span>รวมก่อน VAT</span><span>฿{fmt(totals.subtotal)}</span></div>
                {totals.vatSum>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0',color:T.amber}}><span>VAT 7%</span><span>฿{fmt(totals.vatSum)}</span></div>}
                {totals.discAmt>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0',color:T.red}}><span>ส่วนลดรวม</span><span>-฿{fmt(totals.discAmt)}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:20,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}><span>ยอดรวม</span><span>฿{fmt(totals.afterDisc)}</span></div>
                {seeProfit&&totals.profit>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:4,color:T.green}}><span>กำไร</span><span>฿{fmt(totals.profit)} ({totals.afterDisc>0?((totals.profit/totals.afterDisc)*100).toFixed(1):0}%)</span></div>}
              </div>

              {/* Discount */}
              <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ส่วนลดรวม (฿)</div>
              <input type="number" min="0" style={{...S.inp,width:'100%',marginBottom:10}} placeholder="0" value={globalDisc} onChange={e=>setGlobalDisc(e.target.value)}/>

              {/* Customer */}
              <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ลูกค้า</div>
              <CustomerSearch value={customer} onSelect={c=>{setCustomer(c);setCustAddr(c.address||'');}}/>

              {customer&&<>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3,marginTop:6}}>เลขผู้เสียภาษี</div>
                <input style={{...S.inp,width:'100%',marginBottom:6}} placeholder="0-0000-00000-00-0" value={custTaxId} onChange={e=>setCustTaxId(e.target.value)}/>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ที่อยู่</div>
                <textarea style={{...S.inp,width:'100%',height:50,resize:'vertical',marginBottom:6}} value={custAddr} onChange={e=>setCustAddr(e.target.value)}/>
              </>}

              {/* Staff + commission */}
              <div style={{fontSize:12,color:T.textMuted,marginBottom:3,marginTop:4}}>พนักงานขาย</div>
              <select style={{...S.inp,width:'100%',marginBottom:4}} value={selectedStaff} onChange={e=>{setSelectedStaff(e.target.value);setCommOverride('');}}>
                <option value="">— ไม่ระบุ —</option>
                {staff.map(s=><option key={s.id} value={s.id}>{s.name} ({commRateDisplay(s)})</option>)}
              </select>
              {staffObj&&(
                <div style={{background:T.amberLight,borderRadius:T.radius,padding:'6px 10px',marginBottom:8,fontSize:11}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{color:T.amber,fontWeight:600}}>💸 Rate: {commRateDisplay(staffObj)}</span>
                    <label style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
                      <input type="checkbox" checked={commOverride!==''} onChange={e=>{if(!e.target.checked)setCommOverride('');else setCommOverride(String(staffObj.commission_rate));}}/>
                      <span>Override บิลนี้</span>
                    </label>
                  </div>
                  {commOverride!==''&&(
                    <div style={{display:'flex',alignItems:'center',gap:6,marginTop:5}}>
                      <input type="number" min="0" step="0.1" style={{...S.inp,width:80,padding:'3px 6px',fontSize:12}} value={commOverride} onChange={e=>setCommOverride(e.target.value)}/>
                      <span style={{color:T.textMuted}}>{staffObj.commission_type==='percent_revenue'?'% ยอดขาย':staffObj.commission_type==='percent_profit'?'% กำไร':'฿/ออเดอร์'} (ปกติ: {staffObj.commission_rate})</span>
                    </div>
                  )}
                  {commAmt>0&&<div style={{marginTop:4,color:T.amber,fontWeight:500}}>ค่าคอมบิลนี้: ฿{fmt(commAmt)}</div>}
                </div>
              )}

              {/* Channel + note + dates */}
              <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ช่องทางขาย</div>
              <select style={{...S.inp,width:'100%',marginBottom:6}} value={channel} onChange={e=>setChannel(e.target.value)}>
                {['In-store','Online','Line','Shopee','Lazada','Wholesale','Other'].map(c=><option key={c}>{c}</option>)}
              </select>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>กำหนดชำระ</div>
                  <input type="date" style={{...S.inp,width:'100%'}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>เอกสารอ้างอิง</div>
                  <input style={{...S.inp,width:'100%'}} placeholder="เช่น QT-xxx" value={refDoc} onChange={e=>setRefDoc(e.target.value)}/>
                </div>
              </div>

              <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>หมายเหตุ</div>
              <input style={{...S.inp,width:'100%',marginBottom:12}} placeholder="หมายเหตุ..." value={note} onChange={e=>setNote(e.target.value)}/>

              {/* SAVE BUTTON */}
              <button style={{...btn('dk'),width:'100%',padding:'13px 0',fontSize:14,fontWeight:700,letterSpacing:'0.06em'}} onClick={saveSale} disabled={saving||!cart.length}>
                {saving?'⏳ กำลังบันทึก...':`💾 บันทึก${docStatus==='paid'?' + ตัดสต็อก':''} + พิมพ์`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────── */}
      {tab==='history'&&(
        <div>
          {/* Filters */}
          <div style={S.card}>
            <div style={{...S.row,gap:6,flexWrap:'wrap',marginBottom:8}}>
              {[['today','วันนี้'],['this_month','เดือนนี้'],['last_month','เดือนที่แล้ว'],['this_year','ปีนี้'],['month_pick','เลือกเดือน'],['custom','กำหนดเอง']].map(([v,l])=>(
                <button key={v} style={nbtn(filterPeriod===v)} onClick={()=>setFilterPeriod(v)}>{l}</button>
              ))}
            </div>
            <div style={{...S.row,gap:8,flexWrap:'wrap'}}>
              {filterPeriod==='month_pick'&&<input type="month" style={{...S.inp,fontSize:12}} value={quickMonth} onChange={e=>setQuickMonth(e.target.value)}/>}
              {filterPeriod==='custom'&&<><input type="date" style={{...S.inp,fontSize:12}} value={customStart} onChange={e=>setCustomStart(e.target.value)}/><span style={{fontSize:12,color:T.textMuted}}>ถึง</span><input type="date" style={{...S.inp,fontSize:12}} value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></>}
              <select style={{...S.inp,fontSize:12}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="all">ทุกสถานะ</option>
                {Object.entries(STATUS_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <select style={{...S.inp,fontSize:12}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="all">ทุกประเภท</option>
                {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Summary KPIs */}
          <div style={S.kgrid}>
            <KPI label="ชำระแล้ว" value={'฿'+fmt(summary.rev)} sub={summary.paidN+' ใบ'} icon="✅" bg={T.greenLight} color={T.green}/>
            <KPI label="รอชำระ"   value={'฿'+fmt(summary.pend)} sub={summary.pendN+' ใบ'} icon="📤" bg={T.blueLight} color={T.blue}/>
            <KPI label="ทั้งหมด"  value={filtered.length+' ใบ'} icon="📋" bg={T.grayLight} color={T.dark}/>
          </div>

          {/* Orders table */}
          {loadingOrders?<div style={{textAlign:'center',padding:32,color:T.textMuted}}>⏳ กำลังโหลด...</div>:(
            <div style={S.card}>
              <div style={S.cardTitle}>📋 รายการเอกสาร ({filtered.length})</div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>
                    {['เลขที่','ประเภท','ลูกค้า','เซล','วันที่','มูลค่า','สถานะ','จัดการ'].map((h,i)=>(
                      <th key={i} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.length===0
                      ?<tr><td colSpan={8} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:28}}>ไม่มีเอกสารในช่วงเวลานี้</td></tr>
                      :filtered.map((o,i)=>(
                        <tr key={o.id}>
                          <td style={{...tdr(i),fontWeight:700,color:T.blue,whiteSpace:'nowrap',fontSize:11}}>{o.doc_number}</td>
                          <td style={{...tdr(i),fontSize:11}}>{TYPE_LABEL[o.doc_type]||o.doc_type}</td>
                          <td style={tdr(i)}>{o.customer_name||'-'}</td>
                          <td style={{...tdr(i),fontSize:11}}>{o.staff_name||'-'}</td>
                          <td style={{...tdr(i),fontSize:11,whiteSpace:'nowrap'}}>{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                          <td style={{...tdr(i),fontWeight:500}}>฿{fmt(o.total)}</td>
                          <td style={tdr(i)}>
                            <span style={{...STATUS_STYLE[o.status]||{},borderRadius:2,padding:'2px 8px',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                              {STATUS_LABEL[o.status]||o.status}
                            </span>
                          </td>
                          <td style={tdr(i)}>
                            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                              <button style={btn('dk',{padding:'2px 7px',fontSize:10})} onClick={()=>printDoc(o)} title="พิมพ์">🖨️</button>
                              <button style={btn('out',{padding:'2px 7px',fontSize:10})} onClick={()=>printDoc(o,true)}>สำเนา</button>
                              <button style={btn('am',{padding:'2px 7px',fontSize:10})} onClick={()=>openEdit(o)}>✏️</button>
                              {o.status==='draft'&&<button style={btn('bl',{padding:'2px 7px',fontSize:10})} onClick={()=>{supabase.from('sales_orders').update({status:'sent'}).eq('id',o.id).then(()=>setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:'sent'}:x)));setMsg('✅ ส่งแล้ว');}}>ส่ง</button>}
                              {o.status==='sent'&&<button style={btn('gr',{padding:'2px 7px',fontSize:10})} onClick={()=>markPaid(o)}>💰</button>}
                              {o.status==='paid'&&<button style={btn('dk',{padding:'2px 7px',fontSize:10})} onClick={()=>printDoc({...o,doc_type:'tax_invoice'})}>ใบกำกับ</button>}
                              {['draft','sent'].includes(o.status)&&<button style={btn('rd',{padding:'2px 7px',fontSize:10})} onClick={()=>cancelOrder(o.id)}>ยก</button>}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {editOrder&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'16px 12px',overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:T.radius,width:'100%',maxWidth:860,boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}}>
            <div style={{background:T.dark,color:'#fff',padding:'14px 20px',borderRadius:`${T.radius}px ${T.radius}px 0 0`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,letterSpacing:'0.06em'}}>✏️ แก้ไขเอกสาร</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:2}}>{editOrder.doc_number} · {TYPE_LABEL[editOrder.doc_type]||editOrder.doc_type}</div>
              </div>
              <button onClick={()=>setEditOrder(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:28,height:28,borderRadius:4,cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:20}}>
              {editOrder.status==='paid'&&<div style={{background:'#FEF3C7',border:'1px solid #FCD34D',borderRadius:T.radius,padding:'8px 12px',marginBottom:14,fontSize:12,color:'#B45309'}}>⚠️ เอกสารชำระแล้ว การแก้ไขมีผลกับ reprint เท่านั้น</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'8px 12px',marginBottom:12}}>
                <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ประเภทเอกสาร</div>
                  <select style={{...S.inp,width:'100%'}} value={editDocType} onChange={e=>setEditDocType(e.target.value)}>
                    {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>กำหนดชำระ</div><input type="date" style={{...S.inp,width:'100%'}} value={editDueDate} onChange={e=>setEditDueDate(e.target.value)}/></div>
                <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>พนักงานขาย</div>
                  <select style={{...S.inp,width:'100%'}} value={editStaff} onChange={e=>setEditStaff(e.target.value)}>
                    <option value="">— ไม่ระบุ —</option>
                    {staff.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 12px',marginBottom:12}}>
                <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ชื่อลูกค้า</div><input style={{...S.inp,width:'100%'}} value={editCustName} onChange={e=>setEditCustName(e.target.value)}/></div>
                <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>เลขผู้เสียภาษี</div><input style={{...S.inp,width:'100%'}} value={editCustTax} onChange={e=>setEditCustTax(e.target.value)}/></div>
                <div style={{gridColumn:'1/-1'}}><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ที่อยู่</div><textarea style={{...S.inp,width:'100%',height:50,resize:'vertical'}} value={editCustAddr} onChange={e=>setEditCustAddr(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>เพิ่มสินค้า</div>
                <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า/SKU" value={editKw} onChange={e=>setEditKw(e.target.value)}/>
                {editKw.trim()&&PR.filter(p=>{const w=editKw.toLowerCase().split(' ');return w.every(x=>(p[0]+' '+p[1]).toLowerCase().includes(x));}).slice(0,8).map(p=>(
                  <button key={p[0]} style={{margin:'3px',padding:'3px 8px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:11,fontFamily:'inherit'}} onClick={()=>{setEditItems(items=>{const ex=items.find(x=>x.sku===p[0]);if(ex)return items.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);return[...items,{sku:p[0],name:p[1],cat:p[2],qty:1,sell:p[3],unit_price:p[3],discount_pct:0,cost:stock[p[0]]?.cost||p[4]}];});setEditKw('');}}>
                    {p[1]} <span style={{color:T.green}}>฿{fmt(p[3])}</span>
                  </button>
                ))}
              </div>
              <div style={{...S.tow,marginBottom:12}}>
                <table style={S.tbl}>
                  <thead><tr>{['สินค้า','ราคา/หน่วย','ส่วนลด%','จำนวน','รวม',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {editItems.map((it,i)=>(
                      <tr key={i}>
                        <td style={tdr(i)}><div style={{fontWeight:500}}>{it.name}</div><div style={{fontSize:10,color:T.textMuted}}>{it.sku}</div></td>
                        <td style={tdr(i)}><input type="number" min="0" step="0.01" style={{...S.inp,width:80,padding:'3px 5px'}} value={it.sell||0} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,sell:parseFloat(e.target.value)||0}:x))}/></td>
                        <td style={tdr(i)}><input type="number" min="0" max="100" style={{...S.inp,width:55,padding:'3px 5px'}} value={it.discount_pct||0} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,discount_pct:parseFloat(e.target.value)||0}:x))}/></td>
                        <td style={tdr(i)}><input type="number" min="1" style={{...S.inp,width:52,padding:'3px 5px',textAlign:'center'}} value={it.qty||1} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,qty:Math.max(1,parseInt(e.target.value)||1)}:x))}/></td>
                        <td style={{...tdr(i),fontWeight:500}}>฿{fmt((it.sell||0)*(it.qty||1)*(1-(it.discount_pct||0)/100))}</td>
                        <td style={tdr(i)}><button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:18}} onClick={()=>setEditItems(items=>items.filter((_,j)=>j!==i))}>×</button></td>
                      </tr>
                    ))}
                    {!editItems.length&&<tr><td colSpan={6} style={{padding:16,textAlign:'center',color:T.textMuted,fontSize:12}}>ไม่มีรายการ</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px',marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ส่วนลดรวม (฿)</div>
                  <input type="number" min="0" style={{...S.inp,width:'100%'}} value={editDisc} onChange={e=>setEditDisc(e.target.value)} placeholder="0"/>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:8,marginBottom:3}}>หมายเหตุ</div>
                  <input style={{...S.inp,width:'100%'}} value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="หมายเหตุ..."/>
                </div>
                <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px'}}>
                  {(()=>{const disc=parseFloat(editDisc)||0;const sub=editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||1)*(1-(x.discount_pct||0)/100),0);const afterD=Math.max(0,sub-disc);const vat=editOrder.vat_amount>0?afterD*0.07:0;const total=afterD+vat;return(<>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span>ราคารวม</span><span>฿{fmt(sub)}</span></div>
                    {disc>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:T.red}}><span>ส่วนลด</span><span>-฿{fmt(disc)}</span></div>}
                    {vat>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:T.amber}}><span>VAT</span><span>฿{fmt(vat)}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:18,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}><span>รวม</span><span>฿{fmt(total)}</span></div>
                  </>);})()}
                </div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button style={btn('gy')} onClick={()=>setEditOrder(null)}>ยกเลิก</button>
                <button style={btn('dk')} onClick={()=>{const disc=parseFloat(editDisc)||0;const sub=editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||1)*(1-(x.discount_pct||0)/100),0);const afterD=Math.max(0,sub-disc);const vat=editOrder.vat_amount>0?afterD*0.07:0;const total=afterD+vat;printDoc({...editOrder,doc_type:editDocType,customer_name:editCustName,customer_address:editCustAddr,customer_tax_id:editCustTax,items:editItems,subtotal:sub,discount_amount:disc,after_discount:afterD,vat_amount:vat,total,note:editNote,due_date:editDueDate,staff_name:editStaff});}}>🖨️ Preview</button>
                <button style={btn('gr')} onClick={saveEdit} disabled={editSaving}>{editSaving?'กำลังบันทึก...':'💾 บันทึก + พิมพ์'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════
function OrdersPage({stock, setStock, setSales, staff=[]}){
  const [tab,       setTab]      = useState('list');
  const [orders,    setOrders]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [saving,    setSaving]   = useState(false);
  const [msg,       setMsg]      = useState('');
  // Edit modal
  const [editOrder, setEditOrder] = useState(null);  // order being edited
  const [editItems, setEditItems] = useState([]);
  const [editCustName,  setEditCustName]  = useState('');
  const [editCustAddr,  setEditCustAddr]  = useState('');
  const [editCustTax,   setEditCustTax]   = useState('');
  const [editDisc,      setEditDisc]      = useState('');
  const [editNote,      setEditNote]      = useState('');
  const [editDueDate,   setEditDueDate]   = useState('');
  const [editDocType,   setEditDocType]   = useState('quotation');
  const [editStaff,     setEditStaff]     = useState('');
  const [editKw,        setEditKw]        = useState('');
  const [editSaving,    setEditSaving]    = useState(false);

  // Filter
  const [filterPeriod, setFilterPeriod] = useState('this_month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType,   setFilterType]   = useState('all');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [quickMonth,   setQuickMonth]   = useState(()=>{
    const n=new Date(); return n.getFullYear()+'-'+(n.getMonth()+1).toString().padStart(2,'0');
  });

  // New order form
  const [kw,          setKw]        = useState('');
  const [cart,        setCart]      = useState([]);
  const [customer,    setCustomer]  = useState(null);
  const [custTaxId,   setCustTaxId] = useState('');
  const [custAddr,    setCustAddr]  = useState('');
  const [docType,     setDocType]   = useState('quotation');
  const [dueDate,     setDueDate]   = useState('');
  const [refDoc,      setRefDoc]    = useState('');
  const [orderNote,   setOrderNote] = useState('');
  const [staffName,   setStaffName] = useState('');
  const [discAmt,     setDiscAmt]   = useState('');
  const [useVat,      setUseVat]    = useState(false);
  const xlsxOk = useXLSX();

  useEffect(()=>{ loadOrders(); },[]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales_orders')
      .select('*').order('created_at',{ascending:false}).limit(500);
    setOrders(data||[]);
    setLoading(false);
  };

  const openEdit = (o) => {
    setEditOrder(o);
    setEditItems((o.items||[]).map(it=>({...it})));
    setEditCustName(o.customer_name||'');
    setEditCustAddr(o.customer_address||'');
    setEditCustTax(o.customer_tax_id||'');
    setEditDisc(String(o.discount_amount||0));
    setEditNote(o.note||'');
    setEditDueDate(o.due_date||'');
    setEditDocType(o.doc_type||'quotation');
    setEditStaff(o.staff_name||'');
    setEditKw('');
  };

  const saveEdit = async () => {
    if(!editOrder) return;
    setEditSaving(true);
    const disc = parseFloat(editDisc)||0;
    const subtotal = editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||0)*(1-(x.discount_pct||0)/100),0);
    const afterD = Math.max(0, subtotal-disc);
    const vatAmt = editOrder.vat_amount>0 ? afterD*0.07 : 0;
    const grand  = afterD+vatAmt;

    const updated = {
      doc_type:         editDocType,
      customer_name:    editCustName,
      customer_address: editCustAddr,
      customer_tax_id:  editCustTax,
      items:            editItems,
      subtotal,
      discount_amount:  disc,
      after_discount:   afterD,
      vat_amount:       vatAmt,
      total:            grand,
      note:             editNote,
      due_date:         editDueDate||null,
      staff_name:       editStaff,
      updated_at:       new Date().toISOString(),
    };
    const {error} = await supabase.from('sales_orders').update(updated).eq('id', editOrder.id);
    if(error){ setMsg('❌ '+error.message); setEditSaving(false); return; }
    // Update local state
    const newOrder = {...editOrder, ...updated};
    setOrders(prev=>prev.map(o=>o.id===editOrder.id ? newOrder : o));
    setMsg('✅ แก้ไขเอกสาร '+editOrder.doc_number+' เรียบร้อย');
    setEditSaving(false);
    setEditOrder(null);
    // Auto print updated doc
    setTimeout(()=>printDoc(newOrder), 300);
  };

  // Filter orders by period
  const filtered = useMemo(()=>{
    const now = new Date();
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const monthStart = new Date(now.getFullYear(),now.getMonth(),1);
    const lastMonth  = new Date(now.getFullYear(),now.getMonth()-1,1);
    const lastMonthEnd = new Date(now.getFullYear(),now.getMonth(),0);
    const yearStart  = new Date(now.getFullYear(),0,1);

    return orders.filter(o=>{
      const d = new Date(o.created_at);
      let inPeriod = true;
      if(filterPeriod==='today')      inPeriod = d>=today;
      else if(filterPeriod==='this_month') inPeriod = d>=monthStart;
      else if(filterPeriod==='last_month') inPeriod = d>=lastMonth&&d<=lastMonthEnd;
      else if(filterPeriod==='this_year')  inPeriod = d>=yearStart;
      else if(filterPeriod==='month_pick'){
        const [y,m]=quickMonth.split('-');
        inPeriod = d.getFullYear()===parseInt(y)&&d.getMonth()===parseInt(m)-1;
      } else if(filterPeriod==='custom'&&customStart&&customEnd){
        const cs=new Date(customStart); const ce=new Date(customEnd); ce.setHours(23,59,59);
        inPeriod = d>=cs&&d<=ce;
      }
      const inStatus = filterStatus==='all' || o.status===filterStatus;
      const inType   = filterType==='all'   || o.doc_type===filterType;
      return inPeriod && inStatus && inType;
    });
  },[orders,filterPeriod,filterStatus,filterType,customStart,customEnd,quickMonth]);

  // Totals summary
  const summary = useMemo(()=>{
    const paid     = filtered.filter(o=>o.status==='paid');
    const pending  = filtered.filter(o=>o.status==='sent');
    const draft    = filtered.filter(o=>o.status==='draft');
    return {
      totalRevenue: paid.reduce((s,o)=>s+o.total,0),
      totalPending: pending.reduce((s,o)=>s+o.total,0),
      paidCount:    paid.length,
      pendingCount: pending.length,
      draftCount:   draft.length,
    };
  },[filtered]);

  const sugs = useMemo(()=>{
    if(!kw.trim()) return [];
    const words = kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>words.every(w=>(p[0]+' '+p[1]+' '+p[2]).toLowerCase().includes(w))).slice(0,12);
  },[kw]);

  const addToCart = p => {
    setCart(c=>{ const ex=c.find(x=>x.sku===p[0]); if(ex)return c.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x); return[...c,{sku:p[0],name:p[1],cat:p[2],unit_price:p[3],sell:p[3],qty:1,discount_pct:0}]; });
    setKw('');
  };

  const subtotal = cart.reduce((s,x)=>s+x.sell*x.qty*(1-x.discount_pct/100),0);
  const disc     = parseFloat(discAmt)||0;
  const afterD   = Math.max(0, subtotal-disc);
  const vatAmt   = useVat ? afterD*VAT_RATE : 0;
  const grand    = afterD+vatAmt;

  const genDocNum = (type) => {
    const prefix = DOC_LABELS[type]?.prefix||'DOC';
    return prefix+'-'+Date.now().toString().slice(-9);
  };

  const createOrder = async (status='draft') => {
    if(!cart.length){setMsg('❌ ยังไม่มีรายการสินค้า');return;}
    setSaving(true); setMsg('');
    const items = cart.map(x=>({
      sku:x.sku, name:x.name, cat:x.cat,
      qty:x.qty, unit_price:x.unit_price,
      sell:x.sell, discount_pct:x.discount_pct,
      subtotal: x.sell*x.qty*(1-x.discount_pct/100),
      cost: stock[x.sku]?.cost||0,
    }));
    const orderData = {
      doc_number:      genDocNum(docType),
      doc_type:        docType,
      status,
      customer_id:     customer?.customer_id||null,
      customer_name:   customer?.name||'',
      customer_address:custAddr||(customer?.address||''),
      customer_tax_id: custTaxId,
      items,
      subtotal,
      discount_amount: disc,
      after_discount:  afterD,
      vat_amount:      vatAmt,
      total:           grand,
      due_date:        dueDate||null,
      ref_doc:         refDoc,
      note:            orderNote,
      staff_name:      staffName,
      payment_method:  '',
    };
    const {data:newOrder, error} = await supabase.from('sales_orders').insert([orderData]).select().single();
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    setMsg('✅ สร้าง '+orderData.doc_number+' เรียบร้อย');
    setOrders(prev=>[newOrder,...prev]);
    // ถ้าชำระแล้ว sync ไป sales state ด้วย + คำนวณค่าคอม
    if(status==='paid'){
      const staffObj2 = staff.find((s:any)=>s.name===staffName);
      let commAmt2 = 0;
      if(staffObj2){
        const rate2 = parseFloat(staffObj2.commission_rate)||0;
        if(staffObj2.commission_type==='percent_revenue') commAmt2 = grand * rate2/100;
        else if(staffObj2.commission_type==='percent_profit') commAmt2 = (grand - items.reduce((s:number,it:any)=>s+(it.cost||0)*it.qty,0)) * rate2/100;
        else commAmt2 = rate2;
      }
      const soEntry = {
        id:'SO-'+newOrder.id, date:newOrder.created_at||new Date().toISOString(),
        items:items.map(it=>({...it,subtotal:it.subtotal||(it.sell||0)*(it.qty||0)*(1-(it.discount_pct||0)/100)})),
        total:grand, discount_amount:disc, total_after_discount:afterD,
        vat_amount:vatAmt, total_after_vat:grand, note:orderNote, channel:'คำสั่งซื้อ',
        customer_id:customer?.customer_id||null, customer_name:customer?.name||'',
        staff_name:staffName, commission_amount:commAmt2||0, _source:'sales_order',
        _doc_number:orderData.doc_number,
      };
      setSales(prev=>[soEntry,...prev]);
    }
    // ตัดสต็อก
    if(status==='paid'){
      const ns={...stock}; const ups=[];
      for(const it of items){
        const cur=ns[it.sku]?.qty||0;
        ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};
        ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
      }
      await supabase.from('stock').upsert(ups,{onConflict:'sku'});
      setStock(ns);
    }
    // Reset form
    setCart([]); setCustomer(null); setCustTaxId(''); setCustAddr(''); setDiscAmt('');
    setRefDoc(''); setOrderNote(''); setStaffName(''); setUseVat(false);
    setSaving(false); setTab('list');
    // Print
    setTimeout(()=>printDoc(newOrder), 300);
  };

  const markPaid = async (order, payMethod='transfer') => {
    const { error } = await supabase.from('sales_orders').update({
      status:'paid', payment_method:payMethod, payment_date:new Date().toISOString().split('T')[0]
    }).eq('id',order.id);
    if(error){setMsg('❌ '+error.message);return;}
    // ตัดสต็อก
    const ns={...stock}; const ups=[];
    for(const it of order.items){
      const cur=ns[it.sku]?.qty||0;
      ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};
      ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
    }
    await supabase.from('stock').upsert(ups,{onConflict:'sku'});
    setStock(ns);
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,status:'paid',payment_method:payMethod}:o));
    // เพิ่มเข้า sales state เพื่อให้ Dashboard/Report เห็นทันที
    const soEntry = {
      id:'SO-'+order.id, date:order.created_at||new Date().toISOString(),
      items:(order.items||[]).map((it:any)=>({...it,subtotal:it.subtotal||(it.sell||0)*(it.qty||0)*(1-(it.discount_pct||0)/100)})),
      total:order.total||0, discount_amount:order.discount_amount||0,
      total_after_discount:order.after_discount||order.total||0,
      vat_amount:order.vat_amount||0, total_after_vat:order.total||0, note:order.note||'', channel:'คำสั่งซื้อ',
      customer_id:order.customer_id, customer_name:order.customer_name||'',
      staff_name:order.staff_name||'', commission_amount:0,
      _source:'sales_order', _doc_number:order.doc_number,
    };
    setSales(prev=>[soEntry,...prev]);
    setMsg('✅ อัพเดทสถานะชำระแล้ว');
    const updated = {...order, status:'paid', payment_method:payMethod};
    printDoc({...updated, doc_type:'tax_invoice'});
  };

  const cancelOrder = async (id) => {
    await supabase.from('sales_orders').update({status:'cancelled'}).eq('id',id);
    setOrders(prev=>prev.map(o=>o.id===id?{...o,status:'cancelled'}:o));
  };

  const STATUS_STYLE: Record<string,any> = {
    draft:     {background:'#E5E7EB',color:'#374151'},
    sent:      {background:T.blueLight,color:T.blue},
    paid:      {background:T.greenLight,color:T.green},
    cancelled: {background:T.redLight,color:T.red},
  };
  const STATUS_LABEL: Record<string,string> = {
    draft:'📝 ร่าง', sent:'📤 ส่งแล้ว/รอชำระ', paid:'✅ ชำระแล้ว', cancelled:'❌ ยกเลิก'
  };
  const TYPE_LABEL: Record<string,string> = {
    quotation:'ใบเสนอราคา', invoice:'ใบแจ้งหนี้', receipt:'ใบเสร็จ', tax_invoice:'ใบกำกับภาษี'
  };

  return(
    <div>
      <div style={{...S.nav,marginBottom:14}}>
        {[['list','📋 รายการทั้งหมด'],['create','➕ สร้างเอกสารใหม่']].map(([v,l])=>(
          <button key={v} style={nbtn(tab===v)} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>

      {msg&&<div style={{...S.card,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500,marginBottom:12}}>{msg}</div>}

      {tab==='list'&&(
        <div>
          {/* Filter bar */}
          <div style={S.card}>
            <div style={{...S.row,gap:8,flexWrap:'wrap',marginBottom:10}}>
              {[['today','วันนี้'],['this_month','เดือนนี้'],['last_month','เดือนที่แล้ว'],['this_year','ปีนี้'],['month_pick','เลือกเดือน'],['custom','กำหนดเอง']].map(([v,l])=>(
                <button key={v} style={nbtn(filterPeriod===v)} onClick={()=>setFilterPeriod(v)}>{l}</button>
              ))}
            </div>
            <div style={{...S.row,gap:8,flexWrap:'wrap'}}>
              {filterPeriod==='month_pick'&&<input type="month" style={{...S.inp,fontSize:12}} value={quickMonth} onChange={e=>{setQuickMonth(e.target.value);setFilterPeriod('month_pick');}}/>}
              {filterPeriod==='custom'&&<><input type="date" style={{...S.inp,fontSize:12}} value={customStart} onChange={e=>setCustomStart(e.target.value)}/><span style={{fontSize:12,color:T.textMuted}}>ถึง</span><input type="date" style={{...S.inp,fontSize:12}} value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></>}
              <select style={{...S.inp,fontSize:12}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="all">ทุกสถานะ</option>
                {Object.entries(STATUS_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <select style={{...S.inp,fontSize:12}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="all">ทุกประเภท</option>
                {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Summary KPIs */}
          <div style={S.kgrid}>
            <KPI label="ชำระแล้ว" value={'฿'+fmt(summary.totalRevenue)} sub={summary.paidCount+' ใบ'} icon="✅" bg={T.greenLight} color={T.green}/>
            <KPI label="รอชำระ"   value={'฿'+fmt(summary.totalPending)} sub={summary.pendingCount+' ใบ'} icon="📤" bg={T.blueLight}  color={T.blue}/>
            <KPI label="ร่าง"     value={summary.draftCount+' ใบ'} icon="📝" bg={T.grayLight} color={T.gray}/>
            <KPI label="รวมทั้งหมด" value={filtered.length+' ใบ'} icon="📋" bg={T.grayLight} color={T.dark}/>
          </div>

          {/* Orders table */}
          {loading?<div style={{textAlign:'center',padding:40,color:T.textMuted}}>⏳ กำลังโหลด...</div>:(
            <div style={S.card}>
              <div style={S.cardTitle}>📋 รายการเอกสาร ({filtered.length} รายการ)</div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>
                    {['เลขที่','ประเภท','ลูกค้า','วันที่','กำหนดชำระ','มูลค่า','สถานะ','จัดการ'].map((h,i)=>(
                      <th key={i} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.length===0
                      ?<tr><td colSpan={8} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:32}}>ไม่มีเอกสารในช่วงเวลานี้</td></tr>
                      :filtered.map((o,i)=>(
                        <tr key={o.id}>
                          <td style={{...tdr(i),color:T.blue,fontWeight:600,whiteSpace:'nowrap'}}>{o.doc_number}</td>
                          <td style={{...tdr(i),fontSize:11}}>{TYPE_LABEL[o.doc_type]||o.doc_type}</td>
                          <td style={tdr(i)}>{o.customer_name||'-'}</td>
                          <td style={{...tdr(i),fontSize:11,whiteSpace:'nowrap'}}>{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                          <td style={{...tdr(i),fontSize:11,whiteSpace:'nowrap'}}>{o.due_date?new Date(o.due_date).toLocaleDateString('th-TH'):'-'}</td>
                          <td style={{...tdr(i),fontWeight:500}}>฿{fmt(o.total)}</td>
                          <td style={tdr(i)}>
                            <span style={{...STATUS_STYLE[o.status]||{},borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:500,whiteSpace:'nowrap'}}>
                              {STATUS_LABEL[o.status]||o.status}
                            </span>
                          </td>
                          <td style={tdr(i)}>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                              <button style={btn('dk',{padding:'3px 8px',fontSize:11})} onClick={()=>printDoc(o)} title="พิมพ์">🖨️</button>
                              <button style={btn('out',{padding:'3px 8px',fontSize:11})} onClick={()=>printDoc(o,true)} title="สำเนา">สำเนา</button>
                              <button style={btn('am',{padding:'3px 8px',fontSize:11})} onClick={()=>openEdit(o)} title="แก้ไขเอกสาร">✏️ แก้ไข</button>
                              {o.status==='draft'&&<button style={btn('bl',{padding:'3px 8px',fontSize:11})} onClick={()=>{supabase.from('sales_orders').update({status:'sent'}).eq('id',o.id).then(()=>setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:'sent'}:x)));setMsg('✅ อัพเดทสถานะแล้ว');}}>ส่งแล้ว</button>}
                              {o.status==='sent'&&<button style={btn('gr',{padding:'3px 8px',fontSize:11})} onClick={()=>markPaid(o)}>💰 ชำระแล้ว</button>}
                              {o.status==='paid'&&<button style={btn('dk',{padding:'3px 8px',fontSize:11})} onClick={()=>printDoc({...o,doc_type:'tax_invoice'})}>ใบกำกับ</button>}
                              {['draft','sent'].includes(o.status)&&<button style={btn('rd',{padding:'3px 8px',fontSize:11})} onClick={()=>cancelOrder(o.id)}>ยกเลิก</button>}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Edit Document Modal ─────────────────────────── */}
      {editOrder&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'16px 12px',overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:T.radius,width:'100%',maxWidth:860,boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}}>
            <div style={{background:T.dark,color:'#fff',padding:'14px 20px',borderRadius:`${T.radius}px ${T.radius}px 0 0`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,letterSpacing:'0.06em'}}>✏️ แก้ไขเอกสาร</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:2}}>{editOrder.doc_number} · {TYPE_LABEL[editOrder.doc_type]||editOrder.doc_type}</div>
              </div>
              <button onClick={()=>setEditOrder(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:28,height:28,borderRadius:4,cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:20}}>
              {editOrder.status==='paid'&&(
                <div style={{background:'#FEF3C7',border:'1px solid #FCD34D',borderRadius:T.radius,padding:'8px 12px',marginBottom:14,fontSize:12,color:'#B45309'}}>
                  ⚠️ เอกสารนี้ชำระแล้ว การแก้ไขจะมีผลกับการ reprint เท่านั้น ไม่กระทบสต็อก
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'8px 12px',marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ประเภทเอกสาร</div>
                  <select style={{...S.inp,width:'100%'}} value={editDocType} onChange={e=>setEditDocType(e.target.value)}>
                    {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>กำหนดชำระ</div>
                  <input type="date" style={{...S.inp,width:'100%'}} value={editDueDate} onChange={e=>setEditDueDate(e.target.value)}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>พนักงานขาย</div>
                  <input style={{...S.inp,width:'100%'}} value={editStaff} onChange={e=>setEditStaff(e.target.value)}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 12px',marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ชื่อลูกค้า</div>
                  <input style={{...S.inp,width:'100%'}} value={editCustName} onChange={e=>setEditCustName(e.target.value)}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>เลขผู้เสียภาษีลูกค้า</div>
                  <input style={{...S.inp,width:'100%'}} value={editCustTax} onChange={e=>setEditCustTax(e.target.value)}/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ที่อยู่ลูกค้า</div>
                  <textarea style={{...S.inp,width:'100%',height:56,resize:'vertical'}} value={editCustAddr} onChange={e=>setEditCustAddr(e.target.value)}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>เพิ่มสินค้า</div>
                <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า/SKU" value={editKw} onChange={e=>setEditKw(e.target.value)}/>
                {editKw.trim()&&PR.filter(p=>{const w=editKw.toLowerCase().split(' ');return w.every(x=>(p[0]+' '+p[1]).toLowerCase().includes(x));}).slice(0,8).map(p=>(
                  <button key={p[0]} style={{margin:'4px 4px 0 0',padding:'4px 9px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:11}} onClick={()=>{
                    setEditItems(items=>{const ex=items.find(x=>x.sku===p[0]);if(ex)return items.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);return[...items,{sku:p[0],name:p[1],cat:p[2],qty:1,sell:p[3],unit_price:p[3],discount_pct:0,cost:stock[p[0]]?.cost||p[4]}];});setEditKw('');
                  }}>{p[1]} <span style={{color:T.green}}>฿{fmt(p[3])}</span></button>
                ))}
              </div>
              <div style={{...S.tow,marginBottom:12}}>
                <table style={S.tbl}>
                  <thead><tr>{['ชื่อสินค้า','ราคา/หน่วย','ส่วนลด%','จำนวน','รวม',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {editItems.map((it,i)=>(
                      <tr key={i}>
                        <td style={tdr(i)}><div style={{fontWeight:500}}>{it.name}</div><div style={{fontSize:10,color:T.textMuted}}>{it.sku}</div></td>
                        <td style={tdr(i)}><input type="number" min="0" step="0.01" style={{...S.inp,width:80,padding:'3px 6px'}} value={it.sell||0} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,sell:parseFloat(e.target.value)||0}:x))}/></td>
                        <td style={tdr(i)}><input type="number" min="0" max="100" style={{...S.inp,width:58,padding:'3px 6px'}} value={it.discount_pct||0} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,discount_pct:parseFloat(e.target.value)||0}:x))}/></td>
                        <td style={tdr(i)}><input type="number" min="1" style={{...S.inp,width:56,padding:'3px 6px',textAlign:'center'}} value={it.qty||1} onChange={e=>setEditItems(items=>items.map((x,j)=>j===i?{...x,qty:Math.max(1,parseInt(e.target.value)||1)}:x))}/></td>
                        <td style={{...tdr(i),fontWeight:500}}>฿{fmt((it.sell||0)*(it.qty||1)*(1-(it.discount_pct||0)/100))}</td>
                        <td style={tdr(i)}><button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:18}} onClick={()=>setEditItems(items=>items.filter((_,j)=>j!==i))}>×</button></td>
                      </tr>
                    ))}
                    {!editItems.length&&<tr><td colSpan={6} style={{padding:20,textAlign:'center',color:T.textMuted,fontSize:12}}>ไม่มีรายการ</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px',marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>ส่วนลดรวม (฿)</div>
                  <input type="number" min="0" style={{...S.inp,width:'100%'}} value={editDisc} onChange={e=>setEditDisc(e.target.value)} placeholder="0"/>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:8,marginBottom:3}}>หมายเหตุ</div>
                  <input style={{...S.inp,width:'100%'}} value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="หมายเหตุ..."/>
                </div>
                <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px'}}>
                  {(()=>{const disc=parseFloat(editDisc)||0;const sub=editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||1)*(1-(x.discount_pct||0)/100),0);const afterD=Math.max(0,sub-disc);const vat=editOrder.vat_amount>0?afterD*0.07:0;const total=afterD+vat;return(<>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0'}}><span>ราคารวม</span><span>฿{fmt(sub)}</span></div>
                    {disc>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:T.red,padding:'2px 0'}}><span>ส่วนลด</span><span>-฿{fmt(disc)}</span></div>}
                    {vat>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:T.amber,padding:'2px 0'}}><span>VAT 7%</span><span>฿{fmt(vat)}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:18,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}><span>รวม</span><span>฿{fmt(total)}</span></div>
                  </>);})()}
                </div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button style={btn('gy')} onClick={()=>setEditOrder(null)}>ยกเลิก</button>
                <button style={btn('dk')} onClick={()=>{const disc=parseFloat(editDisc)||0;const sub=editItems.reduce((s,x)=>s+(x.sell||0)*(x.qty||1)*(1-(x.discount_pct||0)/100),0);const afterD=Math.max(0,sub-disc);const vat=editOrder.vat_amount>0?afterD*0.07:0;const total=afterD+vat;printDoc({...editOrder,doc_type:editDocType,customer_name:editCustName,customer_address:editCustAddr,customer_tax_id:editCustTax,items:editItems,subtotal:sub,discount_amount:disc,after_discount:afterD,vat_amount:vat,total,note:editNote,due_date:editDueDate,staff_name:editStaff});}}>🖨️ Preview</button>
                <button style={btn('gr')} onClick={saveEdit} disabled={editSaving}>{editSaving?'กำลังบันทึก...':'💾 บันทึก + พิมพ์'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab==='create'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,320px)',gap:12}}>
            <div>
              {/* Doc type selector */}
              <div style={S.card}>
                <div style={S.cardTitle}>📄 ประเภทเอกสาร</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {Object.entries(TYPE_LABEL).map(([v,l])=>(
                    <button key={v} style={{
                      ...nbtn(docType===v),
                      padding:'8px 16px',
                      background:docType===v?T.dark:'transparent',
                      color:docType===v?'#EFF7F3':T.text,
                      borderRadius:T.radius,
                    }} onClick={()=>setDocType(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Search products */}
              <div style={S.card}>
                <div style={S.cardTitle}>🔍 ค้นหาสินค้า</div>
                <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า/SKU" value={kw} onChange={e=>setKw(e.target.value)} autoComplete="off"/>
                {sugs.length>0&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                    {sugs.map(p=>(
                      <button key={p[0]} style={{padding:'5px 10px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:12}} onClick={()=>addToCart(p)}>
                        <span style={{fontWeight:600}}>{p[1]}</span>
                        <span style={{color:T.green,marginLeft:4,fontSize:11}}>({stock[p[0]]?.qty||0})</span>
                        <span style={{color:T.textMuted,marginLeft:4}}>฿{fmt(p[3])}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              {cart.length>0&&(
                <div style={S.card}>
                  <div style={S.cardTitle}>🛒 รายการสินค้า</div>
                  <div style={S.tow}>
                    <table style={S.tbl}>
                      <thead><tr>{['ชื่อสินค้า','ราคา/หน่วย','ส่วนลด %','จำนวน','รวม',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {cart.map((x,i)=>(
                          <tr key={x.sku}>
                            <td style={tdr(i)}>
                              <div style={{fontWeight:500}}>{x.name}</div>
                              <div style={{fontSize:10,color:T.textMuted}}>{x.sku}</div>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="0" step="0.01" style={{...S.inp,width:85,padding:'3px 6px'}} value={x.sell}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,sell:parseFloat(e.target.value)||0}:it))}/>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="0" max="100" step="0.5" style={{...S.inp,width:65,padding:'3px 6px'}} value={x.discount_pct}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,discount_pct:parseFloat(e.target.value)||0}:it))}/>
                            </td>
                            <td style={tdr(i)}>
                              <input type="number" min="1" style={{...S.inp,width:60,padding:'3px 6px',textAlign:'center'}} value={x.qty}
                                onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,qty:Math.max(1,parseInt(e.target.value)||1)}:it))}/>
                            </td>
                            <td style={{...tdr(i),fontWeight:500}}>฿{fmt(x.sell*x.qty*(1-x.discount_pct/100))}</td>
                            <td style={tdr(i)}><button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:18}} onClick={()=>setCart(c=>c.filter(it=>it.sku!==x.sku))}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div>
              <div style={S.card}>
                <div style={S.cardTitle}>💰 สรุป & ข้อมูลเอกสาร</div>

                {/* Totals */}
                <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12}}>
                  {[['ราคารวม','฿'+fmt(subtotal)],['ส่วนลด',disc>0?'-฿'+fmt(disc):'-'],['ก่อน VAT','฿'+fmt(afterD)]].map(([l,v],i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0',color:l==='ส่วนลด'&&disc>0?T.red:T.text}}><span>{l}</span><span>{v}</span></div>
                  ))}
                  {useVat&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'2px 0',color:T.amber}}><span>VAT 7%</span><span>฿{fmt(vatAmt)}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:18,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}><span>ยอดรวม</span><span>฿{fmt(grand)}</span></div>
                </div>

                {/* VAT toggle */}
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:10,fontSize:12}}>
                  <input type="checkbox" checked={useVat} onChange={e=>setUseVat(e.target.checked)} style={{width:15,height:15}}/>
                  <span>คิด VAT 7%</span>
                </label>

                {/* Discount */}
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ส่วนลดรวม (฿)</div>
                <input type="number" min="0" style={{...S.inp,width:'100%',marginBottom:8}} placeholder="0" value={discAmt} onChange={e=>setDiscAmt(e.target.value)}/>

                {/* Customer */}
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ลูกค้า</div>
                <CustomerSearch value={customer} onSelect={c=>{setCustomer(c);setCustAddr(c.address||'');}}/>

                <div style={{fontSize:12,color:T.textMuted,marginBottom:3,marginTop:8}}>เลขผู้เสียภาษีลูกค้า</div>
                <input style={{...S.inp,width:'100%',marginBottom:6}} placeholder="0-0000-00000-00-0" value={custTaxId} onChange={e=>setCustTaxId(e.target.value)}/>

                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ที่อยู่ลูกค้า</div>
                <textarea style={{...S.inp,width:'100%',height:60,resize:'vertical',marginBottom:6}} placeholder="ที่อยู่สำหรับใบเอกสาร" value={custAddr} onChange={e=>setCustAddr(e.target.value)}/>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                  <div>
                    <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>กำหนดชำระ</div>
                    <input type="date" style={{...S.inp,width:'100%'}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>พนักงานขาย</div>
                    <select style={{...S.inp,width:'100%'}} value={staffName} onChange={e=>setStaffName(e.target.value)}>
                      <option value="">— ไม่ระบุ —</option>
                      {staff.map((s:any)=><option key={s.id} value={s.name}>{s.name} ({s.commission_type==='percent_revenue'?s.commission_rate+'% ยอดขาย':s.commission_type==='percent_profit'?s.commission_rate+'% กำไร':'฿'+s.commission_rate+'/ออเดอร์'})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>เอกสารอ้างอิง</div>
                <input style={{...S.inp,width:'100%',marginBottom:6}} placeholder="เช่น QT-xxx" value={refDoc} onChange={e=>setRefDoc(e.target.value)}/>

                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>หมายเหตุ</div>
                <input style={{...S.inp,width:'100%',marginBottom:12}} placeholder="หมายเหตุ..." value={orderNote} onChange={e=>setOrderNote(e.target.value)}/>

                {/* Action buttons */}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <button style={{...btn('dk'),width:'100%',padding:'11px 0'}} onClick={()=>createOrder('draft')} disabled={saving||!cart.length}>
                    📝 บันทึกร่าง + พิมพ์{' '}{TYPE_LABEL[docType]}
                  </button>
                  <button style={{...btn('bl'),width:'100%',padding:'11px 0'}} onClick={()=>createOrder('sent')} disabled={saving||!cart.length}>
                    📤 ส่งลูกค้าแล้ว (รอชำระ)
                  </button>
                  <button style={{...btn('gr'),width:'100%',padding:'11px 0'}} onClick={()=>createOrder('paid')} disabled={saving||!cart.length}>
                    ✅ ชำระแล้ว + ตัดสต็อก + พิมพ์ใบเสร็จ
                  </button>
                </div>
                {saving&&<div style={{marginTop:8,fontSize:12,color:T.textMuted}}>⏳ กำลังบันทึก...</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════
// SETTINGS PAGE — Permission Matrix + System Settings
// ════════════════════════════════════════════════════════
const ROLE_LIST = [
  {v:'admin',      l:'👑 Admin',          desc:'ดูแลระบบทั้งหมด'},
  {v:'manager',    l:'📊 Manager',        desc:'ผู้จัดการ เห็นทุกอย่างยกเว้นตั้งค่า user'},
  {v:'sales',      l:'💰 Sales',          desc:'ทีมขาย บันทึกบิล ดูสต็อก'},
  {v:'warehouse',  l:'📦 Warehouse',      desc:'คลังสินค้า จัดการสต็อก'},
  {v:'production', l:'🏭 Production',     desc:'ฝ่ายผลิต ดูแผนผลิตและสต็อก'},
  {v:'accounting', l:'🧾 Accounting',     desc:'บัญชี ดูรายงานและกำไร'},
  {v:'viewer',     l:'👁️ Viewer',          desc:'ดูข้อมูลอย่างเดียว'},
];

const PAGE_LIST = [
  {v:'dashboard', l:'📊 Dashboard & รายงาน'},
  {v:'stock',     l:'📦 สต็อก'},
  {v:'products',  l:'🏷️ สินค้า'},
  {v:'sales',     l:'💰 บันทึกขาย'},
  {v:'orders',    l:'📋 ใบเสนอราคา/ใบแจ้งหนี้/ใบเสร็จ'},
  {v:'plan',      l:'🏭 แผนผลิต'},
  {v:'po',        l:'🛒 สั่งซื้อ (PO)'},
  {v:'users',     l:'👥 จัดการผู้ใช้'},
  {v:'settings',  l:'⚙️ ตั้งค่าระบบ'},
];

const PERM_COLS = [
  {v:'can_view',   l:'ดูได้',     color:'#1D4ED8'},
  {v:'can_edit',   l:'แก้ไขได้',  color:'#15803D'},
  {v:'see_cost',   l:'เห็นต้นทุน',color:'#B45309'},
  {v:'see_profit', l:'เห็นกำไร',  color:'#7C3AED'},
];

function SettingsPage({permissions, setPermissions, profile}){
  const [selRole, setSelRole] = useState('sales');
  const [matrix,  setMatrix]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [activeTab, setActiveTab] = useState('permissions');

  // LINE settings
  const [lineToken,  setLineToken]  = useState(()=>localStorage.getItem('line_bot_token')||'');
  const [lineGroups, setLineGroups] = useState([]);
  const [lineMsg,    setLineMsg]    = useState('');
  const [testingLine,setTestingLine]= useState(false);
  const [newGroup,   setNewGroup]   = useState({group_id:'',name:'',roles:['admin'],notify_stock:true,notify_sales:true,notify_daily:true});

  // Company settings
  const [company, setCompany] = useState({
    name:   'บริษัท สันติพาณิชย์ โรสเตอร์ จำกัด',
    address:'29/35 หมู่ที่ 6 ตำบลโคกแย้ อำเภอหนองแค จังหวัดสระบุรี 18230',
    tel:    '095-356-2974',
    tax_id: '0195561000941',
  });

  useEffect(()=>{
    loadMatrix();
    loadLineGroups();
  },[]);

  const loadLineGroups = async () => {
    const {data} = await supabase.from('line_groups').select('*').order('name');
    setLineGroups(data||[]);
  };

  const saveLineGroup = async () => {
    if(!newGroup.group_id||!newGroup.name){setLineMsg('❌ กรอก Group ID และชื่อ');return;}
    const {error} = await supabase.from('line_groups').upsert([newGroup],{onConflict:'group_id'});
    if(error){setLineMsg('❌ '+error.message);return;}
    setLineMsg('✅ บันทึก Group เรียบร้อย');
    setNewGroup({group_id:'',name:'',roles:['admin'],notify_stock:true,notify_sales:true,notify_daily:true});
    loadLineGroups();
  };

  const testPush = async () => {
    const token = localStorage.getItem('line_bot_token')||lineToken;
    if(!token){setLineMsg('❌ ยังไม่ได้ใส่ Channel Access Token');return;}
    if(!lineGroups.length){setLineMsg('❌ ยังไม่มี Group ที่ตั้งค่าไว้');return;}
    setTestingLine(true); setLineMsg('');
    const g = lineGroups[0];
    try {
      const res = await fetch(`${(await supabase.auth.getSession()).data.session?.access_token?'':''}`);
      setLineMsg('⚠️ ต้อง Deploy Edge Function ก่อน — ดูขั้นตอนในคู่มือ');
    } catch(e) {
      setLineMsg('⚠️ ต้อง Deploy Edge Function ก่อน — ดูขั้นตอนในคู่มือ');
    }
    setTestingLine(false);
  };

  const loadMatrix = async () => {
    setLoading(true);
    const {data} = await supabase.from('role_permissions').select('*');
    const m = {};
    (data||[]).forEach(p=>{
      if(!m[p.role]) m[p.role]={};
      m[p.role][p.page_id] = p;
    });
    setMatrix(m);
    setLoading(false);
  };

  const togglePerm = (role, page, col) => {
    if(role==='admin') return; // admin ล็อคไว้
    setMatrix(prev=>{
      const cur = prev[role]?.[page]?.[col]||false;
      return {
        ...prev,
        [role]:{
          ...prev[role],
          [page]:{
            ...(prev[role]?.[page]||{}),
            [col]:!cur,
            // ถ้า can_view = false ให้ปิดอันอื่นด้วย
            ...(!cur===false && col==='can_view' ? {can_edit:false,see_cost:false,see_profit:false} : {}),
          }
        }
      };
    });
  };

  const saveMatrix = async () => {
    setSaving(true); setMsg('');
    const upserts = [];
    for(const [role, pages] of Object.entries(matrix)){
      if(role==='admin') continue;
      for(const [page_id, perms] of Object.entries(pages)){
        upserts.push({
          role, page_id,
          can_view:   perms.can_view   || false,
          can_edit:   perms.can_edit   || false,
          see_cost:   perms.see_cost   || false,
          see_profit: perms.see_profit || false,
          updated_at: new Date().toISOString(),
        });
      }
    }
    const {error} = await supabase.from('role_permissions').upsert(upserts,{onConflict:'role,page_id'});
    if(error){ setMsg('❌ '+error.message); setSaving(false); return; }
    setMsg('✅ บันทึกสิทธิ์เรียบร้อย มีผลทันทีกับทุก user ใน role นี้');
    setSaving(false);
    // Reload permissions for current user
    const {data:myPerms} = await supabase.from('role_permissions').select('*').eq('role',profile.role);
    const pm={};
    (myPerms||[]).forEach(p=>{pm[p.page_id]=p;});
    setPermissions(pm);
  };

  const getPerm = (role, page, col) => {
    if(role==='admin') return true;
    return matrix[role]?.[page]?.[col] || false;
  };

  if(loading) return <div style={{padding:40,textAlign:'center',color:T.textMuted}}>⏳ กำลังโหลด...</div>;

  return(
    <div>
      {/* Sub-tabs */}
      <div style={{...S.nav,marginBottom:14}}>
        {[['permissions','🔐 จัดการสิทธิ์'],['line','💬 LINE Bot'],['company','🏢 ข้อมูลบริษัท']].map(([v,l])=>(
          <button key={v} style={nbtn(activeTab===v)} onClick={()=>setActiveTab(v)}>{l}</button>
        ))}
      </div>

      {activeTab==='permissions'&&(
        <div>
          {msg&&<div style={{...S.card,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500,marginBottom:12}}>{msg}</div>}

          {/* Role selector */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔐 Matrix สิทธิ์การใช้งาน</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              {ROLE_LIST.map(r=>(
                <button key={r.v} style={{
                  ...nbtn(selRole===r.v),
                  padding:'8px 14px',
                  background: selRole===r.v ? T.dark : 'transparent',
                  color: selRole===r.v ? '#EFF7F3' : T.text,
                  borderRadius: T.radius,
                  fontSize:12,
                }} onClick={()=>setSelRole(r.v)}>
                  {r.l}
                </button>
              ))}
            </div>

            {/* Role description */}
            <div style={{padding:'8px 12px',background:T.blueLight,borderRadius:T.radius,fontSize:12,color:T.blue,marginBottom:14}}>
              {ROLE_LIST.find(r=>r.v===selRole)?.desc}
              {selRole==='admin'&&' — สิทธิ์ Admin ล็อคไว้ ไม่สามารถแก้ไขได้'}
            </div>

            {/* Permission matrix table */}
            <div style={S.tow}>
              <table style={{...S.tbl,fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{...S.th,minWidth:160}}>หน้า</th>
                    {PERM_COLS.map(c=>(
                      <th key={c.v} style={{...S.th,textAlign:'center',minWidth:90}}>
                        <div style={{color:c.color==='#1D4ED8'?'#93C5FD':c.color==='#15803D'?'#86EFAC':c.color==='#B45309'?'#FCD34D':'#C4B5FD'}}>{c.l}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAGE_LIST.map((page,i)=>(
                    <tr key={page.v}>
                      <td style={{...tdr(i),fontWeight:500}}>{page.l}</td>
                      {PERM_COLS.map(col=>{
                        const val = getPerm(selRole, page.v, col.v);
                        const canView = getPerm(selRole, page.v, 'can_view');
                        const disabled = selRole==='admin' || (col.v!=='can_view'&&!canView);
                        return(
                          <td key={col.v} style={{...tdr(i),textAlign:'center'}}>
                            <label style={{cursor:disabled?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                              <input type="checkbox"
                                checked={val}
                                disabled={disabled}
                                onChange={()=>!disabled&&togglePerm(selRole,page.v,col.v)}
                                style={{width:16,height:16,cursor:disabled?'not-allowed':'pointer',accentColor:col.color}}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{display:'flex',gap:16,marginTop:10,flexWrap:'wrap'}}>
              {PERM_COLS.map(c=>(
                <div key={c.v} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.textMuted}}>
                  <div style={{width:12,height:12,borderRadius:2,background:c.color}}/>
                  <span><b style={{color:c.color}}>{c.l}</b></span>
                </div>
              ))}
              <div style={{fontSize:11,color:T.textMuted}}>| ⚠️ ต้องติ๊ก "ดูได้" ก่อน ถึงจะเปิดอันอื่นได้</div>
            </div>

            {selRole!=='admin'&&(
              <div style={{marginTop:14}}>
                <button style={btn('gr')} onClick={saveMatrix} disabled={saving}>
                  {saving?'กำลังบันทึก...':'💾 บันทึกสิทธิ์ทั้งหมด'}
                </button>
              </div>
            )}
          </div>

          {/* All roles overview */}
          <div style={S.card}>
            <div style={S.cardTitle}>📋 ภาพรวมสิทธิ์ทุก Role</div>
            <div style={S.tow}>
              <table style={{...S.tbl,fontSize:11}}>
                <thead>
                  <tr>
                    <th style={S.th}>หน้า</th>
                    {ROLE_LIST.map(r=><th key={r.v} style={{...S.th,textAlign:'center'}}>{r.l.split(' ')[0]}<br/>{r.l.split(' ').slice(1).join(' ')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PAGE_LIST.map((page,i)=>(
                    <tr key={page.v}>
                      <td style={{...tdr(i),fontWeight:500}}>{page.l}</td>
                      {ROLE_LIST.map(role=>{
                        const v = getPerm(role.v,page.v,'can_view');
                        const e = getPerm(role.v,page.v,'can_edit');
                        const c = getPerm(role.v,page.v,'see_cost');
                        const p = getPerm(role.v,page.v,'see_profit');
                        return(
                          <td key={role.v} style={{...tdr(i),textAlign:'center'}}>
                            {!v ? <span style={{color:T.textMuted,fontSize:12}}>—</span> : (
                              <div style={{fontSize:10,lineHeight:1.6}}>
                                {v&&<span style={{color:T.blue}}>ดู </span>}
                                {e&&<span style={{color:T.green}}>แก้ </span>}
                                {c&&<span style={{color:T.amber}}>ทุน </span>}
                                {p&&<span style={{color:'#7C3AED'}}>กำไร</span>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab==='line'&&(
        <div>
          {lineMsg&&<div style={{...S.card,background:lineMsg.startsWith('✅')?T.greenLight:lineMsg.startsWith('⚠️')?T.amberLight:T.redLight,color:lineMsg.startsWith('✅')?T.green:lineMsg.startsWith('⚠️')?T.amber:T.red,fontWeight:500,marginBottom:12}}>{lineMsg}</div>}

          {/* Channel Access Token */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔑 Channel Access Token</div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:8,lineHeight:1.7}}>
              ดูได้จาก LINE Developers Console → Channel → Messaging API → Channel access token
            </div>
            <div style={{display:'flex',gap:8}}>
              <input type="password" style={{...S.inp,flex:1}} placeholder="Channel access token..."
                value={lineToken} onChange={e=>setLineToken(e.target.value)}/>
              <button style={btn('dk')} onClick={()=>{localStorage.setItem('line_bot_token',lineToken);setLineMsg('✅ บันทึก Token แล้ว');}}>บันทึก</button>
            </div>
          </div>

          {/* Webhook setup guide */}
          <div style={S.card}>
            <div style={S.cardTitle}>⚙️ ขั้นตอนตั้งค่า Webhook</div>
            <div style={{background:T.blueLight,borderRadius:T.radius,padding:'12px 14px',fontSize:12,color:T.blue,lineHeight:2}}>
              <b>1. Deploy Edge Function ใน Supabase:</b><br/>
              &nbsp;&nbsp;Terminal → <code style={{background:'#fff',padding:'1px 6px',borderRadius:4}}>supabase functions deploy line-bot</code><br/>
              <b>2. ตั้งค่า Environment Variables:</b><br/>
              &nbsp;&nbsp;Supabase Dashboard → Settings → Edge Functions → Add:<br/>
              &nbsp;&nbsp;<code style={{background:'#fff',padding:'1px 6px',borderRadius:4}}>LINE_CHANNEL_ACCESS_TOKEN</code> = token ของคุณ<br/>
              &nbsp;&nbsp;<code style={{background:'#fff',padding:'1px 6px',borderRadius:4}}>LINE_CHANNEL_SECRET</code> = secret ของคุณ<br/>
              <b>3. ตั้งค่า Webhook URL ใน LINE Developers:</b><br/>
              &nbsp;&nbsp;<code style={{background:'#fff',padding:'1px 6px',borderRadius:4,wordBreak:'break-all'}}>https://[project-id].supabase.co/functions/v1/line-bot</code><br/>
              <b>4. เปิดใช้ Webhook</b> และกด Verify ใน LINE Developers Console
            </div>
          </div>

          {/* LINE Groups */}
          <div style={S.card}>
            <div style={S.cardTitle}>👥 กลุ่ม LINE สำหรับแจ้งเตือน</div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:10,lineHeight:1.7}}>
              เพิ่ม Bot เข้า group LINE → พิมพ์ "help" ใน group → Bot จะตอบพร้อมแสดง Group ID ให้
            </div>

            {/* Add group form */}
            <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 12px',marginBottom:8}}>
                <div>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>Group ID</div>
                  <input style={{...S.inp,width:'100%'}} placeholder="C1234567890abcdef..."
                    value={newGroup.group_id} onChange={e=>setNewGroup(g=>({...g,group_id:e.target.value}))}/>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ชื่อ Group</div>
                  <input style={{...S.inp,width:'100%'}} placeholder="เช่น กลุ่มทีมขาย"
                    value={newGroup.name} onChange={e=>setNewGroup(g=>({...g,name:e.target.value}))}/>
                </div>
              </div>
              <div style={{...S.row,gap:16,marginBottom:8,fontSize:12}}>
                {[['notify_stock','🔔 สต็อกหมด'],['notify_sales','💰 ยอดขาย'],['notify_daily','📊 รายวัน']].map(([k,l])=>(
                  <label key={k} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
                    <input type="checkbox" checked={newGroup[k]} onChange={e=>setNewGroup(g=>({...g,[k]:e.target.checked}))}/>
                    {l}
                  </label>
                ))}
              </div>
              <button style={btn('dk',{fontSize:12})} onClick={saveLineGroup}>➕ เพิ่ม Group</button>
            </div>

            {/* Groups list */}
            {lineGroups.length>0&&(
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>{['ชื่อ Group','Group ID','แจ้งเตือน','สถานะ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>{lineGroups.map((g,i)=>(
                    <tr key={g.id}>
                      <td style={{...tdr(i),fontWeight:500}}>{g.name}</td>
                      <td style={{...tdr(i),fontSize:10,color:T.textMuted}}>{g.group_id}</td>
                      <td style={tdr(i)}>
                        {g.notify_stock&&<span style={{...bdg('ok'),marginRight:4,fontSize:10}}>สต็อก</span>}
                        {g.notify_sales&&<span style={{...bdg('ok'),marginRight:4,fontSize:10}}>ยอดขาย</span>}
                        {g.notify_daily&&<span style={{...bdg('ok'),fontSize:10}}>รายวัน</span>}
                      </td>
                      <td style={tdr(i)}><span style={bdg(g.active?'ok':'out')}>{g.active?'ใช้งาน':'ปิด'}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* Link LINE account */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔗 ผูก LINE ID กับบัญชีผู้ใช้</div>
            <div style={{fontSize:12,color:T.textMuted,lineHeight:1.7}}>
              ทีมงานแต่ละคนผูก LINE ได้โดย:<br/>
              1. เพิ่ม <b>สันติพาณิชย์ Bot</b> เป็นเพื่อนใน LINE<br/>
              2. พิมพ์ <code style={{background:T.grayLight,padding:'1px 6px',borderRadius:4}}>/link [อีเมลที่ใช้ login]</code><br/>
              3. ระบบจะผูก LINE ID กับบัญชีและส่งแจ้งเตือนตาม Role อัตโนมัติ
            </div>
          </div>
        </div>
      )}

      {activeTab==='company'&&(
        <div style={S.card}>
          <div style={S.cardTitle}>🏢 ข้อมูลบริษัท (แสดงในใบเสร็จ/ใบกำกับภาษี)</div>
          {[
            ['name',    'ชื่อบริษัท'],
            ['address', 'ที่อยู่'],
            ['tel',     'เบอร์โทรศัพท์'],
            ['tax_id',  'เลขประจำตัวผู้เสียภาษี'],
          ].map(([k,l])=>(
            <div key={k} style={{marginBottom:12}}>
              <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>{l}</div>
              <input style={{...S.inp,width:'100%'}} value={company[k]} onChange={e=>setCompany(c=>({...c,[k]:e.target.value}))}/>
            </div>
          ))}
          <div style={{padding:'10px 14px',background:T.amberLight,borderRadius:T.radius,fontSize:12,color:T.amber,marginBottom:14}}>
            ⚠️ การแก้ไขข้อมูลบริษัทตรงนี้จะมีผลกับใบเสร็จที่ออกหลังจากนี้เท่านั้น และจะถูก reset เมื่อ deploy ใหม่ หากต้องการให้ถาวรต้องแก้ในไฟล์ App.jsx
          </div>
          <button style={btn('gr')} onClick={()=>{
            // Update COMPANY object in memory
            window.__COMPANY__ = company;
            setMsg('✅ อัพเดทข้อมูลบริษัทแล้ว (ชั่วคราว)');
          }}>💾 บันทึก</button>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════
// INVENTORY PAGE — สต็อก & สินค้า (sub-tabs)
// ════════════════════════════════════════════════════════
function InventoryPage({products,setProducts,stock,setStock,can}){
  const [sub,setSub] = useState('stock');
  return(
    <div>
      <div style={{display:'flex',gap:6,marginBottom:12,background:T.white,padding:'5px',borderRadius:T.radius,border:`1px solid ${T.border}`}}>
        {can('stock')   &&<button style={{...nbtn(sub==='stock'),flex:1,textAlign:'center'}} onClick={()=>setSub('stock')}>📦 สต็อก</button>}
        {can('products')&&<button style={{...nbtn(sub==='products'),flex:1,textAlign:'center'}} onClick={()=>setSub('products')}>🏷️ สินค้า</button>}
      </div>
      {sub==='stock'    &&can('stock')    &&<StockPage    stock={stock} setStock={setStock} canEdit={can('stock','can_edit')} seeCost={can('stock','see_cost')}/>}
      {sub==='products' &&can('products') &&<ProductPage  products={products} setProducts={setProducts} stock={stock} setStock={setStock} canEdit={can('products','can_edit')}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SELLING PAGE — ขาย & เอกสาร (sub-tabs)
// ════════════════════════════════════════════════════════
function SellingPage({stock,setStock,setSales,sales,staff,can}){
  return(
    <SalesPage
      stock={stock} setStock={setStock} setSales={setSales} sales={sales} staff={staff}
      seeCost={can('sales','see_cost')} seeProfit={can('sales','see_profit')}
    />
  );
}

// ════════════════════════════════════════════════════════
// SUPPLY PAGE — ผลิต & สั่งซื้อ (sub-tabs)
// ════════════════════════════════════════════════════════
function SupplyPage({stock,setStock,sales,products,can}){
  const [sub,setSub] = useState('plan');
  return(
    <div>
      <div style={{display:'flex',gap:6,marginBottom:12,background:T.white,padding:'5px',borderRadius:T.radius,border:`1px solid ${T.border}`}}>
        {can('plan')&&<button style={{...nbtn(sub==='plan'),flex:1,textAlign:'center'}} onClick={()=>setSub('plan')}>🏭 แผนผลิต</button>}
        {can('po')  &&<button style={{...nbtn(sub==='po'),flex:1,textAlign:'center'}} onClick={()=>setSub('po')}>🛒 สั่งซื้อ (PO)</button>}
      </div>
      {sub==='plan'&&can('plan')&&<PlanPage stock={stock} sales={sales}/>}
      {sub==='po'  &&can('po')  &&<POPage  stock={stock} sales={sales} products={products}/>}
    </div>
  );
}


// ════════════════════════════════════════════════════════
// MAIN APP — with Auth
// ════════════════════════════════════════════════════════
export default function App(){
  const [user,setUser]       = useState(null);
  const [profile,setProfile] = useState(null);
  const [permissions,setPermissions] = useState({});
  const [authLoading,setAuthLoading] = useState(true);
  const [tab,setTab]         = useState('report');
  const [products,setProducts] = useState([]);
  const [stock,setStock]     = useState({});
  const [sales,setSales]     = useState([]);
  const [staff,setStaff]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError]     = useState('');

  // Check existing session
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const {data:prof} = await supabase.from('profiles').select('*').eq('id',session.user.id).single();
        if(prof?.active){ setUser(session.user); setProfile(prof); }
        else { await supabase.auth.signOut(); }
      }
      setAuthLoading(false);
    });
    // Listen for auth changes
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==='SIGNED_OUT'){ setUser(null); setProfile(null); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Load data after login
  useEffect(()=>{
    if(!user||!profile) return;
    (async()=>{
      setLoading(true);
      // Load permissions for this role
      const [permRes,prodRes,stRes,staffRes,salRes,soRes] = await Promise.all([
        supabase.from('role_permissions').select('*').eq('role', profile.role),
        supabase.from('products').select('*').order('cat').order('name'),
        supabase.from('stock').select('*'),
        supabase.from('staff').select('*').eq('active',true).order('name'),
        supabase.from('sales').select('*').order('date',{ascending:false}).limit(2000),
        supabase.from('sales_orders').select('*').eq('status','paid').order('created_at',{ascending:false}).limit(2000),
      ]);
      // Build permission map
      const permMap = {};
      (permRes.data||[]).forEach(p=>{ permMap[p.page_id]=p; });
      setPermissions(permMap);

      if(prodRes.error){ setError('โหลดสินค้าไม่ได้: '+prodRes.error.message); setLoading(false); return; }
      const prods = (prodRes.data||[]).map(p=>[p.sku,p.name,p.cat,p.sell,p.cost]);
      buildProductIndex(prods);
      setProducts(prods);

      const sm={};
      (stRes.data||[]).forEach(r=>{ sm[r.sku]={qty:r.qty,safety:r.safety,cost:r.cost}; });
      setStock(sm);
      setStaff(staffRes.data||[]);

      // รวม sales + sales_orders(paid) เข้าด้วยกัน เพื่อให้ Dashboard/Report เห็นทั้งหมด
      const salesData = salRes.data||[];
      const soData = (soRes.data||[]).map(o=>({
        id:              'SO-'+o.id,
        date:            o.created_at,
        items:           (o.items||[]).map((it:any)=>({...it, subtotal: it.subtotal||(it.sell||0)*(it.qty||0)*(1-(it.discount_pct||0)/100)})),
        total:           o.total||0,
        discount_amount: o.discount_amount||0,
        total_after_discount: o.after_discount||o.total||0,
        vat_amount:      o.vat_amount||0,
        total_after_vat: o.total||0,
        note:            o.note||'',
        channel:         'คำสั่งซื้อ',
        customer_id:     o.customer_id,
        customer_name:   o.customer_name||'',
        staff_name:      o.staff_name||'',
        commission_amount: 0,
        _source:         'sales_order',
        _doc_number:     o.doc_number,
        _doc_type:       o.doc_type,
      }));
      setSales([...salesData, ...soData].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      setLoading(false);
    })();
  },[user,profile]);

  const logout = async()=>{
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    setStock({}); setSales([]); setProducts([]);
  };

  const isAdmin = profile?.role==='admin';

  // Permission helpers — ใช้จาก database แทน hardcode
  const can = (page, action='can_view') => {
    if(isAdmin) return true;
    return permissions[page]?.[action] || false;
  };

  const allTabs = [
    {v:'report',   icon:'📊', l:'รายงาน',           page:'dashboard'},
    {v:'inventory',icon:'📦', l:'สต็อก & สินค้า',   page:'stock'},
    {v:'selling',  icon:'💰', l:'ขาย & เอกสาร',     page:'sales'},
    {v:'supply',   icon:'🏭', l:'ผลิต & สั่งซื้อ',   page:'plan'},
    {v:'users',    icon:'👥', l:'ผู้ใช้',            page:'users'},
    {v:'settings', icon:'⚙️', l:'ตั้งค่า',           page:'settings'},
  ];
  // For grouped tabs, check if user can access ANY page in the group
  const groupPages = {
    report:    ['dashboard'],
    inventory: ['stock','products'],
    selling:   ['sales'],
    supply:    ['plan','po'],
    users:     ['users'],
    settings:  ['settings'],
  };
  const visibleTabs = allTabs.filter(t => {
    const pages = groupPages[t.v] || [t.page];
    return isAdmin || pages.some(p => can(p));
  });

  // Set default tab
  useEffect(()=>{
    if(!profile||!permissions) return;
    const groupPages = {
      report:['dashboard'],inventory:['stock','products'],
      selling:['sales','orders'],supply:['plan','po'],
      users:['users'],settings:['settings'],
    };
    const firstTab = allTabs.find(t=>{
      const pages=groupPages[t.v]||[t.page];
      return isAdmin||pages.some(p=>can(p));
    });
    if(firstTab) setTab(firstTab.v);
  },[profile,permissions]);

  if(authLoading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#C8102E',flexDirection:'column',gap:16,fontFamily:"Arial,sans-serif"}}>
      <div style={{width:56,height:56,background:'#FFFFFF',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <img src="data:image/png;base64,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" style={{width:48,height:48,objectFit:'contain'}} alt=""/>
      </div>
      <div style={{color:'#FFFFFF',fontSize:12,letterSpacing:'0.12em',fontWeight:600}}>SANTI PANICH</div>
      <div style={{color:'rgba(255,255,255,0.7)',fontSize:11,letterSpacing:'0.06em'}}>กำลังโหลด...</div>
    </div>
  );

  if(!user||!profile) return <LoginPage onLogin={(u,p)=>{setUser(u);setProfile(p);}}/>;

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,fontFamily:"Arial,sans-serif",background:'#fafafa'}}>
      <div style={{width:48,height:48,background:'#FFFFFF',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:'2px solid #C8102E'}}>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAQ0UlEQVR42qWZd3hUZdrGf2d6yyQz6Q1CGhAhgRAIIEqVKrq6rJ8ruuoKuupi1xWQBdcVcZEiUkTdVVYQolhAegCBUIKGIC09gbRJmyRTMn3mnO+PYEfdvfb561zXOe859/s87/vc93sfQZIkif82vhkiCAQ9HmRKJY2799B+4iSOqio6S88SmTuU6PwRqCJMpNwxC7XZjCAI371CFBFksl/9lPCfAJQkCUTx22uZQgHA1y+9TP3Hn6CNj6ft2DEAhr3yMt0XLtJ69BiIIt6ODtRRUWhjYzEPHUL6ffcSPTyv912h0NUPAAK9gAUBJOnbCfw6QEnqHfS9EAMBTj/1DM6qamRKJZ2lpSTNvJnBzz6DMiKcXcNGoDQaiRyeh75PHxRaLfUff0JnSQnK8HDCMzMY8rcXSZoy+X/M4FVw7pYWmvcXEvJ6cTU00HXhAqrwcMzZg/E7nFwu+JDRb67HbbFw5aPtxIwZg728HI+lBZUpAkEuJ2rECKLzRyDIBOq2FlC3eQt9fnPrt9UwZQ8m7e7ZKPR6fJ1dtBYVETN6FD+7CKRQCASBio1vUTh9JhHXZaGOiuLSqtfJemweusREqt99D0dlJen3/oGg24UxIx1EiYvLXiVl1m+ZvH8PGXPnEJaRTtmq1djKyokcNoyYG8agMBi4vK2AgNuNKtJM0+69HJ51B/snTmb39TdQ8tzzCIKA4tdSrDQYcNbUYCk8SPeFC4xc9wa6+HiihuUSN34c4RkZnH78CUoWLcSU3p/sFxaCAMfuuptbzp7BlJWFvbycrGeeovvSJar//T6XN2/B321DGWbEkJpK7uJF2Ktr2DdhEqLbQ9DjZviqFWhjY3+5xJIogiBQumgxZ19+iaHzFxIzZjRF99yH6PMxtmAr5195ldS7Z+Nra0Ou1XD5w+1c98xTqMLCUOj1xIzMJ+j1sW/8RFJn/56U381CodVS8vwCGj75FE10DOEDMhGDIZJvmUnj558TdPYwef8eFFrtr2RQkkCSCLndDHzoEYYt/TvWkjPIVCqGv7acgNNJ5+kv0ScnM3LdGpr37WfCp9up21qAZugQ4seN5fjch0iYNJHcl17k6F33EDlkCAmTJpK37BXiJ06k48QJFAYDcWNvRB0Tje3iRcLS0pBrtYiBwC+sQVFEkMtxt7ZhOXSYmDGj6b50iXMvvcxNe3eTcf+9tB45ijo6CkNqP/ZPnMyphx6m+NF5ZD/3DGH9UkCSSJ4xneJH55E0YzoRWQOo3fIBUqi3/VwpKEBhMODv7ubK9o8J9riwfvUVl1asxHL4C2Qq1c8AvLp7/XY7515eSlhqP0IuN3Vbt6GOib66Hi+S88ICVCYTurg4jOlpTNqzi4DDQU9TE6qICACa9+1HqdfjbWsn6/HHcNbWEnS5MF2XhTE9nfPLX0UbF8uIla9h2bcfZ3UNiCJlK1bRdvLktQFKooggCJxfugyAvr+bhbWkBCQQ/X66zp2jdPGLNO7aQ9SIETTt2YPaHEn7iZN4WlopnDyN1mNFiKEQLQcP4evuxnrmDKm/vxNjegYVb24EQKHXI1eoSLr5ZtqLT1O+dh3K8HDkWi0dxcWUvvBXfpFrVCYTVRvfor3oOIlTp1Dz3iai8/OJGz+e6JH5XHptBYJcRsacOQx8Yh7ezk6i80egT07C3dqKq6kJTVwcI9asJuh2Y6usRBJFShctov1UMeacbAwpKQhyOUlTJpP54FzEQAAAmVKJ2mS69i7+hmYctXXsn3gTco2G1Nl3gSAw+LlnsBw8hKOmls6SEloPf8GN27bQuHMXot+HymTC0LcvSTOm8/WSv+Hr7iZgs9Gwdze5i18kc+4cPh+WhzLMyIQdnyL6/UQOyaHlyBGufLidhs92AhL6Pn2YuOPTX86gFAqhjowkduyN1G7eAkDt5i20FhVxeetWWg8dZvyOT6h+511ajxxFQuDy1gLEQJDCaTOoWL+B9D/cQ+rsu1Bq9b0l1aiRKZR429u58MoyDH37ULN5CxXrNlC18W2UBj1Bl5vrnn4SbWzMzwEUEINBWouKSJ55M8qICDIfnEvf22+j722/QfR4URnD0cTGcubZv9B19iwpd96BOXsw+WvXEHS70CcmYc7JwdXQSPykiSgNYZStfp2e+gaiR40EwF5RiSCX42psIvXu2cSOG0vQ5UKmVKA2mUCSfgqwt7wC9opKpFCImDHX46yuIWnqZHxWKwGHk7C0NMy5Q/Hb7XQUnybo8aAyhuN3Oqnbuo3aTe+TevdsjP37E3vjDbQePoJCqyXocnHlo+2M2rAOtdmMs7aOSytXM+jJx5HrdCTOmI7fZu+t1JYPQBCukcGrzdnV0IBMqcR6+kvqP91Oz5V6nHWXqd+xA6XBQMjvJ+b60aT8/k6Spk9DCoXo/OoMAZuNAY/PQwwFURrDsJWV0+/OO8h66gkCDie2i5fQREVhGpJDyOsl6PUg12iIGDiA6JH5DHx8HiGfj566ul9o1IKATK2mbOVq6rZ8wA3vvkfFhjfxtLWh0OvpaWhAkAkY+qUgV6sxDclBkMuIuX4UGXPnEJmTg62sHK/Vijl7EN6ODspWvY45dyjDVyyn+UAhXaVnUUeauVLwEY7qGnQxMTgqq3BevoxCp+uVeNfKoCCTEXA4sFdXk3LH7zAPy0URFsbgBfPpuXKFhh07kUIhIocOxZiejjY2lpDHgzEjA9ulMiwHCuksLUWfmEjyjBlYDh+h/VQx2vh4phzYh0yl5MQDve1ErtHg7+qiac9eZCoV4QP647a04LfZiRs7FplC8UMulkIhBLmcthMnMaalYg+GGPv+JlqOHcNRU03EoEGoTCZsZWWIfj+aqEikUJC2ouNoY2NJnDIZTWQkhpQUOs+do/XwF3RfuIirsRFXfT2WgwfRxsXh7+5GGxeH6PcjBUPYysp6ScDnw9i/P56WFnoaGhD9/muLBXtFJbrkJOo//oSA3U5YWhrOqhqCbjdqsxmlwUDesqW0n/6SgNNJ+n330rR3Px6LBXt5Ocb+/cmc8wDJ06bi7ezkyyeexllbQ8vhLxi1fi3m3FwclZVoE+JRR0biqKoGAeLHjaXjqxLqCwqInzjhGlx8tWeHfD7sVdUEnU66y8roaWhArlYRmZtL7b/fx1FTS/X7W/C0tNBWdJzLBR8xYO4DiH4/loOH8LS20vLFEeyVlZStWUdnaSkypar3jCGTkTRtCp72FqRgiMELnycqfwSBnh5Cfj99bp3JwMfmUf3Ov/BarT8CePXsoY2Lw5iWRuL0aXScOIkUCGArK0cVbkSuVpG9cD7mQVkk3zyD3BcX0+fWmfjtDoJeL7qEBKLy8kiaOgW/w4l5SDZIEnKNhtixY7GWniUqP5+MOQ/it9nwWrvIW7YUAE9bOx3Fp0mcMZ0hV0XsD0t8lfS81g5M2dkMfv45xGCQ8y8vRRAEmvfuI2fxIpKnTaW16Dje9nY6vz5H8vRpADhravBZO1FHmpEplbQdK6Jq41sEnE6GLFlMx6lTKI1hVKxdT/T1o8hbsZzu8xcI9riQqVTYa2roOnee8jVrGfOvdzBnD0a+ZMmSJd8vsSCT4W62UP32P4mfMJ6U239D39tvw2PtZNLOz0i8aRJIEj2NTfhtdhImTiDk83FxxSrS778PKRgk6HaDIHD6z48R8nhImDKZsMwMat7dxKBnn8bT2kbtpk246utJvmUmXRcvYcoaiCE5GUvhQdq+OEJPYyNRw/N+WGJBJgNJos8tMwE4NvseLq5cTfOBQkIeD5IYIuT1IgaDqE0mfJ2dlK9dz+FZd1C18W0sBwoZte4N1GYz7qZmshe9gKBQ0HLoMAG7gxGrV9B88BBNn+9GplDSVnScus1b0Ccl0lPfSwx+hxNBLuO6Jx8j5PdfQ81cFatiKETF+g1UrNuAITWV8P6Z+B2OXspyu/Hb7GjjYlHodKijIlEajXz12JMMmPdnsl+YT/vJYqLzhrErfxSIImMLtqIwGvFarbQcKKR89RoM/VJwW1oYv72AhEkTaTp0mEvLX8Nn7WTcB5sxZmZ8B1ASxe8sDUlCkMuRRJHiJ54iZ8F8Tj78COacHBR6He6mZpDJyP7Ls4h+P0UPzMWYmYExNQ1tYgIylYq2I0fJWbiA1iNHkESJiKyB1G0roHLtOvLXvYGzro6KNWsZvGA++r590MbFcWHZP2g7eozsRQvJevRhFDrdrzsLJfMXojAYUOh0dBQX47c7QJIQxRDJU6dg7D8AhV5HzKiRdJeVYz39Jc2FhVhPnGTU22+RMGkC9Ts/5/RDj5C36jWc1TWcW7aUEctX4G5uRvT5GbX+Db76y3yufPgR6X+4h76334Y5J7tXuEiSJAXdHmxlZXg6OvB1WAl6PHg7OnBW1xAKBHC3WFDqDSRMnoSnvQO/w4EUCOBqaEAKBJAAf7cNV309wR4XqnAjIY+H3FeX4bY0U/XWOyj1etzNzYzb/iGWQ4e4sGolw5cu63UbFAouLH2FztKvmVVXhdJg+FY0K4JuDy1Hj9J+qpjO0rMo9DrkajWe9g4EQcCck402Pg6PpQXL/gP01DcQ8rgJOnpAgJDXh8oUgdJoxDR4MCpTBDKViua9+7BXVBDyeulz6y00fLqDlDv/D0kUyV+5goRJk2j8fBcDH32YthMnaTtWRN5r/0CmVCIFgwhXLRGFGArhtVrRJSag0OvQJyX13gyFCDh7CHk8BFwu/DYbhr59kKvVWM+UEjkyH7lKhSG1HypTBBEDB/a2F1FEUCjo+9vbicwdyqkH/8TQpX8nYepUkqbchEylAiBu3FiSp0/DZ7fjqKlBrtUSkZWFXK3+zvUC5LeptUvczRbkCiUBlwtnZRV+mx1vewdBlwtfZydui4WY60eji4sj7f77iByWizEjHW1sDEMXLcRaUgohEdulSwTsdgI2O11fn0MZFsaVrduwV1SiNBoJS+1H9Xub0MTG0nb8BDK5goadO7GXV6CKCGfQk4/30qFc/i1AhS4uDk10FGqzGbXZjCY6ClV4eK8mA7xdXVx4dTm6hAQqN2zEcvgwIODr6ECu0xJ0OLEcPERnSQlytRpkMlzWNvJefAlPUzOetjZkajWe9naq3/kn+uQkLn+wDU1MNLrEJJBErhR8SM7ivyLXaJCCQfiesakY8NDcn7U9JFFEYzajS0zg3Et/x1FZTcYf7yNz7hxUERH4u7poPXqMkM+L7Cq4oMtFnynTGfTs09Ru3oJco8FntaLQ6TBlD6Z59x4Uej22CxdRhhlQx0SjNIZjzsn+gR74ljzEYFD6/g3hqpL9pmH7urvZN34SritXSL3nbka+8fpP5hL0emn4bAfW018i12rJXvA85195FUvhQXrqLhM3fhwKvY4b3vsXtVu2ojSG0Xb8OPXbP8HQL4VRb65HFxuLMizsmvbuNUMURUmSJMlWWSk1Hzwk7Z8yXSp5foHU25bcUigQkEJ+vxTy+38y1mVpkXbfME7abIiQjt77R8lRVye5WlolMRj8wXMeq1XydHRIvxQ/6259Y3iHZ2YSnpmJu6WVug+24nc6Uf1opq7GJuo/+4zGXXuwV1Tg7+5GodURM+5GRq5Zhcpo/IkxiiShiYz8gdXy4/L+xya66PcjU6m4uHI1tZs3M/CRh1GEheFubKK1qIjOM6Vo42JJmjaN8IEDkIJBwtLSiBndy8OCXH5Nr/v7fwv+J5f/mw0jBgKcmPsnLIWFiD4fMo2GqBHDyfjj/fSZefN/9Fvhv43/B9O4My2OBqIPAAAAAElFTkSuQmCC" style={{width:44,height:44,objectFit:'contain'}} alt=""/>
      </div>
      <div style={{color:'#1A1A1A',fontSize:12,letterSpacing:'0.1em',fontWeight:700}}>SANTI PANICH</div>
      <div style={{color:'#888',fontSize:11}}>กำลังโหลดข้อมูล...</div>
    </div>
  );
  if(error) return <div style={{padding:40,color:T.red,fontFamily:"Arial,sans-serif"}}>❌ {error}</div>;

  return(
    <div style={{background:T.bg,minHeight:'100vh'}}>
      <div style={S.wrap}>
        {/* Header — Santi Panich Brand */}
        <div style={S.hdr}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                <img src="data:image/png;base64,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" style={{width:32,height:32,objectFit:'contain'}} alt=""/>
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:14,letterSpacing:'0.1em',color:'#FFFFFF',fontFamily:"'Helvetica Neue',Arial,sans-serif",lineHeight:1.1}}>SANTI PANICH</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.65)',letterSpacing:'0.14em',fontWeight:500,marginTop:1,display:'none'}} className="hide-mobile-sm">COFFEE ROASTER · STOCK</div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.95)',fontWeight:600}}>{{'admin':'👑 Admin','manager':'📊 Manager','sales':'💰 Sales','warehouse':'📦 Warehouse','production':'🏭 Production','accounting':'🧾 Accounting','viewer':'👁️ Viewer'}[profile.role]||profile.role}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.55)'}}>{profile.full_name||profile.email} · {PR.length} SKU</div>
            </div>
            <button onClick={logout} style={{padding:'6px 14px',background:'rgba(255,255,255,0.12)',color:'#FFFFFF',border:'1px solid rgba(255,255,255,0.25)',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.06em',fontFamily:'inherit'}}>LOGOUT</button>
          </div>
        </div>{/* Header */}
        <div style={S.hdr}>
          <div>
            <div style={{fontWeight:700,fontSize:16,letterSpacing:'0.02em'}}>☕ สันติพาณิชย์ Stock</div>
            <div style={{fontSize:11,color:'#7EC4A2',marginTop:2}}>
              {{'admin':'👑 Admin','manager':'📊 Manager','sales':'💰 Sales','warehouse':'📦 Warehouse','production':'🏭 Production','accounting':'🧾 Accounting','viewer':'👁️ Viewer'}[profile.role]||profile.role} · {profile.full_name||profile.email}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:10,color:'#5a9a7a'}}>{PR.length} SKU</div>
            <button onClick={logout} style={{padding:'6px 12px',background:'rgba(255,255,255,0.15)',color:'#EFF7F3',border:'1px solid rgba(255,255,255,0.3)',borderRadius:6,cursor:'pointer',fontSize:12}}>
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Nav — only show allowed tabs */}
        <div style={S.nav}>
          {visibleTabs.map(t=>(
            <button key={t.v} style={{...nbtn(tab===t.v),display:'flex',alignItems:'center',gap:4,flex:1,justifyContent:'center',fontSize:11,padding:'8px 4px',minWidth:0}} onClick={()=>setTab(t.v)}>
              <span style={{fontSize:14,flexShrink:0}}>{t.icon}</span>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{t.l}</span>
            </button>
          ))}
        </div>

        {/* Pages — role-gated */}
        {tab==='report'   &&<ReportPage   stock={stock} sales={sales} permissions={permissions}/>}
        {tab==='inventory'&&<InventoryPage products={products} setProducts={setProducts} stock={stock} setStock={setStock} can={can}/>}
        {tab==='selling'  &&<SellingPage   stock={stock} setStock={setStock} setSales={setSales} sales={sales} staff={staff} can={can}/>}
        {tab==='supply'   &&<SupplyPage    stock={stock} setStock={setStock} sales={sales} products={products} can={can}/>}
        {tab==='users'    &&can('users')   &&<UserManagePage profile={profile}/>}
        {tab==='settings' &&can('settings')&&<SettingsPage permissions={permissions} setPermissions={setPermissions} profile={profile}/>}
      </div>
    </div>
  );
}
