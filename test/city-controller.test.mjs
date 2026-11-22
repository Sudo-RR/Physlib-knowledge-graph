import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCollisionGrid } from '../site/city-camera.js';
import { createNavigationController, isTrackpadPan } from '../site/city-navigation.js';

function setup() {
  let time=0;
  const camera=new THREE.PerspectiveCamera();camera.position.set(10,5,10);
  const controls=new THREE.EventDispatcher();controls.target=new THREE.Vector3(0,5,0);controls.minDistance=5;controls.maxDistance=100;
  controls.update=()=>{};controls.listenToKeyEvents=()=>{};controls.pan=(x,y)=>{controls.lastPan=[x,y];};
  const element=new EventTarget();
  const controller=createNavigationController({camera,controls,element,collisionGrid:createCollisionGrid([]),isUnderground:()=>false,now:()=>time});
  return {camera,controls,element,controller,tick:value=>{time=value;controller.update();}};
}
test('focus flights finish at the requested target and can be interrupted',()=>{
  const {camera,controls,element,controller,tick}=setup();
  controller.travel(new THREE.Vector3(20,5,0),new THREE.Vector3(30,10,0));
  tick(275);assert.equal(controller.flying,true);
  element.dispatchEvent(new Event('wheel'));assert.equal(controller.flying,false);
  const stopped=camera.position.clone();tick(400);assert.deepEqual(camera.position.toArray(),stopped.toArray());
  controller.travel(new THREE.Vector3(20,5,0),new THREE.Vector3(30,10,0));
  tick(950);assert.equal(controller.flying,false);
  assert.deepEqual(camera.position.toArray(),[30,10,0]);assert.deepEqual(controls.target.toArray(),[20,5,0]);
});
test('precision trackpad scroll pans while pinch and ordinary wheel remain zoom gestures',()=>{
  const base={deltaMode:0,deltaX:2,deltaY:8,ctrlKey:false,metaKey:false};
  assert.equal(isTrackpadPan(base),true);
  assert.equal(isTrackpadPan({...base,ctrlKey:true}),false);
  assert.equal(isTrackpadPan({...base,deltaMode:1}),false);
  assert.equal(isTrackpadPan({...base,deltaX:0,deltaY:100}),false);
  const {controls,element,controller}=setup();
  controller.travel(new THREE.Vector3(),new THREE.Vector3(20,5,20));
  const event=new Event('wheel',{cancelable:true});
  for(const [key,value] of Object.entries(base))Object.defineProperty(event,key,{value});
  element.dispatchEvent(event);
  assert.deepEqual(controls.lastPan,[2,8]);assert.equal(event.defaultPrevented,true);assert.equal(controller.flying,false);
});
test('manual motion and orbit input cancel a focus flight',()=>{
  const {controls,element,controller}=setup();
  controller.travel(new THREE.Vector3(),new THREE.Vector3(20,5,20));
  controller.move(1,0);assert.equal(controller.flying,false);
  controller.travel(new THREE.Vector3(),new THREE.Vector3(20,5,20));
  controls.dispatchEvent({type:'start'});assert.equal(controller.flying,false);
  controller.travel(new THREE.Vector3(),new THREE.Vector3(20,5,20));
  const key=new Event('keydown');Object.defineProperty(key,'key',{value:'ArrowLeft'});
  element.dispatchEvent(key);assert.equal(controller.flying,false);
});
