(function(){
"use strict";

/* ============================================================
   UTILITIES
   ============================================================ */
function $(sel,root){ return (root||document).querySelector(sel); }
function $$(sel,root){ return Array.from((root||document).querySelectorAll(sel)); }
function uid(prefix){ return (prefix||'ID')+'-'+Math.random().toString(36).slice(2,9).toUpperCase(); }
function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtCurrency(v, opts){
  opts = opts || {};
  const n = Number(v)||0;
  const neg = n < 0;
  const abs = Math.abs(n);
  const str = '₱' + abs.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
  return neg ? ('-' + str) : str;
}
function fmtCompact(v){
  const n = Number(v)||0; const abs = Math.abs(n); const sign = n<0?'-':'';
  if(abs >= 1e9) return sign+'₱'+(abs/1e9).toFixed(2)+'B';
  if(abs >= 1e6) return sign+'₱'+(abs/1e6).toFixed(2)+'M';
  if(abs >= 1e3) return sign+'₱'+(abs/1e3).toFixed(1)+'k';
  return sign+'₱'+abs.toFixed(0);
}
function fmtDate(iso){
  if(!iso) return '';
  const d = new Date(iso+'T00:00:00');
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'});
}
function fmtDateTime(iso){
  const d = new Date(iso);
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) + ' · ' + d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'});
}
function timeAgo(iso){
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return mins+'m ago';
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs+'h ago';
  const days = Math.floor(hrs/24);
  if(days < 30) return days+'d ago';
  return fmtDate(iso.slice(0,10));
}
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function initials(name){
  return (name||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
function seededRandom(seed){
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rnd = seededRandom(90210);
function pick(arr){ return arr[Math.floor(rnd()*arr.length)]; }
function randInt(min,max){ return Math.floor(rnd()*(max-min+1))+min; }

function toast(msg, type){
  const host = $('#toastHost');
  const el = document.createElement('div');
  el.className = 'toast ' + (type||'');
  el.innerHTML = (type==='success' ? '✓ ' : type==='error' ? '⚠ ' : '') + escapeHtml(msg);
  host.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),260); }, 3400);
}

/* ============================================================
   DATA MODEL
   ============================================================ */
const STORAGE_KEY = 'ncip_fms_v2';

const DEPARTMENTS = [
  {id:'D1', name:'Office of the Provincial Officer', head:'Atty. Norma Gayudan'},
  {id:'D2', name:'Ancestral Domains Division', head:'Engr. Ricardo Bagwan'},
  {id:'D3', name:'Community Development Division', head:'Elena Fianza'},
  {id:'D4', name:'Finance & Administrative Division', head:'Maricel Wandag'},
  {id:'D5', name:'Legal Affairs Division', head:'Atty. Jose Camdas'},
];

const PROGRAMS = [
  {id:'P1', name:'Ancestral Domain Titling', dept:'D2'},
  {id:'P2', name:'Community Development Assistance', dept:'D3'},
  {id:'P3', name:'Indigenous Peoples Education Program', dept:'D3'},
  {id:'P4', name:'Socio-Economic Livelihood Support', dept:'D3'},
  {id:'P5', name:'Legal Assistance & FPIC Facilitation', dept:'D5'},
  {id:'P6', name:'Administrative & General Support', dept:'D1'},
];

const VENDORS = [
  {id:'V1', name:'Benguet Office Supplies Corp.', category:'Supplies', tin:'201-334-556-000', status:'Active'},
  {id:'V2', name:'Highland Fuel & Transport Services', category:'Transport', tin:'188-902-771-000', status:'Active'},
  {id:'V3', name:'Cordillera Printing Press', category:'Printing', tin:'214-556-330-000', status:'Active'},
  {id:'V4', name:'BENECO', category:'Utilities', tin:'000-123-456-000', status:'Active'},
  {id:'V5', name:'La Trinidad IT Solutions', category:'IT Equipment', tin:'229-887-410-000', status:'Active'},
  {id:'V6', name:'Session Road Catering Services', category:'Catering', tin:'207-441-982-000', status:'Inactive'},
  {id:'V7', name:'Baguio Water District', category:'Utilities', tin:'000-556-221-000', status:'Active'},
];

const ROLES = [
  {id:'R1', name:'System Administrator', perms:['view','create','edit','delete','approve','export','print','manageUsers','manageSettings']},
  {id:'R2', name:'Finance Administrator', perms:['view','create','edit','delete','approve','export','print','manageUsers','manageSettings']},
  {id:'R3', name:'Accountant', perms:['view','create','edit','export','print']},
  {id:'R4', name:'Budget Officer', perms:['view','create','edit','export','print']},
  {id:'R5', name:'Finance Officer', perms:['view','create','edit','print']},
  {id:'R6', name:'Auditor', perms:['view','export','print']},
  {id:'R7', name:'Approver', perms:['view','approve','print']},
  {id:'R8', name:'Department Manager', perms:['view','create','print']},
  {id:'R9', name:'Viewer', perms:['view']},
];
const PERM_LABELS = [
  ['view','View'],['create','Create'],['edit','Edit'],['delete','Delete'],['approve','Approve'],
  ['export','Export'],['print','Print'],['manageUsers','Manage Users'],['manageSettings','Manage Settings']
];

const USERS_SEED = [
  {id:'U1', name:'Maricel Wandag', empId:'NCIP-0142', dept:'D4', role:'Finance Administrator', email:'m.wandag@ncip.gov.ph', status:'Active'},
  {id:'U2', name:'Adrian Cruz', empId:'NCIP-0198', dept:'D4', role:'Accountant', email:'a.cruz@ncip.gov.ph', status:'Active'},
  {id:'U3', name:'Maria Santos', empId:'NCIP-0177', dept:'D4', role:'Budget Officer', email:'m.santos@ncip.gov.ph', status:'Active'},
  {id:'U4', name:'Atty. Norma Gayudan', empId:'NCIP-0011', dept:'D1', role:'Approver', email:'n.gayudan@ncip.gov.ph', status:'Active'},
  {id:'U5', name:'Engr. Ricardo Bagwan', empId:'NCIP-0056', dept:'D2', role:'Department Manager', email:'r.bagwan@ncip.gov.ph', status:'Active'},
  {id:'U6', name:'Elena Fianza', empId:'NCIP-0083', dept:'D3', role:'Department Manager', email:'e.fianza@ncip.gov.ph', status:'Active'},
  {id:'U7', name:'Jonalyn Pacsi', empId:'NCIP-0121', dept:'D4', role:'Finance Officer', email:'j.pacsi@ncip.gov.ph', status:'Active'},
  {id:'U8', name:'COA Resident Auditor', empId:'COA-2201', dept:'D4', role:'Auditor', email:'coa.benguet@coa.gov.ph', status:'Active'},
  {id:'U9', name:'Atty. Jose Camdas', empId:'NCIP-0034', dept:'D5', role:'Viewer', email:'j.camdas@ncip.gov.ph', status:'Inactive'},
];

const CHART_OF_ACCOUNTS = [
  {code:'1000', name:'Assets', type:'Assets', parent:null},
  {code:'1100', name:'Cash and Cash Equivalents', type:'Assets', parent:'1000'},
  {code:'1110', name:'Cash on Hand', type:'Assets', parent:'1100'},
  {code:'1120', name:'Cash in Bank - LCCA', type:'Assets', parent:'1100'},
  {code:'1200', name:'Receivables', type:'Assets', parent:'1000'},
  {code:'1210', name:'Due from Officers and Employees', type:'Assets', parent:'1200'},
  {code:'1220', name:'Advances to Special Disbursing Officer', type:'Assets', parent:'1200'},
  {code:'1300', name:'Property, Plant and Equipment', type:'Assets', parent:'1000'},
  {code:'2000', name:'Liabilities', type:'Liabilities', parent:null},
  {code:'2100', name:'Accounts Payable', type:'Liabilities', parent:'2000'},
  {code:'2200', name:'Due to BIR', type:'Liabilities', parent:'2000'},
  {code:'2300', name:'Due to GSIS / PhilHealth / Pag-IBIG', type:'Liabilities', parent:'2000'},
  {code:'3000', name:'Equity', type:'Equity', parent:null},
  {code:'3100', name:'Government Equity', type:'Equity', parent:'3000'},
  {code:'4000', name:'Revenue', type:'Revenue', parent:null},
  {code:'4100', name:'Subsidy from National Government', type:'Revenue', parent:'4000'},
  {code:'4200', name:'Other Income', type:'Revenue', parent:'4000'},
  {code:'5000', name:'Expenses', type:'Expenses', parent:null},
  {code:'5010', name:'Personal Services', type:'Expenses', parent:'5000'},
  {code:'5020', name:'Maintenance & Other Operating Expenses', type:'Expenses', parent:'5000'},
  {code:'5021', name:'Travel Expenses', type:'Expenses', parent:'5020'},
  {code:'5022', name:'Utility Expenses', type:'Expenses', parent:'5020'},
  {code:'5023', name:'Office Supplies Expense', type:'Expenses', parent:'5020'},
  {code:'5030', name:'Capital Outlay', type:'Expenses', parent:'5000'},
];

const TXN_TYPES = ['Disbursement','Receipt','Cash Advance','Liquidation','Fund Transfer','Journal Entry','Purchase Request','Purchase Order'];
const CATEGORIES = ['Personal Services','Operating Expense','Capital Outlay','Travel','Utilities','Supplies','Others'];
const STATUSES = ['Draft','Pending','For Review','Approved','Posted','Completed','Rejected'];
const FUND_SOURCES = ['General Fund','Trust Fund','Special Fund - IP Development','National Government Subsidy'];
const PAYEE_NAMES = ['Juan Dela Cruz','Benguet Office Supplies Corp.','Highland Fuel & Transport Services','Cordillera Printing Press','BENECO','La Trinidad IT Solutions','Rosario Bahni','Session Road Catering Services','Baguio Water District','Marites Aliten','Engr. Paul Sagpa-ey','Fely Camsol'];

function buildApprovalHistory(status, preparer, dateISO){
  const chain = [];
  const d0 = new Date(dateISO+'T09:00:00');
  const step = (label, role, user, offsetHrs, comment) => {
    const t = new Date(d0.getTime() + offsetHrs*3600*1000);
    chain.push({label, role, user, date:t.toISOString(), comment: comment||''});
  };
  step('Drafted', 'Preparer', preparer, 0, '');
  const order = ['Draft','Pending','For Review','Approved','Posted','Completed'];
  const idx = order.indexOf(status);
  if(status === 'Rejected'){
    step('Submitted', 'Finance Officer', preparer, 3, '');
    step('Rejected', 'Approver', 'Atty. Norma Gayudan', 30, 'Missing supporting receipts. Please resubmit with documentation.');
    return chain;
  }
  if(idx >= 1) step('Submitted', 'Finance Officer', preparer, 3, '');
  if(idx >= 2) step('For Review', 'Accountant', 'Adrian Cruz', 20, 'Verified against budget allocation.');
  if(idx >= 3) step('Approved', 'Approver', 'Atty. Norma Gayudan', 30, 'Approved for payment.');
  if(idx >= 4) step('Posted', 'Finance Administrator', 'Maricel Wandag', 40, 'Posted to the general ledger.');
  if(idx >= 5) step('Completed', 'Finance Administrator', 'Maricel Wandag', 48, 'Cycle complete.');
  return chain;
}

function generateSampleTransactions(){
  const txns = [];
  const now = new Date();
  let voucherCounter = 1;
  for(let m=5; m>=0; m--){
    const monthDate = new Date(now.getFullYear(), now.getMonth()-m, 1);
    const count = randInt(16,24);
    for(let i=0;i<count;i++){
      const day = randInt(1,27);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const iso = date.toISOString().slice(0,10);
      const type = pick(['Disbursement','Disbursement','Disbursement','Receipt','Cash Advance','Liquidation','Purchase Request','Purchase Order','Journal Entry','Fund Transfer']);
      const program = pick(PROGRAMS);
      const dept = program.dept;
      const isPast = m > 0;
      let status;
      if(isPast){
        status = pick(['Completed','Completed','Completed','Posted','Rejected']);
      } else {
        status = pick(['Draft','Pending','For Review','Approved','Posted','Completed']);
      }
      const baseAmt = type==='Disbursement' ? randInt(8000,260000)
                    : type==='Receipt' ? randInt(4000,140000)
                    : type==='Cash Advance' ? randInt(5000,40000)
                    : type==='Purchase Order' ? randInt(8000,220000)
                    : randInt(1500,60000);
      const voucher = (type==='Receipt'?'OR-':type==='Purchase Order'?'PO-':type==='Purchase Request'?'PR-':'VCH-') + monthDate.getFullYear() + '-' + String(voucherCounter++).padStart(4,'0');
      const preparer = pick(['Adrian Cruz','Maria Santos','Jonalyn Pacsi']);
      txns.push({
        id: uid('TXN'),
        date: iso,
        voucher,
        type,
        account: pick(PAYEE_NAMES),
        category: pick(CATEGORIES),
        department: dept,
        program: program.id,
        fundSource: pick(FUND_SOURCES),
        amount: baseAmt,
        status,
        preparedBy: preparer,
        remarks: pick([
          'Payment for approved obligation request.',
          'Reimbursement of official travel expenses.',
          'Procurement of office supplies for the quarter.',
          'Community livelihood assistance disbursement.',
          'Utility bill settlement.',
          'Cash advance for field validation activities.',
          'Liquidation of prior cash advance.',
          'Honoraria for resource persons.',
        ]),
        approvalHistory: buildApprovalHistory(status, preparer, iso),
      });
    }
  }
  return txns.sort((a,b)=> b.date.localeCompare(a.date));
}

