# Muscle Atlas

An interactive 3D explorer of the major human muscle groups, built with
[Three.js](https://threejs.org/). A stylized human figure is generated
procedurally — no model files — and every muscle group is clickable:
select one to see its anatomy, primary function, and the exercises that
train it.

## Features

- **Procedural 3D figure** — 14 selectable muscle groups (traps, delts,
  pecs, biceps, triceps, forearms, abs, obliques, lats, lower back,
  glutes, quads, hamstrings, calves) built from capsules and ellipsoids.
- **Click to learn** — anatomy card with Latin name, region, function,
  and training exercises for each group.
- **Orbit controls** — drag to rotate, scroll to zoom, with soft
  auto-rotation until you take over.
- **Zero build step** — plain ES modules with an import map; Three.js
  loads from a CDN. Works on any static host.

## Run locally

Any static file server works (ES modules can't load from `file://`):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Structure

```
index.html      page shell + import map
style.css       UI styling
js/main.js      scene, lights, picking, UI wiring
js/body.js      procedural figure builder
js/muscles.js   muscle group data
```
