// Global variables and game state
const gameState = {
  scene: null,
  camera: null,
  renderer: null,
  maze2D: null,
  playerPosition: new THREE.Vector3(),
  playerRotationX: 0,
  playerRotationY: 0,
  keys: {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  },
  currentCamera: null,
  dustParticles: null,
  playerHeight: 0.8,
  playerRadius: 0.2,
  moveSpeed: 0.07,
  mouseSensitivity: 0.002,
  mazeSize: 21,
  cellSize: 2.5,
  wallHeight: 3,
  platformHeight: 0.2,
  playerMarker2D: null,
  cellSize2D: null,
  maze2DRepresentation: null,
  endReached: false,
  isTouchDevice: false,
  leftJoystick: null,
  rightJoystick: null,
};

// Global functions
function movePlayer() {
  const moveVector = new THREE.Vector3();
  const speedMultiplier = gameState.isTouchDevice ? 0.5 : 1; // Adjust this value as needed

  if (gameState.isTouchDevice) {
    moveVector.z = gameState.keys.KeyW - gameState.keys.KeyS;
    moveVector.x = gameState.keys.KeyD - gameState.keys.KeyA;
  } else {
    if (gameState.keys.KeyW) moveVector.z -= 1;
    if (gameState.keys.KeyS) moveVector.z += 1;
    if (gameState.keys.KeyA) moveVector.x -= 1;
    if (gameState.keys.KeyD) moveVector.x += 1;
  }

  moveVector.applyQuaternion(gameState.camera.quaternion);
  moveVector.y = 0; // Prevent vertical movement
  moveVector.normalize().multiplyScalar(gameState.moveSpeed * speedMultiplier);

  const newPosition = gameState.playerPosition.clone().add(moveVector);
  if (!checkCollision(newPosition)) {
    gameState.playerPosition.copy(newPosition);
  }

  handleArrowKeyRotation();
  updateCameraPosition();
}

function updateCameraPosition() {
  gameState.camera.position.copy(gameState.playerPosition);
  gameState.camera.position.y += gameState.playerHeight;
  gameState.camera.rotation.order = "YXZ";
  gameState.camera.rotation.y = gameState.playerRotationY;
  gameState.camera.rotation.x = gameState.playerRotationX;
}

