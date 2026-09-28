// Every 3D object in the lab is built from primitives here. No external models,
// so the whole scene loads instantly.

import * as THREE from 'three';

const std = (p) => new THREE.MeshStandardMaterial(p);

export const MAT = {
  steel:  () => std({ color: 0x2b3038, metalness: 0.85, roughness: 0.42 }),
  dark:   () => std({ color: 0x14171d, metalness: 0.4,  roughness: 0.62 }),
  alu:    () => std({ color: 0xc3ccd6, metalness: 1.0,  roughness: 0.28 }),
  copper: () => std({ color: 0xc97a45, metalness: 1.0,  roughness: 0.3 }),
  gold:   () => std({ color: 0xd9ad4a, metalness: 1.0,  roughness: 0.32 }),
  pcb:    () => std({ color: 0x14603c, metalness: 0.15, roughness: 0.68 }),
  pcbDark:() => std({ color: 0x0e2b20, metalness: 0.2,  roughness: 0.6 }),
  plastic:() => std({ color: 0x1b1f27, metalness: 0.15, roughness: 0.75 }),
  white:  () => std({ color: 0xdfe6ee, metalness: 0.1,  roughness: 0.55 }),
  desk:   () => std({ color: 0x1a1c22, metalness: 0.2,  roughness: 0.85 }),
  glow:   (c = 0x2ad4ee) => std({ color: 0x0b1116, emissive: c, emissiveIntensity: 0, roughness: 0.4 }),
  glass:  () => new THREE.MeshPhysicalMaterial({
    color: 0x9fc6de, metalness: 0, roughness: 0.06,
    transparent: true, opacity: 0.16, side: THREE.DoubleSide,
  }),
};

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(r, h, material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.castShadow = true;
  return mesh;
}

function anchor(parent, x, y, z) {
  const a = new THREE.Object3D();
  a.position.set(x, y, z);
  parent.add(a);
  return a;
}

/* ------------------------------------------------------------------ desk */

export function makeDesk() {
  const g = new THREE.Group();

  const top = box(26, 0.3, 14, MAT.desk(), -1, -0.15, 0.5);
  top.castShadow = false;
  g.add(top);

  const mat = new THREE.MeshStandardMaterial({ color: 0x0c0e13, roughness: 0.9 });
  g.add(box(26, 0.5, 0.4, mat, -1, -0.45, 7.3));

  const grid = new THREE.GridHelper(26, 26, 0x1d3442, 0x121a22);
  grid.position.set(-1, 0.002, 0.5);
  g.add(grid);

  return g;
}

/* --------------------------------------------------------------- cabinet */

// Origin sits on the desk at the centre of the case footprint.
export function makeCabinet() {
  const g = new THREE.Group();
  const W = 1.9, H = 4.2, D = 4.0, T = 0.08;

  g.add(box(W, T, D, MAT.steel(), 0, T / 2, 0));           // floor
  g.add(box(W, T, D, MAT.steel(), 0, H - T / 2, 0));       // roof
  g.add(box(W, H, T, MAT.steel(), 0, H / 2, -D / 2 + T / 2)); // back
  g.add(box(T, H, D, MAT.steel(), -W / 2 + T / 2, H / 2, 0)); // far side

  // front bezel with a vented intake
  const front = box(W, H, T, MAT.plastic(), 0, H / 2, D / 2 - T / 2);
  g.add(front);
  for (let i = 0; i < 9; i++) {
    g.add(box(1.1, 0.06, 0.03, MAT.dark(), -0.15, 0.55 + i * 0.26, D / 2 + 0.01));
  }

  // tempered glass side panel facing the camera
  const glass = box(0.04, H - 0.3, D - 0.3, MAT.glass(), W / 2 - 0.03, H / 2, 0);
  glass.castShadow = false;
  g.add(glass);

  // drive cage rails at the front bottom
  for (const z of [0.55, 1.85]) {
    g.add(box(1.5, 0.05, 0.06, MAT.steel(), 0.1, 0.42, z));
    g.add(box(1.5, 0.05, 0.06, MAT.steel(), 0.1, 0.92, z));
  }

  // interior light strip, dark until the machine is powered
  const ledMat = MAT.glow(0x2ad4ee);
  const led = box(0.06, 0.06, D - 0.7, ledMat, -0.78, H - 0.22, 0);
  led.castShadow = false;
  g.add(led);

  // power button + activity LED on the front bezel
  const btnMat = MAT.glow(0x2ad4ee);
  const powerButton = cyl(0.13, 0.05, btnMat, 28);
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.5, 3.72, D / 2 + 0.02);
  powerButton.name = 'powerButton';
  g.add(powerButton);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.012, 8, 32),
    MAT.glow(0x2ad4ee)
  );
  ring.position.copy(powerButton.position);
  g.add(ring);

  // rear I/O plate plus the anchors the peripheral cables plug into
  g.add(box(1.4, 1.0, 0.04, MAT.dark(), -0.05, 1.5, -D / 2 - 0.01));
  const ports = {
    video: anchor(g, -0.05, 1.22, -D / 2 - 0.12),
    usb1: anchor(g, -0.42, 1.72, -D / 2 - 0.12),
    usb2: anchor(g, 0.32, 1.72, -D / 2 - 0.12),
  };
  for (const p of Object.values(ports)) {
    const jack = box(0.3, 0.16, 0.1, MAT.gold(), 0, 0, 0.06);
    jack.castShadow = false;
    p.add(jack);
  }

  // feet, so the chassis reads as lifted off the desk
  for (const [x, z] of [[-0.7, -1.6], [0.7, -1.6], [-0.7, 1.6], [0.7, 1.6]]) {
    const foot = cyl(0.12, 0.12, MAT.plastic(), 12);
    foot.position.set(x, -0.06, z);
    g.add(foot);
  }
  g.position.y = 0.12;

  return { group: g, glass, led, ledMat, powerButton, buttonMat: btnMat, ring, ports };
}

