import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as P from './parts.js';
import { MonitorScreen } from './screen.js';
import { COMPONENTS, PERIPHERALS, OS_QUESTION, OS_CHOICES } from './quiz.js';
import { tween, slideIn, flash, wait, updateTweens, easeInOutCubic } from './anim.js';

/* =========================================================== renderer */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090d);
scene.fog = new THREE.Fog(0x07090d, 26, 68);

const BASE_FOV = 42;
const camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 200);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 5;
controls.maxDistance = 44;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.target.set(-1, 2, 0);

/* ============================================================== lights */

scene.add(new THREE.HemisphereLight(0x9fc6ff, 0x0a0d12, 0.7));

const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(7, 12, 9);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 40;
key.shadow.camera.left = -14;
key.shadow.camera.right = 14;
key.shadow.camera.top = 14;
key.shadow.camera.bottom = -14;
key.shadow.bias = -0.0008;
scene.add(key);

const rim = new THREE.PointLight(0x2ad4ee, 55, 24);
rim.position.set(-9, 5, -6);
scene.add(rim);

const fill = new THREE.PointLight(0xffb06b, 22, 22);
fill.position.set(6, 3.5, 6);
scene.add(fill);

scene.add(P.makeDesk());

/* ================================================== build every object */

const cab = P.makeCabinet();
const cooler = P.makeCooler();
const monitor = P.makeMonitor();
const screen = new MonitorScreen();
monitor.screenMat.map = screen.texture;

const CAB_POS = new THREE.Vector3(-4, 0.12, 0);
const CAB_ROT = 0.24;

cab.group.rotation.y = CAB_ROT;
cab.group.position.copy(CAB_POS);
cab.group.visible = false;
scene.add(cab.group);

// Local space of the cabinet: x -0.95..0.95, y 0..4.2, z -2..2.
// Parts fly in from outside the open glass side (+x).
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const parts = {
  cabinet: {
    object: cab.group, parent: scene,
    target: CAB_POS, from: V(-4, 6.5, 0), baseRot: CAB_ROT, spin: 0.9, arc: 0, duration: 1.4,
  },
  motherboard: {
    object: P.makeMotherboard(), parent: cab.group,
    target: V(-0.78, 2.35, -0.05), from: V(2.4, 3.4, 0.9), spin: 0.8,
  },
  ram: {
    object: P.makeRAM(), parent: cab.group,
    target: V(-0.55, 2.9, 0.71), from: V(2.0, 4.1, 0.71), spin: 0.5, arc: 0.3,
  },
  rom: {
    object: P.makeROM(), parent: cab.group,
    target: V(-0.68, 1.35, -0.95), from: V(1.9, 2.4, -0.95), spin: 1.2, arc: 0.3,
  },
  cooling: {
    object: cooler.group, parent: cab.group,
    target: V(-0.7, 3.05, -0.55), from: V(2.2, 3.6, -0.55), spin: 0.6, arc: 0.3,
  },
  hdd: {
    object: P.makeHDD(), parent: cab.group,
    target: V(0.1, 0.58, 1.2), from: V(2.6, 1.5, 1.2), spin: 0.4, arc: 0.25,
  },
  ssd: {
    object: P.makeSSD(), parent: cab.group,
    target: V(0.1, 0.99, 1.2), from: V(2.6, 2.0, 1.2), spin: 0.4, arc: 0.25,
  },
  monitor: {
    object: monitor.group, parent: scene,
    target: V(1.9, 0, -1.4), from: V(1.9, 4.4, -1.4), baseRot: -0.2, spin: 0.5, arc: 0, duration: 1.2,
  },
  keyboard: {
    object: P.makeKeyboard(), parent: scene,
    target: V(1.5, 0.02, 2.7), from: V(1.5, 3.0, 2.7), baseRot: -0.07, spin: 0.4, arc: 0,
  },
  mouse: {
    object: P.makeMouse(), parent: scene,
    target: V(4.1, 0.02, 2.8), from: V(4.1, 2.6, 2.8), baseRot: -0.15, spin: 0.6, arc: 0,
  },
};

