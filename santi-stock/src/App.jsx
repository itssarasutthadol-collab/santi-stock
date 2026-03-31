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
  dark:'#1B3A2D', mid:'#2D5C45', light:'#EFF7F3',
  gold:'#B8860B', goldLight:'#FDF6E3',
  green:'#16A34A', greenLight:'#DCFCE7',
  red:'#DC2626', redLight:'#FEE2E2',
  amber:'#D97706', amberLight:'#FEF3C7',
  blue:'#1D4ED8', blueLight:'#DBEAFE',
  gray:'#6B7280', grayLight:'#F9FAFB',
  border:'#E5E7EB', borderDark:'#D1D5DB',
  white:'#FFFFFF', bg:'#F8FAF9',
  text:'#111827', textMuted:'#6B7280',
  radius:8, radiusLg:12, radiusFull:9999,
};

const S = {
  wrap:{ maxWidth:1200,margin:'0 auto',padding:'0 12px 80px',fontFamily:"'Noto Sans Thai',Arial,sans-serif",fontSize:13,color:T.text,background:T.bg,minHeight:'100vh' },
  hdr:{ background:`linear-gradient(135deg, ${T.dark} 0%, ${T.mid} 100%)`,color:'#EFF7F3',padding:'14px 20px',borderRadius:T.radiusLg,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(27,58,45,0.3)' },
  nav:{ display:'flex',gap:4,marginBottom:16,flexWrap:'wrap',padding:'6px',background:T.white,borderRadius:T.radiusLg,border:`1px solid ${T.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  card:{ background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusLg,padding:'1.1rem 1.3rem',marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  cardTitle:{ fontWeight:600,fontSize:14,color:T.dark,marginBottom:12,display:'flex',alignItems:'center',gap:6 },
  kgrid:{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10,marginBottom:14 },
  inp:{ padding:'8px 11px',border:`1px solid ${T.borderDark}`,borderRadius:T.radius,fontSize:13,outline:'none',background:T.white,color:T.text,transition:'border-color 0.15s' },
  tbl:{ width:'100%',borderCollapse:'separate',borderSpacing:0,fontSize:12 },
  th:{ background:T.dark,color:'#EFF7F3',padding:'9px 10px',textAlign:'left',fontWeight:500,fontSize:11,letterSpacing:'0.03em' },
  thFirst:{ borderRadius:'6px 0 0 0' }, thLast:{ borderRadius:'0 6px 0 0' },
  tow:{ overflowX:'auto',borderRadius:T.radius,border:`1px solid ${T.border}` },
  row:{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' },
};

const btn=(v='dk',ex={})=>{
  const m={
    dk:{ bg:T.dark,fg:'#EFF7F3',hov:'#243d30' },
    bl:{ bg:'#1A5276',fg:'#fff',hov:'#154360' },
    gr:{ bg:T.green,fg:'#fff',hov:'#15803d' },
    rd:{ bg:T.red,fg:'#fff',hov:'#b91c1c' },
    gy:{ bg:'#E5E7EB',fg:'#374151',hov:'#D1D5DB' },
    am:{ bg:T.amber,fg:'#fff',hov:'#b45309' },
    gl:{ bg:T.gold,fg:'#fff',hov:'#a07218' },
    out:{ bg:'transparent',fg:T.dark,hov:T.light,border:`1px solid ${T.dark}` },
  };
  const s=m[v]||m.dk;
  return { padding:'8px 16px',background:s.bg,color:s.fg,border:s.border||'none',borderRadius:T.radius,fontWeight:500,cursor:'pointer',fontSize:13,fontFamily:'inherit',...ex };
};
const nbtn=a=>({ padding:'8px 16px',borderRadius:T.radius,border:'none',background:a?T.dark:'transparent',color:a?'#EFF7F3':T.textMuted,fontWeight:a?500:400,cursor:'pointer',fontSize:13,fontFamily:'inherit',transition:'all 0.15s' });
const tdr=i=>({ padding:'8px 10px',borderBottom:`1px solid ${T.border}`,background:i%2===0?T.grayLight:T.white,fontSize:12 });
const bdg=t=>t==='out'
  ?{ background:T.redLight,color:T.red,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' }
  :t==='low'
  ?{ background:T.amberLight,color:T.amber,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' }
  :{ background:T.greenLight,color:T.green,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' };

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

      {/* LINE Notify */}
      <LineNotifySettings stock={stock}/>

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
// SALES PAGE — ราคาแก้ได้ + ส่วนลด + VAT
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
// RECEIPT & TAX INVOICE PRINTER
// ════════════════════════════════════════════════════════
const COMPANY = {
  name:    'บริษัท สันติพาณิชย์ โรสเตอร์ จำกัด',
  address: '29/35 หมู่ที่ 6 ตำบลโคกแย้ อำเภอหนองแค จังหวัดสระบุรี 18230',
  tel:     '095-356-2974',
  tax_id:  '0195561000941',
};

function buildReceiptHTML(sale, type='receipt') {
  const isInvoice = type === 'invoice';
  const docTitle  = isInvoice ? 'ใบกำกับภาษี' : 'ใบเสร็จรับเงิน';
  const now       = new Date(sale.date||Date.now());
  const dateStr   = now.toLocaleDateString('th-TH',{day:'2-digit',month:'long',year:'numeric'});
  const timeStr   = now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  const receiptNo = 'RC-'+String(sale.id||Date.now()).slice(-8);

  const items = sale.items||[];
  const subtotalNoVat = items.reduce((s,it)=>{
    if(it.vat_mode==='included') return s+(it.subtotal||0)-(it.vat_amount||0);
    return s+(it.subtotal||0);
  },0);
  const vatAmt   = sale.vat_amount||0;
  const discAmt  = sale.discount_amount||0;
  const grandTotal = sale.total_after_vat||sale.total||0;

  const rows = items.map(it=>`
    <tr>
      <td>${it.name}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">฿${Number(it.sell||0).toFixed(2)}</td>
      <td style="text-align:center;font-size:10px;color:#666">${
        it.vat_mode==='included'?'รวม VAT':
        it.vat_mode==='add'?'+VAT 7%':'ไม่มี VAT'
      }</td>
      <td style="text-align:right">฿${Number(it.subtotal||0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Noto Sans Thai',Arial,sans-serif; font-size:13px; color:#1a1a1a; background:#fff; }
  .page { width:80mm; margin:0 auto; padding:6mm; }
  .center { text-align:center; }
  .co-name { font-size:16px; font-weight:700; color:#1B3A2D; margin-bottom:2px; }
  .doc-title { font-size:14px; font-weight:600; margin:8px 0 4px; border-top:2px solid #1B3A2D; border-bottom:2px solid #1B3A2D; padding:4px 0; }
  .info-row { display:flex; justify-content:space-between; font-size:11px; color:#555; margin-bottom:2px; }
  table { width:100%; border-collapse:collapse; margin:8px 0; font-size:11px; }
  th { background:#1B3A2D; color:#fff; padding:5px 4px; text-align:left; }
  td { padding:4px; border-bottom:1px solid #eee; vertical-align:top; }
  .total-section { border-top:1px dashed #ccc; padding-top:6px; margin-top:4px; }
  .total-row { display:flex; justify-content:space-between; font-size:12px; padding:2px 0; }
  .grand-total { font-size:16px; font-weight:700; color:#1B3A2D; border-top:2px solid #1B3A2D; padding-top:6px; margin-top:4px; }
  .footer { text-align:center; font-size:10px; color:#888; margin-top:12px; border-top:1px dashed #ccc; padding-top:8px; }
  .tax-id { font-size:10px; color:#555; }
  @media print {
    body { margin:0; }
    .page { width:100%; padding:4mm; }
    .no-print { display:none; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="center">
    <div class="co-name">☕ ${COMPANY.name}</div>
    <div style="font-size:10px;color:#555">${COMPANY.address}</div>
    <div style="font-size:10px;color:#555">โทร: ${COMPANY.tel}</div>
    ${isInvoice?`<div class="tax-id">เลขประจำตัวผู้เสียภาษี: ${COMPANY.tax_id}</div>`:''}
    <div class="doc-title">${docTitle}</div>
  </div>

  <div class="info-row"><span>เลขที่:</span><span><b>${receiptNo}</b></span></div>
  <div class="info-row"><span>วันที่:</span><span>${dateStr} ${timeStr}</span></div>
  ${sale.customer_name?`<div class="info-row"><span>ลูกค้า:</span><span>${sale.customer_name}</span></div>`:''}
  ${sale.channel?`<div class="info-row"><span>ช่องทาง:</span><span>${sale.channel}</span></div>`:''}
  ${sale.staff_name?`<div class="info-row"><span>พนักงานขาย:</span><span>${sale.staff_name}</span></div>`:''}

  <table>
    <thead>
      <tr>
        <th>รายการ</th>
        <th style="text-align:center">จำนวน</th>
        <th style="text-align:right">ราคา</th>
        <th style="text-align:center">VAT</th>
        <th style="text-align:right">รวม</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total-section">
    ${discAmt>0?`<div class="total-row"><span>ราคารวม</span><span>฿${Number(subtotalNoVat+vatAmt).toFixed(2)}</span></div>`:''}
    ${vatAmt>0?`<div class="total-row"><span>VAT 7%</span><span>฿${Number(vatAmt).toFixed(2)}</span></div>`:''}
    ${discAmt>0?`<div class="total-row" style="color:#DC2626"><span>ส่วนลด</span><span>-฿${Number(discAmt).toFixed(2)}</span></div>`:''}
    <div class="total-row grand-total">
      <span>ยอดรวมทั้งสิ้น</span>
      <span>฿${Number(grandTotal).toFixed(2)}</span>
    </div>
  </div>

  ${sale.note?`<div style="font-size:11px;color:#555;margin-top:6px">หมายเหตุ: ${sale.note}</div>`:''}

  <div class="footer">
    ขอบคุณที่ใช้บริการ<br>
    ${COMPANY.name}<br>
    ${isInvoice?'ใบกำกับภาษีอย่างย่อ':'ใบเสร็จรับเงินฉบับนี้ถือเป็นหลักฐานการชำระเงิน'}
  </div>

  <div class="no-print" style="text-align:center;margin-top:16px">
    <button onclick="window.print()" style="padding:10px 24px;background:#1B3A2D;color:#EFF7F3;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-family:inherit">
      🖨️ พิมพ์ / บันทึก PDF
    </button>
  </div>
</div>
</body>
</html>`;
}

function printReceipt(sale) {
  const html = buildReceiptHTML(sale, 'receipt');
  const w = window.open('', '_blank', 'width=400,height=700');
  w.document.write(html);
  w.document.close();
}

function printTaxInvoice(sale) {
  const html = buildReceiptHTML(sale, 'invoice');
  const w = window.open('', '_blank', 'width=400,height=700');
  w.document.write(html);
  w.document.close();
}

function SalesPage({stock,setStock,setSales,staff=[],profile}){
  const [kw,setKw]           = useState('');
  const [cart,setCart]       = useState([]);
  const [customer,setCustomer] = useState(null);
  const [note,setNote]       = useState('');
  const [channel,setChannel] = useState('In-store');
  const [globalDisc,setGlobalDisc] = useState('');
  const [selectedStaff,setSelectedStaff] = useState('');
  const [lastSale,setLastSale] = useState(null);
  const [saving,setSaving]   = useState(false);
  const [msg,setMsg]         = useState('');
  const [importMsg,setImportMsg] = useState('');
  const [importing,setImporting] = useState(false);
  const xlsxOk = useXLSX();

  // VAT modes: 'included' = รวมแวทแล้ว | 'add' = บวกแวทเพิ่ม | 'none' = ไม่มีแวท
  const VAT_LABELS = {
    included: 'รวม VAT แล้ว (แสดงยอดแวทแยก)',
    add:      'บวก VAT 7% เพิ่ม',
    none:     'ไม่มี VAT',
  };

  const sugs = useMemo(()=>{
    if(!kw.trim()) return [];
    const words = kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>{
      const hay = (p[0]+' '+p[1]+' '+p[2]).toLowerCase();
      return words.every(w=>hay.includes(w));
    }).slice(0,15);
  },[kw]);

  // addToCart — default vatMode = 'none'
  const addToCart = p => {
    setCart(c=>{
      const ex = c.find(x=>x.sku===p[0]);
      if(ex) return c.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);
      return [...c,{sku:p[0],name:p[1],cat:p[2],unitPrice:p[3],sell:p[3],cost:stock[p[0]]?.cost||p[4],qty:1,vatMode:'none'}];
    });
    setKw('');
  };

  const updateCart = (sku,field,val) => {
    setCart(c=>c.map(x=>{
      if(x.sku!==sku) return x;
      if(field==='qty')     return {...x,qty:Math.max(1,parseInt(val)||1)};
      if(field==='sell')    return {...x,sell:parseFloat(val)||0};
      if(field==='vatMode') return {...x,vatMode:val};
      return x;
    }));
  };

  // Per-item VAT calculation
  // included: ราคา = รวม VAT แล้ว → VAT = price * 7/107
  // add:      VAT = price * 7%  → total = price * 1.07
  // none:     ไม่มี VAT
  const calcItem = x => {
    const base = x.sell * x.qty;
    if(x.vatMode==='included'){
      const vatAmt = base * VAT_RATE / (1 + VAT_RATE);
      return { base, vatAmt, total: base };
    }
    if(x.vatMode==='add'){
      const vatAmt = base * VAT_RATE;
      return { base, vatAmt, total: base + vatAmt };
    }
    return { base, vatAmt:0, total: base };
  };

  // Totals
  const totals = useMemo(()=>{
    let subtotalNoVat=0, vatSum=0, grandTotal=0;
    cart.forEach(x=>{
      const c = calcItem(x);
      if(x.vatMode==='included'){
        subtotalNoVat += c.base - c.vatAmt;
      } else {
        subtotalNoVat += c.base;
      }
      vatSum    += c.vatAmt;
      grandTotal += c.total;
    });
    const discAmt  = parseFloat(globalDisc)||0;
    const afterDisc = Math.max(0, grandTotal - discAmt);
    const totalCost = cart.reduce((s,x)=>s+(x.cost||0)*x.qty, 0);
    return { subtotalNoVat, vatSum, grandTotal, discAmt, afterDisc, totalCost, profit: afterDisc-totalCost };
  },[cart,globalDisc]);

  const confirmSale = async () => {
    if(!cart.length) return;
    setSaving(true); setMsg('');
    const items = cart.map(x=>{
      const c = calcItem(x);
      return {sku:x.sku,name:x.name,cat:x.cat,qty:x.qty,unit_price:x.unitPrice,sell:x.sell,cost:x.cost,vat_mode:x.vatMode,vat_amount:c.vatAmt,subtotal:c.total};
    });
    // Calculate commission
    const staffObj = staff.find(s=>s.id===selectedStaff);
    let commAmt = 0;
    if(staffObj){
      if(staffObj.commission_type==='percent_revenue') commAmt = totals.afterDisc * staffObj.commission_rate/100;
      else if(staffObj.commission_type==='percent_profit')  commAmt = totals.profit * staffObj.commission_rate/100;
      else if(staffObj.commission_type==='fixed') commAmt = staffObj.commission_rate;
    }
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
    const {error:sErr} = await supabase.from('sales').insert([saleData]);
    if(sErr){setMsg('❌ '+sErr.message); setSaving(false); return;}
    // Deduct stock
    const ns={...stock}; const ups=[];
    for(const it of items){
      const cur = ns[it.sku]?.qty||0;
      ns[it.sku] = {...(ns[it.sku]||{}), qty:Math.max(0,cur-it.qty)};
      ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
    }
    await supabase.from('stock').upsert(ups,{onConflict:'sku'});
    setStock(ns); setSales(s=>[...s,saleData]);
    const savedSale = {...saleData, id: Date.now(), date: new Date().toISOString()};
    setLastSale(savedSale);
    setCart([]); setNote(''); setCustomer(null); setGlobalDisc(''); setSelectedStaff('');
    setMsg('✅ บันทึกการขาย ฿'+fmt(totals.afterDisc)+' (VAT ฿'+fmt(totals.vatSum)+') — ตัดสต็อกแล้ว');
    setSaving(false);
  };

  // Import sale file
  const importSaleFile = async file => {
    if(!xlsxOk||!file) return;
    setImporting(true); setImportMsg('');
    try{
      const buf = await file.arrayBuffer();
      const wb  = window.XLSX.read(buf,{type:'array'});
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rows= window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const header = rows[0].map(h=>String(h||'').toLowerCase());
      const skuCol  = header.findIndex(h=>h.includes('sku'));
      const qtyCol  = header.findIndex(h=>h.includes('จำนวน')||h.includes('qty'));
      const priceCol= header.findIndex(h=>h.includes('ราคา')||h.includes('price'));
      const vatCol  = header.findIndex(h=>h.includes('vat')||h.includes('แวท'));
      if(skuCol<0||qtyCol<0){setImportMsg('❌ ไม่พบคอลัมน์ SKU หรือจำนวน'); setImporting(false); return;}
      const newItems=[];
      for(let i=1;i<rows.length;i++){
        const row = rows[i];
        const sku = String(row[skuCol]||'').trim();
        if(!sku||!PRMAP[sku]) continue;
        const qty = parseInt(row[qtyCol]); if(isNaN(qty)||qty<=0) continue;
        const p   = PRMAP[sku];
        const sell= priceCol>=0&&row[priceCol]!==''?parseFloat(row[priceCol])||p.sell:p.sell;
        // VAT mode from file: 'included'/'add'/'none' or blank=none
        let vatMode = 'none';
        if(vatCol>=0){
          const v = String(row[vatCol]||'').toLowerCase();
          if(v.includes('incl')||v.includes('รวม')) vatMode='included';
          else if(v.includes('add')||v.includes('บวก')) vatMode='add';
        }
        newItems.push({sku,name:p.name,cat:p.cat,unitPrice:p.sell,sell,cost:stock[sku]?.cost||p.cost,qty,vatMode});
      }
      if(!newItems.length){setImportMsg('❌ ไม่พบข้อมูลที่ valid'); setImporting(false); return;}
      setCart(newItems);
      setImportMsg('✅ โหลด '+newItems.length+' รายการเข้าตะกร้า — ตรวจสอบแล้วกด ยืนยันการขาย');
    }catch(e){setImportMsg('❌ '+e.message);}
    setImporting(false);
  };

  const exportSaleTemplate = () => {
    if(!xlsxOk) return;
    exportXLSX('sale_template.xlsx',[{
      name:'บันทึกขาย',
      headers:['SKU','ชื่อสินค้า','หมวด','ราคาขาย','จำนวน','ราคาที่ขายจริง (ว่าง=ใช้ราคาปกติ)','VAT (none/included/add)'],
      data: PR.slice(0,20).map(p=>[p[0],p[1],p[2],p[3],'','','none'])
    }]);
  };

  // VAT badge colors
  const vatBadgeStyle = mode => ({
    display:'inline-block', borderRadius:4, padding:'2px 7px', fontSize:10, fontWeight:600, cursor:'pointer',
    background: mode==='included'?T.blueLight : mode==='add'?T.amberLight : T.grayLight,
    color:       mode==='included'?T.blue      : mode==='add'?T.amber      : T.gray,
    border:`1px solid ${mode==='included'?T.blue:mode==='add'?T.amber:T.borderDark}`,
  });

  return (
    <div>
      {/* Import / Template */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}>
          <div style={S.cardTitle}>📥 นำเข้าไฟล์ขาย (ลากวาง)</div>
          <DropZone onFile={importSaleFile} accept=".xlsx,.xls,.csv" label="ลากไฟล์ Excel รายการขายมาวาง" sublabel="ระบบโหลดเข้าตะกร้าอัตโนมัติ"/>
          {importing&&<div style={{marginTop:8,fontSize:12,color:T.textMuted}}>⏳ กำลังโหลด...</div>}
          {importMsg&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:importMsg.startsWith('✅')?T.greenLight:T.redLight,color:importMsg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{importMsg}</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📋 Template ไฟล์ขาย</div>
          <button style={{...btn('dk'),width:'100%',textAlign:'left',marginBottom:8}} onClick={exportSaleTemplate} disabled={!xlsxOk}>📥 ดาวน์โหลด Template</button>
          <div style={{fontSize:11,color:T.textMuted,lineHeight:1.7}}>
            คอลัมน์ VAT ใส่ได้ 3 แบบ:<br/>
            <b>none</b> = ไม่มีแวท &nbsp;|&nbsp;
            <b>included</b> = รวมแวทแล้ว &nbsp;|&nbsp;
            <b>add</b> = บวกแวทเพิ่ม
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,320px)',gap:12}}>
        <div>
          {/* Search */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔍 ค้นหาสินค้า</div>
            <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า หรือ รหัส SKU" value={kw} onChange={e=>setKw(e.target.value)} autoComplete="off"/>
            {sugs.length>0&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                {sugs.map(p=>(
                  <button key={p[0]} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:12,textAlign:'left'}} onClick={()=>addToCart(p)}>
                    <span style={{fontWeight:600,color:T.dark}}>{p[1]}</span>
                    <span style={{color:T.green,marginLeft:6,fontSize:11}}>({stock[p[0]]?.qty||0})</span>
                    <span style={{color:T.textMuted,marginLeft:4}}>฿{fmt(p[3])}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length>0&&(
            <div style={S.card}>
              <div style={S.cardTitle}>🛒 รายการในบิล</div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>
                    {['ชื่อสินค้า','ราคา/หน่วย','VAT','จำนวน','ยอด',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {cart.map((x,i)=>{
                      const c = calcItem(x);
                      return (
                        <tr key={x.sku}>
                          <td style={tdr(i)}>
                            <div style={{fontWeight:500}}>{x.name}</div>
                            <div style={{fontSize:10,color:T.textMuted}}>{x.sku} · {x.cat}</div>
                            {x.vatMode!=='none'&&<div style={{fontSize:10,color:x.vatMode==='included'?T.blue:T.amber}}>
                              {x.vatMode==='included'?`VAT รวมแล้ว ฿${fmtD(c.vatAmt/x.qty)}/ชิ้น`:`VAT บวกเพิ่ม ฿${fmtD(c.vatAmt/x.qty)}/ชิ้น`}
                            </div>}
                          </td>
                          <td style={tdr(i)}>
                            <input type="number" min="0" step="0.01"
                              style={{...S.inp,width:85,padding:'4px 6px',borderColor:x.sell!==x.unitPrice?T.amber:T.borderDark,fontWeight:x.sell!==x.unitPrice?600:400}}
                              value={x.sell} onChange={e=>updateCart(x.sku,'sell',e.target.value)}/>
                            {x.sell!==x.unitPrice&&<div style={{fontSize:10,color:T.amber}}>ปกติ ฿{fmt(x.unitPrice)}</div>}
                          </td>
                          <td style={tdr(i)}>
                            {/* VAT mode selector — 3 buttons */}
                            <div style={{display:'flex',flexDirection:'column',gap:3}}>
                              {Object.entries(VAT_LABELS).map(([mode,label])=>(
                                <label key={mode} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
                                  <input type="radio" name={`vat_${x.sku}`} value={mode} checked={x.vatMode===mode} onChange={()=>updateCart(x.sku,'vatMode',mode)} style={{cursor:'pointer'}}/>
                                  <span style={vatBadgeStyle(mode)}>{mode==='included'?'รวม VAT':mode==='add'?'+VAT 7%':'ไม่มี VAT'}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                          <td style={tdr(i)}>
                            <input type="number" min="1" style={{...S.inp,width:60,padding:'4px 6px',textAlign:'center'}}
                              value={x.qty} onChange={e=>updateCart(x.sku,'qty',e.target.value)}/>
                          </td>
                          <td style={{...tdr(i),fontWeight:500}}>
                            <div>฿{fmt(c.total)}</div>
                            {x.vatMode!=='none'&&<div style={{fontSize:10,color:T.textMuted}}>VAT ฿{fmt(c.vatAmt)}</div>}
                          </td>
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

        {/* Summary panel */}
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>💰 สรุปบิล</div>
            {/* Totals breakdown */}
            <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12}}>
              {[
                ['ราคารวม (ก่อนแวท)',        '฿'+fmt(totals.subtotalNoVat)],
                ['VAT รวม',                   '฿'+fmt(totals.vatSum), totals.vatSum>0?T.amber:T.textMuted],
                ...(totals.discAmt>0?[['ส่วนลด', '-฿'+fmt(totals.discAmt), T.red]]:[]),
              ].map(([l,v,c],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0',color:c||T.text}}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:20,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}>
                <span>ยอดรวม</span><span>฿{fmt(totals.afterDisc)}</span>
              </div>
              <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>
                กำไรโดยประมาณ ฿{fmt(totals.profit)} ({totals.afterDisc>0?fmtP(totals.profit/totals.afterDisc*100):'0%'})
              </div>
            </div>

            {/* Legend VAT modes */}
            <div style={{marginBottom:10,padding:'8px 10px',background:T.blueLight,borderRadius:T.radius,fontSize:11,color:T.blue,lineHeight:1.8}}>
              <b>VAT ต่อรายการ:</b><br/>
              <span style={vatBadgeStyle('none')}>ไม่มี VAT</span> ไม่คิดแวท &nbsp;
              <span style={vatBadgeStyle('included')}>รวม VAT</span> ราคารวมแวทแล้ว แสดงแยก &nbsp;
              <span style={vatBadgeStyle('add')}>+VAT 7%</span> บวกแวทเพิ่ม
            </div>

            {/* Discount */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>ส่วนลดรวมบิล (฿)</div>
            <input type="number" min="0" style={{...S.inp,width:'100%',marginBottom:10}} placeholder="0" value={globalDisc} onChange={e=>setGlobalDisc(e.target.value)}/>

            {/* Customer */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>ลูกค้า</div>
            <CustomerSearch value={customer} onSelect={setCustomer}/>

            {/* Staff selector */}
            {staff.length>0&&(<>
              <div style={{fontSize:12,color:T.textMuted,marginBottom:4,marginTop:10}}>พนักงานขาย (สำหรับค่าคอม)</div>
              <select style={{...S.inp,width:'100%',marginBottom:8}} value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)}>
                <option value="">— ไม่ระบุ —</option>
                {staff.map(s=><option key={s.id} value={s.id}>{s.name} ({s.commission_type==='percent_revenue'?s.commission_rate+'% ยอดขาย':s.commission_type==='percent_profit'?s.commission_rate+'% กำไร':'฿'+s.commission_rate+'/ออเดอร์'})</option>)}
              </select>
            </>)}

            {/* Channel */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4,marginTop:4}}>ช่องทางขาย</div>
            <select style={{...S.inp,width:'100%',marginBottom:8}} value={channel} onChange={e=>setChannel(e.target.value)}>
              {['In-store','Shopee','Lazada','LINE','Facebook','TikTok','Line Man','Grab','อื่นๆ'].map(c=><option key={c}>{c}</option>)}
            </select>

            {/* Note */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>หมายเหตุ</div>
            <input style={{...S.inp,width:'100%',marginBottom:14}} placeholder="หมายเหตุเพิ่มเติม..." value={note} onChange={e=>setNote(e.target.value)}/>

            <button style={{...btn('gr'),width:'100%',padding:'13px 0',fontSize:15,borderRadius:T.radius}} onClick={confirmSale} disabled={!cart.length||saving}>
              {saving?'กำลังบันทึก...':'✅ ยืนยันการขาย'}
            </button>
            {msg&&<div style={{marginTop:10,padding:'9px 12px',borderRadius:T.radius,fontSize:12,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{msg}</div>}
            {lastSale&&(
              <div style={{marginTop:10,display:'flex',gap:8}}>
                <button style={{...btn('dk'),flex:1,fontSize:12}} onClick={()=>printReceipt(lastSale)}>🖨️ พิมพ์ใบเสร็จ</button>
                <button style={{...btn('bl'),flex:1,fontSize:12}} onClick={()=>printTaxInvoice(lastSale)}>🧾 ใบกำกับภาษี</button>
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1B3A2D 0%,#2D5C45 100%)'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 36px',width:360,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>☕</div>
          <div style={{fontWeight:700,fontSize:20,color:'#1B3A2D'}}>สันติพาณิชย์</div>
          <div style={{fontSize:13,color:'#888',marginTop:4}}>Stock Management System</div>
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
          <button type="submit" disabled={loading} style={{width:'100%',padding:'12px 0',background:'#1B3A2D',color:'#EFF7F3',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
            {loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}
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
  {v:'plan',      l:'🏭 แผนผลิต'},
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
      const [permRes,prodRes,stRes,staffRes,salRes] = await Promise.all([
        supabase.from('role_permissions').select('*').eq('role', profile.role),
        supabase.from('products').select('*').order('cat').order('name'),
        supabase.from('stock').select('*'),
        supabase.from('staff').select('*').eq('active',true).order('name'),
        supabase.from('sales').select('*').order('date',{ascending:false}).limit(2000),
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
      setSales(salRes.data||[]);
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
    {v:'report',   icon:'📊', l:'Dashboard & รายงาน', page:'dashboard'},
    {v:'stock',    icon:'📦', l:'สต็อก',               page:'stock'},
    {v:'products', icon:'🏷️', l:'สินค้า',              page:'products'},
    {v:'sales',    icon:'💰', l:'บันทึกขาย',           page:'sales'},
    {v:'plan',     icon:'🏭', l:'แผนผลิต',             page:'plan'},
    {v:'users',    icon:'👥', l:'จัดการผู้ใช้',         page:'users'},
    {v:'settings', icon:'⚙️', l:'ตั้งค่าระบบ',          page:'settings'},
  ];
  const visibleTabs = allTabs.filter(t => can(t.page));

  // Set default tab
  useEffect(()=>{
    if(!profile||!permissions) return;
    const firstTab = allTabs.find(t=>can(t.page));
    if(firstTab) setTab(firstTab.v);
  },[profile,permissions]);

  if(authLoading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1B3A2D,#2D5C45)',flexDirection:'column',gap:12,color:'#EFF7F3',fontFamily:"Arial,sans-serif"}}>
      <div style={{fontSize:48}}>☕</div>
      <div style={{fontSize:14}}>กำลังโหลด...</div>
    </div>
  );

  if(!user||!profile) return <LoginPage onLogin={(u,p)=>{setUser(u);setProfile(p);}}/>;

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:T.textMuted,fontFamily:"Arial,sans-serif"}}>
      <div style={{fontSize:40}}>☕</div><div>กำลังโหลดข้อมูล...</div>
    </div>
  );
  if(error) return <div style={{padding:40,color:T.red,fontFamily:"Arial,sans-serif"}}>❌ {error}</div>;

  return(
    <div style={{background:T.bg,minHeight:'100vh'}}>
      <div style={S.wrap}>
        {/* Header */}
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
            <button key={t.v} style={{...nbtn(tab===t.v),display:'flex',alignItems:'center',gap:5,flex:1,justifyContent:'center',fontSize:12}} onClick={()=>setTab(t.v)}>
              <span>{t.icon}</span><span>{t.l}</span>
            </button>
          ))}
        </div>

        {/* Pages — role-gated */}
        {tab==='report'  &&can('dashboard') &&<ReportPage   stock={stock} sales={sales} permissions={permissions}/>}
        {tab==='stock'   &&can('stock')     &&<StockPage    stock={stock} setStock={setStock} canEdit={can('stock','can_edit')} seeCost={can('stock','see_cost')}/>}
        {tab==='products'&&can('products')  &&<ProductPage  products={products} setProducts={setProducts} stock={stock} setStock={setStock} canEdit={can('products','can_edit')}/>}
        {tab==='sales'   &&can('sales')     &&<SalesPage    stock={stock} setStock={setStock} setSales={setSales} staff={staff} seeCost={can('sales','see_cost')} seeProfit={can('sales','see_profit')}/>}
        {tab==='plan'    &&can('plan')      &&<PlanPage     stock={stock} sales={sales}/>}
        {tab==='users'   &&can('users')     &&<UserManagePage profile={profile}/>}
        {tab==='settings'&&can('settings')  &&<SettingsPage permissions={permissions} setPermissions={setPermissions} profile={profile}/>}
      </div>
    </div>
  );
}
