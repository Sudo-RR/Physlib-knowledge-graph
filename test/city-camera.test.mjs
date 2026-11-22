import test from 'node:test';
import assert from 'node:assert/strict';
import { cityBounds, fitDistance, fitBox, createCollisionGrid, cameraClearance, layerDestination } from '../site/city-camera.js';

test('overview bounds include separated and underground areas without gaps',()=>{
  const bounds=cityBounds([{x:-30,z:0,radius:10},{x:80,z:100,radius:20,underground:true}],10);
  assert.deepEqual(bounds,{minX:-50,maxX:110,minZ:-20,maxZ:130});
});

test('perspective framing covers all corners at different viewports',()=>{
  const box={min:{x:-100,y:-10,z:-200},max:{x:100,y:30,z:200}};
  for(const aspect of [.5,1,2]) {
    const direction={x:0,y:Math.SQRT1_2,z:Math.SQRT1_2};
    const {centre,distance}=fitBox(box,direction,40,aspect);
    const tan=Math.tan(20*Math.PI/180);
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const px=x-centre.x,py=y-centre.y,pz=z-centre.z;
      const depth=distance-(py*direction.y+pz*direction.z);
      assert.ok(Math.abs(px)<=depth*tan*aspect);
      assert.ok(Math.abs(py*direction.z-pz*direction.y)<=depth*tan);
    }
  }
});

test('framing accounts for narrow screens and tall buildings',()=>{
  const wide=fitDistance(100,20,2,40,2);
  const narrow=fitDistance(100,20,2,40,.5);
  assert.ok(narrow>wide);
  assert.ok(fitDistance(2,100,2,40,1)>fitDistance(2,10,2,40,1));
});

test('camera clearance resolves buildings only in the active layer',()=>{
  const boxes=[{min:{x:-1,y:0,z:-1},max:{x:1,y:10,z:1},layer:'surface'},{min:{x:9,y:-10,z:-1},max:{x:11,y:0,z:1},layer:'underground'}];
  const grid=createCollisionGrid(boxes);
  const inside=cameraClearance({x:.8,y:5,z:0},grid,'surface');
  assert.ok(inside.x>=1.18);
  assert.deepEqual(cameraClearance({x:.8,y:5,z:0},grid,'underground'),{x:.8,y:5,z:0});
  assert.deepEqual(cameraClearance({x:0,y:15,z:0},grid,'surface'),{x:0,y:15,z:0});
  const below=cameraClearance({x:10.8,y:-5,z:0},grid,'underground');
  assert.ok(below.x>=11.18);
});

test('camera clearance escapes overlapping building margins',()=>{
  const box=(x,z)=>({min:{x:x-1,y:0,z:z-1},max:{x:x+1,y:10,z:z+1},layer:'surface'});
  const grid=createCollisionGrid([box(0,0),box(1.9,0),box(0,1.9),box(1.9,1.9)]);
  const safe=cameraClearance({x:.95,y:2,z:.95},grid,'surface');
  for(const item of [box(0,0),box(1.9,0),box(0,1.9),box(1.9,1.9)]) {
    assert.ok(safe.x<=item.min.x-.18||safe.x>=item.max.x+.18||safe.z<=item.min.z-.18||safe.z>=item.max.z+.18);
  }
});

test('layer travel prefers an actual dependency and falls back to the nearest building',()=>{
  const building=(x,z,direction)=>({direction,group:{position:{x,z}}});
  const buildings=new Map([['P',building(0,0,1)],['M1',building(40,0,-1)],['M2',building(1,0,-1)]]);
  const pipelines=[{from:'P',to:'M1'}];
  assert.equal(layerDestination(buildings,pipelines,'P',true,{x:0,z:0}),'M1');
  assert.equal(layerDestination(buildings,pipelines,'unknown',true,{x:0,z:0}),'M2');
  assert.equal(layerDestination(buildings,pipelines,'M1',false,{x:40,z:0}),'P');
  assert.equal(layerDestination(new Map(),[],null,true,{x:0,z:0}),null);
});