function generateBudgets(transactions){
  return PROGRAMS.map(p=>{
    const allocated = randInt(1800000, 3600000);
    const progTxns = transactions.filter(t=>t.program===p.id && t.type==='Disbursement');
    const disbursed = progTxns.filter(t=>['Posted','Completed'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
    const obligated = disbursed + progTxns.filter(t=>['Approved','For Review','Pending'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
    return {
      id: uid('BUD'),
      program: p.name,
      programId: p.id,
      department: p.dept,
      fundSource: pick(FUND_SOURCES),
      allocated,
      obligated: Math.min(obligated, allocated),
      disbursed: Math.min(disbursed, allocated),
    };
  });
}

function buildDefaultState(){
  const transactions = generateSampleTransactions();
  const budgets = generateBudgets(transactions);
  const auditLog = [];
  const notifications = [];
  const now = Date.now();
  [
    ['System login', 'Users', 'Maricel Wandag signed in to the system.'],
    ['Report generated', 'Reports', 'Monthly Financial Report for the prior period was generated.'],
    ['Budget amended', 'Budgets', 'Community Development Assistance allocation was revised.'],
    ['Transaction approved', 'Transactions', 'A disbursement voucher was approved.'],
  ].forEach((r,i)=>{
    auditLog.push({id:uid('LOG'), timestamp:new Date(now-(i+1)*3600*1000*7).toISOString(), user:pick(USERS_SEED).name, action:r[0], module:r[1], record:'-', description:r[2]});
  });
  return {
    version: 2,
    settings:{
      orgName:'NCIP Benguet',
      orgFullName:'National Commission on Indigenous Peoples - Benguet Provincial Office',
      address:'2nd Floor, Provincial Capitol Compound, La Trinidad, Benguet',
      fiscalYear:'2026',
      currency:'PHP',
      decimalPrecision:2,
      dateFormat:'MMM d, yyyy',
      theme:'light',
      sessionTimeout:30,
      passwordPolicy:'Minimum 12 characters, upper/lowercase, number and symbol',
    },
    currentUser: {name:'Maricel Wandag', role:'Finance Administrator', dept:'D4', email:'m.wandag@ncip.gov.ph'},
    departments: DEPARTMENTS,
    programs: PROGRAMS,
    vendors: VENDORS,
    users: USERS_SEED,
    roles: ROLES,
    accounts: CHART_OF_ACCOUNTS,
    transactions,
    budgets,
    auditLog,
    notifications,
  };
}

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && parsed.version === 2) return parsed;
    }
  }catch(e){ /* fall through to fresh state */ }
  return buildDefaultState();
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ toast('Could not save locally - storage may be full.', 'error'); }
}
function resetDemoData(){
  state = buildDefaultState();
  saveState();
  toast('Demo data has been reset.', 'success');
  renderAll();
}

function logAudit(action, module, record, description){
  state.auditLog.unshift({
    id: uid('LOG'), timestamp: new Date().toISOString(),
    user: state.currentUser.name, action, module, record, description
  });
  if(state.auditLog.length > 400) state.auditLog.length = 400;
}
function pushNotification(type, message){
  state.notifications.unshift({id:uid('NTF'), type, message, date:new Date().toISOString(), read:false});
  if(state.notifications.length > 60) state.notifications.length = 60;
}

function deptName(id){ const d = state.departments.find(x=>x.id===id); return d?d.name:id; }
function programName(id){ const p = state.programs.find(x=>x.id===id); return p?p.name:id; }
/* ============================================================
   DERIVED CALCULATIONS
   ============================================================ */
