import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// ========== 音效系统 ==========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};

function createAmbientSound(type) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'wind') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 80;
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    gainNode.gain.value = 0.03;
  } else if (type === 'rain') {
    oscillator.type = 'white';
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    gainNode.gain.value = 0.08;
  } else if (type === 'water') {
    oscillator.type = 'sine';
    oscillator.frequency.value = 200;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    gainNode.gain.value = 0.02;
  }

  oscillator.start();
  return { oscillator, gainNode, filter };
}

function updateSoundVolume(type, volume) {
  if (sounds[type]) {
    sounds[type].gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.3);
  }
}

function startAmbientSounds() {
  sounds.wind = createAmbientSound('wind');
  sounds.water = createAmbientSound('water');
}

// 用户交互后启动音频
document.body.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    if (!sounds.wind) startAmbientSounds();
  }
}, { once: true });

// ========== 全局状态 ==========
const state = {
  weather: 'clear',
  timeOfDay: 'day',
  scene: 'forest',
  breathActive: false,
  autoWalk: false,
  moveSpeed: 1.0,
  volumes: { env: 0.7, music: 0.5 }
};

const movement = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
let prevTime = performance.now();

// ========== 场景初始化 ==========
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// VR 按钮
const vrBtn = VRButton.createButton(renderer);
document.getElementById('vr-btn').replaceWith(vrBtn);
vrBtn.id = 'vr-btn';

// ========== 光照 ==========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
sunLight.position.set(50, 80, 30);
sunLight.castShadow = true;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// ========== 地面 ==========
const groundGeo = new THREE.PlaneGeometry(500, 500, 100, 100);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x4a7c3f,
  roughness: 0.9,
  metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

// 地形起伏
const vertices = groundGeo.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i];
  const y = vertices[i + 1];
  vertices[i + 2] = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2 + Math.random() * 0.5;
}
groundGeo.attributes.position.needsUpdate = true;
groundGeo.computeVertexNormals();
scene.add(ground);

// ========== 天空 ==========
const skyGeo = new THREE.SphereGeometry(400, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({
  color: 0x87ceeb,
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ========== 树木 ==========
function createTree(x, z) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGeo = new THREE.ConeGeometry(2, 4, 8);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.y = 5;
  foliage.castShadow = true;
  group.add(foliage);

  group.position.set(x, 0, z);
  return group;
}

for (let i = 0; i < 80; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 15 + Math.random() * 80;
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  scene.add(createTree(x, z));
}

// ========== 水面 ==========
const waterGeo = new THREE.PlaneGeometry(40, 40);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x4a90e2,
  transparent: true,
  opacity: 0.7,
  roughness: 0.1,
  metalness: 0.8
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(-30, 0.1, -30);
scene.add(water);

// ========== 粒子系统 ==========
let particles = null;
let particleVelocities = [];

function createParticles(type) {
  if (particles) scene.remove(particles);

  const count = type === 'rain' ? 5000 : type === 'snow' ? 3000 : 0;
  if (count === 0) return;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  particleVelocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    particleVelocities.push(type === 'rain' ? -0.5 - Math.random() * 0.5 : -0.1 - Math.random() * 0.1);
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: type === 'rain' ? 0xaaaaaa : 0xffffff,
    size: type === 'rain' ? 0.1 : 0.3,
    transparent: true,
    opacity: type === 'rain' ? 0.6 : 0.8
  });

  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

function updateParticles() {
  if (!particles) return;

  const positions = particles.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += particleVelocities[i / 3];
    if (positions[i + 1] < 0) {
      positions[i + 1] = 100;
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

// ========== 天气切换 ==========
function setWeather(weather) {
  state.weather = weather;

  if (weather === 'rain') {
    createParticles('rain');
    scene.fog.color.setHex(0x708090);
    sky.material.color.setHex(0x708090);
    ambientLight.intensity = 0.4;
    sunLight.intensity = 0.6;

    if (!sounds.rain) sounds.rain = createAmbientSound('rain');
    updateSoundVolume('rain', 0.08 * state.volumes.env);
    updateSoundVolume('wind', 0.05 * state.volumes.env);
    updateSoundVolume('water', 0.01 * state.volumes.env);
  } else if (weather === 'snow') {
    createParticles('snow');
    scene.fog.color.setHex(0xd0d8e0);
    sky.material.color.setHex(0xd0d8e0);
    ambientLight.intensity = 0.7;
    sunLight.intensity = 0.8;

    if (sounds.rain) updateSoundVolume('rain', 0);
    updateSoundVolume('wind', 0.02 * state.volumes.env);
    updateSoundVolume('water', 0.01 * state.volumes.env);
  } else if (weather === 'fog') {
    if (particles) scene.remove(particles);
    particles = null;
    scene.fog.density = 0.05;
    scene.fog.color.setHex(0xc0c8d0);
    sky.material.color.setHex(0xc0c8d0);
    ambientLight.intensity = 0.5;
    sunLight.intensity = 0.5;

    if (sounds.rain) updateSoundVolume('rain', 0);
    updateSoundVolume('wind', 0.04 * state.volumes.env);
    updateSoundVolume('water', 0.015 * state.volumes.env);
  } else {
    if (particles) scene.remove(particles);
    particles = null;
    scene.fog.color.setHex(0x87ceeb);
    sky.material.color.setHex(0x87ceeb);
    ambientLight.intensity = 0.6;
    sunLight.intensity = 1.2;

    if (sounds.rain) updateSoundVolume('rain', 0);
    updateSoundVolume('wind', 0.03 * state.volumes.env);
    updateSoundVolume('water', 0.02 * state.volumes.env);
  }
}

// ========== 时间切换 ==========
function setTimeOfDay(time) {
  state.timeOfDay = time;

  if (time === 'dawn') {
    sky.material.color.setHex(0xffa07a);
    scene.fog.color.setHex(0xffa07a);
    sunLight.color.setHex(0xffb380);
    sunLight.intensity = 0.8;
    ambientLight.intensity = 0.4;
  } else if (time === 'day') {
    sky.material.color.setHex(0x87ceeb);
    scene.fog.color.setHex(0x87ceeb);
    sunLight.color.setHex(0xfff4e6);
    sunLight.intensity = 1.2;
    ambientLight.intensity = 0.6;
  } else if (time === 'sunset') {
    sky.material.color.setHex(0xff6347);
    scene.fog.color.setHex(0xff6347);
    sunLight.color.setHex(0xff8c69);
    sunLight.intensity = 0.9;
    ambientLight.intensity = 0.5;
  } else if (time === 'night') {
    sky.material.color.setHex(0x0a1428);
    scene.fog.color.setHex(0x0a1428);
    sunLight.color.setHex(0x6080c0);
    sunLight.intensity = 0.3;
    ambientLight.intensity = 0.2;
  }
}

// ========== 控制器 ==========
const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', () => {
  if (!document.getElementById('ui').classList.contains('open')) {
    controls.lock();
  }
});

controls.addEventListener('lock', () => {
  document.getElementById('hint').style.opacity = '0';
});

controls.addEventListener('unlock', () => {
  document.getElementById('hint').style.opacity = '1';
});

// ========== 键盘控制 ==========
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW': movement.forward = true; break;
    case 'KeyS': movement.backward = true; break;
    case 'KeyA': movement.left = true; break;
    case 'KeyD': movement.right = true; break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': movement.forward = false; break;
    case 'KeyS': movement.backward = false; break;
    case 'KeyA': movement.left = false; break;
    case 'KeyD': movement.right = false; break;
  }
});

