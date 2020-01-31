"use strict";


main();

function main() {

    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null
    };

    initEmptyScene(sceneThreeJs);
    init3DObjects(sceneThreeJs.sceneGraph);


    animationLoop(sceneThreeJs);
}

// Initialise les objets composant la scène 3D
function init3DObjects(sceneGraph) {


    const elementsToAdd = [];

    // Un plan en dessous des objets animés
    const Lp = 8;
    const planeGeometry = primitive.Quadrangle(Vector3(-Lp,-2,-Lp),Vector3(-Lp,-2,Lp),Vector3(Lp,-2,Lp),Vector3(Lp,-2,-Lp));
    const plane = new THREE.Mesh( planeGeometry,MaterialRGB(0.8,0.8,0.8) );
    plane.name = "plane";
    plane.receiveShadow = true;
    sceneGraph.add(plane);

    const rectGeometry = new THREE.BoxGeometry(4, 2, 2 );
    const rectangle = new THREE.Mesh(rectGeometry,MaterialRGB(1,0,0));
    rectangle.position.set(4, -1.75, 4);
    rectangle.name = "rectangle";
    rectangle.castShadow = true;
    rectangle.receiveShadow = true;
    sceneGraph.add(rectangle);

}

// Demande le rendu de la scène 3D
function render( sceneThreeJs ) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}

function animate(sceneThreeJs, time) {

    const t = time/1000;//time in second

    const cube = sceneThreeJs.sceneGraph.getObjectByName("rectangle");

    // Rotation autour centre objet rattaché à la Scène
    cube.rotation.y += 0.01;


    render(sceneThreeJs);
}






// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    sceneThreeJs.sceneGraph = new THREE.Scene();

    sceneThreeJs.camera = sceneInit.createCamera(-13,9,21);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(-3,5,10));

    const spotLight2 = new THREE.SpotLight(0xffffff,0.4);
    spotLight2.position.copy(sceneThreeJs.camera.position);

    spotLight2.castShadow = true;
    spotLight2.shadow.mapSize.width = 2048;
    spotLight2.shadow.mapSize.height = 2048;

    sceneThreeJs.sceneGraph.add(spotLight2);


    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls( sceneThreeJs.camera );

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);} );
}

// Fonction de gestion d'animation
function animationLoop(sceneThreeJs) {

    // Fonction JavaScript de demande d'image courante à afficher
    requestAnimationFrame(

        // La fonction (dite de callback) recoit en paramètre le temps courant
        function(timeStamp){
            animate(sceneThreeJs,timeStamp); // appel de notre fonction d'animation
            animationLoop(sceneThreeJs); // relance une nouvelle demande de mise à jour
        }

     );

}

// Fonction appelée lors du redimensionnement de la fenetre
function onResize(sceneThreeJs) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneThreeJs.camera.aspect = width / height;
    sceneThreeJs.camera.updateProjectionMatrix();

    sceneThreeJs.renderer.setSize(width, height);
}

function Vector3(x,y,z) {
    return new THREE.Vector3(x,y,z);
}

function MaterialRGB(r,g,b) {
    const c = new THREE.Color(r,g,b);
    return new THREE.MeshLambertMaterial( {color:c} );
}
