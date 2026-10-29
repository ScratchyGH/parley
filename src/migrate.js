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
import m11 from'../migrations/0011_server_theme_blocks.sql'
import m12 from'../migrations/0012_bot_vars.sql'
import m13 from'../migrations/0013_more_indexes.sql'
import m14 from'../migrations/0014_maintenance_bypass.sql'
import m15 from'../migrations/0015_cases_templates_tags.sql'
import m16 from'../migrations/0016_tag_icons.sql'
import m17 from'../migrations/0017_pars_program_screening.sql'
import m18 from'../migrations/0018_moderation_retention.sql'
import m19 from'../migrations/0019_scheduled_inbox_reports.sql'
import m20 from'../migrations/0020_avatar_effects.sql'
import m21 from'../migrations/0021_bot_workspaces.sql'
import m22 from'../migrations/0022_server_hooks.sql'
import m23 from'../migrations/0023_tos.sql'
import m24 from'../migrations/0024_premium_nameplates.sql'
import m25 from'../migrations/0025_server_plugins.sql'
import m26 from'../migrations/0026_more_cosmetics.sql'
import m27 from'../migrations/0027_bundles_cosmetics.sql'
import m28 from'../migrations/0028_server_labs.sql'
import m29 from'../migrations/0029_shop_overhaul.sql'
import m30 from'../migrations/0030_legacy_modern_community.sql'
import m31 from'../migrations/0031_gift_inbox.sql'
import m32 from'../migrations/0032_onboarding.sql'
import m33 from'../migrations/0033_seasonal.sql'
import m34 from'../migrations/0034_seasonal2.sql'
import m35 from'../migrations/0035_ny26.sql'
import m36 from'../migrations/0036_tidal.sql'
import m37 from'../migrations/0037_cleanup.sql'
import m38 from'../migrations/0038_glasses.sql'
import m39 from'../migrations/0039_ny_effect.sql'
import m40 from'../migrations/0040_modai.sql'
import m41 from'../migrations/0041_scanned.sql'
import m42 from'../migrations/0042_no_ears.sql'
import m43 from'../migrations/0043_reminders.sql'
import m44 from'../migrations/0044_streaks_voice.sql'
import m45 from'../migrations/0045_hollow.sql'
import m46 from'../migrations/0046_birthday_set.sql'
import m47 from'../migrations/0047_banhammer.sql'
import m48 from'../migrations/0048_mod_log_target_index.sql'
import m49 from'../migrations/0049_birthday_public.sql'
import m50 from'../migrations/0050_birthday_gate.sql'
import m51 from'../migrations/0051_birthday_names.sql'
import m52 from'../migrations/0052_birthday_full.sql'
import m53 from'../migrations/0053_birthday_rename.sql'
import m54 from'../migrations/0054_birthday_candy.sql'
const LIST=[['0001_init',m1],['0002_features',m2],['0003_free_perks',m3],['0004_d1_blobs',m4],['0005_indexes',m5],['0006_bot_projects',m6],['0007_signin',m7],['0008_cleanup_indexes',m8],['0009_safety_labs',m9],['0010_profile_gifs_automod',m10],['0011_server_theme_blocks',m11],['0012_bot_vars',m12],['0013_more_indexes',m13],['0014_maintenance_bypass',m14],['0015_cases_templates_tags',m15],['0016_tag_icons',m16],['0017_pars_program_screening',m17],['0018_moderation_retention',m18],['0019_scheduled_inbox_reports',m19],['0020_avatar_effects',m20],['0021_bot_workspaces',m21],['0022_server_hooks',m22],['0023_tos',m23],['0024_premium_nameplates',m24],['0025_server_plugins',m25],['0026_more_cosmetics',m26],['0027_bundles_cosmetics',m27],['0028_server_labs',m28],['0029_shop_overhaul',m29],['0030_legacy_modern_community',m30],['0031_gift_inbox',m31],['0032_onboarding',m32],['0033_seasonal',m33],['0034_seasonal2',m34],['0035_ny26',m35],['0036_tidal',m36],['0037_cleanup',m37],['0038_glasses',m38],['0039_ny_effect',m39],['0040_modai',m40],['0041_scanned',m41],['0042_no_ears',m42],['0043_reminders',m43],['0044_streaks_voice',m44],['0045_hollow',m45],['0046_birthday_set',m46],['0047_banhammer',m47],['0048_mod_log_target_index',m48],['0049_birthday_public',m49],['0050_birthday_gate',m50],['0051_birthday_names',m51],['0052_birthday_full',m52],['0053_birthday_rename',m53],['0054_birthday_candy',m54]]
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
