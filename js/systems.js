// Selectable parts for the non-muscle system tabs.
// Ids match the GLB node names (sk_ / nv_ / fs_ prefixes).

export const SKELETON = {
  sk_skull: {
    name: 'Skull & teeth',
    latin: 'Cranium',
    region: 'Head',
    desc: 'Twenty-two bones — most fused at sutures — plus the jaw and thirty-two teeth. The only freely movable skull bone is the mandible.',
    fn: 'Encases the brain, frames the face and airways, and anchors the chewing muscles.',
  },
  sk_spine: {
    name: 'Spine',
    latin: 'Columna vertebralis',
    region: 'Axial skeleton',
    desc: 'Thirty-three vertebrae: 7 cervical, 12 thoracic, 5 lumbar, plus the fused sacrum and coccyx, stacked on shock-absorbing discs.',
    fn: 'Bears the trunk, protects the spinal cord, and lets the torso bend and twist.',
  },
  sk_ribs: {
    name: 'Rib cage',
    latin: 'Cavea thoracis',
    region: 'Thorax',
    desc: 'Twelve pairs of ribs joining the sternum through costal cartilage — a flexible cage that moves with every breath.',
    fn: 'Shields the heart and lungs and powers the mechanics of breathing.',
  },
  sk_shoulder: {
    name: 'Shoulder girdle',
    latin: 'Cingulum pectorale',
    region: 'Shoulder',
    desc: 'Clavicle and scapula — the only bony link from arm to trunk; the shoulder blade glides freely over the rib cage.',
    fn: 'Suspends the arm and gives the shoulder its huge range of motion.',
  },
  sk_arm: {
    name: 'Humerus',
    latin: 'Humerus',
    region: 'Upper arm',
    desc: 'The long bone of the upper arm — ball-and-socket into the scapula above, hinge with the forearm below.',
    fn: 'Lever for every press, pull, and throw.',
  },
  sk_forearm: {
    name: 'Radius & ulna',
    latin: 'Radius et ulna',
    region: 'Forearm',
    desc: 'Paired forearm bones that cross over each other when the palm turns down.',
    fn: 'Hinge the elbow and rotate the wrist through pronation and supination.',
  },
  sk_hand: {
    name: 'Hand bones',
    latin: 'Ossa manus',
    region: 'Hand',
    desc: 'Twenty-seven bones per hand: eight carpals, five metacarpals, and fourteen phalanges.',
    fn: 'A chain of small joints that trades power for precision grip.',
  },
  sk_pelvis: {
    name: 'Pelvis',
    latin: 'Cingulum pelvicum',
    region: 'Hip',
    desc: 'Two hip bones — each a fusion of ilium, ischium, and pubis — closing the ring with the sacrum behind.',
    fn: 'Transfers the trunk’s weight into the legs and anchors the hip muscles.',
  },
  sk_femur: {
    name: 'Femur & patella',
    latin: 'Femur, patella',
    region: 'Thigh',
    desc: 'The longest, strongest bone in the body, plus the kneecap — a sesamoid bone floating inside the quadriceps tendon.',
    fn: 'Carries the body through stance and stride; the patella boosts the quads’ leverage.',
  },
  sk_leg: {
    name: 'Tibia & fibula',
    latin: 'Tibia et fibula',
    region: 'Lower leg',
    desc: 'The weight-bearing shin bone and its slender partner, splinted together by an interosseous membrane.',
    fn: 'The tibia carries the load; the fibula anchors muscle and braces the ankle.',
  },
  sk_foot: {
    name: 'Foot bones',
    latin: 'Ossa pedis',
    region: 'Foot',
    desc: 'Twenty-six bones per foot: seven tarsals, five metatarsals, fourteen phalanges — arranged into three springy arches.',
    fn: 'Absorbs impact and turns each step into an elastic push-off.',
  },
};

export const SKELETON_ORDER = [
  'sk_skull', 'sk_spine', 'sk_ribs', 'sk_shoulder', 'sk_arm', 'sk_forearm',
  'sk_hand', 'sk_pelvis', 'sk_femur', 'sk_leg', 'sk_foot',
];

