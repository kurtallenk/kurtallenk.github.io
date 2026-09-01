/* =========================================================
   KURT ALLEN KINCHALOS — PORTFOLIO SCRIPT
   ========================================================= */

import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ---------------------------------------------------------
   0. SHARED STATE / UTILS
   --------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 720px)").matches || ("ontouchstart" in window && window.innerWidth < 900);
const isLowPower = isMobile || navigator.hardwareConcurrency <= 4;
const gsapAvailable = typeof window.gsap !== "undefined";
const gsap = gsapAvailable ? window.gsap : null;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

document.documentElement.classList.add("js-ready");

/* ---------------------------------------------------------
   1. LOADER
   --------------------------------------------------------- */
function initLoader() {
  const loader = document.getElementById("loader");
  const fill = document.getElementById("loaderFill");
  const percent = document.getElementById("loaderPercent");
  const status = document.getElementById("loaderStatus");

  let progress = 0;
  const messages = ["INITIALIZING EXPERIENCE...", "COMPILING SHADERS...", "LOADING SYSTEMS...", "SYSTEM READY"];

  const tick = setInterval(() => {
    progress += Math.random() * 18 + 8;
    if (progress >= 100) {
      progress = 100;
      status.textContent = messages[messages.length - 1];
    } else if (progress > 66) {
      status.textContent = messages[2];
    } else if (progress > 33) {
      status.textContent = messages[1];
    }
    fill.style.width = progress + "%";
    percent.textContent = Math.floor(progress) + "%";

    if (progress >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.style.overflow = "";
        playHeroReveal();
      }, 350);
    }
  }, 140);

  document.body.style.overflow = "hidden";
}

/* ---------------------------------------------------------
   2. CUSTOM CURSOR
   --------------------------------------------------------- */
function initCursor() {
  if (isMobile) return;
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  function raf() {
    rx = lerp(rx, mx, 0.18);
    ry = lerp(ry, my, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(raf);
  }
  raf();

  document.querySelectorAll("a, button, .magnetic, .lab-card").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-link"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-link"));
  });
  document.querySelectorAll("#heroCanvas, #stackCanvas, #aboutCanvas").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-3d"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-3d"));
  });
}

/* ---------------------------------------------------------
   3. NAVIGATION
   --------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const navLinkEls = document.querySelectorAll("[data-nav]");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }, { passive: true });

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  const sections = [...navLinkEls].map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = "#" + entry.target.id;
      navLinkEls.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => spy.observe(s));
}

/* ---------------------------------------------------------
   4. SCROLL REVEAL
   --------------------------------------------------------- */
function initReveal() {
  const targets = document.querySelectorAll(".reveal, [data-animate]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach((t) => io.observe(t));
}

function playHeroReveal() {
  const items = document.querySelectorAll(".hero .reveal, .hero-title .reveal-word");
  items.forEach((el, i) => {
    el.classList.add("is-visible");
    if (gsap) {
      gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, delay: i * 0.08, ease: "power3.out" });
    }
  });
}

/* ---------------------------------------------------------
   5. MAGNETIC BUTTONS + CARD TILT
   --------------------------------------------------------- */
function initMagnetic() {
  if (isMobile || prefersReducedMotion) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.4;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

function initTilt() {
  if (isMobile || prefersReducedMotion) return;
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${py * -8}deg) rotateY(${px * 8}deg)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ---------------------------------------------------------
   6. STAT COUNTERS
   --------------------------------------------------------- */
function initCounters() {
  const nums = document.querySelectorAll(".stat-num");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      let current = 0;
      const step = Math.max(1, Math.round(target / 40));
      const t = setInterval(() => {
        current = Math.min(target, current + step);
        el.textContent = current;
        if (current >= target) clearInterval(t);
      }, 30);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach((n) => io.observe(n));
}

/* ---------------------------------------------------------
   7. HERO — "DIGITAL CORE" THREE.JS SCENE
   --------------------------------------------------------- */
function initHeroScene() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const cyan = new THREE.Color(0x4cf3e0);
  const violet = new THREE.Color(0x9b6bff);
  const blue = new THREE.Color(0x6e9bff);

  const core = new THREE.Group();
  core.position.x  = 3;
  scene.add(core);

  // Wireframe icosahedron core
  const coreGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color: cyan, wireframe: true, transparent: true, opacity: 0.55 });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  core.add(coreMesh);

  // Inner glow sphere
  const glowGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const glowMat = new THREE.MeshBasicMaterial({ color: violet, wireframe: true, transparent: true, opacity: 0.25 });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  core.add(glowMesh);

  // Orbiting rings
  const rings = [];
  const ringColors = [cyan, violet, blue];
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(2.9 + i * 0.35, 0.006, 8, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: ringColors[i], transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + i * 0.5;
    ring.rotation.y = i * 0.7;
    ring.userData.speed = 0.15 + i * 0.08;
    rings.push(ring);
    core.add(ring);
  }

  // Particle field (nodes / floating fragments)
  const particleCount = isLowPower ? 220 : 700;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const palette = [cyan, violet, blue];
  for (let i = 0; i < particleCount; i++) {
    const radius = 3.2 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Connecting light-trail lines between a subset of nearby particles (technical grid feel)
  const lineSegments = [];
  const lineCount = isLowPower ? 18 : 40;
  for (let i = 0; i < lineCount; i++) {
    const a = Math.floor(Math.random() * particleCount);
    const b = Math.floor(Math.random() * particleCount);
    const pA = new THREE.Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
    const pB = new THREE.Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
    if (pA.distanceTo(pB) > 3) continue;
    const geo = new THREE.BufferGeometry().setFromPoints([pA, pB]);
    const mat = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.12 });
    lineSegments.push(new THREE.Line(geo, mat));
  }
  const lineGroup = new THREE.Group();
  lineSegments.forEach((l) => lineGroup.add(l));
  scene.add(lineGroup);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Pointer / device orientation reactive camera
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };

  window.addEventListener("mousemove", (e) => {
    targetPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetPointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    const hud = document.getElementById("hudCoords");
    if (hud) hud.textContent = `X:${String(Math.abs(Math.round(e.clientX))).padStart(4, "0")} Y:${String(Math.abs(Math.round(e.clientY))).padStart(4, "0")}`;
  }, { passive: true });

  if (window.DeviceOrientationEvent && isMobile) {
    window.addEventListener("deviceorientation", (e) => {
      if (e.beta == null || e.gamma == null) return;
      targetPointer.x = clamp(e.gamma / 45, -1, 1);
      targetPointer.y = clamp(e.beta / 45, -1, 1);
    });
  }

  let scrollFactor = 0;
  window.addEventListener("scroll", () => {
    scrollFactor = clamp(window.scrollY / window.innerHeight, 0, 1.4);
  }, { passive: true });

  // Pause rendering when hero not visible (perf)
  let heroVisible = true;
  const heroSection = document.getElementById("hero");
  new IntersectionObserver((entries) => {
    entries.forEach((e) => { heroVisible = e.isIntersecting; });
  }).observe(heroSection);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!heroVisible) return;

    const t = clock.getElapsedTime();
    pointer.x = lerp(pointer.x, targetPointer.x, 0.04);
    pointer.y = lerp(pointer.y, targetPointer.y, 0.04);

    core.rotation.y = t * 0.08 + pointer.x * 0.3;
    core.rotation.x = t * 0.04 + pointer.y * 0.2;
    particles.rotation.y = t * 0.02;
    lineGroup.rotation.y = t * 0.02;

    rings.forEach((r, i) => { r.rotation.z = t * r.userData.speed; });

    camera.position.x = lerp(camera.position.x, pointer.x * 1.1, 0.05);
    camera.position.y = lerp(camera.position.y, -pointer.y * 0.8, 0.05);
    camera.position.z = 9 + scrollFactor * 3;
    camera.lookAt(0, 0, 0);

    const scale = 1 - Math.min(scrollFactor * 0.3, 0.3);
    core.scale.setScalar(scale);
    particles.scale.setScalar(scale);

    renderer.render(scene, camera);
  }
  if (!prefersReducedMotion) animate(); else renderer.render(scene, camera);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ---------------------------------------------------------
   8. ABOUT — small orbiting fragment scene
   --------------------------------------------------------- */
