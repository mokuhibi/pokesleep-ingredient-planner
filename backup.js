(function(root){
'use strict';
// CSV transport only. State validation and all calculations remain in SleepCore.
const FORMAT='nemuri-selection-notebook',VERSION='1';
const HEADER=['バックアップ形式','版','区分','個体番号','項目','値(JSON)'];
const fail=()=>{throw new Error('CSVバックアップの形式・内容が不正、またはファイルが不完全です');};
const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';
function encode(bundle,speciesName=()=> ''){
 if(!bundle||!Array.isArray(bundle.pokemon))fail();
 const rows=[HEADER];
 const add=(kind,index,field,value)=>rows.push([FORMAT,VERSION,kind,String(index),field,JSON.stringify(value)]);
 add('情報','','個体数',bundle.pokemon.length);
 for(const [field,value] of Object.entries(bundle))if(field!=='pokemon')add('設定','',field,value);
 bundle.pokemon.forEach((p,index)=>{
  add('表示',index,'ポケモン名',speciesName(p));
  for(const [field,value] of Object.entries(p))add('個体',index,field,value);
 });
 add('完了','','行数',rows.length-1);
 // BOM for Japanese spreadsheet compatibility; quoted JSON cells also keep
 // strings, null, numbers and arrays distinct without spreadsheet formulas.
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
function parseCSV(text){
 const rows=[];let row=[],value='',quoted=false,closed=false;
 const field=()=>{row.push(value);value='';closed=false;};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
  if(c===',' ){field();continue;}
  if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;field();rows.push(row);row=[];continue;}
  if(closed)fail();
  if(c==='"'){if(value)fail();quoted=true;}else value+=c;
 }
 if(quoted)fail();
 if(value||closed||row.length){field();rows.push(row);}
 return rows;
}
function decode(source){
 const text=source.replace(/^\uFEFF/,'');
 // Existing JSON exports and recovery files remain importable.
 if(text.trimStart().startsWith('{'))return JSON.parse(text);
 const rows=parseCSV(text);
 if(!rows.length||JSON.stringify(rows.shift())!==JSON.stringify(HEADER))fail();
 const result=Object.create(null),individuals=new Map(),names=new Map();let count=null,ended=false;
 rows.forEach((row,n)=>{
  if(row.length!==6||row[0]!==FORMAT||row[1]!==VERSION||ended)fail();
  const [,,kind,index,field,raw]=row;let value;try{value=JSON.parse(raw);}catch{fail();}
  if(kind==='情報'){
   if(n!==0||index!==''||field!=='個体数'||!Number.isInteger(value)||value<0||value>2000)fail();count=value;
  }else if(kind==='完了'){
   if(index!==''||field!=='行数'||value!==n||n!==rows.length-1)fail();ended=true;
  }else if(kind==='設定'){
   if(index!==''||!field||field==='pokemon'||Object.hasOwn(result,field))fail();result[field]=value;
  }else if(kind==='個体'||kind==='表示'){
   if(count===null||! /^(0|[1-9][0-9]*)$/.test(index)||Number(index)>=count||!field)fail();
   if(kind==='表示'){
    if(field!=='ポケモン名'||typeof value!=='string'||names.has(index))fail();names.set(index,value);
   }else{
    if(!individuals.has(index))individuals.set(index,Object.create(null));
    const p=individuals.get(index);if(Object.hasOwn(p,field))fail();p[field]=value;
   }
  }else fail();
 });
 if(count===null||!ended||individuals.size!==count||names.size!==count)fail();
 result.pokemon=Array.from({length:count},(_,i)=>individuals.get(String(i)));
 return result;
}
root.SleepBackup={encode,decode};
})(globalThis);
