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

// Position the camera
camera.position.set(0, (mazeSize * cellSize) / 2, mazeSize * cellSize);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
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
