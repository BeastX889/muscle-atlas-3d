// Procedural stylized human figure. Every muscle mesh carries
// userData.muscleId matching a key in muscles.js; core body parts don't.
import * as THREE from 'three';

const MUSCLE_COLOR = 0x94343c;
const CORE_COLOR = 0x1d1d24;

const UP = new THREE.Vector3(0, 1, 0);

function muscleMaterial() {
  return new THREE.MeshStandardMaterial({
    color: MUSCLE_COLOR,
    roughness: 0.48,
    metalness: 0.06,
  });
}

function coreMaterial() {
  return new THREE.MeshStandardMaterial({
    color: CORE_COLOR,
    roughness: 0.85,
    metalness: 0.0,
  });
}

// Capsule oriented from p1 to p2.
function capsuleFromTo(p1, p2, radius) {
  const a = new THREE.Vector3(...p1);
  const b = new THREE.Vector3(...p2);
  const dir = b.clone().sub(a);
  const len = Math.max(dir.length() - radius * 2, 0.01);
  const geo = new THREE.CapsuleGeometry(radius, len, 6, 16);
  const mesh = new THREE.Mesh(geo);
  mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
  return mesh;
}

// Ellipsoid lump: unit sphere scaled to (sx, sy, sz) at pos.
function lump(pos, scale, rot) {
  const geo = new THREE.SphereGeometry(1, 24, 18);
  const mesh = new THREE.Mesh(geo);
  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  if (rot) mesh.rotation.set(...rot);
  return mesh;
}

export function buildBody() {
  const group = new THREE.Group();
  const registry = {}; // muscleId -> meshes[]
  const pickables = [];

  function addMuscle(id, mesh) {
    mesh.material = muscleMaterial();
    mesh.userData.muscleId = id;
    mesh.castShadow = true;
    (registry[id] ||= []).push(mesh);
    pickables.push(mesh);
    group.add(mesh);
  }

  function addCore(mesh) {
    mesh.material = coreMaterial();
    mesh.castShadow = true;
    group.add(mesh);
  }

  // Build one side (sign = +1 right, -1 left), plus centered parts once.
  for (const s of [1, -1]) {
    const shoulder = [0.20 * s, 1.47, 0];
    const elbow = [0.27 * s, 1.16, 0.01];
    const wrist = [0.32 * s, 0.90, 0.03];
    const hip = [0.10 * s, 0.93, 0];
    const knee = [0.11 * s, 0.52, 0.01];
    const ankle = [0.11 * s, 0.09, -0.01];

    // --- muscles ---
    addMuscle('delts', lump([0.21 * s, 1.455, 0], [0.082, 0.094, 0.082]));

    addMuscle('traps', lump([0.10 * s, 1.515, -0.035], [0.088, 0.048, 0.058], [0, 0, -0.5 * s]));

    addMuscle('pecs', lump([0.095 * s, 1.375, 0.092], [0.102, 0.082, 0.048], [0, 0, -0.22 * s]));

    addMuscle('biceps', capsuleFromTo(
      [0.215 * s, 1.42, 0.035], [0.26 * s, 1.20, 0.045], 0.042));

    addMuscle('triceps', capsuleFromTo(
      [0.215 * s, 1.42, -0.035], [0.26 * s, 1.19, -0.03], 0.045));

    addMuscle('forearms', capsuleFromTo(
      [elbow[0], elbow[1] - 0.01, elbow[2]], wrist, 0.038));

    addMuscle('obliques', lump([0.115 * s, 1.09, 0.04], [0.045, 0.115, 0.075]));

    addMuscle('lats', lump([0.10 * s, 1.22, -0.088], [0.084, 0.15, 0.046], [0, 0, 0.18 * s]));

    addMuscle('lowback', capsuleFromTo(
      [0.032 * s, 1.17, -0.104], [0.032 * s, 0.99, -0.098], 0.028));

    // abs: 4 rows of segments per side
    const absRows = [
      [1.272, 0.042],
      [1.186, 0.042],
      [1.100, 0.042],
      [1.006, 0.052],
    ];
    for (const [y, sy] of absRows) {
      addMuscle('abs', lump([0.036 * s, y, 0.104], [0.034, sy, 0.028]));
    }

    addMuscle('glutes', lump([0.088 * s, 0.86, -0.092], [0.094, 0.104, 0.086]));

    addMuscle('quads', capsuleFromTo(
      [0.095 * s, 0.90, 0.045], [0.105 * s, 0.55, 0.05], 0.06));
    addMuscle('quads', capsuleFromTo(
      [0.135 * s, 0.87, 0.02], [0.125 * s, 0.57, 0.03], 0.045));

    addMuscle('hams', capsuleFromTo(
      [0.10 * s, 0.88, -0.048], [0.11 * s, 0.55, -0.035], 0.055));

    addMuscle('calves', capsuleFromTo(
      [0.11 * s, 0.47, -0.038], [0.11 * s, 0.16, -0.025], 0.042));
    addMuscle('calves', lump([0.11 * s, 0.42, -0.05], [0.05, 0.075, 0.05]));

    // --- core limbs ---
    addCore(capsuleFromTo(shoulder, elbow, 0.036));
    addCore(lump([0.335 * s, 0.825, 0.04], [0.04, 0.075, 0.05]));   // hand
    addCore(capsuleFromTo(hip, knee, 0.054));
    addCore(capsuleFromTo(knee, ankle, 0.037));
    addCore(lump([0.11 * s, 0.045, 0.045], [0.048, 0.036, 0.11]));  // foot
  }

  // --- centered muscles ---
  addMuscle('traps', lump([0, 1.40, -0.108], [0.062, 0.13, 0.028]));

  // --- centered core ---
  addCore(lump([0, 1.685, 0.005], [0.096, 0.114, 0.104]));          // head
  {
    const neck = capsuleFromTo([0, 1.53, 0], [0, 1.615, 0.01], 0.046);
    addCore(neck);
  }
  {
    const thorax = capsuleFromTo([0, 1.16, 0], [0, 1.44, 0], 0.125);
    thorax.scale.z = 0.62;
    addCore(thorax);
  }
  {
    const pelvis = capsuleFromTo([0, 0.92, 0], [0, 1.04, 0], 0.112);
    pelvis.scale.z = 0.72;
    addCore(pelvis);
  }

  return { group, registry, pickables };
}