export const NERVES = {
  nv_brain: {
    name: 'Brain',
    latin: 'Encephalon',
    region: 'Central nervous system',
    desc: 'Roughly 86 billion neurons in about 1.4 kg — cerebrum, cerebellum, and brainstem.',
    fn: 'Runs everything: thought, movement, senses, memory, and the automatic housekeeping of the body.',
  },
  nv_cord: {
    name: 'Spinal cord',
    latin: 'Medulla spinalis',
    region: 'Central nervous system',
    desc: 'The information highway running through the vertebral canal, fanning out below into the cauda equina.',
    fn: 'Carries traffic between brain and body and handles fast reflexes on its own.',
  },
  nv_cranial: {
    name: 'Cranial nerves',
    latin: 'Nervi craniales',
    region: 'Head & neck',
    desc: 'Twelve pairs leaving the brain directly — smell, sight, eye movement, facial expression, taste, hearing, and the wandering vagus.',
    fn: 'Wire the head and face, and via the vagus reach the heart, lungs, and gut.',
  },
  nv_brachial: {
    name: 'Arm nerves',
    latin: 'Plexus brachialis',
    region: 'Shoulder & arm',
    desc: 'Nerve roots C5–T1 braid into the brachial plexus, then split into the median, ulnar, and radial nerves.',
    fn: 'Drive every muscle of the arm and hand and report its sensation.',
  },
  nv_thoracic: {
    name: 'Thoracic nerves',
    latin: 'Nervi intercostales',
    region: 'Chest wall',
    desc: 'Intercostal nerves running in the groove of each rib, plus the phrenic nerve descending to the diaphragm.',
    fn: 'Power the breathing muscles and sense the chest wall.',
  },
  nv_lumbar: {
    name: 'Lumbar plexus',
    latin: 'Plexus lumbalis',
    region: 'Lower back & thigh',
    desc: 'Roots L1–L4 weaving into the femoral and obturator nerves.',
    fn: 'Drive the front and inner thigh — the femoral nerve is what straightens your knee.',
  },
  nv_sacral: {
    name: 'Sciatic & leg nerves',
    latin: 'Plexus sacralis',
    region: 'Hip & leg',
    desc: 'The sacral plexus gives rise to the sciatic nerve — the largest nerve in the body, nearly finger-thick — branching into tibial and fibular nerves.',
    fn: 'Power the hamstrings and everything below the knee.',
  },
};

export const NERVES_ORDER = [
  'nv_brain', 'nv_cord', 'nv_cranial', 'nv_brachial', 'nv_thoracic',
  'nv_lumbar', 'nv_sacral',
];

export const FASCIA = {
  fs_thoraco: {
    name: 'Thoracolumbar fascia',
    latin: 'Fascia thoracolumbalis',
    region: 'Lower back',
    desc: 'The diamond-shaped sheet over the lower back where lats, glutes, and spinal muscles all take hold.',
    fn: 'Transfers force diagonally between opposite lat and glute — the body’s cross-brace.',
  },
  fs_itband: {
    name: 'Iliotibial band',
    latin: 'Tractus iliotibialis',
    region: 'Outer thigh',
    desc: 'A thick strap of fascia running from the hip crest down to the shin bone.',
    fn: 'Stabilizes the knee in stance and stores elastic energy while running.',
  },
  fs_achilles: {
    name: 'Achilles tendon',
    latin: 'Tendo calcaneus',
    region: 'Ankle',
    desc: 'The strongest tendon in the body, joining both calf muscles to the heel bone.',
    fn: 'The spring of every step and jump — it can take loads of several times body weight.',
  },
  fs_patellar: {
    name: 'Patellar tendon',
    latin: 'Ligamentum patellae',
    region: 'Knee',
    desc: 'The continuation of the quadriceps tendon below the kneecap, inserting on the shin.',
    fn: 'Delivers the quads’ force across the knee to straighten the leg.',
  },
  fs_abdominal: {
    name: 'Abdominal aponeuroses',
    latin: 'Vagina musculi recti abdominis',
    region: 'Abdomen',
    desc: 'The flat tendon sheets of the abdominal wall — the rectus sheath, the linea alba down the midline, and the inguinal ligament below.',
    fn: 'Wrap and brace the six-pack, tying the abdominal wall into one corset.',
  },
  fs_plantar: {
    name: 'Plantar fascia',
    latin: 'Aponeurosis plantaris',
    region: 'Sole of foot',
    desc: 'A fan of tough fascia from heel to toes that supports the arch of the foot.',
    fn: 'Tightens as the toes bend back, turning the foot into a rigid lever for push-off.',
  },
  fs_palmar: {
    name: 'Palmar fascia',
    latin: 'Aponeurosis palmaris',
    region: 'Palm',
    desc: 'The tough triangular sheet under the skin of the palm.',
    fn: 'Anchors the palm’s skin so your grip doesn’t slide.',
  },
  fs_retinacula: {
    name: 'Retinacula',
    latin: 'Retinacula',
    region: 'Wrist & ankle',
    desc: 'Straps of thickened fascia bridging the wrist and ankle.',
    fn: 'Hold the long tendons close to the joint so they don’t bowstring.',
  },
  fs_galea: {
    name: 'Galea aponeurotica',
    latin: 'Galea aponeurotica',
    region: 'Scalp',
    desc: 'The tendon sheet capping the skull, linking the forehead and back-of-head muscles.',
    fn: 'Lets the scalp slide and the eyebrows rise.',
  },
  fs_nuchal: {
    name: 'Nuchal ligament',
    latin: 'Ligamentum nuchae',
    region: 'Neck',
    desc: 'An elastic midline ligament from skull to the lower neck vertebrae.',
    fn: 'Helps carry the head’s weight and gives neck muscles a midline anchor.',
  },
  fs_lata: {
    name: 'Fascia lata',
    latin: 'Fascia lata',
    region: 'Thigh',
    desc: 'The deep-fascia stocking wrapping the whole thigh; the iliotibial band is its thickened side.',
    fn: 'Compresses the thigh muscles into compartments, improving their pumping and force transfer.',
  },
};

export const FASCIA_ORDER = [
  'fs_thoraco', 'fs_itband', 'fs_achilles', 'fs_patellar', 'fs_abdominal',
  'fs_plantar', 'fs_palmar', 'fs_retinacula', 'fs_galea', 'fs_nuchal',
  'fs_lata',
];
