import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MUSCLES, MUSCLE_ORDER } from './muscles.js';
import { SKELETON, SKELETON_ORDER, NERVES, NERVES_ORDER,
         FASCIA, FASCIA_ORDER } from './systems.js';

// ---------- system definitions ----------
const SYSTEM_DATA = {
  muscles: { label: 'Muscles', parts: MUSCLES, order: MUSCLE_ORDER },
  skeleton: { label: 'Skeleton', parts: SKELETON, order: SKELETON_ORDER },
  nerves: { label: 'Nerves', parts: NERVES, order: NERVES_ORDER },
  fascia: { label: 'Tendons & Fascia', parts: FASCIA, order: FASCIA_ORDER },
};

function systemOf(id) {
  if (id.startsWith('sk_')) return 'skeleton';
  if (id.startsWith('nv_')) return 'nerves';
  if (id.startsWith('fs_')) return 'fascia';
  return 'muscles';
}

// Selection palette of each system when its tab is active.
const ACTIVE_PAL = {
  muscles: { base: 0x94343c, dim: 0x45262c, sel: 0xc4484e, glow: 0xff8c2e, glowInt: 0.5 },
  skeleton: { base: 0xd6cbb2, dim: 0x554f42, sel: 0xf2e7c6, glow: 0xff8c2e, glowInt: 0.35 },
  nerves: { base: 0xe8d894, dim: 0x5a5340, sel: 0xffe9a0, glow: 0xff9e36, glowInt: 0.9 },
  fascia: { base: 0xa89e8c, dim: 0x413d37, sel: 0xd8cdb4, glow: 0xff8c2e, glowInt: 0.4 },
};
const NERVE_EMISSIVE = 0xb09a52;

// What each tab shows: which systems' groups, which context kinds,
// and their [base, dimmed-while-selection] colors.
const TABS = {
  muscles: {
    groups: ['muscles', 'skeleton'],
    ctx: { other: [0x5a241d, 0x331c17], tendon: [0x2e2e36, 0x25252b], bones: [0x222229, 0x1b1b21] },
    ghostBone: [0x222229, 0x1b1b21],
  },
  skeleton: {
    groups: ['skeleton'],
    ctx: { bones: [0xd6cbb2, 0x554f42] },
  },
  nerves: {
    groups: ['nerves', 'skeleton'],
    ctx: { nerves: [0xe8d894, 0x5a5340], bones: [0x2c2c36, 0x24242c] },
    ghostBone: [0x2c2c36, 0x24242c],
  },
  fascia: {
    groups: ['fascia', 'skeleton'],
    ctx: { fascia: [0x8d8577, 0x3d3a34], tendon: [0xcdbf9d, 0x4e4839], bones: [0x2c2c36, 0x24242c] },
    ghostBone: [0x2c2c36, 0x24242c],
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

const VIEW_DIR = new THREE.Vector3(0.24, 0.1, 0.97).normalize();
// Fraction of the frame the figures should occupy at rest, and how far
// down the frame to bias them so the heads clear the title and tabs.
const FILL_H = 0.90;
const FILL_W = 0.94;
const DROP = 0.03;

// Bounds of the loaded pair, filled in once the model arrives.
const modelBox = new THREE.Box3();
const fallbackBox = new THREE.Box3(
  new THREE.Vector3(-0.68, 0.0, -0.22), new THREE.Vector3(0.68, 1.71, 0.22));
let userMoved = false;

// Fraction of the viewport the box covers, as [width, height] in 0..1.
const _v = new THREE.Vector3();
function projectedExtent(box) {
  camera.updateMatrixWorld(true);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  camera.updateProjectionMatrix();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        _v.set(x, y, z).project(camera);
        minX = Math.min(minX, _v.x); maxX = Math.max(maxX, _v.x);
        minY = Math.min(minY, _v.y); maxY = Math.max(maxY, _v.y);
      }
    }
  }
  return [(maxX - minX) / 2, (maxY - minY) / 2];
}

