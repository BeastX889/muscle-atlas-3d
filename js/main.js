import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MUSCLES, MUSCLE_ORDER } from './muscles.js';

// Muscle group palette (dark ecorche look)
const BASE = new THREE.Color(0x94343c);
const DIMMED = new THREE.Color(0x45262c);
const SELECTED = new THREE.Color(0xc4484e);
const GLOW = new THREE.Color(0xff8c2e);

// Context colors on the Muscles tab: [base, dimmed-while-selection]
const MUSCLE_CTX = {
  other: [0x5a241d, 0x331c17],
  tendon: [0x2e2e36, 0x25252b],
  bones: [0x222229, 0x1b1b21],
};

// Which mesh kinds each system tab shows, and their colors there.
// 'group' stands for the 14 selectable muscle groups.
const SYSTEMS = {
  muscles: {
    label: 'Muscles',
    kinds: { group: 0x94343c, other: 0x5a241d, tendon: 0x2e2e36, bones: 0x222229 },
  },
  skeleton: {
    label: 'Skeleton',
    kinds: { bones: 0xd6cbb2 },
  },
  nerves: {
    label: 'Nerves',
    kinds: { nerves: 0xe8d894, bones: 0x2c2c36 },
  },
  fascia: {
    label: 'Tendons & Fascia',
    kinds: { tendon: 0xcdbf9d, fascia: 0x8d8577, bones: 0x2c2c36 },
  },
};

// ---------- renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// updateStyle=false — CSS owns the canvas layout size; an inline style
// stamped from a not-yet-laid-out window would stick at 0px.
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);
scene.fog = new THREE.Fog(0x101014, 7, 16);

const camera = new THREE.PerspectiveCamera(
  38, window.innerWidth / window.innerHeight, 0.1, 50);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.95, 0);

// Frame both figures whatever the aspect ratio — narrow screens need
// the camera further back to fit the pair. Runs on the first VALID
// viewport size (a zero-sized initial layout would poison the math).
let framed = false;
function frameCamera(aspect) {
  const a = isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const dist = Math.max(3.4, 4.2 / a);
  camera.position.copy(controls.target)
    .addScaledVector(new THREE.Vector3(0.24, 0.1, 0.97).normalize(), dist);
  controls.maxDistance = Math.max(7, dist + 1);
  framed = true;
}
frameCamera(camera.aspect);
if (!(window.innerWidth > 0 && window.innerHeight > 0)) framed = false;

controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.6;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x8b93a6, 0x1a1216, 0.85));

const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
key.position.set(2.4, 3.4, 2.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1.6;
key.shadow.camera.right = 1.6;
key.shadow.camera.top = 2.6;
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
  new THREE.CircleGeometry(6, 64),
  new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

for (const x of [-0.42, 0.42]) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.508, 96),
    new THREE.MeshBasicMaterial({ color: 0x3a3a44, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.002, 0);
  scene.add(ring);
}

// ---------- anatomy model (Z-Anatomy, CC BY-SA 4.0) ----------
const groupMats = {};                 // muscleId -> shared material
const kindMats = {};                  // kind -> [materials]
const kindMeshes = {};                // kind -> [meshes, both figures]
const pickables = [];                 // every mesh, so rays respect occlusion
let modelReady = false;

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

const loadingEl = document.getElementById('loading');

