const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
require('../data.js');require('../core.js');require('../board.js');require('../berries.js');
const pngs=dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.png'));
assert.equal(pngs('assets/pokemon').length,0);
assert.equal(pngs('assets/berries').length,0);
assert(!read('board.js').includes('assets/pokemon/'));
const state=SleepCore.emptyState();
const p={id:'source-test',species:'RAICHU',nickname:'',customName:'',memo:'',level:60,slots:['Apple','Apple','Apple'],nature:'BASHFUL',subskills:['BERRY_FINDING_S','HELPING_SPEED_M','HELPING_SPEED_S','HELPING_BONUS','INVENTORY_L'],ribbon:0,carry:null,mainSkillLevel:null};
state.pokemon=[p];state.berryAssignments.GREPA={pokemonId:p.id};
const rendered=BerryView.render(state);
assert(rendered.includes('ライチュウ'));assert(!rendered.includes('<img'));
assert(read('.github/workflows/pages.yml').includes('cp DATA_SOURCES.md _site/'));
assert(read('.github/workflows/pages.yml').includes("find assets/pokemon assets/berries"));
for(const file of ['data.js','core.js','README.md','app.js','AGENTS.md'])assert(read(file).includes('DATA_SOURCES.md'));
assert(read('licenses/NOTICE.txt').startsWith("Neroli's Lab\nCopyright The Neroli's Lab Authors"));
assert(read('licenses/PokeAPI-BSD-3-Clause.txt').includes('Redistribution and use'));
for(const id of ['FOONGUS','AMOONGUSS']){const sp=SleepCore.species(id);assert.equal(sp.sourceId,'raenonx-20261005');assert.equal(sp.carry,null);}
console.log('PASS source registry/credits published, unused game images excluded, image-free cards, separate source identities and unknown carry retained');
