/* Normal-help model adapted from Neroli's Lab, Copyright The Neroli's Lab Authors.
 * Apache-2.0; see licenses/Apache-2.0.txt and licenses/NOTICE.txt.
 * Modified: fixed-energy analytic expectations, no skills/team effects; optional camp and final-form simulation, strict missing-data handling. */
(function(root){
'use strict';
const D=root.SleepData, ING_LEVELS=[1,30,60], SKILL_LEVELS=[10,25,50,70,80];
const lookup=(list,id)=>list.find(x=>x.id===id);
const species=id=>lookup(D.pokemon,id), ingredient=id=>lookup(D.ingredients,id), nature=id=>lookup(D.natures,id), skill=id=>lookup(D.subskills,id);
const berry=id=>lookup(D.berries,id);
const effectiveLevel=(p,mode)=>mode==='current'?p.level:Math.max(p.level,Number(mode));
const unlocked=(level,threshold)=>level>=threshold;
function slotStatus(p,threshold,mode){return p.level>=threshold?'active':effectiveLevel(p,mode)>=threshold?'projected':'locked';}
function finalSpecies(id,seen=new Set()){if(seen.has(id))return [];const sp=species(id);if(!sp)return [];const next=new Set(seen).add(id);return sp.evolvesInto?.length?[...new Set(sp.evolvesInto.flatMap(x=>finalSpecies(x,next)))]:[id];}
function simulatedSpecies(p,options={}){if(options.evolution!=='final')return species(p.species);const choices=finalSpecies(p.species);const selected=options.finalForms?.[p.id];return species(choices.length===1?choices[0]:choices.includes(selected)?selected:'');}
function formResults(p,mode,energy,options,producer){
 const variants=['current','final'].map(evolution=>producer(p,mode,energy,{...options,evolution}));
 // Never claim a winning form when the other form cannot be calculated.
 return variants;
}
function bestForm(rows,value){return rows.reduce((best,r)=>!best||value(r)>value(best)?r:best,null);}
function calc(p,mode,energy,options={},target=null){
 if(options.evolution!=='auto')return production(p,mode,energy,options,true);
 if(!ingredient(target))return {ok:false,level:effectiveLevel(p,mode),errors:['おまかせは対象食材ごとに比較します。担当カードを確認してください']};
 const rows=formResults(p,mode,energy,options,(p,m,e,o)=>production(p,m,e,o,true));
 if(rows.some(r=>!r.ok))return {ok:false,level:effectiveLevel(p,mode),errors:[...new Set(rows.filter(r=>!r.ok).flatMap(r=>r.errors))]};
 return {...bestForm(rows,r=>r.counts[target]),automatic:true,comparisonTarget:target};
}
function production(p,mode,energy,options,withIngredients){
 const level=effectiveLevel(p,mode),errors=[]; const sp=simulatedSpecies(p,options),n=nature(p.nature);
 if(!sp)errors.push(options.evolution==='final'&&species(p.species)?'最終進化先を選択してください':'種族を選択してください');
 if(sp?.calculationUnsupported)errors.push(sp.calculationUnsupported);
 if(!Number.isInteger(p.level)||p.level<1)errors.push('現在レベルが未入力です');
 if(!n)errors.push('性格が未入力です');
 if(level>D.meta.calcCap)errors.push('Lv.80は将来の構成試算です。収集数は未対応');
 if(![0,20,50,70,100].includes(energy))errors.push('げんき条件が不正です');
 const activeSlots=ING_LEVELS.map((v,i)=>level>=v?i:null).filter(x=>x!==null);
 const activeSkills=SKILL_LEVELS.map((v,i)=>level>=v?i:null).filter(x=>x!==null);
 if(withIngredients)for(const i of activeSlots)if(!p.slots[i]||!sp?.slots[i].some(x=>x.id===p.slots[i])) errors.push(`食材${i+1}枠目を選択してください`);
 for(const i of activeSkills)if(!skill(p.subskills[i]))errors.push(`Lv.${SKILL_LEVELS[i]}のサブスキルが未入力です`);
 if(sp?.remainingEvolutions>0&&p.ribbon===null)errors.push('おやすみリボンが未入力です');
 if(errors.length)return {ok:false,level,errors};
 const ids=new Set(activeSkills.map(i=>p.subskills[i]));
 const amount=id=>ids.has(id)?skill(id).amount:0;
 const speed=Math.max(.65,1-amount('HELPING_SPEED_S')-amount('HELPING_SPEED_M')-amount('HELPING_BONUS'));
 const rate=sp.ingredientRate*n.ingredient*(1+amount('INGREDIENT_FINDER_S')+amount('INGREDIENT_FINDER_M'));
 const ribbon=D.ribbons.find(x=>x.stage===p.ribbon)?.frequencyByRemainingEvolutions[sp.remainingEvolutions]??1;
 const combined=Math.round((2-n.frequency)*speed*(1-.002*(level-1))*ribbon*10000)/10000;
 const baseInterval=Math.floor(combined*sp.frequency/(options.camp?1.2:1));
 const energyFactor=energy>=80?.45:energy>=60?.52:energy>=40?.58:energy>=1?.66:1;
 const interval=baseInterval*energyFactor,helps=86400/interval;
 const counts=Object.fromEntries(D.ingredients.map(i=>[i.id,0]));
 if(withIngredients)for(const i of activeSlots){const s=sp.slots[i].find(x=>x.id===p.slots[i]);counts[s.id]+=helps*rate*s.amount/activeSlots.length;}
 return {ok:true,level,calculationSpecies:sp.id,camp:!!options.camp,counts,interval,helps,rate,energyFactor,baseInterval};
}
// Neroli's Lab: berryPowerForLevel, calculateNrOfBerriesPerDrop,
// calculateAverageProduce. Same normal-help conditions as ingredient estimates.
function berryPower(id,level){const b=berry(id);return b&&Number.isInteger(level)&&level>=1&&level<=D.meta.calcCap?Math.round(Math.max(b.value+level-1,b.value*Math.pow(1.025,level-1))):null;}
function calcBerry(p,mode,energy,options={},target=null){
 if(options.evolution==='auto'){
 const rows=formResults(p,mode,energy,options,(p,m,e,o)=>calcBerry(p,m,e,o));
 if(rows.some(r=>!r.ok))return {ok:false,level:effectiveLevel(p,mode),errors:[...new Set(rows.filter(r=>!r.ok).flatMap(r=>r.errors))]};
 const eligible=rows.filter(r=>!target||r.berryId===target);
 return eligible.length?{...bestForm(eligible,r=>r.berryEnergy),automatic:true}:{ok:false,level:effectiveLevel(p,mode),errors:['現在の姿・最終進化とも対象のきのみを集めません']};
 }
 const r=production(p,mode,energy,options,false);if(!r.ok)return r;
 const sp=species(r.calculationSpecies),b=berry(sp.berry);
 if(!b)return {ok:false,level:r.level,errors:['きのみの基礎データが未対応です']};
 if(target&&b.id!==target)return {ok:false,level:r.level,errors:[`この条件では${b.name}を集めます。担当を選び直してください`]};
 const finding=p.subskills.some((id,i)=>id==='BERRY_FINDING_S'&&r.level>=SKILL_LEVELS[i]);
 const perDrop=(['berry','all'].includes(sp.specialty)?2:1)+(finding?1:0);
 const count=r.helps*(1-r.rate)*perDrop,power=berryPower(b.id,r.level);
 if(!Number.isFinite(count)||count<0||power===null)return {ok:false,level:r.level,errors:['きのみの計算条件が未対応です']};
 return {...r,berryId:b.id,perDrop,count,power,berryEnergy:count*power};
}
// Only verified favorite IDs receive the adopted base favored multiplier.
function mapFavoriteIds(mapId,selected=[]){const map=D.maps.find(m=>m.id===mapId);return map?[...new Set((map.dynamic?selected:map.berries).filter(id=>berry(id)))]:[];}
function calcMapBerry(p,mode,energy,options,mapId,selected=[],target){
 if(!mapFavoriteIds(mapId,selected).includes(target))return {ok:false,level:effectiveLevel(p,mode),errors:['選択マップの好きなきのみに指定されていません']};
 const r=calcBerry(p,mode,energy,options,target);if(!r.ok)return r;
 return {...r,normalBerryEnergy:r.berryEnergy,berryEnergy:r.berryEnergy*D.berryModifiers.favored,favoredMultiplier:D.berryModifiers.favored,mapId};
}
function removePokemon(input,id){
 const next=JSON.parse(JSON.stringify(input));next.pokemon=next.pokemon.filter(p=>p.id!==id);
 for(const key of ['assignments','berryAssignments'])for(const [target,a] of Object.entries(next[key]))if(a.pokemonId===id)delete next[key][target];
 for(const records of Object.values(next.assignmentHistory||{}))delete records[id];
 for(const [target,list] of Object.entries(next.berryAssignmentHistory||{}))next.berryAssignmentHistory[target]=list.filter(pid=>pid!==id);
 delete next.finalForms[id];return next;
}
// Ranking uses exactly the card calculations, with no new production coefficients.
function autoAssign(input){
 const state=JSON.parse(JSON.stringify(input)),history=state.assignmentHistory||{},berryHistory=state.berryAssignmentHistory||{};
 for(const [id,a] of Object.entries(state.assignments))history[id]={...(history[id]||{}),[a.pokemonId]:{...a}};
 for(const [id,a] of Object.entries(state.berryAssignments))berryHistory[id]=[...new Set([...(berryHistory[id]||[]),a.pokemonId])];
 const best=(rows,value,previous)=>rows.filter(x=>Number.isFinite(value(x))&&value(x)>0).sort((a,b)=>value(b)-value(a)||(a.p.id===previous?-1:b.p.id===previous?1:a.p.id<b.p.id?-1:a.p.id>b.p.id?1:0))[0];
 const assignments={},berryAssignments={};
 for(const ing of D.ingredients){
 const rows=state.pokemon.map(p=>({p,r:calc(p,state.mode,state.energy,state,ing.id)})).filter(x=>x.r.ok&&species(x.r.calculationSpecies)?.specialty==='ingredient');
 const winner=best(rows,x=>x.r.counts[ing.id],state.assignments[ing.id]?.pokemonId);
 if(winner){const id=winner.p.id,records=history[ing.id]||{},record=Object.prototype.hasOwnProperty.call(records,id)?records[id]:null;assignments[ing.id]=record?{...record}:{pokemonId:id,complete:false,note:'',completedAt:null};}}
 for(const b of D.berries){
 const rows=state.pokemon.map(p=>({p,r:calcBerry(p,state.mode,state.energy,state,b.id)})).filter(x=>x.r.ok&&species(x.r.calculationSpecies)?.specialty==='berry');
 const winner=best(rows,x=>x.r.berryEnergy,state.berryAssignments[b.id]?.pokemonId);if(winner)berryAssignments[b.id]={pokemonId:winner.p.id};}
 return {...state,assignments,berryAssignments,assignmentHistory:history,berryAssignmentHistory:berryHistory};
}
function compare(state,recipe){return recipe.ingredients.map(x=>{
 const a=state.assignments[x.id],p=a&&state.pokemon.find(p=>p.id===a.pokemonId),result=p?calc(p,state.mode,state.energy,state,x.id):null;
 const quantity=result?.ok?result.counts[x.id]:null;
 return {...x,need:x.amount*3,pokemon:p,result,quantity,diff:quantity===null?null:quantity-x.amount*3};
});}
function emptyState(){return {schemaVersion:1,pokemon:[],assignments:{},berryAssignments:{},assignmentHistory:{},berryAssignmentHistory:{},mode:'current',energy:100,evolution:'current',camp:false,finalForms:{},recipeId:D.recipes[0].id,updatedAt:null};}
function validateState(input){
 const fail=m=>{throw new Error(m);};
 if(!input||typeof input!=='object'||input.schemaVersion!==1)fail('対応していないバックアップ形式です');
 if(!Array.isArray(input.pokemon)||input.pokemon.length>2000)fail('個体データが不正です');
 const state=emptyState();const ids=new Set();
 const text=(v,max)=>typeof v==='string'&&v.length<=max;
 state.pokemon=input.pokemon.map(p=>{
  if(!p||!text(p.id,100)||!p.id||ids.has(p.id))fail('個体IDが不正または重複しています');ids.add(p.id);
  if(!text(p.nickname,80)||!text(p.memo,2000)||!text(p.customName,80))fail('名前・メモが不正です');
  if(p.species!==''&&!species(p.species))fail('未対応の種族が含まれています');
  if(!Number.isInteger(p.level)||p.level<1||p.level>D.meta.gameCap)fail('現在レベルは1〜70で指定してください');
  if(p.nature!==''&&!nature(p.nature))fail('性格が不正です');
  if(!Array.isArray(p.slots)||p.slots.length!==3||!p.slots.every(x=>x===''||ingredient(x)))fail('食材枠が不正です');
  const sp=species(p.species);
  if(sp&&p.slots.some((id,i)=>id&&!sp.slots[i].some(x=>x.id===id)))fail('種族と食材枠の組み合わせが不正です');
  if(!Array.isArray(p.subskills)||p.subskills.length!==5||!p.subskills.every(x=>x===''||skill(x)))fail('サブスキルが不正です');
  const set=p.subskills.filter(Boolean);if(new Set(set).size!==set.length)fail('同じサブスキルは重複登録できません');
  if(p.ribbon!==null&&![0,1,2,3,4].includes(p.ribbon))fail('リボンが不正です');
  if(p.carry!==null&&(!Number.isInteger(p.carry)||p.carry<1||p.carry>999))fail('最大所持数が不正です');
  if(p.mainSkillLevel!==null&&(!Number.isInteger(p.mainSkillLevel)||p.mainSkillLevel<1||p.mainSkillLevel>20))fail('メインスキルレベルが不正です');
  return {id:p.id,species:p.species,customName:p.customName,nickname:p.nickname,level:p.level,slots:[...p.slots],subskills:[...p.subskills],nature:p.nature,ribbon:p.ribbon,carry:p.carry,mainSkillLevel:p.mainSkillLevel,memo:p.memo};
 });
 if(!input.assignments||typeof input.assignments!=='object'||Array.isArray(input.assignments))fail('担当データが不正です');
 for(const [id,a] of Object.entries(input.assignments)){
  if(!ingredient(id)||!a||!ids.has(a.pokemonId)||typeof a.complete!=='boolean'||!text(a.note,500))fail('担当データの参照が不正です');
  if(a.completedAt!==null&&(!text(a.completedAt,40)||Number.isNaN(Date.parse(a.completedAt))))fail('完了日が不正です');
  state.assignments[id]={pokemonId:a.pokemonId,complete:a.complete,note:a.note,completedAt:a.completedAt};
 }
 const berryAssignments=input.berryAssignments===undefined?{}:input.berryAssignments;
 if(!berryAssignments||typeof berryAssignments!=='object'||Array.isArray(berryAssignments))fail('きのみ担当データが不正です');
 for(const [id,a] of Object.entries(berryAssignments)){
  if(!berry(id)||!a||!ids.has(a.pokemonId))fail('きのみ担当データの参照が不正です');
  state.berryAssignments[id]={pokemonId:a.pokemonId};
 }
 const history=input.assignmentHistory??{};
 if(!history||typeof history!=='object'||Array.isArray(history))fail('担当履歴が不正です');
 for(const [id,records] of Object.entries(history)){
  if(!ingredient(id)||!records||typeof records!=='object'||Array.isArray(records))fail('担当履歴が不正です');
  const entries=[];for(const [pid,a] of Object.entries(records)){
   if(!ids.has(pid)||!a||a.pokemonId!==pid||typeof a.complete!=='boolean'||!text(a.note,500)||a.completedAt!==null&&(!text(a.completedAt,40)||Number.isNaN(Date.parse(a.completedAt))))fail('担当履歴の参照が不正です');
   entries.push([pid,{pokemonId:pid,complete:a.complete,note:a.note,completedAt:a.completedAt}]);
  }state.assignmentHistory[id]=Object.fromEntries(entries);
 }
 const berryHistory=input.berryAssignmentHistory??{};
 if(!berryHistory||typeof berryHistory!=='object'||Array.isArray(berryHistory))fail('きのみ担当履歴が不正です');
 for(const [id,list] of Object.entries(berryHistory)){if(!berry(id)||!Array.isArray(list)||!list.every(pid=>ids.has(pid)))fail('きのみ担当履歴の参照が不正です');state.berryAssignmentHistory[id]=[...new Set(list)];}
 if(!['current','50','60','70','80'].includes(input.mode))fail('表示レベルが不正です');
 if(![0,20,50,70,100].includes(input.energy))fail('計算条件が不正です');
 if(!lookup(D.recipes,input.recipeId))fail('料理が不正です');
 if(input.evolution!==undefined&&!['current','final','auto'].includes(input.evolution))fail('進化条件が不正です');
 if(input.camp!==undefined&&typeof input.camp!=='boolean')fail('キャンプ条件が不正です');
 const forms=input.finalForms??{};if(!forms||typeof forms!=='object'||Array.isArray(forms))fail('進化先条件が不正です');
 for(const [id,target] of Object.entries(forms)){const p=state.pokemon.find(p=>p.id===id);if(!p||!finalSpecies(p.species).includes(target))continue;state.finalForms[id]=target;}
 state.evolution=input.evolution??'current';state.camp=input.camp??false;
 state.mode=input.mode;state.energy=input.energy;state.recipeId=input.recipeId;state.updatedAt=typeof input.updatedAt==='string'?input.updatedAt:null;
 return state;
}
root.SleepCore={ING_LEVELS,SKILL_LEVELS,species,ingredient,berry,nature,skill,effectiveLevel,unlocked,slotStatus,finalSpecies,simulatedSpecies,calc,berryPower,calcBerry,mapFavoriteIds,calcMapBerry,autoAssign,removePokemon,compare,emptyState,validateState};
})(globalThis);