// Frame the pair from its REAL bounds. The analytic distance is only a
// starting guess — the view is tilted, so the true projected extent is
// measured and the distance corrected until the figures fill the frame.
function frameCamera() {
  const real = modelBox.isEmpty() ? fallbackBox : modelBox;
  const size = real.getSize(new THREE.Vector3());
  const center = real.getCenter(new THREE.Vector3());
  const aspect = isFinite(camera.aspect) && camera.aspect > 0
    ? camera.aspect : 16 / 9;

  // Fit against a yaw-invariant proxy — a box circumscribing the pair's
  // turning circle. Fitting the raw bounds would frame only the current
  // angle, and auto-rotation would then push feet out of frame.
  const r = Math.hypot(size.x / 2, size.z / 2);
  const box = new THREE.Box3(
    new THREE.Vector3(center.x - r, real.min.y, center.z - r),
    new THREE.Vector3(center.x + r, real.max.y, center.z + r));

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  let dist = Math.max((size.y / 2) / Math.tan(vFov / 2),
                      (size.x / 2) / Math.tan(hFov / 2)) + size.z / 2;

  controls.target.copy(center);
  for (let i = 0; i < 4; i++) {
    camera.position.copy(center).addScaledVector(VIEW_DIR, dist);
    const [w, h] = projectedExtent(box);
    const over = Math.max(w / FILL_W, h / FILL_H);
    if (!isFinite(over) || over <= 0) break;
    if (Math.abs(over - 1) < 0.005) break;
    dist *= over;
  }
  // Aim above the model's centre so it sits lower in the frame, clear of
  // the title and tab bar; the camera follows, so the fit is unchanged.
  const drop = DROP * 2 * dist * Math.tan(vFov / 2);
  controls.target.set(center.x, center.y + drop, center.z);
  camera.position.copy(controls.target).addScaledVector(VIEW_DIR, dist);

  controls.minDistance = 0.35;
  controls.maxDistance = dist * 2.4;
  controls.update();
}

controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;
frameCamera();

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

// Half the gap between the two figures — tight enough that the pair
// reads as one plate without the arms touching.
const FIG_X = 0.34;

for (const x of [-FIG_X, FIG_X]) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.508, 96),
    new THREE.MeshBasicMaterial({ color: 0x3a3a44, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.002, 0);
  scene.add(ring);
}

// ---------- anatomy model (Z-Anatomy, CC BY-SA 4.0) ----------
const groupMats = {};   // partId -> shared material (both figures)
const groupMeshes = {}; // partId -> meshes
const kindMats = {};    // context kind -> [materials]
const kindMeshes = {};  // context kind -> [meshes]
const pickables = [];   // every mesh, so rays respect occlusion
let modelReady = false;

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

const loadingEl = document.getElementById('loading');
const CTX_KINDS = ['other', 'tendon', 'bones', 'fascia', 'nerves'];

function isPartId(name) {
  for (const sys of Object.values(SYSTEM_DATA)) {
    if (sys.parts[name]) return true;
  }
  return false;
}

