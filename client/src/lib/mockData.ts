/**
 * Mock dataset mirroring the reference showcase.
 * When the backend is ready, the API service (see api.ts) can be pointed at the
 * real endpoints; this file is only used by the mock branch.
 */
import type { Model, Task } from "./types";

export const MODELS: Model[] = [
  {
    id: "fable-5-max",
    name: "Fable-5 Max",
    is_mono: false,
    icon_url: "/model-icons/claude.svg",
    color: "#d97706",
  },
  {
    id: "opus-4_8-max",
    name: "Opus-4.8 Max",
    is_mono: false,
    icon_url: "/model-icons/claude.svg",
    color: "#ea580c",
  },
  {
    id: "gpt-5_5-xhigh",
    name: "GPT-5.5 XHigh",
    is_mono: true,
    icon_url: "/model-icons/gpt.svg",
    color: "#0f172a",
  },
  {
    id: "glm-5_2-max",
    name: "GLM-5.2 Max",
    is_mono: true,
    icon_url: "/model-icons/glm.svg",
    color: "#2563eb",
  },
  {
    id: "gemini-3_5-flash-high",
    name: "Gemini-3.5-Flash High",
    is_mono: false,
    icon_url: "/model-icons/gemini.svg",
    color: "#7c3aed",
  },
];

const ALL = MODELS.map(m => m.id);

