"use strict";


// ==================================================== //
// Initialisation des variables générales pour le rendu d'une scène 3D
// ==================================================== //

// Initialisation du graphe de scene
const sceneGraph = new THREE.Scene(); // Les classes JavaScript sont sont générés par l'appel à l'opérateur "new nomDeMaClasse()"

// Initialisation d'une caméra réalisant une perspective (angle de vision de 45 degrés, profondeur comprise entre 0.1 et 500)
const camera = new THREE.PerspectiveCamera(15,window.innerWidth/window.innerHeight,0.1,500); // Notez le passage de paramètres au constructeur de la classe
camera.position.set(100,20,100); // Placement de la caméra dans l'espace
camera.lookAt(0,5,0); // Direction de vue de la caméra

// Initialisation du moteur de rendu
const renderer = new THREE.WebGLRenderer( );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0x444444,1.0); // Couleur de fond d'écran (en hexa)
renderer.setSize( window.innerWidth, window.innerHeight );

// Remplacement de la balise html par le canvas approprié pour afficher le résultat issu du moteur de rendu
const baliseHtml = document.querySelector("#AffichageScene3D");
baliseHtml.appendChild(renderer.domElement);


// ==================================================== //
// Mise en place des éléments visuels de la scène
// ==================================================== //

// Initialisation d'une lumière
const spotLight = new THREE.SpotLight(0x4444ff); // Lumière blanche ponctuelle emettant dans toutes les directions
spotLight.position.set(-10,10,50); // Positionnement dans du spot lumineux dans l'espace
const spotLight2 = new THREE.SpotLight(0xffddaa); // Lumière blanche ponctuelle emettant dans toutes les directions
spotLight2.position.set(50,20,0); // Positionnement dans du spot lumineux dans l'espace
sceneGraph.add(spotLight); // Ajout de la lumière dans le graphe de scène.
sceneGraph.add(spotLight2); // Ajout de la lumière dans le graphe de scène.

// Initialisation d'un objet 3D:
const s = 1;
const cubeGeometry = new THREE.CubeGeometry(s,s,s ); // Primitive cubique de taille 1x1x1 centrée en (0,0,0)
const cubeMaterial = new THREE.MeshLambertMaterial( {color:0xFF0000} ); // Couleur rouge
const cubeMaterial2 = new THREE.MeshLambertMaterial( {color:0x00FF00} ); // Couleur vert

const materials = [cubeMaterial, cubeMaterial2];
for(var i = 10; i >=0; i--){
    for(var jx = -i; jx <= i; jx++){
        for(var jy = -i; jy <= i; jy++){
            const obj = new THREE.Mesh(cubeGeometry, materials[i%2]);
            obj.position.set(jx, 10-i, jy);
            sceneGraph.add(obj);
        }

    }

}


// ==================================================== //
// Rendu de la scène
// ==================================================== //
renderer.render(sceneGraph, camera);

