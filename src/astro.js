// Ported verbatim from the web app's astro.js (JPL approximate Keplerian elements).
const window = {};
(function(){
const R=Math.PI/180,D=180/Math.PI;
// JPL approximate Keplerian elements (J2000) [a,e,I,L,varpi,Omega] + rates per century
const EL={
mercury:[[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081]],
venus:[[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418]],
earth:[[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0],[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0]],
mars:[[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]],
jupiter:[[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106]],
saturn:[[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794]],
uranus:[[19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503],[-0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589]],
neptune:[[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664]]};
const jd=d=>d.getTime()/864e5+2440587.5;
function helio(name,J){
  const T=(J-2451545)/36525,[e0,r0]=EL[name];
  const a=e0[0]+r0[0]*T,e=e0[1]+r0[1]*T,I=(e0[2]+r0[2]*T)*R,L=e0[3]+r0[3]*T,vp=e0[4]+r0[4]*T,Om=(e0[5]+r0[5]*T)*R;
  let M=(((L-vp)%360)+540)%360-180;M*=R;const w=vp*R-Om;
  let E=M+e*Math.sin(M);for(let k=0;k<8;k++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E);
  const cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(Om),sO=Math.sin(Om),cI=Math.cos(I),sI=Math.sin(I);
  return{x:(cw*cO-sw*sO*cI)*xp+(-sw*cO-cw*sO*cI)*yp,y:(cw*sO+sw*cO*cI)*xp+(-sw*sO+cw*cO*cI)*yp,z:(sw*sI)*xp+(cw*sI)*yp};
}
const EPS=23.43928*R;
function eq(x,y,z){const ye=y*Math.cos(EPS)-z*Math.sin(EPS),ze=y*Math.sin(EPS)+z*Math.cos(EPS);return{ra:Math.atan2(ye,x),dec:Math.atan2(ze,Math.hypot(x,ye)),dist:Math.hypot(x,y,z)};}
function radec(body,J){
  if(body==='sun'){const e=helio('earth',J);return eq(-e.x,-e.y,-e.z);}
  if(body==='moon'){const d=J-2451545;const L=(218.316+13.176396*d)*R,M=(134.963+13.064993*d)*R,F=(93.272+13.229350*d)*R;
    const lon=L+6.289*R*Math.sin(M),lat=5.128*R*Math.sin(F);return eq(Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat));}
  const p=helio(body,J),e=helio('earth',J);return eq(p.x-e.x,p.y-e.y,p.z-e.z);
}
function altaz(body,date,lat,lon){
  const J=jd(date),{ra,dec,dist}=radec(body,J);
  const gmst=(280.46061837+360.98564736629*(J-2451545))%360;
  const H=(gmst+lon)*R-ra,phi=lat*R;
  const alt=Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H));
  const az=Math.atan2(-Math.sin(H)*Math.cos(dec),Math.cos(phi)*Math.sin(dec)-Math.sin(phi)*Math.cos(dec)*Math.cos(H));
  return{alt:alt*D,az:(az*D+360)%360,dist};
}
const compass=az=>['N','NE','E','SE','S','SW','W','NW'][Math.round(az/45)%8];
function tonight(lat,lon,now){
  const base=new Date(now||Date.now());if(base.getHours()<6)base.setDate(base.getDate()-1);base.setHours(12,0,0,0);
  const dark=[];for(let m=0;m<=1440;m+=10){const t=new Date(base.getTime()+m*6e4);if(altaz('sun',t,lat,lon).alt<-8)dark.push(t);}
  if(!dark.length)return{noDark:true,bodies:[]};
  const bodies=['moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'].map(id=>{
    let best=-90,bt=null,baz=0,first=null,last=null;
    dark.forEach(t=>{const p=altaz(id,t,lat,lon);if(p.alt>best){best=p.alt;bt=t;baz=p.az;}if(p.alt>10){if(!first)first=t;last=t;}});
    return{id,best,bestTime:bt,az:baz,first,last,span:first?(last-first)/Math.max(1,(dark[dark.length-1]-dark[0])):0};
  });
  return{noDark:false,darkStart:dark[0],darkEnd:dark[dark.length-1],bodies};
}
const SYN=29.530588853;
function moonPhase(date){
  const age=(((jd(date)-2451550.1)%SYN)+SYN)%SYN,illum=(1-Math.cos(2*Math.PI*age/SYN))/2;
  const names=[[1.84,'New Moon'],[5.53,'Waxing Crescent'],[9.22,'First Quarter'],[12.91,'Waxing Gibbous'],[16.61,'Full Moon'],[20.30,'Waning Gibbous'],[23.99,'Last Quarter'],[27.68,'Waning Crescent'],[99,'New Moon']];
  return{age,illum,frac:age/SYN,name:names.find(n=>age<n[0])[1]};
}
function nextPhase(date,targetAge){const a=moonPhase(date).age;let d=(targetAge-a+SYN)%SYN;if(d<0.3)d+=SYN;return new Date(date.getTime()+d*864e5);}
window.Astro={jd,helio,altaz,compass,tonight,moonPhase,nextPhase,SYN};
})();

const Astro = window.Astro;
export default Astro;
