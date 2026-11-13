import {heads,validate,empty} from './core.js';
const API='https://www.googleapis.com/drive/v3';
const SCOPE='https://www.googleapis.com/auth/drive.file';
let token='',expires=0,head=null;
export const connected=()=>!!token;
export function disconnect(){token='';expires=0;head=null;}
export function connect(clientId){return new Promise((resolve,reject)=>{
 if(!clientId.endsWith('.apps.googleusercontent.com'))return reject(Error('Ajoutez votre identifiant client OAuth Google dans les paramètres.'));
 if(!globalThis.google?.accounts?.oauth2)return reject(Error('Le service Google ne s’est pas chargé. Vérifiez votre connexion puis rechargez la page.'));
 google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,prompt:'select_account',callback:r=>{if(r.error)return reject(Error(r.error_description||r.error));if(!google.accounts.oauth2.hasGrantedAllScopes(r,SCOPE))return reject(Error('L’accès aux fichiers de l’application est nécessaire.'));token=r.access_token;expires=Date.now()+Number(r.expires_in)*1000;head=null;resolve();},error_callback:e=>reject(Error(e.type==='popup_closed'?'Connexion annulée.':'La fenêtre Google n’a pas pu s’ouvrir.'))}).requestAccessToken();
});}
async function request(url,options={}){
 if(!token||Date.now()>expires-15000)throw Error('Session Google expirée. Reconnectez-vous avant de poursuivre.');
 const r=await fetch(url,{...options,headers:{...options.headers,Authorization:`Bearer ${token}`}});
 if(!r.ok){if(r.status===401)throw Error('Session Google expirée. Reconnectez-vous.');throw Error(`Google Drive : erreur ${r.status}. Aucune modification locale validée. Réessayez ou rechargez Drive.`);}return r;
}
async function list(kind){let pageToken;const all=[];do{const p=new URLSearchParams({q:`trashed = false and appProperties has { key='mqKind' and value='${kind}' }`,fields:'nextPageToken,files(id,name,appProperties)',pageSize:'1000'});if(pageToken)p.set('pageToken',pageToken);const r=await (await request(`${API}/files?${p}`)).json();all.push(...r.files);pageToken=r.nextPageToken;}while(pageToken);return all;}
async function current(){const h=heads(await list('snapshot-v1'));if(h.length>1)throw Error('Modifications concurrentes détectées. Les versions sont conservées dans Drive. Exportez vos données ; une réconciliation des fichiers mq-donnees est nécessaire avant de continuer.');return h[0]?.id||null;}
export async function load(){const id=await current();const d=id?validate(await (await request(`${API}/files/${encodeURIComponent(id)}?alt=media`)).json()):empty();head=id;return d;}
async function upload(metadata,blob){const boundary='mq_'+crypto.randomUUID();const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,JSON.stringify(metadata),`\r\n--${boundary}\r\nContent-Type: ${blob.type||'application/octet-stream'}\r\n\r\n`,blob,`\r\n--${boundary}--`]);return (await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body})).json();}
async function folder(){const folders=await list('folder-v1');if(folders.length)return folders[0].id;return (await (await request(`${API}/files?fields=id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Mes quittances',mimeType:'application/vnd.google-apps.folder',appProperties:{mqKind:'folder-v1'}})})).json()).id;}
export async function save(data){validate(data);if(await current()!==head)throw Error('Une version plus récente existe sur Drive. Rechargez Drive avant de modifier les données.');const parent=head||'root';const f=await upload({name:`mq-donnees-${new Date().toISOString().replaceAll(':','-')}.json`,parents:[await folder()],appProperties:{mqKind:'snapshot-v1',parent}},new Blob([JSON.stringify(data)],{type:'application/json'}));head=f.id;await current();}
export async function archive(doc,blob){const found=(await list('receipt-v1')).find(f=>f.appProperties.docId===doc.id);if(found)return found.id;return (await upload({name:`${doc.number}.pdf`,parents:[await folder()],appProperties:{mqKind:'receipt-v1',docId:doc.id}},blob)).id;}
