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
const cellSize = 1;
const wallHeight = 0.5;
const wallThickness = 0.1;

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

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
          wallHeight / 2,
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

// Add start and end markers
function addStartEndMarkers() {
  const markerGeometry = new THREE.SphereGeometry(cellSize * 0.3, 32, 32);
  const startMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const endMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

  const startMarker = new THREE.Mesh(markerGeometry, startMaterial);
  startMarker.position.set(
    (-mazeSize / 2 + 1) * cellSize,
    wallHeight / 2,
    (-mazeSize / 2 + 1) * cellSize
  );
  scene.add(startMarker);

  const endMarker = new THREE.Mesh(markerGeometry, endMaterial);
  endMarker.position.set(
    (mazeSize / 2 - 1) * cellSize,
    wallHeight / 2,
    (mazeSize / 2 - 1) * cellSize
  );
  scene.add(endMarker);
}

addStartEndMarkers();

// Adjust camera position
camera.position.set(
  (mazeSize * cellSize) / 2,
  (mazeSize * cellSize) / 2,
  (mazeSize * cellSize) / 2
);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 15;
  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("Maze created");
