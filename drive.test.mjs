import test from 'node:test';
import assert from 'node:assert/strict';
import * as drive from '../docs/drive.js';
import {empty} from '../docs/core.js';
let records=[],blobs=new Map(),counter=0,failUpload=false;
globalThis.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient:opts=>({requestAccessToken:()=>opts.callback({access_token:'test-only',expires_in:3600})})}}};
globalThis.fetch=async(url,opts={})=>{
 assert.equal(opts.headers.Authorization,'Bearer test-only');const u=new URL(url);
 if(u.pathname.includes('/upload/')){if(failUpload)return new Response('',{status:503});const text=await opts.body.text();const pieces=text.split(/--mq_[^\r\n]+/);const meta=JSON.parse(pieces[1].split('\r\n\r\n')[1].trim());const content=pieces[2].split('\r\n\r\n').slice(1).join('\r\n\r\n').trim();const id='f'+(++counter);records.push({...meta,id});blobs.set(id,content);return Response.json({id});}
 if(opts.method==='POST'){const m=JSON.parse(opts.body),id='f'+(++counter);records.push({...m,id});return Response.json({id});}
 if(u.searchParams.get('alt')==='media')return new Response(blobs.get(u.pathname.split('/').pop()));
 const kind=u.searchParams.get('q').match(/value='([^']+)'/)[1];return Response.json({files:records.filter(f=>f.appProperties.mqKind===kind)});
};
test('Drive : création, rechargement, conflit externe, échec réseau et PDF idempotent',async()=>{
 await drive.connect('test.apps.googleusercontent.com');assert.deepEqual(await drive.load(),empty());const d=empty();d.owner.name='Test';await drive.save(d);assert.deepEqual(await drive.load(),d);
 const root=records.find(f=>f.appProperties.mqKind==='snapshot-v1');records.push({id:'external',appProperties:{mqKind:'snapshot-v1',parent:root.id}});blobs.set('external',JSON.stringify(d));await assert.rejects(drive.save(d),/récente/);await drive.load();failUpload=true;await assert.rejects(drive.save(d),/503/);failUpload=false;
 const id=await drive.archive({id:'doc',number:'Q-TEST'},new Blob(['pdf'],{type:'application/pdf'}));assert.equal(await drive.archive({id:'doc',number:'Q-TEST'},new Blob(['pdf'])),id);
 records.push({id:'branch',appProperties:{mqKind:'snapshot-v1',parent:root.id}});await assert.rejects(drive.load(),/concurrentes/);drive.disconnect();assert.equal(drive.connected(),false);
});