for (const [id, part] of Object.entries(parts)) {
  if (id === 'cabinet') continue;
  part.object.visible = false;
  part.object.position.copy(part.from);
  part.parent.add(part.object);
}

// cables are created when a peripheral is connected
const PLUGS = {
  monitor: { port: () => cab.ports.video, local: V(0, 1.05, -0.16), sag: 0.55, color: 0x0b0e13 },
  keyboard: { port: () => cab.ports.usb1, local: V(-1.2, 0.12, -0.6), sag: -0.35, color: 0x141922 },
  mouse: { port: () => cab.ports.usb2, local: V(0, 0.12, -0.38), sag: -0.45, color: 0x141922 },
};

let fanSpeed = 0;
let powered = false;

/* ================================================================== UI */

const el = (id) => document.getElementById(id);
const stageLabel = el('stageLabel');
const scoreLabel = el('scoreLabel');
const card = el('card');
const cardTag = el('cardTag');
const cardQuestion = el('cardQuestion');
const cardOptions = el('cardOptions');
const cardFeedback = el('cardFeedback');
const cardActions = el('cardActions');
const toastEl = el('toast');

const TOTAL = COMPONENTS.length + PERIPHERALS.length;
let score = 0;
let step = 0;

function setStage(text) {
  stageLabel.textContent = text;
}

function setScore() {
  scoreLabel.textContent = `Score ${score} / ${TOTAL}`;
}

let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function buildTray() {
  const rows = [
    [el('trayList'), COMPONENTS],
    [el('periphList'), PERIPHERALS],
  ];
  for (const [list, defs] of rows) {
    list.innerHTML = '';
    for (const def of defs) {
      const li = document.createElement('li');
      li.id = `tray-${def.id}`;
      li.className = 'locked';
      li.innerHTML = `<span class="tick">&#10003;</span><span class="name">${def.label}</span>`;
      list.appendChild(li);
    }
  }
}

function trayActive(id) {
  document.querySelectorAll('#tray li').forEach((li) => li.classList.remove('active'));
  el(`tray-${id}`).classList.add('active');
}

function trayDone(id) {
  const li = el(`tray-${id}`);
  li.classList.remove('active', 'locked');
  li.classList.add('done');
}

