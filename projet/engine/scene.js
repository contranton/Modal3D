"use strict";

var g_time = 0;

class Scene {

    constructor() {

        // Main scene graph -- contains all objects
        this.sceneGraph = null;

        // Ship elements
        this.body = null;
        this.ship_elements = [];

        // Boid instances for animation (created by Modeler.js)
        this.boids = [];
        this.boid_centroid = Vector3();
        this.lasers = [];

        // Reference Planes

        this.xy = null;
        this.yz = null;
        this.zx = null;

        // Cameras
        this.ORTHO = false; // True if using orthographic camera
        this.persp_camera = null; // Default, used for general viz
        this.ortho_camera = null; // Used only for projective drawing

        this.view_locked = false; // Prevents navigation

        
        // Navigation
        this.controls = null;
        
        // Dynamic content controllers
        this.picker = new PickController(this);
        this.drawer = new DrawController(this);
        
        // Rendering and materials
        this.renderer = null;
        this.background_on = false;

        
        // Initialize Scene
        this.initEmptyScene();
        this.materials =  {"METAL": new THREE.MeshStandardMaterial({
                                            color: 0xA48A8A,
                                            roughness: 0.9,
                                            metalness: 1,
                                            flatShading: false,
                                            envMap: this.textureCube
                                        }),
                            "DIFFUSE": new THREE.MeshLambertMaterial({
                                color: 0xa4ba8a
                            })
                        }

        // Insert some objects
        this.init3DObjects();
        
        // Raycaster for picking and drawing
        this.raycaster = new THREE.Raycaster();

        // Récupération de la taille de la fenetre en tant que variable à part
        this.w = this.renderer.domElement.clientWidth;
        this.h = this.renderer.domElement.clientHeight;

        // Bind callbacks
        document.addEventListener('keydown', onKeyDown.bind(this));
        document.addEventListener('keyup', onKeyUp.bind(this));
        document.addEventListener('mousedown', onMouseDown.bind(this));
        document.addEventListener('mouseup', onMouseUp.bind(this));
        document.addEventListener('mousemove', onMouseMove.bind(this));
        document.addEventListener('pointerdown', onMouseDown.bind(this));
        document.addEventListener('pointerup', onMouseUp.bind(this));
        document.addEventListener('pointermove', onMouseMove.bind(this));

        // Make false to stop animating (useful for lowering load when debugging menus)
        this.do_animate = true;
        this.animationLoop();

    }

    initEmptyScene() {

        this.sceneGraph = new THREE.Scene();

        // Reference planes
        var planes = get_referential_planes();
        this.xy = planes[0]; this.sceneGraph.add(this.xy);
        this.yz = planes[1]; this.sceneGraph.add(this.yz);
        this.zx = planes[2]; this.sceneGraph.add(this.zx);

        // Cameras
        this.persp_camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
        this.persp_camera.position.set(1, 1.5, 3);
        this.persp_camera.lookAt(0, 0, 0);

        const w = 2; const h = w / this.persp_camera.aspect;

        this.ortho_camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 0, 500);
        this.copy_ortho_from_persp();

        this.active_camera = this.persp_camera;


        // Fog
        // sthis.sceneGraph.fog = new THREE.Fog(new THREE.Color('white'), 1, 5);


        // Lights
        sceneInit.insertAmbientLight(this.sceneGraph, 0.8);

        this.sun = new THREE.DirectionalLight(0xffffff, 2);
        this.sun.position.set(100, 50, 0);
        this.sun.lookAt(0, 0, 0);
        this.sceneGraph.add(this.sun);

        var earth = new THREE.SpotLight(0x4499bb, 2);
        earth.position.set(0, 0, 1000);
        earth.lookAt(0, 0, 0);
        this.sceneGraph.add(earth);

        //this.sun = new THREE.DirectionalLight(0xdedede, 0.3); // 0.7

        //this.sceneGraph.add(this.sun);
        // sceneInit.insertSpotLight(this.sceneGraph, Vector3(4, 8, 4));
        // sceneInit.insertPointLight(this.sceneGraph, Vector3(0, -4, 0), 0xffffff, 0.9);
        // //sceneInit.insertLight(this.sceneGraph, Vector3(3, 2, -2));


        // Environment map for reflective materials
        const path = "textures/skybox/earth00600";
        const urls = [
            path + "1.png", path + "3.png",
            path + "5.png", path + "4.png",
            path + "0.png", path + "2.png"
        ];
        this.textureCube = new THREE.CubeTextureLoader().load(urls);
        this.textureCube.rotation = Math.Pi;
        //this.sceneGraph.background = this.textureCube;


        // Renderer
        this.renderer = sceneInit.createRenderer();


        // Controls
        this.p_controls = new THREE.OrbitControls(this.persp_camera);
        this.o_controls = new THREE.OrbitControls(this.ortho_camera);


