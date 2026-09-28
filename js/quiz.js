// One question per part. `answer` is the index of the correct option.

export const COMPONENTS = [
  {
    id: 'cabinet',
    label: 'CPU cabinet',
    question:
      'Every build starts with the part that holds the frame, the airflow and the mounting points for everything else. Which is it?',
    options: ['Cooling unit', 'CPU cabinet', 'Motherboard', 'Hard disk'],
    answer: 1,
    hint: 'Think about the metal box you actually screw the other parts into.',
    note:
      'The cabinet (chassis) mounts every other part, carries the power button and front ports, and shapes the airflow that keeps the machine cool.',
  },
  {
    id: 'motherboard',
    label: 'Motherboard',
    question:
      'Which component is the main printed circuit board that links the processor, memory and all expansion slots over its buses?',
    options: ['Motherboard', 'ROM', 'SSD', 'CPU cabinet'],
    answer: 0,
    hint: 'It is the board with the CPU socket, DIMM slots and PCIe slots on it.',
    note:
      'The motherboard is the backbone. Its chipset and buses decide how the CPU, RAM and storage talk to each other.',
  },
  {
    id: 'ram',
    label: 'RAM',
    question:
      'Which memory is volatile and read/write, holding the code and data the processor is working on right now?',
    options: ['ROM', 'Hard disk', 'RAM', 'Cooling unit'],
    answer: 2,
    hint: 'Volatile means it loses everything the moment power is cut.',
    note:
      'RAM is fast, byte addressable working memory. Power off and it is empty, which is why you still need storage.',
  },
  {
    id: 'rom',
    label: 'ROM',
    question:
      'Which chip is non-volatile and stores the firmware (BIOS/UEFI) that runs the moment you press power?',
    options: ['RAM', 'ROM', 'SSD', 'Motherboard'],
    answer: 1,
    hint: 'It must survive a power cut, and you do not normally write to it.',
    note:
      'ROM holds the firmware that initialises the hardware, runs POST and then hands control to a bootloader on storage.',
  },
  {
    id: 'cooling',
    label: 'Cooling unit',
    question:
      'The processor turns electrical power into heat. Which part pulls that heat off the die through a heatsink and fan?',
    options: ['Cooling unit', 'CPU cabinet', 'ROM', 'RAM'],
    answer: 0,
    hint: 'Copper base, aluminium fins, a fan pushing air through them.',
    note:
      'Without cooling the CPU throttles its clock or shuts down. The heatsink spreads the heat, the fan carries it out of the case.',
  },
  {
    id: 'hdd',
    label: 'Hard disk',
    question:
      'One of our two storage parts keeps your files on discs that spin inside it, with a tiny arm that moves across them to find a file. Which part is that?',
    options: ['SSD', 'RAM', 'Hard disk', 'ROM'],
    answer: 2,
    hint: 'It has parts that move inside, so you can sometimes hear it working.',
    note:
      'A hard disk gives you a lot of space for very little money. Because things have to move inside it, finding a file takes longer.',
  },
  {
    id: 'ssd',
    label: 'SSD',
    question:
      'The other storage part has nothing moving inside it at all, so it finds your files much faster. Which part is that?',
    options: ['Hard disk', 'SSD', 'Cooling unit', 'RAM'],
    answer: 1,
    hint: 'Think of a big memory card: no discs, no arm, nothing to spin up.',
    note:
      'An SSD keeps your files when the power is off, just like a hard disk, but it is much faster. That is why the operating system goes here.',
  },
];

export const PERIPHERALS = [
  {
    id: 'monitor',
    label: 'Monitor',
    question:
      'Which device is an output device that turns the graphics signal into the picture you look at?',
    options: ['Keyboard', 'Monitor', 'Mouse', 'RAM'],
    answer: 1,
    hint: 'Output means data flows from the computer to you.',
    note: 'Output device. The GPU drives it over HDMI or DisplayPort.',
  },
  {
    id: 'keyboard',
    label: 'Keyboard',
    question:
      'Which input device sends a scan code to the system for every key press and release?',
    options: ['Monitor', 'SSD', 'Keyboard', 'Cooling unit'],
    answer: 2,
    hint: 'Input means data flows from you to the computer.',
    note: 'Input device. The controller reports a key code, the OS maps it to a character.',
  },
  {
    id: 'mouse',
    label: 'Mouse',
    question:
      'Which one do you slide around with your hand to move the arrow on the screen and click on things?',
    options: ['Mouse', 'Monitor', 'ROM', 'Hard disk'],
    answer: 0,
    hint: 'You move it, the arrow on the screen moves the same way.',
    note:
      'The mouse is an input device. It tells the computer how far you moved it and what you clicked.',
  },
];

// The last step is not a test. Whatever the machine is for decides which
// operating system gets written to the SSD.
export const OS_QUESTION =
  'The hardware works, but the computer is empty. What will you mostly use it for? Your answer decides which operating system we install.';

export const OS_CHOICES = [
  {
    id: 'windows',
    name: 'Windows',
    use: 'Playing games and running everyday apps',
    why: 'Almost every game and most everyday programs are made for Windows first.',
    accent: '#3b9dff',
    bg: ['#0f2540', '#17456f', '#0a1725'],
    style: 'windows',
  },
  {
    id: 'macos',
    name: 'macOS',
    use: 'Editing photos, video and music',
    why: 'macOS comes with Apple tools for photo, video and music work, and runs on Apple machines.',
    accent: '#f0f3f7',
    bg: ['#2b2f3a', '#4b4152', '#171922'],
    style: 'macos',
  },
  {
    id: 'linux',
    name: 'Linux',
    use: 'Writing code and learning how a computer works',
    why: 'Linux is free, you can change any part of it, and most of the servers on the internet run it.',
    accent: '#ff8f3f',
    bg: ['#1b1220', '#3a1f2b', '#120c16'],
    style: 'linux',
  },
];
