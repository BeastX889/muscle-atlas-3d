import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBody } from './body.js';
import { MUSCLES, MUSCLE_ORDER } from './muscles.js';

const BASE = new THREE.Color(0x94343c);
const DIMMED = new THREE.Color(0x45262c);
const SELECTED = new THREE.Color(0xc4484e);
const GLOW = new THREE.Color(0xff8c2e);

// ---------- renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);
scene.fog = new THREE.Fog(0x101014, 6, 12);

const camera = new THREE.PerspectiveCamera(
  38, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(1.7, 1.45, 3.1);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 1.2;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x8b93a6, 0x1a1216, 0.85));

const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
key.position.set(2.4, 3.2, 2.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1.5;
key.shadow.camera.right = 1.5;
key.shadow.camera.top = 2.5;
key.shadow.camera.bottom = -0.5;
key.shadow.bias = -0.002;
scene.add(key);

const rim = new THREE.DirectionalLight(0x6a7dff, 1.1);
rim.position.set(-2.5, 1.8, -2.6);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xff9d5c, 0.4);
fill.position.set(-1.5, 0.6, 2.5);
scene.add(fill);

// ---------- ground ----------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(4, 64),
  new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.62, 0.63, 96),
  new THREE.MeshBasicMaterial({ color: 0x3a3a44, side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.002;
scene.add(ring);

// ---------- figure ----------
const { group: body, registry, pickables } = buildBody();
scene.add(body);

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
        m.emissiveIntensity = 0.5;
      } else if (id === hoveredId) {
        m.color.copy(selectedId ? DIMMED : BASE).lerp(SELECTED, 0.4);
        m.emissive.copy(GLOW);
        m.emissiveIntensity = 0.14;
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
  document.getElementById('infoExercises').innerHTML =
    m.exercises.map((e) => `<li>${e}</li>`).join('');
  card.hidden = false;
}

// ---------- picking ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pick(clientX, clientY) {
  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1);
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
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

applyStyles();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
