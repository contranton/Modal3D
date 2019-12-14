"use strict";

class PickController{
    constructor(){
        
        this.enabled  = false;          // Mode picking en cours ou désactivé (CTRL enfoncé)
        this.enableDragAndDrop  = false; // Drag and drop en cours ou désactivé
        this.selectableObjects  = [];  // Les objets selectionnables par picking
        this.selectedObject  = null;     // L'objet actuellement selectionné
        this.selectedPlane  = {p : null, n : null }; // Le plan de la caméra au moment de la selection. Plan donné par une position p; et une normale n.

        this.visualRepresentation  = {
            sphereSelection : null,    // Une sphère montrant le point d'intersection au moment du picking
            sphereTranslation : null, // Une sphère montrant l'état actuel de la translation
        };
        
    }
}

class Scene {

    constructor(picker) {

        // Main scene graph -- contains all objects
        this.sceneGraph = null;

        // Cameras
        this.ORTHO = false; // True if using orthographic camera
        this.persp_camera = null; // Default, used for general viz
        this.ortho_camera = null; // Used only for projective drawing

        this.renderer = null;
        this.controls = null;

        // Les données associées au picking
        this.picker = new PickController();

        // Initialize Scene
        this.initEmptyScene();
        this.init3DObjects();

        this.raycaster = new THREE.Raycaster();

        // Récupération de la taille de la fenetre en tant que variable à part
        this.w = this.renderer.domElement.clientWidth;
        this.h = this.renderer.domElement.clientHeight;

        // Bind callbacks
        document.addEventListener('keydown', onKeyDown.bind(this));
        document.addEventListener('mousedown', onMouseDown.bind(this));
        document.addEventListener('keyup', onKeyUp.bind(this));
        document.addEventListener('mouseup', onMouseUp.bind(this));
        document.addEventListener('mousemove', onMouseMove.bind(this));

        // Make false to stop animating (useful for lowering load when debugging menus)
        this.do_animate = true;
        this.animationLoop()

    }
 
    initEmptyScene() {

        this.sceneGraph = new THREE.Scene();

        // Cameras
        this.persp_camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,500);
        this.persp_camera.position.set(1, 1.5, 3);
        this.persp_camera.lookAt(0,0,0);

        const w = 2; const h = w/this.persp_camera.aspect;
        this.ortho_camera = new THREE.OrthographicCamera(w/-2, w/2, h/2, h/-2, 0, 500);
        this.copy_ortho_from_persp();

        // Lights
        sceneInit.insertAmbientLight(this.sceneGraph);
        sceneInit.insertLight(this.sceneGraph, Vector3(2, 4, 2));
        //sceneInit.insertLight(this.sceneGraph, Vector3(3, 2, -2));
        

        // Environment map for reflective materials
        const path = "textures/skybox/";
        const urls = [
            path + "right.jpg", path + "left.jpg",
            path + "top.jpg", path + "bottom.jpg",
            path + "front.jpg", path + "back.jpg"
        ];
        this.textureCube = new THREE.CubeTextureLoader().load( urls );

        // Renderer
        this.renderer = sceneInit.createRenderer();
        this.sceneGraph.background = this.textureCube;

        // Controls
        this.p_controls = new THREE.OrbitControls(this.persp_camera);
        this.o_controls = new THREE.OrbitControls(this.ortho_camera);
        
