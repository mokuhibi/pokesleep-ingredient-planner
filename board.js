/* Two purpose-built views. No mutations to registered individuals or assignments. */
(function(root){
'use strict';
const C=root.SleepCore,D=root.SleepData;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short={INGREDIENT_FINDER_S:'食S',INGREDIENT_FINDER_M:'食M',HELPING_SPEED_S:'速S',HELPING_SPEED_M:'速M',HELPING_BONUS:'おボ',INVENTORY_S:'所S',INVENTORY_M:'所M',INVENTORY_L:'所L',BERRY_FINDING_S:'きS'};
const statusName={active:'解放済み',projected:'試算で解放',locked:'未解放'};
const displaySpecies=(p,state={})=>!C.species(p.species)?(p.customName||'未入力'):state.evolution==='final'?(C.simulatedSpecies(p,state)?.name||'進化先未選択'):C.species(p.species).name;
function identity(p,state,extra=''){return `<div class="compact-row compact-identity"><button class="mini-person" data-detail="${esc(p.id)}" title="${esc(displaySpecies(p,state))}・Lv.${C.effectiveLevel(p,state.mode)}・詳細を開く"><span class="mini-person-name">${esc(displaySpecies(p,state))}</span></button>${nature(p,true)}</div><div class="compact-row compact-secondary"><span class="card-nickname" title="${esc(p.nickname)}">${esc(p.nickname)}</span>${extra}</div>`;}
function portrait(p,state){const sp=C.simulatedSpecies(p,state);return `<span class="portrait" aria-hidden="true">${sp?`<img src="assets/pokemon/${sp.dex}.png" alt="" loading="lazy" width="64" height="64">`:'◇'}</span>`;}
function nature(p,compact=false){const n=C.nature(p.nature);if(!n)return '<span class="mini-nature unknown">性格?</span>';const badges=[['ingredient','食'],['speed','速']].flatMap(([key,label])=>n.positiveModifier===key?[`<span class="up" title="${label==='食'?'食材おてつだい確率':'おてつだいスピード'}アップ">${label}↑</span>`]:n.negativeModifier===key?[`<span class="down" title="${label==='食'?'食材おてつだい確率':'おてつだいスピード'}ダウン">${label}↓</span>`]:[]);return `<span class="mini-nature">${badges.join(' ')||(compact?'':'<span title="食材確率・速度の性格補正なし">食速±</span>')}</span>`;}
// Fixed purpose-specific evaluation coordinates; never remove skills from individuals.
const evaluationSkills={individual:['HELPING_BONUS','BERRY_FINDING_S','INGREDIENT_FINDER_M','HELPING_SPEED_M','INVENTORY_M','INVENTORY_L','INGREDIENT_FINDER_S','HELPING_SPEED_S','INVENTORY_S'],ingredient:['HELPING_BONUS','INGREDIENT_FINDER_M','HELPING_SPEED_M','INVENTORY_M','INVENTORY_L','INGREDIENT_FINDER_S','HELPING_SPEED_S','INVENTORY_S'],berry:['HELPING_BONUS','BERRY_FINDING_S','HELPING_SPEED_M','HELPING_SPEED_S']};
function skills(p,mode,purpose='ingredient'){
 const list=evaluationSkills[purpose]||evaluationSkills.ingredient,missing=p.subskills.some(id=>!id);
 const badge=id=>{const sk=C.skill(id),i=p.subskills.indexOf(id),owned=i>=0,status=owned?C.slotStatus(p,C.SKILL_LEVELS[i],mode):missing?'uncertain':'absent';const label=owned?`Lv.${C.SKILL_LEVELS[i]} ${sk.name}・${statusName[status]}`:`${sk.name}・${missing?'未確認（サブスキルに未入力あり）':'未所持'}`;
 return `<span class="mini-skill rarity-${sk.rarity} ${owned?'owned ':''}${status}" data-skill="${id}" title="${esc(label)}" aria-label="${esc(label)}">${owned&&status==='locked'?'·':''}${short[id]}${!owned&&missing?'<sup>?</sup>':''}${status==='projected'?'<sup>試</sup>':''}</span>`;};
 return `<div class="mini-skills fixed-skills" aria-label="固定位置の評価サブスキル"><div class="skill-row elevated">${list.filter(id=>C.skill(id).rarity!=='white').map(badge).join('')}</div><div class="skill-row common">${list.filter(id=>C.skill(id).rarity==='white').map(badge).join('')}</div></div>`;
}

function miniSlots(p,mode){return `<span class="mini-slots" aria-label="食材1・2・3枠">${p.slots.map((id,i)=>{const ing=C.ingredient(id),status=C.slotStatus(p,C.ING_LEVELS[i],mode);return `<span class="${status}" title="${i+1}枠目 ${esc(ing?.name||'未入力')}・${statusName[status]}" aria-label="${i+1}枠目 ${esc(ing?.name||'未入力')} ${statusName[status]}">${ing?.icon||'?'}${status==='locked'?'<sup>·</sup>':status==='projected'?'<sup>↗</sup>':''}</span>`;}).join('')}</span>`;}
function slotLetters(p){const sp=C.species(p.species),ids=sp?[...new Set(sp.slots.flat().map(s=>s.id))]:[];return p.slots.map(id=>{const i=ids.indexOf(id);return i>=0&&i<3?'ABC'[i]:'?';});}
function letterSlots(p,mode){return `<strong class="letter-slots" aria-label="食材並び ${slotLetters(p).join('')}">${slotLetters(p).map((letter,i)=>{const status=C.slotStatus(p,C.ING_LEVELS[i],mode);return `<span class="${status}" title="${i+1}枠目・${statusName[status]}">${letter}</span>`;}).join('')}</strong>`;}
function daily(p,mode,energy,options={}){const r=C.calc(p,mode,energy,options);return {result:r,items:r.ok?Object.entries(r.counts).filter(([,v])=>v>0):[]};}
const specifiedOrder=['Leek','Mushroom','Egg','Potato','Apple','Herb','Sausage','Milk','Honey','Oil','Ginger','Tomato','Cacao','Tail','Soybean','Corn','Coffee','Pumpkin','Avocado'];
function orderedIngredients(mode='energy'){return mode==='specified'?specifiedOrder.map(id=>C.ingredient(id)):[...D.ingredients];}
function dailyHTML(p,state,target){const {result:r,items}=daily(p,state.mode,state.energy,state);const entries=r.ok?[[target,r.counts[target]]]:[];return `<div class="compact-yield" aria-label="1日の食材別推定収集数">${r.ok?entries.map(([id,v],i)=>i===0?`<button class="target-yield" data-assign="${id}" title="${esc(C.ingredient(id).name)} ${v.toFixed(1)}個 / 24時間・担当を編集">${C.ingredient(id).icon} <b>${v.toFixed(1)}</b></button>`:`<b title="${esc(C.ingredient(id).name)} ${v.toFixed(1)}個 / 24時間">${C.ingredient(id).icon} ${v.toFixed(1)}</b>`).join(''):`<button class="target-yield" data-assign="${target}" title="${esc(r.errors.join(' / '))}">${C.ingredient(target).icon} —</button><small>${r.level>70?'将来・未計算':r.errors[0]?.includes('進化先')?'進化先を選択':'条件不足・詳細へ'}</small>`}</div>`;}
function time(seconds){const s=Math.round(seconds);return `${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function render({state,list,sort='energy'}){
 const owner=id=>state.pokemon.find(p=>p.id===state.assignments[id]?.pokemonId);
 return orderedIngredients(sort).map(ing=>{const p=owner(ing.id),a=state.assignments[ing.id],match=list.some(i=>i.id===ing.id);return `<article class="harvest-tile ${match?'':'search-muted'}" aria-label="${esc(ing.name)}の担当">${p?`<div class="compact-top">${dailyHTML(p,state,ing.id)}</div>${identity(p,state,letterSlots(p,state.mode))}${skills(p,state.mode)}`:`<button class="empty-ingredient" data-assign="${ing.id}" aria-label="${esc(ing.name)}の担当を登録">${ing.icon}</button><div class="empty-owner" aria-label="未選出・計算可能な対象個体なし"></div>`}</article>`;}).join('');


}
root.BoardView={displaySpecies,identity,evaluationSkills,orderedIngredients,render,time,nature,skills,miniSlots,slotLetters,letterSlots,daily};
})(globalThis);
