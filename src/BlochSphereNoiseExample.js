/**
 * Example: Bloch Sphere with Noise Integration
 * ─────────────────────────────────────────────────────────────────
 * Shows how to integrate NoiseController into a Three.js animation loop.
 *
 * This is a complete, standalone reference implementation suitable for:
 * - Testing the noise engine
 * - Educational demonstrations
 * - Pattern reference for integration
 *
 * Usage:
 * 1. Import into your React component
 * 2. Create NoiseController in useRef()
 * 3. Call animationLoop() in animate() callback
 * 4. Bind UI sliders to setNoiseIntensity()
 */

import * as THREE from "three";
import { NoiseController } from "./NoiseController.js";

/**
 * Creates and manages a Three.js Bloch sphere with noise visualization.
 *
 * @param {HTMLElement} mountElement - DOM element to render into
 * @returns {Object} API object with methods to interact with the sphere
 */
function createNoisyBlochSphere(mountElement) {
  // ─────────────────────────────────────────────────────────────
  // SCENE SETUP
  // ─────────────────────────────────────────────────────────────

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    mountElement.clientWidth / mountElement.clientHeight,
    0.1,
    1000,
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  mountElement.appendChild(renderer.domElement);

  camera.position.set(0, 2, 3);
  camera.lookAt(0, 0, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x223355, 4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x0088ff, 2, 15);
  pointLight.position.set(4, 4, 3);
  scene.add(pointLight);

  // ─────────────────────────────────────────────────────────────
  // NOISE CONTROLLER
  // ─────────────────────────────────────────────────────────────

  const noiseController = new NoiseController();

  // ─────────────────────────────────────────────────────────────
  // BLOCH SPHERE GEOMETRY
  // ─────────────────────────────────────────────────────────────

  // Wireframe sphere
  const sphereGeom = new THREE.SphereGeometry(0.9, 24, 16);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x0a2535,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  scene.add(sphere);

  // ─────────────────────────────────────────────────────────────
  // BLOCH VECTOR ARROWS
  // ─────────────────────────────────────────────────────────────

  // Ideal vector (semi-transparent green)
  const idealArrow = createArrow(scene, 0x44aa44, 0.8);

  // Noisy vector (bright cyan)
  const noisyArrow = createArrow(scene, 0x00ddff, 1.0);

  // ─────────────────────────────────────────────────────────────
  // REFERENCE AXES
  // ─────────────────────────────────────────────────────────────

  const axisColors = {
    x: 0xff4444,
    y: 0x44ff44,
    z: 0x4444ff,
  };

  [
    { dir: [1.2, 0, 0], col: axisColors.x, name: "X" },
    { dir: [-1.1, 0, 0], col: 0x441111, name: "" },
    { dir: [0, 1.35, 0], col: axisColors.z, name: "Z" },
    { dir: [0, -1.2, 0], col: 0x004455, name: "" },
    { dir: [0, 0, 1.2], col: axisColors.y, name: "Y" },
    { dir: [0, 0, -1.1], col: 0x113311, name: "" },
  ].forEach(({ dir, col }) => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...dir),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.5,
    });
    scene.add(new THREE.Line(geom, mat));
  });

  // ─────────────────────────────────────────────────────────────
  // EQUATORS
  // ─────────────────────────────────────────────────────────────

  const createEquator = (euler, color, opacity) => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * 2 * Math.PI;
      const pt = new THREE.Vector3(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0);
      pt.applyEuler(new THREE.Euler(...euler));
      pts.push(pt);
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
    scene.add(new THREE.Line(geom, mat));
  };

  createEquator([0, 0, 0], 0x006688, 0.4);
  createEquator([Math.PI / 2, 0, 0], 0x003a44, 0.3);
  createEquator([Math.PI / 2, Math.PI / 2, 0], 0x003a44, 0.3);

  // ─────────────────────────────────────────────────────────────
  // TEXT LABELS
  // ─────────────────────────────────────────────────────────────

  // (For full implementation, use canvas or TextGeometry for 3D labels)
  // For now, CanvasTexture could be added later for educational display

  // ─────────────────────────────────────────────────────────────
  // ANIMATION LOOP
  // ─────────────────────────────────────────────────────────────

  let animationId;

  function animate(now) {
    animationId = requestAnimationFrame(animate);

    // Update noise each frame
    noiseController.updateNoisyBloch(now);

    // Get current states
    const ideal = noiseController.getIdealBloch();
    const noisy = noiseController.getNoisyBloch();

    // Update arrows
    updateArrow(idealArrow, ideal, 0.9);
    updateArrow(noisyArrow, noisy, 0.9);

    // Render
    renderer.render(scene, camera);
  }

  animate(performance.now());

  // ─────────────────────────────────────────────────────────────
  // HANDLE WINDOW RESIZE
  // ─────────────────────────────────────────────────────────────

  const handleResize = () => {
    const w = mountElement.clientWidth;
    const h = mountElement.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  window.addEventListener("resize", handleResize);

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  return {
    setIdealBloch: (bloch) => noiseController.setIdealBloch(bloch),
    setNoiseIntensity: (sliders) => noiseController.setNoiseIntensity(sliders),
    getMetrics: () => noiseController.getMetrics(),
    getNoisyBloch: () => noiseController.getNoisyBloch(),
    getIdealBloch: () => noiseController.getIdealBloch(),
    resetNoise: () => noiseController.resetNoise(),
    getFidelityColor: () => noiseController.getFidelityColor(),
    exportHistory: () => noiseController.exportHistoryCSV(),

    // Lifecycle
    dispose: () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      sphereGeom.dispose();
      sphereMat.dispose();
      mountElement.removeChild(renderer.domElement);
    },
  };
}

// ─────────────────────────────────────────────────────────────
// HELPER: CREATE ARROW
// ─────────────────────────────────────────────────────────────

function createArrow(scene, color, opacity) {
  const group = new THREE.Group();

  // Shaft
  const shaftGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8);
  shaftGeom.translate(0, 0.45, 0);
  const mat = new THREE.MeshBasicMaterial({ color });
  group.add(new THREE.Mesh(shaftGeom, mat));

  // Head
  const headGeom = new THREE.ConeGeometry(0.06, 0.12, 8);
  headGeom.translate(0, 0.06, 0);
  group.add(new THREE.Mesh(headGeom, mat));

  // Tip sphere
  const tipGeom = new THREE.SphereGeometry(0.065, 8, 8);
  group.add(new THREE.Mesh(tipGeom, mat));

  scene.add(group);
  return group;
}

// ─────────────────────────────────────────────────────────────
// HELPER: UPDATE ARROW POSITION
// ─────────────────────────────────────────────────────────────

function updateArrow(arrow, bloch, sphereRadius) {
  const { x, y, z } = bloch;

  // Scale by sphere radius
  const tx = x * sphereRadius;
  const ty = z * sphereRadius;
  const tz = y * sphereRadius;

  const len = Math.sqrt(tx * tx + ty * ty + tz * tz);

  if (len > 0.01) {
    const dir = new THREE.Vector3(tx, ty, tz).normalize();
    arrow.scale.setScalar(len);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    arrow.visible = true;
  } else {
    arrow.scale.setScalar(0.001);
    arrow.visible = false;
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────

export { createNoisyBlochSphere };