/* ----------------------------------------------------------- motherboard */

export function makeMotherboard() {
  const g = new THREE.Group();
  const plate = box(0.09, 3.0, 2.6, MAT.pcb());
  g.add(plate);
  const face = 0.06;

  // CPU socket + retention frame
  g.add(box(0.05, 0.62, 0.62, MAT.dark(), face, 0.7, -0.5));
  g.add(box(0.07, 0.46, 0.46, MAT.gold(), face + 0.02, 0.7, -0.5));

  // DIMM slots
  for (const z of [0.6, 0.82]) {
    g.add(box(0.09, 1.32, 0.09, MAT.dark(), face, 0.55, z));
  }

  // chipset heatsink, VRM bank, PCIe slot, 24 pin power header
  g.add(box(0.12, 0.5, 0.5, MAT.alu(), face + 0.03, -0.55, -0.35));
  for (let i = 0; i < 6; i++) {
    g.add(box(0.07, 0.16, 0.12, MAT.dark(), face, 1.32, -0.85 + i * 0.16));
  }
  g.add(box(0.1, 0.1, 1.15, MAT.steel(), face, -0.2, 0.2));
  g.add(box(0.12, 0.55, 0.16, MAT.plastic(), face, 1.1, 1.14));

  // a few capacitors for texture
  for (const [y, z] of [[0.25, -1.0], [0.05, -1.05], [1.0, -0.15], [-1.1, 0.7]]) {
    const c = cyl(0.06, 0.16, MAT.alu(), 10);
    c.rotation.z = Math.PI / 2;
    c.position.set(face + 0.06, y, z);
    g.add(c);
  }

  // silkscreen highlights
  g.add(box(0.005, 2.8, 0.03, MAT.white(), face, 0, -1.15));
  return g;
}

/* ------------------------------------------------------------------- ram */

export function makeRAM() {
  const g = new THREE.Group();
  for (const z of [-0.11, 0.11]) {
    const stick = new THREE.Group();
    stick.add(box(0.3, 1.3, 0.09, MAT.pcbDark()));
    stick.add(box(0.26, 0.92, 0.13, MAT.alu(), 0.02, 0.1, 0));
    const rgb = box(0.24, 0.07, 0.14, MAT.glow(0x9b7bff), 0.02, 0.6, 0);
    rgb.material.emissiveIntensity = 0.5;
    stick.add(rgb);
    for (let i = 0; i < 10; i++) {
      stick.add(box(0.03, 0.09, 0.06, MAT.gold(), -0.14, -0.6, -0.3 + i * 0.066));
    }
    stick.position.z = z;
    g.add(stick);
  }
  return g;
}

/* ------------------------------------------------------------------- rom */

export function makeROM() {
  const g = new THREE.Group();
  g.add(box(0.11, 0.4, 0.52, MAT.dark()));
  g.add(box(0.005, 0.22, 0.3, MAT.white(), 0.058, 0.02, 0));
  for (let i = 0; i < 4; i++) {
    const z = -0.18 + i * 0.12;
    g.add(box(0.1, 0.03, 0.05, MAT.gold(), -0.02, -0.21, z));
    g.add(box(0.1, 0.03, 0.05, MAT.gold(), -0.02, 0.21, z));
  }
  return g;
}

/* --------------------------------------------------------------- cooling */