function totals(){
  const totalBudget = state.budgets.reduce((s,b)=>s+b.allocated,0);
  const totalObligated = state.budgets.reduce((s,b)=>s+b.obligated,0);
  const totalDisbursed = state.budgets.reduce((s,b)=>s+b.disbursed,0);
  const remaining = Math.max(0, totalBudget - totalObligated);
  const totalReceived = state.transactions.filter(t=>t.type==='Receipt' && ['Posted','Completed'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
  const availableCash = Math.max(totalBudget*0.04, totalReceived*0.6 + remaining*0.18);
  const outstandingPayables = state.transactions.filter(t=>t.type==='Disbursement' && ['Approved','For Review','Pending'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
  const outstandingReceivables = state.transactions.filter(t=>t.type==='Cash Advance' && !['Completed'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
  const utilization = totalBudget ? (totalObligated/totalBudget*100) : 0;
  return {totalBudget,totalObligated,totalDisbursed,remaining,availableCash,outstandingPayables,outstandingReceivables,utilization};
}

function monthKey(d){ return d.toLocaleString('en-US',{month:'short'}); }
function summarizeByMonth(type){
  const months=[], data=[];
  const now = new Date();
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(monthKey(d));
    const key = d.toISOString().slice(0,7);
    const amt = state.transactions.filter(t=> t.date.startsWith(key) && t.type===(type||'Disbursement') && t.status!=='Rejected').reduce((s,t)=>s+t.amount,0);
    data.push(Math.round(amt));
  }
  return {labels:months, data};
}
function summarizeByCategory(){
  const map = {};
  state.transactions.filter(t=>t.type==='Disbursement' && t.status!=='Rejected').forEach(t=>{ map[t.category]=(map[t.category]||0)+t.amount; });
  const labels = Object.keys(map); const data = labels.map(l=>Math.round(map[l]));
  if(!labels.length) return {labels:['No data'], data:[0]};
  return {labels, data};
}
function summarizeDeptUtilization(){
  return state.departments.map(d=>{
    const depBudgets = state.budgets.filter(b=>b.department===d.id);
    const alloc = depBudgets.reduce((s,b)=>s+b.allocated,0);
    const obl = depBudgets.reduce((s,b)=>s+b.obligated,0);
    return {label:d.name.split(' ').slice(0,2).join(' '), pct: alloc ? Math.round(obl/alloc*100) : 0};
  }).filter(x=>x.pct>0 || true);
}
function financialHealth(){
  const t = totals();
  const utilScore = clamp(100 - Math.abs(t.utilization-70)*1.4, 0, 100);
  const cashScore = clamp((t.availableCash / Math.max(1,t.totalBudget*0.15))*100, 0, 100);
  const obligationScore = clamp(100 - (t.outstandingPayables / Math.max(1,t.totalBudget) * 300), 0, 100);
  const pendingCount = state.transactions.filter(t=>['Pending','For Review'].includes(t.status)).length;
  const backlogScore = clamp(100 - pendingCount*3, 0, 100);
  const rejectedRate = state.transactions.length ? state.transactions.filter(t=>t.status==='Rejected').length/state.transactions.length : 0;
  const varianceScore = clamp(100 - rejectedRate*400, 0, 100);
  const overall = Math.round((utilScore*0.25 + cashScore*0.2 + obligationScore*0.2 + backlogScore*0.15 + varianceScore*0.2));
  return {
    overall,
    rows:[
      {label:'Budget utilization', pct:Math.round(utilScore)},
      {label:'Cash position', pct:Math.round(cashScore)},
      {label:'Outstanding obligations', pct:Math.round(obligationScore)},
      {label:'Approval backlog', pct:Math.round(backlogScore)},
      {label:'Spending variance', pct:Math.round(varianceScore)},
    ]
  };
}
function computeAlerts(){
  const alerts = [];
  state.budgets.forEach(b=>{
    const pct = b.allocated ? Math.round(b.obligated/b.allocated*100) : 0;
    if(pct >= 80) alerts.push({level: pct>=95?'red':'amber', text: `<b>${escapeHtml(b.program)}</b> budget is ${pct}% utilized.`});
  });
  const pendingCount = state.transactions.filter(t=>['Pending','For Review'].includes(t.status)).length;
  if(pendingCount>0) alerts.push({level:'blue', text:`<b>${pendingCount}</b> transaction${pendingCount===1?'':'s'} awaiting approval.`});
  const m = summarizeByMonth('Disbursement');
  if(m.data.length>=2 && m.data[m.data.length-2] > 0){
    const growth = ((m.data[m.data.length-1]-m.data[m.data.length-2])/m.data[m.data.length-2]*100);
    if(Math.abs(growth) > 8) alerts.push({level: growth>0?'amber':'green', text:`Disbursements ${growth>0?'increased':'decreased'} <b>${Math.abs(growth).toFixed(1)}%</b> this month.`});
  }
  const t = totals();
  alerts.push({level:'green', text:`<b>${fmtCurrency(t.remaining)}</b> remains available for the current fiscal period.`});
  return alerts;
}

/* ============================================================
   GENERAL LEDGER (derived from transactions)
   ============================================================ */
function txnLedgerAccount(t){
  if(t.type==='Disbursement') return t.category==='Personal Services' ? '5010' : t.category==='Capital Outlay' ? '5030' : t.category==='Travel' ? '5021' : t.category==='Utilities' ? '5022' : t.category==='Supplies' ? '5023' : '5020';
  if(t.type==='Receipt') return '4100';
  if(t.type==='Cash Advance') return '1220';
  if(t.type==='Liquidation') return '1220';
  return '1120';
}
function buildLedgerEntries(){
  const posted = state.transactions.filter(t=>['Posted','Completed'].includes(t.status));
  const entries = posted.map(t=>{
    const isDebit = t.type==='Disbursement' || t.type==='Cash Advance';
    return {
      date:t.date, account:txnLedgerAccount(t), reference:t.voucher,
      description: t.account + ' - ' + t.remarks,
      debit: isDebit ? t.amount : 0,
      credit: !isDebit ? t.amount : 0,
    };
  }).sort((a,b)=>a.date.localeCompare(b.date));
  const balances = {};
  entries.forEach(e=>{
    balances[e.account] = (balances[e.account]||0) + e.debit - e.credit;
    e.balance = balances[e.account];
  });
  return entries.reverse();
}

/* ============================================================
   CANVAS CHARTS (light theme, CSS-var aware)
   ============================================================ */
function cssv(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function prepCanvas(canvas){
  if(!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width || canvas.width;
  const H = canvas.getAttribute('data-h') ? +canvas.getAttribute('data-h') : canvas.height;
  const DPR = window.devicePixelRatio || 1;
  canvas.width = W*DPR; canvas.height = H*DPR;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);
  return {ctx, W, H};
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function drawLineChart(canvas, labels, data, color){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  color = color || cssv('--teal-600');
  const pad = 38;
  const innerW = W-pad*2, innerH = H-pad*2-14;
  const max = Math.max(1, ...data);
  const stepX = innerW/Math.max(1,labels.length-1);
  const pts = data.map((v,i)=>({x:pad+i*stepX, y:pad+innerH-(v/max)*innerH, v}));
  const grad = ctx.createLinearGradient(0,pad,0,pad+innerH);
  grad.addColorStop(0, color+'2e'); grad.addColorStop(1, color+'02');
  ctx.beginPath(); pts.forEach((pt,i)=> i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
  ctx.lineTo(pad+innerW,pad+innerH); ctx.lineTo(pad,pad+innerH); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); pts.forEach((pt,i)=> i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
  ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.stroke();
  pts.forEach(pt=>{ ctx.beginPath(); ctx.fillStyle=cssv('--surface'); ctx.arc(pt.x,pt.y,4,0,7); ctx.fill(); ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.stroke(); });
  ctx.fillStyle = cssv('--muted'); ctx.font='11px Inter,system-ui'; ctx.textAlign='center';
  labels.forEach((lab,i)=> ctx.fillText(lab, pts[i].x, pad+innerH+22));
  ctx.fillStyle = cssv('--muted-2'); ctx.textAlign='left';
  ctx.fillText(fmtCompact(max), 6, pad-6);
}
function drawBarChart(canvas, labels, data, color){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  color = color || cssv('--navy-700');
  const pad=32; const innerW=W-pad*2, innerH=H-pad*2-14;
  const max = Math.max(1, ...data);
  const barW = innerW/(data.length*1.7);
  data.forEach((v,i)=>{
    const x = pad + i*(innerW/data.length) + (innerW/data.length - barW)/2;
    const h = (v/max)*innerH; const y = pad+(innerH-h);
    ctx.fillStyle = color; roundRect(ctx,x,y,barW,h,4); ctx.fill();
    ctx.fillStyle = cssv('--muted'); ctx.font='11px Inter,system-ui'; ctx.textAlign='center';
    ctx.fillText(labels[i], x+barW/2, pad+innerH+22);
  });
  ctx.fillStyle = cssv('--muted-2'); ctx.textAlign='left';
  ctx.fillText(fmtCompact(max), 6, pad-6);
}
function drawGroupedBarChart(canvas, labels, seriesA, seriesB, colorA, colorB, legendA, legendB){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  const pad=32; const innerW=W-pad*2, innerH=H-pad*2-30;
  const max = Math.max(1, ...seriesA, ...seriesB);
  const groupW = innerW/labels.length;
  const barW = groupW*0.32;
  labels.forEach((lab,i)=>{
    const gx = pad + i*groupW;
    const hA = (seriesA[i]/max)*innerH, hB=(seriesB[i]/max)*innerH;
    ctx.fillStyle = colorA; roundRect(ctx, gx+groupW*0.14, pad+innerH-hA, barW, hA, 3); ctx.fill();
    ctx.fillStyle = colorB; roundRect(ctx, gx+groupW*0.54, pad+innerH-hB, barW, hB, 3); ctx.fill();
    ctx.fillStyle = cssv('--muted'); ctx.font='10.5px Inter,system-ui'; ctx.textAlign='center';
    ctx.fillText(lab, gx+groupW/2, pad+innerH+18);
  });
  ctx.textAlign='left'; ctx.font='11px Inter,system-ui';
  ctx.fillStyle=colorA; ctx.fillRect(pad, H-16, 9, 9); ctx.fillStyle=cssv('--ink-2'); ctx.fillText(legendA, pad+14, H-7);
  ctx.fillStyle=colorB; ctx.fillRect(pad+110, H-16, 9, 9); ctx.fillStyle=cssv('--ink-2'); ctx.fillText(legendB, pad+124, H-7);
}
function drawDonutChart(canvas, labels, data){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  const cx = W*0.32, cy=H/2, r=Math.min(W*0.32,H*0.4);
  const total = data.reduce((s,v)=>s+v,0)||1;
  let start=-Math.PI/2;
  const colors=[cssv('--navy-700'),cssv('--teal-600'),cssv('--blue-600'),cssv('--amber-700'),cssv('--green-600'),cssv('--red-600')];
  data.forEach((v,i)=>{
    const slice=(v/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    start+=slice;
  });
  ctx.beginPath(); ctx.fillStyle=cssv('--surface'); ctx.arc(cx,cy,r*0.58,0,7); ctx.fill();
  ctx.font='11px Inter,system-ui'; ctx.textAlign='left';
  const legendX = cx+r+22;
  labels.forEach((lab,i)=>{
    ctx.fillStyle=colors[i%colors.length]; ctx.fillRect(legendX, 14+i*20, 10,10);
    ctx.fillStyle=cssv('--ink-2'); ctx.fillText(lab.length>16?lab.slice(0,16)+'…':lab, legendX+15, 23+i*20);
  });
}
function drawHBarChart(canvas, labels, data, target){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  const pad=8, labelW=118, rightPad=44;
  const rowH = H/labels.length;
  const max = 100;
  labels.forEach((lab,i)=>{
    const y = i*rowH + rowH*0.28;
    ctx.fillStyle = cssv('--ink-2'); ctx.font='11px Inter,system-ui'; ctx.textAlign='left';
    ctx.fillText(lab.length>18?lab.slice(0,18)+'…':lab, pad, y+rowH*0.28);
    const barX = labelW, barMaxW = W-labelW-rightPad;
    ctx.fillStyle = cssv('--surface-3'); roundRect(ctx, barX, y, barMaxW, rowH*0.4, 4); ctx.fill();
    const v = clamp(data[i],0,999);
    const w = clamp(v/max,0,1)*barMaxW;
    ctx.fillStyle = v>=95?cssv('--red-600'):v>=80?cssv('--amber-700'):cssv('--teal-600');
    roundRect(ctx, barX, y, w, rowH*0.4, 4); ctx.fill();
    ctx.fillStyle = cssv('--muted'); ctx.textAlign='left'; ctx.font='10.5px Inter,system-ui';
    ctx.fillText(v+'%', barX+barMaxW+8, y+rowH*0.32);
  });
}
function drawHealthRing(canvas, pct){
  const p = prepCanvas(canvas); if(!p) return; const {ctx,W,H} = p;
  const cx=W/2, cy=H/2, r=Math.min(W,H)/2-7;
  ctx.lineWidth=8; ctx.strokeStyle=cssv('--surface-3');
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  const color = pct>=75?cssv('--green-600'):pct>=50?cssv('--amber-700'):cssv('--red-600');
  ctx.strokeStyle=color; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2, -Math.PI/2 + (pct/100)*Math.PI*2); ctx.stroke();
}
/* ============================================================
   SHARED UI HELPERS
   ============================================================ */
function statusBadge(status){
  const map = {
    Draft:'gray', Pending:'amber', 'For Review':'blue', Approved:'blue',
    Posted:'green', Completed:'green', Rejected:'red', Active:'green', Inactive:'gray'
  };
  return `<span class="badge ${map[status]||'gray'}"><span class="dot"></span>${escapeHtml(status)}</span>`;
}
function kpiHTML(label, value, meta, trendPct, barPct){
  const trend = (trendPct==null) ? '' : `<span class="k-trend ${trendPct>=0?'up':'down'}">${trendPct>=0?'▲':'▼'} ${Math.abs(trendPct).toFixed(1)}%</span>`;
  return `
    <div class="k-label"><span>${escapeHtml(label)}</span></div>
    <div class="k-value">${value}</div>
    <div class="k-meta">${trend}<span class="k-ctx">${escapeHtml(meta||'')}</span></div>
    ${barPct!=null ? `<div class="k-bar"><div style="width:${clamp(barPct,0,100)}%"></div></div>` : ''}
  `;
}
function emptyState(title, msg, actionLabel, actionFn){
  const btnId = 'es_'+Math.random().toString(36).slice(2,8);
  setTimeout(()=>{ const b=$('#'+btnId); if(b && actionFn) b.addEventListener('click', actionFn); },0);
  return `<div class="empty-state">
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 9h18" stroke="currentColor" stroke-width="1.4"/></svg>
    <h4>${escapeHtml(title)}</h4><p>${escapeHtml(msg)}</p>
    ${actionLabel? `<button class="btn primary sm" id="${btnId}">${escapeHtml(actionLabel)}</button>` : ''}
  </div>`;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const t = totals();
  $('#kpi-totalBudget').innerHTML = kpiHTML('Total Budget', fmtCompact(t.totalBudget), 'Allocated across all programs');
  $('#kpi-obligated').innerHTML = kpiHTML('Total Obligated', fmtCompact(t.totalObligated), 'Committed against allocation', null, t.totalBudget? t.totalObligated/t.totalBudget*100:0);
  $('#kpi-disbursed').innerHTML = kpiHTML('Total Disbursed', fmtCompact(t.totalDisbursed), 'Actually paid out', null, t.totalBudget? t.totalDisbursed/t.totalBudget*100:0);
  $('#kpi-remaining').innerHTML = kpiHTML('Remaining Balance', fmtCompact(t.remaining), 'Available for obligation');

  const m = summarizeByMonth('Disbursement');
  const growth = m.data.length>=2 && m.data[m.data.length-2] ? (m.data[m.data.length-1]-m.data[m.data.length-2])/m.data[m.data.length-2]*100 : 0;
  $('#kpi-utilization').innerHTML = kpiHTML('Budget Utilization', t.utilization.toFixed(1)+'%', 'vs. allocation', growth);
  $('#kpi-cash').innerHTML = kpiHTML('Available Cash', fmtCompact(t.availableCash), 'Estimated on-hand + in-bank');
  $('#kpi-payables').innerHTML = kpiHTML('Outstanding Payables', fmtCompact(t.outstandingPayables), 'Pending disbursement');
  $('#kpi-receivables').innerHTML = kpiHTML('Outstanding Receivables', fmtCompact(t.outstandingReceivables), 'Unliquidated cash advances');

  drawLineChart($('#chartTrend'), m.labels, m.data);
  const dept = summarizeDeptUtilization();
  drawHBarChart($('#chartDeptUtil'), dept.map(d=>d.label), dept.map(d=>d.pct));
  const cat = summarizeByCategory();
  drawDonutChart($('#chartCat'), cat.labels, cat.data);

  const health = financialHealth();
  $('#healthScoreNum').textContent = health.overall;
  drawHealthRing($('#healthRing'), health.overall);
  $('#healthList').innerHTML = health.rows.map(r=>`
    <div class="health-row"><div class="hr-label">${escapeHtml(r.label)}</div>
    <div class="hr-bar"><div style="width:${r.pct}%;background:${r.pct>=75?'var(--green-600)':r.pct>=50?'var(--amber-700)':'var(--red-600)'}"></div></div>
    <div class="hr-val">${r.pct}%</div></div>`).join('');

  const alerts = computeAlerts();
  const alertIcon = {red:'⛔',amber:'⚠️',blue:'ℹ️',green:'✓'};
  const alertBg = {red:'var(--red-100)',amber:'var(--amber-100)',blue:'var(--blue-100)',green:'var(--green-100)'};
  $('#alertsList').innerHTML = alerts.length ? alerts.map(a=>`
    <div class="alert-item"><div class="alert-ic" style="background:${alertBg[a.level]}">${alertIcon[a.level]}</div><div class="alert-txt">${a.text}</div></div>
  `).join('') : emptyState('No alerts', 'Everything looks within normal range.');

  const recent = state.transactions.slice(0,7);
  $('#recentList').innerHTML = recent.length ? recent.map(r=>`
    <div class="activity-item">
      <div class="activity-dot" style="background:${txnTypeColor(r.type)}">${initials(r.account)}</div>
      <div class="activity-txt" style="flex:1;min-width:0;display:flex;justify-content:space-between;gap:10px">
        <div><div class="a-title">${escapeHtml(r.account)}</div><div class="a-meta">${escapeHtml(r.voucher)} · ${fmtDate(r.date)} · ${escapeHtml(r.type)}</div></div>
        <div style="text-align:right;flex:0 0 auto"><div style="font-family:var(--font-mono);font-weight:650">${fmtCurrency(r.amount)}</div>${statusBadge(r.status)}</div>
      </div>
    </div>`).join('') : emptyState('No transactions yet','Record your first transaction to see it here.');

  const acts = [
    {icon:'📝', bg:'var(--navy-700)', title:'New disbursement voucher recorded', meta: state.transactions[0] ? fmtDate(state.transactions[0].date) : ''},
    {icon:'✅', bg:'var(--green-600)', title:'A transaction was approved', meta: timeAgo(new Date(Date.now()-3600e3*5).toISOString())},
    {icon:'📊', bg:'var(--teal-600)', title:'Monthly Financial Report generated', meta: timeAgo(new Date(Date.now()-3600e3*22).toISOString())},
    {icon:'👤', bg:'var(--blue-600)', title:'Maricel Wandag signed in', meta: 'just now'},
  ];
  $('#activityList').innerHTML = acts.map(a=>`
    <div class="activity-item"><div class="activity-dot" style="background:${a.bg}">${a.icon}</div>
      <div class="activity-txt"><div class="a-title">${a.title}</div><div class="a-meta">${a.meta}</div></div></div>
  `).join('');
}
function txnTypeColor(type){
  const map = {Disbursement:'var(--navy-700)', Receipt:'var(--green-600)', 'Cash Advance':'var(--amber-700)',
    Liquidation:'var(--blue-600)', 'Fund Transfer':'var(--teal-600)', 'Journal Entry':'var(--gray-600)',
    'Purchase Request':'var(--red-600)', 'Purchase Order':'var(--navy-600)'};
  return map[type] || 'var(--gray-600)';
}

/* ============================================================
   TRANSACTIONS
   ============================================================ */
let txnFilters = {q:'', type:'', status:'', dept:'', from:'', to:''};
let txnPage = 1;
const TXN_PAGE_SIZE = 12;

function populateTxnFilterOptions(){
  const typeSel = $('#txnFilterType');
  typeSel.innerHTML = '<option value="">All types</option>' + TXN_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');
  $('#txnFilterStatus').innerHTML = '<option value="">All statuses</option>' + STATUSES.map(s=>`<option>${s}</option>`).join('');
  $('#txnFilterDept').innerHTML = '<option value="">All departments</option>' + state.departments.map(d=>`<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
}
function filteredTransactions(){
  return state.transactions.filter(t=>{
    if(txnFilters.type && t.type!==txnFilters.type) return false;
    if(txnFilters.status && t.status!==txnFilters.status) return false;
    if(txnFilters.dept && t.department!==txnFilters.dept) return false;
    if(txnFilters.from && t.date < txnFilters.from) return false;
    if(txnFilters.to && t.date > txnFilters.to) return false;
    if(txnFilters.q){
      const q = txnFilters.q.toLowerCase();
      const hay = [t.voucher,t.account,t.category,t.remarks,programName(t.program)].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}
function renderTransactions(){
  populateTxnFilterOptions();
  $('#txnFilterType').value = txnFilters.type;
  $('#txnFilterStatus').value = txnFilters.status;
  $('#txnFilterDept').value = txnFilters.dept;
  $('#txnSearch').value = txnFilters.q;
  $('#txnFilterFrom').value = txnFilters.from;
  $('#txnFilterTo').value = txnFilters.to;

  const list = filteredTransactions();
  const totalPages = Math.max(1, Math.ceil(list.length/TXN_PAGE_SIZE));
  txnPage = clamp(txnPage,1,totalPages);
  const pageItems = list.slice((txnPage-1)*TXN_PAGE_SIZE, txnPage*TXN_PAGE_SIZE);

  const tbody = $('#txnTableBody');
  if(!pageItems.length){
    tbody.innerHTML = `<tr><td colspan="9">${emptyState('No transactions found','Try adjusting your filters, or create a new transaction.','+ Add transaction', ()=>openTxnModal(null))}</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(t=>`
      <tr data-id="${t.id}">
        <td data-label="Date">${fmtDate(t.date)}</td>
        <td data-label="Voucher" class="mono">${escapeHtml(t.voucher)}</td>
        <td data-label="Type">${escapeHtml(t.type)}</td>
        <td data-label="Payee / Account">${escapeHtml(t.account)}</td>
        <td data-label="Program">${escapeHtml(programName(t.program))}</td>
        <td data-label="Department">${escapeHtml(deptName(t.department))}</td>
        <td data-label="Amount" class="num">${fmtCurrency(t.amount)}</td>
        <td data-label="Status">${statusBadge(t.status)}</td>
        <td data-label="">
          <div class="row-actions">
            <button class="icon-sm-btn" data-act="view" title="View document"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg></button>
            <button class="icon-sm-btn" data-act="edit" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
            <button class="icon-sm-btn" data-act="dup" title="Duplicate"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg></button>
            <button class="icon-sm-btn" data-act="del" title="Delete" style="color:var(--red-600)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
          </div>
        </td>
      </tr>`).join('');
  }
  $('#txnPager').innerHTML = `
    <div>${list.length} record${list.length===1?'':'s'} · page ${txnPage} of ${totalPages}</div>
    <div class="pager-btns">
      <button class="btn ghost sm" id="txnPrevPage" ${txnPage<=1?'disabled':''}>Previous</button>
      <button class="btn ghost sm" id="txnNextPage" ${txnPage>=totalPages?'disabled':''}>Next</button>
    </div>`;
  $('#txnPrevPage') && $('#txnPrevPage').addEventListener('click', ()=>{ txnPage--; renderTransactions(); });
  $('#txnNextPage') && $('#txnNextPage').addEventListener('click', ()=>{ txnPage++; renderTransactions(); });

  $$('#txnTableBody button[data-act]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr = btn.closest('tr'); const id = tr.dataset.id;
      const item = state.transactions.find(x=>x.id===id);
      const act = btn.dataset.act;
      if(act==='view') openDocModal(item);
      if(act==='edit') openTxnModal(item);
      if(act==='dup'){
        const copy = Object.assign({}, item, {id:uid('TXN'), voucher: item.voucher+'-COPY', status:'Draft', date: todayISO()});
        state.transactions.unshift(copy); saveState(); logAudit('Transaction duplicated','Transactions',copy.voucher,'Duplicated from '+item.voucher);
        renderTransactions(); renderDashboard(); toast('Transaction duplicated.','success');
      }
      if(act==='del'){
        if(!confirm('Delete transaction '+item.voucher+'? This cannot be undone.')) return;
        state.transactions = state.transactions.filter(x=>x.id!==id);
        saveState(); logAudit('Transaction deleted','Transactions',item.voucher,'Deleted by user.');
        renderTransactions(); renderDashboard(); renderBudgetsView(); toast('Transaction deleted.','success');
      }
    });
  });
}

/* ============================================================
   BUDGETS
   ============================================================ */
let activeBudgetTab = 'overview';
function renderBudgetsView(){
  const t = totals();
  $('#bkpi-alloc').innerHTML = kpiHTML('Total Allocated', fmtCompact(t.totalBudget), 'All programs, FY '+state.settings.fiscalYear);
  $('#bkpi-obl').innerHTML = kpiHTML('Total Obligated', fmtCompact(t.totalObligated), 'Committed');
  $('#bkpi-disb').innerHTML = kpiHTML('Total Disbursed', fmtCompact(t.totalDisbursed), 'Paid out');
  $('#bkpi-rem').innerHTML = kpiHTML('Remaining', fmtCompact(t.remaining), 'Unobligated balance');

  $('#budgetOverviewPane').classList.toggle('hidden', activeBudgetTab!=='overview');
  $('#budgetProgramPane').classList.toggle('hidden', activeBudgetTab!=='program');
  $('#budgetDepartmentPane').classList.toggle('hidden', activeBudgetTab!=='department');
  $$('.tab-btn[data-btab]').forEach(b=> b.classList.toggle('active', b.dataset.btab===activeBudgetTab));

  const cardsFor = (budgets) => budgets.map(b=>{
    const pct = b.allocated ? Math.round(b.obligated/b.allocated*100) : 0;
    const oblPct = b.allocated ? (b.obligated/b.allocated*100) : 0;
    const disbPct = b.allocated ? (b.disbursed/b.allocated*100) : 0;
    return `<div class="col-4"><div class="card" data-budget-id="${b.id}" style="cursor:pointer">
      <div class="flex-between"><h3>${escapeHtml(b.program)}</h3><span class="badge ${pct>=95?'red':pct>=80?'amber':'green'}">${pct}%</span></div>
      <div class="muted" style="font-size:11.5px;margin-top:2px">${escapeHtml(deptName(b.department))} · ${escapeHtml(b.fundSource)}</div>
      <div class="mt-16 flow-track"><div class="seg-obl" style="width:${clamp(oblPct,0,100)}%"></div><div class="seg-disb" style="width:${clamp(disbPct,0,100)}%;margin-left:-${clamp(oblPct,0,100)}%"></div></div>
      <div class="flow-legend"><span><i style="background:var(--blue-600)"></i>Obligated ${fmtCompact(b.obligated)}</span><span><i style="background:var(--teal-600)"></i>Disbursed ${fmtCompact(b.disbursed)}</span></div>
      <div class="flex-between mt-16" style="font-size:12px"><span class="muted">Allocated</span><span style="font-family:var(--font-mono);font-weight:650">${fmtCurrency(b.allocated)}</span></div>
    </div></div>`;
  }).join('');

  if(activeBudgetTab==='overview'){
    $('#budgetCardGrid').className='grid';
    $('#budgetCardGrid').innerHTML = state.budgets.length ? cardsFor(state.budgets) : emptyState('No budgets yet','Create a program budget to start tracking allocations.','+ New budget', ()=>openBudgetModal());
  } else if(activeBudgetTab==='program'){
    $('#budgetProgramPane').innerHTML = `<div class="grid">${cardsFor(state.budgets)}</div>`;
  } else {
    const byDept = state.departments.map(d=>{
      const bl = state.budgets.filter(b=>b.department===d.id);
      const alloc = bl.reduce((s,b)=>s+b.allocated,0), obl = bl.reduce((s,b)=>s+b.obligated,0), disb = bl.reduce((s,b)=>s+b.disbursed,0);
      return Object.assign({},{program:d.name, department:d.id, fundSource:bl.length+' program(s)', allocated:alloc, obligated:obl, disbursed:disb, id:d.id});
    });
    $('#budgetDepartmentPane').innerHTML = `<div class="grid">${cardsFor(byDept)}</div>`;
  }
  $$('[data-budget-id]').forEach(card=>{
    card.addEventListener('click', ()=>{
      const b = state.budgets.find(x=>x.id===card.dataset.budgetId);
      if(b) openBudgetDetail(b);
    });
  });
}
function openBudgetDetail(b){
  const related = state.transactions.filter(t=>t.program===b.programId).slice(0,8);
  const pct = b.allocated? Math.round(b.obligated/b.allocated*100):0;
  $('#docModalBody').innerHTML = `
    <div class="flex-between"><h2 style="font-family:var(--font-display)">${escapeHtml(b.program)}</h2>${statusBadge(pct>=95?'Rejected':pct>=80?'Pending':'Approved')}</div>
    <div class="muted" style="font-size:12.5px">${escapeHtml(deptName(b.department))} · ${escapeHtml(b.fundSource)}</div>
    <div class="grid mt-16">
      <div class="col-3"><div class="kpi">${kpiHTML('Allocated', fmtCompact(b.allocated))}</div></div>
      <div class="col-3"><div class="kpi">${kpiHTML('Obligated', fmtCompact(b.obligated))}</div></div>
      <div class="col-3"><div class="kpi">${kpiHTML('Disbursed', fmtCompact(b.disbursed))}</div></div>
      <div class="col-3"><div class="kpi">${kpiHTML('Remaining', fmtCompact(b.allocated-b.obligated))}</div></div>
    </div>
    <h4 class="mt-16" style="margin-bottom:8px;font-size:13px">Related financial activity</h4>
    <div class="table-wrap"><table class="dt"><thead><tr><th>Date</th><th>Voucher</th><th>Payee</th><th class="num">Amount</th><th>Status</th></tr></thead>
    <tbody>${related.length?related.map(t=>`<tr><td>${fmtDate(t.date)}</td><td class="mono">${escapeHtml(t.voucher)}</td><td>${escapeHtml(t.account)}</td><td class="num">${fmtCurrency(t.amount)}</td><td>${statusBadge(t.status)}</td></tr>`).join(''):'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted)">No linked activity yet.</td></tr>'}</tbody></table></div>
  `;
  $('#docPrintBtn').onclick = ()=>window.print();
  openModal('docModal');
}
/* ============================================================
   CHART OF ACCOUNTS
   ============================================================ */
function accountBalance(code){
  const entries = buildLedgerEntries().filter(e=>e.account===code);
  return entries.reduce((s,e)=>s+e.debit-e.credit,0);
}
function renderAccountsView(filterQ, filterType){
  filterQ = (filterQ||'').toLowerCase();
  const roots = state.accounts.filter(a=>!a.parent);
  const children = pid => state.accounts.filter(a=>a.parent===pid);
  const matches = a => {
    if(filterType && a.type!==filterType) return false;
    if(filterQ && !(a.code+' '+a.name).toLowerCase().includes(filterQ)) return false;
    return true;
  };
  function anyDescendantMatches(a){
    if(matches(a)) return true;
    return children(a.code).some(anyDescendantMatches);
  }
  function row(a, depth){
    const kids = children(a.code);
    if(!anyDescendantMatches(a)) return '';
    const bal = accountBalance(a.code);
    const hasKids = kids.length>0;
    return `<div>
      <div class="tree-row" data-code="${a.code}" style="padding-left:${depth*18+10}px">
        <span class="twist">${hasKids?'▾':''}</span>
        <span class="acode">${a.code}</span>
        <span class="aname">${escapeHtml(a.name)}</span>
        <span class="badge gray" style="margin-right:8px">${a.type}</span>
        <span class="abal">${fmtCurrency(bal)}</span>
      </div>
      ${hasKids?`<div class="tree-children open" data-parent="${a.code}">${kids.map(k=>row(k,depth+1)).join('')}</div>`:''}
    </div>`;
  }
  $('#coaTree').innerHTML = roots.map(r=>row(r,0)).join('') || emptyState('No accounts found','Try a different search or filter.');
  $$('.tree-row .twist').forEach(t=>{
    if(!t.textContent) return;
    t.parentElement.addEventListener('click', (e)=>{
      const kids = t.parentElement.nextElementSibling;
      if(kids && kids.classList.contains('tree-children')){
        kids.classList.toggle('open');
        t.textContent = kids.classList.contains('open') ? '▾' : '▸';
      }
    });
  });
}

/* ============================================================
   GENERAL LEDGER
   ============================================================ */
function renderLedgerView(){
  const accSel = $('#glFilterAccount');
  if(!accSel.dataset.filled){
    accSel.innerHTML = '<option value="">All accounts</option>' + state.accounts.filter(a=>a.parent).map(a=>`<option value="${a.code}">${a.code} - ${escapeHtml(a.name)}</option>`).join('');
    accSel.dataset.filled='1';
  }
  let entries = buildLedgerEntries();
  const accFilter = accSel.value, from = $('#glFilterFrom').value, to = $('#glFilterTo').value;
  if(accFilter) entries = entries.filter(e=>e.account===accFilter);
  if(from) entries = entries.filter(e=>e.date>=from);
  if(to) entries = entries.filter(e=>e.date<=to);
  const tbody = $('#glTableBody');
  tbody.innerHTML = entries.length ? entries.slice(0,120).map(e=>{
    const acc = state.accounts.find(a=>a.code===e.account);
    return `<tr>
      <td data-label="Date">${fmtDate(e.date)}</td>
      <td data-label="Account" class="mono">${e.account} - ${escapeHtml(acc?acc.name:'')}</td>
      <td data-label="Reference" class="mono">${escapeHtml(e.reference)}</td>
      <td data-label="Description">${escapeHtml(e.description)}</td>
      <td data-label="Debit" class="num">${e.debit?fmtCurrency(e.debit):'-'}</td>
      <td data-label="Credit" class="num">${e.credit?fmtCurrency(e.credit):'-'}</td>
      <td data-label="Balance" class="num ${e.balance<0?'amt-neg':''}">${fmtCurrency(e.balance)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7">${emptyState('No ledger entries','Entries appear here once transactions are posted or completed.')}</td></tr>`;
}

/* ============================================================
   VENDORS
   ============================================================ */
function renderVendorsView(){
  const tbody = $('#vendorTableBody');
  tbody.innerHTML = state.vendors.map(v=>{
    const ytd = state.transactions.filter(t=>t.account===v.name && ['Posted','Completed'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
    return `<tr>
      <td data-label="Vendor">${escapeHtml(v.name)}</td>
      <td data-label="Category">${escapeHtml(v.category)}</td>
      <td data-label="TIN" class="mono">${escapeHtml(v.tin)}</td>
      <td data-label="YTD Payments" class="num">${fmtCurrency(ytd)}</td>
      <td data-label="Status">${statusBadge(v.status)}</td>
    </tr>`;
  }).join('');
}

/* ============================================================
   REPORTS CENTER
   ============================================================ */
const REPORT_DEFS = {
  financial: [
    {id:'income-expense', name:'Income & Expense Statement', desc:'Revenue and expenses for the selected period.'},
    {id:'balance-sheet', name:'Balance Sheet', desc:'Assets, liabilities and equity as of period end.'},
    {id:'cash-flow', name:'Cash Flow Statement', desc:'Cash inflows and outflows by activity.'},
    {id:'trial-balance', name:'Trial Balance', desc:'Debit and credit balances by account.'},
    {id:'general-ledger', name:'General Ledger Extract', desc:'Full posted-entry detail for the period.'},
  ],
  budget: [
    {id:'budget-vs-actual', name:'Budget vs Actual', desc:'Allocation compared with obligations and disbursements.'},
    {id:'budget-utilization', name:'Budget Utilization', desc:'Utilization rate by program and department.'},
    {id:'budget-variance', name:'Budget Variance', desc:'Variance between planned and actual spend.'},
    {id:'program-budget', name:'Program Budget Report', desc:'Detail per program budget.'},
    {id:'department-budget', name:'Department Budget Report', desc:'Detail per department budget.'},
  ],
  transaction: [
    {id:'transaction-register', name:'Transaction Register', desc:'All recorded transactions for the period.'},
    {id:'disbursement-register', name:'Disbursement Register', desc:'All disbursement vouchers for the period.'},
    {id:'receipt-register', name:'Receipt Register', desc:'All official receipts for the period.'},
    {id:'expense-register', name:'Expense Register', desc:'Expenses grouped by category.'},
  ],
  management: [
    {id:'executive-summary', name:'Executive Financial Summary', desc:'High-level snapshot for senior management.'},
    {id:'monthly-report', name:'Monthly Financial Report', desc:'Month-by-month performance summary.'},
    {id:'annual-report', name:'Annual Financial Report', desc:'Full fiscal-year performance summary.'},
    {id:'spending-analysis', name:'Spending Analysis', desc:'Trends and drivers of spending.'},
  ],
};
let activeReportTab = 'financial';
function renderReportsView(){
  $$('.tab-btn[data-rtab]').forEach(b=>b.classList.toggle('active', b.dataset.rtab===activeReportTab));
  const deptSel = $('#repFilterDept'); if(!deptSel.dataset.filled){ deptSel.innerHTML='<option value="">All departments</option>'+state.departments.map(d=>`<option value="${d.id}">${escapeHtml(d.name)}</option>`).join(''); deptSel.dataset.filled='1'; }
  const progSel = $('#repFilterProgram'); if(!progSel.dataset.filled){ progSel.innerHTML='<option value="">All programs</option>'+state.programs.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join(''); progSel.dataset.filled='1'; }
  const defs = REPORT_DEFS[activeReportTab];
  $('#reportGrid').innerHTML = defs.map(r=>`
    <div class="col-4"><div class="card">
      <h3>${r.name}</h3><div class="muted mt-8" style="font-size:12px;min-height:32px">${r.desc}</div>
      <div class="flex gap-8 mt-16">
        <button class="btn primary sm" data-gen="${r.id}" data-name="${escapeHtml(r.name)}">Generate</button>
        <button class="btn ghost sm" data-exp="${r.id}" data-name="${escapeHtml(r.name)}">Export CSV</button>
      </div>
    </div></div>`).join('');
  $$('[data-gen]').forEach(b=>b.addEventListener('click', ()=>generateReport(b.dataset.gen, b.dataset.name)));
  $$('[data-exp]').forEach(b=>b.addEventListener('click', ()=>exportReportCsv(b.dataset.gen, b.dataset.name)));
}
function reportRows(reportId){
  if(['disbursement-register'].includes(reportId)) return state.transactions.filter(t=>t.type==='Disbursement');
  if(['receipt-register'].includes(reportId)) return state.transactions.filter(t=>t.type==='Receipt');
  return state.transactions;
}
function generateReport(reportId, name){
  logAudit('Report generated','Reports', name, name+' was generated by '+state.currentUser.name+'.');
  pushNotification('report', name+' is ready to view.');
  saveState(); renderNotifBadge();
  const rows = reportRows(reportId).slice(0,15);
  const t = totals();
  $('#reportOutput').innerHTML = `
    <div class="card">
      <div class="flex-between">
        <div><h3 style="font-family:var(--font-display);font-size:16px">${escapeHtml(name)}</h3><div class="muted" style="font-size:11.5px">Generated ${fmtDateTime(new Date().toISOString())} · ${state.settings.orgName} · FY ${$('#repFilterFY').value.replace('FY ','')}</div></div>
        <button class="btn ghost sm" onclick="window.print()">Print</button>
      </div>
      <div class="grid mt-16">
        <div class="col-3"><div class="kpi">${kpiHTML('Total Budget', fmtCompact(t.totalBudget))}</div></div>
        <div class="col-3"><div class="kpi">${kpiHTML('Obligated', fmtCompact(t.totalObligated))}</div></div>
        <div class="col-3"><div class="kpi">${kpiHTML('Disbursed', fmtCompact(t.totalDisbursed))}</div></div>
        <div class="col-3"><div class="kpi">${kpiHTML('Remaining', fmtCompact(t.remaining))}</div></div>
      </div>
      <div class="table-wrap mt-16"><table class="dt"><thead><tr><th>Date</th><th>Voucher</th><th>Type</th><th>Payee</th><th class="num">Amount</th><th>Status</th></tr></thead>
      <tbody>${rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td class="mono">${escapeHtml(r.voucher)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.account)}</td><td class="num">${fmtCurrency(r.amount)}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}</tbody></table></div>
      <div class="muted mt-16" style="font-size:11px">This is a demo report generated from locally stored sample data.</div>
    </div>`;
  toast(name+' generated.', 'success');
}
function exportReportCsv(reportId, name){
  const rows = reportRows(reportId);
  const header = ['Date','Voucher','Type','Payee','Program','Department','Amount','Status'];
  const body = rows.map(t=>[t.date,t.voucher,t.type,t.account,programName(t.program),deptName(t.department),t.amount,t.status]);
  downloadCsv(name.replace(/\s+/g,'_')+'.csv', [header].concat(body));
  logAudit('Report exported','Reports',name,name+' exported to CSV.'); saveState();
  toast(name+' exported.', 'success');
}
function downloadCsv(filename, rows){
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function renderAnalyticsView(){
  const recv = summarizeByMonth('Receipt');
  const disb = summarizeByMonth('Disbursement');
  drawGroupedBarChart($('#chartRvD'), recv.labels, recv.data, disb.data, cssv('--green-600'), cssv('--navy-700'), 'Receipts', 'Disbursements');
  const progLabels = state.budgets.map(b=>b.program.split(' ').slice(0,2).join(' '));
  drawGroupedBarChart($('#chartBvA'), progLabels, state.budgets.map(b=>b.allocated), state.budgets.map(b=>b.disbursed), cssv('--blue-600'), cssv('--teal-600'), 'Allocated', 'Disbursed');
  const now = new Date(); const vLabels=[], vData=[];
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); vLabels.push(monthKey(d)); const key=d.toISOString().slice(0,7); vData.push(state.transactions.filter(t=>t.date.startsWith(key)).length); }
  drawBarChart($('#chartVolume'), vLabels, vData, cssv('--navy-700'));

  $('#programPerfList').innerHTML = state.budgets.map(b=>{
    const pct = b.allocated? Math.round(b.obligated/b.allocated*100):0;
    return `<div class="mt-8"><div class="flex-between" style="font-size:12.5px"><span>${escapeHtml(b.program)}</span><span class="mono">${pct}%</span></div>
    <div class="k-bar" style="margin-top:6px"><div style="width:${clamp(pct,0,100)}%;background:${pct>=95?'var(--red-600)':pct>=80?'var(--amber-700)':'var(--teal-600)'}"></div></div></div>`;
  }).join('');
}
/* ============================================================
   USERS
   ============================================================ */
function renderUsersView(){
  const roleSel = $('#userFilterRole');
  if(!roleSel.dataset.filled){ roleSel.innerHTML='<option value="">All roles</option>'+state.roles.map(r=>`<option>${r.name}</option>`).join(''); roleSel.dataset.filled='1'; }
  const q = ($('#userSearch').value||'').toLowerCase();
  const roleF = roleSel.value, statusF = $('#userFilterStatus').value;
  const list = state.users.filter(u=>{
    if(roleF && u.role!==roleF) return false;
    if(statusF && u.status!==statusF) return false;
    if(q && !(u.name+u.email+u.empId).toLowerCase().includes(q)) return false;
    return true;
  });
  $('#userTableBody').innerHTML = list.length ? list.map(u=>`
    <tr data-id="${u.id}">
      <td data-label="Name"><div class="flex" style="align-items:center;gap:8px"><div class="avatar" style="width:26px;height:26px;flex:0 0 26px;font-size:9.5px">${initials(u.name)}</div>${escapeHtml(u.name)}</div></td>
      <td data-label="Employee ID" class="mono">${escapeHtml(u.empId)}</td>
      <td data-label="Department">${escapeHtml(deptName(u.dept))}</td>
      <td data-label="Role">${escapeHtml(u.role)}</td>
      <td data-label="Email">${escapeHtml(u.email)}</td>
      <td data-label="Status">${statusBadge(u.status)}</td>
      <td data-label="Last Active">${timeAgo(new Date(Date.now()-randInt(1,72)*3600e3).toISOString())}</td>
      <td data-label=""><div class="row-actions"><button class="icon-sm-btn" data-act="edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" stroke-width="1.5"/></svg></button></div></td>
    </tr>`).join('') : `<tr><td colspan="8">${emptyState('No users found','Try a different search or filter.')}</td></tr>`;
  $$('#userTableBody [data-act="edit"]').forEach(b=>b.addEventListener('click', ()=>{
    const u = state.users.find(x=>x.id===b.closest('tr').dataset.id); openUserModal(u);
  }));
}

/* ============================================================
   ROLES & PERMISSIONS
   ============================================================ */
function renderRolesView(){
  const head = `<thead><tr><th>Role</th>${PERM_LABELS.map(p=>`<th>${p[1]}</th>`).join('')}</tr></thead>`;
  const body = state.roles.map(r=>`<tr><td style="font-weight:650">${escapeHtml(r.name)}</td>
    ${PERM_LABELS.map(p=>`<td><input type="checkbox" class="perm-check" data-role="${r.id}" data-perm="${p[0]}" ${r.perms.includes(p[0])?'checked':''}></td>`).join('')}
  </tr>`).join('');
  $('#permTable').innerHTML = head + '<tbody>'+body+'</tbody>';
  $$('.perm-check').forEach(cb=>cb.addEventListener('change', ()=>{
    const role = state.roles.find(r=>r.id===cb.dataset.role);
    if(cb.checked){ if(!role.perms.includes(cb.dataset.perm)) role.perms.push(cb.dataset.perm); }
    else role.perms = role.perms.filter(p=>p!==cb.dataset.perm);
    saveState(); logAudit('Permission changed','Roles',role.name, `${cb.dataset.perm} ${cb.checked?'granted':'revoked'} for ${role.name}.`);
  }));
}

/* ============================================================
   DEPARTMENTS
   ============================================================ */
function renderDepartmentsView(){
  $('#deptGrid').innerHTML = state.departments.map(d=>{
    const bl = state.budgets.filter(b=>b.department===d.id);
    const alloc = bl.reduce((s,b)=>s+b.allocated,0), obl = bl.reduce((s,b)=>s+b.obligated,0);
    const pct = alloc? Math.round(obl/alloc*100):0;
    const staff = state.users.filter(u=>u.dept===d.id).length;
    return `<div class="col-4"><div class="card">
      <h3>${escapeHtml(d.name)}</h3>
      <div class="muted" style="font-size:12px;margin-top:3px">Head: ${escapeHtml(d.head)}</div>
      <div class="flex-between mt-16" style="font-size:12px"><span class="muted">Budget utilization</span><span class="mono">${pct}%</span></div>
      <div class="k-bar" style="margin-top:6px"><div style="width:${clamp(pct,0,100)}%"></div></div>
      <div class="flex-between mt-16" style="font-size:12px"><span class="muted">Programs</span><span>${bl.length}</span></div>
      <div class="flex-between" style="font-size:12px"><span class="muted">Staff</span><span>${staff}</span></div>
    </div></div>`;
  }).join('');
}

/* ============================================================
   APPROVAL WORKFLOW
   ============================================================ */
let activeApprovalTab = 'pending';
function pendingApprovalCount(){ return state.transactions.filter(t=>['Pending','For Review'].includes(t.status)).length; }
function renderApprovalsView(){
  $$('.tab-btn[data-atab]').forEach(b=>b.classList.toggle('active', b.dataset.atab===activeApprovalTab));
  const list = activeApprovalTab==='pending'
    ? state.transactions.filter(t=>['Pending','For Review'].includes(t.status))
    : state.transactions.filter(t=>t.status!=='Draft');
  $('#approvalsList').innerHTML = list.length ? `<div class="grid">${list.slice(0,30).map(t=>`
    <div class="col-6"><div class="card">
      <div class="flex-between"><div><div style="font-weight:650">${escapeHtml(t.account)}</div><div class="muted" style="font-size:11.5px">${escapeHtml(t.voucher)} · ${escapeHtml(t.type)} · ${fmtCurrency(t.amount)}</div></div>${statusBadge(t.status)}</div>
      <div class="mt-16 tl">${t.approvalHistory.map((h,i)=>`
        <div class="tl-step"><div class="tl-dot ${i<t.approvalHistory.length-1?'done':(t.status==='Rejected'?'':'current')}">${i<t.approvalHistory.length-1?'✓':'●'}</div>
          <div class="tl-title">${escapeHtml(h.label)} - ${escapeHtml(h.user)}</div>
          <div class="tl-meta">${escapeHtml(h.role)} · ${fmtDateTime(h.date)}</div>
          ${h.comment?`<div class="tl-comment">${escapeHtml(h.comment)}</div>`:''}
        </div>`).join('')}
      </div>
      ${['Pending','For Review'].includes(t.status) ? `<div class="flex gap-8 mt-16">
        <button class="btn ghost sm" data-view-doc="${t.id}">View document</button>
        <button class="btn primary sm" data-approve="${t.id}" style="margin-left:auto">Take action</button>
      </div>` : ''}
    </div></div>`).join('')}</div>` : emptyState('Nothing pending','There are no transactions awaiting your action right now.');
  $$('[data-approve]').forEach(b=>b.addEventListener('click', ()=>openApproveModal(state.transactions.find(t=>t.id===b.dataset.approve))));
  $$('[data-view-doc]').forEach(b=>b.addEventListener('click', ()=>openDocModal(state.transactions.find(t=>t.id===b.dataset.viewDoc))));
}

/* ============================================================
   AUDIT LOG
   ============================================================ */
function renderAuditLogView(){
  const modSel = $('#auditFilterModule');
  if(!modSel.dataset.filled){
    const mods = Array.from(new Set(state.auditLog.map(a=>a.module)));
    modSel.innerHTML = '<option value="">All modules</option>'+mods.map(m=>`<option>${m}</option>`).join('');
    modSel.dataset.filled='1';
  }
  const q = ($('#auditSearch').value||'').toLowerCase(), modF = modSel.value;
  const list = state.auditLog.filter(a=>{
    if(modF && a.module!==modF) return false;
    if(q && !(a.user+a.action+a.description+a.record).toLowerCase().includes(q)) return false;
    return true;
  });
  $('#auditTableBody').innerHTML = list.length ? list.slice(0,150).map(a=>`
    <tr>
      <td data-label="Timestamp">${fmtDateTime(a.timestamp)}</td>
      <td data-label="User">${escapeHtml(a.user)}</td>
      <td data-label="Action">${escapeHtml(a.action)}</td>
      <td data-label="Module"><span class="badge gray">${escapeHtml(a.module)}</span></td>
      <td data-label="Record" class="mono">${escapeHtml(a.record)}</td>
      <td data-label="Description">${escapeHtml(a.description)}</td>
    </tr>`).join('') : `<tr><td colspan="6">${emptyState('No audit entries','Actions you take in the system will be recorded here.')}</td></tr>`;
}

/* ============================================================
   SETTINGS
   ============================================================ */
let activeSettingsTab = 'org';
function renderSettingsView(){
  $$('#settingsNav .sn-item').forEach(el=>el.classList.toggle('active', el.dataset.stab===activeSettingsTab));
  const s = state.settings;
  const panes = {
    org: `
      <div class="subhead">Organization</div>
      <div class="field"><label>Organization name</label><input id="setOrgName" value="${escapeHtml(s.orgName)}"></div>
      <div class="field"><label>Full name</label><input id="setOrgFull" value="${escapeHtml(s.orgFullName)}"></div>
      <div class="field"><label>Address</label><input id="setAddress" value="${escapeHtml(s.address)}"></div>
      <button class="btn primary" id="saveOrgBtn">Save changes</button>`,
    financial: `
      <div class="subhead">Financial</div>
      <div class="form-row">
        <div class="field"><label>Currency</label><select id="setCurrency"><option ${s.currency==='PHP'?'selected':''}>PHP</option><option ${s.currency==='USD'?'selected':''}>USD</option></select></div>
        <div class="field"><label>Fiscal year</label><input id="setFY" value="${escapeHtml(s.fiscalYear)}"></div>
      </div>
      <div class="field"><label>Decimal precision</label><select id="setDecimals"><option value="2" ${s.decimalPrecision===2?'selected':''}>2 decimal places</option><option value="0" ${s.decimalPrecision===0?'selected':''}>Whole numbers</option></select></div>
      <button class="btn primary" id="saveFinBtn">Save changes</button>`,
    system: `
      <div class="subhead">System</div>
      <div class="field"><label>Date format</label><select id="setDateFmt"><option>MMM d, yyyy</option><option>yyyy-MM-dd</option><option>dd/MM/yyyy</option></select></div>
      <div class="flex-between mt-16" style="max-width:340px"><span style="font-size:13px">Enable desktop notifications</span><div class="toggle on" id="toggleNotif"><div class="knob"></div></div></div>
      <div class="flex-between mt-16" style="max-width:340px"><span style="font-size:13px">Dark mode</span><div class="toggle ${s.theme==='dark'?'on':''}" id="toggleDark"><div class="knob"></div></div></div>`,
    security: `
      <div class="subhead">Security</div>
      <div class="field"><label>Session timeout (minutes)</label><input type="number" id="setTimeout" value="${s.sessionTimeout}"></div>
      <div class="field"><label>Password policy</label><textarea id="setPwPolicy" rows="2">${escapeHtml(s.passwordPolicy)}</textarea></div>
      <button class="btn primary" id="saveSecBtn">Save changes</button>`,
    data: `
      <div class="subhead">Data management</div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <button class="btn ghost" id="exportAllBtn">Export all data (JSON)</button>
        <button class="btn ghost" id="exportTxnBtn">Export transactions (CSV)</button>
        <button class="btn danger" id="resetDataBtn">Reset demo data</button>
      </div>
      <div class="muted mt-16" style="font-size:11.5px">All data lives only in this browser's local storage. Nothing is uploaded to any server.</div>`,
  };
  $('#settingsPane').innerHTML = panes[activeSettingsTab];
  if(activeSettingsTab==='org') $('#saveOrgBtn').addEventListener('click', ()=>{
    s.orgName=$('#setOrgName').value; s.orgFullName=$('#setOrgFull').value; s.address=$('#setAddress').value;
    saveState(); $('#orgNameTop').textContent=s.orgName; logAudit('Settings changed','Settings','Organization','Organization profile updated.'); toast('Organization settings saved.','success');
  });
  if(activeSettingsTab==='financial') $('#saveFinBtn').addEventListener('click', ()=>{
    s.currency=$('#setCurrency').value; s.fiscalYear=$('#setFY').value; s.decimalPrecision=+$('#setDecimals').value;
    saveState(); $('#fyPillLabel').textContent='FY '+s.fiscalYear; logAudit('Settings changed','Settings','Financial','Financial settings updated.'); toast('Financial settings saved.','success'); renderAll();
  });
  if(activeSettingsTab==='security') $('#saveSecBtn').addEventListener('click', ()=>{
    s.sessionTimeout=+$('#setTimeout').value; s.passwordPolicy=$('#setPwPolicy').value; saveState();
    logAudit('Settings changed','Settings','Security','Security settings updated.'); toast('Security settings saved.','success');
  });
  if(activeSettingsTab==='system'){
    $('#toggleDark').addEventListener('click', ()=>{ setTheme(s.theme==='dark'?'light':'dark'); renderSettingsView(); });
    $('#toggleNotif').addEventListener('click', (e)=> e.currentTarget.classList.toggle('on'));
  }
  if(activeSettingsTab==='data'){
    $('#exportAllBtn').addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ncip_fms_export.json'; a.click(); URL.revokeObjectURL(url);
      toast('Full data export downloaded.','success');
    });
    $('#exportTxnBtn').addEventListener('click', ()=>exportReportCsv('transaction-register','All Transactions'));
    $('#resetDataBtn').addEventListener('click', ()=>{ if(confirm('Reset all demo data? This cannot be undone.')) resetDemoData(); });
  }
}
/* ============================================================
   MODAL PLUMBING
   ============================================================ */
function openModal(id){ $('#'+id).classList.add('show'); document.body.style.overflow='hidden'; }
function closeModal(id){ $('#'+id).classList.remove('show'); document.body.style.overflow=''; }
$$('[data-close]').forEach(b=>b.addEventListener('click', ()=>closeModal(b.dataset.close)));
$$('.modal-backdrop').forEach(m=>m.addEventListener('click', (e)=>{ if(e.target===m) closeModal(m.id); }));
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    $$('.modal-backdrop.show').forEach(m=>closeModal(m.id));
    $('#quickCreateMenu').classList.remove('show');
    $('#gsearchResults').classList.remove('show');
  }
});

function fillSelect(sel, items, valueKey, labelKey){
  sel.innerHTML = items.map(i=>`<option value="${i[valueKey]}">${escapeHtml(i[labelKey])}</option>`).join('');
}

/* ---------- Transaction modal ---------- */
function openTxnModal(item){
  fillSelect($('#fDept'), state.departments, 'id', 'name');
  fillSelect($('#fProgram'), state.programs, 'id', 'name');
  $$('#txnForm .field').forEach(f=>f.classList.remove('has-error'));
  if(item){
    $('#txnModalTitle').textContent = 'Edit transaction';
    $('#fType').value=item.type; $('#fDate').value=item.date; $('#fVoucher').value=item.voucher;
    $('#fStatus').value=item.status; $('#fAccount').value=item.account; $('#fCategory').value=item.category;
    $('#fDept').value=item.department; $('#fProgram').value=item.program; $('#fFundSource').value=item.fundSource;
    $('#fAmount').value=item.amount; $('#fFY').value=state.settings.fiscalYear; $('#fRemarks').value=item.remarks;
    $('#txnModal').dataset.editId = item.id;
  } else {
    $('#txnModalTitle').textContent = 'Add transaction';
    $('#txnForm').reset(); $('#fDate').value = todayISO(); $('#fFY').value = state.settings.fiscalYear;
    delete $('#txnModal').dataset.editId;
  }
  openModal('txnModal');
}
function prefixForType(type){
  return {Receipt:'OR', 'Purchase Order':'PO', 'Purchase Request':'PR'}[type] || 'VCH';
}
$('#txnSaveBtn').addEventListener('click', ()=>{
  const amountField = $('#fAmount').closest('.field');
  const amount = parseFloat($('#fAmount').value);
  amountField.classList.toggle('has-error', !(amount>0));
  if(!$('#fAccount').value.trim() || !$('#fDate').value || !(amount>0)){
    if(!(amount>0)) amountField.classList.add('has-error');
    toast('Please complete the required fields.','error');
    return;
  }
  const editId = $('#txnModal').dataset.editId;
  const payload = {
    type:$('#fType').value, date:$('#fDate').value,
    voucher: $('#fVoucher').value.trim() || (prefixForType($('#fType').value)+'-'+new Date($('#fDate').value).getFullYear()+'-'+String(randInt(1000,9999))),
    status:$('#fStatus').value, account:$('#fAccount').value.trim(), category:$('#fCategory').value,
    department:$('#fDept').value, program:$('#fProgram').value, fundSource:$('#fFundSource').value,
    amount, remarks:$('#fRemarks').value.trim(),
  };
  if(editId){
    const idx = state.transactions.findIndex(t=>t.id===editId);
    const prior = state.transactions[idx];
    payload.approvalHistory = (prior.status!==payload.status) ? buildApprovalHistory(payload.status, prior.preparedBy||state.currentUser.name, payload.date) : prior.approvalHistory;
    payload.preparedBy = prior.preparedBy;
    state.transactions[idx] = Object.assign({id:editId}, payload);
    logAudit('Transaction edited','Transactions',payload.voucher,'Transaction updated by '+state.currentUser.name+'.');
    toast('Transaction updated.','success');
  } else {
    payload.preparedBy = state.currentUser.name;
    payload.approvalHistory = buildApprovalHistory(payload.status, payload.preparedBy, payload.date);
    payload.id = uid('TXN');
    state.transactions.unshift(payload);
    logAudit('Transaction created','Transactions',payload.voucher,'New '+payload.type.toLowerCase()+' recorded.');
    pushNotification('transaction', 'New '+payload.type.toLowerCase()+' '+payload.voucher+' was recorded.');
    toast('Transaction saved.','success');
  }
  saveState();
  closeModal('txnModal');
  renderTransactions(); renderDashboard(); renderBudgetsView(); renderNotifBadge(); updateApprovalBadge();
});

/* ---------- Document / voucher view ---------- */
const DOC_TITLES = {
  Disbursement:'Disbursement Voucher', Receipt:'Official Receipt', 'Cash Advance':'Cash Advance Voucher',
  Liquidation:'Liquidation Report', 'Fund Transfer':'Fund Transfer Voucher', 'Journal Entry':'Journal Entry Voucher',
  'Purchase Request':'Purchase Request', 'Purchase Order':'Purchase Order',
};
function openDocModal(t){
  const title = DOC_TITLES[t.type] || 'Financial Document';
  $('#docModalBody').innerHTML = `
    <div class="doc-sheet">
      <div class="doc-sheet-head">
        <div><div class="org">${escapeHtml(state.settings.orgFullName)}</div><div class="org-sub">${escapeHtml(state.settings.address)}</div></div>
        <div class="doc-type"><h2>${title}</h2><div class="docno">${escapeHtml(t.voucher)}</div></div>
      </div>
      <div class="doc-grid">
        <div class="doc-field"><div class="dfl">Date</div><div class="dfv">${fmtDate(t.date)}</div></div>
        <div class="doc-field"><div class="dfl">Status</div><div class="dfv">${statusBadge(t.status)}</div></div>
        <div class="doc-field"><div class="dfl">Payee</div><div class="dfv">${escapeHtml(t.account)}</div></div>
        <div class="doc-field"><div class="dfl">Fund source</div><div class="dfv">${escapeHtml(t.fundSource)}</div></div>
        <div class="doc-field"><div class="dfl">Program</div><div class="dfv">${escapeHtml(programName(t.program))}</div></div>
        <div class="doc-field"><div class="dfl">Department</div><div class="dfv">${escapeHtml(deptName(t.department))}</div></div>
        <div class="doc-field"><div class="dfl">Account / category</div><div class="dfv">${escapeHtml(t.category)}</div></div>
        <div class="doc-field"><div class="dfl">Prepared by</div><div class="dfv">${escapeHtml(t.preparedBy)}</div></div>
      </div>
      <div class="doc-amount-box"><div class="dal">Amount</div><div class="dav">${fmtCurrency(t.amount)}</div></div>
      <div class="doc-field"><div class="dfl">Particulars</div><div class="dfv">${escapeHtml(t.remarks)}</div></div>
      <h4 class="mt-16" style="font-size:12.5px;margin-bottom:8px">Approval history</h4>
      <div class="tl">${t.approvalHistory.map((h,i)=>`
        <div class="tl-step"><div class="tl-dot ${i<t.approvalHistory.length-1 || t.status==='Completed' ?'done':'current'}">✓</div>
          <div class="tl-title">${escapeHtml(h.label)} - ${escapeHtml(h.user)}</div>
          <div class="tl-meta">${escapeHtml(h.role)} · ${fmtDateTime(h.date)}</div>
          ${h.comment?`<div class="tl-comment">${escapeHtml(h.comment)}</div>`:''}
        </div>`).join('')}
      </div>
      <div class="sign-row">
        <div class="sign-box"><div class="sn">${escapeHtml(t.preparedBy)}</div><div class="sr">Prepared by</div></div>
        <div class="sign-box"><div class="sn">Adrian Cruz</div><div class="sr">Reviewed by</div></div>
        <div class="sign-box"><div class="sn">Atty. Norma Gayudan</div><div class="sr">Approved by</div></div>
      </div>
    </div>`;
  $('#docPrintBtn').onclick = ()=>window.print();
  openModal('docModal');
}

/* ---------- Budget modal ---------- */
function openBudgetModal(){
  fillSelect($('#bfDept'), state.departments, 'id', 'name');
  $('#budgetForm').reset();
  openModal('budgetModal');
}
$('#budgetSaveBtn').addEventListener('click', ()=>{
  const alloc = parseFloat($('#bfAllocated').value);
  const errField = $('#bfAllocated').closest('.field');
  errField.classList.toggle('has-error', !(alloc>0));
  if(!$('#bfProgram').value.trim() || !(alloc>0)){ toast('Please complete the required fields.','error'); return; }
  state.budgets.push({id:uid('BUD'), program:$('#bfProgram').value.trim(), programId:uid('P'), department:$('#bfDept').value, fundSource:$('#bfFundSource').value, allocated:alloc, obligated:0, disbursed:0});
  saveState(); logAudit('Budget created','Budgets', $('#bfProgram').value.trim(), 'New program budget created.');
  closeModal('budgetModal'); renderBudgetsView(); renderDashboard(); toast('Budget created.','success');
});

/* ---------- User modal ---------- */
function openUserModal(u){
  fillSelect($('#ufDept'), state.departments, 'id', 'name');
  fillSelect($('#ufRole'), state.roles, 'name', 'name');
  if(u){
    $('#userModalTitle').textContent='Edit user';
    $('#ufName').value=u.name; $('#ufEmpId').value=u.empId; $('#ufDept').value=u.dept; $('#ufRole').value=u.role; $('#ufStatus').value=u.status; $('#ufEmail').value=u.email;
    $('#userModal').dataset.editId=u.id;
  } else {
    $('#userModalTitle').textContent='Add user'; $('#userForm').reset(); delete $('#userModal').dataset.editId;
  }
  openModal('userModal');
}
$('#userSaveBtn').addEventListener('click', ()=>{
  if(!$('#ufName').value.trim() || !$('#ufEmail').value.trim()){ toast('Please complete the required fields.','error'); return; }
  const editId = $('#userModal').dataset.editId;
  const payload = {name:$('#ufName').value.trim(), empId:$('#ufEmpId').value.trim(), dept:$('#ufDept').value, role:$('#ufRole').value, status:$('#ufStatus').value, email:$('#ufEmail').value.trim()};
  if(editId){ const idx=state.users.findIndex(x=>x.id===editId); state.users[idx]=Object.assign({id:editId},payload); logAudit('User updated','Users',payload.name,'User profile updated.'); }
  else { payload.id=uid('USR'); state.users.push(payload); logAudit('User created','Users',payload.name,'New user account created.'); }
  saveState(); closeModal('userModal'); renderUsersView(); toast('User saved.','success');
});

/* ---------- Approve / reject modal ---------- */
let approveTargetId = null;
function openApproveModal(t){ approveTargetId=t.id; $('#approveModalTitle').textContent = 'Take action - '+t.voucher; $('#approveComment').value=''; openModal('approveModal'); }
function advanceStatus(t, decision, comment){
  const order = ['Draft','Pending','For Review','Approved','Posted','Completed'];
  if(decision==='reject'){ t.status='Rejected'; }
  else { const idx = order.indexOf(t.status); t.status = order[clamp(idx+1,0,order.length-1)] || 'Approved'; }
  t.approvalHistory.push({label:t.status, role:state.currentUser.role, user:state.currentUser.name, date:new Date().toISOString(), comment:comment||''});
}
$('#approveConfirmBtn').addEventListener('click', ()=>{
  const t = state.transactions.find(x=>x.id===approveTargetId); if(!t) return;
  advanceStatus(t, 'approve', $('#approveComment').value.trim());
  saveState(); logAudit('Transaction approved','Transactions',t.voucher,'Advanced to '+t.status+' by '+state.currentUser.name+'.');
  pushNotification('approval', t.voucher+' moved to '+t.status+'.');
  closeModal('approveModal'); renderApprovalsView(); renderTransactions(); renderDashboard(); updateApprovalBadge(); renderNotifBadge();
  toast('Transaction advanced to '+t.status+'.','success');
});
$('#rejectConfirmBtn').addEventListener('click', ()=>{
  const t = state.transactions.find(x=>x.id===approveTargetId); if(!t) return;
  advanceStatus(t, 'reject', $('#approveComment').value.trim());
  saveState(); logAudit('Transaction rejected','Transactions',t.voucher,'Rejected by '+state.currentUser.name+'.');
  pushNotification('warning', t.voucher+' was rejected.');
  closeModal('approveModal'); renderApprovalsView(); renderTransactions(); renderDashboard(); updateApprovalBadge(); renderNotifBadge();
  toast('Transaction rejected.','success');
});

/* ============================================================
   NOTIFICATIONS PANEL
   ============================================================ */
function renderNotifBadge(){
  const unread = state.notifications.filter(n=>!n.read).length;
  $('#notifDot').style.display = unread ? 'block' : 'none';
}
function renderNotifPanel(){
  const icon = {transaction:'📝', approval:'✅', warning:'⚠️', report:'📊', budget:'💰'};
  $('#notifList').innerHTML = state.notifications.length ? state.notifications.slice(0,20).map(n=>`
    <div class="notif-item ${n.read?'':'unread'}"><div class="notif-ic" style="background:var(--surface-2)">${icon[n.type]||'🔔'}</div>
      <div class="notif-txt"><div class="n-msg">${escapeHtml(n.message)}</div><div class="n-time">${timeAgo(n.date)}</div></div></div>
  `).join('') : `<div style="padding:26px;text-align:center;color:var(--muted);font-size:12.5px">You're all caught up.</div>`;
}

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */
function runGlobalSearch(q){
  q = q.trim().toLowerCase();
  const box = $('#gsearchResults');
  if(!q){ box.classList.remove('show'); return; }
  const txns = state.transactions.filter(t=>(t.voucher+t.account+t.remarks).toLowerCase().includes(q)).slice(0,5);
  const budgets = state.budgets.filter(b=>b.program.toLowerCase().includes(q)).slice(0,4);
  const accounts = state.accounts.filter(a=>(a.code+a.name).toLowerCase().includes(q)).slice(0,4);
  const users = state.users.filter(u=>u.name.toLowerCase().includes(q)).slice(0,4);
  const vendors = state.vendors.filter(v=>v.name.toLowerCase().includes(q)).slice(0,4);
  const groups = [
    ['Transactions', txns.map(t=>({title:t.voucher+' - '+t.account, sub:fmtCurrency(t.amount)+' · '+t.status, action:()=>{showView('transactions'); openDocModal(t);}}))],
    ['Budgets', budgets.map(b=>({title:b.program, sub:fmtCurrency(b.allocated), action:()=>{showView('budgets'); openBudgetDetail(b);}}))],
    ['Chart of Accounts', accounts.map(a=>({title:a.code+' - '+a.name, sub:a.type, action:()=>showView('accounts')}))],
    ['Users', users.map(u=>({title:u.name, sub:u.role, action:()=>showView('users')}))],
    ['Vendors', vendors.map(v=>({title:v.name, sub:v.category, action:()=>showView('vendors')}))],
  ].filter(g=>g[1].length);
  if(!groups.length){ box.innerHTML = `<div class="gsr-empty">No results for “${escapeHtml(q)}”.</div>`; box.classList.add('show'); return; }
  box.innerHTML = groups.map(([label,items])=>`
    <div class="gsr-group"><div class="gsr-group-label">${label}</div>
    ${items.map((it,i)=>`<div class="gsr-item" data-gidx="${label}-${i}"><div class="gsr-main"><div class="gsr-title">${escapeHtml(it.title)}</div><div class="gsr-sub">${escapeHtml(it.sub)}</div></div></div>`).join('')}
    </div>`).join('');
  box.classList.add('show');
  const flat = groups.flatMap(g=>g[1]);
  $$('.gsr-item', box).forEach((el,i)=>el.addEventListener('click', ()=>{ flat[i].action(); box.classList.remove('show'); $('#globalSearchInput').value=''; }));
}

/* ============================================================
   NAVIGATION / ROUTER
   ============================================================ */
const VIEW_META = {
  dashboard: {title:'Dashboard', sub:'Command center for budgets, spending, and approvals.', crumb:'Overview / Dashboard'},
  transactions: {title:'Transactions', sub:'Search, review, and manage every recorded financial entry.', crumb:'Financial Operations / Transactions'},
  budgets: {title:'Budgets', sub:'Track allocation, obligation, and disbursement by program and department.', crumb:'Budget Management / Budgets'},
  accounts: {title:'Chart of Accounts', sub:'The full account hierarchy used across the ledger.', crumb:'Accounting / Chart of Accounts'},
  ledger: {title:'General Ledger', sub:'Posted entries with running account balances.', crumb:'Accounting / General Ledger'},
  vendors: {title:'Suppliers & Vendors', sub:'Vendor master list and year-to-date payments.', crumb:'Procurement / Vendors'},
  reports: {title:'Reports Center', sub:'Generate, export, and print financial and management reports.', crumb:'Reports & Analytics / Reports Center'},
  analytics: {title:'Analytics', sub:'Trends, comparisons, and program performance.', crumb:'Reports & Analytics / Analytics'},
  users: {title:'Users', sub:'People with access to the system.', crumb:'Administration / Users'},
  roles: {title:'Roles & Permissions', sub:'Control what each role can see and do.', crumb:'Administration / Roles & Permissions'},
  departments: {title:'Departments', sub:'Organizational units and their budget performance.', crumb:'Administration / Departments'},
  approvals: {title:'Approval Workflow', sub:'Transactions moving through review and approval.', crumb:'Administration / Approval Workflow'},
  auditlog: {title:'Audit Logs', sub:'A record of activity across the system.', crumb:'Administration / Audit Logs'},
  settings: {title:'Settings', sub:'Organization, financial, system, security, and data preferences.', crumb:'System / Settings'},
};
let currentView = 'dashboard';
function showView(name, opts){
  opts = opts || {};
  currentView = name;
  $$('.view').forEach(v=>v.classList.add('hidden'));
  const el = $('#view-'+name); if(el) el.classList.remove('hidden');
  $$('.nav-item[data-view]').forEach(n=>n.classList.toggle('active', n.dataset.view===name && !n.dataset.filterType && !n.dataset.anchor));
  const meta = VIEW_META[name] || {title:name, sub:'', crumb:name};
  $('#pageTitle').textContent = meta.title; $('#pageSub').textContent = meta.sub;
  $('#breadcrumb').innerHTML = meta.crumb.split(' / ').map((p,i,arr)=> i===arr.length-1 ? '<b>'+escapeHtml(p)+'</b>' : escapeHtml(p)).join(' / ');
  renderPageActions(name);

  if(name==='transactions'){
    if(opts.filterType!==undefined){ txnFilters = {q:'',type:opts.filterType||'',status:'',dept:'',from:'',to:''}; txnPage=1; }
    renderTransactions();
  }
  if(name==='dashboard') renderDashboard();
  if(name==='budgets') renderBudgetsView();
  if(name==='accounts') renderAccountsView($('#coaSearch').value, $('#coaFilterType').value);
  if(name==='ledger') renderLedgerView();
  if(name==='vendors') renderVendorsView();
  if(name==='reports') renderReportsView();
  if(name==='analytics') renderAnalyticsView();
  if(name==='users') renderUsersView();
  if(name==='roles') renderRolesView();
  if(name==='departments') renderDepartmentsView();
  if(name==='approvals') renderApprovalsView();
  if(name==='auditlog') renderAuditLogView();
  if(name==='settings') renderSettingsView();

  if(document.body.classList.contains('nav-open')) closeDrawer();
  $('.workspace') && (document.querySelector('main.workspace').scrollTop = 0);
  window.scrollTo(0,0);
  if(opts.anchor==='health'){ setTimeout(()=>$('#healthCardAnchor').scrollIntoView({behavior:'smooth', block:'start'}), 30); }
}
function renderPageActions(name){
  const map = {
    transactions: `<button class="btn ghost sm" id="paExport"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Export CSV</button><button class="btn primary sm" id="paAddTxn">+ Add transaction</button>`,
    budgets: `<button class="btn primary sm" id="paAddBudget">+ New budget</button>`,
    users: `<button class="btn primary sm" id="paAddUser">+ Add user</button>`,
    ledger: ``,
    departments: ``,
  };
  $('#pageActions').innerHTML = map[name] || '';
  if($('#paExport')) $('#paExport').addEventListener('click', ()=>exportReportCsv('transaction-register','Transactions_Export'));
  if($('#paAddTxn')) $('#paAddTxn').addEventListener('click', ()=>openTxnModal(null));
  if($('#paAddBudget')) $('#paAddBudget').addEventListener('click', ()=>openBudgetModal());
  if($('#paAddUser')) $('#paAddUser').addEventListener('click', ()=>openUserModal(null));
}
function updateApprovalBadge(){
  const n = pendingApprovalCount();
  const badge = $('#navApprovalBadge'); badge.textContent = n; badge.style.display = n? 'inline-block':'none';
}

/* ============================================================
   THEME
   ============================================================ */
function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  state.settings.theme = mode; saveState();
  $('#themeIcon').innerHTML = mode==='dark'
    ? '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'
    : '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="1.8"/>';
  renderAll();
}

/* ============================================================
   RENDER ALL (theme / resize safe)
   ============================================================ */
function renderAll(){ showView(currentView); }

/* ============================================================
   EVENT WIRING
   ============================================================ */
function closeDrawer(){ document.body.classList.remove('nav-open'); }
$('#hamburgerBtn').addEventListener('click', ()=> document.body.classList.toggle('nav-open'));
document.addEventListener('click', (e)=>{
  if(document.body.classList.contains('nav-open') && e.target===document.body) closeDrawer();
});

$$('.nav-item[data-view]').forEach(item=>{
  item.addEventListener('click', ()=>{
    const view = item.dataset.view;
    if(item.dataset.filterType!==undefined){ showView(view, {filterType:item.dataset.filterType}); }
    else if(item.dataset.anchor){ showView(view, {anchor:item.dataset.anchor}); }
    else showView(view);
    $$('.nav-item[data-view]').forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
  });
});
$$('.pp-item[data-nav]').forEach(el=>el.addEventListener('click', ()=>{ showView(el.dataset.nav); $('#profilePanel').classList.remove('show'); }));

$$('.tab-btn[data-btab]').forEach(b=>b.addEventListener('click', ()=>{ activeBudgetTab=b.dataset.btab; renderBudgetsView(); }));
$$('.tab-btn[data-rtab]').forEach(b=>b.addEventListener('click', ()=>{ activeReportTab=b.dataset.rtab; $('#reportOutput').innerHTML=''; renderReportsView(); }));
$$('.tab-btn[data-atab]').forEach(b=>b.addEventListener('click', ()=>{ activeApprovalTab=b.dataset.atab; renderApprovalsView(); }));
$$('#settingsNav .sn-item').forEach(b=>b.addEventListener('click', ()=>{ activeSettingsTab=b.dataset.stab; renderSettingsView(); }));

$('#txnSearch').addEventListener('input', (e)=>{ txnFilters.q=e.target.value; txnPage=1; renderTransactions(); });
$('#txnFilterType').addEventListener('change', (e)=>{ txnFilters.type=e.target.value; txnPage=1; renderTransactions(); });
$('#txnFilterStatus').addEventListener('change', (e)=>{ txnFilters.status=e.target.value; txnPage=1; renderTransactions(); });
$('#txnFilterDept').addEventListener('change', (e)=>{ txnFilters.dept=e.target.value; txnPage=1; renderTransactions(); });
$('#txnFilterFrom').addEventListener('change', (e)=>{ txnFilters.from=e.target.value; renderTransactions(); });
$('#txnFilterTo').addEventListener('change', (e)=>{ txnFilters.to=e.target.value; renderTransactions(); });
$('#txnClearFilters').addEventListener('click', ()=>{ txnFilters={q:'',type:'',status:'',dept:'',from:'',to:''}; txnPage=1; renderTransactions(); });

$('#coaSearch').addEventListener('input', ()=>renderAccountsView($('#coaSearch').value, $('#coaFilterType').value));
$('#coaFilterType').addEventListener('change', ()=>renderAccountsView($('#coaSearch').value, $('#coaFilterType').value));
$('#coaExpandAll').addEventListener('click', ()=>{ $$('.tree-children').forEach(c=>c.classList.add('open')); $$('.tree-row .twist').forEach(t=>{ if(t.textContent) t.textContent='▾'; }); });

$('#glFilterAccount').addEventListener('change', renderLedgerView);
$('#glFilterFrom').addEventListener('change', renderLedgerView);
$('#glFilterTo').addEventListener('change', renderLedgerView);
$('#glClearFilters').addEventListener('click', ()=>{ $('#glFilterAccount').value=''; $('#glFilterFrom').value=''; $('#glFilterTo').value=''; renderLedgerView(); });
$('#glExportBtn').addEventListener('click', ()=>{
  const rows = buildLedgerEntries();
  downloadCsv('general_ledger.csv', [['Date','Account','Reference','Description','Debit','Credit','Balance']].concat(rows.map(e=>[e.date,e.account,e.reference,e.description,e.debit,e.credit,e.balance])));
  toast('General ledger exported.','success');
});
$('#glPrintBtn').addEventListener('click', ()=>window.print());

$('#vendorSearch').addEventListener('input', renderVendorsView);
$('#userSearch').addEventListener('input', renderUsersView);
$('#userFilterRole').addEventListener('change', renderUsersView);
$('#userFilterStatus').addEventListener('change', renderUsersView);
$('#auditSearch').addEventListener('input', renderAuditLogView);
$('#auditFilterModule').addEventListener('change', renderAuditLogView);
['repFilterFY','repFilterDept','repFilterProgram','repFilterFrom','repFilterTo'].forEach(id=>{
  $('#'+id) && $('#'+id).addEventListener('change', ()=>{ if($('#reportOutput').innerHTML) $('#reportOutput').innerHTML=''; });
});

$('#globalSearchInput').addEventListener('input', (e)=>runGlobalSearch(e.target.value));
document.addEventListener('click', (e)=>{ if(!e.target.closest('.gsearch')) $('#gsearchResults').classList.remove('show'); });
document.addEventListener('keydown', (e)=>{
  if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){
    e.preventDefault(); $('#globalSearchInput').focus();
  }
});

$('#themeToggleBtn').addEventListener('click', ()=> setTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark'));

$('#notifBtn').addEventListener('click', (e)=>{
  e.stopPropagation();
  $('#profilePanel').classList.remove('show');
  $('#notifPanel').classList.toggle('show');
  renderNotifPanel();
});
$('#markAllReadBtn').addEventListener('click', (e)=>{ e.preventDefault(); state.notifications.forEach(n=>n.read=true); saveState(); renderNotifPanel(); renderNotifBadge(); });
$('#profileBtn').addEventListener('click', (e)=>{ e.stopPropagation(); $('#notifPanel').classList.remove('show'); $('#profilePanel').classList.toggle('show'); });
document.addEventListener('click', ()=>{ $('#notifPanel').classList.remove('show'); $('#profilePanel').classList.remove('show'); });
$('#notifPanel').addEventListener('click', e=>e.stopPropagation());
$('#profilePanel').addEventListener('click', e=>e.stopPropagation());
$('#logoutBtn').addEventListener('click', ()=>{ if(confirm('Sign out of the demo session?')) doLogout(); });

$('#quickCreateBtn').addEventListener('click', ()=> $('#quickCreateMenu').classList.add('show'));
$('#closeQuickCreate').addEventListener('click', ()=> $('#quickCreateMenu').classList.remove('show'));
$('#quickCreateMenu').addEventListener('click', (e)=>{ if(e.target.id==='quickCreateMenu') $('#quickCreateMenu').classList.remove('show'); });
$$('.cmd-item[data-qc]').forEach(el=>el.addEventListener('click', ()=>{
  const qc = el.dataset.qc;
  $('#quickCreateMenu').classList.remove('show');
  if(qc==='budget') { showView('budgets'); openBudgetModal(); return; }
  if(qc==='report') { showView('reports'); return; }
  showView('transactions');
  openTxnModal(null);
  setTimeout(()=>{ $('#fType').value = qc; }, 0);
}));

let resizeTimer=null;
window.addEventListener('resize', ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(renderAll, 180); });

/* ============================================================
   LOGIN / LOGOUT
   ============================================================ */
function doLogin(){
  $('#loginScreen').style.display = 'none';
  $('#app').classList.add('ready');
  document.documentElement.setAttribute('data-theme', state.settings.theme||'light');
  $('#orgNameTop').textContent = state.settings.orgName;
  $('#fyPillLabel').textContent = 'FY '+state.settings.fiscalYear;
  $('#topUserName').textContent = state.currentUser.name;
  $('#topUserRole').textContent = state.currentUser.role;
  $('#topAvatar').textContent = initials(state.currentUser.name);
  logAudit('System login','Users','-', state.currentUser.name+' signed in.');
  saveState();
  showView('dashboard');
  renderNotifBadge();
  updateApprovalBadge();
}
function doLogout(){
  logAudit('System logout','Users','-', state.currentUser.name+' signed out.');
  saveState();
  $('#app').classList.remove('ready');
  $('#loginScreen').style.display = 'flex';
  $('#profilePanel').classList.remove('show');
}
$('#loginForm').addEventListener('submit', (e)=>{ e.preventDefault(); doLogin(); });
$('#forgotLink').addEventListener('click', (e)=>{ e.preventDefault(); toast('This is a demo - password reset is simulated. Contact your Finance Administrator.', ''); });

/* ============================================================
   INIT
   ============================================================ */
$('#statFY').textContent = 'FY '+state.settings.fiscalYear;
$('#statUsers').textContent = state.users.filter(u=>u.status==='Active').length;
$('#statTxn').textContent = state.transactions.length.toLocaleString();
document.documentElement.setAttribute('data-theme', state.settings.theme||'light');

})();