function shuffled(def) {
  const items = def.options.map((text, i) => ({ text, correct: i === def.answer }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function clearActions() {
  cardActions.innerHTML = '';
}

function actionButton(label, className = 'primary') {
  return new Promise((resolve) => {
    clearActions();
    const b = document.createElement('button');
    b.className = className;
    b.textContent = label;
    b.onclick = () => {
      clearActions();
      resolve();
    };
    cardActions.appendChild(b);
  });
}

// Ask one question. Resolves once the right option is picked.
function ask(def) {
  step += 1;
  card.classList.remove('hidden');
  cardTag.textContent = `Question ${step} of ${TOTAL}`;
  cardQuestion.textContent = def.question;
  cardFeedback.textContent = '';
  cardFeedback.classList.remove('show');
  clearActions();
  cardOptions.innerHTML = '';

  let firstTry = true;

  return new Promise((resolve) => {
    shuffled(def).forEach((item, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = `<span class="key">${'ABCD'[i]}</span>${item.text}`;
      b.onclick = () => {
        if (item.correct) {
          b.classList.add('right');
          cardOptions.querySelectorAll('.opt').forEach((o) => (o.disabled = true));
          if (firstTry) {
            score += 1;
            setScore();
            toast('Correct, first try.');
          } else {
            toast('Correct.');
          }
          resolve();
        } else {
          firstTry = false;
          b.classList.add('wrong');
          b.disabled = true;
          cardFeedback.classList.add('show');
          cardFeedback.innerHTML = `<b>Not quite.</b> ${def.hint}`;
        }
      };
      cardOptions.appendChild(b);
    });
  });
}

function showNote(def) {
  cardFeedback.classList.add('show');
  cardFeedback.innerHTML = `<b>${def.label}.</b> ${def.note}`;
}

// Not a quiz: the use case picks the operating system.
function chooseOS() {
  card.classList.remove('hidden');
  cardTag.textContent = 'Choose an operating system';
  cardQuestion.textContent = OS_QUESTION;
  cardFeedback.textContent = '';
  cardFeedback.classList.remove('show');
  clearActions();
  cardOptions.innerHTML = '';

  return new Promise((resolve) => {
    OS_CHOICES.forEach((os, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = `<span class="key">${'ABC'[i]}</span>${os.use}`;
      b.onclick = () => {
        cardOptions.querySelectorAll('.opt').forEach((o) => (o.disabled = true));
        b.classList.add('right');
        cardFeedback.classList.add('show');
        cardFeedback.innerHTML = `<b>${os.name} it is.</b> ${os.why}`;
        resolve(os);
      };
      cardOptions.appendChild(b);
    });
  });
}

function showPrompt(tag, text) {
  card.classList.remove('hidden');
  cardTag.textContent = tag;
  cardQuestion.textContent = text;
  cardOptions.innerHTML = '';
  cardFeedback.textContent = '';
  cardFeedback.classList.remove('show');
  clearActions();
}

/* ====================================================== 3D operations */

// A tall or narrow window crops the scene horizontally. Correct for it with a
// little extra distance plus a wider lens: pulling the camera back alone would
// push the machine into the fog.
function framingNeed() {
  const aspect = window.innerWidth / window.innerHeight;
  return THREE.MathUtils.clamp(1.45 / aspect, 1, 2.4);
}

function applyLens() {
  const need = framingNeed();
  const pull = Math.min(need, 1.3);
  const half = THREE.MathUtils.degToRad(BASE_FOV) / 2;
  const wide = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) * (need / pull)));
  camera.fov = THREE.MathUtils.clamp(wide, BASE_FOV, 74);
  camera.updateProjectionMatrix();
  return pull;
}

function framedPosition(camPos, targetPos) {
  const pull = applyLens();
  return targetPos.clone().add(camPos.clone().sub(targetPos).multiplyScalar(pull));
}

let framing = null;

async function focus(camPos, targetPos, duration = 1.3) {
  framing = [camPos, targetPos];
  const fromCam = camera.position.clone();
  const fromTarget = controls.target.clone();
  const toCam = framedPosition(camPos, targetPos);
  await tween({
    duration,
    ease: easeInOutCubic,
    onUpdate: (e) => {
      camera.position.lerpVectors(fromCam, toCam, e);
      controls.target.lerpVectors(fromTarget, targetPos, e);
    },
  });
}

const CAM = {
  intro: [V(10, 7.5, 13), V(-1, 2, 0)],
  build: [V(3.2, 4.2, 6.6), V(-3.9, 2.2, 0)],
  drives: [V(3.4, 2.6, 6.2), V(-3.6, 1.2, 0.6)],
  periph: [V(6.5, 5.5, 13), V(0, 2, 0)],
  boot: [V(2.6, 3.4, 6.4), V(1.9, 2.5, -1.0)],
  done: [V(5.8, 4.6, 10.6), V(-0.4, 1.9, 0.2)],
};

async function installPart(id) {
  const part = parts[id];
  const base = part.baseRot ?? 0;
  part.object.visible = true;
  part.object.position.copy(part.from);
  part.object.rotation.y = base + (part.spin ?? 0);
  await slideIn(part.object, part.target, {
    duration: part.duration ?? 1.1,
    arc: part.arc ?? 0.45,
    toRotY: base,
  });
  await flash(part.object, 0x2ad4ee, 0.7);
}

