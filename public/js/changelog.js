export const VERSION='2026.10.25'
export const RELEASES=[
{v:'2026.10.25',date:'October 21, 2026',title:'The complete update',summary:'Everything released today, in one place: richer messages, themes that persist, a rebuilt composer, bot workspaces, server plugins, backups, group call tools, signed webhooks, new Pars cosmetics and updated legal documents.',sections:[
['Messaging',[
['Richer message syntax','Headings, underline, highlight, superscript, subscript, task lists, tables, dividers, small text, multi-line quotes and timestamps that display in each reader\'s own timezone.'],
['Formatting toolbar','One-click buttons for every format. The bar is always visible, so the layout no longer shifts when you move the mouse over the message box.'],
['Rebuilt message box','Full width, with icons aligned to the text. Code block and poll now have distinct icons, and the row is evenly spaced.'],
['Calmer message list','Messages no longer change background as you move over them. Actions still appear on hover.']
]],
['Appearance',[
['Themes persist after sign-out','Your theme, accent colors and fonts stay applied on the sign-in screen. They switch when you sign in to an account with a different theme.'],
['Presets and fonts','Theme presets, an interface font and a separate message font.'],
['Server backgrounds','Server background images now apply reliably and update when you switch servers.'],
['Interface polish','Consistent buttons, lists, tabs, menus, tables, settings navigation, focus outlines and scrollbars across the app.'],
['Updates board','A cleaner "What\'s new" with a version list, grouped changes and short descriptions.']
]],
['Pars shop',[
['Premium nameplates','Ten animated nameplates built from shapes and effects: Katana, Inferno, Glitch, Storm, Rune, HUD, Dragon, Pixel, Ink and Ribbon.'],
['Eight avatar effects','Orbit, Hearts, Thunder, Cat ears, Snowfall, Matrix, Rainbow ring and Double ring.'],
['Six avatar frames','Rose, Ruby, Ice, Obsidian, Twin and Emerald.']
]],
['Servers and communities',[
['Plugins','Turn on a welcome message, a leave notice or an automatic role in Server settings. Messages use {user}, {username} and {server}.'],
['Signed event webhooks','Servers can send signed requests to your own address when messages are posted or members join. Failing endpoints pause automatically.'],
['Group calls','Add people from the call bar and ring everyone who has not joined. A call holds up to 12 people.']
]],
['Bots',[
['Bot builder','Autosave, right-click menus, templates, import and export, and a checker that flags problems before you run.'],
['Shared workspaces','Edit a bot together with roles, live cursors, version history, branches and merging.'],
['Bot hub','Rate and fork bots, with license and attribution checks.']
]],
['Voice and video',[
['Screen share quality','Choose resolution and frame rate for screen sharing, with audio.'],
['Live captions','Optional captions during calls, processed in your browser where supported.']
]],
['Administration',[
['Backups','Owners can create, download, restore and delete database backups. A daily automatic backup keeps the last 7. Restore only adds back missing records.'],
['Health panel','See database, storage and scheduled-task status at a glance.'],
['GUI preview','Open any popup or panel from the admin area to check its appearance.']
]],
['Safety and legal',[
['Terms and privacy','Rewritten as numbered, plain-language documents with a short and a full version. Everyone must read and accept before continuing, and the server enforces it.']
]],
['Fixes',[
['Bot editor','Fixed save conflicts that could loop, and a stuck save state when closing the conflict dialog.'],
['Search and mentions','Edge cases when a message contained new formatting characters.']
]]
]},
{v:'2026.10.24',date:'October 21, 2026',title:'Syntax, terms and plugins',summary:'Message syntax, the terms gate, plugins, backups and group call tools.',sections:[
['New',[
['Message syntax','Headings, task lists, tables, dividers, timestamps and more.'],
['Terms gate','Short or full terms must be accepted before use.'],
['Plugins and backups','Server plugins, owner backups and a GUI preview in Admin.']
]]
]},
{v:'2026.10.23',date:'October 21, 2026',title:'Bot teamwork and calls',summary:'Collaboration for bot builders and better calls.',sections:[
['New',[
['Bot workspaces','Shared editing, versions, branches and merging.'],
['Presets and fonts','Theme presets, interface font and message font.'],
['Calls','Screen share quality controls, optional live captions and signed event webhooks.']
]]
]},
{v:'2026.10.22',date:'October 20, 2026',title:'Pars shop and effects',summary:'The Pars shop and cosmetics.',sections:[
['New',[
['Pars shop','Under Friends, with avatar effects, nameplates and scheduled messages.'],
['Categories','Right-click a category to rename it or set role permissions.'],
['Previews','YouTube thumbnails and a performance mode.']
]]
]}
]
