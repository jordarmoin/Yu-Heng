import {works} from '../lib/content';
export function GET(){
 const base='https://gallery.zyhzyh.me';
 const suffixes=['/','/list/',...works.map(w=>`/works/${w.path}/`)];
 const urls=suffixes.flatMap(suffix=>['zh','en'].map(lang=>`<url><loc>${base}/${lang}${suffix}</loc>${['zh','en','x-default'].map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${base}/${l==='x-default'?'zh':l}${suffix}"/>`).join('')}</url>`)).join('');
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