function checkCollision(position) {
  const mazeX = Math.floor(
    (position.x + (gameState.mazeSize * gameState.cellSize) / 2) /
      gameState.cellSize
  );
  const mazeZ = Math.floor(
    (position.z + (gameState.mazeSize * gameState.cellSize) / 2) /
      gameState.cellSize
  );

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const checkX = mazeX + dx;
      const checkZ = mazeZ + dz;
      if (
        checkX >= 0 &&
        checkX < gameState.mazeSize &&
        checkZ >= 0 &&
        checkZ < gameState.mazeSize
      ) {
        if (gameState.maze2D[checkZ][checkX] === 1) {
          const wallX =
            (checkX - gameState.mazeSize / 2 + 0.5) * gameState.cellSize;
          const wallZ =
            (checkZ - gameState.mazeSize / 2 + 0.5) * gameState.cellSize;
          const dx = position.x - wallX;
          const dz = position.z - wallZ;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (
            distance <
            gameState.cellSize / 2 + gameState.playerRadius + 0.3
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function updatePlayerMarker2D() {
  if (gameState.playerMarker2D) {
    const mazeOffsetX = (gameState.mazeSize * gameState.cellSize) / 2;
    const mazeOffsetZ = (gameState.mazeSize * gameState.cellSize) / 2;

    const x = (gameState.playerPosition.x + mazeOffsetX) / gameState.cellSize;
    const z = (gameState.playerPosition.z + mazeOffsetZ) / gameState.cellSize;

    gameState.playerMarker2D.style.left = `${x * gameState.cellSize2D}px`;
    gameState.playerMarker2D.style.top = `${z * gameState.cellSize2D}px`;

    const rotation = -gameState.playerRotationY;
    gameState.playerMarker2D.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
  }
}

function checkEndReached() {
  if (gameState.endReached) return;

  const endX =
    (gameState.mazeSize - 2 - gameState.mazeSize / 2 + 0.5) *
    gameState.cellSize;
  const endZ =
    (gameState.mazeSize - 2 - gameState.mazeSize / 2 + 0.5) *
    gameState.cellSize;
  const distance = gameState.playerPosition.distanceTo(
    new THREE.Vector3(endX, gameState.playerPosition.y, endZ)
  );

  if (distance < 0.5 + 0.5) {
    gameState.endReached = true;
    alert("Congratulations! You've completed the maze!");
    location.reload(); // This will reload the entire page
  }
}

function handleArrowKeyRotation() {
  const rotationSpeed = 0.05;
  if (gameState.keys.ArrowLeft) {
    gameState.playerRotationY += rotationSpeed;
  }
  if (gameState.keys.ArrowRight) {
    gameState.playerRotationY -= rotationSpeed;
  }
  if (gameState.keys.ArrowUp) {
    gameState.playerRotationX += rotationSpeed;
  }
  if (gameState.keys.ArrowDown) {
    gameState.playerRotationX -= rotationSpeed;
  }

  gameState.playerRotationX = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, gameState.playerRotationX)
  );

  updateCameraPosition();
}

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function initGame() {
  // Initialize Three.js scene, camera, and renderer
  gameState.scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 15;
  gameState.camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );
  gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
  gameState.renderer.setSize(window.innerWidth, window.innerHeight);
  gameState.renderer.shadowMap.enabled = true;
  gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameState.renderer.outputEncoding = THREE.sRGBEncoding;
  gameState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  gameState.renderer.toneMappingExposure = 1.0;
  document.body.appendChild(gameState.renderer.domElement);

  // Set background color to sky blue
  gameState.scene.background = new THREE.Color(0x87ceeb);

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  gameState.scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffd0, 1.2);
  sunLight.position.set(
    gameState.mazeSize * gameState.cellSize * 0.5,
    gameState.mazeSize * gameState.cellSize * 1.5,
    gameState.mazeSize * gameState.cellSize * 0.5
  );
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = gameState.mazeSize * gameState.cellSize * 4;
  sunLight.shadow.camera.left = -gameState.mazeSize * gameState.cellSize;
  sunLight.shadow.camera.right = gameState.mazeSize * gameState.cellSize;
  sunLight.shadow.camera.top = gameState.mazeSize * gameState.cellSize;
  sunLight.shadow.camera.bottom = -gameState.mazeSize * gameState.cellSize;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  gameState.scene.add(sunLight);

  const fillLight = new THREE.HemisphereLight(0x8080ff, 0x404040, 0.5);
  gameState.scene.add(fillLight);

  // Create platform
  function createPlatform() {
    const platformGeometry = new THREE.BoxGeometry(
      gameState.mazeSize * gameState.cellSize,
      gameState.platformHeight,
      gameState.mazeSize * gameState.cellSize
    );
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -gameState.platformHeight / 2, 0);
    platform.receiveShadow = true;
    gameState.scene.add(platform);
  }

  createPlatform();

  // Create 2D maze
  function create2DMaze() {
    const maze = Array(gameState.mazeSize)
      .fill()
      .map(() => Array(gameState.mazeSize).fill(1));

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
          nx < gameState.mazeSize - 1 &&
          ny > 0 &&
          ny < gameState.mazeSize - 1 &&
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
    maze[gameState.mazeSize - 2][gameState.mazeSize - 2] = 0;

    // Set start and end points
    maze[1][1] = 2; // 2 represents the start point
    maze[gameState.mazeSize - 2][gameState.mazeSize - 2] = 3; // 3 represents the end point

    return maze;
  }

  // Replace the wallColors array with this rainbow color array
  const rainbowColors = [
    0xff0000, // Red
    0xff7f00, // Orange
    0xffff00, // Yellow
    0x00ff00, // Green
    0x0000ff, // Blue
    0x4b0082, // Indigo
    0x9400d3, // Violet
  ];

  // Add this function to interpolate between colors
  function interpolateColor(color1, color2, factor) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return new THREE.Color().lerpColors(c1, c2, factor);
  }

  // Add this function to create dust particles
  function createDustParticles() {
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] =
        Math.random() * gameState.mazeSize * gameState.cellSize -
        (gameState.mazeSize * gameState.cellSize) / 2;
      positions[i + 1] = Math.random() * gameState.wallHeight;
      positions[i + 2] =
        Math.random() * gameState.mazeSize * gameState.cellSize -
        (gameState.mazeSize * gameState.cellSize) / 2;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      map: new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/sprites/disc.png"
      ),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    gameState.scene.add(particleSystem);

    return particleSystem;
  }

  // Modify the create3DMaze function
  function create3DMaze(maze2D) {
    const walls = new THREE.Group();

    const wallGeometry = new THREE.BoxGeometry(
      gameState.cellSize,
      gameState.wallHeight,
      gameState.cellSize
    );

    // Add this function to create a subtle texture for the walls
    function createWallTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 128, 128);

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      for (let i = 0; i < 128; i += 4) {
        for (let j = 0; j < 128; j += 4) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, 4, 4);
          }
        }
      }

      return new THREE.CanvasTexture(canvas);
    }

    const wallTexture = createWallTexture();

    for (let i = 0; i < gameState.mazeSize; i++) {
      for (let j = 0; j < gameState.mazeSize; j++) {
        if (maze2D[j][i] === 1) {
          // Calculate the position in the rainbow gradient
          const gradientPosition = (i + j) / (2 * gameState.mazeSize);
          const colorIndex = Math.floor(
            gradientPosition * (rainbowColors.length - 1)
          );
          const colorFactor =
            gradientPosition * (rainbowColors.length - 1) - colorIndex;

          const wallColor = interpolateColor(
            rainbowColors[colorIndex],
            rainbowColors[(colorIndex + 1) % rainbowColors.length],
            colorFactor
          );

          const wallMaterial = new THREE.MeshStandardMaterial({
            color: wallColor,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide,
            map: wallTexture,
          });

          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(
            (i - gameState.mazeSize / 2 + 0.5) * gameState.cellSize,
            gameState.wallHeight / 2 + gameState.platformHeight / 2,
            (j - gameState.mazeSize / 2 + 0.5) * gameState.cellSize
          );
          wall.castShadow = true;
          wall.receiveShadow = true;
          walls.add(wall);
        }
      }
    }

    const floorGeometry = new THREE.PlaneGeometry(
      gameState.mazeSize * gameState.cellSize,
      gameState.mazeSize * gameState.cellSize
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Change to a neutral gray
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = gameState.platformHeight / 2;
    floor.receiveShadow = true;
    walls.add(floor);

    // Replace the start marker code
    const startMarkerGeometry = new THREE.TorusGeometry(0.4, 0.1, 16, 100);
    const startMarkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      emissive: 0x0000ff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    const startMarker = new THREE.Mesh(
      startMarkerGeometry,
      startMarkerMaterial
    );
    startMarker.position.set(
      (1 - gameState.mazeSize / 2 + 0.5) * gameState.cellSize,
      gameState.platformHeight + 0.5,
      (1 - gameState.mazeSize / 2 + 0.5) * gameState.cellSize
    );
    startMarker.rotation.x = Math.PI / 2;
    startMarker.castShadow = true;
    walls.add(startMarker);

    // Replace the end sphere code
    const endMarkerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const endMarkerMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const endMarker = new THREE.Mesh(endMarkerGeometry, endMarkerMaterial);
    endMarker.position.set(
      (gameState.mazeSize - 2 - gameState.mazeSize / 2 + 0.5) *
        gameState.cellSize,
      gameState.platformHeight + 0.5,
      (gameState.mazeSize - 2 - gameState.mazeSize / 2 + 0.5) *
        gameState.cellSize
    );
    endMarker.castShadow = true;
    walls.add(endMarker);

    // Modify pulsating animation for end marker
    function pulsateEndMarker() {
      const time = Date.now() * 0.001; // Current time in seconds
      const scale = 1 + Math.sin(time * 3) * 0.2;
      endMarker.scale.set(scale, scale, scale);

      // Change color continuously
      const hue = (time * 0.1) % 1;
      endMarker.material.emissive.setHSL(hue, 1, 0.5);
      endMarker.material.color.setHSL(hue, 1, 0.5);

      requestAnimationFrame(pulsateEndMarker);
    }
    pulsateEndMarker();

    // Create dust particles
    gameState.dustParticles = createDustParticles();

    gameState.scene.add(walls);
    return walls;
  }

  // Create and add maze to scene
  gameState.maze2D = create2DMaze();
  const mazeWalls = create3DMaze(gameState.maze2D);

  // First-person camera setup
  gameState.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  gameState.camera.position.set(0, gameState.playerHeight, 0);
  gameState.scene.add(gameState.camera);

  // Player configuration
  function initializePlayerPosition() {
    const startX = (-gameState.mazeSize / 2 + 1.5) * gameState.cellSize;
    const startZ = (-gameState.mazeSize / 2 + 1.5) * gameState.cellSize;
    gameState.playerPosition.set(startX, gameState.playerHeight / 2, startZ);

    gameState.playerRotationY = Math.PI;
    gameState.playerRotationX = 0;
    updateCameraPosition();
  }

  initializePlayerPosition();

  // Set up event listeners
  document.addEventListener("keydown", (event) => {
    if (event.code in gameState.keys) {
      gameState.keys[event.code] = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code in gameState.keys) {
      gameState.keys[event.code] = false;
    }
  });

  // Mouse movement for rotation
  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === gameState.renderer.domElement) {
      gameState.playerRotationY -= event.movementX * gameState.mouseSensitivity;
      gameState.playerRotationX -= event.movementY * gameState.mouseSensitivity;
      gameState.playerRotationX = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, gameState.playerRotationX)
      );
      updateCameraPosition();
    }
  });

  // Lock pointer on click
  gameState.renderer.domElement.addEventListener("click", () => {
    if (!gameState.isTouchDevice) {
      gameState.renderer.domElement.requestPointerLock();
      showCursorNotification();
    }
  });

  // Add an event listener for exiting pointer lock
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== gameState.renderer.domElement) {
      hideCursorNotification();
    } else {
      showCursorNotification();
    }
  });

  // Add top-down camera
  const topCameraFrustumSize = gameState.mazeSize * gameState.cellSize;
  const topCamera = new THREE.OrthographicCamera(
    -topCameraFrustumSize / 2,
    topCameraFrustumSize / 2,
    topCameraFrustumSize / 2,
    -topCameraFrustumSize / 2,
    0.1,
    1000
  );
  topCamera.position.set(0, gameState.mazeSize * gameState.cellSize, 0);
  topCamera.lookAt(0, 0, 0);
  topCamera.updateProjectionMatrix();

  gameState.currentCamera = gameState.camera;

  // Player marker for top-down view
  const playerMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1, 32),
    new THREE.MeshPhongMaterial({ color: 0xff0000 })
  );
  playerMarker.rotation.x = Math.PI / 2;
  playerMarker.rotation.z = Math.PI / 2;
  playerMarker.visible = false;
  playerMarker.castShadow = true;
  gameState.scene.add(playerMarker);

  // Add this function to create a 2D representation of the maze
  function create2DMazeRepresentation() {
    const mazeContainer = document.createElement("div");
    mazeContainer.style.position = "absolute";
    mazeContainer.style.left = "50%";
    mazeContainer.style.top = "50%";
    mazeContainer.style.transform = "translate(-50%, -50%)";
    mazeContainer.style.display = "grid";
    mazeContainer.style.gridTemplateColumns = `repeat(${gameState.mazeSize}, 1fr)`;
    mazeContainer.style.gap = "0";
    mazeContainer.style.backgroundColor = "#000";
    mazeContainer.style.padding = "0";

    const cellSize =
      Math.min(
        window.innerWidth / gameState.mazeSize,
        window.innerHeight / gameState.mazeSize
      ) * 0.9;

    for (let j = 0; j < gameState.mazeSize; j++) {
      for (let i = 0; i < gameState.mazeSize; i++) {
        const cell = document.createElement("div");
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        if (gameState.maze2D[j][i] === 1) {
          cell.style.backgroundColor = "#808080";
        } else if (gameState.maze2D[j][i] === 2) {
          cell.style.backgroundColor = "#0000ff";
        } else if (gameState.maze2D[j][i] === 3) {
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
    playerMarker.style.borderLeft = `${cellSize * 0.4}px solid transparent`;
    playerMarker.style.borderRight = `${cellSize * 0.4}px solid transparent`;
    playerMarker.style.borderBottom = `${cellSize * 1}px solid red`;
    playerMarker.style.transform = "translate(-50%, -50%)";
    mazeContainer.appendChild(playerMarker);

    gameState.playerMarker2D = playerMarker;
    gameState.cellSize2D = cellSize;
    gameState.maze2DRepresentation = mazeContainer;

    return { mazeContainer, playerMarker, cellSize };
  }

  function toggleView() {
    if (gameState.currentCamera === gameState.camera) {
      gameState.currentCamera = null;
      if (!gameState.maze2DRepresentation) {
        create2DMazeRepresentation();
        document.body.appendChild(gameState.maze2DRepresentation);
      }
      gameState.maze2DRepresentation.style.display = "grid";
      gameState.renderer.domElement.style.display = "none";
      updatePlayerMarker2D();
    } else {
      gameState.currentCamera = gameState.camera;
      if (gameState.maze2DRepresentation) {
        gameState.maze2DRepresentation.style.display = "none";
      }
      gameState.renderer.domElement.style.display = "block";
      gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  window.addEventListener("resize", () => {
    if (gameState.currentCamera === gameState.camera) {
      gameState.camera.aspect = window.innerWidth / window.innerHeight;
      gameState.camera.updateProjectionMatrix();
      gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    } else if (gameState.maze2DRepresentation) {
      document.body.removeChild(gameState.maze2DRepresentation);
      create2DMazeRepresentation();
      document.body.appendChild(gameState.maze2DRepresentation);
      updatePlayerMarker2D();
    }
  });

  // Add this function to reset movement keys
  function resetMovementKeys() {
    gameState.keys.KeyW = false;
    gameState.keys.KeyS = false;
    gameState.keys.KeyA = false;
    gameState.keys.KeyD = false;
    gameState.keys.ArrowLeft = false;
    gameState.keys.ArrowRight = false;
    gameState.keys.ArrowUp = false;
    gameState.keys.ArrowDown = false;
  }

  // Modify the restartGame function
  function restartGame() {
    initializePlayerPosition();
    gameState.playerRotationX = 0;
    gameState.playerRotationY = 0;
    updateCameraPosition();
    resetMovementKeys();
    gameState.endReached = false;
  }

  document.getElementById("viewToggle").addEventListener("click", toggleView);

  // Add this function to toggle fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Add this function to update the fullscreen button icon
  function updateFullscreenButtonIcon() {
    const fullscreenIcon = document.getElementById("fullscreenIcon");
    const exitFullscreenIcon = document.getElementById("exitFullscreenIcon");
    if (document.fullscreenElement) {
      fullscreenIcon.style.display = "none";
      exitFullscreenIcon.style.display = "block";
    } else {
      fullscreenIcon.style.display = "block";
      exitFullscreenIcon.style.display = "none";
    }
  }

  // Set up fullscreen button
  const fullscreenToggle = document.getElementById("fullscreenToggle");
  fullscreenToggle.addEventListener("click", toggleFullscreen);

  // Update fullscreen button icon when fullscreen state changes
  document.addEventListener("fullscreenchange", updateFullscreenButtonIcon);

  function animate() {
    requestAnimationFrame(animate);
    movePlayer();
    updatePlayerMarker2D();
    checkEndReached();

    if (gameState.dustParticles) {
      const positions =
        gameState.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.01;
        if (positions[i] < 0) {
          positions[i] = gameState.wallHeight;
        }
      }
      gameState.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (gameState.currentCamera === gameState.camera) {
      gameState.renderer.render(gameState.scene, gameState.currentCamera);
    } else {
      updatePlayerMarker2D(); // Update 2D marker even when in 2D view
    }
  }

  // Start the animation loop
  animate();

  console.log("Maze created");

  // Show the toggle buttons when the game starts
  document.getElementById("viewToggle").classList.remove("hidden");
  document.getElementById("fullscreenToggle").classList.add("visible");

  gameState.isTouchDevice = isTouchDevice();

  if (gameState.isTouchDevice) {
    setupJoysticks();
    document.getElementById("joystick-container").style.display = "flex";
  } else {
    document.getElementById("joystick-container").style.display = "none";
  }

  // Initialize fullscreen button icon
  updateFullscreenButtonIcon();

  // Add these functions at the appropriate place in your script

  function showCursorNotification() {
    if (!gameState.isTouchDevice) {
      const notification = document.getElementById("cursor-notification");
      notification.style.display = "block";
    }
  }

  function hideCursorNotification() {
    const notification = document.getElementById("cursor-notification");
    notification.style.display = "none";
  }

  // Modify the DOMContentLoaded event listener to hide the notification on mobile
  document.addEventListener("DOMContentLoaded", () => {
    // ... existing code ...

    if (isTouchDevice()) {
      document.getElementById("cursor-notification").style.display = "none";
    }

    // ... rest of the existing code ...
  });
}

function setupJoysticks() {
  const joystickOptions = {
    mode: "static",
    position: { left: "50%", top: "50%" },
    color: "white",
    size: 120,
    lockX: false,
    lockY: false,
    dynamicPage: true,
  };

  gameState.leftJoystick = nipplejs.create({
    ...joystickOptions,
    zone: document.getElementById("left-joystick"),
  });

  gameState.rightJoystick = nipplejs.create({
    ...joystickOptions,
    zone: document.getElementById("right-joystick"),
  });

  gameState.leftJoystick.on("move", (evt, data) => {
    const force = Math.min(data.force, 1); // Reduce movement speed by half
    const angle = data.angle.radian + Math.PI / 2; // Rotate angle by 90 degrees
    gameState.keys.KeyW = Math.cos(angle) * force;
    gameState.keys.KeyS = -Math.cos(angle) * force;
    gameState.keys.KeyA = -Math.sin(angle) * force;
    gameState.keys.KeyD = Math.sin(angle) * force;
  });

  gameState.leftJoystick.on("end", () => {
    gameState.keys.KeyW = 0;
    gameState.keys.KeyS = 0;
    gameState.keys.KeyA = 0;
    gameState.keys.KeyD = 0;
  });

  gameState.rightJoystick.on("move", (evt, data) => {
    const force = Math.min(data.force, 1) * 0.02; // Reduce rotation speed
    const angle = data.angle.radian + Math.PI / 2; // Rotate angle by 90 degrees
    gameState.playerRotationY -= Math.sin(angle) * force;
    gameState.playerRotationX -= Math.cos(angle) * force;
    gameState.playerRotationX = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, gameState.playerRotationX)
    );
    updateCameraPosition();
  });
}

// Add an event listener for device orientation changes
window.addEventListener("orientationchange", () => {
  const landscapePrompt = document.getElementById("landscape-prompt");
  if (window.orientation === 0 || window.orientation === 180) {
    landscapePrompt.style.display = "flex";
  } else {
    landscapePrompt.style.display = "none";
  }
});

// Event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading-screen");
  const loadingProgress = document.getElementById("loading-progress");
  const loadingPercentage = document.getElementById("loading-percentage");
  const container = document.querySelector(".container");
  const playButton = document.getElementById("play-button");
  let progress = 0;

  function simulateLoading() {
    if (progress < 100) {
      progress += Math.random() * 10;
      progress = Math.min(progress, 100);
      loadingProgress.style.width = `${progress}%`;
      loadingPercentage.textContent = `${Math.round(progress)}%`;
      setTimeout(simulateLoading, 150);
    } else {
      loadingScreen.style.display = "none";
      container.style.display = "block";
    }
  }

  simulateLoading();

  playButton.addEventListener("click", () => {
    container.style.display = "none";
    initGame();
  });
});
