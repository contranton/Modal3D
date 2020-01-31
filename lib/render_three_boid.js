// Initialization
// ---------------
var SCENE_WIDTH = SCENE_HEIGHT = 720;

// Get canvas from document.
var canvas = document.getElementById("three_boid");

// Initialize Webgl renderer.
var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
 // Resize the output canvas to (width, height).
 // Set the viewport to fit that size, starting in (0, 0).
renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);

// Initialize scene (where we put our models).
var scene = new THREE.Scene();

// Initialize camera (how we look at our scene).
var camera = new THREE.PerspectiveCamera(80, SCENE_WIDTH / SCENE_HEIGHT, 1, 10000);
camera.position.set(SCENE_WIDTH, SCENE_HEIGHT/2, 2000);

// Initialize orbit controls (how we use our mouse to move the camera).
var controls = new THREE.OrbitControls(camera, canvas);
controls.addEventListener('change', render);

// Initialize parent object (like a sub-scene).
var parent = new THREE.Object3D();


// Add Axes
// ---------
// Reference: http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
function buildAxes(length) {
    var axes = new THREE.Object3D();

    var axisPosX = buildAxis(new THREE.Vector3(0,0,0),
                       new THREE.Vector3(length, 0, 0), 0xFF0000, false);
    var axisNegX = buildAxis(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(-length, 0, 0), 0xFF0000, true);
    axes.add(axisPosX); // +X
    axes.add(axisNegX); // -X

    var axisPosY = buildAxis(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, length, 0), 0x00FF00, false);
    var axisNegY = buildAxis(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, -length, 0 ), 0x00FF00, true);
    axes.add(axisPosY); // +Y
    axes.add(axisNegY); // -Y

    var axisPosZ = buildAxis(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, 0, length), 0x0000FF, false);
    var axisNegZ = buildAxis(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3( 0, 0, -length), 0x0000FF, true);
    axes.add(axisPosZ); // +Z
    axes.add(axisNegZ); // -Z

    return axes;
}

function buildAxis(src, dst, colorHex, dashed) {
    var geom = new THREE.Geometry(),
        mat;

    if (dashed) {
       mat = new THREE.LineDashedMaterial({linewidth:3, color: colorHex, dashSize:3, gapSize:3});
    } else {
      mat = new THREE.LineBasicMaterial({linewidth:3, color:colorHex});
    }

    geom.vertices.push(src.clone());
    geom.vertices.push(dst.clone());
    // This is IMPORTANT, otherwise dashed lines will appear as plain lines.
    geom.computeLineDistances();

    var axis = new THREE.Line(geom, mat, THREE.LineSegments);
    return axis;
}

axes = buildAxes(SCENE_WIDTH);
parent.add(axes);


// Add Bounding Box
// -----------------
// http://threejs.org/docs/#Reference/Extras.Helpers/BoundingBoxHelper
var boundingBox = new THREE.BoundingBoxHelper(parent);
boundingBox.update();
parent.add(boundingBox);



// Particle Render Prototype Methods
// ----------------------------------
Boid.prototype.set_color = function() {
  // http://threejs.org/docs/#Reference/Math/Color
  this.color = new THREE.Color();
  this.color.setHSL(Math.random(), 0.85, 0.5);
}

Boid.prototype.set_radius = function() {this.radius = Math.random() * 50;}

Boid.prototype.create_geometry = function() {
  // http://threejs.org/docs/#Reference/Extras.Geometries/SphereGeometry
  //this.geometry = new THREE.SphereGeometry(
  //  this.radius,  // radius — sphere radius. Default: 50.
  //  25,  // widthSegments — number of horizontal segments. Minimum: 3; Default: 8.
  //  25   // heightSegments — number of vertical segments. Minimum: 2; Default: 6.
  //);

  // http://threejs.org/docs/#Reference/Extras.Geometries/BoxGeometry
  this.geometry = new THREE.BoxGeometry(this.radius, this.radius, this.radius);
}

Boid.prototype.create_material = function() {
  // http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
  this.material = new THREE.MeshPhongMaterial({
    color: this.color,
    specular: 0x333333,
    shininess: 100
  });
  this.material.transparent = true;
  this.material.opacity = 0.80;
}

