const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../data.js');require('../core.js');require('../board.js');require('../berries.js');
const C=SleepCore,D=SleepData;
const make=(changes={})=>({id:'berry-test',species:'CHARIZARD',nickname:'',customName:'',memo:'',level:60,slots:['Sausage','Ginger','Herb'],nature:'BASHFUL',subskills:['INGREDIENT_FINDER_S','HELPING_SPEED_M','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L'],ribbon:0,carry:null,mainSkillLevel:null,...changes});
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-9);
assert.equal(D.berries.length,18);assert.equal(new Set(D.berries.map(x=>x.id)).size,18);
for(const b of D.berries){assert(b.value>0);assert(fs.existsSync(path.join(__dirname,'..',b.icon)));}
for(const p of D.pokemon)assert(C.berry(p.berry));
for(const [id,level,power] of [['ORAN',1,31],['ORAN',10,40],['ORAN',30,63],['ORAN',50,104],['ORAN',60,133],['ORAN',70,170],['LEPPA',60,116],['LEPPA',70,148]])assert.equal(C.berryPower(id,level),power);
const p=make(),before=JSON.stringify(p),r=C.calcBerry(p,'current',100,{},'LEPPA');
assert(r.ok);assert.equal(r.perDrop,1);assert.equal(r.power,116);
const interval=Math.floor(Math.round(.86*.882*10000)/10000*2400)*.45;
near(r.berryEnergy,86400/interval*(1-.224*1.54)*116);
assert.equal(JSON.stringify(p),before);
const berryMon=make({species:'RAICHU',slots:['Apple','Apple','Apple'],subskills:['BERRY_FINDING_S','HELPING_SPEED_M','INVENTORY_S','HELPING_BONUS','INVENTORY_L']});
assert.equal(C.calcBerry(berryMon,'current',100).perDrop,3);
assert.equal(C.calcBerry({...berryMon,subskills:['INVENTORY_S','HELPING_SPEED_M','BERRY_FINDING_S','HELPING_BONUS','INVENTORY_L'],level:49},'current',100).perDrop,2);
assert.equal(C.calcBerry({...berryMon,subskills:['INVENTORY_S','HELPING_SPEED_M','BERRY_FINDING_S','HELPING_BONUS','INVENTORY_L'],level:49},'50',100).perDrop,3);
assert(C.calcBerry({...p,slots:['','','']},'current',100).ok);
assert(!C.calc({...p,slots:['','','']},'current',100).ok);
for(const missing of [{nature:''},{subskills:['','','','','']},{species:''}])assert(!C.calcBerry({...p,...missing},'current',100).ok);
assert(!C.calcBerry(p,'80',100).ok);assert.equal(C.calcBerry(p,'80',100).berryEnergy,undefined);
const evolved=make({species:'CHARMANDER'});assert.equal(C.calcBerry(evolved,'current',100,{evolution:'final'}).calculationSpecies,'CHARIZARD');
assert.equal(evolved.species,'CHARMANDER');assert(C.calcBerry(evolved,'current',100,{camp:true}).berryEnergy>C.calcBerry(evolved,'current',100).berryEnergy);
const eevee=make({species:'EEVEE',slots:['Milk','Milk','Milk']});
assert(!C.calcBerry(eevee,'current',100,{evolution:'final'}).ok);
assert(!C.calcBerry(eevee,'current',100,{evolution:'final',finalForms:{[eevee.id]:'FLAREON'}},'PERSIM').ok);
assert(C.calcBerry(eevee,'current',100,{evolution:'final',finalForms:{[eevee.id]:'FLAREON'}},'LEPPA').ok);
const s=C.emptyState();s.pokemon=[p];s.berryAssignments.LEPPA={pokemonId:p.id};s.assignments.Sausage={pokemonId:p.id,complete:true,note:'',completedAt:null};
assert.deepEqual(C.validateState(JSON.parse(JSON.stringify(s))),s);
const old=JSON.parse(JSON.stringify(s));delete old.berryAssignments;assert.deepEqual(C.validateState(old).berryAssignments,{});assert.deepEqual(C.validateState(old).pokemon,s.pokemon);assert.deepEqual(C.validateState(old).assignments,s.assignments);
for(const broken of [null,[],{BAD:{pokemonId:p.id}},{LEPPA:{pokemonId:'missing'}}])assert.throws(()=>C.validateState({...s,berryAssignments:broken}));
const snapshot=JSON.stringify(s),html=BerryView.render(s);assert.equal((html.match(/<article/g)||[]).length,18);assert(html.includes(Math.round(r.berryEnergy).toLocaleString('ja-JP')));assert.equal(JSON.stringify(s),snapshot);
assert(!BerryView.render({...s,pokemon:[{...p,nickname:'<script>x</script>'}]}).includes('<script>'));
assert(BerryView.render({...s,mode:'80'}).includes('将来・未計算'));
console.log('PASS berries: 18 masters/assets/247 mappings, independent energy reference, berry specialty and BFS unlock, missing inputs, 80 unknown, final form and berry change, camp, immutable individuals, old/new backups, invalid refs, compact cards and escaping');

for(const b of D.berries){assert(BerryView.typeNames[b.type]);assert(html.includes(BerryView.typeNames[b.type]));assert(html.includes(b.name));}
const skills=BoardView.skills(p,'current','berry');assert.deepEqual(Array.from(skills.matchAll(/data-skill="([^"]+)"/g),m=>m[1]),['BERRY_FINDING_S','HELPING_BONUS','HELPING_SPEED_M','HELPING_SPEED_S']);assert.equal((skills.match(/class="skill-row /g)||[]).length,2);
console.log('PASS all adopted berry types localized, berry name and energy, exact two-row skill matrix');

const energyAsc=BoardView.targetList('berry',s,{by:'energy'});for(let i=1;i<energyAsc.length;i++)assert(energyAsc[i-1].value<=energyAsc[i].value);
assert.deepEqual(BoardView.targetList('berry',s,{by:'energy',direction:'desc'}).map(x=>x.id),energyAsc.map(x=>x.id).reverse());
assert.equal(BoardView.targetList('berry',s,{filter:'assigned'}).length,1);assert.equal(BoardView.targetList('berry',s,{filter:'empty'}).length,D.berries.length-1);
assert.equal((BerryView.render(s,{filter:'assigned'}).match(/<article/g)||[]).length,1);
for(const b of D.berries)assert(html.includes('type-'+b.type));
console.log('PASS base-energy sorting with stable ties, berry filters and shared type classes');

const noFoodNature=BerryView.render({...s,pokemon:[{...p,nature:'QUIET'}]});assert(!noFoodNature.includes('食↑'));assert(noFoodNature.includes('―'));
