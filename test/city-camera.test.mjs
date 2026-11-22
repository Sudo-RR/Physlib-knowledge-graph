import test from 'node:test';
import assert from 'node:assert/strict';
import { cityBounds, fitDistance, fitBox } from '../site/city-camera.js';

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
