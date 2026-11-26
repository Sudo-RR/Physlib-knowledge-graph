// Coarse architectural light signatures in normalized facade coordinates.
// Rectangles are [left, bottom, right, top]. The patterns remain static under
// pause and are intentionally broad enough to survive small projected widths.
export const roleSignatures=Object.freeze({
 0:[],
 1:[[.10,.08,.25,.92],[.40,.08,.60,.92],[.75,.08,.90,.92]],
 2:[[.12,.12,.41,.32],[.59,.12,.88,.32],[.12,.40,.41,.60],[.59,.40,.88,.60],[.12,.68,.41,.88],[.59,.68,.88,.88]],
 3:[[.07,.13,.93,.27],[.07,.43,.93,.57],[.07,.73,.93,.87]],
 4:[[.06,.76,.94,.95],[.06,.10,.19,.76],[.81,.10,.94,.76]]
});
export function roleRects(role,roof=false){return roof&&role===4?[[.06,.06,.94,.19],[.06,.81,.94,.94],[.06,.19,.19,.81],[.81,.19,.94,.81]]:roleSignatures[role]||[];}
export function roleSignatureAt(role,x,y,roof=false){return Number(roleRects(role,roof).some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d));}
const f=x=>x.toFixed(3);
export function roleSignatureGLSL(roof=false){
 const terms=Object.keys(roleSignatures).filter(k=>Number(k)>0).map(k=>`if(role<${Number(k)+.5})return ${roleRects(Number(k),roof).map(([a,b,c,d])=>`roleRect(p,vec4(${[a,b,c,d].map(f).join(',')}))`).reduce((a,b)=>`max(${a},${b})`)};`).join('\n');
 return `float roleRect(vec2 p,vec4 b){vec2 lo=smoothstep(b.xy-vec2(.018),b.xy+vec2(.018),p);vec2 hi=1.0-smoothstep(b.zw-vec2(.018),b.zw+vec2(.018),p);return lo.x*lo.y*hi.x*hi.y;}
 float roleSignature(vec2 p,float role){if(role<.5)return 0.0;${terms}return 0.0;}`;
}
