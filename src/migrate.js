import m1 from'../migrations/0001_init.sql'
import m2 from'../migrations/0002_features.sql'
import m3 from'../migrations/0003_free_perks.sql'
import m4 from'../migrations/0004_d1_blobs.sql'
import m5 from'../migrations/0005_indexes.sql'
import m6 from'../migrations/0006_bot_projects.sql'
import m7 from'../migrations/0007_signin.sql'
import m8 from'../migrations/0008_cleanup_indexes.sql'
import m9 from'../migrations/0009_safety_labs.sql'
import m10 from'../migrations/0010_profile_gifs_automod.sql'
const LIST=[['0001_init',m1],['0002_features',m2],['0003_free_perks',m3],['0004_d1_blobs',m4],['0005_indexes',m5],['0006_bot_projects',m6],['0007_signin',m7],['0008_cleanup_indexes',m8],['0009_safety_labs',m9],['0010_profile_gifs_automod',m10]]
let ran=null
export function ensureSchema(db){
if(!ran)ran=run(db).catch(e=>{ran=null;throw e})
return ran
}
async function run(db){
await db.exec('create table if not exists _migrations(name text primary key)')
const done=new Set((await db.prepare('select name from _migrations').all()).results.map(r=>r.name))
for(const[name,sql]of LIST){
if(done.has(name))continue
try{await db.exec(`begin;${sql}\n;insert into _migrations(name) values('${name}');commit`)}
catch(e){
const again=await db.prepare('select 1 x from _migrations where name=?').bind(name).first()
if(!again)throw e
}
}
}
