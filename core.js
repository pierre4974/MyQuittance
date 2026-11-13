export const empty = () => ({schema:1, owner:{name:'',address:'',city:'',currency:'EUR'}, leases:[], payments:[], documents:[]});
export const monthNow = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const uid = () => crypto.randomUUID();
export function cents(value){const s=String(value).trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Montant invalide : deux décimales maximum.');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||n>10000000000)throw Error('Montant trop élevé.');return n;}
export function monthValid(s){return /^\d{4}-(0[1-9]|1[0-2])$/.test(s)&&Number(s.slice(0,4))>=1900;}
export function dateValid(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
export function active(l,m){return m>=l.start&&(!l.end||m<=l.end);}
export function paid(data,id,month){return data.payments.filter(p=>p.leaseId===id&&p.month===month).reduce((n,p)=>n+p.amount,0);}
export function issued(data,id,month){return data.documents.some(d=>d.leaseId===id&&d.month===month);}
export function makeDocument(data,id,month){
 const l=data.leases.find(l=>l.id===id);if(!l||!monthValid(month)||!active(l,month))throw Error('Bail inactif pour cette période.');
 if(!data.owner.name.trim()||!data.owner.address.trim())throw Error('Renseignez le nom et l’adresse du bailleur dans les paramètres.');
 if(issued(data,id,month))throw Error('Une quittance existe déjà pour cette période.');
 if(paid(data,id,month)<l.rent+l.charges)throw Error('Le paiement intégral doit être enregistré avant de générer une quittance.');
 return {id:uid(),number:`Q-${month.replace('-','')}-${uid().slice(0,8).toUpperCase()}`,leaseId:id,month,created:today(),owner:structuredClone(data.owner),lease:structuredClone(l),rent:l.rent,charges:l.charges,payments:structuredClone(data.payments.filter(p=>p.leaseId===id&&p.month===month))};
}
export function validate(d){
 const fail=()=>{throw Error('Fichier de données invalide ou version non prise en charge.');};
 const str=(x,max=500)=>typeof x==='string'&&x.length<=max;
 const money=x=>Number.isSafeInteger(x)&&x>=0&&x<=10000000000;
 if(!d||d.schema!==1||!d.owner||!str(d.owner.name,120)||!str(d.owner.address,300)||!str(d.owner.city,100)||!['EUR','MUR','USD','GBP','CHF','CAD'].includes(d.owner.currency))fail();
 if(!['leases','payments','documents'].every(k=>Array.isArray(d[k])&&d[k].length<=50000))fail();
 const ids=new Set();
 for(const l of d.leases){if(!str(l.id,100)||ids.has(l.id)||!str(l.label,120)||!str(l.address,300)||!str(l.tenant,120)||!str(l.email,200)||!money(l.rent)||!money(l.charges)||l.rent+l.charges<=0||!monthValid(l.start)||(l.end&&(!monthValid(l.end)||l.end<l.start)))fail();ids.add(l.id);}
 const pids=new Set();for(const p of d.payments){if(!str(p.id,100)||pids.has(p.id)||!ids.has(p.leaseId)||!monthValid(p.month)||!dateValid(p.date)||!money(p.amount)||!p.amount||!str(p.method,100))fail();pids.add(p.id);}
 const keys=new Set();for(const doc of d.documents){const key=doc.leaseId+doc.month;if(!str(doc.id,100)||!str(doc.number,100)||!ids.has(doc.leaseId)||keys.has(key)||!monthValid(doc.month)||!dateValid(doc.created)||!money(doc.rent)||!money(doc.charges)||!doc.owner||!doc.lease||!Array.isArray(doc.payments))fail();keys.add(key);validate({...empty(),owner:doc.owner,leases:[doc.lease],payments:doc.payments});if(doc.lease.id!==doc.leaseId||doc.rent!==doc.lease.rent||doc.charges!==doc.lease.charges||doc.payments.some(p=>p.month!==doc.month)||doc.payments.reduce((n,p)=>n+p.amount,0)<doc.rent+doc.charges)fail();}
 return d;
}
export function heads(files){const parents=new Set(files.map(f=>f.appProperties?.parent).filter(Boolean));return files.filter(f=>!parents.has(f.id));}
