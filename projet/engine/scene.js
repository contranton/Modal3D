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

        console.log(this);
        this.sceneGraph = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Les données associées au picking
        this.picker = new PickController();

        this.initEmptyScene();
        this.init3DObjects();

        this.raycaster = new THREE.Raycaster();

        // Récupération de la taille de la fenetre en tant que variable à part
        this.screenSize = {
            w: this.renderer.domElement.clientWidth,
            h: this.renderer.domElement.clientHeight
        };

        document.addEventListener('keydown', onKeyDown.bind(this));
        document.addEventListener('mousedown', onMouseDown.bind(this));
        document.addEventListener('keyup', onKeyUp.bind(this));
        document.addEventListener('mouseup', onMouseUp.bind(this));
        document.addEventListener('mousemove', onMouseMove.bind(this));

        this.animationLoop()

    }
 
    initEmptyScene() {

        this.sceneGraph = new THREE.Scene();

        this.camera = sceneInit.createCamera(1, 1.5, 3);
        sceneInit.insertAmbientLight(this.sceneGraph);
        sceneInit.insertLight(this.sceneGraph, Vector3(1, 2, 2));

        this.renderer = sceneInit.createRenderer();
        sceneInit.insertRenderInHtml(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera);

        window.addEventListener('resize', function (event) { this.onResize(); }.bind(this), false);
    }

    init3DObjects() {

        initFrameXYZ(this.sceneGraph);

        // *********************** //
        /// Un objet selectionnable
        // *********************** //
        const cubeGeometry = primitive.Cube(Vector3(0.5, 0.125, 0.5), 0.25);
        const cube = new THREE.Mesh(cubeGeometry, MaterialRGB(1, 1, 1));
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

    render() {
        this.renderer.render(this.sceneGraph, this.camera);
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
                that.animate(); // appel de notre fonction d'animation
                that.animationLoop(); // relance une nouvelle demande de mise à jour
            }

        );  
    }

    // Fonction appelée lors du redimensionnement de la fenetre
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.screenSize.w = width;
        this.screenSize.h = height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }
}

function Vector3(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

function MaterialRGB(r, g, b) {
    const c = new THREE.Color(r, g, b);
    return new THREE.MeshLambertMaterial({ color: c });
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