// Grow a cable out of the rear port using the tube's index draw range.
async function plugIn(id) {
  const plug = PLUGS[id];
  const from = plug.port().getWorldPosition(new THREE.Vector3());
  const to = parts[id].object.localToWorld(plug.local.clone());
  const cable = P.makeCable(from, to, { color: plug.color, sag: plug.sag });
  scene.add(cable);

  const count = cable.geometry.index.count;
  cable.geometry.setDrawRange(0, 0);
  await tween({
    duration: 0.85,
    onUpdate: (e) => cable.geometry.setDrawRange(0, Math.floor(count * e)),
  });
  cable.geometry.setDrawRange(0, count);
}

async function spinTest() {
  await tween({
    duration: 1.6,
    ease: (t) => t,
    onUpdate: (e) => {
      fanSpeed = Math.sin(e * Math.PI) * 9;
    },
  });
  fanSpeed = 0;
}

function setGlow(intensity) {
  cab.ledMat.emissiveIntensity = intensity;
  cab.buttonMat.emissiveIntensity = intensity;
  cab.ring.material.emissiveIntensity = intensity * 0.8;
}

async function powerUp() {
  powered = true;
  toast('Power good. Firmware handing over to POST.');
  await tween({
    duration: 1.0,
    onUpdate: (e) => {
      setGlow(e * 1.5);
      fanSpeed = e * 16;
    },
  });
}

/* ================================================== boot + OS install */

const POST_LINES = [
  'Initialising platform firmware from ROM ...',
  'CPU      8 cores @ 3.60 GHz            [ OK ]',
  'Memory   16384 MB DDR   test passed    [ OK ]',
  'Cooling  CPU fan 1240 RPM              [ OK ]',
  'SATA 0   HDD  1 TB                     [ OK ]',
  'SATA 1   SSD  512 GB                   [ OK ]',
  'USB      keyboard, mouse detected      [ OK ]',
  'Display  1920 x 1080 @ 60 Hz           [ OK ]',
  'Searching for a bootable device ...',
];

async function runPost() {
  screen.clearLines();
  screen.set('post');
  for (const line of POST_LINES) {
    screen.pushLine(line);
    await wait(0.42);
  }
  await wait(0.8);
  screen.set('noos');
}

const installSteps = (os) => [
  ['Making room on the SSD', 0.16],
  ['Preparing the drive for files', 0.34],
  [`Copying the ${os.name} system files`, 0.62],
  ['Setting up drivers for your parts', 0.82],
  ['Telling the SSD how to start up', 0.94],
  ['Creating your user account', 1.0],
];

async function installOS(os) {
  screen.set('install');
  screen.setProgress(0, `Starting the ${os.name} installer ...`);
  await wait(0.6);
  for (const [label, target] of installSteps(os)) {
    const from = screen.progress;
    await tween({
      duration: 1.1,
      onUpdate: (e) => screen.setProgress(from + (target - from) * e, label),
    });
  }
  await wait(0.7);
  screen.set('off');
  await wait(0.9);
  screen.clearLines();
  screen.set('post');
  for (const line of ['Restarting ...', 'Starting from: SSD  512 GB', `Loading ${os.name}            [ OK ]`]) {
    screen.pushLine(line);
    await wait(0.5);
  }
  await wait(0.6);
  screen.setOS(os);
  screen.set('desktop');
}

/* ================================================== power button click */

