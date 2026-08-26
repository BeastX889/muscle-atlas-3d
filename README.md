# Muscle Atlas

An interactive 3D explorer of the major human muscle groups, built with
[Three.js](https://threejs.org/) around a real anatomical model. Two
figures — anterior and posterior, like a classic anatomy plate — with
14 clickable muscle groups: select one to see its anatomy, primary
function, and both bodyweight/calisthenics and weighted exercises that
train it.

## Features

- **Real anatomy** — the model is derived from
  [Z-Anatomy](https://www.z-anatomy.com/) (itself based on
  [BodyParts3D](https://lifesciencedb.jp/bp3d/)): ~500 individual
  muscles merged into 14 selectable groups, plus the remaining
  musculature, tendinous structures, and full skeleton as context.
- **Five system tabs**, each with its own named, clickable structures:
  Muscles (14 groups), Skeleton (11), Nerves (19 — from the cerebrum and
  brainstem down to the sciatic and fibular nerves), Tendons (11 tendons
  and ligament groups), and Fascia (14 sheets, aponeuroses, and
  retinacula).
- **X-ray context** — bone is drawn see-through on the nerve, tendon,
  and fascia tabs, so structures inside it (the brain in the skull, the
  cruciates in the knee) are visible rather than buried; on the fascia
  tab the unpicked sleeves turn to glass around a selection.
- **In combat sports** — every structure carries a section on how it
  gets injured in MMA, wrestling and boxing, and what that costs: the
  armbar's effect on the elbow's collateral ligaments, checked low kicks
  and tibial fracture, the brachial plexus stinger, cumulative head
  trauma and CTE, rib cartilage injuries, ACL timelines.
- **Click to learn** — occlusion-aware picking; an anatomy card with
  Latin name, region, function, and exercise lists (bodyweight &
  calisthenics first, then weighted).
- **Dark écorché look** — near-black scene, deep red musculature, cream
  bone and tendon; selecting a structure lights it and dims the rest.
- **No CDN, no build step** — plain ES modules with an import map;
  Three.js and the Draco decoder are vendored in `vendor/`, so a blocked
  or slow third-party host cannot leave the page without its anatomy.
  Works on any static host.

## Run locally

Any static file server works (ES modules can't load from `file://`):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Structure

```
index.html        page shell + import map
style.css         UI styling
js/main.js        scene, model loading, picking, UI wiring
js/muscles.js     muscle group data
assets/body.glb   anatomical model (Draco-compressed, ~1 MB)
```

## Model license & attribution

`assets/body.glb` is a derivative of the
[Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy)
Blender atlas (which is based on BodyParts3D, © The Database Center
for Life Science), processed for the web: muscles bucketed into 14
groups, geometry decimated, and exported to glTF. In compliance with
its license, the model file is distributed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
The site's own code is separate from the model asset.
