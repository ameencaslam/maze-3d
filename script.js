// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 15;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set background color to sky blue
scene.background = new THREE.Color(0x87ceeb);

// Maze configuration
const mazeSize = 21; // Odd number to ensure walls on all sides
const cellSize = 2; // Increased cell size for wider paths
const wallHeight = 3; // Increased wall height
const wallThickness = 0.1;
const platformHeight = 0.2; // Height of the platform

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Create platform
function createPlatform() {
  const platformGeometry = new THREE.BoxGeometry(
    mazeSize * cellSize,
    platformHeight,
    mazeSize * cellSize
  );
  const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown color
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, -platformHeight / 2, 0); // Position it directly under the maze
  scene.add(platform);
}

// Call createPlatform before creating the maze
createPlatform();

// Create 2D maze
function create2DMaze() {
  const maze = Array(mazeSize)
    .fill()
    .map(() => Array(mazeSize).fill(1));

  function carve(x, y) {
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;

      if (
        nx > 0 &&
        nx < mazeSize - 1 &&
        ny > 0 &&
        ny < mazeSize - 1 &&
        maze[ny][nx] === 1
      ) {
        maze[y + dy][x + dx] = 0;
        maze[ny][nx] = 0;
        carve(nx, ny);
      }
    }
  }

  // Start carving from (1, 1)
  maze[1][1] = 0;
  carve(1, 1);

  // Ensure end is accessible
  maze[mazeSize - 2][mazeSize - 2] = 0;

  return maze;
}

// Convert 2D maze to 3D
function create3DMaze(maze2D) {
  const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
  const walls = new THREE.Group();

  for (let i = 0; i < mazeSize; i++) {
    for (let j = 0; j < mazeSize; j++) {
      if (maze2D[j][i] === 1) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(
          (i - mazeSize / 2 + 0.5) * cellSize,
          wallHeight / 2 + platformHeight / 2, // Place walls directly on the platform
          (j - mazeSize / 2 + 0.5) * cellSize
        );
        walls.add(wall);
      }
    }
  }

  scene.add(walls);
  return walls;
}

// Create and add maze to scene
const maze2D = create2DMaze();
const mazeWalls = create3DMaze(maze2D);

// First-person camera setup
const fpCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
fpCamera.near = 0.05; // Adjusted near clipping plane
fpCamera.updateProjectionMatrix();
scene.add(fpCamera);

// Player configuration
const playerHeight = 1.7;
const moveSpeed = 0.1; // Slightly increased move speed
const mouseSensitivity = 0.002;

// Player movement
const playerPosition = new THREE.Vector3();
let playerRotationX = 0;
let playerRotationY = 0;

function initializePlayerPosition() {
  const startX = (-mazeSize / 2 + 1.5) * cellSize; // Adjusted to center of first cell
  const startZ = (-mazeSize / 2 + 1.5) * cellSize; // Adjusted to center of first cell
  playerPosition.set(startX, playerHeight / 2 + platformHeight, startZ);
  updateCameraPosition();
}

function updateCameraPosition() {
  fpCamera.position.copy(playerPosition);
  fpCamera.rotation.order = "YXZ";
  fpCamera.rotation.y = playerRotationY;
  fpCamera.rotation.x = playerRotationX;
}

initializePlayerPosition();

// Movement controls
const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
};

document.addEventListener("keydown", (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
  }
});

// Mouse movement for rotation
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === renderer.domElement) {
    playerRotationY -= event.movementX * mouseSensitivity;
    playerRotationX -= event.movementY * mouseSensitivity;
    playerRotationX = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, playerRotationX)
    );
    updateCameraPosition();
  }
});

// Lock pointer on click
renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

function movePlayer() {
  const moveVector = new THREE.Vector3();
  if (keys.KeyW) moveVector.z -= 1;
  if (keys.KeyS) moveVector.z += 1;
  if (keys.KeyA) moveVector.x -= 1;
  if (keys.KeyD) moveVector.x += 1;

  moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotationY);
  moveVector.normalize().multiplyScalar(moveSpeed);

  const newPosition = playerPosition.clone().add(moveVector);
  if (!checkCollision(newPosition)) {
    playerPosition.copy(newPosition);
  }

  updateCameraPosition();
}

function checkCollision(position) {
  const mazeX = Math.floor((position.x + (mazeSize * cellSize) / 2) / cellSize);
  const mazeZ = Math.floor((position.z + (mazeSize * cellSize) / 2) / cellSize);

  // Check surrounding cells for collision
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const checkX = mazeX + dx;
      const checkZ = mazeZ + dz;
      if (
        checkX >= 0 &&
        checkX < mazeSize &&
        checkZ >= 0 &&
        checkZ < mazeSize
      ) {
        if (maze2D[checkZ][checkX] === 1) {
          const wallX = (checkX - mazeSize / 2 + 0.5) * cellSize;
          const wallZ = (checkZ - mazeSize / 2 + 0.5) * cellSize;
          const dx = position.x - wallX;
          const dz = position.z - wallZ;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < cellSize * 0.7) {
            // Increased collision distance
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  renderer.render(scene, fpCamera);
}
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  fpCamera.aspect = window.innerWidth / window.innerHeight;
  fpCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("Maze created");
