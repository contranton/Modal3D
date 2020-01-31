"use strict";


// ==================================================== //
// Initialisation des variables générales pour le rendu d'une scène 3D
// ==================================================== //

// Initialisation du graphe de scene
const sceneGraph = new THREE.Scene(); // Les classes JavaScript sont sont générés par l'appel à l'opérateur "new nomDeMaClasse()"

// Initialisation d'une caméra réalisant une perspective (angle de vision de 45 degrés, profondeur comprise entre 0.1 et 500)
const camera = new THREE.PerspectiveCamera(20,window.innerWidth/window.innerHeight,0.1,500); // Notez le passage de paramètres au constructeur de la classe
camera.position.set(-20,15,-50); // Placement de la caméra dans l'espace
camera.lookAt(0,0,0); // Direction de vue de la caméra

// Initialisation du moteur de rendu
const renderer = new THREE.WebGLRenderer( );
renderer.setPixelRatio( window.devicePixelRatio ); 
renderer.setClearColor(0xaaaaaa,1.0); // Couleur de fond d'écran (en hexa)
renderer.setSize( window.innerWidth, window.innerHeight );

// Remplacement de la balise html par le canvas approprié pour afficher le résultat issu du moteur de rendu
const baliseHtml = document.querySelector("#AffichageScene3D");
baliseHtml.appendChild(renderer.domElement);


// ==================================================== //
// Mise en place des éléments visuels de la scène
// ==================================================== //

// Initialisation d'une lumière
const spotLight = new THREE.SpotLight(0xffffff); // Lumière blanche ponctuelle emettant dans toutes les directions
spotLight.position.set(80,80,-80); // Positionnement dans du spot lumineux dans l'espace
sceneGraph.add(spotLight); // Ajout de la lumière dans le graphe de scène.

// Initialisation d'un objet 3D: 
const red =    new THREE.MeshLambertMaterial( {color:0xff0000} ); // Couleur rouge
const yellow = new THREE.MeshLambertMaterial( {color:0xaaaa00} ); // Couleur jaune
const green =  new THREE.MeshLambertMaterial( {color:0x00ff00} ); // Couleur vert

const width = 30;
const height = 2;
const bat_depth = 0.2;
const bat_height = 0.1;
const bat_n = 10;
const tow_r = 2;
const tow_h = 5;

let cube = new THREE.Mesh(new THREE.BoxGeometry(-width/2,  height, width/2), red);
sceneGraph.add(cube);

let corners = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
for(var i = 0; i < 4; i++){
    const new_w = (width/2 - tow_r)/2 ;
    let obj = new THREE.Mesh(new THREE.CylinderGeometry(tow_r, tow_r, tow_h, 10), green);
    obj.position.set(corners[i][0]*new_w, (tow_h-height)/2, corners[i][1]*new_w);
    sceneGraph.add(obj);

    obj = new THREE.Mesh(new THREE.ConeGeometry(tow_r, 3, 10, 5), yellow);;
    obj.position.set(corners[i][0]*new_w, tow_h+0.5, corners[i][1]*new_w);
    sceneGraph.add(obj);
}


// ==================================================== //
// Rendu de la scène
// ==================================================== //
renderer.render(sceneGraph, camera);