        // Insert to HTML
        sceneInit.insertRenderInHtml(this.renderer.domElement);
        window.addEventListener('resize', function (event) { this.onResize(); }.bind(this), false);
    }


    // Insert Objects
    init3DObjects() {

        initFrameXYZ(this.sceneGraph);

        // *********************** //
        /// Un objet selectionnable
        // *********************** //
        const cubeGeometry = primitive.Sphere(Vector3(0.5, 0.125, 0.5), 0.25);
        const cube = new THREE.Mesh(cubeGeometry, this.materials.METAL);
        cube.name = "cube";
        cube.castShadow = true;
        //this.sceneGraph.add(cube);
        this.picker.selectableObjects.push(cube); // Ajout du cube en tant qu'élément selectionnable


        // *********************** //
        /// Une sphère montrant la position selectionnée
        // *********************** //
        const sphereSelection = new THREE.Mesh(primitive.Sphere(Vector3(0, 0, 0), 0.015), MaterialRGB(1, 0, 0));
        sphereSelection.name = "sphereSelection";
        sphereSelection.visible = false;
        //this.sceneGraph.add(sphereSelection);
        this.picker.visualRepresentation.sphereSelection = sphereSelection;

        // *********************** //
        /// Une sphère montrant la position après translation
        // *********************** //
        const sphereTranslation = new THREE.Mesh(primitive.Sphere(Vector3(0, 0, 0), 0.015), MaterialRGB(0, 1, 0));
        sphereTranslation.name = "sphereTranslation";
        sphereTranslation.visible = false;
        //this.sceneGraph.add(sphereTranslation);
        this.picker.visualRepresentation.sphereTranslation = sphereTranslation;

        //const planeGeometry = primitive.Quadrangle()

    }


    // Helper methods for cameras

    orthographic_camera() {
        this.active_camera = this.ortho_camera;
        this.sceneGraph.background = null;
    }

    perspective_camera() {
        this.active_camera = this.persp_camera;
    }

    copy_locrot(origin, target) {
        target.position.copy(origin.position);
        target.rotation.copy(origin.rotation);
    }

    copy_ortho_from_persp() {
        this.copy_locrot(this.persp_camera, this.ortho_camera)
    }

    change_perspective(pos, at) {
        this.persp_camera.position.set(pos.x, pos.y, pos.z);
        this.persp_camera.lookAt(at.x, at.y, at.z);
        this.copy_ortho_from_persp();
    }


    // Rendering and animation

    render() {
        this.renderer.render(this.sceneGraph, this.active_camera);
    }

    animate(time) {
        const t = time / 1000;//time in second

        // Animate boids
        for(var b of this.boids){
            // Update boids
            b.run(this.boids);
            this.get_boids_centroids();

            // Follow one of them
            var bb = this.boids[0];

            // Change Camera
            if(bb.target){
                var r = bb.target.position.clone().sub(bb.position);


                // Targeting Perspective
                this.change_perspective( 
                    // 
                    bb.position.clone()
                    .sub(
                        r
                        .normalize()
                        .multiplyScalar(10))
                    .addScaledVector(
                        Vector3(-8, 2, -10),
                        1
                    ),

                    bb.target.position.clone()
                    .addScaledVector(bb.target.velocity,4));
            }
            else{
                // Default Perspective
                this.change_perspective(
                    Vector3(-1, 0.5, -2)
                    .applyMatrix4(bb.object.matrix),

                    Vector3(0, 0, 1)
                    .applyMatrix4(bb.object.matrix)
                    .addScaledVector(bb.velocity, 0.1)
                    .addScaledVector(this.boid_centroid, 0.01));
            }
            // Spawn new laser shot if pointing towards target
            if(bb.target && Math.random() < 0.05){
                var r = bb.target.position.clone().sub(bb.position).normalize();
                if(r.angleTo(bb.velocity.clone().normalize()) < 0.5){
                    console.log("shooty");
                    var g = new THREE.Geometry();
                    g.vertices.push(Vector3(0, 0, 0), Vector3(0, 0, 0.1));
                    var L = new THREE.Line(g, new THREE.LineBasicMaterial({color: 0xff0000}));
                    L.applyMatrix(bb.object.matrix);
                    L.life = 0;
                    L.dead = false;
    
                    //L.direction = r;
                    L.direction = bb.velocity.clone();
                    L.lookAt(r);
    
                    this.lasers.push(L);
                    this.sceneGraph.add(L);
                }
            }
        }

        // Animate lasers
        for(L of this.lasers){
            L.position.addScaledVector(L.direction, 10);
            L.geometry.vertices[1].z *=  1.1;
            L.geometry.verticesNeedUpdate = true;
            if(L.life++ > 50){
                this.sceneGraph.remove(L);
                L.dead = true;
            }
        }
        this.lasers = this.lasers.filter(L=>!L.dead);

        // Blink lights on the main boid
        if(this.boids.length > 0){
            if((g_time++ % 100 == 0) || (g_time % 97 == 0)){
                this.boids[0].object.traverse(
                    function(obj){
                        if(obj.type == "PointLight"){
                            obj.visible = !obj.visible;
                        }
                    }
                )
            }
        }

        this.render();
    }

    get_boids_centroids(){
        this.boid_centroid.multiplyScalar(0);
        for(var b of this.boids){
            this.boid_centroid.add(b.position);
        }
        this.boid_centroid.multiplyScalar(1/this.boids.length);
    }


    animationLoop() {
        requestAnimationFrame(

            // La fonction (dite de callback) recoit en paramètre le temps courant
            function (timeStamp) {
                if (!this.do_animate) { return; }
                this.animate(); // appel de notre fonction d'animation
                this.animationLoop(); // relance une nouvelle demande de mise à jour
            }.bind(this)

        );
    }

    onResize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        this.persp_camera.aspect = this.w / this.h;
        this.persp_camera.updateProjectionMatrix();

        var w = 2;
        var h = w/ this.persp_camera.aspect;
        this.ortho_camera.left = -w / 2;
        this.ortho_camera.right = w / 2;
        this.ortho_camera.top = h / 2;
        this.ortho_camera.bottom = -h / 2;
        this.ortho_camera.updateProjectionMatrix();

        this.renderer.setSize(this.w, this.h);
    }

    // Utility methods

    toggle_controls(){
        this.o_controls.enabled *= -1;
        this.p_controls.enabled *= -1;
    }

    enable_controls(){
        this.o_controls.enabled = true;
        this.p_controls.enabled = true;
    }

    disable_controls(){
        this.o_controls.enabled = false;
        this.p_controls.enabled = false;
    }

}

