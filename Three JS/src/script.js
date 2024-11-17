import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

const particleTexture = textureLoader.load('textures/particles/4.png');

const grassColorTexture = textureLoader.load('/textures/grass/color.jpg');

const sandTexture = textureLoader.load('/textures/sand.jpg'); // Beach sand texture
const waterTexture = textureLoader.load('/textures/water.jpg'); // Water texture

sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(4, 4);

grassColorTexture.repeat.set(8, 8);

/**
 * Lighting
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b8c4e6', 1.0); 
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight('#ffffff', 0.5);
directionalLight.position.set(10, 20, -10);
scene.add(directionalLight);

/**
 * Seasons
 */
const SEASONS = {
    WINTER: 'winter',
    SPRING: 'spring',
    SUMMER: 'summer',
    FALL: 'fall',
};
let currentSeason = SEASONS.SUMMER; // Start with summer season

// Tree color and ground texture change based on the season
function applySeasonChange(season) {
    switch (season) {
        case SEASONS.WINTER:
            treeMaterial.color.set('#FFFFFF'); // Trees covered in snow
            directionalLight.color.set('#a9c8ff'); // Cold lighting
            break;
        case SEASONS.SPRING:
            treeMaterial.color.set('#228b22'); // Green trees
            directionalLight.color.set('#ffffff'); // Neutral lighting
            break;
        case SEASONS.SUMMER:
            treeMaterial.color.set('#228b22'); // Green trees
            directionalLight.color.set('#ffd27f'); // Warm sunlight
            break;
        case SEASONS.FALL:
            treeMaterial.color.set('#D2691E'); // Brown/orange trees for fall
            directionalLight.color.set('#ffa500'); // Orange warm light for fall
            break;
    }

    // Update the ground material but leave greenSurface intact
    ground.material.needsUpdate = true;
}

/**
 * Sun/Moon Object
 */
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: '#ffd700' });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(10, 20, -30); // Position of the sun in the sky
scene.add(sun);

/**
 * Ground (Seasonal)
 */
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
    })
);
ground.rotation.x = -Math.PI * 0.5;
ground.position.y = 0;
scene.add(ground);

/**
 * Green Surface (Static)
 */
const greenSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        color: '#228B22' // Constant green color (Forest Green)
    })
);
greenSurface.rotation.x = -Math.PI * 0.5; // Make it flat on the ground
greenSurface.position.set(0, -0.01, 0); // Slightly below the main surface to avoid z-fighting
scene.add(greenSurface);

/**
 * Cliff
 */
const cliffGeometry = new THREE.BoxGeometry(50, 20, 50); // Dimensions of the cliff
const cliffMaterial = new THREE.MeshStandardMaterial({ color: '#D3D3D3' }); // Light grey color for the cliff

// Cliff Mesh
const cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
cliff.position.set(-30, 2, -50); // Position the cliff in the scene
cliff.castShadow = true; // Enable shadow casting for the cliff

scene.add(cliff); // Add the cliff to the scene

/**
 * Trees
 */
const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8b5a2b' });

const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 12);
const treeMaterial = new THREE.MeshStandardMaterial({ color: '#228b22' }); // Default to summer color

function addTree(x, z) {
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;

    const foliage = new THREE.Mesh(foliageGeometry, treeMaterial);
    foliage.position.set(x, 3, z);
    foliage.castShadow = true;

    scene.add(trunk);
    scene.add(foliage);
}

// Add 40-50 trees randomly in the scene
function addRandomTrees(count) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 80 - 40; // Random x position
        const z = Math.random() * 80 - 40; // Random z position
        addTree(x, z);
    }
}
addRandomTrees(200); // Add 200 random trees

/**
 * Sea
 */
const waterGeometry = new THREE.PlaneGeometry(100, 100, 128, 128); // Increased size for the sea
const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        waterTexture: { value: waterTexture }
    },
    vertexShader: `
    uniform float time;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 10.0 + time * 2.0) * 0.1;
        pos.z += sin(pos.y * 10.0 + time * 2.0) * 0.1;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
    fragmentShader: `
    uniform sampler2D waterTexture;
    varying vec2 vUv;
    void main() {
        vec4 color = texture2D(waterTexture, vUv);
        gl_FragColor = vec4(0.0, 0.5, 1.0, 0.8); // Blue semi-transparent water
    }
    `,
    transparent: true
});
const sea = new THREE.Mesh(waterGeometry, waterMaterial);
sea.rotation.x = -Math.PI * 0.5;
sea.position.set(0, 0, -60);
scene.add(sea);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200);
camera.position.set(10, 10, 20);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Keyboard Interaction for Camera Movement
 */
const movementSpeed = 0.5;
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp': // Move forward
            camera.position.z -= movementSpeed;
            break;
        case 'ArrowDown': // Move backward
            camera.position.z += movementSpeed;
            break;
        case 'ArrowLeft': // Move left
            camera.position.x -= movementSpeed;
            break;
        case 'ArrowRight': // Move right
            camera.position.x += movementSpeed;
            break;
    }
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#0a0a0a'); // Darker night sky color
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/**
 * Particles
 */
const particlesGeometry = new THREE.BufferGeometry();
const count = 100;

const positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 90;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.09,
    sizeAttenuation: true,
    transparent: true,
    alphaMap: particleTexture,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update particles
    particles.rotation.y = elapsedTime * 0.02;

    // Update sea current
    waterMaterial.uniforms.time.value = elapsedTime;

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

/**
 * Season Change on Sun/Moon Click
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sun]);

    if (intersects.length > 0) {
        // Change season
        if (currentSeason === SEASONS.WINTER) {
            currentSeason = SEASONS.SPRING;
        } else if (currentSeason === SEASONS.SPRING) {
            currentSeason = SEASONS.SUMMER;
        } else if (currentSeason === SEASONS.SUMMER) {
            currentSeason = SEASONS.FALL;
        } else if (currentSeason === SEASONS.FALL) {
            currentSeason = SEASONS.WINTER;
        }

        applySeasonChange(currentSeason);
    }
});
