/* Compact berry assignments. Shared individuals, normal-help model and card styles. */
(function(root){
'use strict';
const D=root.SleepData,C=root.SleepCore,B=root.BoardView;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=p=>p.nickname||C.species(p.species)?.name||p.customName||'未入力';
function render(state){return D.berries.map(b=>{
 const p=state.pokemon.find(p=>p.id===state.berryAssignments[b.id]?.pokemonId),r=p?C.calcBerry(p,state.mode,state.energy,state,b.id):null;
 const reason=r&&!r.ok?r.errors.join(' / '):'',value=r?.ok?Math.round(r.berryEnergy).toLocaleString('ja-JP'):'—';
 return `<article class="harvest-tile berry-tile" aria-label="${esc(b.name)}の担当"><button class="berry-yield" data-berry-assign="${b.id}" title="${esc(r?.ok?`${b.name} ${value}エナジー / 24時間・担当を編集`:reason||'担当を選ぶ')}"><img src="${b.icon}" width="28" height="28" alt="${esc(b.name)}"><b>${value}</b><span>${esc(b.name)}</span></button>${p?`<div class="compact-row compact-identity"><span class="compact-name-nature"><button class="mini-person" data-detail="${esc(p.id)}"><span class="mini-person-name">${esc(name(p))}</span></button>${B.nature(p,true)}</span><span class="berry-level">Lv.${C.effectiveLevel(p,state.mode)}</span></div>${B.skills(p,state.mode)}${reason?`<small class="berry-error" title="${esc(reason)}">${esc(r.level>D.meta.calcCap?'将来・未計算':reason)}</small>`:''}`:'<span class="berry-empty">担当未登録・タップで選択</span>'}</article>`;
 }).join('');}
root.BerryView={render};
})(globalThis);