loader.load('assets/body.glb', (gltf) => {
  const proto = gltf.scene;

  // One shared material per part, so a tint change hits both figures.
  proto.traverse((o) => {
    if (!o.isMesh) return;
    // Importer splits multi-primitive nodes into "name_1", "name_2" children.
    const name = (o.name || o.parent?.name || '').replace(/_\d+$/, '');
    if (isPartId(name)) {
      if (!groupMats[name]) {
        groupMats[name] = new THREE.MeshStandardMaterial({
          color: 0x808080, roughness: 0.55, metalness: 0.02,
          side: THREE.DoubleSide,
        });
      }
      o.material = groupMats[name];
      o.userData.partId = name;
    } else if (CTX_KINDS.includes(name)) {
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
  for (const [x, ry] of [[-FIG_X, 0], [FIG_X, Math.PI]]) {
    const fig = proto.clone(true);
    fig.position.x = x;
    fig.rotation.y = ry;
    scene.add(fig);
    fig.updateWorldMatrix(true, true);
    modelBox.expandByObject(fig);
    fig.traverse((o) => {
      if (!o.isMesh) return;
      pickables.push(o);
      if (o.userData.partId) (groupMeshes[o.userData.partId] ||= []).push(o);
      else if (o.userData.kind) (kindMeshes[o.userData.kind] ||= []).push(o);
    });
  }

  modelReady = true;
  if (loadingEl) loadingEl.remove();
  setSystem(currentSystem);
  if (!userMoved) frameCamera();
}, undefined, (err) => {
  console.error('Model load failed', err);
  if (loadingEl) loadingEl.textContent = 'Could not load the 3D model — check your connection and reload.';
});

// ---------- selection / hover state ----------
let currentSystem = 'muscles';
let selectedId = null;
let hoveredId = null;

function applyStyles() {
  if (!modelReady) return;
  const tab = TABS[currentSystem];

  for (const [id, m] of Object.entries(groupMats)) {
    const sys = systemOf(id);
    m.emissive.setScalar(0);
    m.emissiveIntensity = 0;
    if (sys === currentSystem) {
      const pal = ACTIVE_PAL[sys];
      if (id === selectedId) {
        m.color.setHex(pal.sel);
        m.emissive.setHex(pal.glow);
        m.emissiveIntensity = pal.glowInt;
      } else if (id === hoveredId) {
        m.color.setHex(selectedId ? pal.dim : pal.base);
        m.color.lerp(new THREE.Color(pal.sel), 0.4);
        m.emissive.setHex(pal.glow);
        m.emissiveIntensity = 0.14;
      } else {
        m.color.setHex(selectedId ? pal.dim : pal.base);
        if (sys === 'nerves') {
          m.emissive.setHex(NERVE_EMISSIVE);
          m.emissiveIntensity = selectedId ? 0.15 : 0.9;
        }
      }
    } else if (sys === 'skeleton' && tab.ghostBone) {
      m.color.setHex(selectedId ? tab.ghostBone[1] : tab.ghostBone[0]);
    }
  }

  for (const [kind, pair] of Object.entries(tab.ctx)) {
    for (const m of (kindMats[kind] || [])) {
      m.color.setHex(selectedId ? pair[1] : pair[0]);
      if (kind === 'nerves' && currentSystem === 'nerves') {
        m.emissive.setHex(NERVE_EMISSIVE);
        m.emissiveIntensity = selectedId ? 0.15 : 0.9;
      } else {
        m.emissive.setScalar(0);
        m.emissiveIntensity = 0;
      }
    }
  }
}

// ---------- system tabs ----------
const tabsEl = document.getElementById('systemTabs');
const tabButtons = {};

for (const [sys, def] of Object.entries(SYSTEM_DATA)) {
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
  select(null);
  buildList();
  if (!modelReady) return;

  const tab = TABS[sys];
  for (const [id, meshes] of Object.entries(groupMeshes)) {
    const visible = tab.groups.includes(systemOf(id));
    for (const m of meshes) m.visible = visible;
  }
  for (const [kind, meshes] of Object.entries(kindMeshes)) {
    const visible = tab.ctx[kind] !== undefined;
    for (const m of meshes) m.visible = visible;
  }
  applyStyles();
}

// ---------- part list + info card ----------
const listEl = document.getElementById('muscleList');
const card = document.getElementById('infoCard');
let listButtons = {};

function buildList() {
  const def = SYSTEM_DATA[currentSystem];
  listEl.innerHTML = '';
  listButtons = {};
  for (const id of def.order) {
    // skip parts that didn't make it into the model
    if (modelReady && !groupMats[id]) continue;
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="tick"></span>${def.parts[id].name}`;
    btn.addEventListener('click', () => select(selectedId === id ? null : id));
    listEl.appendChild(btn);
    listButtons[id] = btn;
  }
}

document.getElementById('infoClose').addEventListener('click', () => select(null));

function select(id) {
  selectedId = id;
  applyStyles();
  for (const [pid, btn] of Object.entries(listButtons)) {
    btn.classList.toggle('active', pid === id);
  }
  if (!id) {
    card.hidden = true;
    return;
  }
  const m = SYSTEM_DATA[currentSystem].parts[id];
  document.getElementById('infoRegion').textContent = m.region;
  document.getElementById('infoName').textContent = m.name;
  document.getElementById('infoLatin').textContent = m.latin;
  document.getElementById('infoDesc').textContent = m.desc;
  document.getElementById('infoFn').textContent = m.fn;
  const hasEx = !!m.bodyweight;
  document.getElementById('bwHead').hidden = !hasEx;
  document.getElementById('wtHead').hidden = !hasEx;
  document.getElementById('infoBodyweight').innerHTML =
    hasEx ? m.bodyweight.map((e) => `<li>${e}</li>`).join('') : '';
  document.getElementById('infoWeights').innerHTML =
    hasEx ? m.weights.map((e) => `<li>${e}</li>`).join('') : '';
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
  for (const hit of raycaster.intersectObjects(pickables, false)) {
    if (!hit.object.visible) continue;
    const id = hit.object.userData.partId;
    // only parts of the active system are selectable; anything else occludes
    return (id && systemOf(id) === currentSystem) ? id : null;
  }
  return null;
}

let downPos = null;
canvas.addEventListener('pointerdown', (e) => {
  controls.autoRotate = false;
  userMoved = true;
  downPos = [e.clientX, e.clientY];
});

canvas.addEventListener('wheel', () => { userMoved = true; }, { passive: true });

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
  if (!(w > 0 && h > 0)) return;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    // Re-fit on a viewport change until the viewer takes over the camera.
    if (!userMoved) frameCamera();
  }
}

document.body.dataset.system = 'muscles';
tabButtons.muscles.classList.add('active');
buildList();

renderer.setAnimationLoop(() => {
  fitViewport();
  controls.update();
  renderer.render(scene, camera);
});
