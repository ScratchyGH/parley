export const LICENSES=[
['MIT','MIT License','Short and permissive. Reuse freely if the notice stays.'],
['Apache-2.0','Apache License 2.0','Permissive, with an explicit patent grant.'],
['BSD-2-Clause','BSD 2-Clause','Permissive, two conditions.'],
['BSD-3-Clause','BSD 3-Clause','Permissive, no endorsement using your name.'],
['ISC','ISC License','Permissive and very short.'],
['0BSD','BSD Zero Clause','Do anything, no conditions.'],
['Zlib','zlib License','Permissive, altered versions must be marked.'],
['MPL-2.0','Mozilla Public License 2.0','Changes to the same files stay open.'],
['LGPL-3.0-only','GNU LGPL 3.0','Weak copyleft, can be linked from other code.'],
['GPL-2.0-only','GNU GPL 2.0','Strong copyleft.'],
['GPL-3.0-only','GNU GPL 3.0','Strong copyleft with patent terms.'],
['AGPL-3.0-only','GNU AGPL 3.0','Copyleft that also covers use over a network.'],
['Unlicense','The Unlicense','Public domain dedication.'],
['CC0-1.0','CC0 1.0','Public domain dedication.'],
['CC-BY-4.0','CC BY 4.0','Reuse with credit.'],
['CC-BY-SA-4.0','CC BY-SA 4.0','Reuse with credit, share alike.'],
['ARR','All rights reserved','Others may run it but not copy or modify it.'],
['Custom','Custom license','Link to your own terms.']
]
export const TAGS=['moderation','music','utility','fun','games','logging','welcome','economy','ai','roleplay','polls','integration','dev-tools','social','automation','other']
export const licenseName=id=>(LICENSES.find(l=>l[0]===id)||[id,id])[1]
export const licenseUrl=(id,custom)=>id==='Custom'?custom:id==='ARR'?'':'https://spdx.org/licenses/'+id+'.html'