loader.load('assets/body.glb', (gltf) => {
  const proto = gltf.scene;

  // One shared material per part, so a tint change hits both figures.
  proto.traverse((o) => {
    if (!o.isMesh) return;
    // Importer splits multi-primitive nodes into "name_1", "name_2" children.
    const name = (o.name || o.parent?.name || '').replace(/_\d+$/, '');
    if (MUSCLES[name]) {
      if (!groupMats[name]) {
        groupMats[name] = new THREE.MeshStandardMaterial({
          color: BASE, roughness: 0.55, metalness: 0.02,
          side: THREE.DoubleSide,
        });
      }
      o.material = groupMats[name];
      o.userData.muscleId = name;
      o.userData.kind = 'group';
    } else if (SYSTEMS.muscles.kinds[name] !== undefined ||
               name === 'fascia' || name === 'nerves') {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x808080, roughness: name === 'other' ? 0.55 : 0.7,
        metalness: 0.0, side: THREE.DoubleSide,
      });
      o.material = mat;
      o.userData.kind = name;
      (kindMats[name] ||= []).push(mat);
    }
    o.castShadow = true;
  });

  // Anterior + posterior pair, like an anatomy plate.
  for (const [x, ry] of [[-0.42, 0], [0.42, Math.PI]]) {
    const fig = proto.clone(true);
    fig.position.x = x;
    fig.rotation.y = ry;
    scene.add(fig);
    fig.traverse((o) => {
      if (!o.isMesh) return;
      pickables.push(o);
      if (o.userData.kind) (kindMeshes[o.userData.kind] ||= []).push(o);
    });
  }

  modelReady = true;
  window.__atlas = { groupMats, kindMats, kindMeshes, pickables, scene, camera };
  if (loadingEl) loadingEl.remove();
  setSystem(currentSystem);
}, undefined, (err) => {
  console.error('Model load failed', err);
  if (loadingEl) loadingEl.textContent = 'Could not load the 3D model — check your connection and reload.';
});

// ---------- system tabs ----------
let currentSystem = 'muscles';
const tabsEl = document.getElementById('systemTabs');
const tabButtons = {};

for (const [sys, def] of Object.entries(SYSTEMS)) {
  const btn = document.createElement('button');
  btn.textContent = def.label;
  btn.addEventListener('click', () => setSystem(sys));
  tabsEl.appendChild(btn);
  tabButtons[sys] = btn;
}

function setSystem(sys) {
  currentSystem = sys;
  document.body.dataset.system = sys;
  for (const [s, btn] of Object.entries(tabButtons)) {
    btn.classList.toggle('active', s === sys);
  }
  if (sys !== 'muscles' && selectedId) select(null);
  if (!modelReady) return;

  const kinds = SYSTEMS[sys].kinds;
  for (const [kind, meshes] of Object.entries(kindMeshes)) {
    const visible = kinds[kind] !== undefined;
    for (const m of meshes) m.visible = visible;
  }
  for (const [kind, mats] of Object.entries(kindMats)) {
    if (kinds[kind] === undefined) continue;
    for (const m of mats) m.color.setHex(kinds[kind]);
  }
  // Thin nerve tubes catch little light — give them a soft glow.
  for (const m of (kindMats.nerves || [])) {
    m.emissive.setHex(0xb09a52);
    m.emissiveIntensity = sys === 'nerves' ? 0.9 : 0;
  }
  applyStyles();
}

// ---------- selection / hover state ----------
let selectedId = null;
let hoveredId = null;

function applyStyles() {
  if (!modelReady) return;
  for (const [id, m] of Object.entries(groupMats)) {
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
  // Context parts dim while a muscle is selected (Muscles tab only).
  if (currentSystem === 'muscles') {
    for (const [kind, [base, dim]] of Object.entries(MUSCLE_CTX)) {
      for (const m of (kindMats[kind] || [])) {
        m.color.setHex(selectedId ? dim : base);
      }
    }
  }
}

// ---------- muscle list + info card ----------
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
  if (currentSystem !== 'muscles') return null;
  const r = canvas.getBoundingClientRect();
  pointer.set(
    ((clientX - r.left) / r.width) * 2 - 1,
    -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  return hits.length ? (hits[0].object.userData.muscleId ?? null) : null;
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
  if (currentSystem !== 'muscles') return;
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
  if (!(w > 0 && h > 0)) return;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  if (!framed) frameCamera(w / h);
}

document.body.dataset.system = 'muscles';
tabButtons.muscles.classList.add('active');

renderer.setAnimationLoop(() => {
  fitViewport();
  controls.update();
  renderer.render(scene, camera);
});
