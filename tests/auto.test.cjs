const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={};vm.createContext(ctx);for(const f of ['data.js','core.js','board.js','berries.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
const C=ctx.SleepCore,D=ctx.SleepData,B=ctx.BoardView;
const p=(id,species,level=30)=>({id,species,customName:'',nickname:id,memo:'',level,slots:[],subskills:['HELPING_SPEED_S','INVENTORY_S','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L'],nature:'BASHFUL',ribbon:0,carry:null,mainSkillLevel:null});
const food=p('food','CHARIZARD');food.slots=['Sausage','Ginger','Herb'];
const faster={...food,id:'fast',nature:'BRAVE'};
const berry=p('berry','RAICHU');berry.slots=['Apple','Apple','Apple'];
const berriesFaster={...berry,id:'berry-fast',nature:'BRAVE'};
const s=C.emptyState();s.pokemon=[food,berry];const before=JSON.stringify(s);
let out=C.autoAssign(s);assert.equal(JSON.stringify(s),before);assert.equal(out.assignments.Sausage.pokemonId,'food');assert.equal(out.assignments.Ginger.pokemonId,'food');assert.equal(out.berryAssignments.GREPA.pokemonId,'berry');assert(!out.assignments.Apple);assert(!out.berryAssignments.LEPPA);
const supply=C.compare(out,{ingredients:[{id:'Sausage',amount:1}]}).find(x=>x.id==='Sausage');assert.equal(supply.quantity,C.calc(food,s.mode,s.energy,s).counts.Sausage);
assert.equal(C.calcBerry(berry,s.mode,s.energy,s,'GREPA').berryEnergy,C.calcBerry(out.pokemon.find(x=>x.id===out.berryAssignments.GREPA.pokemonId),out.mode,out.energy,out,'GREPA').berryEnergy);
out.assignments.Sausage.complete=true;out.assignments.Sausage.note='manual';out.assignments.Sausage.completedAt='2026-10-01T00:00:00Z';
let improved=C.autoAssign({...out,pokemon:[...out.pokemon,faster,berriesFaster]});assert.equal(improved.assignments.Sausage.pokemonId,'fast');assert.equal(improved.assignments.Sausage.complete,false);assert.equal(improved.assignmentHistory.Sausage.food.note,'manual');assert.equal(improved.berryAssignments.GREPA.pokemonId,'berry-fast');
const restored=C.autoAssign({...improved,pokemon:s.pokemon});assert.equal(restored.assignments.Sausage.complete,true);assert.equal(restored.assignments.Sausage.completedAt,'2026-10-01T00:00:00Z');
assert.equal(C.autoAssign({...out,pokemon:[{...food,id:'a'},food]}).assignments.Sausage.pokemonId,'food','retain previous winner on exact ties');
assert.equal(C.autoAssign({...s,pokemon:[{...food,id:'z'},{...food,id:'a'}]}).assignments.Sausage.pokemonId,'a','stable ID tie break without previous winner');
const missing={...food,id:'missing',nature:''};assert(!Object.values(C.autoAssign({...s,pokemon:[missing]}).assignments).length);
const future=C.autoAssign({...out,mode:'80'});assert.equal(Object.keys(future.assignments).length,0);assert.equal(Object.keys(future.berryAssignments).length,0);assert.equal(future.assignmentHistory.Sausage.food.complete,true);assert.equal(C.autoAssign({...future,mode:'current'}).assignments.Sausage.complete,true);
// Current winner and projected winner exchange as level 50 unlocks ingredient M.
const now={...food,id:'now',subskills:['INGREDIENT_FINDER_S','HELPING_SPEED_M','INVENTORY_S','HELPING_BONUS','INVENTORY_L']};
const later={...food,id:'later',subskills:['INVENTORY_S','HELPING_SPEED_M','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L']};
const change={...s,pokemon:[now,later]};assert.equal(C.autoAssign(change).assignments.Sausage.pokemonId,'now');assert.equal(C.autoAssign({...change,mode:'50'}).assignments.Sausage.pokemonId,'later');
const changedType=p('type','SWABLU');changedType.slots=['Egg','Egg','Egg'];const a=C.autoAssign({...s,pokemon:[changedType]});assert(a.berryAssignments.PAMTRE);const final=C.autoAssign({...a,evolution:'final'});assert(!final.berryAssignments.PAMTRE);assert(final.berryAssignments.YACHE);assert.equal(final.pokemon[0].species,'SWABLU');
for(const camp of [false,true]){const ranked=C.autoAssign({...change,camp});const winner=ranked.pokemon.find(x=>x.id===ranked.assignments.Sausage.pokemonId);assert(C.calc(winner,ranked.mode,ranked.energy,ranked).counts.Sausage===Math.max(...ranked.pokemon.map(x=>C.calc(x,ranked.mode,ranked.energy,ranked).counts.Sausage)));}
const round=C.validateState(JSON.parse(JSON.stringify(improved)));assert.equal(round.assignmentHistory.Sausage.food.note,'manual');const old=C.emptyState();delete old.assignmentHistory;delete old.berryAssignmentHistory;assert.equal(Object.keys(C.validateState(old).assignmentHistory).length,0);
const invalid=JSON.parse(JSON.stringify(improved));invalid.assignmentHistory.Sausage.ghost={pokemonId:'ghost',complete:false,note:'',completedAt:null};assert.throws(()=>C.validateState(invalid));
assert(!B.skills(food,'current','ingredient').includes('data-skill="BERRY_FINDING_S"'));for(const id of ['INGREDIENT_FINDER_S','INGREDIENT_FINDER_M','INVENTORY_S','INVENTORY_M','INVENTORY_L'])assert(!B.skills(food,'current','berry').includes('data-skill="'+id+'"'));
assert(B.skills(food,'current','berry').includes('data-skill="BERRY_FINDING_S"'));assert(B.skills(food,'current').includes('owned active'));assert(B.skills(food,'50').includes('owned projected'));assert(B.skills(food,'current').includes('owned locked'));assert(B.skills(food,'current').includes('absent'));assert.equal(C.slotStatus(food,50,'current'),'locked');assert.equal(C.slotStatus(food,50,'60'),'projected');assert.equal(C.slotStatus({...food,level:60},50,'current'),'active');
assert.equal((B.render({state:out,list:D.ingredients,layout:'compact'}).match(/<article/g)||[]).length,19);assert.equal((ctx.BerryView.render(out).match(/<article/g)||[]).length,18);
console.log('PASS automatic specialty ranking, same calculation/conditions, multiple ingredients, replacement, ties, unknowns, projected reversal, evolution berry change, camp, immutable data, manual history/backup, fixed role-specific skill states, all tiles');

const deletionBefore=JSON.stringify(improved);const deleted=C.autoAssign(C.validateState(C.removePokemon(C.removePokemon(improved,'fast'),'berry-fast')));assert.equal(JSON.stringify(improved),deletionBefore);assert.equal(deleted.assignments.Sausage.pokemonId,'food');assert.equal(deleted.assignments.Sausage.complete,true);assert.equal(deleted.berryAssignments.GREPA.pokemonId,'berry');assert(!deleted.assignmentHistory.Sausage.fast);assert(!deleted.berryAssignmentHistory.GREPA.includes('berry-fast'));C.validateState(JSON.parse(JSON.stringify(deleted)));console.log('PASS deletion removes history/condition references, recomputes both owners and preserves surviving manual records');
