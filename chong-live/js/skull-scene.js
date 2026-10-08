import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SKULL_MODEL_URL } from './runtime.js';

export function initSkullScene(container) {
  if (!container) return () => {};
  const canvas = container.querySelector('[data-skull-canvas]');
  const status = container.querySelector('[data-skull-status]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  let model;
  let mixer;
  let disposed = false;
  let targetRot = -.25;
  let originalMaterials = [];
  let stage = 'final';
  const clock = new THREE.Clock();

  function fallback(message) {
    container.dataset.state = 'fallback';
    if (status) status.textContent = message;
  }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    fallback('3D demo unavailable · process story remains visible');
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
  camera.position.set(0, 1.3, 6.2);
  const key = new THREE.DirectionalLight(0xffe8d8, 5.4); key.position.set(-4, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff5b36, 4.2); rim.position.set(4, 2, -4); scene.add(rim);
  const cool = new THREE.DirectionalLight(0x8bbcff, 2.7); cool.position.set(3, 4, 3); scene.add(cool);
  scene.add(new THREE.HemisphereLight(0xf4eee6, 0x090909, 2));

  const clay = new THREE.MeshStandardMaterial({ color: 0xc7b7aa, roughness: .74, metalness: .03 });
  const wire = new THREE.MeshBasicMaterial({ color: 0xff6843, wireframe: true, transparent: true, opacity: .86 });

  function applyStage(next) {
    stage = next;
    if (!model) return;
    let i = 0;
    model.traverse((node) => {
      if (!node.isMesh) return;
      if (next === 'wireframe') node.material = wire;
      else if (next === 'clay') node.material = clay;
      else node.material = originalMaterials[i++] || node.material;
    });
    renderer.toneMappingExposure = next === 'material' ? .9 : next === 'final' ? 1.18 : 1.0;
    container.dataset.process = next;
  }

  const loader = new GLTFLoader();
  loader.load(SKULL_MODEL_URL, (gltf) => {
    if (disposed) return;
    model = gltf.scene;
    const materials = [];
    model.traverse((node) => {
      if (node.isMesh) materials.push(node.material);
    });
    originalMaterials = materials;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 3.55 / Math.max(size.y, .001);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale + .25, -center.z * scale);
    model.rotation.y = targetRot;
    scene.add(model);
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations.find((item) => /idle|walk|run|dance/i.test(item.name)) || gltf.animations[0];
      mixer.clipAction(clip).play();
    }
    applyStage(document.documentElement.dataset.processStage || 'final');
    container.dataset.state = 'ready';
    if (status) status.textContent = 'LIVE 3D DEMO · SCROLL TO DECONSTRUCT';
  }, undefined, () => fallback('Cloud model unavailable · process story remains visible'));

  const onStage = (event) => applyStage(event.detail?.stage || 'final');
  window.addEventListener('tjong:process-stage', onStage);
  const onPointer = (event) => {
    if (reduced) return;
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width) - .5;
    targetRot = -.25 + x * .9;
  };
  container.addEventListener('pointermove', onPointer, { passive: true });

  const resize = () => {
    const w = Math.max(1, container.clientWidth); const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  renderer.setAnimationLoop(() => {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), .05);
    if (!reduced) mixer?.update(delta);
    if (model) {
      if (!reduced && stage === 'final') targetRot += delta * .05;
      model.rotation.y += (targetRot - model.rotation.y) * .055;
      if (!reduced) model.rotation.z = Math.sin(clock.elapsedTime * .45) * .025;
    }
    renderer.render(scene, camera);
  });

  return () => {
    disposed = true;
    window.removeEventListener('tjong:process-stage', onStage);
    container.removeEventListener('pointermove', onPointer);
    ro.disconnect();
    renderer.setAnimationLoop(null);
    clay.dispose(); wire.dispose(); renderer.dispose();
  };
}