// Origin is the face that touches the CPU; the tower grows along +x.
export function makeCooler() {
  const g = new THREE.Group();
  g.add(box(0.1, 0.72, 0.72, MAT.copper(), 0.05, 0, 0));

  for (let i = 0; i < 12; i++) {
    g.add(box(0.46, 0.68, 0.025, MAT.alu(), 0.34, 0.06, -0.31 + i * 0.056));
  }
  for (const z of [-0.2, 0, 0.2]) {
    const pipe = cyl(0.045, 0.5, MAT.copper(), 12);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0.34, 0.3, z);
    g.add(pipe);
  }

  // fan: frame, hub and blades. The blade group is spun in the render loop.
  const frame = new THREE.Group();
  frame.position.x = 0.68;
  g.add(frame);
  for (const [y, z] of [[0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42]]) {
    const horizontal = y !== 0;
    const h = horizontal ? 0.06 : 0.92;
    const d = horizontal ? 0.92 : 0.06;
    frame.add(box(0.08, h, d, MAT.plastic(), 0, y, z));
  }
  const fan = new THREE.Group();
  frame.add(fan);
  const hub = cyl(0.14, 0.07, MAT.plastic(), 16);
  hub.rotation.z = Math.PI / 2;
  fan.add(hub);
  for (let i = 0; i < 7; i++) {
    const blade = box(0.02, 0.32, 0.12, MAT.white());
    blade.material.color.setHex(0xb9c4d0);
    blade.position.set(0, 0.24, 0);
    blade.rotation.x = 0.5;
    const arm = new THREE.Group();
    arm.rotation.x = (i / 7) * Math.PI * 2;
    arm.add(blade);
    fan.add(arm);
  }

  return { group: g, fan };
}

/* ------------------------------------------------------------- hdd / ssd */

export function makeHDD() {
  const g = new THREE.Group();
  g.add(box(1.0, 0.26, 1.45, MAT.alu()));
  g.add(box(0.72, 0.01, 1.1, MAT.white(), 0, 0.135, 0));
  g.add(box(1.0, 0.04, 1.45, MAT.pcbDark(), 0, -0.14, 0));
  for (const [x, z] of [[-0.42, -0.62], [0.42, -0.62], [-0.42, 0.62], [0.42, 0.62]]) {
    const screw = cyl(0.045, 0.02, MAT.steel(), 8);
    screw.position.set(x, 0.14, z);
    g.add(screw);
  }
  g.add(box(0.36, 0.12, 0.06, MAT.plastic(), 0.25, -0.05, 0.75));
  return g;
}

export function makeSSD() {
  const g = new THREE.Group();
  g.add(box(0.72, 0.09, 1.0, MAT.alu()));
  g.add(box(0.5, 0.012, 0.66, MAT.glow(0x2ad4ee), 0, 0.052, 0));
  g.children[1].material.emissiveIntensity = 0.35;
  g.add(box(0.3, 0.05, 0.05, MAT.plastic(), 0.18, -0.01, 0.52));
  return g;
}

/* ----------------------------------------------------------- peripherals */

export function makeMonitor() {
  const g = new THREE.Group();

  const base = cyl(0.8, 0.07, MAT.dark(), 36);
  base.position.y = 0.035;
  g.add(base);
  g.add(box(0.3, 1.25, 0.14, MAT.dark(), 0, 0.68, 0));

  const bezel = box(5.3, 3.15, 0.14, MAT.plastic(), 0, 2.55, 0);
  g.add(bezel);
  g.add(box(5.3, 0.1, 0.16, MAT.dark(), 0, 0.96, 0));

  const screenGeo = new THREE.PlaneGeometry(5.02, 2.82);
  const screenMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 2.6, 0.075);
  g.add(screen);

  return { group: g, screen, screenMat };
}

export function makeKeyboard() {
  const g = new THREE.Group();
  g.add(box(3.7, 0.16, 1.35, MAT.plastic(), 0, 0.08, 0));
  g.add(box(3.5, 0.02, 1.15, MAT.dark(), 0, 0.165, 0));

  const keyGeo = new THREE.BoxGeometry(0.185, 0.07, 0.185);
  const keys = new THREE.InstancedMesh(keyGeo, MAT.dark(), 5 * 15);
  keys.castShadow = true;
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 15; c++) {
      m.makeTranslation(-1.63 + c * 0.233, 0.2, -0.44 + r * 0.22);
      keys.setMatrixAt(i++, m);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  g.add(keys);

  // space bar
  g.add(box(1.1, 0.07, 0.185, MAT.dark(), 0.1, 0.2, 0.66));
  g.rotation.x = -0.04;
  return g;
}

export function makeMouse() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), MAT.plastic());
  body.scale.set(0.8, 0.62, 1.25);
  body.position.y = 0.17;
  body.castShadow = true;
  g.add(body);
  g.add(box(0.47, 0.06, 0.74, MAT.plastic(), 0, 0.04, 0));
  const wheel = cyl(0.07, 0.04, MAT.glow(0x2ad4ee), 16);
  wheel.material.emissiveIntensity = 0.6;
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.32, -0.18);
  g.add(wheel);
  return g;
}

/* ---------------------------------------------------------------- cables */

export function makeCable(from, to, { color = 0x0d1014, sag = 0.9 } = {}) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y = Math.min(from.y, to.y) - sag;
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  const geo = new THREE.TubeGeometry(curve, 40, 0.045, 8, false);
  const mesh = new THREE.Mesh(geo, std({ color, roughness: 0.8, metalness: 0.1 }));
  mesh.castShadow = true;
  return mesh;
}
