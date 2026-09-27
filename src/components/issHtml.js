// iss-map.html from the web project, inlined. lat/lon come from the Sky screen's location.
export const issHtml = (lat, lon) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>
<style>
html,body{margin:0;height:100%;background:#0b0d12;overflow:hidden;font-family:ui-monospace,monospace}
svg{display:block;width:100%;height:100%}
@keyframes pulse{0%{r:5;opacity:.9}100%{r:18;opacity:0}}
.pulse{animation:pulse 1.8s ease-out infinite}
#msg{position:absolute;left:10px;bottom:8px;font-size:10px;color:#6b7180}
</style></head>
<body><svg id="m"></svg><div id="msg">Loading map…</div>
<script>
const ulat=${Number(lat) || 51.5},ulon=${Number(lon) || -0.13};
const svg=d3.select('#m');const W=innerWidth,H=innerHeight;svg.attr('viewBox','0 0 '+W+' '+H);
const proj=d3.geoEquirectangular().fitExtent([[4,4],[W-4,H-4]],{type:'Sphere'}),path=d3.geoPath(proj);
svg.append('path').datum({type:'Sphere'}).attr('d',path).attr('fill','#0e1119');
svg.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('fill','none').attr('stroke','rgba(255,255,255,.05)');
const gLand=svg.append('g'),gTrack=svg.append('g'),gUser=svg.append('g'),gIss=svg.append('g');
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then(r=>r.json()).then(t=>{
  gLand.append('path').datum(topojson.feature(t,t.objects.countries)).attr('d',path).attr('fill','#1c2130').attr('stroke','#272d3d').attr('stroke-width',.5);
});
const [ux,uy]=proj([ulon,ulat]);
gUser.append('rect').attr('x',ux-4).attr('y',uy-4).attr('width',8).attr('height',8).attr('fill','#8fb8ff').attr('transform','rotate(45 '+ux+' '+uy+')');
const ring=gIss.append('circle').attr('class','pulse').attr('fill','none').attr('stroke','#f0b46a').attr('stroke-width',1.5);
const dot=gIss.append('circle').attr('r',5).attr('fill','#f0b46a').attr('stroke','#0b0d12').attr('stroke-width',2);
const msg=document.getElementById('msg');
async function pos(){
  try{const j=await (await fetch('https://api.wheretheiss.at/v1/satellites/25544')).json();
    const [x,y]=proj([j.longitude,j.latitude]);ring.attr('cx',x).attr('cy',y);dot.attr('cx',x).attr('cy',y);
    msg.textContent='◆ you   ● ISS   – – next 90 min';
  }catch(e){msg.textContent='ISS position unavailable';}
}
async function track(){
  try{const now=Math.floor(Date.now()/1000);
    const ts=a=>a.map(k=>now+k*540).join(',');
    const [a,b]=await Promise.all([ts([-5,-4,-3,-2,-1,0]),ts([1,2,3,4,5,6,7,8,9,10])].map(q=>fetch('https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps='+q).then(r=>r.json())));
    const pts=[...a,...b].map(p=>[p.longitude,p.latitude]);
    gTrack.selectAll('*').remove();
    gTrack.append('path').datum({type:'LineString',coordinates:pts.slice(0,6)}).attr('d',path).attr('fill','none').attr('stroke','rgba(240,180,106,.35)').attr('stroke-width',1.5);
    gTrack.append('path').datum({type:'LineString',coordinates:pts.slice(5)}).attr('d',path).attr('fill','none').attr('stroke','#f0b46a').attr('stroke-width',1.5).attr('stroke-dasharray','4 4');
  }catch(e){}
}
pos();track();setInterval(pos,5000);setInterval(track,90000);
</script>
</body></html>`;

