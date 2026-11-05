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
['BUSL-1.1','Business Source License 1.1','Source visible, production use limited until it converts.'],
['PolyForm-Noncommercial-1.0.0','PolyForm Noncommercial','Free for non-commercial use only.'],
['PolyForm-Shield-1.0.0','PolyForm Shield','Free to use, not to compete with you.'],
['Elastic-2.0','Elastic License 2.0','Source available, no hosted competing service.'],
['CC-BY-NC-4.0','CC BY-NC 4.0','Credit required, non-commercial only.'],
['CC-BY-ND-4.0','CC BY-ND 4.0','Credit required, no modified copies.'],
['CC-BY-NC-ND-4.0','CC BY-NC-ND 4.0','Credit required, non-commercial, no modified copies.'],
['NoFork','No forking','Others may use it as is. Forking is turned off.'],
['Proprietary','Proprietary','Closed source. Use only, no copies, no forking.'],
['ARR','All rights reserved','Others may run it but not copy or modify it.'],
['Custom','Custom license','Link to your own terms. Forks need the reader to accept.'],
['CustomClosed','Custom license, forking disabled','Link to your own terms. Forking is turned off.']
]
export const TAGS=['moderation','music','utility','fun','games','logging','welcome','economy','ai','roleplay','polls','integration','dev-tools','social','automation','other']
export const licenseName=id=>(LICENSES.find(l=>l[0]===id)||[id,id])[1]
export const NOFORK=new Set(['ARR','NoFork','Proprietary','CustomClosed','BUSL-1.1','PolyForm-Noncommercial-1.0.0','PolyForm-Shield-1.0.0','Elastic-2.0','CC-BY-ND-4.0','CC-BY-NC-ND-4.0'])
export const isCustom=id=>id==='Custom'||id==='CustomClosed'
export const licenseUrl=(id,custom)=>isCustom(id)?custom:id==='ARR'||id==='NoFork'||id==='Proprietary'?'':'https://spdx.org/licenses/'+id+'.html'
