/* Normal-help model adapted from Neroli's Lab, Copyright The Neroli's Lab Authors.
 * Apache-2.0; see licenses/Apache-2.0.txt and licenses/NOTICE.txt.
 * Modified: fixed-energy analytic expectations, no skills/camp/team effects, strict missing-data handling. */
(function(root){
'use strict';
const D=root.SleepData, ING_LEVELS=[1,30,60], SKILL_LEVELS=[10,25,50,70,80];
const lookup=(list,id)=>list.find(x=>x.id===id);
const species=id=>lookup(D.pokemon,id), ingredient=id=>lookup(D.ingredients,id), nature=id=>lookup(D.natures,id), skill=id=>lookup(D.subskills,id);
const effectiveLevel=(p,mode)=>mode==='current'?p.level:Math.max(p.level,Number(mode));
const unlocked=(level,threshold)=>level>=threshold;
function slotStatus(p,threshold,mode){return p.level>=threshold?'active':effectiveLevel(p,mode)>=threshold?'projected':'locked';}
function calc(p,mode,energy){
 const level=effectiveLevel(p,mode),errors=[]; const sp=species(p.species),n=nature(p.nature);
 if(!sp)errors.push('種族を選択してください');
 if(sp?.calculationUnsupported)errors.push(sp.calculationUnsupported);
 if(!Number.isInteger(p.level)||p.level<1)errors.push('現在レベルが未入力です');
 if(!n)errors.push('性格が未入力です');
 if(level>D.meta.calcCap)errors.push('Lv.80は将来の構成試算です。収集数は未対応');
 if(![0,20,50,70,100].includes(energy))errors.push('げんき条件が不正です');
 const activeSlots=ING_LEVELS.map((v,i)=>level>=v?i:null).filter(x=>x!==null);
 const activeSkills=SKILL_LEVELS.map((v,i)=>level>=v?i:null).filter(x=>x!==null);
 for(const i of activeSlots)if(!p.slots[i]||!sp?.slots[i].some(x=>x.id===p.slots[i])) errors.push(`食材${i+1}枠目を選択してください`);
 for(const i of activeSkills)if(!skill(p.subskills[i]))errors.push(`Lv.${SKILL_LEVELS[i]}のサブスキルが未入力です`);
 if(sp?.remainingEvolutions>0&&p.ribbon===null)errors.push('おやすみリボンが未入力です');
 if(errors.length)return {ok:false,level,errors};
 const ids=new Set(activeSkills.map(i=>p.subskills[i]));
 const amount=id=>ids.has(id)?skill(id).amount:0;
 const speed=Math.max(.65,1-amount('HELPING_SPEED_S')-amount('HELPING_SPEED_M')-amount('HELPING_BONUS'));
 const rate=sp.ingredientRate*n.ingredient*(1+amount('INGREDIENT_FINDER_S')+amount('INGREDIENT_FINDER_M'));
 let ribbon=1;
 if(p.ribbon>=2)ribbon-=sp.remainingEvolutions===2?.11:sp.remainingEvolutions===1?.05:0;
 if(p.ribbon>=4)ribbon-=sp.remainingEvolutions===2?.14:sp.remainingEvolutions===1?.07:0;
 const combined=Math.round((2-n.frequency)*speed*(1-.002*(level-1))*ribbon*10000)/10000;
 const baseInterval=Math.floor(combined*sp.frequency);
 const energyFactor=energy>=80?.45:energy>=60?.52:energy>=40?.58:energy>=1?.66:1;
 const interval=baseInterval*energyFactor,helps=86400/interval;
 const counts=Object.fromEntries(D.ingredients.map(i=>[i.id,0]));
 for(const i of activeSlots){const s=sp.slots[i].find(x=>x.id===p.slots[i]);counts[s.id]+=helps*rate*s.amount/activeSlots.length;}
 return {ok:true,level,counts,interval,helps,rate,energyFactor,baseInterval};
}
function compare(state,recipe){return recipe.ingredients.map(x=>{
 const a=state.assignments[x.id],p=a&&state.pokemon.find(p=>p.id===a.pokemonId),result=p?calc(p,state.mode,state.energy):null;
 const quantity=result?.ok?result.counts[x.id]:null;
 return {...x,need:x.amount*3,pokemon:p,result,quantity,diff:quantity===null?null:quantity-x.amount*3};
});}
function emptyState(){return {schemaVersion:1,pokemon:[],assignments:{},mode:'current',energy:100,recipeId:D.recipes[0].id,updatedAt:null};}
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
 if(!['current','50','60','70','80'].includes(input.mode))fail('表示レベルが不正です');
 if(![0,20,50,70,100].includes(input.energy))fail('計算条件が不正です');
 if(!lookup(D.recipes,input.recipeId))fail('料理が不正です');
 state.mode=input.mode;state.energy=input.energy;state.recipeId=input.recipeId;state.updatedAt=typeof input.updatedAt==='string'?input.updatedAt:null;
 return state;
}
root.SleepCore={ING_LEVELS,SKILL_LEVELS,species,ingredient,nature,skill,effectiveLevel,unlocked,slotStatus,calc,compare,emptyState,validateState};
})(globalThis);
