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
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Set background color to sky blue
scene.background = new THREE.Color(0x87ceeb);

// Maze configuration
const mazeSize = 21;
const cellSize = 2.5;
const wallHeight = 3;
const wallThickness = 0.1;
const platformHeight = 0.2;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffd0, 0.9);
sunLight.position.set(
  mazeSize * cellSize * 0.5,
  mazeSize * cellSize * 1.5,
  mazeSize * cellSize * 0.5
);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = mazeSize * cellSize * 4;
sunLight.shadow.camera.left = -mazeSize * cellSize;
sunLight.shadow.camera.right = mazeSize * cellSize;
sunLight.shadow.camera.top = mazeSize * cellSize;
sunLight.shadow.camera.bottom = -mazeSize * cellSize;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

const fillLight = new THREE.HemisphereLight(0x8080ff, 0x404040, 0.5);
scene.add(fillLight);

// Create platform
function createPlatform() {
  const platformGeometry = new THREE.BoxGeometry(
    mazeSize * cellSize,
    platformHeight,
    mazeSize * cellSize
  );
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.2,
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, -platformHeight / 2, 0);
  platform.receiveShadow = true;
  scene.add(platform);
}

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

  // Set start and end points
  maze[1][1] = 2; // 2 represents the start point
  maze[mazeSize - 2][mazeSize - 2] = 3; // 3 represents the end point

  return maze;
}

// Convert 2D maze to 3D
function create3DMaze(maze2D) {
  const walls = new THREE.Group();

  const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const edgeGeometry = new THREE.CylinderGeometry(0.03, 0.03, wallHeight, 8);
  const outerEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.5,
    metalness: 0.5,
  });
  const innerEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    roughness: 0.5,
    metalness: 0.5,
  });

  function isCorner(x, y) {
    let adjacentWalls = 0;
    if (x > 0 && maze2D[y][x - 1] === 1) adjacentWalls++;
    if (x < mazeSize - 1 && maze2D[y][x + 1] === 1) adjacentWalls++;
    if (y > 0 && maze2D[y - 1][x] === 1) adjacentWalls++;
    if (y < mazeSize - 1 && maze2D[y + 1][x] === 1) adjacentWalls++;
    return adjacentWalls < 4; // Consider all cells with less than 4 adjacent walls as corners
  }

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
        wall.receiveShadow = true;
        walls.add(wall);

        // Add edge highlights for all corners
        if (isCorner(i, j)) {
          const edges = [
            { x: -1, z: -1 },
            { x: 1, z: -1 },
            { x: -1, z: 1 },
            { x: 1, z: 1 },
          ];

          edges.forEach((edge) => {
            const edgeMesh = new THREE.Mesh(
              edgeGeometry,
              i === 0 || i === mazeSize - 1 || j === 0 || j === mazeSize - 1
                ? outerEdgeMaterial
                : innerEdgeMaterial
            );
            edgeMesh.position.set(
              wall.position.x + (edge.x * cellSize) / 2,
              wall.position.y,
              wall.position.z + (edge.z * cellSize) / 2
            );
            edgeMesh.castShadow = true;
            walls.add(edgeMesh);
          });
        }
      }
    }
  }

  const floorGeometry = new THREE.PlaneGeometry(
    mazeSize * cellSize,
    mazeSize * cellSize
  );
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.8,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = platformHeight / 2;
  floor.receiveShadow = true;
  walls.add(floor);

  // Add start marker
  const startMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
    new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      roughness: 0.5,
      metalness: 0.5,
    })
  );
  startMarker.position.set(
    (1 - mazeSize / 2 + 0.5) * cellSize,
    platformHeight + 0.05,
    (1 - mazeSize / 2 + 0.5) * cellSize
  );
  startMarker.rotation.x = Math.PI / 2;
  startMarker.castShadow = true;
  walls.add(startMarker);

  // Add end sphere
  const endSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.2,
      metalness: 0.8,
    })
  );
  endSphere.position.set(
    (mazeSize - 2 - mazeSize / 2 + 0.5) * cellSize,
    platformHeight + 0.5,
    (mazeSize - 2 - mazeSize / 2 + 0.5) * cellSize
  );
  endSphere.castShadow = true;
  walls.add(endSphere);

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
fpCamera.near = 0.1;
fpCamera.far = mazeSize * cellSize;
fpCamera.updateProjectionMatrix();
scene.add(fpCamera);

