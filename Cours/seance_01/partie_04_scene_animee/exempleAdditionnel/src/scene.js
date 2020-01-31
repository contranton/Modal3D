"use strict";

// Variable globale (pour simplifier les arguments des différentes fonctions)
const sceneThreeJs = {
    sceneGraph: null,
    camera: null,
    renderer: null
};

main();

function main() {

    // Initialisation de la scène et des objets
    initEmptyScene();
    init3DObjects();

    // Lancement de la boucle d'initialisation
    animationLoop();
}

// Initialise les objets composant la scène 3D
function init3DObjects() {

    const box2Object = new THREE.Mesh( new THREE.BoxGeometry(1,1,4), new THREE.MeshLambertMaterial({color:0xffff00}));
    box2Object.name = "box2";
    box2Object.rotation.y = 3*Math.PI/4; 
    sceneThreeJs.sceneGraph.add(box2Object);

    const sphereGeometry = new THREE.SphereGeometry(0.5, 21, 24); 
    const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xffff00}); 
    const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial); 
    sphereObject.position.set(-2,0,2); 
    sphereObject.name = "sphere"; 
    sceneThreeJs.sceneGraph.add(sphereObject);


    const box3Object = new THREE.Mesh(new THREE.BoxGeometry(3,0.25,3), new THREE.MeshLambertMaterial({color: 0xff0000}));
    box3Object.name = "box3"; 
    box3Object.position.set(1,0.5,2); 
    box3Object.rotation.y = 3*Math.PI/4; 
    sceneThreeJs.sceneGraph.add(box3Object);
 
    const box4Object = new THREE.Mesh(new THREE.BoxGeometry(3,0.25,3), new THREE.MeshLambertMaterial({color: 0xff0000}));
    box4Object.name = "box4"; 
    box4Object.position.set(-2,0.5,-1); 
    box4Object.rotation.y = 3*Math.PI/4; 
    sceneThreeJs.sceneGraph.add(box4Object);



}

// Fonction de gestion d'animation
function animationLoop() {

    // Fonction JavaScript de gestion d'animation
    //  La paramètre de requestAnimationFrame est la fonction à appeler régulièrement
    requestAnimationFrame( animate );
}

// La fonction d'animation en temps que telle
//  Fonction appelée depuis requestAnimationFrame, recoit en paramètre le temps écoule (en ms).
function animate(time) {

    //temps en seconde
    const t = time/1000;

    // Animation de l'objet ayant le nom "box"
   const box2 = sceneThreeJs.sceneGraph.getObjectByName("box2");
   box2.position.set(0, Math.sin(10*t)/5, 0); 

   const sphere = sceneThreeJs.sceneGraph.getObjectByName("sphere"); 
   sphere.position.set(-2, Math.sin(10*t)/5, 2); 

   const box3 = sceneThreeJs.sceneGraph.getObjectByName("box3");
   box3.rotation.z = Math.sin(10*t)/5; 

   const box4 = sceneThreeJs.sceneGraph.getObjectByName("box4"); 
   box4.rotation.z = -Math.sin(10*t)/5; 
    

    // Affichage de la scène
    render();

    // Relance la boucle d'animation
    animationLoop();
}

// Demande le rendu de la scène 3D
function render() {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}



// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene() {

    sceneThreeJs.sceneGraph = new THREE.Scene();

    sceneThreeJs.camera = sceneInit.createCamera(-5,5,5);
    sceneInit.insertLight(sceneThreeJs.sceneGraph);

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);
}
