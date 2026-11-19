/**
 * LLM Pipeline Explorer - 3D Room Visualization
 * 
 * Implements:
 * 1. Minimalist 3D room with white background (#FFFFFF)
 * 2. Three thin royal blue axes (X, Y, Z) with subtle directional indicators and axis labels
 * 3. Interactive royal blue sentence points (spheres) with hovering glow and pulse on selection
 * 4. Mouse rotation, zooming, panning via OrbitControls (with responsive canvas resize)
 * 5. Floating sentence labels/tooltips on hover and click
 * 6. Multi-selection comparison line in 3D vector space
 * 7. Camera reset animation & auto-rotate toggle
 * 8. Resilient Canvas 2D 3D-projection fallback if WebGL/Three.js CDN is unavailable
 */

class Visualizer3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      pointColor: 0x2455D6,       // Royal Blue
      selectedColor: 0x173B91,    // Dark Blue
      accentColor: 0x2455D6,
      axisColor: 0x2455D6,
      bgColor: 0xFFFFFF,
      roomBound: 3.5,
      onPointClick: null,
      onPointHover: null
    }, options);

    this.pointsData = [];
    this.selectedPoints = []; // [pointData1, pointData2]
    this.hoveredPoint = null;

    this.isThreeAvailable = typeof window.THREE !== 'undefined';
    this.useFallback = false;

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pointMeshes = [];
    this.axisLinesGroup = null;
    this.roomWireframe = null;
    this.connectionLine = null;
    this.raycaster = null;
    this.mouse = null;
    this.animFrameId = null;
    this.isAutoRotating = false;

    // Fallback Canvas 2D state
    this.canvas2D = null;
    this.ctx2D = null;
    this.rotationX = 0.35;
    this.rotationY = -0.45;
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.backgroundColor = '#FFFFFF';
    this.container.style.overflow = 'hidden';

    // Create Tooltip Overlay
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'point-3d-tooltip';
    this.tooltipEl.style.cssText = `
      position: absolute;
      display: none;
      padding: 8px 14px;
      background: rgba(23, 59, 145, 0.95);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      border-radius: 8px;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 4px 14px rgba(23, 59, 145, 0.25);
      white-space: nowrap;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: opacity 0.15s ease;
      transform: translate(-50%, -125%);
    `;
    this.container.appendChild(this.tooltipEl);

    if (this.isThreeAvailable) {
      try {
        this.initThreeJS();
        return;
      } catch (err) {
        console.warn("Three.js initialization failed, falling back to Canvas 2D 3D engine:", err);
      }
    }

    // Fallback if Three.js is not present
    this.initFallbackEngine();
  }

  // ==========================================
  // THREE.JS IMPLEMENTATION
  // ==========================================

  initThreeJS() {
    const THREE = window.THREE;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.bgColor);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.defaultCameraPos = new THREE.Vector3(7.0, 5.5, 8.5);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    // Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.minDistance = 2.5;
      this.controls.maxDistance = 28;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight1.position.set(10, 15, 10);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdce6fb, 0.3);
    dirLight2.position.set(-10, -5, -10);
    this.scene.add(dirLight2);

    // Build the 3D Room Environment
    this.buildRoomEnvironment();

    // Raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Event listeners
    this.bindThreeEvents();

    // Render loop
    this.animate();
  }

  buildRoomEnvironment() {
    const THREE = window.THREE;
    const bound = this.options.roomBound; // 3.5

    // 1. Subtle Floor Grid (White & very light blue)
    const gridHelper = new THREE.GridHelper(bound * 2, 8, 0x2455D6, 0xEEF3FE);
    gridHelper.position.y = -bound;
    this.scene.add(gridHelper);

    // 2. Subtle Room Wireframe Outline (representing the 3D room)
    const boxGeo = new THREE.BoxGeometry(bound * 2, bound * 2, bound * 2);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({
      color: 0xDCE6FB,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });
    this.roomWireframe = new THREE.LineSegments(boxEdges, boxMat);
    this.scene.add(this.roomWireframe);

    // 3. Thin Royal Blue Coordinate Axes (X, Y, Z)
    this.axisLinesGroup = new THREE.Group();

    const axisMat = new THREE.LineBasicMaterial({
      color: 0x2455D6,
      linewidth: 2
    });

    // X Axis: Royal Blue line (-bound to +bound)
    const xPoints = [new THREE.Vector3(-bound, 0, 0), new THREE.Vector3(bound, 0, 0)];
    const xGeo = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeo, axisMat);
    this.axisLinesGroup.add(xLine);

    // Y Axis: Royal Blue line (-bound to +bound)
    const yPoints = [new THREE.Vector3(0, -bound, 0), new THREE.Vector3(0, bound, 0)];
    const yGeo = new THREE.BufferGeometry().setFromPoints(yPoints);
    const yLine = new THREE.Line(yGeo, axisMat);
    this.axisLinesGroup.add(yLine);

    // Z Axis: Royal Blue line (-bound to +bound)
    const zPoints = [new THREE.Vector3(0, 0, -bound), new THREE.Vector3(0, 0, bound)];
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeo, axisMat);
    this.axisLinesGroup.add(zLine);

    // Axis Labels: X, Y, Z
    this.createAxisLabel("X", new THREE.Vector3(bound + 0.3, 0, 0));
    this.createAxisLabel("Y", new THREE.Vector3(0, bound + 0.3, 0));
    this.createAxisLabel("Z", new THREE.Vector3(0, 0, bound + 0.3));

    this.scene.add(this.axisLinesGroup);
  }

  createAxisLabel(text, position) {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2455D6';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.scale.set(0.65, 0.65, 1);
    this.axisLinesGroup.add(sprite);
  }

  bindThreeEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousemove', (e) => this.onMouseMove(e));
    dom.addEventListener('click', (e) => this.onMouseClick(e));
    window.addEventListener('resize', () => this.onResize());
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pointMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const pointData = mesh.userData.pointData;
      this.renderer.domElement.style.cursor = 'pointer';

      // Tooltip positioning
      this.tooltipEl.textContent = `Point ${pointData.id}: "${pointData.sentence}"`;
      this.tooltipEl.style.left = `${event.clientX - rect.left}px`;
      this.tooltipEl.style.top = `${event.clientY - rect.top}px`;
      this.tooltipEl.style.display = 'block';

      if (this.hoveredPoint !== pointData) {
        this.hoveredPoint = pointData;
        if (typeof this.options.onPointHover === 'function') {
          this.options.onPointHover(pointData);
        }
      }
    } else {
      this.renderer.domElement.style.cursor = 'default';
      this.tooltipEl.style.display = 'none';
      if (this.hoveredPoint) {
        this.hoveredPoint = null;
        if (typeof this.options.onPointHover === 'function') {
          this.options.onPointHover(null);
        }
      }
    }
  }

  onMouseClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pointMeshes, false);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const pointData = clickedMesh.userData.pointData;
      this.togglePointSelection(pointData);
    }
  }

  togglePointSelection(pointData) {
    const idx = this.selectedPoints.findIndex(p => p.id === pointData.id);

    if (idx !== -1) {
      // Deselect
      this.selectedPoints.splice(idx, 1);
    } else {
      // Select up to 2 points for pairwise comparison
      if (this.selectedPoints.length >= 2) {
        this.selectedPoints.shift(); // Remove oldest
      }
      this.selectedPoints.push(pointData);
    }

    this.updatePointVisualStyles();
    this.updateConnectionLine();

    if (typeof this.options.onPointClick === 'function') {
      this.options.onPointClick(this.selectedPoints, pointData);
    }
  }

  selectPointById(pointId) {
    const point = this.pointsData.find(p => p.id === pointId);
    if (point) {
      this.togglePointSelection(point);
    }
  }

  focusOnPoint(pointId) {
    const mesh = this.pointMeshes.find(m => m.userData.pointData.id === pointId);
    if (!mesh || !this.controls) return;

    const targetPos = mesh.position.clone();
    
    // Smooth camera transition towards the target point
    const startTarget = this.controls.target.clone();
    const duration = 600;
    const startTime = performance.now();

    const animateFocus = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.controls.target.lerpVectors(startTarget, targetPos, ease);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateFocus);
      }
    };

    requestAnimationFrame(animateFocus);
  }

  updatePointVisualStyles() {
    const THREE = window.THREE;
    if (!THREE) return;

    const selectedIds = new Set(this.selectedPoints.map(p => p.id));

    this.pointMeshes.forEach(mesh => {
      const isSelected = selectedIds.has(mesh.userData.pointData.id);
      if (isSelected) {
        // Enlarge and highlight
        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.material.color.setHex(0x173B91); // Dark Blue
        mesh.material.emissive.setHex(0x2455D6);
        mesh.material.emissiveIntensity = 0.4;
      } else {
        mesh.scale.set(1.0, 1.0, 1.0);
        mesh.material.color.setHex(0x2455D6); // Royal Blue
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
  }

  updateConnectionLine() {
    const THREE = window.THREE;
    if (!THREE) return;

    if (this.connectionLine) {
      this.scene.remove(this.connectionLine);
      this.connectionLine.geometry.dispose();
      this.connectionLine = null;
    }

    if (this.selectedPoints.length === 2) {
      const p1 = this.selectedPoints[0];
      const p2 = this.selectedPoints[1];

      const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([v1, v2]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x173B91,
        linewidth: 2,
        scale: 1,
        dashSize: 0.15,
        gapSize: 0.08
      });

      this.connectionLine = new THREE.Line(lineGeo, lineMat);
      this.connectionLine.computeLineDistances();
      this.scene.add(this.connectionLine);
    }
  }

  /**
   * Sets new sentence points and updates the 3D room.
   * @param {Array} points 
   */
  setPoints(points) {
    this.pointsData = points;
    this.selectedPoints = [];

    if (this.isThreeAvailable && this.scene) {
      // Clear existing meshes
      this.pointMeshes.forEach(mesh => {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      this.pointMeshes = [];

      if (this.connectionLine) {
        this.scene.remove(this.connectionLine);
        this.connectionLine.geometry.dispose();
        this.connectionLine = null;
      }

      const THREE = window.THREE;
      const sphereGeo = new THREE.SphereGeometry(0.12, 24, 24);

      points.forEach(point => {
        const material = new THREE.MeshStandardMaterial({
          color: 0x2455D6,
          roughness: 0.3,
          metalness: 0.2
        });

        const sphere = new THREE.Mesh(sphereGeo, material);
        sphere.position.set(point.x, point.y, point.z);
        sphere.userData = { pointData: point };

        this.scene.add(sphere);
        this.pointMeshes.push(sphere);
      });

      this.updatePointVisualStyles();
    } else {
      // Fallback update
      this.renderFallback();
    }
  }

  resetCamera() {
    if (this.controls) {
      const startTime = performance.now();
      const startPos = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const endPos = this.defaultCameraPos.clone();
      const endTarget = new window.THREE.Vector3(0, 0, 0);

      const duration = 650;
      const animateReset = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        this.camera.position.lerpVectors(startPos, endPos, ease);
        this.controls.target.lerpVectors(startTarget, endTarget, ease);
        this.controls.update();

        if (t < 1) {
          requestAnimationFrame(animateReset);
        }
      };

      requestAnimationFrame(animateReset);
    } else if (this.useFallback) {
      this.rotationX = 0.35;
      this.rotationY = -0.45;
      this.zoom = 1.0;
      this.renderFallback();
    }
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    if (this.controls) {
      this.controls.autoRotate = this.isAutoRotating;
      this.controls.autoRotateSpeed = 1.6;
    }
    return this.isAutoRotating;
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ==========================================
  // RESILIENT CANVAS 2D 3D-ENGINE FALLBACK
  // (Ensures 100% functionality without CDN)
  // ==========================================

  initFallbackEngine() {
    this.useFallback = true;
    this.canvas2D = document.createElement('canvas');
    this.canvas2D.style.width = '100%';
    this.canvas2D.style.height = '100%';
    this.container.appendChild(this.canvas2D);
    this.ctx2D = this.canvas2D.getContext('2d');

    const resizeCanvas = () => {
      this.canvas2D.width = this.container.clientWidth * (window.devicePixelRatio || 1);
      this.canvas2D.height = this.container.clientHeight * (window.devicePixelRatio || 1);
      this.renderFallback();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse drag rotation & zooming
    this.canvas2D.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) {
        // Hover detection
        this.checkFallbackHover(e);
        return;
      }
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.rotationY += dx * 0.008;
      this.rotationX += dy * 0.008;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.renderFallback();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas2D.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom = Math.max(0.4, Math.min(2.5, this.zoom - e.deltaY * 0.0015));
      this.renderFallback();
    });

    this.canvas2D.addEventListener('click', (e) => {
      const clicked = this.getFallbackPointAt(e);
      if (clicked) {
        this.togglePointSelection(clicked);
        this.renderFallback();
      }
    });

    this.renderFallback();
  }

  project3DTo2D(x, y, z, width, height) {
    // Rotation around Y
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotation around X
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Perspective projection
    const fov = 450 * this.zoom;
    const distance = 8.5;
    const depth = distance + z2;
    const scale = fov / Math.max(0.1, depth);

    return {
      x: width / 2 + x1 * scale,
      y: height / 2 - y2 * scale,
      depth: z2,
      scale
    };
  }

  checkFallbackHover(e) {
    const pt = this.getFallbackPointAt(e);
    const rect = this.canvas2D.getBoundingClientRect();
    if (pt) {
      this.canvas2D.style.cursor = 'pointer';
      this.tooltipEl.textContent = `Point ${pt.id}: "${pt.sentence}"`;
      this.tooltipEl.style.left = `${e.clientX - rect.left}px`;
      this.tooltipEl.style.top = `${e.clientY - rect.top}px`;
      this.tooltipEl.style.display = 'block';
    } else {
      this.canvas2D.style.cursor = 'default';
      this.tooltipEl.style.display = 'none';
    }
  }

  getFallbackPointAt(e) {
    const rect = this.canvas2D.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (this.canvas2D.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (this.canvas2D.height / rect.height);
    const W = this.canvas2D.width;
    const H = this.canvas2D.height;

    for (const pt of this.pointsData) {
      const proj = this.project3DTo2D(pt.x, pt.y, pt.z, W, H);
      const dist = Math.hypot(mouseX - proj.x, mouseY - proj.y);
      if (dist < 18 * (window.devicePixelRatio || 1)) {
        return pt;
      }
    }
    return null;
  }

  renderFallback() {
    if (!this.ctx2D) return;
    const ctx = this.ctx2D;
    const W = this.canvas2D.width;
    const H = this.canvas2D.height;
    const bound = this.options.roomBound;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Draw Room Bounding Box Edges
    ctx.strokeStyle = '#DCE6FB';
    ctx.lineWidth = 1.5;
    const corners = [
      [-bound, -bound, -bound], [bound, -bound, -bound],
      [bound, bound, -bound], [-bound, bound, -bound],
      [-bound, -bound, bound], [bound, -bound, bound],
      [bound, bound, bound], [-bound, bound, bound]
    ];
    const edgePairs = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    ctx.beginPath();
    for (const [i1, i2] of edgePairs) {
      const p1 = this.project3DTo2D(corners[i1][0], corners[i1][1], corners[i1][2], W, H);
      const p2 = this.project3DTo2D(corners[i2][0], corners[i2][1], corners[i2][2], W, H);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Draw Royal Blue Coordinate Axes (X, Y, Z)
    ctx.strokeStyle = '#2455D6';
    ctx.lineWidth = 2.5;

    // X Axis
    const origin = this.project3DTo2D(0, 0, 0, W, H);
    const xEnd = this.project3DTo2D(bound, 0, 0, W, H);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();

    // Y Axis
    const yEnd = this.project3DTo2D(0, bound, 0, W, H);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    // Z Axis
    const zEnd = this.project3DTo2D(0, 0, bound, W, H);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#2455D6';
    ctx.fillText('X', xEnd.x + 8, xEnd.y);
    ctx.fillText('Y', yEnd.x, yEnd.y - 8);
    ctx.fillText('Z', zEnd.x + 8, zEnd.y + 8);

    // Draw Connection line if 2 points selected
    if (this.selectedPoints.length === 2) {
      const p1 = this.selectedPoints[0];
      const p2 = this.selectedPoints[1];
      const proj1 = this.project3DTo2D(p1.x, p1.y, p1.z, W, H);
      const proj2 = this.project3DTo2D(p2.x, p2.y, p2.z, W, H);

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#173B91';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(proj1.x, proj1.y);
      ctx.lineTo(proj2.x, proj2.y);
      ctx.stroke();
      ctx.restore();
    }

    // Sort points by depth for natural painter's algorithm
    const projectedPoints = this.pointsData.map(pt => {
      const proj = this.project3DTo2D(pt.x, pt.y, pt.z, W, H);
      return { pt, proj };
    }).sort((a, b) => b.proj.depth - a.proj.depth);

    const selectedIds = new Set(this.selectedPoints.map(p => p.id));

    // Draw Points
    for (const { pt, proj } of projectedPoints) {
      const isSelected = selectedIds.has(pt.id);
      const radius = (isSelected ? 9 : 6.5) * (window.devicePixelRatio || 1);

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#173B91' : '#2455D6';
      ctx.fill();

      // Outer ring for selected
      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#2455D6';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Export for browser
window.Visualizer3D = Visualizer3D;
