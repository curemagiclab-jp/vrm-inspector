// 3D viewport: three.js scene, OrbitControls, lighting, grid, and VRM loading.
// VRM is loaded with three-vrm v3 (VRMLoaderPlugin). VRM 0.x is rotated to face
// the camera via VRMUtils.rotateVRM0.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';

export interface LoadedVRM {
  gltf: { parser?: { json?: { materials?: unknown[] } } };
  vrm: VRM;
}

export class Viewer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private currentVRM: VRM | null = null;
  private loader: GLTFLoader;
  private host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // required for Export PNG (toDataURL)
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      35,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 1.2, 3);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    // Lighting (three r155+ physically-based intensities).
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 2.0);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 2.5);
    dir.position.set(1, 2, 1.5);
    this.scene.add(dir);

    const grid = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));

    new ResizeObserver(() => this.onResize()).observe(host);
    this.animate();
  }

  private onResize(): void {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.controls.update();
    this.currentVRM?.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  /** Parse a VRM from an ArrayBuffer, replacing any previously loaded model. */
  async load(buffer: ArrayBuffer): Promise<LoadedVRM> {
    const gltf = await this.loader.parseAsync(buffer, '');
    const vrm: VRM | undefined = gltf.userData.vrm;
    if (!vrm) throw new Error('No VRM data found in this file.');

    this.disposeCurrent();

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    VRMUtils.rotateVRM0(vrm); // VRM 0.x faces -Z; rotate to face the camera.

    this.scene.add(vrm.scene);
    this.currentVRM = vrm;
    this.frameModel(vrm);

    return { gltf, vrm };
  }

  private disposeCurrent(): void {
    if (!this.currentVRM) return;
    this.scene.remove(this.currentVRM.scene);
    VRMUtils.deepDispose(this.currentVRM.scene);
    this.currentVRM = null;
  }

  /** Position the camera so the whole model is in frame. */
  private frameModel(vrm: VRM): void {
    const box = new THREE.Box3().setFromObject(vrm.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = (this.camera.fov * Math.PI) / 180;
    const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.6;

    this.camera.position.set(center.x, center.y, center.z + dist);
    this.camera.near = dist / 100;
    this.camera.far = dist * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();
  }

  /** PNG data URL of the current viewport (for Export PNG). */
  screenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
}
