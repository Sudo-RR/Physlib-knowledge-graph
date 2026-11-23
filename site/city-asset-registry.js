import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const assetFixtureModuleId = 'Physlib.Units.ISQDimensionBase';
export const cityAssets = Object.freeze({
  'district-kit': Object.freeze({path:'assets/models/kenney-district-kit.glb',title:'Kenney Modular Buildings · five-part district kit',license:'CC0-1.0'}),
  'kenney-tower': Object.freeze({
    // Resolve against the document, not the content-addressed JS bundle.
    path: 'assets/models/kenney-tower.glb',
    title: 'Kenney Modular Buildings · sample tower A',
    license: 'CC0-1.0'
  })
});

/** Cache owns geometry/materials. Instances share them; never dispose per building. */
export function createAssetRegistry(load = url => new GLTFLoader().loadAsync(url)) {
  const cache = new Map();
  return {
    load(key, baseUrl) {
      if (!cityAssets[key]) return Promise.reject(new Error(`Unknown city asset: ${key}`));
      const url = new URL(cityAssets[key].path, baseUrl).href;
      if (!cache.has(url)) {
        const pending = Promise.resolve().then(() => load(url)).then(gltf => gltf.scene);
        cache.set(url, pending);
        pending.catch(() => cache.delete(url)); // A later explicit retry may recover.
      }
      return cache.get(url);
    }
  };
}

/** Uniformly fit artist geometry; the procedural pedestal preserves semantic height.
 * No window geometry is stretched. Bounds are centred in X/Z and grounded at Y=0.
 */
export function createBuildingAsset(template, {moduleId, width, depth, height}) {
  if (!moduleId || ![width, depth, height].every(n => Number.isFinite(n) && n > 0))
    throw new Error('Asset placement requires an exact module ID and positive dimensions');
  const model = template.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(n => Number.isFinite(n) && n > 0))
    throw new Error('Building asset has empty or invalid bounds');
  const scale = Math.min(width / size.x, depth / size.z, height / size.y);
  const pedestalHeight = Math.max(0, height - size.y * scale);
  model.scale.multiplyScalar(scale);
  model.position.set(-centre.x * scale, pedestalHeight - box.min.y * scale, -centre.z * scale);
  const group = new THREE.Group();
  group.userData = {id: moduleId, decorative: true};
  model.traverse(object => { object.userData = {id: moduleId, decorative: true}; });
  group.add(model);
  return {group, pedestalHeight, nativeSize: size.toArray(), scale};
}

/** Failure never changes the semantic building, inspector or camera. */
export async function attachBuildingAsset({registry, key, baseUrl, building, height, onStatus = () => {}}) {
  onStatus('loading');
  try {
    const template = await registry.load(key, baseUrl);
    const result = createBuildingAsset(template, {
      moduleId: building.node.id, ...building.footprint, height
    });
    building.group.add(result.group);
    building.asset = result;
    onStatus('ready', result);
    return result;
  } catch (error) {
    onStatus('fallback', error);
    return null;
  }
}
