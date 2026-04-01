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
  const [filterPeriod, setFilterPeriod] = useState('all');
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
      if(filterPeriod==='all')           inP=true;
      else if(filterPeriod==='today')    inP=d>=today;
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
              {[['all','ทั้งหมด'],['today','วันนี้'],['this_month','เดือนนี้'],['last_month','เดือนที่แล้ว'],['this_year','ปีนี้'],['month_pick','เลือกเดือน'],['custom','กำหนดเอง']].map(([v,l])=>(
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
// REPORT PAGE
// ════════════════════════════════════════════════════════
function ReportPage({stock,sales,permissions={}}){
  const seeProfit = permissions['dashboard']?.see_profit !== false;
  const seeCost   = permissions['dashboard']?.see_cost   !== false;
  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();

  // Period state
  const [period, setPeriod]     = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const xlsxOk = useXLSX();

  // Build year list (current year back to 5 years)
  const years = Array.from({length:6},(_,i)=>thisYear-i);

  // Period definitions
  const PERIODS = [
    {v:'today',     l:'วันนี้'},
    {v:'yesterday', l:'เมื่อวาน'},
    {v:'this_week', l:'สัปดาห์นี้'},
    {v:'last_week', l:'สัปดาห์ที่แล้ว'},
    {v:'this_month',l:'เดือนนี้'},
    {v:'last_month',l:'เดือนที่แล้ว'},
    {v:'this_year', l:'ปีนี้'},
    {v:'last_year', l:'ปีที่แล้ว'},
    {v:'custom',    l:'กำหนดเอง'},
  ];

  // Month pickers for quick monthly jump
  const [quickMonth, setQuickMonth] = useState(
    thisYear+'-'+(thisMonth+1).toString().padStart(2,'0')
  );
  const [quickYear, setQuickYear] = useState(String(thisYear));

  // Filter function
  const filtered = useMemo(()=>{
    const n  = new Date();
    const today     = new Date(n.getFullYear(),n.getMonth(),n.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay());
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate()-7);
    const lastWeekEnd   = new Date(weekStart); lastWeekEnd.setDate(weekStart.getDate()-1);
    const monthStart = new Date(n.getFullYear(),n.getMonth(),1);
    const lastMonthStart = new Date(n.getFullYear(),n.getMonth()-1,1);
    const lastMonthEnd   = new Date(n.getFullYear(),n.getMonth(),0);
    const yearStart  = new Date(n.getFullYear(),0,1);
    const lastYearStart = new Date(n.getFullYear()-1,0,1);
    const lastYearEnd   = new Date(n.getFullYear()-1,11,31);

    return sales.filter(s=>{
      const d = new Date(s.date);
      if(period==='today')      return d>=today;
      if(period==='yesterday')  return d>=yesterday && d<today;
      if(period==='this_week')  return d>=weekStart;
      if(period==='last_week')  return d>=lastWeekStart && d<=lastWeekEnd;
      if(period==='this_month') return d>=monthStart;
      if(period==='last_month') return d>=lastMonthStart && d<=lastMonthEnd;
      if(period==='this_year')  return d>=yearStart;
      if(period==='last_year')  return d>=lastYearStart && d<=lastYearEnd;
      if(period==='month_pick'){
        const [y,m]=quickMonth.split('-');
        return d.getFullYear()===parseInt(y)&&d.getMonth()===parseInt(m)-1;
      }
      if(period==='year_pick')  return d.getFullYear()===parseInt(quickYear);
      if(period==='custom'&&customStart&&customEnd){
        const cs=new Date(customStart); const ce=new Date(customEnd); ce.setHours(23,59,59);
        return d>=cs&&d<=ce;
      }
      return true;
    });
  },[sales,period,customStart,customEnd,quickMonth,quickYear]);

  // Metrics
  const revenue = filtered.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
  const cost    = filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
  const profit  = revenue-cost;
  const margin  = revenue>0?profit/revenue*100:0;
  const vatTotal  = filtered.reduce((s,t)=>s+(t.vat_amount||0),0);
  const discTotal = filtered.reduce((s,t)=>s+(t.discount_amount||0),0);

  // Category breakdown
  const catMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    const cat=PRMAP[it.sku]?.cat||'อื่นๆ';
    if(!catMap[cat])catMap[cat]={cat,qty:0,rev:0,cost:0};
    catMap[cat].qty+=it.qty; catMap[cat].rev+=it.subtotal||0; catMap[cat].cost+=(it.cost||0)*it.qty;
  }));
  const catRows=Object.values(catMap).map(c=>({...c,profit:c.rev-c.cost,margin:c.rev>0?(c.rev-c.cost)/c.rev*100:0})).sort((a,b)=>b.rev-a.rev);

  // Top products
  const skuMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    if(!skuMap[it.sku])skuMap[it.sku]={sku:it.sku,name:it.name,cat:PRMAP[it.sku]?.cat||'อื่นๆ',qty:0,rev:0,cost:0};
    skuMap[it.sku].qty+=it.qty; skuMap[it.sku].rev+=it.subtotal||0; skuMap[it.sku].cost+=(it.cost||0)*it.qty;
  }));
  const topItems=Object.values(skuMap).map(r=>({...r,profit:r.rev-r.cost})).sort((a,b)=>b.rev-a.rev).slice(0,20);

  // Period label for export filename
  const periodLabel = ()=>{
    const m={'today':'วันนี้','yesterday':'เมื่อวาน','this_week':'สัปดาห์นี้','last_week':'สัปดาห์ที่แล้ว','this_month':'เดือนนี้','last_month':'เดือนที่แล้ว','this_year':'ปีนี้','last_year':'ปีที่แล้ว','month_pick':quickMonth,'year_pick':quickYear,'custom':`${customStart}_${customEnd}`};
    return m[period]||period;
  };

  const exportReport=()=>{
    if(!xlsxOk)return;
    exportXLSX(`report_${periodLabel()}.xlsx`,[
      {name:'กำไร-ขาดทุน',headers:['รายการ','ยอด (฿)'],
       data:[['ช่วงเวลา',periodLabel()],['ยอดขายรวม',Math.round(revenue)],['ส่วนลดรวม',Math.round(discTotal)],['VAT รวม',Math.round(vatTotal)],['ต้นทุนสินค้า',Math.round(cost)],['กำไรขั้นต้น',Math.round(profit)],['Gross Margin %',fmtP(margin)],['จำนวนบิล',filtered.length],['ชิ้นที่ขาย',filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+b.qty,0),0)]]},
      {name:'แยกหมวดสินค้า',headers:['หมวด','ชิ้น','ยอดขาย','ต้นทุน','กำไร','Margin %'],
       data:catRows.map(c=>[c.cat,c.qty,Math.round(c.rev),Math.round(c.cost),Math.round(c.profit),fmtP(c.margin)])},
      {name:'สินค้าขายดี',headers:['#','SKU','ชื่อ','หมวด','ชิ้น','ยอดขาย','กำไร'],
       data:topItems.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.qty,Math.round(r.rev),Math.round(r.profit)])},
      {name:'ประวัติบิล',headers:['วันที่','ลูกค้า','ช่องทาง','ยอดรวม','ส่วนลด','VAT','ยอดสุทธิ','ต้นทุน','กำไร','หมายเหตุ'],
       data:filtered.slice().reverse().map(s=>{const c=s.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0);return[thDT(s.date),s.customer_name||'-',s.channel||'-',Math.round(s.total||0),Math.round(s.discount_amount||0),Math.round(s.vat_amount||0),Math.round(s.total_after_vat||s.total||0),Math.round(c),Math.round((s.total_after_vat||s.total||0)-c),s.note||''];})},
    ]);
  };

  // Dashboard KPIs (same filtered data)
  const stVal   = PR.reduce((s,p)=>{const d=stock[p[0]]||{qty:0,cost:p[4]};return s+d.qty*d.cost;},0);
  const outN    = PR.filter(p=>(stock[p[0]]?.qty||0)===0).length;
  const lowN    = PR.filter(p=>{const d=stock[p[0]]||{qty:0,safety:10};return d.qty>0&&d.qty<=d.safety;}).length;
  const catStock= useMemo(()=>{
    const map={};
    PR.forEach(p=>{const d=stock[p[0]]||{qty:0,cost:p[4]};if(!map[p[2]])map[p[2]]={cat:p[2],val:0,out:0,low:0};map[p[2]].val+=d.qty*d.cost;const t=statType(d.qty,d.safety||10);if(t==='out')map[p[2]].out++;else if(t==='low')map[p[2]].low++;});
    return Object.values(map).sort((a,b)=>b.val-a.val);
  },[stock]);
  const daily7=useMemo(()=>{const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toDateString();const dayS=sales.filter(s=>new Date(s.date).toDateString()===ds);days.push({label:d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit'}),rev:dayS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0)});}return days;},[sales]);

  return(
    <div>
      {/* Dashboard KPIs */}
      <div style={S.kgrid}>
        <KPI label="สินค้าทั้งหมด"   value={PR.length+' SKU'} icon="📦" bg={T.blueLight}  color={T.blue}/>
        <KPI label="มูลค่าสต็อก"     value={'฿'+fmt(stVal)}   icon="💰" bg={T.greenLight} color={T.green}/>
        <KPI label="ยอดขาย (ช่วงนี้)" value={'฿'+fmt(revenue)} icon="💳" bg={T.goldLight}  color={T.gold}/>
        <KPI label="กำไร (ช่วงนี้)"   value={'฿'+fmt(profit)}  icon="📈" bg={profit>=0?T.greenLight:T.redLight} color={profit>=0?T.green:T.red}/>
        <KPI label="หมดสต็อก"        value={outN+' รายการ'}  icon="❌" bg={T.redLight}   color={T.red}/>
        <KPI label="ใกล้หมด"         value={lowN+' รายการ'}  icon="⚠️" bg={T.amberLight} color={T.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}><div style={S.cardTitle}>📊 ยอดขาย 7 วันล่าสุด</div><BarChart data={daily7} vk="rev" lk="label" color={T.dark} h={130}/></div>
        <div style={S.card}><div style={S.cardTitle}>📦 สต็อกแยกหมวด</div>
          <div style={S.tow}><table style={S.tbl}>
            <thead><tr>{['หมวด','มูลค่า','หมด','ใกล้หมด'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{catStock.slice(0,8).map((c,i)=><tr key={c.cat}><td style={tdr(i)}>{c.cat}</td><td style={tdr(i)}>฿{fmt(c.val)}</td><td style={{...tdr(i),color:c.out>0?T.red:T.textMuted}}>{c.out||'—'}</td><td style={{...tdr(i),color:c.low>0?T.amber:T.textMuted}}>{c.low||'—'}</td></tr>)}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* Period selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>📅 เลือกช่วงเวลา</div>

        {/* Quick periods */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {PERIODS.map(p=>(
            <button key={p.v} style={{...nbtn(period===p.v),padding:'7px 13px',fontSize:12}} onClick={()=>setPeriod(p.v)}>{p.l}</button>
          ))}
        </div>

        {/* Month picker */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>เลือกเดือน:</span>
          <input type="month" style={{...S.inp,fontSize:12}} value={quickMonth}
            onChange={e=>{setQuickMonth(e.target.value);setPeriod('month_pick');}}/>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>เลือกปี:</span>
          <select style={{...S.inp,fontSize:12}} value={quickYear}
            onChange={e=>{setQuickYear(e.target.value);setPeriod('year_pick');}}>
            {years.map(y=><option key={y} value={y}>{y+543} (ค.ศ. {y})</option>)}
          </select>
        </div>

        {/* Custom range */}
        {period==='custom'&&(
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:'10px 12px',background:T.blueLight,borderRadius:T.radius}}>
            <span style={{fontSize:12,fontWeight:500,color:T.blue}}>ตั้งแต่:</span>
            <input type="date" style={{...S.inp,fontSize:12}} value={customStart} onChange={e=>setCustomStart(e.target.value)}/>
            <span style={{fontSize:12,color:T.textMuted}}>ถึง:</span>
            <input type="date" style={{...S.inp,fontSize:12}} value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/>
          </div>
        )}

        {/* Summary line */}
        <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:T.textMuted}}>
            📊 พบ <b style={{color:T.dark}}>{filtered.length}</b> บิล ในช่วง <b style={{color:T.dark}}>{periodLabel()}</b>
          </span>
          <button style={btn('gr',{fontSize:12,padding:'7px 14px'})} onClick={exportReport} disabled={!xlsxOk||!filtered.length}>
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* PnL */}
      <div style={S.card}>
        <div style={S.cardTitle}>📊 สรุปกำไร-ขาดทุน</div>
        <div style={S.kgrid}>
          <KPI label="ยอดขายรวม"   value={'฿'+fmt(revenue)}   icon="💰" bg={T.blueLight}  color={T.blue}/>
          <KPI label="ส่วนลดรวม"   value={'฿'+fmt(discTotal)} icon="🏷️" bg={T.amberLight} color={T.amber}/>
          <KPI label="VAT รวม"      value={'฿'+fmt(vatTotal)}  icon="🧾" bg={T.grayLight}  color={T.gray}/>
          <KPI label="ต้นทุนสินค้า" value={'฿'+fmt(cost)}      icon="📦" bg={T.amberLight} color={T.amber}/>
          <KPI label="กำไรขั้นต้น"  value={'฿'+fmt(profit)}    icon="📈" bg={profit>=0?T.greenLight:T.redLight} color={profit>=0?T.green:T.red}/>
          <KPI label="Gross Margin"  value={fmtP(margin)}       icon="%" bg={margin>=30?T.greenLight:margin>=10?T.amberLight:T.redLight} color={margin>=30?T.green:margin>=10?T.amber:T.red}/>
        </div>
      </div>

      {/* By category */}
      <div style={S.card}>
        <div style={S.cardTitle}>📂 กำไรแยกหมวดสินค้า</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['หมวด','ชิ้น','ยอดขาย','ต้นทุน','กำไร','Margin %'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{catRows.length===0
            ?<tr><td colSpan={6} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:24}}>ยังไม่มีข้อมูลในช่วงเวลานี้</td></tr>
            :catRows.map((c,i)=>(
              <tr key={c.cat}>
                <td style={{...tdr(i),fontWeight:500}}>{c.cat}</td>
                <td style={tdr(i)}>{c.qty}</td>
                <td style={tdr(i)}>฿{fmt(c.rev)}</td>
                <td style={tdr(i)}>฿{fmt(c.cost)}</td>
                <td style={{...tdr(i),color:c.profit>=0?T.green:T.red,fontWeight:500}}>฿{fmt(c.profit)}</td>
                <td style={{...tdr(i),color:c.margin>=30?T.green:c.margin>=10?T.amber:T.red,fontWeight:500}}>{fmtP(c.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Comparison — this period vs previous */}
      {(()=>{
        // หาช่วงก่อนหน้าที่มีความยาวเท่ากัน
        const now2 = new Date();
        let prevStart, prevEnd, curStart;
        if(period==='today'){
          curStart = new Date(now2.getFullYear(),now2.getMonth(),now2.getDate());
          prevStart = new Date(curStart); prevStart.setDate(prevStart.getDate()-1);
          prevEnd   = new Date(curStart);
        } else if(period==='this_week'){
          curStart = new Date(now2); curStart.setDate(now2.getDate()-now2.getDay());
          prevStart = new Date(curStart); prevStart.setDate(prevStart.getDate()-7);
          prevEnd   = new Date(curStart);
        } else if(period==='this_month'||period==='month_pick'){
          const [y,m] = period==='month_pick'?quickMonth.split('-'):[now2.getFullYear(),now2.getMonth()+1];
          curStart  = new Date(parseInt(y),parseInt(m)-1,1);
          prevStart = new Date(parseInt(y),parseInt(m)-2,1);
          prevEnd   = new Date(parseInt(y),parseInt(m)-1,0);
        } else if(period==='this_year'||period==='year_pick'){
          const y = period==='year_pick'?parseInt(quickYear):now2.getFullYear();
          curStart  = new Date(y,0,1);
          prevStart = new Date(y-1,0,1);
          prevEnd   = new Date(y-1,11,31);
        } else return null;

        const prevSales = sales.filter(s=>{const d=new Date(s.date);return d>=prevStart&&d<(prevEnd||curStart);});
        const prevRev   = prevSales.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
        const prevCost  = prevSales.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
        const prevProfit= prevRev-prevCost;
        if(prevRev===0&&revenue===0) return null;

        const diff = (cur,prev) => prev===0 ? null : ((cur-prev)/prev*100);
        const arrow = (cur,prev) => {
          const d = diff(cur,prev);
          if(d===null) return {icon:'',color:T.textMuted};
          return d>0?{icon:'▲ +'+d.toFixed(1)+'%',color:T.green}:d<0?{icon:'▼ '+d.toFixed(1)+'%',color:T.red}:{icon:'━ 0%',color:T.textMuted};
        };

        const periodLabel2 = period==='today'?'เมื่อวาน':period==='this_week'?'สัปดาห์ที่แล้ว':period==='this_month'||period==='month_pick'?'เดือนที่แล้ว':'ปีที่แล้ว';

        return(
          <div style={S.card}>
            <div style={S.cardTitle}>📊 เปรียบเทียบกับ{periodLabel2}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
              {[
                ['ยอดขาย',revenue,prevRev],
                ['ต้นทุน',cost,prevCost],
                ['กำไร',profit,prevProfit],
              ].map(([l,cur,prev],i)=>{
                const a=arrow(cur,prev);
                return(
                  <div key={i} style={{...S.kcard,background:i===2?(cur>=0?T.greenLight:T.redLight):T.grayLight}}>
                    <div style={{fontSize:11,color:T.textMuted,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:17,fontWeight:700,color:i===2?(cur>=0?T.green:T.red):T.dark}}>฿{fmt(cur)}</div>
                    <div style={{fontSize:11,color:T.textMuted}}>ช่วงก่อน: ฿{fmt(prev)}</div>
                    <div style={{fontSize:12,fontWeight:600,color:a.color,marginTop:2}}>{a.icon||'—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Top products */}
      {topItems.length>0&&(
        <div style={S.card}>
          <div style={S.cardTitle}>🏆 สินค้าขายดี Top 20</div>
          <div style={S.tow}><table style={S.tbl}>
            <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ชิ้น','ยอดขาย','กำไร'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{topItems.map((r,i)=>(
              <tr key={r.sku}>
                <td style={tdr(i)}>{i+1}</td>
                <td style={{...tdr(i),color:T.blue,fontWeight:600}}>{r.sku}</td>
                <td style={tdr(i)}>{r.name}</td>
                <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{r.cat}</td>
                <td style={tdr(i)}>{r.qty}</td>
                <td style={tdr(i)}>฿{fmt(r.rev)}</td>
                <td style={{...tdr(i),color:r.profit>=0?T.green:T.red}}>฿{fmt(r.profit)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      {/* Commission Summary */}
      {(()=>{
        const commMap={};
        filtered.forEach(s=>{
          if(!s.staff_name) return;
          if(!commMap[s.staff_name]) commMap[s.staff_name]={name:s.staff_name,orders:0,revenue:0,commission:0};
          commMap[s.staff_name].orders++;
          commMap[s.staff_name].revenue+=s.total_after_vat||s.total||0;
          commMap[s.staff_name].commission+=s.commission_amount||0;
        });
        const commRows=Object.values(commMap).sort((a,b)=>b.commission-a.commission);
        if(!commRows.length) return null;
        return(
          <div style={S.card}>
            <div style={{...S.cardTitle,justifyContent:'space-between'}}>
              <span>💸 ค่าคอมมิชชันพนักงาน</span>
              <button style={btn('gr',{fontSize:11,padding:'5px 12px'})} onClick={()=>{
                if(!xlsxOk) return;
                exportXLSX('commission_'+periodLabel()+'.xlsx',[{
                  name:'ค่าคอม',
                  headers:['พนักงาน','จำนวนออเดอร์','ยอดขาย (฿)','ค่าคอม (฿)'],
                  data:commRows.map(r=>[r.name,r.orders,Math.round(r.revenue),Math.round(r.commission)])
                }]);
              }} disabled={!xlsxOk}>📥 Export</button>
            </div>
            <div style={S.tow}><table style={S.tbl}>
              <thead><tr>{['พนักงาน','ออเดอร์','ยอดขาย','ค่าคอม'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{commRows.map((r,i)=>(
                <tr key={r.name}>
                  <td style={{...tdr(i),fontWeight:500}}>{r.name}</td>
                  <td style={tdr(i)}>{r.orders} ออเดอร์</td>
                  <td style={tdr(i)}>฿{fmt(r.revenue)}</td>
                  <td style={{...tdr(i),fontWeight:700,color:T.green}}>฿{fmt(r.commission)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        );
      })()}

      {/* Bill history */}
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>🧾 ประวัติบิล ({filtered.length} รายการ)</span>
          {filtered.length>50&&<span style={{fontSize:11,color:T.textMuted,fontWeight:400}}>แสดง 50 รายการล่าสุด</span>}
        </div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['วันที่','ลูกค้า','ช่องทาง','พนักงาน','ยอดสุทธิ','VAT','กำไร','ค่าคอม'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{filtered.length===0
            ?<tr><td colSpan={7} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:24}}>ไม่มีบิลในช่วงเวลานี้</td></tr>
            :filtered.slice(0,50).map((s,i)=>{
              const c=s.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0);
              const net=s.total_after_vat||s.total||0;
              return(
                <tr key={s.id||i}>
                  <td style={{...tdr(i),whiteSpace:'nowrap'}}>{thDT(s.date)}</td>
                  <td style={tdr(i)}>{s.customer_name||'-'}</td>
                  <td style={tdr(i)}>{s.channel||'-'}</td>
                  <td style={{...tdr(i),fontSize:11}}>{s.staff_name||'-'}</td>
                  <td style={{...tdr(i),fontWeight:500}}>฿{fmt(net)}</td>
                  <td style={{...tdr(i),color:T.textMuted,fontSize:11}}>{s.vat_amount?'฿'+fmt(s.vat_amount):'-'}</td>
                  <td style={{...tdr(i),color:(net-c)>=0?T.green:T.red}}>฿{fmt(net-c)}</td>
                  <td style={{...tdr(i),color:T.green,fontWeight:500}}>{s.commission_amount>0?'฿'+fmt(s.commission_amount):'-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function PlanPage({stock,sales}){
  const [days,setDays]=useState(7);const [buf,setBuf]=useState(20);const xlsxOk=useXLSX();
  const plan=useMemo(()=>{
    const cutoff=new Date(Date.now()-days*86400000);
    const skuS={};
    sales.filter(s=>new Date(s.date)>=cutoff).forEach(t=>t.items.forEach(it=>{skuS[it.sku]=(skuS[it.sku]||0)+it.qty;}));
    return Object.entries(skuS).map(([sku,sold])=>{
      const p=PRMAP[sku];if(!p)return null;
      const cur=stock[sku]?.qty||0;const daily=sold/days;const proj=Math.ceil(daily*14*(1+buf/100));const need=Math.max(0,proj-cur);
      return need>0?{sku,name:p.name,cat:p.cat,sold,daily,cur,proj,need}:null;
    }).filter(Boolean).sort((a,b)=>b.need-a.need);
  },[sales,stock,days,buf]);

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>⚙️ ตั้งค่าแผนการผลิต</div>
        <div style={{...S.row,gap:20,flexWrap:'wrap'}}>
          <div><div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>คำนวณจากยอดขาย</div><select style={S.inp} value={days} onChange={e=>setDays(Number(e.target.value))}>{[3,7,14,30].map(d=><option key={d} value={d}>{d} วัน</option>)}</select></div>
          <div><div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Buffer %</div><select style={S.inp} value={buf} onChange={e=>setBuf(Number(e.target.value))}>{[0,10,20,30,50].map(b=><option key={b} value={b}>{b}%</option>)}</select></div>
          <div style={{fontSize:12,color:T.textMuted,alignSelf:'flex-end',paddingBottom:6}}>คำนวณสำหรับ 14 วันข้างหน้า</div>
          {plan.length>0&&<button style={{...btn('gr',{fontSize:12}),alignSelf:'flex-end',marginBottom:1}} onClick={()=>xlsxOk&&exportXLSX('production_plan.xlsx',[{name:'แผนผลิต',headers:['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต'],data:plan.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.sold,r.daily.toFixed(1),r.cur,r.need])}])} disabled={!xlsxOk}>📥 Export</button>}
        </div>
      </div>
      {plan.length===0?<div style={{...S.card,textAlign:'center',color:T.textMuted,padding:40}}>ยังไม่มีข้อมูลยอดขาย — บันทึกการขายก่อนเพื่อให้ระบบคำนวณได้</div>:
      <div style={S.card}>
        <div style={S.cardTitle}>🏭 แผนการผลิต ({plan.length} รายการ)</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต ★'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{plan.map((r,i)=>(<tr key={r.sku}><td style={tdr(i)}>{i+1}</td><td style={{...tdr(i),color:T.blue,fontWeight:600}}>{r.sku}</td><td style={tdr(i)}>{r.name}</td><td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{r.cat}</td><td style={tdr(i)}>{r.sold}</td><td style={tdr(i)}>{r.daily.toFixed(1)}</td><td style={tdr(i)}>{r.cur}</td><td style={{...tdr(i),fontWeight:700,color:T.red}}>{r.need}</td></tr>))}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PRODUCT PAGE — จัดการสินค้า (เพิ่ม/แก้ไข/ลบ/เปลี่ยนชื่อ)
// ════════════════════════════════════════════════════════
function ProductPage({products, setProducts, stock, setStock}){
  const [kw,setKw]       = useState('');
  const [cat,setCat]     = useState('ทั้งหมด');
  const [showForm,setShowForm] = useState(false);
  const [editItem,setEditItem] = useState(null);
  const [saving,setSaving]     = useState(false);
  const [msg,setMsg]           = useState('');
  const [delConfirm,setDelConfirm] = useState(null);
  const [importMsg,setImportMsg]   = useState('');
  const [importing,setImporting]   = useState(false);
  const xlsxOk = useXLSX();

  // Form state
  const EMPTY = {sku:'',name:'',cat:'',sell:'',cost:'',safety:10};
  const [form,setForm] = useState(EMPTY);

  const cats = ['ทั้งหมด',...Array.from(new Set(products.map(p=>p[2]))).sort()];

  const filtered = useMemo(()=>{
    const k = kw.toLowerCase().trim();
    const words = k ? k.split(/\s+/).filter(Boolean) : [];
    return products.filter(p=>{
      const hay = (p[0]+' '+p[1]+' '+p[2]).toLowerCase();
      const mkw = !k || words.every(w=>hay.includes(w));
      const mc  = cat==='ทั้งหมด' || p[2]===cat;
      return mkw && mc;
    });
  },[products,kw,cat]);

  const openAdd = () => {
    setForm(EMPTY); setEditItem(null); setShowForm(true); setMsg('');
  };

  const openEdit = p => {
    setForm({sku:p[0],name:p[1],cat:p[2],sell:p[3],cost:p[4],safety:stock[p[0]]?.safety||10});
    setEditItem(p[0]); setShowForm(true); setMsg('');
  };

  const saveProduct = async () => {
    if(!form.sku.trim()||!form.name.trim()||!form.cat.trim()){
      setMsg('❌ กรุณากรอก SKU, ชื่อสินค้า และหมวดสินค้า'); return;
    }
    const sell = parseFloat(form.sell)||0;
    const cost = parseFloat(form.cost)||0;
    const safety = parseInt(form.safety)||10;
    setSaving(true); setMsg('');

    if(editItem){
      // Update existing product
      const {error} = await supabase.from('products').update({
        name:form.name.trim(), cat:form.cat.trim(), sell, cost
      }).eq('sku', editItem);
      if(error){setMsg('❌ '+error.message); setSaving(false); return;}
      // Update stock cost+safety
      await supabase.from('stock').upsert([{sku:editItem,safety,cost,qty:stock[editItem]?.qty||0}],{onConflict:'sku'});
      // Update local state
      const newProds = products.map(p=>p[0]===editItem?[p[0],form.name.trim(),form.cat.trim(),sell,cost]:p);
      buildProductIndex(newProds);
      setProducts(newProds);
      setStock(s=>({...s,[editItem]:{...s[editItem],cost,safety}}));
      setMsg('✅ อัพเดทสินค้า '+editItem+' เรียบร้อย');
    } else {
      // Check duplicate SKU
      if(products.find(p=>p[0]===form.sku.trim())){
        setMsg('❌ รหัส SKU นี้มีอยู่แล้ว'); setSaving(false); return;
      }
      // Add new product
      const newSku = form.sku.trim();
      const {error} = await supabase.from('products').insert([{
        sku:newSku, name:form.name.trim(), cat:form.cat.trim(), sell, cost
      }]);
      if(error){setMsg('❌ '+error.message); setSaving(false); return;}
      // Add stock entry
      await supabase.from('stock').upsert([{sku:newSku,qty:0,safety,cost}],{onConflict:'sku'});
      const newProds = [...products,[newSku,form.name.trim(),form.cat.trim(),sell,cost]];
      buildProductIndex(newProds);
      setProducts(newProds);
      setStock(s=>({...s,[newSku]:{qty:0,safety,cost}}));
      setMsg('✅ เพิ่มสินค้า '+newSku+' เรียบร้อย');
    }
    setSaving(false); setShowForm(false); setForm(EMPTY); setEditItem(null);
  };

  const deleteProduct = async sku => {
    setSaving(true); setMsg('');
    const {error} = await supabase.from('products').delete().eq('sku',sku);
    if(error){setMsg('❌ '+error.message); setSaving(false); setDelConfirm(null); return;}
    const newProds = products.filter(p=>p[0]!==sku);
    buildProductIndex(newProds);
    setProducts(newProds);
    setDelConfirm(null); setSaving(false);
    setMsg('✅ ลบสินค้า '+sku+' เรียบร้อย');
  };

  // Import product file (เพิ่ม/อัพเดทสินค้าจาก Excel)
  const importProductFile = async file => {
    if(!xlsxOk||!file) return;
    setImporting(true); setImportMsg('');
    try{
      const buf  = await file.arrayBuffer();
      const wb   = window.XLSX.read(buf,{type:'array'});
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const header = rows[0].map(h=>String(h||'').toLowerCase());
      const skuCol  = header.findIndex(h=>h.includes('sku'));
      const nameCol = header.findIndex(h=>h.includes('ชื่อ')||h.includes('name'));
      const catCol  = header.findIndex(h=>h.includes('หมวด')||h.includes('cat'));
      const sellCol = header.findIndex(h=>h.includes('ราคาขาย')||h.includes('sell'));
      const costCol = header.findIndex(h=>h.includes('ราคาทุน')||h.includes('cost'));
      if(skuCol<0){setImportMsg('❌ ไม่พบคอลัมน์ SKU'); setImporting(false); return;}
      const toUpsert=[]; const skipped=[];
      for(let i=1;i<rows.length;i++){
        const row  = rows[i];
        const sku  = String(row[skuCol]||'').trim(); if(!sku) continue;
        const name = nameCol>=0&&row[nameCol]!==''?String(row[nameCol]).trim():'';
        const cat  = catCol>=0&&row[catCol]!==''?String(row[catCol]).trim():'';
        const sell = sellCol>=0&&row[sellCol]!==''?parseFloat(row[sellCol]):null;
        const cost = costCol>=0&&row[costCol]!==''?parseFloat(row[costCol]):null;
        // Must have at least name or be existing product
        const existing = products.find(p=>p[0]===sku);
        if(!existing&&!name){skipped.push(sku); continue;}
        toUpsert.push({
          sku,
          name: name||(existing?existing[1]:''),
          cat:  cat ||(existing?existing[2]:''),
          sell: sell!=null?sell:(existing?existing[3]:0),
          cost: cost!=null?cost:(existing?existing[4]:0),
        });
      }
      if(!toUpsert.length){setImportMsg('❌ ไม่พบข้อมูลที่ valid'); setImporting(false); return;}
      const {error} = await supabase.from('products').upsert(toUpsert,{onConflict:'sku'});
      if(error){setImportMsg('❌ '+error.message); setImporting(false); return;}
      // Update local state
      const prodMap={};
      products.forEach(p=>{ prodMap[p[0]]=p; });
      toUpsert.forEach(u=>{ prodMap[u.sku]=[u.sku,u.name,u.cat,u.sell,u.cost]; });
      const newProds = Object.values(prodMap).sort((a,b)=>a[2].localeCompare(b[2])||a[1].localeCompare(b[1]));
      buildProductIndex(newProds);
      setProducts(newProds);
      const addedN = toUpsert.filter(u=>!products.find(p=>p[0]===u.sku)).length;
      const updN   = toUpsert.length - addedN;
      let resultMsg = '✅ ';
      if(addedN>0) resultMsg += 'เพิ่มใหม่ '+addedN+' รายการ ';
      if(updN>0)   resultMsg += 'อัพเดท '+updN+' รายการ ';
      if(skipped.length>0) resultMsg += '(ข้าม '+skipped.length+' รายการที่ข้อมูลไม่ครบ)';
      setImportMsg(resultMsg);
    }catch(e){setImportMsg('❌ '+e.message);}
    setImporting(false);
  };

  // Export product list
  const exportProducts = () => {
    if(!xlsxOk) return;
    exportXLSX('products.xlsx',[{
      name:'สินค้าทั้งหมด',
      headers:['SKU','ชื่อสินค้า','หมวดสินค้า','ราคาขาย (฿)','ราคาทุน (฿)','Safety Stock','สต็อก'],
      data: products.map(p=>{
        const d = stock[p[0]]||{qty:0,safety:10};
        return [p[0],p[1],p[2],p[3],p[4],d.safety,d.qty];
      })
    }]);
  };

  const F = (field,label,type='text',placeholder='') => (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>{label}</div>
      {field==='cat' ? (
        <div style={{display:'flex',gap:6}}>
          <select style={{...S.inp,flex:1}} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
            <option value="">-- เลือกหมวด --</option>
            {Array.from(new Set(products.map(p=>p[2]))).sort().map(c=><option key={c}>{c}</option>)}
          </select>
          <span style={{fontSize:12,color:T.textMuted,alignSelf:'center'}}>หรือพิมพ์ใหม่:</span>
          <input style={{...S.inp,flex:1}} placeholder="หมวดใหม่..." value={form.cat}
            onChange={e=>setForm(f=>({...f,cat:e.target.value}))}/>
        </div>
      ) : (
        <input type={type} style={{...S.inp,width:'100%'}} placeholder={placeholder}
          value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
          disabled={field==='sku'&&!!editItem}/>
      )}
    </div>
  );

  return (
    <div>
      {/* Import from Excel */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}>
          <div style={S.cardTitle}>📥 นำเข้าสินค้าจาก Excel (ลากวาง)</div>
          <DropZone onFile={importProductFile} accept=".xlsx,.xls,.csv" label="ลากไฟล์ Excel สินค้ามาวาง" sublabel="เพิ่มสินค้าใหม่ หรืออัพเดทข้อมูลที่มีอยู่ได้เลย"/>
          {importing&&<div style={{marginTop:8,fontSize:12,color:T.textMuted}}>⏳ กำลังประมวลผล...</div>}
          {importMsg&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:importMsg.startsWith('✅')?T.greenLight:T.redLight,color:importMsg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{importMsg}</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📤 ดาวน์โหลด</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button style={{...btn('gr'),textAlign:'left'}} onClick={exportProducts} disabled={!xlsxOk}>📊 Export รายการสินค้าทั้งหมด</button>
            <div style={{fontSize:11,color:T.textMuted,lineHeight:1.7}}>
              ไฟล์ที่ Export สามารถแก้ไขแล้ว<b>ลากกลับมาวาง</b>เพื่ออัพเดทได้เลย<br/>
              คอลัมน์ที่รองรับ: <b>SKU, ชื่อสินค้า, หมวด, ราคาขาย, ราคาทุน</b>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={S.card}>
        <div style={{...S.row,gap:8,flexWrap:'wrap'}}>
          <input style={{...S.inp,flex:2,minWidth:160}} placeholder="ค้นหาชื่อ / SKU" value={kw} onChange={e=>setKw(e.target.value)}/>
          <select style={S.inp} value={cat} onChange={e=>setCat(e.target.value)}>
            {cats.map(c=><option key={c}>{c}</option>)}
          </select>
          <span style={{fontSize:12,color:T.textMuted}}>{filtered.length} รายการ</span>
          <div style={{flex:1}}/>
          <button style={btn('dk')} onClick={openAdd}>➕ เพิ่มสินค้าใหม่</button>
        </div>
        {msg&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{msg}</div>}
      </div>

      {/* Add/Edit Form */}
      {showForm&&(
        <div style={{...S.card,border:`2px solid ${T.dark}`,background:'#FAFFFE'}}>
          <div style={{...S.cardTitle,marginBottom:16}}>
            {editItem?'✏️ แก้ไขสินค้า '+editItem:'➕ เพิ่มสินค้าใหม่'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <div>
              {F('sku','รหัส SKU *','text','เช่น PD-100598')}
              {F('name','ชื่อสินค้า *','text','เช่น Dark Roast 250g.')}
              {F('cat','หมวดสินค้า *')}
            </div>
            <div>
              {F('sell','ราคาขาย (฿)','number','0')}
              {F('cost','ราคาทุน (฿)','number','0')}
              {F('safety','Safety Stock (หน่วย)','number','10')}
            </div>
          </div>
          <div style={{...S.row,gap:8,marginTop:8}}>
            <button style={btn('gr')} onClick={saveProduct} disabled={saving}>
              {saving?'กำลังบันทึก...':'💾 บันทึก'}
            </button>
            <button style={btn('gy')} onClick={()=>{setShowForm(false);setForm(EMPTY);setMsg('');}}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {delConfirm&&(
        <div style={{...S.card,border:`2px solid ${T.red}`,background:T.redLight}}>
          <div style={{fontWeight:600,color:T.red,marginBottom:8}}>⚠️ ยืนยันการลบสินค้า</div>
          <div style={{marginBottom:12,fontSize:13}}>
            ลบ <b>{delConfirm.name}</b> ({delConfirm.sku}) ออกจากระบบ?
            {(stock[delConfirm.sku]?.qty||0)>0&&<div style={{color:T.red,marginTop:4}}>⚠️ ยังมีสต็อกเหลืออยู่ {stock[delConfirm.sku]?.qty} ชิ้น</div>}
          </div>
          <div style={S.row}>
            <button style={btn('rd')} onClick={()=>deleteProduct(delConfirm.sku)} disabled={saving}>
              {saving?'กำลังลบ...':'🗑️ ยืนยันลบ'}
            </button>
            <button style={btn('gy')} onClick={()=>setDelConfirm(null)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Product table */}
      <div style={S.tow}>
        <table style={S.tbl}>
          <thead><tr>
            {['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','Safety','สต็อก','จัดการ'].map((h,i)=>(
              <th key={i} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((p,i)=>{
              const d = stock[p[0]]||{qty:0,safety:10};
              return (
                <tr key={p[0]}>
                  <td style={tdr(i)}>{i+1}</td>
                  <td style={{...tdr(i),color:T.blue,fontWeight:600}}>{p[0]}</td>
                  <td style={tdr(i)}>{p[1]}</td>
                  <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{p[2]}</td>
                  <td style={tdr(i)}>฿{fmt(p[3])}</td>
                  <td style={tdr(i)}>฿{fmtD(p[4])}</td>
                  <td style={tdr(i)}>{d.safety}</td>
                  <td style={{...tdr(i),color:d.qty===0?T.red:d.qty<=d.safety?T.amber:T.green,fontWeight:500}}>{d.qty}</td>
                  <td style={tdr(i)}>
                    <div style={{display:'flex',gap:4}}>
                      <button style={btn('dk',{padding:'3px 10px',fontSize:11})} onClick={()=>openEdit(p)}>แก้ไข</button>
                      <button style={btn('rd',{padding:'3px 10px',fontSize:11})} onClick={()=>setDelConfirm({sku:p[0],name:p[1]})}>ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════
function LoginPage({onLogin}){
  const [email,setEmail]   = useState('');
  const [pass,setPass]     = useState('');
  const [loading,setLoading]= useState(false);
  const [error,setError]   = useState('');

  const doLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    const {data,error:err} = await supabase.auth.signInWithPassword({email,password:pass});
    if(err){ setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); setLoading(false); return; }
    // Load profile
    const {data:prof} = await supabase.from('profiles').select('*').eq('id',data.user.id).single();
    if(!prof?.active){ await supabase.auth.signOut(); setError('บัญชีนี้ถูกระงับการใช้งาน'); setLoading(false); return; }
    onLogin(data.user, prof);
    setLoading(false);
  };

  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#C8102E',position:'relative',overflow:'hidden'}}>
      {/* BG pattern */}
      <div style={{position:'absolute',inset:0,opacity:0.08,backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}/>
      <div style={{background:'#fff',borderRadius:8,padding:'44px 40px',width:380,boxShadow:'0 32px 80px rgba(0,0,0,0.35)',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:12}}>
            <div style={{width:48,height:48,background:'#FFFFFF',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:'2px solid #C8102E'}}>
              <img src="data:image/png;base64,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" style={{width:42,height:42,objectFit:'contain'}} alt=""/>
            </div>
            <div style={{textAlign:'left'}}>
              <div style={{fontWeight:900,fontSize:20,color:'#1A1A1A',letterSpacing:'0.08em',lineHeight:1.1,fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>SANTI PANICH</div>
              <div style={{fontSize:10,color:'#999',letterSpacing:'0.14em',fontWeight:500}}>COFFEE ROASTER</div>
            </div>
          </div>
          <div style={{width:40,height:2,background:'#C8102E',margin:'0 auto 12px'}}/>
          <div style={{fontSize:12,color:'#888',letterSpacing:'0.08em',fontWeight:500}}>STOCK MANAGEMENT SYSTEM</div>
        </div>
        <form onSubmit={doLogin}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:'#555',marginBottom:5,fontWeight:500}}>อีเมล</div>
            <input type="email" required style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box'}}
              placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,color:'#555',marginBottom:5,fontWeight:500}}>รหัสผ่าน</div>
            <input type="password" required style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box'}}
              placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/>
          </div>
          {error&&<div style={{background:'#FEE2E2',color:'#DC2626',padding:'9px 12px',borderRadius:7,fontSize:12,marginBottom:14,fontWeight:500}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'13px 0',background:'#C8102E',color:'#FFFFFF',border:'none',borderRadius:5,fontSize:13,fontWeight:700,cursor:'pointer',letterSpacing:'0.08em',fontFamily:'inherit',transition:'background 0.2s'}}>
            {loading?'กำลังเข้าสู่ระบบ...':'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ADMIN — USER MANAGEMENT PAGE
// ════════════════════════════════════════════════════════
function UserManagePage({profile}){
  const [users,setUsers]   = useState([]);
  const [staff,setStaff]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [msg,setMsg]       = useState('');
  const [showInvite,setShowInvite] = useState(false);
  const [invEmail,setInvEmail]     = useState('');
  const [invName,setInvName]       = useState('');
  const [invRole,setInvRole]       = useState('sales');
  const [invPass,setInvPass]       = useState('');
  const [saving,setSaving] = useState(false);

  // Staff commission form
  const [showStaff,setShowStaff]   = useState(false);
  const [staffForm,setStaffForm]   = useState({name:'',commission_type:'percent_revenue',commission_rate:0});

  useEffect(()=>{
    (async()=>{
      const [{data:u},{data:s}] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at'),
        supabase.from('staff').select('*').order('name'),
      ]);
      setUsers(u||[]); setStaff(s||[]); setLoading(false);
    })();
  },[]);

  const updateRole = async (id,role) => {
    await supabase.from('profiles').update({role}).eq('id',id);
    setUsers(u=>u.map(x=>x.id===id?{...x,role}:x));
  };

  const toggleActive = async (id,active) => {
    await supabase.from('profiles').update({active:!active}).eq('id',id);
    setUsers(u=>u.map(x=>x.id===id?{...x,active:!active}:x));
  };

  const inviteUser = async () => {
    if(!invEmail||!invName||!invPass){setMsg('❌ กรอกข้อมูลให้ครบ');return;}
    setSaving(true); setMsg('');
    const {data,error} = await supabase.auth.signUp({
      email:invEmail, password:invPass,
      options:{data:{full_name:invName}}
    });
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    // Update profile role
    if(data.user){
      await supabase.from('profiles').upsert({id:data.user.id,email:invEmail,full_name:invName,role:invRole,active:true},{onConflict:'id'});
    }
    setMsg('✅ เพิ่มผู้ใช้ '+invName+' เรียบร้อย');
    setInvEmail('');setInvName('');setInvPass('');setInvRole('sales');
    setShowInvite(false);setSaving(false);
    // Reload
    const {data:u} = await supabase.from('profiles').select('*').order('created_at');
    setUsers(u||[]);
  };

  const saveStaff = async () => {
    if(!staffForm.name){setMsg('❌ กรอกชื่อพนักงาน');return;}
    setSaving(true);
    const {error} = await supabase.from('staff').insert([staffForm]);
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    setMsg('✅ เพิ่มพนักงาน '+staffForm.name+' เรียบร้อย');
    setStaffForm({name:'',commission_type:'percent_revenue',commission_rate:0});
    setShowStaff(false);setSaving(false);
    const {data:s} = await supabase.from('staff').select('*').order('name');
    setStaff(s||[]);
  };

  const ROLE_LABELS = {admin:'👑 Admin',sales:'💰 Sales',warehouse:'📦 Warehouse'};
  const COMM_LABELS = {percent_revenue:'% จากยอดขาย',percent_profit:'% จากกำไร',fixed:'บาท/ออเดอร์'};

  if(loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>⏳ กำลังโหลด...</div>;

  return(
    <div>
      {msg&&<div style={{...S.card,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500,marginBottom:12}}>{msg}</div>}

      {/* Users */}
      <div style={S.card}>
        <div style={{...S.row,justifyContent:'space-between',marginBottom:12}}>
          <div style={S.cardTitle}>👥 ผู้ใช้งานระบบ ({users.length} คน)</div>
          <button style={btn('dk')} onClick={()=>setShowInvite(!showInvite)}>➕ เพิ่มผู้ใช้ใหม่</button>
        </div>

        {showInvite&&(
          <div style={{background:T.blueLight,borderRadius:T.radius,padding:'14px 16px',marginBottom:14,border:`1px solid ${T.blue}`}}>
            <div style={{fontWeight:600,color:T.blue,marginBottom:12}}>เพิ่มผู้ใช้ใหม่</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 12px'}}>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ชื่อ-นามสกุล</div>
                <input style={{...S.inp,width:'100%'}} placeholder="ชื่อ นามสกุล" value={invName} onChange={e=>setInvName(e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>อีเมล</div>
                <input type="email" style={{...S.inp,width:'100%'}} placeholder="email@domain.com" value={invEmail} onChange={e=>setInvEmail(e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>รหัสผ่าน</div>
                <input type="password" style={{...S.inp,width:'100%'}} placeholder="อย่างน้อย 6 ตัว" value={invPass} onChange={e=>setInvPass(e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>สิทธิ์</div>
                <select style={{...S.inp,width:'100%'}} value={invRole} onChange={e=>setInvRole(e.target.value)}>
                  <option value="admin">👑 Admin — ดูแลระบบทั้งหมด</option>
                  <option value="manager">📊 Manager — เห็นทุกอย่างยกเว้นตั้งค่า user</option>
                  <option value="sales">💰 Sales — บันทึกขาย ดูสต็อก (ไม่เห็นต้นทุน/กำไร)</option>
                  <option value="warehouse">📦 Warehouse — จัดการสต็อก ไม่เห็นราคา</option>
                  <option value="production">🏭 Production — แผนผลิต+สต็อก</option>
                  <option value="accounting">🧾 Accounting — รายงาน+กำไร ดูอย่างเดียว</option>
                  <option value="viewer">👁️ Viewer — ดูข้อมูลอย่างเดียว</option>
                </select>
              </div>
            </div>
            <div style={{...S.row,marginTop:10,gap:8}}>
              <button style={btn('gr')} onClick={inviteUser} disabled={saving}>{saving?'กำลังสร้าง...':'💾 สร้างบัญชี'}</button>
              <button style={btn('gy')} onClick={()=>setShowInvite(false)}>ยกเลิก</button>
            </div>
          </div>
        )}

        <div style={S.tow}>
          <table style={S.tbl}>
            <thead><tr>{['ชื่อ','อีเมล','สิทธิ์','สถานะ','เปลี่ยนสิทธิ์','จัดการ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id}>
                  <td style={{...tdr(i),fontWeight:500}}>{u.full_name||'-'}{u.id===profile.id&&<span style={{fontSize:10,color:T.blue,marginLeft:6}}>(คุณ)</span>}</td>
                  <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{u.email}</td>
                  <td style={tdr(i)}>{ROLE_LABELS[u.role]||u.role}</td>
                  <td style={tdr(i)}><span style={{...bdg(u.active?'ok':'out'),fontSize:11}}>{u.active?'ใช้งานได้':'ระงับแล้ว'}</span></td>
                  <td style={tdr(i)}>
                    {u.id!==profile.id&&(
                      <select style={{...S.inp,padding:'3px 6px',fontSize:11}} value={u.role} onChange={e=>updateRole(u.id,e.target.value)}>
                        <option value="admin">👑 Admin</option>
                        <option value="manager">📊 Manager</option>
                        <option value="sales">💰 Sales</option>
                        <option value="warehouse">📦 Warehouse</option>
                        <option value="production">🏭 Production</option>
                        <option value="accounting">🧾 Accounting</option>
                        <option value="viewer">👁️ Viewer</option>
                      </select>
                    )}
                  </td>
                  <td style={tdr(i)}>
                    {u.id!==profile.id&&(
                      <button style={btn(u.active?'rd':'gr',{padding:'3px 10px',fontSize:11})} onClick={()=>toggleActive(u.id,u.active)}>
                        {u.active?'ระงับ':'เปิดใช้'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff & Commission */}
      <div style={S.card}>
        <div style={{...S.row,justifyContent:'space-between',marginBottom:12}}>
          <div style={S.cardTitle}>💸 พนักงานขายและค่าคอมมิชชัน</div>
          <button style={btn('dk')} onClick={()=>setShowStaff(!showStaff)}>➕ เพิ่มพนักงานขาย</button>
        </div>

        {showStaff&&(
          <div style={{background:T.greenLight,borderRadius:T.radius,padding:'14px 16px',marginBottom:14,border:`1px solid ${T.green}`}}>
            <div style={{fontWeight:600,color:T.green,marginBottom:12}}>เพิ่มพนักงานขาย</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px 12px'}}>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ชื่อพนักงาน</div>
                <input style={{...S.inp,width:'100%'}} placeholder="ชื่อ นามสกุล" value={staffForm.name} onChange={e=>setStaffForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>ประเภทค่าคอม</div>
                <select style={{...S.inp,width:'100%'}} value={staffForm.commission_type} onChange={e=>setStaffForm(f=>({...f,commission_type:e.target.value}))}>
                  <option value="percent_revenue">% จากยอดขาย</option>
                  <option value="percent_profit">% จากกำไร</option>
                  <option value="fixed">บาทต่อออเดอร์</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:3}}>อัตราค่าคอม ({staffForm.commission_type==='fixed'?'฿':'%'})</div>
                <input type="number" min="0" step="0.1" style={{...S.inp,width:'100%'}} placeholder="0" value={staffForm.commission_rate} onChange={e=>setStaffForm(f=>({...f,commission_rate:parseFloat(e.target.value)||0}))}/>
              </div>
            </div>
            <div style={{...S.row,marginTop:10,gap:8}}>
              <button style={btn('gr')} onClick={saveStaff} disabled={saving}>{saving?'กำลังบันทึก...':'💾 บันทึก'}</button>
              <button style={btn('gy')} onClick={()=>setShowStaff(false)}>ยกเลิก</button>
            </div>
          </div>
        )}

        <div style={S.tow}>
          <table style={S.tbl}>
            <thead><tr>{['ชื่อพนักงาน','ประเภทค่าคอม','อัตรา','สถานะ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {staff.length===0
                ?<tr><td colSpan={4} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:24}}>ยังไม่มีพนักงานขาย — กด ➕ เพื่อเพิ่ม</td></tr>
                :staff.map((s,i)=>(
                  <tr key={s.id}>
                    <td style={{...tdr(i),fontWeight:500}}>{s.name}</td>
                    <td style={tdr(i)}>{COMM_LABELS[s.commission_type]||s.commission_type}</td>
                    <td style={tdr(i)}>{s.commission_type==='fixed'?'฿'+fmt(s.commission_rate):fmtD(s.commission_rate)+'%'}</td>
                    <td style={tdr(i)}><span style={{...bdg(s.active?'ok':'out'),fontSize:11}}>{s.active?'ใช้งาน':'ปิดใช้'}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════
// A4 DOCUMENT PRINTER — ใบเสร็จ/ใบกำกับภาษี/ใบแจ้งหนี้/ใบเสนอราคา
// ════════════════════════════════════════════════════════
const CO = {
  name:    'บริษัท สันติพาณิชย์ โรสเตอร์ จำกัด',
  address: '29/35 หมู่ที่ 6 ตำบลโคกแย้ อำเภอหนองแค จังหวัดสระบุรี 18230',
  address_en: '29/35 M.6 T.Kokyae A.Nongkhae Saraburi',
  tel:     '095-356-2974',
  email:   'SANTICOFFEEANDROASTER@GMAIL.COM',
  website: 'www.santipanich.com',
  tax_id:  '0-1955-61000-94-1',
  bank_name:   'ธนาคารกสิกรไทย',
  bank_name_en:'Bank Kasikornbank Public Company Limited',
  bank_acct:   '0433209974',
  bank_acct_name:   'บริษัท สันติพาณิชย์โรสเตอร์จำกัด',
  bank_acct_name_en:'SANTIPANICH Roaster CO.,LTD.',
};

const DOC_LABELS = {
  quotation:   { th:'ใบเสนอราคา',              en:'Quotation',           prefix:'QT' },
  invoice:     { th:'ใบแจ้งหนี้',               en:'Invoice',             prefix:'IN' },
  receipt:     { th:'ใบเสร็จรับเงิน',           en:'Receipt',             prefix:'RC' },
  tax_invoice: { th:'ใบกำกับภาษี/ใบแจ้งหนี้/ใบเสร็จรับเงิน', en:'Tax Invoice/Invoice/Receipt', prefix:'TX' },
};

function bahtText(amount) {
  const ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const tens = ['','สิบ','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ'];
  const places = ['','หมื่น','พัน','ร้อย','สิบ',''];
  if(amount===0) return 'ศูนย์บาทถ้วน';
  const [intPart,decPart] = amount.toFixed(2).split('.');
  const n = parseInt(intPart);
  if(n===0&&parseInt(decPart)===0) return 'ศูนย์บาทถ้วน';
  const digits = intPart.split('').reverse();
  let result = '';
  for(let i=0;i<digits.length;i++){
    const d = parseInt(digits[i]);
    if(d===0) continue;
    if(i===1&&d===1) result = 'สิบ'+result;
    else if(i===1) result = tens[d]+result;
    else result = ones[d]+(i<6?['','หมื่น','พัน','ร้อย','สิบ',''][5-i%6<0?0:5-i%6]||'':'')+result;
  }
  result += 'บาท';
  const dec = parseInt(decPart);
  if(dec===0) result += 'ถ้วน';
  else {
    const d1=Math.floor(dec/10), d2=dec%10;
    if(d1>0) result += tens[d1];
    if(d2>0) result += ones[d2];
    result += 'สตางค์';
  }
  return result;
}

function buildDocHTML(order, isCopy=false) {
  const label = DOC_LABELS[order.doc_type] || DOC_LABELS.invoice;
  const issueDate = new Date(order.created_at||Date.now()).toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'});
  const dueDate   = order.due_date ? new Date(order.due_date).toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'}) : issueDate;
  const items     = order.items||[];
  const subtotal  = order.subtotal||0;
  const discAmt   = order.discount_amount||0;
  const afterDisc = order.after_discount||subtotal-discAmt;
  const vatAmt    = order.vat_amount||0;
  const total     = order.total||afterDisc+vatAmt;
  const showBank  = ['receipt','tax_invoice'].includes(order.doc_type) || order.status==='paid';

  const itemRows = items.map((it,i) => `
    <tr>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #eee">${i+1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.name||it.description||''}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #eee">${it.qty||0}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${Number(it.sell||it.unit_price||0).toFixed(2)}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${it.discount_pct?it.discount_pct.toFixed(2)+' %':'0.00 %'}</td>
      <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee">${Number(it.subtotal||(it.qty||0)*(it.sell||0)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${label.en} ${order.doc_number||''}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Noto Sans Thai',Arial,sans-serif; font-size:12px; color:#1a1a1a; background:#fff; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:12mm 14mm; position:relative; }
  .header { display:flex; justify-content:space-between; margin-bottom:8px; }
  .logo-area { width:45%; }
  .logo-text { font-size:18px; font-weight:700; color:#1B3A2D; margin-bottom:2px; }
  .co-info { font-size:9.5px; color:#444; line-height:1.6; }
  .doc-area { width:50%; text-align:right; }
  .doc-type-box { border:2px solid #1B3A2D; padding:6px 12px; display:inline-block; margin-bottom:6px; }
  .doc-type-th { font-size:14px; font-weight:700; color:#1B3A2D; }
  .doc-type-en { font-size:11px; color:#444; }
  .doc-num  { font-size:13px; font-weight:700; color:#1B3A2D; margin-top:4px; }
  .original-tag { font-size:10px; border:1px solid #666; padding:1px 6px; display:inline-block; margin-top:3px; }
  .customer-section { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0; border:1px solid #ddd; padding:8px 10px; border-radius:4px; }
  .field-row { display:flex; gap:6px; margin-bottom:3px; font-size:11px; }
  .field-label { color:#666; white-space:nowrap; min-width:80px; }
  .field-value { font-weight:500; color:#1a1a1a; }
  .items-table { width:100%; border-collapse:collapse; margin:8px 0; }
  .items-table thead th { background:#1B3A2D; color:#EFF7F3; padding:7px 8px; font-size:11px; }
  .items-table tbody tr:nth-child(even) td { background:#f9f9f9; }
  .empty-rows td { height:28px; border-bottom:1px solid #eee; }
  .totals-section { display:flex; justify-content:space-between; margin-top:6px; }
  .payment-section { width:55%; font-size:11px; }
  .payment-title { font-weight:600; margin-bottom:4px; font-size:12px; }
  .payment-methods { display:flex; gap:12px; margin-bottom:6px; }
  .chk { display:inline-flex; align-items:center; gap:3px; }
  .bank-info { font-size:10.5px; color:#333; line-height:1.7; border:1px solid #ddd; padding:6px 8px; border-radius:3px; margin-top:4px; background:#f9f9f9; }
  .totals-table { width:42%; border-collapse:collapse; }
  .totals-table td { padding:4px 8px; font-size:12px; border-bottom:1px solid #f0f0f0; }
  .totals-table td:last-child { text-align:right; font-weight:500; }
  .total-final td { font-size:14px; font-weight:700; color:#1B3A2D; border-top:2px solid #1B3A2D; padding-top:6px; }
  .baht-text { font-size:11px; font-weight:600; margin-top:4px; }
  .sig-section { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-top:16px; }
  .sig-box { text-align:center; font-size:10px; }
  .sig-line { border-bottom:1px dashed #999; margin:20px 10px 4px; }
  .footer-addr { text-align:center; font-size:9.5px; color:#666; margin-top:12px; border-top:1px solid #eee; padding-top:6px; }
  .no-print { text-align:center; margin-top:16px; padding:12px; border-top:2px dashed #ddd; }
  @media print {
    body { margin:0; }
    .page { width:100%; padding:8mm 10mm; }
    .no-print { display:none; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <img src="data:image/png;base64,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" style="width:52px;height:52px;object-fit:contain" alt=""/>
        <div>
          <div style="font-size:16px;font-weight:900;color:#C8102E;letter-spacing:0.08em;line-height:1.1;font-family:'Helvetica Neue',Arial,sans-serif">SANTI PANICH</div>
          <div style="font-size:9px;color:#999;letter-spacing:0.14em;font-weight:500">COFFEE ROASTER</div>
        </div>
      </div>
      <div class="co-info">
        <strong>${CO.name}</strong><br>
        ${CO.address}<br>
        เลขที่ผู้เสียภาษี ${CO.tax_id} | (สำนักงานใหญ่)<br>
        โทร: ${CO.tel} | ${CO.email}<br>
        ${CO.website}
      </div>
    </div>
    <div class="doc-area">
      <div class="doc-type-box">
        <div class="doc-type-th">${label.th}</div>
        <div class="doc-type-en">${label.en}</div>
      </div>
      <div class="original-tag">${isCopy?'สำเนา / Copy':'ต้นฉบับ / Original'}</div>
      <div class="doc-num">${order.doc_number||''}</div>
      <div style="font-size:9px;color:#888">(เอกสารออกเป็นชุด)</div>
    </div>
  </div>

  <!-- Customer Info -->
  <div class="customer-section">
    <div>
      <div class="field-row"><span class="field-label">ชื่อลูกค้า<br>Customer Name</span><span class="field-value">${order.customer_name||'-'}</span></div>
      <div class="field-row"><span class="field-label">เลขที่ผู้เสียภาษี<br>Tax ID</span><span class="field-value">${order.customer_tax_id||(order.customer_tax_id?'(สำนักงานใหญ่)':'')}</span></div>
      <div class="field-row"><span class="field-label">ที่อยู่<br>Address</span><span class="field-value">${order.customer_address||'-'}</span></div>
    </div>
    <div>
      <div class="field-row"><span class="field-label">วันที่ / Issue Date</span><span class="field-value">${issueDate}</span></div>
      <div class="field-row"><span class="field-label">กำหนดชำระ / Due Date</span><span class="field-value">${dueDate}</span></div>
      <div class="field-row"><span class="field-label">พนักงานขาย / Salesman</span><span class="field-value">${order.staff_name||'-'}</span></div>
      ${order.ref_doc?`<div class="field-row"><span class="field-label">อ้างอิง / Ref</span><span class="field-value">${order.ref_doc}</span></div>`:''}
    </div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:5%;text-align:center">เลขที่<br>No.</th>
        <th style="text-align:left">รายการ<br>Description</th>
        <th style="width:8%;text-align:center">จำนวน<br>Qty</th>
        <th style="width:12%;text-align:right">ราคา/หน่วย<br>Unit Price</th>
        <th style="width:10%;text-align:right">ส่วนลด<br>Discount</th>
        <th style="width:14%;text-align:right">จำนวนเงิน (THB)<br>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${Array(Math.max(0,8-items.length)).fill('<tr class="empty-rows"><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="payment-section">
      <div class="baht-text">จำนวนเงิน / Amount<br>${bahtText(total)}</div>
      <div class="payment-title" style="margin-top:10px">การชำระเงิน (Conditions of Payments)</div>
      <div class="payment-methods">
        <span class="chk"><input type="checkbox" ${order.payment_method==='cash'?'checked':''} readonly> <span>เงินสด / Cash</span></span>
        <span class="chk"><input type="checkbox" ${order.payment_method==='transfer'?'checked':''} readonly> <span>โอนเงิน / Bank Transfer</span></span>
        <span class="chk"><input type="checkbox" ${order.payment_method==='cheque'?'checked':''} readonly> <span>เช็คธนาคาร / Cheque Bank</span></span>
      </div>
      ${order.payment_note?`<div style="font-size:10.5px;color:#333;margin-bottom:4px">รายละเอียด: ${order.payment_note}</div>`:''}
      ${showBank?`<div class="bank-info">
        บัญชีโอนเงิน<br>
        ${CO.bank_name} / ${CO.bank_name_en}<br>
        ชื่อบัญชี ${CO.bank_acct_name}<br>
        ${CO.bank_acct_name_en}<br>
        เลขที่บัญชี ${CO.bank_acct}
      </div>`:''}
    </div>
    <table class="totals-table">
      <tr><td>รวมเป็นเงิน / Subtotal</td><td>${subtotal.toFixed(2)}</td></tr>
      <tr><td>หักส่วนลดพิเศษ / Special Discount</td><td>${discAmt.toFixed(2)}</td></tr>
      <tr><td>ยอดรวมหลังหักส่วนลด / After Discount</td><td>${afterDisc.toFixed(2)}</td></tr>
      <tr><td>จำนวนภาษีมูลค่าเพิ่ม 7% / VAT</td><td>${vatAmt.toFixed(2)}</td></tr>
      <tr class="total-final"><td>จำนวนเงินรวมทั้งสิ้น / Total</td><td>${total.toFixed(2)}</td></tr>
    </table>
  </div>

  <!-- Signatures -->
  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      ผู้รับสินค้า / Receiver Signature<br>
      วันที่ / Date _______________
    </div>
    <div class="sig-box" style="font-weight:600;font-size:11px;color:#1B3A2D">
      <div class="sig-line"></div>
      ${CO.name}
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      ผู้มีอำนาจลงนาม / Authorized Signature<br>
      วันที่ / Date _______________
    </div>
  </div>

  <div class="footer-addr">${CO.address_en}</div>

  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 28px;background:#1B3A2D;color:#EFF7F3;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-family:inherit;margin-right:8px">🖨️ พิมพ์ / บันทึก PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#eee;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-family:inherit">ปิด</button>
  </div>
</div>
</body>
</html>`;
}

function printDoc(order, isCopy=false) {
  const html = buildDocHTML(order, isCopy);
  const w = window.open('', '_blank', 'width=900,height:750');
  w.document.write(html);
  w.document.close();
}


// ════════════════════════════════════════════════════════
// PO PAGE — ระบบสั่งซื้อสินค้า
// ════════════════════════════════════════════════════════
function POPage({stock, sales, products}){
  const [poList,   setPoList]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('create');
  const [poItems,  setPoItems]  = useState([]);
  const [supplier, setSupplier] = useState('');
  const [poNote,   setPoNote]   = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [kw,       setKw]       = useState('');
  const xlsxOk = useXLSX();

  useEffect(()=>{ loadPOs(); },[]);

  const loadPOs = async () => {
    setLoading(true);
    const { data } = await supabase.from('purchase_orders')
      .select('*').order('created_at',{ascending:false}).limit(50);
    setPoList(data||[]);
    setLoading(false);
  };

  // คำนวณ PO จากแผนผลิต
  const calcFromPlan = () => {
    const cutoff = new Date(Date.now()-7*86400000);
    const skuSold: Record<string,number> = {};
    sales.filter(s=>new Date(s.date)>=cutoff).forEach(t=>
      t.items.forEach((it:any)=>{ skuSold[it.sku]=(skuSold[it.sku]||0)+it.qty; })
    );
    const items: any[] = [];
    Object.entries(skuSold).forEach(([sku,sold])=>{
      const p = PRMAP[sku]; if(!p) return;
      const cur = stock[sku]?.qty||0;
      const daily = sold/7;
      const proj  = Math.ceil(daily*14*1.2);
      const need  = Math.max(0, proj-cur);
      if(need>0) items.push({
        sku, name:p.name, cat:p.cat,
        qty_current: cur,
        qty_need: need,
        qty_order: need,
        unit_cost: stock[sku]?.cost||p.cost,
        note: ''
      });
    });
    setPoItems(items.sort((a,b)=>b.qty_need-a.qty_need));
    setMsg(items.length>0?`✅ คำนวณแล้ว พบ ${items.length} รายการที่ต้องสั่งซื้อ`:'✅ สต็อกเพียงพอ ไม่มีรายการที่ต้องสั่งซื้อ');
  };

  // เพิ่มสินค้าเข้า PO แบบ manual
  const addItem = (p: any) => {
    if(poItems.find(x=>x.sku===p[0])) return;
    setPoItems(items=>[...items,{
      sku:p[0], name:p[1], cat:p[2],
      qty_current: stock[p[0]]?.qty||0,
      qty_need: 0,
      qty_order: 1,
      unit_cost: stock[p[0]]?.cost||p[4],
      note:''
    }]);
    setKw('');
  };

  const totalCost = poItems.reduce((s,x)=>s+x.qty_order*x.unit_cost,0);

  const createPO = async () => {
    if(!poItems.length){setMsg('❌ ยังไม่มีรายการสินค้า');return;}
    setSaving(true); setMsg('');
    const poNumber = 'PO-'+Date.now().toString().slice(-8);
    const { error } = await supabase.from('purchase_orders').insert([{
      po_number:   poNumber,
      supplier:    supplier||'ไม่ระบุ',
      items:       poItems,
      total_cost:  totalCost,
      status:      'draft',
      due_date:    dueDate||null,
      note:        poNote,
    }]);
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    setMsg('✅ สร้าง PO '+poNumber+' เรียบร้อย');
    setPoItems([]); setSupplier(''); setPoNote(''); setDueDate('');
    setSaving(false); loadPOs(); setTab('history');
  };

  // Export PO เป็น Excel
  const exportPO = (po: any) => {
    if(!xlsxOk) return;
    exportXLSX(`PO_${po.po_number}.xlsx`,[
      { name:'ใบสั่งซื้อ',
        headers:['เลขที่ PO','Supplier','วันที่สร้าง','กำหนดรับ','สถานะ','ยอดรวม'],
        data:[[po.po_number, po.supplier, new Date(po.created_at).toLocaleDateString('th-TH'), po.due_date||'-', po.status, fmt(po.total_cost)]]
      },
      { name:'รายการสินค้า',
        headers:['#','SKU','ชื่อสินค้า','หมวด','สต็อกปัจจุบัน','จำนวนที่สั่ง','ราคาทุน/หน่วย','รวม','หมายเหตุ'],
        data:(po.items||[]).map((it:any,i:number)=>[
          i+1, it.sku, it.name, it.cat||'',
          it.qty_current||0, it.qty_order, it.unit_cost,
          Math.round(it.qty_order*it.unit_cost), it.note||''
        ])
      }
    ]);
  };

  const STATUS_STYLE: Record<string,any> = {
    draft:    { background:'#E5E7EB', color:'#374151' },
    sent:     { background:T.blueLight, color:T.blue },
    received: { background:T.greenLight, color:T.green },
    cancelled:{ background:T.redLight, color:T.red },
  };
  const STATUS_LABEL: Record<string,string> = {
    draft:'📝 ร่าง', sent:'📤 ส่งแล้ว', received:'✅ รับแล้ว', cancelled:'❌ ยกเลิก'
  };

  const updateStatus = async (id:number, status:string) => {
    await supabase.from('purchase_orders').update({status}).eq('id',id);
    setPoList(l=>l.map(p=>p.id===id?{...p,status}:p));
  };

  const sugs = useMemo(()=>{
    if(!kw.trim()) return [];
    const words = kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>{
      const hay=(p[0]+' '+p[1]+' '+p[2]).toLowerCase();
      return words.every((w:string)=>hay.includes(w));
    }).slice(0,10);
  },[kw]);

  return(
    <div>
      <div style={{...S.nav,marginBottom:14}}>
        {[['create','🛒 สร้าง PO ใหม่'],['history','📋 ประวัติ PO']].map(([v,l])=>(
          <button key={v} style={nbtn(tab===v)} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>


      {tab==='create'&&(
        <div>
          {msg&&<div style={{...S.card,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500,marginBottom:12}}>{msg}</div>}

          {/* PO Header */}
          <div style={S.card}>
            <div style={S.cardTitle}>📋 ข้อมูล PO</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px 14px'}}>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Supplier / ผู้จัดจำหน่าย</div>
                <input style={{...S.inp,width:'100%'}} placeholder="ชื่อบริษัท/ร้านค้า" value={supplier} onChange={e=>setSupplier(e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>กำหนดรับสินค้า</div>
                <input type="date" style={{...S.inp,width:'100%'}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
              </div>
              <div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>หมายเหตุ</div>
                <input style={{...S.inp,width:'100%'}} placeholder="หมายเหตุ..." value={poNote} onChange={e=>setPoNote(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Add items */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div style={S.card}>
              <div style={S.cardTitle}>🤖 คำนวณจากแผนผลิต (อัตโนมัติ)</div>
              <div style={{fontSize:12,color:T.textMuted,marginBottom:10,lineHeight:1.7}}>
                คำนวณจากยอดขาย 7 วันล่าสุด คาดการณ์ 14 วันข้างหน้า + buffer 20%
              </div>
              <button style={{...btn('dk'),width:'100%'}} onClick={calcFromPlan}>
                🔄 คำนวณและโหลดรายการ
              </button>
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>➕ เพิ่มสินค้าเอง</div>
              <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า/SKU" value={kw} onChange={e=>setKw(e.target.value)}/>
              {sugs.length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                  {sugs.map((p:any)=>(
                    <button key={p[0]} style={{padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:11}} onClick={()=>addItem(p)}>
                      {p[1]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PO Items table */}
          {poItems.length>0&&(
            <div style={S.card}>
              <div style={{...S.cardTitle,justifyContent:'space-between'}}>
                <span>🛒 รายการสั่งซื้อ ({poItems.length} รายการ)</span>
                <span style={{fontSize:13,fontWeight:600,color:T.green}}>รวม: ฿{fmt(totalCost)}</span>
              </div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>
                    {['SKU','ชื่อสินค้า','หมวด','สต็อกปัจจุบัน','จำนวนสั่ง','ราคาทุน/หน่วย','รวม','หมายเหตุ',''].map((h,i)=>(
                      <th key={i} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {poItems.map((item,i)=>(
                      <tr key={item.sku}>
                        <td style={{...tdr(i),color:T.blue,fontWeight:500,fontSize:11}}>{item.sku}</td>
                        <td style={tdr(i)}>{item.name}</td>
                        <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{item.cat}</td>
                        <td style={{...tdr(i),textAlign:'center'}}>{item.qty_current}</td>
                        <td style={tdr(i)}>
                          <input type="number" min="1" style={{...S.inp,width:70,padding:'3px 6px',borderColor:T.blue,background:T.blueLight,color:T.blue,fontWeight:600,textAlign:'center'}}
                            value={item.qty_order}
                            onChange={e=>setPoItems(items=>items.map(x=>x.sku===item.sku?{...x,qty_order:parseInt(e.target.value)||1}:x))}/>
                        </td>
                        <td style={tdr(i)}>
                          <input type="number" min="0" step="0.01" style={{...S.inp,width:85,padding:'3px 6px'}}
                            value={item.unit_cost}
                            onChange={e=>setPoItems(items=>items.map(x=>x.sku===item.sku?{...x,unit_cost:parseFloat(e.target.value)||0}:x))}/>
                        </td>
                        <td style={{...tdr(i),fontWeight:500}}>฿{fmt(item.qty_order*item.unit_cost)}</td>
                        <td style={tdr(i)}>
                          <input style={{...S.inp,width:100,padding:'3px 6px',fontSize:11}} placeholder="หมายเหตุ"
                            value={item.note}
                            onChange={e=>setPoItems(items=>items.map(x=>x.sku===item.sku?{...x,note:e.target.value}:x))}/>
                        </td>
                        <td style={tdr(i)}>
                          <button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:16}} onClick={()=>setPoItems(items=>items.filter(x=>x.sku!==item.sku))}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{...S.row,marginTop:12,gap:8}}>
                <button style={btn('gr')} onClick={createPO} disabled={saving}>
                  {saving?'กำลังสร้าง...':'💾 สร้าง PO'}
                </button>
                <button style={btn('gy')} onClick={()=>setPoItems([])}>ล้างรายการ</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='history'&&(
        <div>
          {loading?<div style={{textAlign:'center',padding:40,color:T.textMuted}}>⏳ กำลังโหลด...</div>:
          poList.length===0?<div style={{...S.card,textAlign:'center',color:T.textMuted,padding:40}}>ยังไม่มี PO — กด สร้าง PO ใหม่ เพื่อเริ่มต้น</div>:(
            <div style={S.card}>
              <div style={S.cardTitle}>📋 ประวัติใบสั่งซื้อ</div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>
                    {['เลขที่ PO','Supplier','วันที่','กำหนดรับ','รายการ','มูลค่า','สถานะ','จัดการ'].map((h,i)=>(
                      <th key={i} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {poList.map((po,i)=>(
                      <tr key={po.id}>
                        <td style={{...tdr(i),fontWeight:600,color:T.blue}}>{po.po_number}</td>
                        <td style={tdr(i)}>{po.supplier}</td>
                        <td style={{...tdr(i),fontSize:11}}>{new Date(po.created_at).toLocaleDateString('th-TH')}</td>
                        <td style={{...tdr(i),fontSize:11}}>{po.due_date?new Date(po.due_date).toLocaleDateString('th-TH'):'-'}</td>
                        <td style={tdr(i)}>{(po.items||[]).length} รายการ</td>
                        <td style={{...tdr(i),fontWeight:500}}>฿{fmt(po.total_cost)}</td>
                        <td style={tdr(i)}>
                          <span style={{...STATUS_STYLE[po.status]||{},borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:500}}>
                            {STATUS_LABEL[po.status]||po.status}
                          </span>
                        </td>
                        <td style={tdr(i)}>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            <button style={btn('gr',{padding:'3px 8px',fontSize:11})} onClick={()=>exportPO(po)} disabled={!xlsxOk}>📥</button>
                            {po.status==='draft'&&<button style={btn('bl',{padding:'3px 8px',fontSize:11})} onClick={()=>updateStatus(po.id,'sent')}>ส่งแล้ว</button>}
                            {po.status==='sent'&&<button style={btn('gr',{padding:'3px 8px',fontSize:11})} onClick={()=>updateStatus(po.id,'received')}>รับแล้ว</button>}
                            {['draft','sent'].includes(po.status)&&<button style={btn('rd',{padding:'3px 8px',fontSize:11})} onClick={()=>updateStatus(po.id,'cancelled')}>ยกเลิก</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
// ════════════════════════════════════════════════════════
// CHANGE PASSWORD MODAL
// ════════════════════════════════════════════════════════
function ChangePasswordModal({onClose}){
  const [oldPwd,   setOldPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);

  const handleChange = async () => {
    if(!oldPwd||!newPwd||!confirm){ setMsg('❌ กรอกข้อมูลให้ครบ'); return; }
    if(newPwd.length < 6){ setMsg('❌ รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if(newPwd !== confirm){ setMsg('❌ รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if(newPwd === oldPwd){ setMsg('❌ รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม'); return; }
    setLoading(true); setMsg('');
    // Re-authenticate first
    const {data:{session}} = await supabase.auth.getSession();
    const email = session?.user?.email;
    const {error:signInErr} = await supabase.auth.signInWithPassword({email, password:oldPwd});
    if(signInErr){ setMsg('❌ รหัสผ่านเดิมไม่ถูกต้อง'); setLoading(false); return; }
    // Update password
    const {error:updateErr} = await supabase.auth.updateUser({password: newPwd});
    if(updateErr){ setMsg('❌ '+updateErr.message); setLoading(false); return; }
    setMsg('✅ เปลี่ยนรหัสผ่านสำเร็จ');
    setLoading(false);
    setTimeout(()=>onClose(), 1500);
  };

  const inputStyle = {
    width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
    borderRadius:6, fontSize:14, fontFamily:'inherit', outline:'none',
  };

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:10,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        {/* Header */}
        <div style={{background:'#C8102E',padding:'16px 20px',borderRadius:'10px 10px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'#fff',fontWeight:700,fontSize:15,letterSpacing:'0.04em'}}>🔑 เปลี่ยนรหัสผ่าน</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',width:28,height:28,borderRadius:4,cursor:'pointer',fontSize:16,lineHeight:1}}>×</button>
        </div>

        <div style={{padding:24}}>
          {msg&&(
            <div style={{
              padding:'10px 14px',borderRadius:6,marginBottom:16,fontSize:13,fontWeight:500,
              background:msg.startsWith('✅')?'#DCFCE7':'#FEE2E2',
              color:msg.startsWith('✅')?'#15803D':'#C8102E',
            }}>{msg}</div>
          )}

          {/* Old password */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:'#666',marginBottom:5,fontWeight:500}}>รหัสผ่านเดิม</div>
            <div style={{position:'relative'}}>
              <input type={showOld?'text':'password'} style={inputStyle} value={oldPwd}
                onChange={e=>setOldPwd(e.target.value)} placeholder="รหัสผ่านเดิม" autoComplete="current-password"/>
              <button onClick={()=>setShowOld(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:16}}>
                {showOld?'🙈':'👁️'}
              </button>
            </div>
          </div>

          {/* New password */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:'#666',marginBottom:5,fontWeight:500}}>รหัสผ่านใหม่ <span style={{color:'#999',fontWeight:400}}>(อย่างน้อย 6 ตัวอักษร)</span></div>
            <div style={{position:'relative'}}>
              <input type={showNew?'text':'password'} style={inputStyle} value={newPwd}
                onChange={e=>setNewPwd(e.target.value)} placeholder="รหัสผ่านใหม่" autoComplete="new-password"/>
              <button onClick={()=>setShowNew(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:16}}>
                {showNew?'🙈':'👁️'}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,color:'#666',marginBottom:5,fontWeight:500}}>ยืนยันรหัสผ่านใหม่</div>
            <input type="password" style={{
              ...inputStyle,
              borderColor: confirm&&newPwd&&confirm!==newPwd?'#C8102E':confirm&&newPwd&&confirm===newPwd?'#16A34A':'#ddd'
            }} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" autoComplete="new-password"/>
            {confirm&&newPwd&&confirm!==newPwd&&<div style={{fontSize:11,color:'#C8102E',marginTop:3}}>รหัสผ่านไม่ตรงกัน</div>}
            {confirm&&newPwd&&confirm===newPwd&&<div style={{fontSize:11,color:'#16A34A',marginTop:3}}>✅ รหัสผ่านตรงกัน</div>}
          </div>

          {/* Buttons */}
          <div style={{display:'flex',gap:8}}>
            <button onClick={onClose} style={{flex:1,padding:'10px 0',background:'#E5E7EB',color:'#374151',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:500}}>
              ยกเลิก
            </button>
            <button onClick={handleChange} disabled={loading} style={{flex:2,padding:'10px 0',background:loading?'#999':'#C8102E',color:'#fff',border:'none',borderRadius:6,cursor:loading?'not-allowed':'pointer',fontSize:13,fontFamily:'inherit',fontWeight:700}}>
              {loading?'⏳ กำลังเปลี่ยน...':'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function App(){
  const [user,setUser]       = useState(null);
  const [profile,setProfile] = useState(null);
  const [permissions,setPermissions] = useState({});
  const [authLoading,setAuthLoading] = useState(true);
  const [showChangePwd,setShowChangePwd] = useState(false);
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
    selling:   ['sales','orders'],
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
      {showChangePwd&&<ChangePasswordModal onClose={()=>setShowChangePwd(false)}/>}
      <div style={S.wrap}>
        {/* Header — Santi Panich Brand */}
        <div style={S.hdr}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAQ0UlEQVR42qWZd3hUZdrGf2d6yyQz6Q1CGhAhgRAIIEqVKrq6rJ8ruuoKuupi1xWQBdcVcZEiUkTdVVYQolhAegCBUIKGIC09gbRJmyRTMn3mnO+PYEfdvfb561zXOe859/s87/vc93sfQZIkif82vhkiCAQ9HmRKJY2799B+4iSOqio6S88SmTuU6PwRqCJMpNwxC7XZjCAI371CFBFksl/9lPCfAJQkCUTx22uZQgHA1y+9TP3Hn6CNj6ft2DEAhr3yMt0XLtJ69BiIIt6ODtRRUWhjYzEPHUL6ffcSPTyv912h0NUPAAK9gAUBJOnbCfw6QEnqHfS9EAMBTj/1DM6qamRKJZ2lpSTNvJnBzz6DMiKcXcNGoDQaiRyeh75PHxRaLfUff0JnSQnK8HDCMzMY8rcXSZoy+X/M4FVw7pYWmvcXEvJ6cTU00HXhAqrwcMzZg/E7nFwu+JDRb67HbbFw5aPtxIwZg728HI+lBZUpAkEuJ2rECKLzRyDIBOq2FlC3eQt9fnPrt9UwZQ8m7e7ZKPR6fJ1dtBYVETN6FD+7CKRQCASBio1vUTh9JhHXZaGOiuLSqtfJemweusREqt99D0dlJen3/oGg24UxIx1EiYvLXiVl1m+ZvH8PGXPnEJaRTtmq1djKyokcNoyYG8agMBi4vK2AgNuNKtJM0+69HJ51B/snTmb39TdQ8tzzCIKA4tdSrDQYcNbUYCk8SPeFC4xc9wa6+HiihuUSN34c4RkZnH78CUoWLcSU3p/sFxaCAMfuuptbzp7BlJWFvbycrGeeovvSJar//T6XN2/B321DGWbEkJpK7uJF2Ktr2DdhEqLbQ9DjZviqFWhjY3+5xJIogiBQumgxZ19+iaHzFxIzZjRF99yH6PMxtmAr5195ldS7Z+Nra0Ou1XD5w+1c98xTqMLCUOj1xIzMJ+j1sW/8RFJn/56U381CodVS8vwCGj75FE10DOEDMhGDIZJvmUnj558TdPYwef8eFFrtr2RQkkCSCLndDHzoEYYt/TvWkjPIVCqGv7acgNNJ5+kv0ScnM3LdGpr37WfCp9up21qAZugQ4seN5fjch0iYNJHcl17k6F33EDlkCAmTJpK37BXiJ06k48QJFAYDcWNvRB0Tje3iRcLS0pBrtYiBwC+sQVFEkMtxt7ZhOXSYmDGj6b50iXMvvcxNe3eTcf+9tB45ijo6CkNqP/ZPnMyphx6m+NF5ZD/3DGH9UkCSSJ4xneJH55E0YzoRWQOo3fIBUqi3/VwpKEBhMODv7ubK9o8J9riwfvUVl1asxHL4C2Qq1c8AvLp7/XY7515eSlhqP0IuN3Vbt6GOib66Hi+S88ICVCYTurg4jOlpTNqzi4DDQU9TE6qICACa9+1HqdfjbWsn6/HHcNbWEnS5MF2XhTE9nfPLX0UbF8uIla9h2bcfZ3UNiCJlK1bRdvLktQFKooggCJxfugyAvr+bhbWkBCQQ/X66zp2jdPGLNO7aQ9SIETTt2YPaHEn7iZN4WlopnDyN1mNFiKEQLQcP4evuxnrmDKm/vxNjegYVb24EQKHXI1eoSLr5ZtqLT1O+dh3K8HDkWi0dxcWUvvBXfpFrVCYTVRvfor3oOIlTp1Dz3iai8/OJGz+e6JH5XHptBYJcRsacOQx8Yh7ezk6i80egT07C3dqKq6kJTVwcI9asJuh2Y6usRBJFShctov1UMeacbAwpKQhyOUlTJpP54FzEQAAAmVKJ2mS69i7+hmYctXXsn3gTco2G1Nl3gSAw+LlnsBw8hKOmls6SEloPf8GN27bQuHMXot+HymTC0LcvSTOm8/WSv+Hr7iZgs9Gwdze5i18kc+4cPh+WhzLMyIQdnyL6/UQOyaHlyBGufLidhs92AhL6Pn2YuOPTX86gFAqhjowkduyN1G7eAkDt5i20FhVxeetWWg8dZvyOT6h+511ajxxFQuDy1gLEQJDCaTOoWL+B9D/cQ+rsu1Bq9b0l1aiRKZR429u58MoyDH37ULN5CxXrNlC18W2UBj1Bl5vrnn4SbWzMzwEUEINBWouKSJ55M8qICDIfnEvf22+j722/QfR4URnD0cTGcubZv9B19iwpd96BOXsw+WvXEHS70CcmYc7JwdXQSPykiSgNYZStfp2e+gaiR40EwF5RiSCX42psIvXu2cSOG0vQ5UKmVKA2mUCSfgqwt7wC9opKpFCImDHX46yuIWnqZHxWKwGHk7C0NMy5Q/Hb7XQUnybo8aAyhuN3Oqnbuo3aTe+TevdsjP37E3vjDbQePoJCqyXocnHlo+2M2rAOtdmMs7aOSytXM+jJx5HrdCTOmI7fZu+t1JYPQBCukcGrzdnV0IBMqcR6+kvqP91Oz5V6nHWXqd+xA6XBQMjvJ+b60aT8/k6Spk9DCoXo/OoMAZuNAY/PQwwFURrDsJWV0+/OO8h66gkCDie2i5fQREVhGpJDyOsl6PUg12iIGDiA6JH5DHx8HiGfj566ul9o1IKATK2mbOVq6rZ8wA3vvkfFhjfxtLWh0OvpaWhAkAkY+qUgV6sxDclBkMuIuX4UGXPnEJmTg62sHK/Vijl7EN6ODspWvY45dyjDVyyn+UAhXaVnUUeauVLwEY7qGnQxMTgqq3BevoxCp+uVeNfKoCCTEXA4sFdXk3LH7zAPy0URFsbgBfPpuXKFhh07kUIhIocOxZiejjY2lpDHgzEjA9ulMiwHCuksLUWfmEjyjBlYDh+h/VQx2vh4phzYh0yl5MQDve1ErtHg7+qiac9eZCoV4QP647a04LfZiRs7FplC8UMulkIhBLmcthMnMaalYg+GGPv+JlqOHcNRU03EoEGoTCZsZWWIfj+aqEikUJC2ouNoY2NJnDIZTWQkhpQUOs+do/XwF3RfuIirsRFXfT2WgwfRxsXh7+5GGxeH6PcjBUPYysp6ScDnw9i/P56WFnoaGhD9/muLBXtFJbrkJOo//oSA3U5YWhrOqhqCbjdqsxmlwUDesqW0n/6SgNNJ+n330rR3Px6LBXt5Ocb+/cmc8wDJ06bi7ezkyyeexllbQ8vhLxi1fi3m3FwclZVoE+JRR0biqKoGAeLHjaXjqxLqCwqInzjhGlx8tWeHfD7sVdUEnU66y8roaWhArlYRmZtL7b/fx1FTS/X7W/C0tNBWdJzLBR8xYO4DiH4/loOH8LS20vLFEeyVlZStWUdnaSkypar3jCGTkTRtCp72FqRgiMELnycqfwSBnh5Cfj99bp3JwMfmUf3Ov/BarT8CePXsoY2Lw5iWRuL0aXScOIkUCGArK0cVbkSuVpG9cD7mQVkk3zyD3BcX0+fWmfjtDoJeL7qEBKLy8kiaOgW/w4l5SDZIEnKNhtixY7GWniUqP5+MOQ/it9nwWrvIW7YUAE9bOx3Fp0mcMZ0hV0XsD0t8lfS81g5M2dkMfv45xGCQ8y8vRRAEmvfuI2fxIpKnTaW16Dje9nY6vz5H8vRpADhravBZO1FHmpEplbQdK6Jq41sEnE6GLFlMx6lTKI1hVKxdT/T1o8hbsZzu8xcI9riQqVTYa2roOnee8jVrGfOvdzBnD0a+ZMmSJd8vsSCT4W62UP32P4mfMJ6U239D39tvw2PtZNLOz0i8aRJIEj2NTfhtdhImTiDk83FxxSrS778PKRgk6HaDIHD6z48R8nhImDKZsMwMat7dxKBnn8bT2kbtpk246utJvmUmXRcvYcoaiCE5GUvhQdq+OEJPYyNRw/N+WGJBJgNJos8tMwE4NvseLq5cTfOBQkIeD5IYIuT1IgaDqE0mfJ2dlK9dz+FZd1C18W0sBwoZte4N1GYz7qZmshe9gKBQ0HLoMAG7gxGrV9B88BBNn+9GplDSVnScus1b0Ccl0lPfSwx+hxNBLuO6Jx8j5PdfQ81cFatiKETF+g1UrNuAITWV8P6Z+B2OXspyu/Hb7GjjYlHodKijIlEajXz12JMMmPdnsl+YT/vJYqLzhrErfxSIImMLtqIwGvFarbQcKKR89RoM/VJwW1oYv72AhEkTaTp0mEvLX8Nn7WTcB5sxZmZ8B1ASxe8sDUlCkMuRRJHiJ54iZ8F8Tj78COacHBR6He6mZpDJyP7Ls4h+P0UPzMWYmYExNQ1tYgIylYq2I0fJWbiA1iNHkESJiKyB1G0roHLtOvLXvYGzro6KNWsZvGA++r590MbFcWHZP2g7eozsRQvJevRhFDrdrzsLJfMXojAYUOh0dBQX47c7QJIQxRDJU6dg7D8AhV5HzKiRdJeVYz39Jc2FhVhPnGTU22+RMGkC9Ts/5/RDj5C36jWc1TWcW7aUEctX4G5uRvT5GbX+Db76y3yufPgR6X+4h76334Y5J7tXuEiSJAXdHmxlZXg6OvB1WAl6PHg7OnBW1xAKBHC3WFDqDSRMnoSnvQO/w4EUCOBqaEAKBJAAf7cNV309wR4XqnAjIY+H3FeX4bY0U/XWOyj1etzNzYzb/iGWQ4e4sGolw5cu63UbFAouLH2FztKvmVVXhdJg+FY0K4JuDy1Hj9J+qpjO0rMo9DrkajWe9g4EQcCck402Pg6PpQXL/gP01DcQ8rgJOnpAgJDXh8oUgdJoxDR4MCpTBDKViua9+7BXVBDyeulz6y00fLqDlDv/D0kUyV+5goRJk2j8fBcDH32YthMnaTtWRN5r/0CmVCIFgwhXLRGFGArhtVrRJSag0OvQJyX13gyFCDh7CHk8BFwu/DYbhr59kKvVWM+UEjkyH7lKhSG1HypTBBEDB/a2F1FEUCjo+9vbicwdyqkH/8TQpX8nYepUkqbchEylAiBu3FiSp0/DZ7fjqKlBrtUSkZWFXK3+zvUC5LeptUvczRbkCiUBlwtnZRV+mx1vewdBlwtfZydui4WY60eji4sj7f77iByWizEjHW1sDEMXLcRaUgohEdulSwTsdgI2O11fn0MZFsaVrduwV1SiNBoJS+1H9Xub0MTG0nb8BDK5goadO7GXV6CKCGfQk4/30qFc/i1AhS4uDk10FGqzGbXZjCY6ClV4eK8mA7xdXVx4dTm6hAQqN2zEcvgwIODr6ECu0xJ0OLEcPERnSQlytRpkMlzWNvJefAlPUzOetjZkajWe9naq3/kn+uQkLn+wDU1MNLrEJJBErhR8SM7ivyLXaJCCQfiesakY8NDcn7U9JFFEYzajS0zg3Et/x1FZTcYf7yNz7hxUERH4u7poPXqMkM+L7Cq4oMtFnynTGfTs09Ru3oJco8FntaLQ6TBlD6Z59x4Uej22CxdRhhlQx0SjNIZjzsn+gR74ljzEYFD6/g3hqpL9pmH7urvZN34SritXSL3nbka+8fpP5hL0emn4bAfW018i12rJXvA85195FUvhQXrqLhM3fhwKvY4b3vsXtVu2ojSG0Xb8OPXbP8HQL4VRb65HFxuLMizsmvbuNUMURUmSJMlWWSk1Hzwk7Z8yXSp5foHU25bcUigQkEJ+vxTy+38y1mVpkXbfME7abIiQjt77R8lRVye5WlolMRj8wXMeq1XydHRIvxQ/6259Y3iHZ2YSnpmJu6WVug+24nc6Uf1opq7GJuo/+4zGXXuwV1Tg7+5GodURM+5GRq5Zhcpo/IkxiiShiYz8gdXy4/L+xya66PcjU6m4uHI1tZs3M/CRh1GEheFubKK1qIjOM6Vo42JJmjaN8IEDkIJBwtLSiBndy8OCXH5Nr/v7fwv+J5f/mw0jBgKcmPsnLIWFiD4fMo2GqBHDyfjj/fSZefN/9Fvhv43/B9O4My2OBqIPAAAAAElFTkSuQmCC" style={{width:32,height:32,objectFit:'contain'}} alt=""/>
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
            <button onClick={()=>setShowChangePwd(true)} style={{padding:'6px 10px',background:'rgba(255,255,255,0.12)',color:'#FFFFFF',border:'1px solid rgba(255,255,255,0.25)',borderRadius:4,cursor:'pointer',fontSize:11,fontFamily:'inherit',marginRight:4}} title="เปลี่ยนรหัสผ่าน">🔑</button>
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