function Vector3(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

function MaterialRGB(r, g, b, alpha = 1) {
    const c = new THREE.Color(r, g, b);
    return new THREE.MeshLambertMaterial({ color: c, opacity: alpha, transparent: alpha != 1 ? true : false });
}

function MaterialGlossy(color, env_map) {
    return new THREE.MeshStandardMaterial({
        color: color,
        envMap: env_map,
        roughness: 0.01,
        emissive: 0.5,
        metalness: 1
    });
}

function inBox(point) {
    return (point.x >= 0 && point.y >= 0 && point.z >= 0 &&
        point.x <= 1 && point.y <= 1 && point.z <= 1);
}

// Creation de repères visuels indiquants les axes X,Y,Z entre [-1,1]
function initFrameXYZ(sceneGraph) {

    const rCylinder = 0.01;
    const rCone = 0.04;
    const alpha = 0.1;

    // Creation des axes
    const axeXGeometry = primitive.Arrow(Vector3(0, 0, 0), Vector3(1, 0, 0), rCylinder, rCone, alpha);
    const axeX = new THREE.Mesh(axeXGeometry, MaterialRGB(1, 0, 0, 0.2));

    const axeYGeometry = primitive.Arrow(Vector3(0, 0, 0), Vector3(0, 1, 0), rCylinder, rCone, alpha);
    const axeY = new THREE.Mesh(axeYGeometry, MaterialRGB(0, 1, 0, 0.2));

    const axeZGeometry = primitive.Arrow(Vector3(0, 0, 0), Vector3(0, 0, 1), rCylinder, rCone, alpha);
    const axeZ = new THREE.Mesh(axeZGeometry, MaterialRGB(0, 0, 1, 0.2));

    axeX.receiveShadow = true;
    axeY.receiveShadow = true;
    axeZ.receiveShadow = true;

    

    // Sphère en (0,0,0)
    const rSphere = 0.05;
    const sphereGeometry = primitive.Sphere(Vector3(0, 0, 0), rSphere);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 1, 1));
    sphere.receiveShadow = true;

    if(false){
        sceneGraph.add(axeX);
        sceneGraph.add(axeY);
        sceneGraph.add(axeZ);
        sceneGraph.add(sphere);
    }
}

function get_referential_planes(){

    // Creation des plans
    const L = 5;
    const planeXYGeometry = primitive.Quadrangle(Vector3(-L, -L, 0), Vector3(L, -L, 0), Vector3(L, L, 0), Vector3(-L, L, 0));
    const planeXY = new THREE.Mesh(planeXYGeometry, MaterialRGB(1, 1, 0.7, 0.5));

    const planeYZGeometry = primitive.Quadrangle(Vector3(0, -L, -L), Vector3(0, L, -L), Vector3(0, L, L), Vector3(0, -L, L));
    const planeYZ = new THREE.Mesh(planeYZGeometry, MaterialRGB(0.7, 1, 1, 0.5));

    const planeXZGeometry = primitive.Quadrangle(Vector3(-L, 0, -L), Vector3(-L, 0, L), Vector3(L, 0, L), Vector3(L, 0, -L));
    const planeXZ = new THREE.Mesh(planeXZGeometry, MaterialRGB(1, 0.7, 1, 0.5));

    planeXY.visible = false;
    planeYZ.visible = false;
    planeXZ.visible = false;

    planeXY.name = "XY";
    planeYZ.name = "YZ";
    planeXZ.name = "ZX";

    return [planeXY, planeYZ, planeXZ];

}
