import * as THREE from 'three';
import { cameraClearance } from './city-camera.js';

// Precision trackpads typically emit small pixel deltas; pinch gestures carry
// Ctrl and mouse wheels commonly emit line or larger pixel deltas.
export function isTrackpadPan(event) {
  return event.deltaMode===0&&!event.ctrlKey&&!event.metaKey&&
    (Math.abs(event.deltaX)>.5||(Math.abs(event.deltaY)>0&&Math.abs(event.deltaY)<50));
}

// All camera motion and collision correction is owned by this controller.
export function createNavigationController({camera,controls,element,collisionGrid,isUnderground,worldBounds=null,now=()=>performance.now()}) {
  let flight=null;
  const cancel=()=>{flight=null;};
  controls.addEventListener('start',cancel);
  element.addEventListener('wheel',event=>{
    cancel();
    if(isTrackpadPan(event)){
      event.preventDefault();
      event.stopImmediatePropagation();
      controls.pan(event.deltaX,event.deltaY);
    }
  },{passive:false,capture:true});
  element.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))cancel();});
  controls.listenToKeyEvents(element);

  function travel(target,position) {
    flight={start:now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:position.clone(),toTarget:target.clone()};
  }
  function move(forward,right) {
    cancel();
    const direction=new THREE.Vector3();
    camera.getWorldDirection(direction);direction.y=0;
    if(direction.lengthSq()<.001)direction.set(0,0,-1);
    direction.normalize();
    const sideways=new THREE.Vector3().crossVectors(direction,camera.up).normalize();
    const delta=direction.multiplyScalar(forward).addScaledVector(sideways,right);
    camera.position.add(delta);controls.target.add(delta);
  }
  function zoom(factor) {
    const offset=camera.position.clone().sub(controls.target);
    const distance=Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*factor));
    travel(controls.target,offset.setLength(distance).add(controls.target));
  }
  function update() {
    const underground=isUnderground();
    if(flight){
      const t=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now()-flight.start)/550),ease=1-(1-t)**3;
      camera.position.lerpVectors(flight.from,flight.to,ease);
      controls.target.lerpVectors(flight.fromTarget,flight.toTarget,ease);
      camera.lookAt(controls.target);
      if(t===1)flight=null;
    } else {
      const targetY=underground?Math.min(-2,controls.target.y):Math.max(2,controls.target.y);
      camera.position.y+=targetY-controls.target.y;controls.target.y=targetY;
      controls.update();
    }
    const safe=cameraClearance(camera.position,collisionGrid,underground?'underground':'surface');
    if(safe.x!==camera.position.x||safe.z!==camera.position.z){
      camera.position.x=safe.x;camera.position.z=safe.z;camera.lookAt(controls.target);
    }
    if(worldBounds&&!underground&&!flight){for(const [axis,lo,hi] of [['x','minX','maxX'],['z','minZ','maxZ']]){const target=Math.max(worldBounds[lo]-200,Math.min(worldBounds[hi]+200,controls.target[axis])),delta=(target-controls.target[axis])*.025;controls.target[axis]+=delta;camera.position[axis]+=delta;}}
  }
  return {cancel,travel,move,zoom,update,get flying(){return flight!==null;}};
}
