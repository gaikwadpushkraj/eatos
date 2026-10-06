import { Kernel, CATALOG, fitFor, fitsAll, safeForAll } from '@eatos/core';
const T=Date.parse('2026-10-14T19:00:00+05:30'); const at=T-86400000;
const mk=(id:string,name:string,extra:any)=>({type:'member.added',at,member:{id,name,diet:'omnivore',allergens:[],dislikes:[],goals:[],...extra}});
const evs:any[]=[{type:'profile.set',at,id:'p',profile:{selfId:'me',members:[{id:'me',name:'Gurpreet',diet:'omnivore',allergens:[],dislikes:[],goals:[],cuisines:['punjabi']}],routine:{wake:420,sleep:1380,meals:{breakfast:480,lunch:780,snack:1020,dinner:1170},medication:[]},floorKcal:1200,tzOffsetMin:330}},
 mk('dadaji','Dadaji',{diet:'vegetarian',conditions:['hypertension','older-adult-soft']}),
 mk('dadi','Dadi',{diet:'vegetarian',conditions:['diabetes']}),mk('harjeet','Harjeet',{}),mk('jaspreet','Jaspreet',{goals:['more-protein','performance']}),
 mk('simran','Simran',{diet:'vegetarian',conditions:['minor'],mild:true})];
const k=new Kernel({events:evs}); const ms=k.state.profile!.members;
const all=CATALOG; console.log('catalog',all.length);
console.log('fits everyone',all.filter(f=>fitsAll(f,ms)).length,'safe all',all.filter(f=>safeForAll(f,ms)).length);
const veg=all.filter(f=>fitsAll(f,ms)); 
for(const s of ['breakfast','lunch','snack','dinner']) console.log(s,all.filter(f=>f.slots.includes(s as any)).length, veg.filter(f=>f.slots.includes(s as any)).length);
const {plan}=k.week(T,7);
const items:any[]=(plan as any).days?.flatMap((d:any)=>d.meals??d.items??[])??[]; 
console.log(Object.keys(plan as any), JSON.stringify(plan).slice(0,500));
let n=0,fit=0,safe=0,nonveg=0,meat=0;
for(const it of items){const f=all.find(x=>x.id===(it.foodId??it.food?.id)); if(!f)continue;n++; if(fitsAll(f,ms))fit++; if(safeForAll(f,ms))safe++;}
console.log('plan items',n,'fit',fit,'safe',safe);
const kw=/langar|karah|prasad|halwa|kadah|kheer|makki|sarson|amritsari|kulcha|chole|rajma|dal makhani|lassi|pinni|gur|jalebi|pakora|degh|meethe|chawal|saag/i;
console.log(all.filter(f=>kw.test(f.name+' '+f.id)).map(f=>f.name+(f.tags.includes('veg')?'':'')+' |'+(f.cuisine??'')).join('\n'));
const hc=/hot|cold|garam|thanda|cooling|heating|tasir|myth|tradition|ayurved|dosha/i;
console.log('hot/cold tags',all.filter(f=>f.tags.some(t=>hc.test(t))).length, [...new Set(all.flatMap(f=>f.tags))].filter(t=>hc.test(t)));
console.log('sample food',JSON.stringify(all.find(f=>/rajma/i.test(f.name))));
// quantity fields
