// The monitor image is a 2D canvas pushed to the panel as a texture, so the
// POST log, the "no OS" error and the desktop are all drawn in code.

import * as THREE from 'three';

const W = 1280;
const H = 720;
const MONO = '600 22px "SF Mono", "Menlo", "Consolas", monospace';

export class MonitorScreen {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.mode = 'off';
    this.lines = [];
    this.progress = 0;
    this.progressLabel = '';
    this.cursorOn = true;
    this.os = null;
    this.draw();
  }

  set(mode) {
    this.mode = mode;
    this.draw();
  }

  setOS(os) {
    this.os = os;
    this.draw();
  }

  clearLines() {
    this.lines = [];
  }

  pushLine(text) {
    this.lines.push(text);
    if (this.lines.length > 18) this.lines.shift();
    this.draw();
  }

  setProgress(value, label) {
    this.progress = value;
    if (label !== undefined) this.progressLabel = label;
    this.draw();
  }

  tickCursor() {
    this.cursorOn = !this.cursorOn;
    if (this.mode === 'post' || this.mode === 'noos') this.draw();
  }

  /* ------------------------------------------------------------- drawing */

  draw() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);

    if (this.mode === 'off') this.drawOff(c);
    else if (this.mode === 'post') this.drawPost(c);
    else if (this.mode === 'noos') this.drawNoOS(c);
    else if (this.mode === 'install') this.drawInstall(c);
    else if (this.mode === 'desktop') this.drawDesktop(c);

    this.scanlines(c);
    this.texture.needsUpdate = true;
  }

  scanlines(c) {
    c.globalAlpha = 0.05;
    c.fillStyle = '#000';
    for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
    c.globalAlpha = 1;
  }

  drawOff(c) {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0a0d11');
    g.addColorStop(0.5, '#10151b');
    g.addColorStop(1, '#080a0d');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.03)';
    c.beginPath();
    c.moveTo(0, H);
    c.lineTo(W * 0.55, 0);
    c.lineTo(W * 0.8, 0);
    c.lineTo(W * 0.2, H);
    c.fill();
  }

  header(c, title) {
    c.fillStyle = '#04070a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#2ad4ee';
    c.font = '700 26px "SF Mono", Menlo, monospace';
    c.fillText(title, 56, 70);
    c.strokeStyle = 'rgba(42,212,238,0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(56, 88);
    c.lineTo(W - 56, 88);
    c.stroke();
  }

  drawPost(c) {
    this.header(c, 'BUILDLAB BIOS  v1.0');
    c.font = MONO;
    let y = 140;
    for (const line of this.lines) {
      const ok = line.includes('[ OK ]');
      c.fillStyle = ok ? '#8fe7b4' : '#cfe3f2';
      c.fillText(line.replace('[ OK ]', ''), 56, y);
      if (ok) {
        c.fillStyle = '#45e08a';
        c.fillText('[ OK ]', 880, y);
      }
      y += 32;
    }
    if (this.cursorOn) {
      c.fillStyle = '#45e08a';
      c.fillRect(56, y - 18, 13, 22);
    }
  }

  drawNoOS(c) {
    this.header(c, 'BUILDLAB BIOS  v1.0');
    c.font = MONO;
    c.fillStyle = '#cfe3f2';
    c.fillText('Boot order:  SSD  >  HDD  >  Network', 56, 150);

    c.fillStyle = 'rgba(255,107,107,0.10)';
    c.fillRect(56, 200, W - 112, 150);
    c.strokeStyle = '#ff6b6b';
    c.lineWidth = 2;
    c.strokeRect(56, 200, W - 112, 150);

    c.fillStyle = '#ff9d9d';
    c.font = '700 30px "SF Mono", Menlo, monospace';
    c.fillText('No operating system found.', 88, 262);
    c.font = MONO;
    c.fillStyle = '#e8b9b9';
    c.fillText('Hardware passed POST. Storage contains no bootable image.', 88, 306);

    c.fillStyle = '#8c9bb0';
    c.fillText('Insert install media, or press INSTALL OS to continue.', 56, 410);
    if (this.cursorOn) {
      c.fillStyle = '#45e08a';
      c.fillRect(56, 442, 13, 22);
    }
  }

  drawInstall(c) {
    c.fillStyle = '#06090e';
    c.fillRect(0, 0, W, H);

    c.fillStyle = '#e8eef6';
    c.font = '700 40px Inter, system-ui, sans-serif';
    c.fillText('Installing operating system', 56, 260);

    c.fillStyle = '#8c9bb0';
    c.font = '400 24px Inter, system-ui, sans-serif';
    c.fillText(this.progressLabel, 56, 306);

    const x = 56, y = 360, w = W - 112, h = 22;
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.fillRect(x, y, w, h);
    const g = c.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, '#2ad4ee');
    g.addColorStop(1, '#45e08a');
    c.fillStyle = g;
    c.fillRect(x, y, w * this.progress, h);

    c.fillStyle = '#2ad4ee';
    c.font = '600 22px "SF Mono", Menlo, monospace';
    c.fillText(`${Math.round(this.progress * 100)}%`, x, y + 62);
  }

  drawDesktop(c) {
    const os = this.os || { name: 'BuildLab OS', accent: '#2ad4ee', bg: ['#132b3a', '#1b3c4e', '#0d1a24'], style: 'linux', why: '' };

    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, os.bg[0]);
    g.addColorStop(0.55, os.bg[1]);
    g.addColorStop(1, os.bg[2]);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    if (os.style === 'macos') this.macChrome(c, os);
    else if (os.style === 'windows') this.winChrome(c, os);
    else this.linuxChrome(c, os);

    // the payoff window
    this.window(c, 200, 140, 900, 300, os.name);
    c.fillStyle = '#45e08a';
    c.font = '800 44px Inter, system-ui, sans-serif';
    c.fillText('MISSION COMPLETED', 240, 258);
    c.fillStyle = '#e8eef6';
    c.font = '500 24px Inter, system-ui, sans-serif';
    c.fillText(`${os.name} is installed and running from the SSD.`, 240, 306);
    c.fillStyle = '#9fb0c4';
    c.font = '400 21px Inter, system-ui, sans-serif';
    this.wrap(c, os.why, 240, 346, 830, 28);

    this.window(c, 280, 480, 720, 170, 'Your machine');
    c.font = '600 20px "SF Mono", Menlo, monospace';
    c.fillStyle = os.accent;
    c.fillText('7 parts fitted   3 devices connected', 310, 566);
    c.fillStyle = '#cfe3f2';
    c.fillText('Boot drive: SSD 512 GB      Memory: 16 GB', 310, 602);
  }

  wrap(c, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '';
    let row = 0;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (c.measureText(test).width > maxWidth && line) {
        c.fillText(line, x, y + row * lineHeight);
        line = word;
        row += 1;
      } else {
        line = test;
      }
    }
    if (line) c.fillText(line, x, y + row * lineHeight);
  }

  macChrome(c, os) {
    c.fillStyle = 'rgba(240,243,247,0.14)';
    c.fillRect(0, 0, W, 40);
    c.fillStyle = '#e8eef6';
    c.font = '600 19px Inter, system-ui, sans-serif';
    c.fillText('\u25CF   Finder   File   Edit   View', 24, 27);
    c.fillText('09:41', W - 90, 27);
    c.fillStyle = 'rgba(255,255,255,0.14)';
    this.roundRect(c, W / 2 - 190, H - 76, 380, 60, 18);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = ['#3b9dff', '#45e08a', '#ffcf5c', '#ff8f6b', '#c39bff'][i];
      this.roundRect(c, W / 2 - 168 + i * 70, H - 66, 44, 44, 10);
    }
  }

  winChrome(c, os) {
    c.fillStyle = 'rgba(6,10,14,0.75)';
    c.fillRect(0, H - 54, W, 54);
    c.fillStyle = os.accent;
    for (let i = 0; i < 4; i++) {
      c.fillRect(24 + (i % 2) * 15, H - 40 + Math.floor(i / 2) * 15, 12, 12);
    }
    c.fillStyle = '#cfe3f2';
    c.font = '500 19px Inter, system-ui, sans-serif';
    c.fillText('Search', 70, H - 20);
    c.fillText('09:41   100%', W - 160, H - 20);
  }

  linuxChrome(c, os) {
    c.fillStyle = 'rgba(6,10,14,0.7)';
    c.fillRect(0, 0, W, 38);
    c.fillStyle = '#cfe3f2';
    c.font = '600 18px Inter, system-ui, sans-serif';
    c.fillText('Activities', 24, 25);
    c.fillText('09:41', W / 2 - 26, 25);
    c.fillStyle = 'rgba(6,10,14,0.7)';
    c.fillRect(0, 38, 66, H - 38);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = [os.accent, '#45e08a', '#3b9dff', '#c39bff'][i];
      this.roundRect(c, 14, 60 + i * 60, 38, 38, 9);
    }
  }

  roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fill();
  }

  window(c, x, y, w, h, title) {
    c.fillStyle = 'rgba(8,13,18,0.86)';
    c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(160,200,230,0.22)';
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.fillRect(x, y, w, 36);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = ['#ff6b6b', '#ffcf5c', '#45e08a'][i];
      c.beginPath();
      c.arc(x + 22 + i * 22, y + 18, 6, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#8c9bb0';
    c.font = '500 17px Inter, system-ui, sans-serif';
    c.fillText(title, x + 100, y + 24);
  }
}
