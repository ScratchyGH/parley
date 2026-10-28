export const SEASONS={
spook:{name:'Spooked Out',from:[10,1],to:[11,3]},
hollow:{name:'Haunted Hollow',from:[10,1],to:[10,31]},
xmas:{name:'Yuletide',from:[12,10],to:[12,28]},
nye:{name:'Midnight Countdown',from:[12,29],to:[1,7]},
love:{name:'Lovestruck',from:[2,1],to:[2,15]},
bloom:{name:'Wildflower Bloom',from:[3,15],to:[4,12]},
summer:{name:'Sunburst',from:[6,15],to:[7,15]},
harvest:{name:'Harvest Moon',from:[11,10],to:[11,30]},
hanuk:{name:'Festival of Lights',from:[12,10],to:[12,28]},
snow:{name:'Snowfall',from:[12,1],to:[12,9]},
ember:{name:'Ember Night',from:[11,4],to:[11,9]},
aurora:{name:'Northern Lights',from:[1,8],to:[1,31]},
clover:{name:'Lucky Clover',from:[2,16],to:[3,14]},
rain:{name:'Rainfall',from:[4,13],to:[6,14]},
time:{name:'Timeskipper',from:[9,1],to:[9,30]},
bday13:{name:'13th Birthday Bomb',from:[10,31],to:[12,31]},
ny26:{name:'New Years 2026',from:[12,31],to:[1,1]}
}
export function seasonWindow(key,t=Date.now()){
const s=SEASONS[key]
if(!s)return null
const y=new Date(t).getUTCFullYear()
let best=null
for(let yy=y-1;yy<=y+1;yy++){
const start=Date.UTC(yy,s.from[0]-1,s.from[1])
const wrap=s.to[0]<s.from[0]||(s.to[0]===s.from[0]&&s.to[1]<s.from[1])
const end=Date.UTC(yy+(wrap?1:0),s.to[0]-1,s.to[1]+1)
if(end>t&&(!best||start<best.start))best={start,end}
}
const live=t>=best.start&&t<best.end
return{start:best.start,end:best.end,live,status:live?'live':'upcoming'}
}
