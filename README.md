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
- **System tabs** — Muscles, Skeleton, Nerves (brain, spinal cord, and
  peripheral nerves over a ghost skeleton), and Tendons & Fascia (the
  deep fascia envelope, septa, sheaths, and tendinous structures).
- **Click to learn** — occlusion-aware picking; an anatomy card with
  Latin name, region, function, and exercise lists (bodyweight &
  calisthenics first, then weighted).
- **Anatomy-plate look** — paper background, red muscles, cream bone
  and tendon; selecting a group dims everything else.
- **Zero build step** — plain ES modules with an import map; Three.js
  and the Draco decoder load from CDNs. Works on any static host.

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
