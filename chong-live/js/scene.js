import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { animationNames, bobbingY, getAnimationName, shouldAnimate, wrapIndex } from './core.js';
import { ROBOT_MODEL_URL } from './runtime.js';

export function initScene(container) {
  if (!container) return () => {};

  const canvas = container.querySelector('[data-scene-canvas]');
  const loading = container.querySelector('[data-scene-loading]');
  const status = container.querySelector('[data-scene-status]');
  const label = container.querySelector('[data-animation-label]');
  const next = container.querySelector('[data-animation-next]');
  const prev = container.querySelector('[data-animation-prev]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forcedFallback = new URLSearchParams(window.location.search).get('fallback') === '1';
  let disposed = false;
  let renderer;
  let mixer;
  let model;
  let action;
  let baseModelY = 0;
  let animationIndex = 0;
  let targetRotation = 0;
  let dragging = false;
  let pointerStartX = 0;
  let rotationStart = 0;
  const clock = new THREE.Clock();

  const showFallback = (message = '3D preview unavailable · poster mode') => {
    if (disposed) return;
    container.dataset.state = 'fallback';
    status.textContent = message;
  };

  if (forcedFallback || !canvas) {
    showFallback(forcedFallback ? 'Poster mode · forced fallback' : undefined);
    return () => { disposed = true; };
  }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    showFallback();
    return () => { disposed = true; };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREEE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.15, 5.5);

  const key = new THREE.DirectionalLight(0xffeee3, 5.2);
  key.position.set(-3.5, 5, 4.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xff6a45, 2.2);
  fill.position.set(4, 1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc4d6ff, 4.0);
  rim.position.set(0, 4, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xf4eee6, 0x11100d, 2.1));

  const loader = new GLTFLoader();
  loader.load(
    ROBOT_MODEL_URL,
    (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
          if (node.material) node.material.envMapIntensity = 1.2;
        }
      });
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 3.15 / Math.max(size.y, 0.001);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -center.y * scale + .15, -center.z * scale);
      baseModelY = model.position.y;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      model.userData.clips = gltf.animations;
      playAnimation(0, false);
      container.dataset.state = 'ready';
      if (loading) loading.textContent = '3D READY / DRAG TO ROTATE';
      if (status) status.textContent = reducedMotion ? 'Motion reduced · controls remain active' : 'Drag to rotate · explore motion';
    },
    (event) => {
      if (!loading || !event.total) return;
      const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
      loading.textContent = `LOADING 3D / ${String(pct).padStart(2, '0')}`;
    },
    () => showFallback('3D load failed · poster mode active')
  );

  function playAnimation(index, userInitiated = false) {
    animationIndex = wrapIndex(index, animationNames.length);
    const desired = getAnimationName(animationIndex);
    if (label) label.textContent = desired;
    if (!mixer || !model?.userData.clips) return;
    const clip = THREE.AnimationClip.findByName(model.userData.clips, desired);
    if (!clip) return;
    const nextAction = mixer.clipAction(clip);
    nextAction.reset().fadeIn(.24).play();
    nextAction.paused = !shouldAnimate(reducedMotion, userInitiated);
    if (action && action !== nextAction) action.fadeOut(.24);
    action = nextAction;
  }

  const onNext = () => playAnimation(animationIndex + 1, true);
  const onPrev = () => playAnimation(animationIndex - 1, true);
  next?.addEventListener('click', onNext);
  prev?.addEventListener('click', onPrev);

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const onPointerDown = (event) => {
    if (!finePointer || !model) return;
    dragging = true;
    pointerStartX = event.clientX;
    rotationStart = targetRotation;
    canvas.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragging) return;
    targetRotation = rotationStart + (event.clientX - pointerStartX) * .008;
  };
  const onPointerUp = () => { dragging = false; };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    showFallback('WebGL paused · poster mode active');
  }, { once: true });

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), .05);
    mixer?.update(delta);
    if (model) {
      if (!reducedMotion && !dragging) targetRotation += delta * .08;
      model.rotation.y += (targetRotation - model.rotation.y) * .08;
      if (!reducedMotion) model.position.y = bobbingY(baseModelY, clock.elapsedTime * .7);
    }
    renderer.render(scene, camera);
  });

  return () => {
    disposed = true;
    next?.removeEventListener('click', onNext);
    prev?.removeEventListener('click', onPrev);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    resizeObserver.disconnect();
    renderer.setAnimationLoop(null);
    scene.traverse((node) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose?.());
      else node.material?.dispose?.();
    });
    renderer.dispose();
  };
}
