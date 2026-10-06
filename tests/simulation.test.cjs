const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={};vm.createContext(ctx);for(const f of ['data.js','core.js','board.js','berries.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
const C=ctx.SleepCore,D=ctx.SleepData,B=ctx.BoardView;
const chansey={id:'sample',species:'CHANSEY',customName:'',nickname:'sample',level:60,slots:['Egg','Potato','Honey'],nature:'BASHFUL',subskills:['INGREDIENT_FINDER_S','HELPING_SPEED_M','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L'],ribbon:0,carry:null,mainSkillLevel:null,memo:''};
const near=(a,b)=>assert(Math.abs(a-b)<1e-9);
for(const stage of [0,1,2,3,4])for(const camp of [false,true])for(const mode of ['current','70']){
 const p={...chansey,ribbon:stage},before=JSON.stringify(p),options={camp,evolution:'auto'};
 for(const target of p.slots){const current=C.calc(p,mode,100,{camp,evolution:'current'}),final=C.calc(p,mode,100,{camp,evolution:'final'}),auto=C.calc(p,mode,100,options,target);assert(auto.ok);near(auto.counts[target],Math.max(current.counts[target],final.counts[target]));assert.equal(auto.calculationSpecies,current.counts[target]>=final.counts[target]?'CHANSEY':'BLISSEY');assert(B.identity(p,{...options,mode},'ingredient',auto).includes(C.species(auto.calculationSpecies).name));}
 assert.equal(JSON.stringify(p),before);
}
assert.equal(C.calc(chansey,'current',100,{evolution:'auto'},'Egg').calculationSpecies,'BLISSEY');
assert.equal(C.calc({...chansey,ribbon:4},'current',100,{evolution:'auto'},'Egg').calculationSpecies,'CHANSEY');
// Independent original ribbon arithmetic: data extraction must not change existing results.
for(const id of ['CHARMANDER','CHARMELEON','CHARIZARD'])for(const stage of [0,1,2,3,4]){const n=C.species(id).remainingEvolutions;let old=1;if(stage>=2)old-=n===2?.11:n===1?.05:0;if(stage>=4)old-=n===2?.14:n===1?.07:0;near(D.ribbons[stage].frequencyByRemainingEvolutions[n],old);}
const state=C.emptyState();state.pokemon=[{...chansey,ribbon:4}];state.evolution='auto';let ranked=C.autoAssign(state);for(const target of chansey.slots){assert.equal(ranked.assignments[target].pokemonId,'sample');const r=C.calc(ranked.pokemon[0],ranked.mode,ranked.energy,ranked,target);near(C.compare(ranked,{ingredients:[{id:target,amount:1}]} )[0].quantity,r.counts[target]);}
assert.deepEqual(JSON.parse(JSON.stringify(C.validateState(JSON.parse(JSON.stringify(ranked))))),JSON.parse(JSON.stringify(ranked)));
const missing={...chansey,ribbon:null};assert.equal(C.calc(missing,'current',100,{evolution:'auto'},'Egg').ok,false);assert.equal(C.calc(chansey,'80',100,{evolution:'auto'},'Egg').ok,false);
const berry={...chansey,id:'berry',species:'ONIX',slots:['Tomato','Sausage','Potato'],subskills:['BERRY_FINDING_S','HELPING_SPEED_M','HELPING_SPEED_S','HELPING_BONUS','INVENTORY_L'],ribbon:4};
for(const b of D.berries){const a=C.calcBerry(berry,'60',100,{evolution:'auto'},b.id),rows=['current','final'].map(evolution=>C.calcBerry(berry,'60',100,{evolution},b.id)).filter(r=>r.ok);assert.equal(a.ok,rows.length>0);if(a.ok)near(a.berryEnergy,Math.max(...rows.map(r=>r.berryEnergy)));}
ranked=C.autoAssign({...state,pokemon:[berry]});for(const [id,a] of Object.entries(ranked.berryAssignments)){const r=C.calcBerry(berry,ranked.mode,ranked.energy,ranked,id);assert(r.ok);const standard=ctx.BerryView.render(ranked,{items:[C.berry(id)]}),map=ctx.BerryView.render(ranked,{items:[C.berry(id)]});assert.equal(standard,map);assert(standard.includes(C.species(r.calculationSpecies).name));}
for(const map of D.maps){assert.equal(map.dynamic,map.berries.length===0);for(const id of map.berries)assert(C.berry(id));if(!map.dynamic)assert.equal(map.berries.length,3);}
assert.equal(ctx.BerryView.render(C.emptyState(),{items:D.maps.find(m=>m.id==='cyan').berries.map(C.berry)}).match(/<article/g).length,3);
const branch={...berry,species:'EEVEE'};assert.equal(C.calcBerry(branch,'60',100,{evolution:'auto'}).ok,false);
console.log('PASS auto form comparison by target, ribbon reversal, all stages/camp/levels, ranking/cooking/maps/display consistency, missing data/branches, immutable records and backup compatibility');

// Independent Chansey/Blissey 2000-hour trace: source base stats and ribbon
// coefficient must reach the final interval, counts and berry energy.
const ribbonChansey={...chansey,ribbon:4};
for(const [evolution,id,frequency,rate,ribbon,baseInterval] of [['current','CHANSEY',3300,.236,.88,2202],['final','BLISSEY',3100,.238,1,2351]]){
 const sp=C.species(id),r=C.calc(ribbonChansey,'60',100,{evolution},'Egg'),b=C.calcBerry(ribbonChansey,'60',100,{evolution});
 assert.equal(sp.frequency,frequency);near(sp.ingredientRate,rate);near(D.ribbons[4].frequencyByRemainingEvolutions[sp.remainingEvolutions],ribbon);
 assert.equal(r.baseInterval,baseInterval);near(r.interval,baseInterval*.45);near(r.helps,86400/(baseInterval*.45));near(r.rate,rate*1.54);
 near(r.counts.Egg,r.helps*r.rate*2/3);near(b.berryEnergy,r.helps*(1-r.rate)*C.berryPower(b.berryId,60));
}
for(const stage of [0,4]){const p={...chansey,ribbon:stage},rows=['current','final'].map(evolution=>C.calcBerry(p,'60',100,{evolution})),best=C.calcBerry(p,'60',100,{evolution:'auto'});near(best.berryEnergy,Math.max(...rows.map(r=>r.berryEnergy)));assert.equal(best.calculationSpecies,stage===4?'CHANSEY':'BLISSEY');}
const originalRecord=JSON.stringify(ribbonChansey);const chosen=C.calc(ribbonChansey,'60',100,{evolution:'auto'},'Egg');
assert(B.render({state:C.autoAssign({...state,pokemon:[ribbonChansey]}),list:D.ingredients,items:[C.ingredient('Egg')]}).includes('ラッキー'));
assert.equal(JSON.stringify(ribbonChansey),originalRecord);assert(chosen.counts.Egg>21&&chosen.counts.Egg<22);
console.log('PASS independent 2000-hour Chansey/Blissey performance trace, both metrics, shared card/ranking result and immutable record');
