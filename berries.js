/* Compact berry assignments. Shared individuals, normal-help model and card styles. */
(function(root){
'use strict';
const D=root.SleepData,C=root.SleepCore,B=root.BoardView;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typeNames={normal:'ノーマル',fire:'ほのお',water:'みず',electric:'でんき',grass:'くさ',ice:'こおり',fighting:'かくとう',poison:'どく',ground:'じめん',flying:'ひこう',psychic:'エスパー',bug:'むし',rock:'いわ',ghost:'ゴースト',dragon:'ドラゴン',dark:'あく',steel:'はがね',fairy:'フェアリー'};
function render(state,options={}){return (options.items||B.targetList('berry',state,options)).map(b=>{
 const p=state.pokemon.find(p=>p.id===state.berryAssignments[b.id]?.pokemonId),r=p?C.calcBerry(p,state.mode,state.energy,state,b.id):null;
 const reason=r&&!r.ok?r.errors.join(' / '):'',value=r?.ok?Math.round(r.berryEnergy).toLocaleString('ja-JP'):'—';
 return `<article class="harvest-tile berry-tile type-${esc(b.type)} ${p?'assigned':'unassigned'}" aria-label="${esc(b.name)}の担当"><button class="berry-yield" data-berry-assign="${b.id}" title="${esc(r?.ok?`${b.name} ${value}エナジー / 24時間・担当を編集`:reason||'担当を選ぶ')}"><span class="berry-name">${esc(b.name)}</span><span class="berry-type" title="${esc(b.type)}タイプ">${esc(typeNames[b.type]||'未確認')}</span><b>${value}</b></button>${p?`${B.identity(p,state,'berry')}${B.skills(p,state.mode,'berry')}${reason?`<small class="berry-error" title="${esc(reason)}">${esc(r.level>D.meta.calcCap?'将来・未計算':reason)}</small>`:''}`:'<span class="berry-empty">未選出・タップで個体を確認</span>'}</article>`;
 }).join('');}
root.BerryView={render,typeNames};
})(globalThis);