        // Insert to HTML
        sceneInit.insertRenderInHtml(this.renderer.domElement);
        window.addEventListener('resize', function (event) { this.onResize(); }.bind(this), false);
    }

    init3DObjects() {

        initFrameXYZ(this.sceneGraph);

        // *********************** //
        /// Un objet selectionnable
        // *********************** //
        const cubeGeometry = primitive.Sphere(Vector3(0.5, 0.125, 0.5), 0.25);
        const cube = new THREE.Mesh(cubeGeometry, MaterialGlossy("#FFFFAA", this.textureCube));
        cube.name = "cube";
        cube.castShadow = true;
        this.sceneGraph.add(cube);
        this.picker.selectableObjects.push(cube); // Ajout du cube en tant qu'élément selectionnable


        // *********************** //
        /// Une sphère montrant la position selectionnée
        // *********************** //
        const sphereSelection = new THREE.Mesh(primitive.Sphere(Vector3(0, 0, 0), 0.015), MaterialRGB(1, 0, 0));
        sphereSelection.name = "sphereSelection";
        sphereSelection.visible = false;
        this.sceneGraph.add(sphereSelection);
        this.picker.visualRepresentation.sphereSelection = sphereSelection;

        // *********************** //
        /// Une sphère montrant la position après translation
        // *********************** //
        const sphereTranslation = new THREE.Mesh(primitive.Sphere(Vector3(0, 0, 0), 0.015), MaterialRGB(0, 1, 0));
        sphereTranslation.name = "sphereTranslation";
        sphereTranslation.visible = false;
        this.sceneGraph.add(sphereTranslation);
        this.picker.visualRepresentation.sphereTranslation = sphereTranslation;

    }


    orthographic_camera(){
        this.ORTHO = true;
    }

    perspective_camera(){
        this.ORTHO = false;
    }

    copy_locrot(origin, target){
        target.position.copy(origin.position);
        target.rotation.copy(origin.rotation);
    }

    copy_ortho_from_persp(){
        this.copy_locrot(this.persp_camera, this.ortho_camera)
    }

    change_perspective(pos, at){
        this.persp_camera.position.set(pos.x, pos.y, pos.z);
        this.persp_camera.lookAt(at.x, at.y, at.z);
        this.copy_ortho_from_persp();
    }

    render() {
        if(this.ORTHO){
            this.renderer.render(this.sceneGraph, this.ortho_camera);
        }else{
            this.renderer.render(this.sceneGraph, this.persp_camera);
        }
    }

    animate(time) {

        const t = time / 1000;//time in second
        this.render();
    }

    animationLoop(){
        var that = this;
        requestAnimationFrame(

            // La fonction (dite de callback) recoit en paramètre le temps courant
            function (timeStamp) {
                if(!that.do_animate){return;}
                that.animate(); // appel de notre fonction d'animation
                that.animationLoop(); // relance une nouvelle demande de mise à jour
            }

        );  
    }

    // Fonction appelée lors du redimensionnement de la fenetre
    onResize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        this.persp_camera.aspect = this.w / this.h;
        this.persp_camera.updateProjectionMatrix();

        this.ortho_camera.left = -this.w/2;
        this.ortho_camera.right = this.w/2;
        this.ortho_camera.top = this.h/2;
        this.ortho_camera.bottom = -this.h/2;
        this.ortho_camera.updateProjectionMatrix();

        this.renderer.setSize(this.w, this.h);
    }
}

function Vector3(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

function MaterialRGB(r, g, b) {
    const c = new THREE.Color(r, g, b);
    return new THREE.MeshLambertMaterial({ color: c });
}

function MaterialGlossy(color, env_map){
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
    const axeX = new THREE.Mesh(axeXGeometry, MaterialRGB(1, 0, 0));

    const axeYGeometry = primitive.Arrow(Vector3(0, 0, 0), Vector3(0, 1, 0), rCylinder, rCone, alpha);
    const axeY = new THREE.Mesh(axeYGeometry, MaterialRGB(0, 1, 0));

    const axeZGeometry = primitive.Arrow(Vector3(0, 0, 0), Vector3(0, 0, 1), rCylinder, rCone, alpha);
    const axeZ = new THREE.Mesh(axeZGeometry, MaterialRGB(0, 0, 1));

    axeX.receiveShadow = true;
    axeY.receiveShadow = true;
    axeZ.receiveShadow = true;

    sceneGraph.add(axeX);
    sceneGraph.add(axeY);
    sceneGraph.add(axeZ);

    // Sphère en (0,0,0)
    const rSphere = 0.05;
    const sphereGeometry = primitive.Sphere(Vector3(0, 0, 0), rSphere);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1, 1, 1));
    sphere.receiveShadow = true;
    sceneGraph.add(sphere);



    // Creation des plans
    const L = 1;
    const planeXYGeometry = primitive.Quadrangle(Vector3(0, 0, 0), Vector3(L, 0, 0), Vector3(L, L, 0), Vector3(0, L, 0));
    const planeXY = new THREE.Mesh(planeXYGeometry, MaterialRGB(1, 1, 0.7));

    const planeYZGeometry = primitive.Quadrangle(Vector3(0, 0, 0), Vector3(0, L, 0), Vector3(0, L, L), Vector3(0, 0, L));
    const planeYZ = new THREE.Mesh(planeYZGeometry, MaterialRGB(0.7, 1, 1));

    const planeXZGeometry = primitive.Quadrangle(Vector3(0, 0, 0), Vector3(0, 0, L), Vector3(L, 0, L), Vector3(L, 0, 0));
    const planeXZ = new THREE.Mesh(planeXZGeometry, MaterialRGB(1, 0.7, 1));

    planeXY.receiveShadow = true;
    planeYZ.receiveShadow = true;
    planeXZ.receiveShadow = true;


    sceneGraph.add(planeXY);
    sceneGraph.add(planeYZ);
    sceneGraph.add(planeXZ);

}
