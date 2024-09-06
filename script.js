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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Reduced ambient light intensity
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(
  (mazeSize * cellSize) / 2,
  mazeSize * cellSize,
  (mazeSize * cellSize) / 2
);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = mazeSize * cellSize * 2;
directionalLight.shadow.camera.left = -mazeSize * cellSize;
directionalLight.shadow.camera.right = mazeSize * cellSize;
directionalLight.shadow.camera.top = mazeSize * cellSize;
directionalLight.shadow.camera.bottom = -mazeSize * cellSize;
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
  platform.receiveShadow = true;
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
          wallHeight / 2 + platformHeight / 2,
          (j - mazeSize / 2 + 0.5) * cellSize
        );
        wall.castShadow = true;
        wall.receiveShadow = false; // Walls don't receive shadows
        walls.add(wall);
      }
    }
  }

  // Create a single floor plane for the entire maze
  const floorGeometry = new THREE.PlaneGeometry(
    mazeSize * cellSize,
    mazeSize * cellSize
  );
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown color
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = platformHeight / 2;
  floor.receiveShadow = true;
  walls.add(floor);

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
  const startX = (-mazeSize / 2 + 1.5) * cellSize;
  const startZ = (-mazeSize / 2 + 1.5) * cellSize;
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
          if (distance < cellSize * 0.8) {
            // Increased collision distance
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Add top-down camera
const topCameraFrustumSize = mazeSize * cellSize;
const topCamera = new THREE.OrthographicCamera(
  -topCameraFrustumSize / 2,
  topCameraFrustumSize / 2,
  topCameraFrustumSize / 2,
  -topCameraFrustumSize / 2,
  0.1,
  1000
);
topCamera.position.set(0, mazeSize * cellSize, 0);
topCamera.lookAt(0, 0, 0);
topCamera.updateProjectionMatrix();

let currentCamera = fpCamera;

// Player marker for top-down view
const playerMarker = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1, 32),
  new THREE.MeshPhongMaterial({ color: 0xff0000 })
);
playerMarker.rotation.x = Math.PI / 2;
playerMarker.rotation.z = Math.PI / 2; // Rotate 90 degrees to the right
playerMarker.visible = false; // Initially invisible
playerMarker.castShadow = true;
scene.add(playerMarker);

// Update player marker position and rotation
function updatePlayerMarker() {
  playerMarker.position.copy(playerPosition);
  playerMarker.position.y = wallHeight + 0.5;
  playerMarker.rotation.z = -playerRotationY + Math.PI; // Adjusted rotation
}

// Add this function to create a 2D representation of the maze
function create2DMazeRepresentation() {
  const mazeContainer = document.createElement("div");
  mazeContainer.style.position = "absolute";
  mazeContainer.style.left = "50%";
  mazeContainer.style.top = "50%";
  mazeContainer.style.transform = "translate(-50%, -50%)";
  mazeContainer.style.display = "grid";
  mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, 1fr)`;
  mazeContainer.style.gap = "0";
  mazeContainer.style.backgroundColor = "#000";
  mazeContainer.style.padding = "0";

  const cellSize =
    Math.min(window.innerWidth / mazeSize, window.innerHeight / mazeSize) * 0.9;

  for (let j = 0; j < mazeSize; j++) {
    for (let i = 0; i < mazeSize; i++) {
      const cell = document.createElement("div");
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.backgroundColor = maze2D[j][i] === 1 ? "#808080" : "#fff";
      mazeContainer.appendChild(cell);
    }
  }

  // Add player marker (arrow)
  const playerMarker = document.createElement("div");
  playerMarker.style.position = "absolute";
  playerMarker.style.width = "0";
  playerMarker.style.height = "0";
  playerMarker.style.borderLeft = `${cellSize * 0.5}px solid transparent`;
  playerMarker.style.borderRight = `${cellSize * 0.5}px solid transparent`;
  playerMarker.style.borderBottom = `${cellSize * 1}px solid red`;
  playerMarker.style.transform = "translate(-50%, -50%)";
  mazeContainer.appendChild(playerMarker);

  return { mazeContainer, playerMarker, cellSize };
}

let maze2DRepresentation;
let playerMarker2D;
let cellSize2D;

// Modify the toggleView function
function toggleView() {
  if (currentCamera === fpCamera) {
    currentCamera = null;
    if (!maze2DRepresentation) {
      const { mazeContainer, playerMarker, cellSize } =
        create2DMazeRepresentation();
      maze2DRepresentation = mazeContainer;
      playerMarker2D = playerMarker;
      cellSize2D = cellSize;
      document.body.appendChild(maze2DRepresentation);
    }
    maze2DRepresentation.style.display = "grid";
    renderer.domElement.style.display = "none";
    updatePlayerMarker2D();
  } else {
    currentCamera = fpCamera;
    if (maze2DRepresentation) {
      maze2DRepresentation.style.display = "none";
    }
    renderer.domElement.style.display = "block";
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Update the 2D player marker position and rotation
function updatePlayerMarker2D() {
  if (playerMarker2D) {
    const mazeOffsetX = (mazeSize * cellSize) / 2;
    const mazeOffsetZ = (mazeSize * cellSize) / 2;

    // Calculate the position relative to the maze
    const x = (playerPosition.x + mazeOffsetX) / cellSize;
    const z = (playerPosition.z + mazeOffsetZ) / cellSize;

    playerMarker2D.style.left = `${x * cellSize2D}px`;
    playerMarker2D.style.top = `${z * cellSize2D}px`;

    // Update the rotation of the arrow (only Y-axis rotation)
    const rotation = -playerRotationY + Math.PI / 2;
    playerMarker2D.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
  }
}

// Add event listener to the button
document.getElementById("viewToggle").addEventListener("click", toggleView);

// Modify the window resize event listener
window.addEventListener("resize", () => {
  if (currentCamera === fpCamera) {
    fpCamera.aspect = window.innerWidth / window.innerHeight;
    fpCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  } else if (maze2DRepresentation) {
    // Recreate the 2D maze representation to fit the new window size
    document.body.removeChild(maze2DRepresentation);
    const { mazeContainer, playerMarker, cellSize } =
      create2DMazeRepresentation();
    maze2DRepresentation = mazeContainer;
    playerMarker2D = playerMarker;
    cellSize2D = cellSize;
    document.body.appendChild(maze2DRepresentation);
    updatePlayerMarker2D();
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  updatePlayerMarker2D(); // Call this every frame
  if (currentCamera === fpCamera) {
    renderer.render(scene, currentCamera);
  }
}

// Start the animation loop
animate();

console.log("Maze created");