// ========== UI 控制 ==========
document.getElementById('toggle-ui').addEventListener('click', () => {
  document.getElementById('ui').classList.toggle('open');
});

document.querySelectorAll('#weather-btns .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#weather-btns .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setWeather(btn.dataset.weather);
  });
});

document.querySelectorAll('#time-btns .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#time-btns .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setTimeOfDay(btn.dataset.time);
  });
});

document.getElementById('speed-slider').addEventListener('input', (e) => {
  state.moveSpeed = e.target.value / 10;
  document.getElementById('speed-val').textContent = state.moveSpeed.toFixed(1) + 'x';
});

document.getElementById('vol-env').addEventListener('input', (e) => {
  state.volumes.env = e.target.value / 100;
  document.getElementById('vol-env-val').textContent = e.target.value + '%';

  // 实时更新环境音量
  if (sounds.wind) updateSoundVolume('wind', 0.03 * state.volumes.env);
  if (sounds.water) updateSoundVolume('water', 0.02 * state.volumes.env);
  if (sounds.rain && state.weather === 'rain') updateSoundVolume('rain', 0.08 * state.volumes.env);
});

document.getElementById('vol-music').addEventListener('input', (e) => {
  state.volumes.music = e.target.value / 100;
  document.getElementById('vol-music-val').textContent = e.target.value + '%';
});

// ========== 呼吸引导 ==========
let breathInterval = null;

document.getElementById('breath-btn').addEventListener('click', () => {
  state.breathActive = !state.breathActive;
  const guide = document.getElementById('breath-guide');
  const circle = document.getElementById('breath-circle');
  const text = document.getElementById('breath-text');
  const btn = document.getElementById('breath-btn');

  if (state.breathActive) {
    btn.classList.add('active');
    guide.classList.add('active');

    let phase = 0;
    breathInterval = setInterval(() => {
      if (phase === 0) {
        text.textContent = '吸气...';
        circle.classList.remove('exhale');
        circle.classList.add('inhale');
        phase = 1;
      } else if (phase === 1) {
        text.textContent = '保持...';
        phase = 2;
      } else if (phase === 2) {
        text.textContent = '呼气...';
        circle.classList.remove('inhale');
        circle.classList.add('exhale');
        phase = 3;
      } else {
        text.textContent = '放松...';
        phase = 0;
      }
    }, 4000);
  } else {
    btn.classList.remove('active');
    guide.classList.remove('active');
    clearInterval(breathInterval);
  }
});

// ========== 自动漫游 ==========
document.getElementById('auto-walk-btn').addEventListener('click', () => {
  state.autoWalk = !state.autoWalk;
  document.getElementById('auto-walk-btn').classList.toggle('active');
});

// ========== 时间显示 ==========
function updateTimeDisplay() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('time-display').textContent = timeStr;
}
setInterval(updateTimeDisplay, 1000);
updateTimeDisplay();

// ========== 动画循环 ==========
function animate() {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  if (controls.isLocked || renderer.xr.isPresenting) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    const direction = new THREE.Vector3();
    const speed = state.moveSpeed * 10;

    if (movement.forward) velocity.z -= speed * delta;
    if (movement.backward) velocity.z += speed * delta;
    if (movement.left) velocity.x -= speed * delta;
    if (movement.right) velocity.x += speed * delta;

    if (state.autoWalk) {
      velocity.z -= speed * 0.3 * delta;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    camera.position.y = Math.max(1.6, camera.position.y);
  }

  updateParticles();

  water.material.opacity = 0.7 + Math.sin(time * 0.001) * 0.1;

  prevTime = time;
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// ========== 窗口调整 ==========
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== 加载完成 ==========
setTimeout(() => {
  document.getElementById('loading').classList.add('hidden');
}, 1500);

