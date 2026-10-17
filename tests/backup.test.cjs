const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../data.js');require('../core.js');require('../backup.js');
const C=SleepCore,B=SleepBackup,D=SleepData,copy=x=>JSON.parse(JSON.stringify(x));
const p={id:'csv-one',species:'CHARIZARD',customName:'',nickname:'日本語,「ねむり」"\r\n二行目🎗',memo:'=SUM(1,2)\n空欄と"引用"\tタブ',level:30,slots:['Sausage','Ginger','Herb'],nature:'BASHFUL',subskills:['HELPING_SPEED_S','INVENTORY_S','INGREDIENT_FINDER_M','HELPING_BONUS','INVENTORY_L'],ribbon:4,carry:31,mainSkillLevel:6};
let state=C.autoAssign({...C.emptyState(),pokemon:[p,{...p,id:'csv-two',nickname:'',slots:['Sausage','',''],subskills:['','','','',''],ribbon:null,carry:null,mainSkillLevel:null,memo:''},{...p,id:'csv-berry',species:'RAICHU',slots:['Apple','Apple','Apple']}],mode:'60',evolution:'auto',camp:true,energy:70,typeFilters:['fire','electric'],mapDisplay:'both'});
state.manualAssignments={ingredient:{Sausage:p.id},berry:{GREPA:'csv-berry'}};
state.assignments.Sausage={pokemonId:p.id,complete:true,note:'完了,"確認"\nメモ',completedAt:'2026-10-17T00:00:00Z'};
state.assignmentHistory.Sausage={[p.id]:copy(state.assignments.Sausage)};
state.berryAssignmentHistory.GREPA=['csv-berry'];state.finalForms={[p.id]:'CHARIZARD'};
state=C.validateState(state);
const name=p=>D.pokemon.find(x=>x.id===p.species)?.name||p.customName;
const bundle={...state,exportMeta:{exportedAt:'2026-10-17T00:00:00Z',dataVersion:D.meta.version,calcVersion:D.meta.calcVersion}};
const before=JSON.stringify(state),csv=B.encode(bundle,name),decoded=B.decode(csv);
assert(csv.startsWith('\uFEFF'));assert(csv.includes('リザードン'));assert(csv.includes('\r\n'));
assert.deepEqual(copy(decoded),bundle);assert.deepEqual(C.validateState(decoded),state);assert.equal(JSON.stringify(state),before);
assert.deepEqual(C.validateState(B.decode(JSON.stringify(bundle))),state);
assert.deepEqual(C.validateState(B.decode('\uFEFF'+JSON.stringify(bundle))),state);
assert.deepEqual(C.validateState(B.decode(B.encode(C.emptyState(),name))),C.emptyState());
const legacy=copy(state);for(const k of ['manualAssignments','typeFilters','mapDisplay','evolution','camp','finalForms'])delete legacy[k];
assert.deepEqual(C.validateState(B.decode(JSON.stringify(legacy))),C.validateState(legacy));
// CSV record boundaries, quoted commas/newlines, unsupported versions, duplicates,
// truncation, invalid JSON and invalid game references must fail before any write.
for(const invalid of [csv.slice(0,-35),csv.replace('"完了"','"不明"'),csv.replace('"nemuri-selection-notebook","1"','"nemuri-selection-notebook","2"'),csv.replace('"設定"','"未知"'),csv.replace('"個体数","3"','"個体数","4"'),csv.replace('"schemaVersion","1"','"schemaVersion","bad"'),csv+'"extra"',csv.replace('"区分"','"別形式"'),csv.replace('"版",','"版"x,'),csv.replace('"設定","","schemaVersion","1"','"設定","","schemaVersion","1"\r\n"nemuri-selection-notebook","1","設定","","schemaVersion","1"')])assert.throws(()=>C.validateState(B.decode(invalid)));
for(const invalid of [{...copy(state),pokemon:[p,p]},{...copy(state),pokemon:[{...p,species:'NOT_A_SPECIES'}]},{...copy(state),assignments:{Sausage:{pokemonId:'missing',complete:false,note:'',completedAt:null}}}])assert.throws(()=>C.validateState(B.decode(B.encode(invalid,name))));
// Different individuals of the same species retain their identities and exact
// calculation/ranking results through the transport.
const round=C.validateState(decoded);
assert.deepEqual(copy(C.autoAssign(round)),copy(C.autoAssign(state)));
for(const target of D.ingredients.map(x=>x.id))assert.deepEqual(copy(C.assignmentCandidates('ingredient',target,round)),copy(C.assignmentCandidates('ingredient',target,state)));
for(const target of D.berries.map(x=>x.id))assert.deepEqual(copy(C.assignmentCandidates('berry',target,round)),copy(C.assignmentCandidates('berry',target,state)));
const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/pages.yml'),'utf8');assert(workflow.includes('app.js backup.js'));assert(workflow.includes('tests/backup.test.cjs'));
console.log('PASS CSV exact round trip, all state/history/settings/IDs, same species, Japanese/emoji/quotes/commas/newlines/null/empty, legacy JSON, malformed input, and unchanged calculations/rankings');
