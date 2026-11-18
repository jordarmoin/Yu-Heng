import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import ui from '../ui.json';
export type Lang = 'zh'|'en';
export type Local = {zh?:string;en?:string};
export interface Piece {src:string;poster?:string;loop?:string;alt:Local;name?:Local;note?:Local;kind?:string;}
export interface Item {
  path:string; parent:string; dir:string; type:'work'|'collection';status:string;order:number;seed:number;size:'L'|'M'|'S';
  title:Local;medium:Local;spec:Local;summary:Local;year:number;tools:string[];cover:Piece;hero:Piece;
  spreads:{template:string;text?:Local;pieces:Piece[]}[];files:{path:string;kind?:string;label?:Local}[];
}
export const languages:Lang[]=['zh','en'];
export const t=(v:Local|undefined,lang:Lang)=>v?.[lang]||v?.[lang==='zh'?'en':'zh']||'';
export const words=(lang:Lang)=>ui[lang];
const cwd=process.cwd().endsWith('/site')?path.resolve(process.cwd(),'..'):process.cwd();
export const publicRoot=path.join(cwd,'site/public');
export const site=parse(fs.readFileSync(path.join(publicRoot,'content/site.yaml'),'utf8'));
export const media=JSON.parse(fs.readFileSync(path.join(cwd,'.cache/media.json'),'utf8'));
export const url=(item:Item,src:string|undefined)=>!src?'':src.startsWith('/')?src:`/content/works/${item.path}/${src}`;
export const info=(item:Item,src:string)=>media[url(item,src)]||{width:1600,height:900,transparent:false,dominant:'transparent'};
export function random(seed:number) {let state=seed|0;return ()=>{state=(Math.imul(1664525,state)+1013904223)|0;return (state>>>0)/4294967296;};}
const items:Item[]=[];
function walk(dir:string,relative='') {
  if(!fs.existsSync(dir))return;
  const itemFile=path.join(dir,'item.yaml');
  if(fs.existsSync(itemFile)) {
    const data=parse(fs.readFileSync(itemFile,'utf8'));
    if(data.status!=='published')return;
    items.push({spreads:[],files:[],tools:[],...data,hero:data.hero||{kind:'image',...data.cover},path:relative,parent:relative.includes('/')?relative.slice(0,relative.lastIndexOf('/')):'',dir});
  }
  for(const ent of fs.readdirSync(dir,{withFileTypes:true}))if(ent.isDirectory()&&!['media','files'].includes(ent.name))walk(path.join(dir,ent.name),relative?relative+'/'+ent.name:ent.name);
}
walk(path.join(publicRoot,'content/works'));
export const works=items.sort((a,b)=>a.order-b.order||a.path.localeCompare(b.path));
export const children=(parent='')=>works.filter(i=>i.parent===parent);
export const ancestors=(item:Item)=>works.filter(i=>item.path.startsWith(i.path+'/')).sort((a,b)=>a.path.length-b.path.length);
export const route=(item:Item,lang:Lang)=>`/${lang}/works/${item.path}/`;
export const filesize=(n:number)=>n>=1e6?`${(n/1e6).toFixed(1)} MB`:n>=1000?`${Math.round(n/1000)} KB`:`${n} B`;
export interface FileNode {name:string;href:string;folder:boolean;size?:number;bundle?:boolean;label?:Local;children?:FileNode[];github:string;}
export function fileTree(item:Item):FileNode[] {
 const make=(relative:string,label?:Local,bundle=false):FileNode=>{
   const full=path.join(item.dir,relative);const folder=fs.statSync(full).isDirectory();
   return {name:path.basename(relative),href:url(item,relative),folder,label,bundle,size:folder?undefined:fs.statSync(full).size,
    github:`https://github.com/jordarmoin/Yu-Heng/${folder?'tree':'blob'}/main/content/works/${item.path}/${relative}`,
    children:folder?fs.readdirSync(full).sort().map(name=>make(relative.replace(/\/$/,'')+'/'+name)):undefined};
 };
 return (item.files||[]).filter(f=>fs.existsSync(path.join(item.dir,f.path))).map(f=>make(f.path,f.label,f.kind==='bundle'));
}