let armPower = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pointerFromEvent(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function hitsPowerButton(event) {
  pointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects([cab.powerButton, cab.ring], false).length > 0;
}

canvas.addEventListener('pointermove', (event) => {
  canvas.style.cursor = armPower && hitsPowerButton(event) ? 'pointer' : '';
});

canvas.addEventListener('click', (event) => {
  if (armPower && hitsPowerButton(event)) {
    const go = armPower;
    armPower = null;
    canvas.style.cursor = '';
    go();
  }
});

function waitForPower() {
  return new Promise((resolve) => {
    armPower = resolve;
    const button = document.createElement('button');
    button.className = 'primary';
    button.textContent = 'Press the power button';
    button.onclick = () => {
      if (!armPower) return;
      armPower = null;
      clearActions();
      resolve();
    };
    clearActions();
    cardActions.appendChild(button);
  }).then(() => clearActions());
}

/* ============================================================ the game */

async function play() {
  setStage('Assembly');
  await focus(...CAM.build);

  for (let i = 0; i < COMPONENTS.length; i++) {
    const def = COMPONENTS[i];
    trayActive(def.id);
    if (def.id === 'hdd') await focus(...CAM.drives, 1.0);
    await ask(def);
    showNote(def);
    await installPart(def.id);
    trayDone(def.id);
    if (def.id === 'cooling') spinTest();
    const last = i === COMPONENTS.length - 1;
    await actionButton(last ? 'Chassis done, add peripherals' : 'Next component');
  }

  setStage('Peripherals');
  toast('Chassis complete. Time for input and output.');
  await focus(...CAM.periph);

  for (const def of PERIPHERALS) {
    trayActive(def.id);
    await ask(def);
    showNote(def);
    await installPart(def.id);
    await plugIn(def.id);
    trayDone(def.id);
    await actionButton(def.id === 'mouse' ? 'Everything is wired, power on' : 'Next device');
  }

  setStage('Power on');
  await focus(...CAM.boot);
  showPrompt('Power', 'All seven components are in and the peripherals are wired. Hit power and watch the firmware in ROM take over.');
  await waitForPower();
  await powerUp();

  showPrompt('POST', 'The firmware is checking every device it can find.');
  await runPost();

  setStage('No OS');
  showPrompt(
    'Boot failed',
    'Every part passed its check, so the hardware is fine. The problem is that both drives are empty: there is no operating system for the computer to start. Let us put one on the SSD.'
  );
  await actionButton('Install OS');

  setStage('Choose an OS');
  const os = await chooseOS();
  toast(`Installing ${os.name} on the SSD.`);
  await actionButton(`Install ${os.name}`);

  setStage('Installing');
  showPrompt('Installer', `Writing ${os.name} to the SSD, because that is the fast drive and the computer will start from it.`);
  await installOS(os);

  setStage('Complete');
  card.classList.add('hidden');
  await focus(...CAM.done, 1.8);

  el('winText').textContent =
    `You fitted the cabinet, motherboard, RAM, ROM, cooling unit, hard disk and SSD, connected the monitor, keyboard and mouse, and installed ${os.name}. Final score ${score} of ${TOTAL} on first attempts.`;
  el('win').classList.remove('hidden');
  toast('Mission completed.');
}

/* =============================================================== boot */

buildTray();
setScore();
screen.set('off');

framing = CAM.intro;
camera.position.copy(framedPosition(...CAM.intro));
controls.target.copy(CAM.intro[1]);

el('startBtn').onclick = () => {
  el('intro').classList.add('hidden');
  play();
};

el('againBtn').onclick = () => location.reload();

window.addEventListener('keydown', (event) => {
  const index = 'abcd'.indexOf(event.key.toLowerCase());
  if (index >= 0) {
    const options = cardOptions.querySelectorAll('.opt');
    if (options[index] && !options[index].disabled) options[index].click();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (framing) {
    camera.position.copy(framedPosition(framing[0], framing[1]));
    controls.target.copy(framing[1]);
  }
});

const clock = new THREE.Clock();
let cursorClock = 0;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateTweens(dt);

  cooler.fan.rotation.x += fanSpeed * dt;

  cursorClock += dt;
  if (cursorClock > 0.55) {
    cursorClock = 0;
    screen.tickCursor();
  }

  if (powered) {
    const pulse = 1.35 + Math.sin(clock.elapsedTime * 2.2) * 0.15;
    cab.ledMat.emissiveIntensity = pulse;
  }

  controls.update();
  renderer.render(scene, camera);
});
