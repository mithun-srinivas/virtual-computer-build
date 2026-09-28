// Tiny promise based tween loop. Every animation in the scene goes through here
// so a single clock in main.js drives all of them.

const active = [];

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function tween({ duration = 1, delay = 0, ease = easeInOutCubic, onUpdate }) {
  return new Promise((resolve) => {
    active.push({ elapsed: -delay, duration, ease, onUpdate, resolve });
  });
}

export function updateTweens(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const tw = active[i];
    tw.elapsed += dt;
    if (tw.elapsed < 0) continue;
    const raw = tw.duration <= 0 ? 1 : Math.min(1, tw.elapsed / tw.duration);
    if (tw.onUpdate) tw.onUpdate(tw.ease(raw), raw);
    if (raw >= 1) {
      active.splice(i, 1);
      tw.resolve();
    }
  }
}

export const wait = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// Slide an object from its current position to `to`, arcing slightly upward so
// the part looks like it is being lowered into place rather than teleporting.
export function slideIn(object, to, { duration = 1.1, arc = 0.6, delay = 0, toRotY = 0 } = {}) {
  const from = object.position.clone();
  const spinFrom = object.rotation.y;
  return tween({
    duration,
    delay,
    ease: easeOutCubic,
    onUpdate: (e) => {
      object.position.lerpVectors(from, to, e);
      object.position.y += Math.sin(e * Math.PI) * arc;
      object.rotation.y = spinFrom + (toRotY - spinFrom) * e;
    },
  });
}

export function popIn(object, { duration = 0.55, delay = 0 } = {}) {
  object.scale.setScalar(0.001);
  return tween({
    duration,
    delay,
    ease: easeOutBack,
    onUpdate: (e) => object.scale.setScalar(Math.max(0.001, e)),
  });
}

// Short emissive flash used to confirm a part clicked into place.
export function flash(object, color = 0x2ad4ee, duration = 0.9) {
  const targets = [];
  object.traverse((node) => {
    if (node.isMesh && node.material && node.material.emissive) {
      targets.push({ mat: node.material, base: node.material.emissive.clone(), i: node.material.emissiveIntensity ?? 1 });
    }
  });
  return tween({
    duration,
    ease: (t) => t,
    onUpdate: (e) => {
      const k = Math.sin(e * Math.PI);
      for (const t of targets) {
        t.mat.emissive.setHex(color);
        t.mat.emissiveIntensity = t.i + k * 1.6;
      }
      if (e >= 1) {
        for (const t of targets) {
          t.mat.emissive.copy(t.base);
          t.mat.emissiveIntensity = t.i;
        }
      }
    },
  });
}
