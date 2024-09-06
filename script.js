// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
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
const mazeSize = 5;
const cellSize = 2;
const wallHeight = 2;

// Create floor
const floorGeometry = new THREE.PlaneGeometry(
  mazeSize * cellSize,
  mazeSize * cellSize
);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xd2b48c }); // Tan color
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Add a directional light for shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Increase intensity
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Increase intensity
scene.add(ambientLight);

// Create maze walls
function createMazeWalls() {
  const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
  const wallMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 0,
  });

  // Create surrounding walls
  for (let i = -1; i <= mazeSize; i++) {
    for (let j = -1; j <= mazeSize; j++) {
      if (i === -1 || i === mazeSize || j === -1 || j === mazeSize) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(
          (i - mazeSize / 2 + 0.5) * cellSize,
          wallHeight / 2,
          (j - mazeSize / 2 + 0.5) * cellSize
        );
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
      }
    }
  }

  // Create inner maze walls
  for (let i = 0; i < mazeSize; i++) {
    for (let j = 0; j < mazeSize; j++) {
      // Clear area around spawn point (2x2 cells)
      if (i < 2 && j < 2) continue;

      if (Math.random() < 0.3) {
        // 30% chance of a wall
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(
          (i - mazeSize / 2 + 0.5) * cellSize,
          wallHeight / 2,
          (j - mazeSize / 2 + 0.5) * cellSize
        );
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);

        // Add slightly larger invisible wall for collision
        const collisionWallGeometry = new THREE.BoxGeometry(
          cellSize + 0.1,
          wallHeight,
          cellSize + 0.1
        );
        const collisionWallMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
        });
        const collisionWall = new THREE.Mesh(
          collisionWallGeometry,
          collisionWallMaterial
        );
        collisionWall.position.copy(wall.position);
        scene.add(collisionWall);
      }
    }
  }
}

createMazeWalls();

// Add this function after createMazeWalls()
const wallMargin = 0.2; // Minimum distance from walls

function checkCollision(x, z) {
  const gridX = Math.floor((x + (mazeSize * cellSize) / 2) / cellSize);
  const gridZ = Math.floor((z + (mazeSize * cellSize) / 2) / cellSize);

  // Check if the position is within the maze bounds
  if (gridX < 0 || gridX >= mazeSize || gridZ < 0 || gridZ >= mazeSize) {
    return true; // Collision with maze boundary
  }

  // Check if there's a wall at this position
  return scene.children.some((child) => {
    if (child.isMesh && child !== floor) {
      const dx = Math.abs(child.position.x - x);
      const dz = Math.abs(child.position.z - z);
      return dx < cellSize / 2 + wallMargin && dz < cellSize / 2 + wallMargin;
    }
    return false;
  });
}

// Set initial player position
const player = {
  x: (-mazeSize * cellSize) / 2 + cellSize,
  y: 1, // Eye level
  z: (-mazeSize * cellSize) / 2 + cellSize,
};

// Position the camera (first-person view)
camera.position.set(player.x, player.y, player.z);
camera.lookAt(player.x, player.y, player.z - 1); // Look slightly forward

// Movement variables
const moveSpeed = 0.12;
const keys = {};

// Add these variables near the top of your file, after the moveSpeed constant
let currentVelocity = new THREE.Vector3(0, 0, 0);
const acceleration = 0.008;
const deceleration = 0.03;
const maxSpeed = moveSpeed;

// Replace the existing updatePlayerPosition function with this one
function updatePlayerPosition() {
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  let targetVelocity = new THREE.Vector3(0, 0, 0);

  if (keys["KeyW"]) targetVelocity.add(forward);
  if (keys["KeyS"]) targetVelocity.sub(forward);
  if (keys["KeyA"]) targetVelocity.sub(right);
  if (keys["KeyD"]) targetVelocity.add(right);

  if (targetVelocity.length() > 0) {
    targetVelocity.normalize().multiplyScalar(maxSpeed);
  }

  currentVelocity.lerp(
    targetVelocity,
    keys["KeyW"] || keys["KeyS"] || keys["KeyA"] || keys["KeyD"]
      ? acceleration
      : deceleration
  );

  const newX = player.x + currentVelocity.x;
  const newZ = player.z + currentVelocity.z;

  if (!checkCollision(newX, player.z)) {
    player.x = newX;
  } else {
    currentVelocity.x = 0;
  }
  if (!checkCollision(player.x, newZ)) {
    player.z = newZ;
  } else {
    currentVelocity.z = 0;
  }

  camera.position.set(player.x, player.y, player.z);
  camera.rotation.y = yaw;
}

// Add these variables after the player object
let yaw = 0;
let isMouseLocked = false;

// Update the onMouseMove function
function onMouseMove(event) {
  if (isMouseLocked) {
    yaw -= event.movementX * 0.002;
    // Ensure yaw stays within 0 to 2π range
    yaw = yaw % (2 * Math.PI);
    if (yaw < 0) yaw += 2 * Math.PI;
  }
}

// Update or add these event listeners
document.addEventListener("mousemove", onMouseMove);

document.addEventListener("click", () => {
  if (!isMouseLocked) {
    document.body.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  isMouseLocked = document.pointerLockElement === document.body;
  instructions.style.display = isMouseLocked ? "none" : "block";
});

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

// Add this after creating the renderer
const instructions = document.createElement("div");
instructions.style.position = "absolute";
instructions.style.top = "10px";
instructions.style.width = "100%";
instructions.style.textAlign = "center";
instructions.style.color = "white";
instructions.style.fontFamily = "Arial, sans-serif";
instructions.innerHTML = "Click to start<br>WASD to move, Mouse to look";
document.body.appendChild(instructions);

// Key press event listener
document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

// Key release event listener
document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});
