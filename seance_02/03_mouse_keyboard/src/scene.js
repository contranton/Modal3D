"use strict";

// ****************************** //
//  Creation de la scène
// ****************************** //

const sceneGraph = new THREE.Scene();

// Creation d'une caméra Orthographique (correspondance simple entre la position de la souris et la position dans l'espace (x,y))
const camera = new THREE.OrthographicCamera(-1,1,1,-1,-1,1);

const renderer = new THREE.WebGLRenderer( { antialias: true,alpha:false } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0xeeeeee,1.0);

// Force la zone de rendu à être de taille carré
let canvasSize = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize( canvasSize,canvasSize );

const baliseHtml = document.querySelector("#AffichageScene3D");
baliseHtml.appendChild(renderer.domElement);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0,0,1);
sceneGraph.add(spotLight);

// ****************************** //
//  Ajout de l'objet
// ****************************** //

const radius = 0.25; // Rayon de la sphère
const geometry = new THREE.SphereGeometry( radius,32,32 );
const material = new THREE.MeshLambertMaterial( {color:0xaaffff} );
const object = new THREE.Mesh( geometry, material );
sceneGraph.add(object);

// ****************************** //
//  Fonctions de rappels évènementielles
// ****************************** //

// Bouton de la souris enclenché
window.addEventListener('mousedown', onMouseDown);

// Bouton de la souris relaché
window.addEventListener('mouseup', onMouseUp);

// Souris qui se déplace
window.addEventListener('mousemove', onMouseMove);

// Touche de clavier enfoncé
window.addEventListener('keydown', onKeyDown);

// Touche de clavier relaché
window.addEventListener('keyup', onKeyUp);

// Redimensionnement de la fenêtre
window.addEventListener('resize',onResize);


// ****************************** //
//  Rendu
// ****************************** //
let movement_vector = new THREE.Vector3(0, 0, 0);

function render() {
    object.position.add(movement_vector);
    renderer.render(sceneGraph, camera);
}

render();




let pressed = false;
// Fonction appelée lors du clic de la souris
function onMouseDown(event) {
    console.log('Mouse down');

    // Coordonnées du clic de souris en pixel
    const xPixel = event.clientX;
    const yPixel = event.clientY;

    // Conversion des coordonnées pixel en coordonnées relatives par rapport à la fenêtre (ici par rapport au canvas de rendu).
    // Les coordonnées sont comprises entre -1 et 1
    const x = 2*(xPixel/canvasSize)-1 - object.position.x;
    const y = 1-2*(yPixel/canvasSize) - object.position.y;


    // Recherche si le clic est à l'intérieur ou non de la sphère
    if ( x*x+y*y < radius*radius ) {

        pressed = true;
        object.material.color.set(0xff0000);

    }

    // MAJ de l'image
    render();

}

// Fonction appelée lors du relachement de la souris
function onMouseUp(event) {
    console.log('Mouse up');
    console.log(event.x, event.y);
    console.log(object.position.x, object.position.y);
    pressed = false;

    object.material.color.set(0xaaffff);
    render();
}

// Fonction appelée lors du déplacement de la souris

const sc_ratio = canvasSize;
function onMouseMove(event) {
    if(event.buttons === 1 && pressed){ // Left click
        object.position.add(new THREE.Vector3(event.movementX/sc_ratio,
                                              -event.movementY/sc_ratio,
                                             0));
    }
    render();
}

let key_pressed = {
    "ArrowDown": false,
    "ArrowRight": false,
    "ArrowLeft": false,
    "ArrowUp": false
};

const dx = 0.05;
// Fonction appelée lors de l'appuis sur une touche du clavier
function onKeyDown(event) {

    const keyCode = event.code;
    console.log("Touche ",keyCode," enfoncé");

    if(!key_pressed[keyCode]){
        switch(keyCode){
        case "ArrowDown":
            movement_vector.add(new THREE.Vector3(0, -dx, 0));
            break;
        case "ArrowRight":
            movement_vector.add(new THREE.Vector3(dx, 0, 0));
            break;
        case "ArrowLeft":
            movement_vector.add(new THREE.Vector3(-dx, 0, 0));
            break;
        case "ArrowUp":
            movement_vector.add(new THREE.Vector3(0, dx, 0));
            break;
        }
        key_pressed[keyCode] = true;
    }

    render();
}

// Fonction appelée lors du relachement d'une touche du clavier
function onKeyUp(event) {
	  const keyCode = event.code;
	  console.log("Touche ",keyCode," relaché");


    if(key_pressed[keyCode]){
        switch(keyCode){
        case "ArrowDown":
            movement_vector.add(new THREE.Vector3(0, dx, 0));
            break;
        case "ArrowRight":
            movement_vector.add(new THREE.Vector3(-dx, 0, 0));
            break;
        case "ArrowLeft":
            movement_vector.add(new THREE.Vector3(dx, 0, 0));
            break;
        case "ArrowUp":
            movement_vector.add(new THREE.Vector3(0, -dx, 0));
            break;
        }

        key_pressed[keyCode] = false;
    }

    render();
}

// Fonction appelée lors du redimmensionnement de la fenetre
function onResize(event) {

    // On force toujours le canvas à être carré
    canvasSize = Math.min(window.innerWidth, window.innerHeight);
    renderer.setSize( canvasSize,canvasSize );
}