Boid.prototype.create_mesh = function() {
  // http://threejs.org/docs/#Reference/Objects/Mesh
  this.mesh = new THREE.Mesh(
    this.geometry,
    this.material
  );
  this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  //console.log(this.mesh);
}

Boid.prototype.init_mesh_obj = function() {
  this.create_geometry();
  this.create_material();
  this.create_mesh();
}

Boid.prototype.set_rotation = function() {
  this.rotation   = new THREE.Vector3();
  this.rotation.x = this.rotation.y = this.rotation.z = 0;

  this.rotation_v = new THREE.Vector3();
  this.rotation_v.x = Math.random() / 10;
  this.rotation_v.y = Math.random() / 10;
  this.rotation_v.z = Math.random() / 10;
}

Boid.prototype.update_boids = function() {
  this.mesh.position.set(this.position.x, this.position.y, this.position.z);

  // Calculate momentum and apply it to the color.
  var momentum = this.velocity.length() * this.radius;
  var intensity = momentum / 150;

  if (intensity < 1) intensity = -1;
  if (intensity > 1) intensity = 1;
  this.mesh.material.color.offsetHSL(intensity * 0.0001, intensity * 0.0001,
                                      intensity * 0.0001);
}

// Add boids.
var n = 300, data = [];
for (var i = 0; i < n; i++) {
  var b = new Boid()
  b.set_color();
  b.set_radius();
  b.init_mesh_obj();
  b.set_rotation();
  b.setWorldSize(SCENE_WIDTH, SCENE_HEIGHT, SCENE_HEIGHT);

  data.push(b);
  parent.add(b.mesh);
}
scene.add(parent);


// Add Light
// ----------
var ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

var directionalLight2 = new THREE.DirectionalLight(0xffffff);
directionalLight2.position.set(-10, -10, -10).normalize();
scene.add(directionalLight2);


// Add FPS using Stats.js
// -----------------------
var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
document.getElementById('dat_gui_container').appendChild(stats.domElement);

// Align to the right of dat.gui.
stats.domElement.style.float = 'right';


// Add Controls and GUI
// ---------------------
var controls = new function() {
    // Add params here.
    this.x_rot_v = 0.02;
    this.y_rot_v = 0.02;
    this.z_rot_v = 0.02;
    this.p_x_rot_v = 0;
    this.p_y_rot_v = 0.01;
    this.p_z_rot_v = 0;
    this.ambient_light = true;
    this.direction_light = true;
    this.direction_light_2 = true;
}

var gui = new dat.GUI();
document.getElementById('dat_gui_container').appendChild(gui.domElement);
gui.add(controls, 'x_rot_v', 0, 0.5);
gui.add(controls, 'y_rot_v', 0, 0.5);
gui.add(controls, 'z_rot_v', 0, 0.5);
gui.add(controls, 'p_x_rot_v', 0, 0.5);
gui.add(controls, 'p_y_rot_v', 0, 0.5);
gui.add(controls, 'p_z_rot_v', 0, 0.5);
gui.close();

ambient_light = gui.add(controls, 'ambient_light');
ambient_light.onChange(function(value) {
  if (value) {
    scene.add(ambientLight);
  } else {
    scene.remove(ambientLight);
  }
});

direction_light = gui.add(controls, 'direction_light');
direction_light.onChange(function(value) {
  if (value) {
    scene.add(directionalLight);
  } else {
    scene.remove(directionalLight);
  }
});

direction_light_2 = gui.add(controls, 'direction_light_2');
direction_light_2.onChange(function(value) {
    if (value) {
        scene.add(directionalLight2);
    } else {
        scene.remove(directionalLight2);
    }
});


// Draw Loop
// -----------
function draw() {
    // Start recording statistics.
    stats.begin();

    for (var i = 0; i <n; i++) {
      data[i].run(data);
      data[i].update_boids();
    }

    parent.rotation.x += controls.p_x_rot_v;
    parent.rotation.y += controls.p_y_rot_v;
    parent.rotation.z += controls.p_z_rot_v;

    // Render scene.
    renderer.render(scene, camera);

    // End recording statistics.
    stats.end();

    // Run draw again.
    requestAnimationFrame(draw);
}

function render() {
  renderer.render(scene, camera);
}

// Start Animation
// -----------------
requestAnimationFrame(draw);
