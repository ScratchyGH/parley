export const VERSION='2026.10.26'
export const RELEASES=[
{v:'2026.10.26',date:'October 21, 2026',title:'Bundles, new cosmetics and server labs',summary:'Cosmetic bundles, redesigned frames, new name styles and badges, a new Parley mascot and eleven experimental server features.',sections:[
['Pars shop',[
['Bundles','Void, Eyes Of God, Devils Demise, Bloxtime, Sakura Dream, Frostbite and Royal Court. Some pieces are only sold in a bundle.'],
['Timed vanity links','Bundles that include a vanity link give you one month of it. The link stops working when the month ends.'],
['Name styles and badges','Animated name colors and small badges next to your name, both new shop categories.'],
['New nameplates','Void, Gods Descendent and Bloxtime.']
]],
['Appearance',[
['Redrawn avatar frames','Every frame was redrawn as vector art that sits around your picture and scales with it, including the Angel Halo and Evil Embodiment frames.'],
['Avatars fit effects','Frames and effects now line up with the avatar at every size, and pictures no longer have a colored circle behind them.'],
['New Parley mascot','Redrawn mascot used for the app logo, notifications and the install icon.'],
['What\'s new fixed','The update board uses the full dialog width again instead of a narrow column.']
]],
['Experimental server features',[
['Starboard','Reposts messages that collect enough star reactions into a showcase channel.'],
['Levels and leaderboard','XP for chatting, levels, a server leaderboard and roles awarded at chosen levels.'],
['Reaction roles','Pick up or drop a role by reacting to a message.'],
['Giveaways','Timed giveaways with random winners, early end and reroll.'],
['Counting channel','Members count upward together; mistakes and double turns are rejected.'],
['Question of the day','A queue of questions posted once a day at the hour you choose.'],
['Anonymous confessions','Members post through a bot. Moderators can see the sender and block people.'],
['Birthdays','Members add their birthday and get a shout-out on the day (UTC).'],
['Suggestions','Members submit ideas with vote reactions and moderators approve or decline them.'],
['Sticky messages','Keep a message at the bottom of a channel.'],
['Event reminders','Pings people who RSVPed 15 minutes before an event starts.'],
['Availability','These run only in servers that accepted the Experimental Servers Program. Owners and managers set them up under Server labs, and members use them from Community tools in the server menu.']
]]
]},
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