function initAboutScene() {
  const canvas = document.getElementById("aboutCanvas");
  if (!canvas) return;

  const wrap = canvas.parentElement;

  // ============================================================
  // SCENE
  // ============================================================

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setClearColor(0x000000, 0);

  // ============================================================
  // RESIZE
  // ============================================================

  function resize() {
    const width = wrap.clientWidth;

    if (!width) return;

    renderer.setSize(width, width, false);

    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  resize();

  window.addEventListener("resize", resize);

  // ============================================================
  // COLORS
  // ============================================================

  const COLORS = {
    cyan: 0x4cf3e0,
    blue: 0x6e9bff,
    purple: 0x9b6bff,
    white: 0xffffff
  };

  // ============================================================
  // MAIN GROUP
  // ============================================================

  const system = new THREE.Group();

  scene.add(system);

  // ============================================================
  // PHOTO GROUP
  // ============================================================

  const portraitGroup = new THREE.Group();

  system.add(portraitGroup);

  // ============================================================
  // PORTRAIT CIRCLE
  // ============================================================

  const portraitRadius = 1.05;

  const portraitGeometry =
    new THREE.CircleGeometry(
      portraitRadius,
      96
    );

  const portraitTexture =
    new THREE.TextureLoader().load(
      "assets/images/KurtAllen3.avif"
    );

  portraitTexture.colorSpace =
    THREE.SRGBColorSpace;

  const portraitMaterial =
    new THREE.MeshBasicMaterial({
      map: portraitTexture,
      transparent: true
    });

  const portrait =
    new THREE.Mesh(
      portraitGeometry,
      portraitMaterial
    );

  portrait.position.z = 0.18;

  portraitGroup.add(portrait);

  // ============================================================
  // PORTRAIT DARK OVERLAY
  // ============================================================

  const overlayGeometry =
    new THREE.CircleGeometry(
      portraitRadius,
      96
    );

  const overlayMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x061419,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

  const portraitOverlay =
    new THREE.Mesh(
      overlayGeometry,
      overlayMaterial
    );

  portraitOverlay.position.z = 0.2;

  portraitGroup.add(
    portraitOverlay
  );

  // ============================================================
  // PORTRAIT GLOW
  // ============================================================

  const glowGeometry =
    new THREE.CircleGeometry(
      portraitRadius + 0.18,
      96
    );

  const glowMaterial =
    new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.055,
      depthWrite: false
    });

  const portraitGlow =
    new THREE.Mesh(
      glowGeometry,
      glowMaterial
    );

  portraitGlow.position.z = 0.05;

  portraitGroup.add(
    portraitGlow
  );

  // ============================================================
  // PORTRAIT BORDER
  // ============================================================

  const portraitBorderGeometry =
    new THREE.RingGeometry(
      portraitRadius + 0.015,
      portraitRadius + 0.035,
      96
    );

  const portraitBorderMaterial =
    new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.85
    });

  const portraitBorder =
    new THREE.Mesh(
      portraitBorderGeometry,
      portraitBorderMaterial
    );

  portraitBorder.position.z = 0.3;

  portraitGroup.add(
    portraitBorder
  );

  // ============================================================
  // SECOND PORTRAIT RING
  // ============================================================

  const secondRingGeometry =
    new THREE.RingGeometry(
      portraitRadius + 0.12,
      portraitRadius + 0.125,
      96
    );

  const secondRingMaterial =
    new THREE.MeshBasicMaterial({
      color: COLORS.purple,
      transparent: true,
      opacity: 0.45
    });

  const secondRing =
    new THREE.Mesh(
      secondRingGeometry,
      secondRingMaterial
    );

  secondRing.position.z = 0.1;

  portraitGroup.add(
    secondRing
  );

  // ============================================================
  // SCAN RING
  // ============================================================

  const scanRingGeometry =
    new THREE.RingGeometry(
      portraitRadius + 0.25,
      portraitRadius + 0.27,
      96
    );

  const scanRingMaterial =
    new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.3
    });

  const scanRing =
    new THREE.Mesh(
      scanRingGeometry,
      scanRingMaterial
    );

  portraitGroup.add(scanRing);


  // ============================================================
  // CORNER HUD BRACKETS
  // ============================================================

  const bracketMaterial =
    new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.7
    });

  function createBracket(x, y, rotation) {
    const points = [
      new THREE.Vector3(-0.15, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.15, 0)
    ];

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(points);

    const line =
      new THREE.Line(
        geometry,
        bracketMaterial
      );

    line.position.set(
      x,
      y,
      0.35
    );

    line.rotation.z =
      rotation;

    portraitGroup.add(line);
  }

  createBracket(
    -1.32,
    1.32,
    0
  );

  createBracket(
    1.32,
    1.32,
    -Math.PI / 2
  );

  createBracket(
    1.32,
    -1.32,
    Math.PI
  );

  createBracket(
    -1.32,
    -1.32,
    Math.PI / 2
  );

  // ============================================================
  // TEXT SPRITE
  // ============================================================

  function createTextSprite(
    text,
    options = {}
  ) {
    const {
      fontSize = 48,
      color = "#ffffff",
      fontWeight = "600",
      letterSpacing = 2
    } = options;

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

    canvas.width = 1024;
    canvas.height = 256;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.font =
      `${fontWeight} ${fontSize}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = color;

    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.fillText(
      text,
      canvas.width / 2,
      canvas.height / 2
    );

    const texture =
      new THREE.CanvasTexture(
        canvas
      );

    texture.colorSpace =
      THREE.SRGBColorSpace;

    const material =
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });

    const sprite =
      new THREE.Sprite(
        material
      );

    return sprite;
  }

  // ============================================================
  // NAME
  // ============================================================

  const nameLabel =
    createTextSprite(
      "KURT ALLEN",
      {
        fontSize: 148,
        color: "#ffffff",
        fontWeight: "700"
      }
    );

  nameLabel.scale.set(
    1.75,
    0.44,
    1
  );

  nameLabel.position.set(
    0,
    -1.42,
    0.5
  );

  system.add(nameLabel);

  // ============================================================
  // EXPERIENCE
  // ============================================================

  const experienceLabel =
    createTextSprite(
      "WEB DEVELOPER",
      {
        fontSize: 88,
        color: "#4cf3e0",
        fontWeight: "600"
      }
    );

  experienceLabel.scale.set(
    1.2,
    0.3,
    1
  );

  experienceLabel.position.set(
    0,
    -1.78,
    0.5
  );

  system.add(
    experienceLabel
  );



  // ============================================================
  // TECHNOLOGIES
  // ============================================================

  const nodes = [];

  // ============================================================
  // CONNECTION GROUP
  // ============================================================

  const connectionGroup =
    new THREE.Group();

  system.add(
    connectionGroup
  );

  // ============================================================
  // PARTICLES
  // ============================================================

  const particleCount = 180;

  const positions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i++
  ) {
    const i3 = i * 3;

    const radius =
      2.5 +
      Math.random() * 1.8;

    const angle =
      Math.random() *
      Math.PI *
      2;

    positions[i3] =
      Math.cos(angle) *
      radius;

    positions[i3 + 1] =
      Math.sin(angle) *
      radius;

    positions[i3 + 2] =
      (Math.random() - 0.5) *
      1.5;
  }

  const particleGeometry =
    new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const particleMaterial =
    new THREE.PointsMaterial({
      color: COLORS.cyan,
      size: 0.018,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  system.add(
    particles
  );

  // ============================================================
  // DATA SCANNER
  // ============================================================

  const scannerGeometry =
    new THREE.PlaneGeometry(
      2.0,
      0.025
    );

  const scannerMaterial =
    new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.5,
      blending:
        THREE.AdditiveBlending,
      depthWrite: false
    });

  const scanner =
    new THREE.Mesh(
      scannerGeometry,
      scannerMaterial
    );

  scanner.position.z =
    0.35;

  portraitGroup.add(
    scanner
  );

  // ============================================================
  // DATA PULSES
  // ============================================================

  const pulses = [];

  function createPulse(
    nodeIndex
  ) {
    const target =
      nodes[nodeIndex];

    if (!target) return;

    const geometry =
      new THREE.SphereGeometry(
        0.035,
        8,
        8
      );

    const material =
      new THREE.MeshBasicMaterial({
        color:
          target.userData.tech
            .color,
        transparent: true,
        opacity: 0.9
      });

    const pulse =
      new THREE.Mesh(
        geometry,
        material
      );

    pulse.userData = {
      start:
        new THREE.Vector3(
          0,
          0,
          0.2
        ),

      end:
        target.position.clone(),

      progress: 0,

      speed:
        0.35 +
        Math.random() * 0.25
    };

    system.add(
      pulse
    );

    pulses.push(
      pulse
    );
  }

  createPulse(0);
  createPulse(3);
  createPulse(6);

  // ============================================================
  // MOUSE
  // ============================================================

  const mouse =
    new THREE.Vector2();

  const targetRotation =
    new THREE.Vector2();

  function handlePointerMove(
    event
  ) {
    const rect =
      canvas.getBoundingClientRect();

    mouse.x =
      ((event.clientX -
        rect.left) /
        rect.width) *
        2 -
      1;

    mouse.y =
      -(
        (event.clientY -
          rect.top) /
        rect.height
      ) *
        2 +
      1;

    targetRotation.x =
      mouse.y * 0.13;

    targetRotation.y =
      mouse.x * 0.18;
  }

  canvas.addEventListener(
    "pointermove",
    handlePointerMove
  );

  // ============================================================
  // RAYCASTER
  // ============================================================

  const raycaster =
    new THREE.Raycaster();

  let hoveredNode = null;

  function updateHover() {
    raycaster.setFromCamera(
      mouse,
      camera
    );

    const intersections =
      raycaster.intersectObjects(
        nodeMeshes,
        false
      );

    if (
      intersections.length
    ) {
      hoveredNode =
        intersections[0]
          .object
          .parent;

      canvas.style.cursor =
        "pointer";
    } else {
      hoveredNode = null;

      canvas.style.cursor =
        "default";
    }
  }

  canvas.addEventListener(
    "pointermove",
    updateHover
  );

  canvas.addEventListener(
    "pointerleave",
    () => {
      hoveredNode = null;
      canvas.style.cursor =
        "default";
    }
  );

  // ============================================================
  // VISIBILITY
  // ============================================================

  let visible = false;

  const observer =
    new IntersectionObserver(
      (entries) => {
        visible =
          entries.some(
            (entry) =>
              entry.isIntersecting
          );
      },
      {
        threshold: 0.05
      }
    );

  observer.observe(
    wrap
  );

  // ============================================================
  // CLOCK
  // ============================================================

  const clock =
    new THREE.Clock();

  let pulseTimer = 0;
  let scanDirection = 1;

  // ============================================================
  // ANIMATION
  // ============================================================

  function animate() {
    requestAnimationFrame(
      animate
    );

    if (!visible) return;

    const elapsed =
      clock.getElapsedTime();

    const delta =
      Math.min(
        clock.getDelta(),
        0.05
      );

    // ----------------------------------------------------------
    // PARALLAX
    // ----------------------------------------------------------

    system.rotation.x +=
      (
        targetRotation.x -
        system.rotation.x
      ) * 0.035;

    system.rotation.y +=
      (
        targetRotation.y -
        system.rotation.y
      ) * 0.035;

    // ----------------------------------------------------------
    // PORTRAIT
    // ----------------------------------------------------------

    portraitGroup.rotation.z =
      Math.sin(
        elapsed * 0.25
      ) * 0.01;

    portraitGlow.scale.setScalar(
      1 +
        Math.sin(
          elapsed * 1.8
        ) *
          0.08
    );

    // ----------------------------------------------------------
    // HUD
    // ----------------------------------------------------------

    // hudRing.rotation.z +=
    //   0.002;

    // hudRing2.rotation.z -=
    //   0.0012;

    secondRing.rotation.z +=
      0.004;

    scanRing.rotation.z -=
      0.002;

    // ----------------------------------------------------------
    // SCANNER
    // ----------------------------------------------------------

    scanner.position.y =
      Math.sin(
        elapsed * 1.1
      ) * 0.82;

    scanner.material.opacity =
      0.25 +
      Math.sin(
        elapsed * 2
      ) *
        0.15;

    // ----------------------------------------------------------
    // TECHNOLOGY NODES
    // ----------------------------------------------------------

    nodes.forEach(
      (
        nodeGroup,
        index
      ) => {
        const data =
          nodeGroup.userData;

        const hovered =
          hoveredNode ===
          nodeGroup;

        const targetScale =
          hovered
            ? 1.55
            : 1;

        nodeGroup.scale.x +=
          (
            targetScale -
            nodeGroup.scale.x
          ) *
          0.12;

        nodeGroup.scale.y +=
          (
            targetScale -
            nodeGroup.scale.y
          ) *
          0.12;

        nodeGroup.scale.z +=
          (
            targetScale -
            nodeGroup.scale.z
          ) *
          0.12;

        data.ring.rotation.z =
          elapsed *
          (
            0.3 +
            index *
              0.025
          );

        data.glow.material
          .opacity +=
          (
            (
              hovered
                ? 0.22
                : 0.06
            ) -
            data.glow.material
              .opacity
          ) *
          0.1;

        data.label.material
          .opacity +=
          (
            (
              hovered
                ? 1
                : 0.7
            ) -
            data.label.material
              .opacity
          ) *
          0.1;
      }
    );

    // ----------------------------------------------------------
    // CONNECTIONS
    // ----------------------------------------------------------

    nodes.forEach(
      (
        nodeGroup,
        index
      ) => {
        const line =
          connectionGroup
            .children[
              index
            ];

        const positions =
          line.geometry
            .attributes
            .position
            .array;

        positions[3] =
          nodeGroup.position.x;

        positions[4] =
          nodeGroup.position.y;

        positions[5] =
          nodeGroup.position.z;

        line.geometry
          .attributes
          .position
          .needsUpdate =
          true;

        const hovered =
          hoveredNode ===
          nodeGroup;

        line.material.opacity =
          hovered
            ? 0.65
            : 0.16;
      }
    );

    // ----------------------------------------------------------
    // PARTICLES
    // ----------------------------------------------------------

    particles.rotation.z +=
      0.0008;

    particles.rotation.x =
      Math.sin(
        elapsed * 0.1
      ) * 0.03;

    // ----------------------------------------------------------
    // DATA PULSES
    // ----------------------------------------------------------

    pulseTimer += delta;

    if (
      pulseTimer > 1.3
    ) {
      pulseTimer = 0;

      const randomIndex =
        Math.floor(
          Math.random() *
            nodes.length
        );

      createPulse(
        randomIndex
      );
    }

    for (
      let i =
        pulses.length - 1;
      i >= 0;
      i--
    ) {
      const pulse =
        pulses[i];

      pulse.userData
        .progress +=
        pulse.userData
          .speed *
        delta;

      const progress =
        pulse.userData
          .progress;

      pulse.position.lerpVectors(
        pulse.userData
          .start,
        pulse.userData
          .end,
        progress
      );

      pulse.material.opacity =
        Math.sin(
          Math.min(
            progress,
            1
          ) *
            Math.PI
        );

      if (
        progress >= 1
      ) {
        system.remove(
          pulse
        );

        pulse.geometry.dispose();
        pulse.material.dispose();

        pulses.splice(
          i,
          1
        );
      }
    }

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    renderer.render(
      scene,
      camera
    );
  }

  // ============================================================
  // REDUCED MOTION
  // ============================================================

  if (
    !prefersReducedMotion
  ) {
    animate();
  } else {
    renderer.render(
      scene,
      camera
    );
  }
}

/* =========================================================
   TECH STACK
   ========================================================= */

const STACK_DATA = [

    /* -----------------------------------------------------
       WEB
       ----------------------------------------------------- */

    {
        name: "HTML",
        icon: "./assets/icons/html.svg",
        group: "Web",
        desc: "Semantic structure where every page starts."
    },

    {
        name: "CSS",
        icon: "./assets/icons/css.svg",
        group: "Web",
        desc: "Layout, motion and visual language."
    },

    {
        name: "JavaScript",
        icon: "./assets/icons/javascript.svg",
        group: "Web",
        desc: "Interaction, logic and glue between everything."
    },

    {
        name: "PHP",
        icon: "./assets/icons/php.svg",
        group: "Web",
        desc: "Server-side logic behind custom sites and tools."
    },

    {
        name: "MySQL",
        icon: "./assets/icons/mysql.svg",
        group: "Web",
        desc: "Relational data behind dashboards and RSVP systems."
    },

    {
        name: "Reactjs",
        icon: "./assets/icons/reactjs.svg",
        group: "Web",
        desc: "Component-based UI when a project calls for it."
    },

    {
        name: "WordPress",
        icon: "./assets/icons/wordpress.svg",
        group: "Web",
        desc: "CMS builds for content-driven sites."
    },

    {
        name: "Wix",
        icon: "./assets/icons/wix.svg",
        group: "Web",
        desc: "CMS builds for content-driven sites."
    },


    /* -----------------------------------------------------
       PROGRAMMING
       ----------------------------------------------------- */

    {
        name: "C#",
        icon: "./assets/icons/csharp.svg",
        group: "Programming",
        desc: "Object-oriented software development."
    },

    {
        name: "Python",
        icon: "./assets/icons/python.svg",
        group: "Programming",
        desc: "Scripting, automation and backend logic."
    },

    {
        name: "SQL",
        icon: "./assets/icons/sql.svg",
        group: "Programming",
        desc: "Querying and structuring relational data."
    },


    /* -----------------------------------------------------
       DESIGN
       ----------------------------------------------------- */

    {
        name: "Figma",
        icon: "./assets/icons/figma.svg",
        group: "Design",
        desc: "Interface design and prototyping."
    },

    {
        name: "Photoshop",
        icon: "./assets/icons/photoshop.svg",
        group: "Design",
        desc: "Image editing and visual composition."
    },

    {
        name: "InDesign",
        icon: "./assets/icons/indesign.svg",
        group: "Design",
        desc: "Layout design for print and digital."
    },

    {
        name: "Canva",
        icon: "./assets/icons/canva.svg",
        group: "Design",
        desc: "Fast visual assets and marketing materials."
    },


    /* -----------------------------------------------------
       3D / INTERACTIVE
       ----------------------------------------------------- */

    {
        name: "Three.js",
        icon: "./assets/icons/threejs.svg",
        group: "3D / Interactive",
        desc: "Real-time 3D and WebGL experiences."
    },

    {
        name: "Blender",
        icon: "./assets/icons/blender.svg",
        group: "3D / Interactive",
        desc: "3D modeling and asset creation."
    },

    {
        name: "Unity",
        icon: "./assets/icons/unity.svg",
        group: "3D / Interactive",
        desc: "Real-time interactive and game development."
    }

];


/* =========================================================
   TECH STACK INITIALIZATION
   ========================================================= */

function initTechStack() {

    const grid = document.getElementById("techGrid");

    if (!grid) {
        return;
    }


    const filters = document.querySelectorAll(".stack-filter");

    const countElement =
        document.getElementById("stackCount");

    const inspector =
        document.getElementById("techInspector");

    const inspectorIcon =
        document.getElementById("inspectorIconImage");

    const inspectorName =
        document.getElementById("inspectorName");

    const inspectorGroup =
        document.getElementById("inspectorGroup");

    const inspectorDescription =
        document.getElementById("inspectorDescription");

    const inspectorIndex =
        document.getElementById("inspectorIndex");

    let headerText = document.getElementById("header_text");
    let currentFilter = "all";
    let selectedIndex = 0;


    /* =====================================================
       CREATE TECHNOLOGY CARD
       ===================================================== */

    function createCard(item, index) {

        const card =
            document.createElement("button");

        card.type = "button";

        card.className = "tech-card";

        card.dataset.group = item.group;

        card.dataset.index = index;


        /*
         * Technology number
         */

        const number =
            String(index + 1).padStart(2, "0");


        /*
         * Card HTML
         */

        card.innerHTML = `

            <span class="tech-card-number">
                ${number}
            </span>

            <span class="tech-card-corner"></span>

            <span class="tech-icon">

                <span class="tech-icon-glow"></span>

                <img
                    src="${item.icon}"
                    alt="${item.name}"
                    loading="lazy"
                >

            </span>

            <span class="tech-card-info">

                <span class="tech-card-name">
                    ${item.name}
                </span>

                <span class="tech-card-group">
                    ${item.group}
                </span>

            </span>

            <span class="tech-card-arrow">
                <span class="material-symbols-outlined">arrow_right</span>
            </span>

        `;


        /*
         * Click / tap
         */

        card.addEventListener("click", () => {

            selectTechnology(item, index);

        });


        /*
         * Mouse movement spotlight
         */

        card.addEventListener("pointermove", (event) => {

            const rect =
                card.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;


            card.style.setProperty(
                "--mouse-x",
                `${x}px`
            );

            card.style.setProperty(
                "--mouse-y",
                `${y}px`
            );

        });


        return card;
    }


    /* =====================================================
       RENDER TECHNOLOGIES
       ===================================================== */

    function renderTechnologies() {

        grid.innerHTML = "";

        if(currentFilter=='Web'){
          headerText.textContent = "Web Development"
        }
        else{
          headerText.textContent = currentFilter;
        }

        headerText.style.textTransform = 'uppercase';

        

        const filtered =
            STACK_DATA.filter(item => {

                if (currentFilter === "all") {
                    return true;
                }

                return item.group === currentFilter;

            });


        filtered.forEach((item) => {

            const originalIndex =
                STACK_DATA.indexOf(item);

            const card =
                createCard(
                    item,
                    originalIndex
                );


            grid.appendChild(card);

        });


        /*
         * Update technology counter
         */

        if (countElement) {

            countElement.textContent =
                String(filtered.length).padStart(2, "0");

        }


        /*
         * Small entrance animation
         */

        requestAnimationFrame(() => {

            const cards =
                grid.querySelectorAll(".tech-card");

            cards.forEach((card, index) => {

                card.style.setProperty(
                    "--card-delay",
                    `${index * 35}ms`
                );

            });

        });


        /*
         * Keep selected item visible
         */

        if (
            STACK_DATA[selectedIndex] &&
            (
                currentFilter === "all" ||
                STACK_DATA[selectedIndex].group === currentFilter
            )
        ) {

            selectTechnology(
                STACK_DATA[selectedIndex],
                selectedIndex,
                false
            );

        } else if (filtered.length) {

            selectTechnology(
                filtered[0],
                STACK_DATA.indexOf(filtered[0]),
                false
            );

        }

    }


    /* =====================================================
       SELECT TECHNOLOGY
       ===================================================== */

    function selectTechnology(
        item,
        index,
        animate = true
    ) {

        selectedIndex = index;


        /*
         * Update inspector
         */

        if (inspectorIcon) {

            inspectorIcon.src =
                item.icon;

            inspectorIcon.alt =
                item.name;

        }


        if (inspectorName) {

            inspectorName.textContent =
                item.name;

        }


        if (inspectorGroup) {

            inspectorGroup.textContent =
                item.group.toUpperCase();

        }


        if (inspectorDescription) {

            inspectorDescription.textContent =
                item.desc;

        }


        if (inspectorIndex) {

            inspectorIndex.textContent =
                String(index + 1).padStart(2, "0");

        }


        /*
         * Highlight active card
         */

        const cards =
            grid.querySelectorAll(".tech-card");

        cards.forEach(card => {

            card.classList.remove("selected");

        });


        const activeCard =
            grid.querySelector(
                `[data-index="${index}"]`
            );


        if (activeCard) {

            activeCard.classList.add("selected");

        }


        /*
         * Inspector animation
         */

        if (
            animate &&
            inspector
        ) {

            inspector.classList.remove(
                "inspector-refresh"
            );


            void inspector.offsetWidth;


            inspector.classList.add(
                "inspector-refresh"
            );

        }

    }


    /* =====================================================
       FILTER SYSTEM
       ===================================================== */

    filters.forEach(filter => {

        filter.addEventListener("click", () => {

            const value =
                filter.dataset.filter;


            currentFilter =
                value;


            /*
             * Update active filter
             */

            filters.forEach(button => {

                button.classList.remove(
                    "active"
                );

            });


            filter.classList.add("active");


            /*
             * Render filtered cards
             */

            renderTechnologies();

        });

    });


    /* =====================================================
       KEYBOARD NAVIGATION
       ===================================================== */

    document.addEventListener("keydown", (event) => {

        /*
         * Only activate when the section
         * is currently visible.
         */

        const section =
            document.getElementById("stack");

        if (!section) {
            return;
        }


        const rect =
            section.getBoundingClientRect();

        const visible =
            rect.top < window.innerHeight &&
            rect.bottom > 0;


        if (!visible) {
            return;
        }


        /*
         * Arrow navigation
         */

        if (
            event.key === "ArrowRight" ||
            event.key === "ArrowDown"
        ) {

            selectedIndex =
                Math.min(
                    selectedIndex + 1,
                    STACK_DATA.length - 1
                );


            const item =
                STACK_DATA[selectedIndex];


            if (
                currentFilter === "all" ||
                item.group === currentFilter
            ) {

                selectTechnology(
                    item,
                    selectedIndex
                );

            }

        }


        if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowUp"
        ) {

            selectedIndex =
                Math.max(
                    selectedIndex - 1,
                    0
                );


            const item =
                STACK_DATA[selectedIndex];


            if (
                currentFilter === "all" ||
                item.group === currentFilter
            ) {

                selectTechnology(
                    item,
                    selectedIndex
                );

            }

        }

    });


    /* =====================================================
       INTERSECTION OBSERVER
       ===================================================== */

    const section =
        document.getElementById("stack");


    if (section) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            section.classList.add(
                                "stack-visible"
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );


        observer.observe(section);

    }


    /* =====================================================
       INITIAL RENDER
       ===================================================== */

    renderTechnologies();


    /*
     * Select HTML by default
     */

    if (STACK_DATA.length) {

        selectTechnology(
            STACK_DATA[0],
            0,
            false
        );

    }

}


/* =========================================================
   START
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initTechStack
    );

} else {

    initTechStack();

}

/* ---------------------------------------------------------
   10. TERMINAL TYPING EFFECT
   --------------------------------------------------------- */
function initTerminal() {
  const body = document.getElementById("terminalBody");
  if (!body) return;

  const lines = [
    "> whoami",
    "kurtallenk-web developer, est. 10+ years",
    "",
    "> cat philosophy.txt",
    "started with HTML, CSS, JavaScript & databases.",
    "still believe the fundamentals are the fastest",
    "way to build something real.",
    "",
    "> ls ./stack",
    "html  css  javascript  php  mysql  csharp",
    "python  java  sql  threejs  wordpress",
    "",
    "> echo $STATUS",
    "ONLINE-building.",
  ];

  let visible = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !visible) { visible = true; type(); io.disconnect(); }
    });
  }, { threshold: 0.4 });
  io.observe(document.getElementById("terminal"));

  function type() {
    if (prefersReducedMotion) {
      body.textContent = lines.join("\n");
      return;
    }
    let li = 0, ci = 0;
    const cursor = document.createElement("span");
    cursor.className = "terminal-cursor";

    function step() {
      if (li >= lines.length) { body.appendChild(cursor); return; }
      const line = lines[li];
      if (ci <= line.length) {
        body.textContent = lines.slice(0, li).join("\n") + (li > 0 ? "\n" : "") + line.slice(0, ci);
        ci++;
        setTimeout(step, line.startsWith(">") ? 28 : 14);
      } else {
        li++; ci = 0;
        setTimeout(step, 120);
      }
    }
    step();
  }
}

/* ---------------------------------------------------------
   11. THE LAB — five on-demand experiments
   --------------------------------------------------------- */
function initLab() {
  const stage = document.getElementById("labStage");
  const canvas = document.getElementById("labCanvas");
  const closeBtn = document.getElementById("labClose");
  const stageLabel = document.getElementById("labStageLabel");
  const cards = document.querySelectorAll(".lab-card");
  if (!stage || !canvas) return;

  let renderer, scene, camera, animId, cleanupFn;

function teardown() {
  const driveControls = document.getElementById('driveControls');
  driveControls.style.display = "none";
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  if (cleanupFn) {
    try {
      cleanupFn();
    } catch (err) {
      console.warn("Lab cleanup error:", err);
    }

    cleanupFn = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;
}

  function openStage(exp) {
    stage.classList.add("is-open");
    stageLabel.textContent = exp.toUpperCase() + " — CLICK ✕ TO CLOSE";
    setupExperiment(exp);
  }
  function closeStage() {
    stage.classList.remove("is-open");
    teardown();
  }

  closeBtn.addEventListener("click", closeStage);
  stage.addEventListener("click", (e) => { if (e.target === stage) closeStage(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStage(); });

  cards.forEach((card) => {
    card.addEventListener("click", () => openStage(card.dataset.exp));
  });

  function baseSetup() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight || 1, 0.1, 100);
    camera.position.z = 6;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
  }

  function setupExperiment(exp) {
    const driveControls = document.getElementById('driveControls');

    teardown();
    baseSetup();
    const pointer = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    canvas.addEventListener("mousemove", onMove);
    cleanupFn = () => canvas.removeEventListener("mousemove", onMove);

    if (exp === "geometry") {
      const geo = new THREE.TorusKnotGeometry(1.3, 0.4, 150, 20);
      const mat = new THREE.MeshBasicMaterial({ color: 0x4cf3e0, wireframe: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      const clock = new THREE.Clock();
      const loop = () => {
        animId = requestAnimationFrame(loop);
        mesh.rotation.x = clock.getElapsedTime() * 0.4 + pointer.y;
        mesh.rotation.y = clock.getElapsedTime() * 0.3 + pointer.x;
        renderer.render(scene, camera);
      };
      loop();
    }

    if (exp === "particles") {
      const count = 1500;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0x9b6bff, size: 0.045 });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      const loop = () => {
        animId = requestAnimationFrame(loop);
        points.rotation.y += 0.0015;
        points.rotation.x = lerp(points.rotation.x, pointer.y * 0.5, 0.05);
        points.rotation.z = lerp(points.rotation.z, pointer.x * 0.5, 0.05);
        renderer.render(scene, camera);
      };
      loop();
    }

    if (exp === "physics") {
      const count = 14;
      const balls = [];
      const bounds = 3;
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.28, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: [0x4cf3e0, 0x9b6bff, 0x6e9bff][i % 3], wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * bounds * 2, (Math.random() - 0.5) * bounds * 2, 0);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 0);
        scene.add(mesh);
        balls.push(mesh);
      }
      const loop = () => {
        animId = requestAnimationFrame(loop);
        balls.forEach((b) => {
          b.position.add(b.userData.vel);
          if (Math.abs(b.position.x) > bounds) b.userData.vel.x *= -1;
          if (Math.abs(b.position.y) > bounds) b.userData.vel.y *= -1;
          const dx = b.position.x - pointer.x * bounds;
          const dy = b.position.y - pointer.y * bounds;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.2) {
            b.userData.vel.x += dx * 0.002;
            b.userData.vel.y += dy * 0.002;
          }
        });
        renderer.render(scene, camera);
      };
      loop();
    }

    if (exp === "webgl") {
      const geo = new THREE.SphereGeometry(1.6, 64, 64);
      const mat = new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.9, roughness: 0.15, wireframe: false });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      const light1 = new THREE.PointLight(0x4cf3e0, 40, 20);
      light1.position.set(3, 2, 3);
      const light2 = new THREE.PointLight(0x9b6bff, 40, 20);
      light2.position.set(-3, -2, 2);
      scene.add(light1, light2, new THREE.AmbientLight(0xffffff, 0.15));
      const loop = () => {
        animId = requestAnimationFrame(loop);
        mesh.rotation.y += 0.004;
        light1.position.x = Math.sin(Date.now() * 0.001) * 4;
        light2.position.x = pointer.x * 4;
        light2.position.y = pointer.y * 4;
        renderer.render(scene, camera);
      };
      loop();
    }

    if (exp === "motion") {
      const group = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x6e9bff, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        const angle = (i / 8) * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
        group.add(mesh);
      }
      scene.add(group);
      if (gsap) {
        gsap.to(group.rotation, { z: Math.PI * 2, duration: 6, repeat: -1, ease: "none" });
        group.children.forEach((m, i) => {
          gsap.to(m.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 1, delay: i * 0.1, yoyo: true, repeat: -1, ease: "sine.inOut" });
        });
      }
      const loop = () => {
        animId = requestAnimationFrame(loop);
        renderer.render(scene, camera);
      };
      loop();
    }

    // =========================================================
// CAR DRIVING
// =========================================================
if (exp === "drive") {
  
  if(isMobile){
    driveControls.style.display = "flex";
  }
  
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  let destroyed = false;
  let driveAnimId = null;

  const driveCleanups = [];


  let carModel = null;

  let wheelFL = null;
  let wheelFR = null;
  let wheelRL = null;
  let wheelRR = null;


  // -------------------------------------------------------
  // CAMERA
  // -------------------------------------------------------

  camera.position.set(
    0,
    10,
    10
  );

  camera.lookAt(
    0,
    0,
    0
  );


  // -------------------------------------------------------
  // LIGHT
  // -------------------------------------------------------

  const pointLight = new THREE.PointLight(
    0xffffff,
    50
  );

  pointLight.position.set(
    0,
    10,
    0
  );


  const pointLight2 = new THREE.PointLight(
    0xffffff,
    50
  );

  pointLight2.position.set(
    0,
    5,
    5
  );


  const pointLightCar = new THREE.PointLight(
    0xffffff,
    50
  );


  scene.add(pointLight);
  scene.add(pointLight2);
  scene.add(pointLightCar);


  // -------------------------------------------------------
  // CONTROLS
  // -------------------------------------------------------

  const controls = new OrbitControls(
    camera,
    canvas
  );

  controls.enabled = false;


  // -------------------------------------------------------
  // INPUT
  // -------------------------------------------------------

  const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false
  };


  function setKey(key, value) {

    if (destroyed) return;

    keysPressed[key] = value;

  }


  // -------------------------------------------------------
  // KEYBOARD
  // -------------------------------------------------------

  function onKeyDown(e) {

    const key =
      e.key.toLowerCase();


    if (key in keysPressed) {

      setKey(key, true);

    }

  }


  function onKeyUp(e) {

    const key =
      e.key.toLowerCase();


    if (key in keysPressed) {

      setKey(key, false);

    }

  }


  window.addEventListener(
    "keydown",
    onKeyDown
  );

  window.addEventListener(
    "keyup",
    onKeyUp
  );


  driveCleanups.push(() => {

    window.removeEventListener(
      "keydown",
      onKeyDown
    );

    window.removeEventListener(
      "keyup",
      onKeyUp
    );

  });


  // -------------------------------------------------------
  // BUTTONS
  // -------------------------------------------------------

  const gasBtn =
    document.getElementById("gas");

  const reverseBtn =
    document.getElementById("reverse");

  const leftBtn =
    document.getElementById("steerLeft");

  const rightBtn =
    document.getElementById("steerRight");


function bindButton(button, key) {

  if (!button) return;


  const press = (e) => {

    e.preventDefault();

    setKey(key, true);

    button.classList.add("is-pressed");

  };


  const release = (e) => {

    e.preventDefault();

    setKey(key, false);

    button.classList.remove("is-pressed");

  };


  button.addEventListener(
    "mousedown",
    press
  );

  button.addEventListener(
    "mouseup",
    release
  );

  button.addEventListener(
    "mouseleave",
    release
  );


  button.addEventListener(
    "touchstart",
    press,
    { passive: false }
  );

  button.addEventListener(
    "touchend",
    release,
    { passive: false }
  );

  button.addEventListener(
    "touchcancel",
    release,
    { passive: false }
  );


  driveCleanups.push(() => {

    button.classList.remove(
      "is-pressed"
    );


    button.removeEventListener(
      "mousedown",
      press
    );

    button.removeEventListener(
      "mouseup",
      release
    );

    button.removeEventListener(
      "mouseleave",
      release
    );

    button.removeEventListener(
      "touchstart",
      press
    );

    button.removeEventListener(
      "touchend",
      release
    );

    button.removeEventListener(
      "touchcancel",
      release
    );

  });

}


  bindButton(
    gasBtn,
    "w"
  );

  bindButton(
    reverseBtn,
    "s"
  );

  bindButton(
    leftBtn,
    "a"
  );

  bindButton(
    rightBtn,
    "d"
  );


  // -------------------------------------------------------
  // CAR PHYSICS
  // -------------------------------------------------------

  let speed = 0;

  let steeringAngle = 0;

  let wheelSpinAngle = 0;


  const acceleration = 12;
  const brakePower = 20;
  const friction = 8;

  const maxForwardSpeed = 20;
  const maxReverseSpeed = -8;

  const turnSpeed = 2.5;

  const maxSteeringAngle = 0.45;
  const steeringSpeed = 3;


  const steeringQuat =
    new THREE.Quaternion();

  const spinQuat =
    new THREE.Quaternion();


  const steeringAxis =
    new THREE.Vector3(
      0,
      1,
      0
    );


  const spinAxis =
    new THREE.Vector3(
      1,
      0,
      0
    );


  const clock =
    new THREE.Clock();


  // -------------------------------------------------------
  // GLTF
  // -------------------------------------------------------

  const loader =
    new GLTFLoader();


  function loadGLTF(url) {

    return new Promise(
      (resolve, reject) => {

        loader.load(

          url,

          (gltf) => {

            resolve(
              gltf.scene
            );

          },

          undefined,

          reject

        );

      }
    );

  }


  // -------------------------------------------------------
  // LOAD MODELS
  // -------------------------------------------------------

  async function loadCarScene() {

    try {
      const [env, car] =
        await Promise.all([

          loadGLTF(
            "assets/glb/Env_no_car.glb"
          ),

          loadGLTF(
            "assets/glb/mini_car.glb"
          )

        ]);


      // User closed the experiment
      if (destroyed) {

        disposeObject(env);
        disposeObject(car);

        return;

      }


      // ---------------------------------------------------
      // ENVIRONMENT
      // ---------------------------------------------------

      env.position.set(
        0,
        0,
        0
      );


      scene.add(env);


      // ---------------------------------------------------
      // CAR
      // ---------------------------------------------------

      carModel = car;


      carModel.position.set(
        0,
        0,
        0
      );


      scene.add(
        carModel
      );


      // ---------------------------------------------------
      // WHEELS
      // ---------------------------------------------------

      wheelFL =
        carModel.getObjectByName(
          "front_wheel_left"
        );

      wheelFR =
        carModel.getObjectByName(
          "front_wheel_right"
        );

      wheelRL =
        carModel.getObjectByName(
          "rear_wheel_left"
        );

      wheelRR =
        carModel.getObjectByName(
          "rear_wheel_right"
        );


    } catch (error) {

      if (!destroyed) {

        console.error(
          "CAR DRIVING LOAD ERROR:",
          error
        );

      }

    }

  }


  loadCarScene();


  // -------------------------------------------------------
  // ANIMATION
  // -------------------------------------------------------

  function animateDrive() {

    if (destroyed) {
      return;
    }


    driveAnimId =
      requestAnimationFrame(
        animateDrive
      );


    const delta =
      Math.min(
        clock.getDelta(),
        0.05
      );


    // -----------------------------------------------------
    // CAR
    // -----------------------------------------------------

    if (carModel) {


      // ---------------------------------------------------
      // ACCELERATION
      // ---------------------------------------------------

      if (keysPressed.w) {

        speed +=
          acceleration *
          delta;

      }


      if (keysPressed.s) {

        speed -=
          brakePower *
          delta;

      }


      speed = THREE.MathUtils.clamp(
        speed,
        maxReverseSpeed,
        maxForwardSpeed
      );


      // ---------------------------------------------------
      // FRICTION
      // ---------------------------------------------------

      if (
        !keysPressed.w &&
        !keysPressed.s
      ) {

        if (speed > 0) {

          speed -=
            friction *
            delta;

          if (speed < 0) {
            speed = 0;
          }

        }


        if (speed < 0) {

          speed +=
            friction *
            delta;

          if (speed > 0) {
            speed = 0;
          }

        }

      }


      // ---------------------------------------------------
      // STEERING
      // ---------------------------------------------------

      if (keysPressed.a) {

        steeringAngle +=
          steeringSpeed *
          delta;

      }


      if (keysPressed.d) {

        steeringAngle -=
          steeringSpeed *
          delta;

      }


      steeringAngle =
        THREE.MathUtils.clamp(
          steeringAngle,
          -maxSteeringAngle,
          maxSteeringAngle
        );


      if (
        !keysPressed.a &&
        !keysPressed.d
      ) {

        steeringAngle =
          THREE.MathUtils.damp(
            steeringAngle,
            0,
            steeringSpeed,
            delta
          );

      }


      // ---------------------------------------------------
      // TURN
      // ---------------------------------------------------

      if (
        Math.abs(speed) > 0.05
      ) {

        const steerAmount =
          turnSpeed *
          delta *
          (
            Math.abs(speed) /
            maxForwardSpeed
          );


        const direction =
          speed >= 0
            ? 1
            : -1;


        carModel.rotation.y +=

          (
            steeringAngle /
            maxSteeringAngle
          )

          * steerAmount
          * direction;

      }


      // ---------------------------------------------------
      // MOVE
      // ---------------------------------------------------

      carModel.translateZ(
        speed * delta
      );


      // ---------------------------------------------------
      // WHEELS
      // ---------------------------------------------------

      wheelSpinAngle +=
        speed *
        delta *
        3;


      steeringQuat.setFromAxisAngle(
        steeringAxis,
        steeringAngle
      );


      spinQuat.setFromAxisAngle(
        spinAxis,
        wheelSpinAngle
      );


      if (wheelFL) {

        wheelFL.quaternion
          .copy(steeringQuat)
          .multiply(spinQuat);

      }


      if (wheelFR) {

        wheelFR.quaternion
          .copy(steeringQuat)
          .multiply(spinQuat);

      }


      if (wheelRL) {

        wheelRL.quaternion.setFromAxisAngle(
          spinAxis,
          wheelSpinAngle
        );

      }


      if (wheelRR) {

        wheelRR.quaternion.setFromAxisAngle(
          spinAxis,
          wheelSpinAngle
        );

      }


      // ---------------------------------------------------
      // CAMERA FOLLOW
      // ---------------------------------------------------

      const p =
        carModel.position;


      camera.position.x =
        THREE.MathUtils.lerp(
          camera.position.x,
          p.x,
          0.08
        );


      camera.position.y =
        THREE.MathUtils.lerp(
          camera.position.y,
          p.y + 10,
          0.08
        );


      camera.position.z =
        THREE.MathUtils.lerp(
          camera.position.z,
          p.z + 10,
          0.08
        );


      camera.lookAt(
        p.x,
        p.y,
        p.z
      );


      // ---------------------------------------------------
      // LIGHT
      // ---------------------------------------------------

      pointLightCar.position.set(
        p.x,
        p.y + 5,
        p.z
      );

    }


    // -----------------------------------------------------
    // RENDER
    // -----------------------------------------------------

    renderer.render(
      scene,
      camera
    );

  }


  // START
  animateDrive();


  // -------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------

  cleanupFn = () => {

    console.log(
      "Closing CAR DRIVING"
    );


    destroyed = true;


    // Stop animation
    if (
      driveAnimId !== null
    ) {

      cancelAnimationFrame(
        driveAnimId
      );

      driveAnimId = null;

    }


    // Reset keys
    keysPressed.w = false;
    keysPressed.a = false;
    keysPressed.s = false;
    keysPressed.d = false;


    // Remove listeners
    driveCleanups.forEach(
      fn => {

        try {
          fn();
        } catch (e) {
          console.warn(e);
        }

      }
    );


    // Dispose controls
    controls.dispose();


    // Clear references
    carModel = null;

    wheelFL = null;
    wheelFR = null;
    wheelRL = null;
    wheelRR = null;


    // Dispose scene resources
    if (scene) {

      scene.traverse(
        (object) => {

          if (object.geometry) {

            object.geometry.dispose();

          }


          if (object.material) {

            if (
              Array.isArray(
                object.material
              )
            ) {

              object.material.forEach(
                material => {

                  material.dispose();
                }
              );

            } else {

              object.material.dispose();

            }

          }

        }
      );

    }

  };


  // -------------------------------------------------------
  // DISPOSE HELPER
  // -------------------------------------------------------

  function disposeObject(object) {

    if (!object) return;


    object.traverse(
      (child) => {

        if (child.geometry) {

          child.geometry.dispose();

        }


        if (child.material) {

          if (
            Array.isArray(
              child.material
            )
          ) {

            child.material.forEach(
              material => {

                material.dispose();

              }
            );

          } else {

            child.material.dispose();

          }

        }

      }
    );

  }

}
// =========================================================
// CAR DRIVING END
// =========================================================

  }
}

/* ---------------------------------------------------------
   12. EASTER EGG — type "KURT" SEE easterEgg.js
   --------------------------------------------------------- */
// function initEasterEgg() {
//   const target = "kurt";
//   let buffer = "";
//   window.addEventListener("keydown", (e) => {
//     if (e.key.length !== 1) return;
//     buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
//     if (buffer === target) triggerEasterEgg();
//   });

//   function triggerEasterEgg() {
//     const flash = document.createElement("div");
//     flash.style.cssText = `
//       position:fixed; inset:0; z-index:9998; pointer-events:none;
//       background: radial-gradient(circle at 50% 50%, rgba(76,243,224,0.25), transparent 60%);
//       opacity:0; transition: opacity .3s ease;
//     `;
//     document.body.appendChild(flash);
//     requestAnimationFrame(() => { flash.style.opacity = "1"; });
//     const live = document.getElementById("srLive");
//     if (live) live.textContent = "Easter egg activated: hello from Kurt Allen.";
//     setTimeout(() => { flash.style.opacity = "0"; setTimeout(() => flash.remove(), 400); }, 900);
//   }
// }

/* ---------------------------------------------------------
   13. CONTACT FORM
   --------------------------------------------------------- */
function initContactFormUI() {

  const message =
    document.getElementById("contactMessage");

  const counter =
    document.getElementById("messageCounter");

  if (!message || !counter) return;

  function updateCounter() {

    counter.textContent =
      `${message.value.length} / 5000`;

  }

  message.addEventListener(
    "input",
    updateCounter
  );

  updateCounter();
}

/* ---------------------------------------------------------
   13. MISC
   --------------------------------------------------------- */
function initMisc() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

/* =========================================================
   14. HERO CTA → FLOATING CTA
   ========================================================= */

function initFloatingWorkButton() {

  const original =
    document.getElementById(
      "heroWorkButton"
    );

  const hero =
    document.querySelector(
      "#hero"
    );

  const contactSection =
    document.getElementById(
      "transmission_form"
    );

  if (!original || !hero || !contactSection) return;


  let floatingButton = null;

  let isFloating = false;

  let transitionRunning = false;


  /* =======================================================
     CREATE FLOATING BUTTON
     ======================================================= */

  function createFloatingButton() {

    if (floatingButton) return;


    floatingButton =
      original.cloneNode(true);


    floatingButton.id =
      "heroFloatingWorkButton";


    floatingButton.classList.remove(
      "magnetic"
    );


    floatingButton.classList.add(
      "hero-floating-cta"
    );


    /*
     * Making sure the clone doesn't
     * inherit weird positioning.
     */

    floatingButton.style.position =
      "fixed";


    floatingButton.style.margin =
      "0";

    floatingButton.style.zIndex = "49";


    document.body.appendChild(
      floatingButton
    );


    /*
     * Clicking the floating button
     * should behave exactly like
     * the original.
     */

    floatingButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        const target =
          document.querySelector(
            "#contact"
          );

        if (target) {

          target.scrollIntoView({
            behavior: "smooth"
          });

        }

      }
    );

  }


  /* =======================================================
     MOVE TO FLOATING POSITION
     ======================================================= */

  function showFloatingButton() {

    if (
      isFloating ||
      transitionRunning
    ) return;


    createFloatingButton();


    transitionRunning = true;


    /*
     * Get exact position of
     * original button.
     */

    const start =
      original.getBoundingClientRect();


    /*
     * Match dimensions.
     */

    floatingButton.style.width =
      `${start.width}px`;

    floatingButton.style.height =
      `${start.height}px`;


    /*
     * Start at exact original
     * button position.
     */

    floatingButton.style.left =
      `${start.left}px`;

    floatingButton.style.top =
      `${start.top}px`;


    floatingButton.style.right =
      "auto";

    floatingButton.style.bottom =
      "auto";


    /*
     * Make visible.
     */

    floatingButton.style.opacity =
      "1";


    /*
     * Hide original only after
     * clone is positioned.
     */

    original.style.visibility =
      "hidden";


    /*
     * Force browser layout.
     */

    floatingButton.getBoundingClientRect();


    /*
     * Calculate destination.
     */

    const isMobile =
      window.innerWidth <= 600;


    const right =
      isMobile ? 16 : 24;

    const bottom =
      isMobile ? 16 : 24;


    const floatingWidth = floatingButton.offsetWidth;


    const floatingHeight =
      floatingButton.offsetHeight;


    const endLeft =
      window.innerWidth -
      right -
      floatingWidth;


    const endTop =
      window.innerHeight -
      bottom -
      floatingHeight;


    /*
     * Animate!
     */

    const animation =
      floatingButton.animate(
        [
          {
            left:
              `${start.left}px`,

            top:
              `${start.top}px`,

            width:
              `${start.width}px`,

            height:
              `${start.height}px`,

            borderRadius:
              getComputedStyle(
                original
              ).borderRadius,

            opacity: 1
          },

          {
            left:
              `${endLeft}px`,

            top:
              `${endTop}px`,

            width:
              `${start.width}px`,

            height:
              `${start.height}px`,

            borderRadius:
              getComputedStyle(
                original
              ).borderRadius,

            opacity: 1
          }
        ],
        {
          duration: 700,

          easing:
            "cubic-bezier(.16, 1, .3, 1)",

          fill: "forwards"
        }
      );


    animation.finished
      .then(() => {

        /*
         * Switch to CSS floating
         * positioning.
         */

        floatingButton.style.left =
          "";

        floatingButton.style.top =
          "";

        floatingButton.style.width =
          "";

        floatingButton.style.height =
          "";

        floatingButton.classList.add(
          "is-active"
        );


        isFloating = true;

        transitionRunning = false;

      })
      .catch(() => {

        transitionRunning = false;

      });

  }


  /* =======================================================
     MOVE BACK TO HERO
     ======================================================= */

  function hideFloatingButton() {

    if (
      !isFloating ||
      transitionRunning ||
      !floatingButton
    ) return;


    transitionRunning = true;


    /*
     * Current floating position.
     */

    const current =
      floatingButton.getBoundingClientRect();


    /*
     * Original button's
     * position.
     */

    const target =
      original.getBoundingClientRect();


    /*
     * Temporarily remove fixed
     * CSS state.
     */

    floatingButton.classList.remove(
      "is-active"
    );


    floatingButton.style.left =
      `${current.left}px`;

    floatingButton.style.top =
      `${current.top}px`;

    floatingButton.style.width =
      `${current.width}px`;

    floatingButton.style.height =
      `${current.height}px`;

    floatingButton.style.right =
      "auto";

    floatingButton.style.bottom =
      "auto";

    floatingButton.style.opacity =
      "1";


    /*
     * Animate back.
     */

    const animation =
      floatingButton.animate(
        [
          {
            left:
              `${current.left}px`,

            top:
              `${current.top}px`,

            width:
              `${current.width}px`,

            height:
              `${current.height}px`,

            opacity: 1
          },

          {
            left:
              `${target.left}px`,

            top:
              `${target.top}px`,

            width:
              `${target.width}px`,

            height:
              `${target.height}px`,

            opacity: 1
          }
        ],
        {
          duration: 700,

          easing:
            "cubic-bezier(.16, 1, .3, 1)",

          fill: "forwards"
        }
      );


    animation.finished
      .then(() => {

        /*
         * Remove floating button.
         */

        floatingButton.remove();

        floatingButton = null;


        /*
         * Restore original.
         */

        original.style.visibility =
          "";


        isFloating = false;

        transitionRunning = false;

      })
      .catch(() => {

        transitionRunning = false;

      });

  }


  /* =======================================================
     OBSERVE HERO
     ======================================================= */

  const observer =
    new IntersectionObserver(
      (entries) => {

        const entry =
          entries[0];


        if (
          entry.isIntersecting
        ) {

          hideFloatingButton();

        } else {

          showFloatingButton();

        }

      },
      {
        threshold: 0.15
      }
    );


  observer.observe(hero);
  observer.observe(contactSection);


  /* =======================================================
     RESIZE
     ======================================================= */

  window.addEventListener(
    "resize",
    () => {

      if (
        floatingButton &&
        isFloating
      ) {

        const isMobile =
          window.innerWidth <= 600;


        const right =
          isMobile ? 16 : 24;

        const bottom =
          isMobile ? 16 : 24;


        floatingButton.style.right =
          `${right}px`;

        floatingButton.style.bottom =
          `${bottom}px`;

      }

    }
  );

}

