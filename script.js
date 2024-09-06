// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set background color to sky blue
scene.background = new THREE.Color(0x87ceeb);

// Maze configuration
const mazeSize = 5;
const cellSize = 2;
const wallHeight = 2;

// Create floor
const floorGeometry = new THREE.PlaneGeometry(
  mazeSize * cellSize,
  mazeSize * cellSize
);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Create maze walls
function createMazeWalls() {
  const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });

  for (let i = 0; i < mazeSize; i++) {
    for (let j = 0; j < mazeSize; j++) {
      if (Math.random() < 0.3) {
        // 30% chance of a wall
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(
          (i - mazeSize / 2 + 0.5) * cellSize,
          wallHeight / 2,
          (j - mazeSize / 2 + 0.5) * cellSize
        );
        scene.add(wall);
      }
    }
  }
}

createMazeWalls();

// Set initial player position
const player = {
  x: (-mazeSize * cellSize) / 2 + cellSize / 2,
  y: 1, // Eye level
  z: (-mazeSize * cellSize) / 2 + cellSize / 2,
};

// Position the camera (first-person view)
camera.position.set(player.x, player.y, player.z);
camera.lookAt(player.x, player.y, player.z - 1); // Look slightly forward

// Movement variables
const moveSpeed = 0.1;
const keys = {};

// Key press event listener
document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

// Key release event listener
document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// Update player position based on key presses
function updatePlayerPosition() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  if (keys["KeyW"]) {
    player.x += direction.x * moveSpeed;
    player.z += direction.z * moveSpeed;
  }
  if (keys["KeyS"]) {
    player.x -= direction.x * moveSpeed;
    player.z -= direction.z * moveSpeed;
  }
  if (keys["KeyA"]) {
    player.x += direction.z * moveSpeed;
    player.z -= direction.x * moveSpeed;
  }
  if (keys["KeyD"]) {
    player.x -= direction.z * moveSpeed;
    player.z += direction.x * moveSpeed;
  }

  camera.position.set(player.x, player.y, player.z);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

// Add these variables after the player object
let yaw = 0;
let pitch = 0;

// Add this function after updatePlayerPosition
function onMouseMove(event) {
  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

// Add this event listener before the animate function
document.addEventListener("mousemove", onMouseMove);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updatePlayerPosition();
  renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("Maze created");
