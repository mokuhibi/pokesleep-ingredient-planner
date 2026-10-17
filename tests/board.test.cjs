const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={};vm.createContext(ctx);for(const file of ['data.js','core.js','board.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const C=ctx.SleepCore,D=ctx.SleepData,B=ctx.BoardView,s=C.emptyState();
const p={id:'test',species:'CHARIZARD',customName:'',nickname:'<script>test</script>',memo:'',level:60,slots:['Sausage','Ginger','Herb'],subskills:['INGREDIENT_FINDER_S','HELPING_SPEED_M','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L'],nature:'QUIET',ribbon:0,carry:null,mainSkillLevel:null};
s.pokemon=[p];s.assignments.Sausage={pokemonId:p.id,complete:true,note:'',completedAt:null};s.assignments.Ginger={pokemonId:p.id,complete:false,note:'',completedAt:null};
const options={state:s,list:D.ingredients,slotsHTML:()=>'',skillsHTML:()=>'',levelLabel:()=>''};
const before=JSON.stringify(s),compact=B.render({...options,layout:'compact'}),rich=B.render({...options,layout:'rich'});
assert.equal((compact.match(/<article/g)||[]).length,19);assert.equal((rich.match(/<article/g)||[]).length,19);assert.equal(JSON.stringify(s),before);assert(!compact.includes('<script>'));assert(B.identity(p,s).includes('&lt;script&gt;'));assert(!compact.includes('compact-secondary'));
assert(B.nature(p).includes('食<span class="nature-symbol">▲'));p.nature='BRAVE';assert(B.nature(p).includes('速<span class="nature-symbol">▲'));
assert(B.skills(p,'current').includes('·おてボ'));assert(!B.skills(p,'70').includes('↗'));assert(B.skills(p,'70').includes('おてボ'));assert(!B.skills(p,'80').includes('↗'));assert(!B.skills(p,'80').includes('所持L'));assert(B.skills(p,'80','individual').includes('所持L'));
assert.equal(B.time(3661),'1:01:01');console.log('PASS 19 tiles, unique individuals, no data mutation, escaped labels, nature directions, unlock states, time formatting');
const current=B.render({...options,layout:'compact'});assert(!current.includes('<img'));assert(!current.includes('portrait'));assert(current.includes('Lv.60'));assert(current.includes('1日'));assert(current.includes(B.ingredientCountText(C.calc(p,'current',100).counts.Sausage)));const duplicate={...p,nature:'BASHFUL',slots:['Sausage','Sausage','Sausage']};const yieldData=B.daily(duplicate,'current',100);assert.equal(yieldData.items.length,1);assert.equal(yieldData.items[0][1],C.calc(duplicate,'current',100).counts.Sausage);assert.equal(B.daily(p,'80',100).items.length,0);assert(!B.nature({...p,nature:'BASHFUL'},true).includes('食速±'));console.log('PASS text-only compact view, level, daily counts, duplicate ingredient totals, future unknown, nature abbreviations');
const visible=compact.replace(/<[^>]*>/g,'');
for(const ing of D.ingredients)assert(visible.includes(ing.name),'every ingredient name must be visible');
assert.equal((compact.match(/class="compact-row compact-identity assignment-identity"/g)||[]).length,2);
assert(compact.indexOf('compact-yield')<compact.indexOf('compact-identity'));assert(compact.indexOf('compact-identity')<compact.indexOf('mini-skills'));
assert.equal((compact.match(/class="compact-yield"/g)||[]).length,2);
assert(!visible.includes('1日'));assert(visible.includes('Lv.60'));
console.log('PASS compact row structure, icon-only ingredients, visible effective level and no redundant daily label');
for(const [slots,expected] of [[['Sausage','Sausage','Sausage'],'AAA'],[['Sausage','Sausage','Ginger'],'AAB'],[['Sausage','Ginger','Sausage'],'ABA'],[['Sausage','Sausage','Herb'],'AAC'],[['Sausage','','Herb'],'A?C']])assert.equal(B.slotLetters({...p,slots}).join(''),expected);
assert.equal(B.slotLetters({...p,species:''}).join(''),'???');
assert(B.render({...options,layout:'compact'}).includes('letter-slots'));assert(!B.render({...options}).includes('mini-slots'));
console.log('PASS species-based letters including AAC, missing slots and unknown species');

assert.equal((B.render({...options,list:[],layout:"compact"}).match(/<article/g)||[]).length,19);assert(compact.indexOf("preview-composition")<compact.indexOf("mini-nature"));
const masterBefore=JSON.stringify(D.ingredients);
assert.deepEqual(Array.from(B.orderedIngredients('energy'),x=>x.id),Array.from(D.ingredients,x=>x.id));
assert.deepEqual(Array.from(B.orderedIngredients('specified'),x=>x.id),['Leek','Mushroom','Egg','Potato','Apple','Herb','Sausage','Milk','Honey','Oil','Ginger','Tomato','Cacao','Tail','Soybean','Corn','Coffee','Pumpkin','Avocado']);
assert.equal(JSON.stringify(D.ingredients),masterBefore);
const sorted=B.render({...options,layout:'compact',sort:'specified'});assert(sorted.indexOf('ふといながねぎの担当')<sorted.indexOf('とくせんリンゴの担当'));assert(!sorted.includes('ingredient-marker'));assert(!sorted.includes('<small>✓</small>'));
console.log('PASS specified order, unchanged default/master, no compact selection-status markers');

const ownTotals=B.render({...options,layout:'compact'}).match(/<div class="compact-yield"[^>]*>(.*?)<\/div>/g);assert.equal(ownTotals.length,2);assert(ownTotals[0].includes(B.ingredientCountText(C.calc(p,'current',100).counts.Sausage)));assert(!ownTotals[0].includes(B.ingredientCountText(C.calc(p,'current',100).counts.Ginger)));assert(ownTotals[1].includes(B.ingredientCountText(C.calc(p,'current',100).counts.Ginger)));assert(!ownTotals[1].includes(B.ingredientCountText(C.calc(p,'current',100).counts.Sausage)));assert(!B.render({...options,state:{...s,evolution:'final'},layout:'compact'}).includes('assumed-form'));
console.log('PASS target-only totals, no additional final species label, projected skills retain status without arrows');

// Compare the same coordinates across different ownership, levels and missing information.
const skillOrder=html=>Array.from(html.matchAll(/data-skill="([^"]+)"/g),m=>m[1]);
const fullSkills=B.skills(p,'current'),unknownSkills=B.skills({...p,subskills:['','','','','']},'70');
assert.deepEqual(skillOrder(fullSkills),skillOrder(unknownSkills));assert.equal(skillOrder(fullSkills).length,5);
assert(fullSkills.includes('rarity-gold owned locked'));assert(fullSkills.includes('rarity-silver owned active'));assert(fullSkills.includes('rarity-white owned active'));
assert(fullSkills.includes('未所持'));assert(!unknownSkills.includes('未所持'));assert(unknownSkills.includes('未確認'));
assert(B.skills(p,'70').includes('rarity-gold owned projected'));assert(B.nature({...p,nature:'BASHFUL'},true).includes('class="mini-nature"'));
const pre={...p,species:'CHARMANDER',nickname:'そのまま',slots:['Sausage','Ginger','Herb']},preBefore=JSON.stringify(pre);
assert.equal(B.displaySpecies(pre,{evolution:'current'}),'ヒトカゲ');assert.equal(B.displaySpecies(pre,{evolution:'final',finalForms:{}}),'リザードン');
const evolved=B.identity(pre,{mode:'70',evolution:'final',finalForms:{}});assert(evolved.includes('リザードン'));assert(evolved.includes('そのまま'));assert.equal(JSON.stringify(pre),preBefore);
assert.equal(B.displaySpecies({...pre,species:'EEVEE'},{evolution:'final',finalForms:{}}),'進化先未選択');
console.log('PASS fixed rarity/ownership coordinates, unknown distinct from absent, projected badges, neutral nature slot, evolved display and unchanged nickname/data');

assert.deepEqual(skillOrder(fullSkills),['INGREDIENT_FINDER_M','INGREDIENT_FINDER_S','HELPING_BONUS','HELPING_SPEED_M','HELPING_SPEED_S']);
assert.equal((fullSkills.match(/class="skill-row /g)||[]).length,2);
assert(evolved.indexOf('mini-person-name')<evolved.indexOf('card-level'));assert(evolved.indexOf('card-level')<evolved.indexOf('mini-nature'));assert(evolved.includes('Lv.70'));
assert(B.nature({...p,nature:'BRAVE'},true).includes('class="up"'));
console.log('PASS target-first layout, shared name/level/nature coordinates, exact grouped skill order');

assert(B.nature({...p,nature:'BASHFUL'},true).includes('―'));assert(B.nature({...p,nature:''},true).includes('性格未入力'));

const sortSnapshot=JSON.stringify(s),masterSnapshot=JSON.stringify(D.ingredients);
assert.equal(B.targetList('ingredient',s,{filter:'assigned'}).length,2);assert.equal(B.targetList('ingredient',s,{filter:'empty'}).length,17);
assert.deepEqual(Array.from(B.targetList('ingredient',s,{by:'energy',direction:'desc'}),x=>x.id),Array.from(D.ingredients,x=>x.id).reverse());
assert.equal((B.render({...options,items:B.targetList('ingredient',s,{filter:'assigned'})}).match(/<article/g)||[]).length,2);
assert.equal(JSON.stringify(s),sortSnapshot);assert.equal(JSON.stringify(D.ingredients),masterSnapshot);
console.log('PASS actual assignment filters, adopted energy order/reverse, no mutation');

// Switching away from energy, filtering and reselecting owners must preserve the specified ID order.
const defaultIDs=['Leek','Mushroom','Egg','Potato','Apple','Herb','Sausage','Milk','Honey','Oil','Ginger','Tomato','Cacao','Tail','Soybean','Corn','Coffee','Pumpkin','Avocado'];
const ids=opts=>Array.from(B.targetList('ingredient',s,opts),x=>x.id);
for(const direction of ['asc','desc']){
 const expected=direction==='asc'?defaultIDs:[...defaultIDs].reverse();
 ids({by:'energy',direction});
 assert.deepEqual(ids({by:'default',direction}),expected);
 assert.deepEqual(ids({by:'default',direction,filter:'assigned'}),expected.filter(id=>['Sausage','Ginger'].includes(id)));
 assert.deepEqual(ids({by:'default',direction,filter:'empty'}),expected.filter(id=>!['Sausage','Ginger'].includes(id)));
 const selected=B.targetList('ingredient',s,{by:'default',direction});
 const rendered=B.render({state:s,items:selected});
 assert.deepEqual(Array.from(rendered.matchAll(/<article[^>]*aria-label="([^"]+)の担当"/g),m=>m[1]),Array.from(selected,x=>x.name));
 const reassigned=C.autoAssign(s);
 assert.deepEqual(Array.from(B.targetList('ingredient',reassigned,{by:'default',direction}),x=>x.id),expected);
}
assert.equal(JSON.stringify(s),sortSnapshot);assert.equal(JSON.stringify(D.ingredients),masterSnapshot);
console.log('PASS specified default order, energy round trip, both directions/filters, common rendered order, automatic reassignment and unchanged masters');


assert(compact.includes('食材並び ABC'));assert(compact.includes('letter-slots'));
assert(B.miniSlots({...p,slots:['Sausage','Sausage','Herb']},'current',false).includes('🥩'));assert(!B.miniSlots(p,'70',false).includes('<sup>'));
assert(B.nature({...p,nature:'QUIET'},true,'berry').includes('―'));assert(!B.nature({...p,nature:'QUIET'},true,'berry').includes('食<span class="nature-symbol">▲'));assert(B.nature({...p,nature:'BRAVE'},true,'berry').includes('速<span class="nature-symbol">▲'));
console.log('PASS actual slot icons without letters/markers, target-only yield, berry-only speed nature and neutral frame');

const foongus={...p,species:'FOONGUS',nickname:'そのまま',slots:['Mushroom','Egg','Tomato']},unchangedFoongus=JSON.stringify(foongus);
assert.equal(B.displaySpecies(foongus,{evolution:'current'}),'タマゲタケ');assert.equal(B.displaySpecies(foongus,{evolution:'final'}),'モロバレル');assert(B.identity(foongus,{mode:'60',evolution:'final'}).includes('そのまま'));assert.equal(JSON.stringify(foongus),unchangedFoongus);
console.log('PASS Foongus final display with unchanged nickname and registered species');
for(const ribbon of [null,0]){const html=B.sleepRibbon({...p,ribbon});assert(html.includes('<span>―</span>'));assert(!html.includes('<span>?</span>'));}
assert(B.sleepRibbon({...p,ribbon:null}).includes('おやすみリボン：未入力'));assert(B.sleepRibbon({...p,ribbon:4}).includes('2,000'));console.log('PASS ribbon missing/none share the dash while underlying stage and accessible description stay distinct');

assert.equal(B.ingredientCountText(42.8),'42');assert.equal(B.ingredientCountText(18.2),'18');assert.equal(B.ingredientCountText(100.9),'100');assert.equal(B.ingredientCountText(0.9),'0');
let pair;for(let level=1;level<69;level++){const a={...p,id:'higher',level:level+1},b={...p,id:'lower',level};const av=C.calc(a,'current',100).counts.Sausage,bv=C.calc(b,'current',100).counts.Sausage;if(av>bv&&Math.floor(av)===Math.floor(bv)){pair={a,b,av,bv};break;}}assert(pair,'fixture with same integer display and distinct raw production');const rank=C.emptyState();rank.pokemon=[pair.b,pair.a];assert.equal(C.autoAssign(rank).assignments.Sausage.pokemonId,'higher');assert.equal(B.daily(pair.a,'current',100).items.find(([id])=>id==='Sausage')[1],pair.av);console.log('PASS floor-only ingredient text, same displayed integers retain precise ranking and calculation');

// Projected badges use the shared dashed state, with no visible marker.
for(const purpose of ['ingredient','berry']){const html=B.skills({...p,level:25,subskills:['INGREDIENT_FINDER_S','INVENTORY_S','HELPING_SPEED_M','HELPING_BONUS','INVENTORY_L']},'60',purpose);assert(html.includes('owned projected'));assert(!html.includes('<sup>試</sup>'));}
for(const [raw,text] of [[42.8,'42'],[18.2,'18'],[100.9,'100'],[0.9,'0'],[-0.2,'-1']])assert.equal(B.ingredientCountText(raw),text);
const appSource=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
for(const expression of ['x.quantity','x.diff','r.counts[ing.id]','a.counts[id]','r.counts[i.id]']){assert(appSource.includes('BoardView.ingredientCountText('+expression+')'));assert(!appSource.includes('num('+expression+')'));}
console.log('PASS projected marker removed and ingredient integer display shared across cards, cooking and details');

// Presentation preserves actual slot IDs, ribbon location and all four skill states.
assert.equal((B.composition({...p,slots:['Sausage','Sausage','Herb']},'60','Sausage').match(/composition-target/g)||[]).length,2);
assert.equal((B.composition({...p,slots:['Sausage','Sausage','Herb']},'60','Herb').match(/composition-target/g)||[]).length,1);
for(const ribbon of [null,0])assert(!B.identity({...p,ribbon},s,'ingredient',null,true).includes('sleep-ribbon'));
const ribbonCard=B.identity({...p,ribbon:4},s,'ingredient',null,true);assert(ribbonCard.includes('🎗2,000'));assert(ribbonCard.indexOf('card-level')<ribbonCard.indexOf('sleep-ribbon'));assert(!ribbonCard.includes('compact-secondary'));
assert(!compact.includes('empty-owner'));assert.equal((compact.match(/ingredient-watermark/g)||[]).length,19);assert(!B.skills(p,'60').includes('INVENTORY_'));assert(B.skills(p,'60').includes('スピM'));
console.log('PASS note cards: actual target composition, Lv ribbon, no nickname supplements, inventory retained in individual skills, all empty headings retained');

// The share alias follows the size-specific master ID and preserves its formal label.
for(const [id,size] of [['GOURGEIST_SMALL','こだま'],['GOURGEIST_MEDIUM','ちゅうだま'],['GOURGEIST_LARGE','おおだま'],['GOURGEIST_JUMBO','ギガだま']]){const formal=C.species(id).name,html=B.shareNameHTML(formal);assert(html.includes('>'+size+'</span>'));assert(html.includes('aria-label="'+formal+'"'));assert.equal(C.species(id).name,formal);}
assert.equal(B.shareNameHTML('リザードン'),'リザードン');assert.equal(B.shareNameHTML('<script>'),'&lt;script&gt;');assert(!B.identity({...p,species:'GOURGEIST_SMALL'},s).includes('こだま'));console.log('PASS share-only size aliases, formal master names unchanged, escaping and ordinary names preserved');

for(const nature of D.natures)for(const purpose of ['ingredient','berry']){const html=B.nature({...p,nature:nature.id},true,purpose),text=html.replace(/<[^>]*>/g,'');assert(!/[↑↓]/.test(text));for(const [key,label] of purpose==='berry'?[['speed','速']]:[['ingredient','食'],['speed','速']]){if(nature.positiveModifier===key)assert(text.includes(label+'▲'));if(nature.negativeModifier===key)assert(text.includes(label+'▼'));}if(purpose==='berry')assert(!text.includes('食'));}
console.log('PASS all nature labels: red/up and blue/down symbol hooks, no arrows, berry filtering and neutral state preserved');