const RAW: { summary: string; prompt: string }[] = [
  {
    summary: "Steampunk control panel for stocks, servers, and a hotdog cooker",
    prompt:
      "A complicated, complex, intricate, highly decorated steam/cyber-punk themed control panel for managing stocks, servers, and a gas station style hotdog cooker",
  },
  {
    summary: "Spinning pizza where toppings fly off",
    prompt:
      "A spinning pizza website where there is a pizza with some toppings. The user should be able to spin the pizza. If spun fast enough the toppings fly off.",
  },
  {
    summary: 'Futuristic landing page for the "Quire" research facility',
    prompt:
      "Generate a very creative sleek modern website for a state-of-the-art research facility called Quire. The website design itself needs to convey a notion of excellence and ingeniousness, by avoiding standard UI elements such as a header, footer, banner, title, etc. Instead, generate a page that looks very futuristic and has creative animations. Highlight that the Quire research facility has developed the world's largest quantum computer, smartest AI models, and runs large-scale relativistic experiments. Make sure that the animations are very sleek and highly creative.",
  },
  {
    summary: "Interactive one-qubit NMR quantum register",
    prompt:
      "Picture a desktop device that is a one-qubit quantum register, where it has a qubit inside, and buttons and a touchscreen outside. The product is a NMR-based quantum one-qubit register, which is for students and hobbyists to experiment with. The buttons correspond to actions such as applying a laser pulse to excite the qubit or observe the qubit for a certain amount of time, vary the magnetic field, etc. The black rectangle is a screen that allows the user to observe the spectroscopy of the qubit in real time, i.e. a graph of spectroscopy vs. time. Generate an interactive MVP website that allows users to interact with the product as if it were real",
  },
  {
    summary: "WSAD-explorable three.js Mandelbulb",
    prompt:
      "three.js 3D explorable mandelbulb. WSAD movement controls. mouse to look around. scroll to adjust speed (no limit for the range. scrollup=1.2x speedup, vice versa for scrolldown). iteration slider. simple shaders for visual clarity.",
  },
  {
    summary: "Hexagonal trivia board with six themed regions",
    prompt:
      "A hexagonal trivia grid board with 36 territories, divided into six themed regions (e.g., Science, History, Pop Culture, Geography, Sports, and Wildcard).\nEach territory has a point value based on its difficulty, ranging from 100 to 500 AP.",
  },
  {
    summary: "Tinder for birds",
    prompt:
      "a website about birds inspired by a dating app ui that allows for swiping between species that you like more",
  },
  {
    summary: "Realistic lava lamp simulation",
    prompt:
      "Build a realistic lava lamp simulation using HTML, CSS, and JavaScript. The simulation should model the behavior of wax blobs rising and falling inside a liquid due to heat, gravity, and buoyancy forces. The blobs should:\n\nRise when heated, then cool and fall when they reach the top.\nMerge and separate dynamically when blobs collide, mimicking real fluid behavior.\nSimulate gravity pulling the blobs down and heat pushing them up.\nInclude random variations in blob sizes and movement for a natural, chaotic effect.\nMake the blobs stretch, deform, and wobble as they move, split, or combine.\nUse physics and viscosity effects to simulate the liquid environment inside the lamp.\nThe heat force will decrease with distance from bottom, try and keep the total volume/area of the blobs constant.\nSliders to adjust constants, the blobs should have only 1 color and have them randomly spawn every once in a while.",
  },
  {
    summary: "Room generator with robot-vacuum path planning",
    prompt:
      "Can you create a web app to generate and visualize a random room, and than plan the shortest path to cover the entire room, similar to robot vacuum\n\nthe navigation algorithem should prefer less as possible turns, prefer as much as possible straight lines\n\nyou need to make sure the path is easily visible in the ui",
  },
  {
    summary: "Card-flip memory game about physics laws",
    prompt:
      "card flipper memorization game with physics laws as content, these laws should be represented by their frmulae on flip side, after you selected a pair, a name of the law should appear under the formulae, and generate an svg representing this law on the flip card (make formulae smaller)",
  },
  {
    summary: "Gamepad rhythm game with arc-shaped note flicking",
    prompt:
      "Create a simple rhythm game utilizing a gamepad. Arc-shaped notes should rhythmically gravitate towards the center from random directions. The player must flick the stick in the direction of the note to hit it right as the arc-shaped note hits a small circle in the middle. The timing window should be +-200 milliseconds. The arc of the note should be 60 degrees. Nominally, at least one note should fall every second, but rhythm patterns should be somewhat varied. Each note should be visible on the screen for approximately one second.",
  },
  {
    summary: "Educational mouse-skills game for 7th graders",
    prompt:
      "Create an educational game for my students. The goal of the game is to teach them basics of computer mouse (click, double-click, right-click, left-click, mouse movement, drag and drop …).\nCreate a game that has different activities to teach them all the aspects of mouse use. Implement score and timing. \nMake it easy to understand and starts easy and gets harder.\nMake the design clean and modern and make it enjoyable by 7th grade students.\nAfter completing all game activities, the game should show a global score and assessments of the aspects of mouse use.",
  },
  {
    summary: "Windows 98 Microsoft Paint UI replica",
    prompt:
      "Design a user interface for an application that replicates the look and feel of Microsoft Paint from Windows 98. The UI should include all the tools and features that were available in Paint during that time. Capture the classic Windows 98 aesthetics, including the window styles, icons, buttons, menus, and toolbars as they appeared in the original Paint application. Ensure that the layout is accurate, functional, and faithful to the original design.",
  },
  {
    summary: "Vector art MacBook Air 13 vs 15 comparison page",
    prompt:
      "Generate a product comparsion page between macbook air 13 inch vs. 15 inch. must include vector art\n\nthe visualization must be the same as actual monitor difference scale. the MacBook must be visualized in very detail.\nscreen size difference and also the overview of the MacBook air should be drawn using vector art. must be very detail; i.e., detailed key, speakers, and cameras.\n\nMust think step by step in very detail.\nStep 1: Plan in detail. be careful of the colours\nStep 2: Explain how to write a vector art in detail. and make it\nStep 3: Explain how to implement in detail. very detail.\n\nThe output must have\n\n(1) Detailed vector art for MacBook air 13 inch and 15 inch, with corresponding to the actual screen scale.\n(2) Appealing animation to the consumer.\n(3) Detailed description with very appealing visualization.\n(4) Colorful and professional page.\n(5) should have a youtube-inspired video made by multiple vector arts!",
  },
  {
    summary: "Snake game with an apple that tries to escape",
    prompt:
      'Generate me snake game but the apple can defend itself and flee away slowly. A modern and very nice smooth Ui with sleek animations. Add a Main Menu screen with title "Moz Snake 2024" and it have two modes classic and Apple escape mode, oh and also score and high score, high score saves locally.',
  },
];

export const TASKS: Task[] = RAW.map((t, i) => ({
  id: `task_${String(i).padStart(2, "0")}`,
  index: i,
  summary: t.summary,
  prompt: t.prompt,
  available_models: [...ALL],
}));
