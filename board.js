/* Shared compact cards. No mutations to registered individuals or assignments. */
(function(root){
'use strict';
const C=root.SleepCore,D=root.SleepData;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short={INGREDIENT_FINDER_S:'食S',INGREDIENT_FINDER_M:'食M',HELPING_SPEED_S:'おてスピS',HELPING_SPEED_M:'おてスピM',HELPING_BONUS:'おてボ',INVENTORY_S:'所持S',INVENTORY_M:'所持M',INVENTORY_L:'所持L',BERRY_FINDING_S:'きのみS',ENERGY_RECOVERY_BONUS:'げんきボ',SKILL_LEVEL_UP_S:'スLvS',SKILL_LEVEL_UP_M:'スLvM',SKILL_TRIGGER_S:'ス率S',SKILL_TRIGGER_M:'ス率M',SLEEP_EXP_BONUS:'睡眠EXP',DREAM_SHARD_BONUS:'ゆめボ',RESEARCH_EXP_BONUS:'研究EXP'};
const statusName={active:'解放済み',projected:'試算で解放',locked:'未解放'};
const displaySpecies=(p,state={},result=null)=>result?.ok?C.species(result.calculationSpecies)?.name||'未確認':!C.species(p.species)?(p.customName||'未入力'):state.evolution==='final'?(C.simulatedSpecies(p,state)?.name||'進化先未選択'):C.species(p.species).name;
function identity(p,state,purpose='ingredient',result=null){return `<div class="compact-row compact-identity"><button class="mini-person" data-detail="${esc(p.id)}" title="${esc(displaySpecies(p,state,result))}・現在Lv.${p.level}・計算Lv.${C.effectiveLevel(p,state.mode)}・詳細を開く"><span class="mini-person-name">${esc(displaySpecies(p,state,result))}</span></button><span class="card-level" title="現在Lv.${p.level}・計算Lv.${C.effectiveLevel(p,state.mode)}">Lv.${C.effectiveLevel(p,state.mode)}</span>${nature(p,true,purpose)}</div><div class="compact-row compact-secondary"><span class="card-nickname" title="${esc(p.nickname)}">${esc(p.nickname)}</span></div>`;}
// Registered ribbon stage only; independent from assignment/evolution simulation.
function sleepRibbon(p){
 const stages=D.ribbons.map(r=>r.name);
 const valid=Number.isInteger(p.ribbon)&&p.ribbon>=0&&p.ribbon<stages.length;
 const label=valid?stages[p.ribbon]:'未入力',hours=D.ribbons.map(r=>r.hours?r.hours.toLocaleString('ja-JP'):'―');
 return `<span class="sleep-ribbon ${valid&&p.ribbon>0?'earned':'neutral'}" title="おやすみリボン：${label}" aria-label="おやすみリボン：${label}" data-ribbon="${valid?p.ribbon:'unknown'}">${valid&&p.ribbon>0?'<svg viewBox="0 0 12 16" width="10" height="13" aria-hidden="true"><path d="M2 1h8v13l-4-3-4 3Z" fill="currentColor"/></svg>':''}<span>${valid?hours[p.ribbon]:'―'}</span></span>`;
}
function nature(p,compact=false,purpose='ingredient'){const n=C.nature(p.nature);if(!n)return '<span class="mini-nature unknown" title="性格未入力">?</span>';const badges=(purpose==='berry'?[['speed','速']]:[['ingredient','食'],['speed','速']]).flatMap(([key,label])=>n.positiveModifier===key?[`<span class="up" title="${label==='食'?'食材おてつだい確率':'おてつだいスピード'}アップ">${label}↑</span>`]:n.negativeModifier===key?[`<span class="down" title="${label==='食'?'食材おてつだい確率':'おてつだいスピード'}ダウン">${label}↓</span>`]:[]);return `<span class="mini-nature">${badges.join(' ')||'<span class="neutral" title="食材確率・速度の対象補正なし">―</span>'}</span>`;}
// Fixed purpose-specific evaluation coordinates; never remove skills from individuals.
const evaluationSkills={individual:['HELPING_BONUS','BERRY_FINDING_S','INGREDIENT_FINDER_M','HELPING_SPEED_M','INVENTORY_M','INVENTORY_L','INGREDIENT_FINDER_S','HELPING_SPEED_S','INVENTORY_S'],ingredient:['INGREDIENT_FINDER_M','INGREDIENT_FINDER_S','HELPING_BONUS','HELPING_SPEED_M','HELPING_SPEED_S','INVENTORY_L','INVENTORY_M','INVENTORY_S'],berry:['BERRY_FINDING_S','HELPING_BONUS','HELPING_SPEED_M','HELPING_SPEED_S']};
function skills(p,mode,purpose='ingredient'){
 const list=evaluationSkills[purpose]||evaluationSkills.ingredient,missing=p.subskills.some(id=>!id);
 const badge=id=>{const sk=C.skill(id),i=p.subskills.indexOf(id),owned=i>=0,status=owned?C.slotStatus(p,C.SKILL_LEVELS[i],mode):missing?'uncertain':'absent';const label=owned?`Lv.${C.SKILL_LEVELS[i]} ${sk.name}・${statusName[status]}`:`${sk.name}・${missing?'未確認（サブスキルに未入力あり）':'未所持'}`;
 return `<span class="mini-skill rarity-${sk.rarity} ${owned?'owned ':''}${status}" data-skill="${id}" title="${esc(label)}" aria-label="${esc(label)}">${owned&&status==='locked'?'·':''}${short[id]}${!owned&&missing?'<sup>?</sup>':''}</span>`;};
 const groups=purpose==='ingredient'?[list.slice(0,2),list.slice(2,5),list.slice(5)]:purpose==='berry'?[list.slice(0,2),list.slice(2)]:[list.filter(id=>C.skill(id).rarity!=='white'),list.filter(id=>C.skill(id).rarity==='white')];
 return `<div class="mini-skills fixed-skills purpose-${purpose}" aria-label="固定位置の評価サブスキル">${groups.map((ids,i)=>`<div class="skill-row skill-group-${i}" style="--skill-columns:${purpose==='individual'?3:ids.length}">${ids.map(badge).join('')}</div>`).join('')}</div>`;

}

function miniSlots(p,mode,markers=true){return `<span class="mini-slots" aria-label="食材1・2・3枠">${p.slots.map((id,i)=>{const ing=C.ingredient(id),status=C.slotStatus(p,C.ING_LEVELS[i],mode);return `<span class="${status}" title="${i+1}枠目 ${esc(ing?.name||'未入力')}・${statusName[status]}" aria-label="${i+1}枠目 ${esc(ing?.name||'未入力')} ${statusName[status]}">${ing?.icon||'?'}${markers?(status==='locked'?'<sup>·</sup>':status==='projected'?'<sup>↗</sup>':''):''}</span>`;}).join('')}</span>`;}
function slotLetters(p){const sp=C.species(p.species),ids=sp?[...new Set(sp.slots.flat().map(s=>s.id))]:[];return p.slots.map(id=>{const i=ids.indexOf(id);return i>=0&&i<3?'ABC'[i]:'?';});}
function letterSlots(p,mode){return `<strong class="letter-slots" aria-label="食材並び ${slotLetters(p).join('')}">${slotLetters(p).map((letter,i)=>{const status=C.slotStatus(p,C.ING_LEVELS[i],mode);return `<span class="${status}" title="${i+1}枠目・${statusName[status]}">${letter}</span>`;}).join('')}</strong>`;}
function daily(p,mode,energy,options={},target=null){const r=C.calc(p,mode,energy,options,target);return {result:r,items:r.ok?Object.entries(r.counts).filter(([,v])=>v>0):[]};}
const defaultIngredientOrder=Object.freeze(['Leek','Mushroom','Egg','Potato','Apple','Herb','Sausage','Milk','Honey','Oil','Ginger','Tomato','Cacao','Tail','Soybean','Corn','Coffee','Pumpkin','Avocado']);
function orderedIngredients(mode='default'){return mode==='energy'?[...D.ingredients]:defaultIngredientOrder.map(id=>C.ingredient(id));}
const ingredientCountText=value=>Math.floor(value).toLocaleString('ja-JP');
function dailyHTML(p,state,target,result=null){const r=result||daily(p,state.mode,state.energy,state,target).result;const entries=r.ok?[[target,r.counts[target]]]:[];return `<div class="compact-yield" aria-label="1日の食材別推定収集数">${r.ok?entries.map(([id,v],i)=>i===0?`<button class="target-yield" data-assign="${id}" title="${esc(C.ingredient(id).name)} ${ingredientCountText(v)}個 / 24時間・担当を編集"><b>${ingredientCountText(v)}</b></button>`:`<b title="${esc(C.ingredient(id).name)} ${ingredientCountText(v)}個 / 24時間">${ingredientCountText(v)}</b>`).join(''):`<button class="target-yield" data-assign="${target}" title="${esc(r.errors.join(' / '))}">—</button><small>${r.level>70?'将来・未計算':r.errors[0]?.includes('進化先')?'進化先を選択':'条件不足・詳細へ'}</small>`}</div>`;}
function time(seconds){const s=Math.round(seconds);return `${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function render({state,list=D.ingredients,sort='default',items=null}){
 const owner=id=>state.pokemon.find(p=>p.id===state.assignments[id]?.pokemonId);
 return (items||orderedIngredients(sort)).map(ing=>{const p=owner(ing.id),a=state.assignments[ing.id],match=list.some(i=>i.id===ing.id),result=p?C.calc(p,state.mode,state.energy,state,ing.id):null;return `<article class="harvest-tile ${p?'assigned':'unassigned'} ${match?'':'search-muted'}" aria-label="${esc(ing.name)}の担当">${p?`<div class="compact-top food-production-row">${miniSlots(p,state.mode,false)}${dailyHTML(p,state,ing.id,result)}</div><h3 class="food-card-title"><span class="food-title-text" title="${esc(ing.name)}">${esc(ing.name)}</span>${sleepRibbon(p)}</h3>${identity(p,state,'ingredient',result)}${skills(p,state.mode)}`:`<div class="compact-top food-production-row empty-food-top"><span>―</span><b class="empty-food-count">―</b></div><div class="food-card-title"><button class="food-title-text empty-ingredient" data-assign="${ing.id}" aria-label="${esc(ing.name)}の担当を登録">${esc(ing.name)}</button><span class="sleep-ribbon neutral">―</span></div><div class="empty-owner" aria-label="未選出・計算可能な対象個体なし"></div>`}</article>`;}).join('');


}
function targetList(kind,state,options={}){
 const master=kind==='berry'?D.berries:D.ingredients,assignments=kind==='berry'?state.berryAssignments:state.assignments;
 let items=kind==='ingredient'?orderedIngredients(options.by||'default'):[...master];
 if(options.by==='energy'&&kind==='berry')items.sort((a,b)=>a.value-b.value||master.indexOf(a)-master.indexOf(b));
 if(options.direction==='desc')items.reverse();
 const assigned=i=>state.pokemon.some(p=>p.id===assignments[i.id]?.pokemonId);
 return items.filter(i=>!options.filter||options.filter==='all'||options.filter==='assigned'&&assigned(i)||options.filter==='empty'&&!assigned(i));
}
root.BoardView={ingredientCountText,sleepRibbon,short,targetList,displaySpecies,identity,evaluationSkills,orderedIngredients,render,time,nature,skills,miniSlots,slotLetters,letterSlots,daily};
})(globalThis);
