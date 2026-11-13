import {fontBase64,widths} from './font.js';
// Générateur PDF A4 autonome : police Liberation Sans embarquée, encodage WinAnsi.
// Aucun téléchargement de bibliothèque ni transmission de données.
const extra={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159,'\u202f':32};
function win(s){return Array.from(String(s)).map(c=>c.charCodeAt(0)<=255?c.charCodeAt(0):extra[c]??63);}
function literal(s){return '('+win(s).map(n=>[40,41,92].includes(n)?'\\'+String.fromCharCode(n):n<32?' ':String.fromCharCode(n)).join('')+')';}
function wrap(s,max=76){return String(s).split('\n').flatMap(line=>{const result=[];let row='';for(const word of line.split(/\s+/)){if((row+' '+word).length>max&&row){result.push(row);row='';}let w=word;while(w.length>max){if(row){result.push(row);row='';}result.push(w.slice(0,max));w=w.slice(max);}row+=(row?' ':'')+w;}result.push(row);return result;});}
export function pdfBytes(d){
 const currency=d.owner.currency;const money=n=>(n/100).toFixed(2).replace('.',',')+' '+currency;
 const pages=[];let ops=[],y=785;
 function line(text,size=11,color='0.15 0.19 0.25'){if(y<65){pages.push(ops.join('\n'));ops=[];y=785;}ops.push(`BT /F1 ${size} Tf ${color} rg 1 0 0 1 48 ${y} Tm ${literal(text)} Tj ET`);y-=size+9;}
 function para(s){for(const l of wrap(s))line(l);}
 function gap(){y-=15;}
 line('MES QUITTANCES',11,'0.15 0.4 0.32');gap();line('Quittance de loyer',26);line(d.number,11);gap();
 line('BAILLEUR',10,'0.15 0.4 0.32');para(d.owner.name);para(d.owner.address);gap();
 line('LOCATAIRE(S)',10,'0.15 0.4 0.32');para(d.lease.tenant);gap();line('LOGEMENT',10,'0.15 0.4 0.32');para(d.lease.address);gap();
 const [yy,mm]=d.month.split('-').map(Number);const last=new Date(yy,mm,0).getDate();
 line(`Période : du 01/${String(mm).padStart(2,'0')}/${yy} au ${last}/${String(mm).padStart(2,'0')}/${yy}`);gap();
 line('Loyer : '+money(d.rent),13);line('Charges : '+money(d.charges),13);line('Total acquitté pour cette période : '+money(d.rent+d.charges),14);gap();
 para(`Je soussigné(e), ${d.owner.name}, reconnais avoir reçu de ${d.lease.tenant} la somme de ${money(d.rent+d.charges)} au titre du loyer et des charges pour la période indiquée ci-dessus.`);gap();
 line('Versements enregistrés :',10);for(const p of d.payments)para(`${p.date.split('-').reverse().join('/')} - ${money(p.amount)} - ${p.method}`);
 const excess=d.payments.reduce((n,p)=>n+p.amount,0)-d.rent-d.charges;if(excess>0)para(`Excédent enregistré : ${money(excess)} (non inclus dans le total de cette quittance).`);
 gap();para(`Établie${d.owner.city?' à '+d.owner.city:''}, le ${d.created.split('-').reverse().join('/')}.`);para('Bailleur : '+d.owner.name);gap();line('Document généré à partir des paiements déclarés par le bailleur.',9);line('Ce document ne comporte pas de signature électronique certifiée.',9);
 pages.push(ops.join('\n'));
 const font=atob(fontBase64);
 const objects=['','', `<< /Type /Font /Subtype /TrueType /BaseFont /LiberationSans /FirstChar 32 /LastChar 255 /Widths [${widths.join(' ')}] /FontDescriptor 4 0 R /Encoding /WinAnsiEncoding >>`, '<< /Type /FontDescriptor /FontName /LiberationSans /Flags 32 /FontBBox [-543 -303 1302 980] /ItalicAngle 0 /Ascent 905 /Descent -212 /CapHeight 688 /StemV 80 /FontFile2 5 0 R >>', `<< /Length ${font.length} /Length1 ${font.length} >>\nstream\n${font}\nendstream`];const kids=[];
 for(const stream of pages){const page=objects.length+1,content=page+1;kids.push(`${page} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);}
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
 let out='%PDF-1.4\n';const offsets=[0];objects.forEach((obj,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=out.length;out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(const n of offsets.slice(1))out+=`${String(n).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Uint8Array.from(out,c=>c.charCodeAt(0));
}
export const pdfBlob=d=>new Blob([pdfBytes(d)],{type:'application/pdf'});