initFloatingWorkButton();

/* =====================================================
   CONTACT FORM — FUTURISTIC TRANSMISSION SYSTEM
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const contactForm =
        document.getElementById("contactForm");

    const contactSubmit =
        document.getElementById("contactSubmit");

    const contactStatus =
        document.getElementById("contactFormStatus");

    const messageInput =
        document.getElementById("contactMessage");

    const messageCounter =
        document.getElementById("messageCounter");

    const toast =
        document.getElementById("transmissionToast");


    /* =================================================
       MESSAGE COUNTER
       ================================================= */

    if (messageInput && messageCounter) {

        const updateCounter = () => {

            const length =
                messageInput.value.length;

            messageCounter.textContent =
                `${length} / 5000`;

        };

        messageInput.addEventListener(
            "input",
            updateCounter
        );

        updateCounter();

    }


    /* =================================================
       TOAST FUNCTION
       ================================================= */

    let toastTimeout;

    function showTransmissionToast() {

        if (!toast) return;

        clearTimeout(toastTimeout);

        // Reset animation
        toast.classList.remove("active");

        // Force browser reflow
        void toast.offsetWidth;

        toast.classList.add("active");


        toastTimeout = setTimeout(() => {

            toast.classList.remove("active");

        }, 5000);

    }


    /* =================================================
       STATUS FUNCTION
       ================================================= */

    function setStatus(
        message,
        type = ""
    ) {

        if (!contactStatus) return;

        contactStatus.textContent =
            message;

        contactStatus.className =
            "contact-form-status-message visible";

        if (type) {
            contactStatus.classList.add(type);
        }

    }


    /* =================================================
       RESET BUTTON
       ================================================= */

    function resetSubmitButton() {

        if (!contactSubmit) return;

        contactSubmit.disabled = false;

        contactSubmit.classList.remove(
            "is-transmitting"
        );


        const text =
            contactSubmit.querySelector(
                ".contact-submit-text"
            );

        const icon =
            contactSubmit.querySelector(
                ".contact-submit-icon"
            );

        const arrow =
            contactSubmit.querySelector(
                ".contact-submit-arrow"
            );


        if (text) {
            text.textContent =
                "TRANSMIT MESSAGE";
        }

        if (icon) {
            icon.textContent = "↗";
        }

        if (arrow) {
            arrow.textContent = "→";
        }

    }

});


/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
initLoader();
initCursor();
initNav();
initReveal();
initMagnetic();
initTilt();
initCounters();
initHeroScene();
initAboutScene();
initTerminal();
initLab();
initContactFormUI();
initMisc();
