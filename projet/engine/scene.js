"use strict";

class Scene {

    constructor() {

        // Main scene graph -- contains all objects
        this.sceneGraph = null;

        // Ship elements
        this.body = null;
        this.ship_elements = [];

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
                                            color: 0xAA00AA,
                                            envMap: this.textureCube,
                                            roughness: 0.8,
                                            emissive: 0,
                                            metalness: 0,
                                            flatShading: false
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
        sceneInit.insertAmbientLight(this.sceneGraph, 0.5);
        sceneInit.insertSpotLight(this.sceneGraph, Vector3(4, 8, 4));
        sceneInit.insertPointLight(this.sceneGraph, Vector3(0, -4, 0), 0xffffff, 0.9);
        //sceneInit.insertLight(this.sceneGraph, Vector3(3, 2, -2));


        // Environment map for reflective materials
        const path = "textures/skybox/";
        const urls = [
            path + "right.jpg", path + "left.jpg",
            path + "top.jpg", path + "bottom.jpg",
            path + "front.jpg", path + "back.jpg"
        ];
        this.textureCube = new THREE.CubeTextureLoader().load(urls);
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
        this.render();
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

    if(DEBUG){
        sceneGraph.add(axeX);
        sceneGraph.add(axeY);
        sceneGraph.add(axeZ);
    }

    // Sphère en (0,0,0)
    const rSphere = 0.05;
    const sphereGeometry = primitive.Sphere(Vector3(0, 0, 0), rSphere);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 1, 1));
    sphere.receiveShadow = true;
    sceneGraph.add(sphere);
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