// Player configuration
const playerHeight = 0.8;
const playerRadius = 0.2;
const moveSpeed = 0.07;
const mouseSensitivity = 0.002;

// Player movement
const playerPosition = new THREE.Vector3();
let playerRotationX = 0;
let playerRotationY = 0;

function initializePlayerPosition() {
  const startX = (-mazeSize / 2 + 1.5) * cellSize;
  const startZ = (-mazeSize / 2 + 1.5) * cellSize;
  playerPosition.set(startX, playerHeight / 2 + platformHeight, startZ);

  playerRotationY = Math.PI;

  playerRotationX = 0;
  updateCameraPosition();
}

function updateCameraPosition() {
  fpCamera.position.copy(playerPosition);
  fpCamera.position.y += playerHeight - 0.1;
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
          if (distance < cellSize / 2 + playerRadius + 0.3) {
            // Increase this value
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
playerMarker.rotation.z = Math.PI / 2;
playerMarker.visible = false;
playerMarker.castShadow = true;
scene.add(playerMarker);

// Update player marker position and rotation
function updatePlayerMarker() {
  playerMarker.position.copy(playerPosition);
  playerMarker.position.y = wallHeight + 0.5;
  playerMarker.rotation.z = -playerRotationY + Math.PI;
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
      if (maze2D[j][i] === 1) {
        cell.style.backgroundColor = "#808080";
      } else if (maze2D[j][i] === 2) {
        cell.style.backgroundColor = "#0000ff";
      } else if (maze2D[j][i] === 3) {
        cell.style.backgroundColor = "#00ff00";
      } else {
        cell.style.backgroundColor = "#fff";
      }
      mazeContainer.appendChild(cell);
    }
  }

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

function updatePlayerMarker2D() {
  if (playerMarker2D) {
    const mazeOffsetX = (mazeSize * cellSize) / 2;
    const mazeOffsetZ = (mazeSize * cellSize) / 2;

    const x = (playerPosition.x + mazeOffsetX) / cellSize;
    const z = (playerPosition.z + mazeOffsetZ) / cellSize;

    playerMarker2D.style.left = `${x * cellSize2D}px`;
    playerMarker2D.style.top = `${z * cellSize2D}px`;

    const rotation = -playerRotationY;
    playerMarker2D.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
  }
}

document.getElementById("viewToggle").addEventListener("click", toggleView);

window.addEventListener("resize", () => {
  if (currentCamera === fpCamera) {
    fpCamera.aspect = window.innerWidth / window.innerHeight;
    fpCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  } else if (maze2DRepresentation) {
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

function checkEndReached() {
  const endX = (mazeSize - 2 - mazeSize / 2 + 0.5) * cellSize;
  const endZ = (mazeSize - 2 - mazeSize / 2 + 0.5) * cellSize;
  const distance = playerPosition.distanceTo(
    new THREE.Vector3(endX, playerPosition.y, endZ)
  );

  if (distance < 0.5 + 0.5) {
    alert("Congratulations! You've completed the maze!");
    restartGame();
  }
}

function restartGame() {
  initializePlayerPosition();
  playerRotationX = 0;
  playerRotationY = 0;
  updateCameraPosition();
}

function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  updatePlayerMarker2D();
  checkEndReached();
  if (currentCamera === fpCamera) {
    renderer.render(scene, currentCamera);
  }
}

animate();

console.log("Maze created");
