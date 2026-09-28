# Build Lab — assemble a computer in 3D

A single page three.js game. Answer one multiple choice question per component;
a correct answer drops that part into the chassis in 3D. Fit all seven parts,
wire up the peripherals, press power, watch POST fail for want of an operating
system, install one, and the machine boots to a desktop.

## Run it

ES modules do not load over `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. No build step, no npm install; three.js comes
from a CDN through the import map in `index.html`.

## Flow

1. **Assembly** — CPU cabinet, motherboard, RAM, ROM, cooling unit, hard disk, SSD.
   Each part flies in from outside the glass side panel and clicks into its real
   mounting point (DIMM slots, CPU socket, drive cage).
2. **Peripherals** — monitor, keyboard, mouse. Each one lands on the desk and grows
   a cable out to the matching rear port.
3. **Power on** — click the glowing power button on the front bezel (or the on
   screen button). The fan spins up, the interior light strip comes on and the
   firmware in ROM runs POST.
4. **No OS** — POST passes, no bootable image is found. Install an OS and it
   partitions the SSD, copies a kernel, writes a bootloader, reboots and lands on
   a desktop reading MISSION COMPLETED.

Wrong answers cost a point and show a hint, never the run. Keys A–D answer the
current question; drag to orbit, scroll to zoom.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Markup, import map, DOM overlay |
| `css/style.css` | Overlay styling |
| `js/main.js` | Scene setup, game flow, camera moves, boot sequence |
| `js/parts.js` | Every 3D object, built from primitives |
| `js/quiz.js` | The ten questions, hints and explanations |
| `js/screen.js` | The monitor image, drawn to a canvas texture |
| `js/anim.js` | Promise based tween loop |
