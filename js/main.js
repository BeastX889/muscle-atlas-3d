import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBody } from './body.js';
import { MUSCLES, MUSCLE_ORDER } from './muscles.js';

const BASE = new THREE.Color(0xb5473a);      // anatomical red
const DIMMED = new THREE.Color(0xdcbfae);    // faded flesh
const SELECTED = new THREE.Color(0xd6402a);  // vivid red
const GLOW = new THREE.Color(0xff5a2e);

// ---------- renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f1e8);
scene.fog = new THREE.Fog(0xf5f1e8, 7, 16);

const camera = new THREE.PerspectiveCamera(
  38, window.innerWidth / window.innerHeight, 0.1, 50);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.02, 0);

// Frame both figures whatever the aspect ratio — narrow screens
// need the camera further back to fit the pair.
{
  const dist = Math.max(3.5, 4.2 / camera.aspect);
  camera.position.copy(controls.target)
    .addScaledVector(new THREE.Vector3(0.24, 0.1, 0.97).normalize(), dist);
  controls.maxDistance = Math.max(7, dist + 1);
}

controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 1.2;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c9b2, 1.0));

const key = new THREE.DirectionalLight(0xfff4e2, 2.0);
key.position.set(2.4, 3.4, 2.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1.6;
key.shadow.camera.right = 1.6;
key.shadow.camera.top = 2.6;
key.shadow.camera.bottom = -0.5;
key.shadow.bias = -0.002;
scene.add(key);

const rim = new THREE.DirectionalLight(0xc4d2f0, 0.6);
rim.position.set(-2.5, 1.8, -2.6);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xffe0c4, 0.35);
fill.position.set(-1.5, 0.6, 2.5);
scene.add(fill);

// ---------- ground ----------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6, 64),
  new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------- figures: anterior + posterior pair, like an anatomy plate ----------
const registry = {};   // muscleId -> meshes[] (both figures)
const pickables = [];

for (const [x, ry] of [[-0.42, 0], [0.42, Math.PI]]) {
  const body = buildBody();
  body.group.position.x = x;
  body.group.rotation.y = ry;
  scene.add(body.group);
  pickables.push(...body.pickables);
  for (const [id, meshes] of Object.entries(body.registry)) {
    (registry[id] ||= []).push(...meshes);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.508, 96),
    new THREE.MeshBasicMaterial({ color: 0xd6c9ae, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.002, 0);
  scene.add(ring);
}

// ---------- selection / hover state ----------
let selectedId = null;
let hoveredId = null;

function applyStyles() {
  for (const [id, meshes] of Object.entries(registry)) {
    for (const mesh of meshes) {
      const m = mesh.material;
      if (id === selectedId) {
        m.color.copy(SELECTED);
        m.emissive.copy(GLOW);
        m.emissiveIntensity = 0.28;
      } else if (id === hoveredId) {
        m.color.copy(selectedId ? DIMMED : BASE).lerp(SELECTED, 0.5);
        m.emissive.copy(GLOW);
        m.emissiveIntensity = 0.1;
      } else {
        m.color.copy(selectedId ? DIMMED : BASE);
        m.emissive.setScalar(0);
        m.emissiveIntensity = 0;
      }
    }
  }
}

// ---------- UI ----------
const listEl = document.getElementById('muscleList');
const card = document.getElementById('infoCard');
const listButtons = {};

for (const id of MUSCLE_ORDER) {
  const btn = document.createElement('button');
  btn.innerHTML = `<span class="tick"></span>${MUSCLES[id].name}`;
  btn.addEventListener('click', () => select(selectedId === id ? null : id));
  listEl.appendChild(btn);
  listButtons[id] = btn;
}

document.getElementById('infoClose').addEventListener('click', () => select(null));

function select(id) {
  selectedId = id;
  applyStyles();
  for (const [mid, btn] of Object.entries(listButtons)) {
    btn.classList.toggle('active', mid === id);
  }
  if (!id) {
    card.hidden = true;
    return;
  }
  const m = MUSCLES[id];
  document.getElementById('infoRegion').textContent = m.region;
  document.getElementById('infoName').textContent = m.name;
  document.getElementById('infoLatin').textContent = m.latin;
  document.getElementById('infoDesc').textContent = m.desc;
  document.getElementById('infoFn').textContent = m.fn;
  document.getElementById('infoBodyweight').innerHTML =
    m.bodyweight.map((e) => `<li>${e}</li>`).join('');
  document.getElementById('infoWeights').innerHTML =
    m.weights.map((e) => `<li>${e}</li>`).join('');
  card.hidden = false;
}

// ---------- picking ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pick(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  pointer.set(
    ((clientX - r.left) / r.width) * 2 - 1,
    -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  return hits.length ? hits[0].object.userData.muscleId : null;
}

let downPos = null;
canvas.addEventListener('pointerdown', (e) => {
  controls.autoRotate = false;
  downPos = [e.clientX, e.clientY];
});

canvas.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved > 6) return;
  const id = pick(e.clientX, e.clientY);
  select(id === selectedId ? null : id);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const id = pick(e.clientX, e.clientY);
  if (id !== hoveredId) {
    hoveredId = id;
    canvas.style.cursor = id ? 'pointer' : 'grab';
    applyStyles();
  }
});

// ---------- resize / loop ----------
// Checked every frame rather than via the resize event — some embedded
// viewports resize the page without firing one.
function fitViewport() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
}

applyStyles();

renderer.setAnimationLoop(() => {
  fitViewport();
  controls.update();
  renderer.render(scene, camera);
});
