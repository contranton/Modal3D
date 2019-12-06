"use strict";


let scene = main();

function main() {

    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null
    };

    const guiParams = {
        n_levels: 3,
        n_branches: 3,
        phi: 0,
        motion: 0.001,
        regen: false,
    };

    initEmptyScene(sceneThreeJs);
    init3DObjects(sceneThreeJs.sceneGraph);
    initGui(guiParams, sceneThreeJs);

    animationLoop(sceneThreeJs, guiParams);

    return sceneThreeJs;
}

function update(guiParams, sceneThreeJs){
    const graph = sceneThreeJs.sceneGraph;
    const tree = graph.getObjectByName("tree_base");

    if (guiParams.regen){
        graph.remove(tree);
        const tree = generateTree(Vector3(0, 0, 0),
                                  guiParams.n_branches,
                                  guiParams.phi,
                                  guiParams.n_levels,
                                  guiParams.motion);
        graph.add(tree);
        guiParams.regen = false;
    }

    tree.traverse(function(obj){
        if(obj.name=="leaf"){return;}
        const i = obj.userData.index;
        obj.rotateOnAxis(Vector3(0, 1, 0), 2*Math.PI*i/guiParams.n_branches);
        obj.rotateX(guiParams.phi);
    });


}


function initGui(guiParams, sceneThreeJs){
    const gui = new dat.GUI();

    const callback = function(val){return function(){guiParams.regen=val;update(guiParams, sceneThreeJs);};};

    gui.add(guiParams, "n_levels", 1, 10).onChange(callback(true));
    gui.add(guiParams, "n_branches", 1, 6).onChange(callback(true));
    gui.add(guiParams, "phi", 0, Math.PI).onChange(callback(false));
}

// Initialise les objets composant la scène 3D
function init3DObjects(sceneGraph) {


    const elementsToAdd = [];

    const Lp = 4; // taille du plan
    const planeGeometry = primitive.Quadrangle(Vector3(-Lp,0,-Lp),Vector3(-Lp,0,Lp),Vector3(Lp,0,Lp),Vector3(Lp,0,-Lp));
    const plane = new THREE.Mesh( planeGeometry,MaterialRGB(0.8,0.8,0.8) );
    plane.name = "plane";
    elementsToAdd.push(plane);

    // const cylinderGeometry = primitive.Cylinder( Vector3(0,-1,0), Vector3(0,1,0),0.15 );
    // const cylinder = new THREE.Mesh( cylinderGeometry,MaterialRGB(0.4,0.9,1) );
    // cylinder.name = "cylinder";
    // elementsToAdd.push(cylinder);

    const tree = generateTree(Vector3(0, 0, 0), 3, 0.1);
    elementsToAdd.push(tree);

    for( const k in elementsToAdd ) {
        const element = elementsToAdd[k];
        element.castShadow = true;
        element.receiveShadow = true;
        sceneGraph.add(element);
    }

    // const cylinder2Geometry = primitive.Cylinder( Vector3(0,-0.5,0), Vector3(0,0.5,0),0.15 );
    // const cylinder2 = new THREE.Mesh( cylinder2Geometry,MaterialRGB(0.1,0.9,0.1) );
    // cylinder2.name = "cylinder2";
    // cylinder.add(cylinder2);
}

// Demande le rendu de la scène 3D
function render( sceneThreeJs ) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}

function animate(sceneThreeJs, guiParams, time) {

    const t = time/1000;//time in second
    const A = guiParams.motion;

    const base = sceneThreeJs.sceneGraph.getObjectByName("tree_base");
    // Branch rotations
    base.traverse(function(obj){
        if(obj.name == "leaf"){return;}
        let d = obj.userData.depth;
        if(d == null){ d = 0;}
        obj.rotation.x += A*Math.cos(0.01*time)*d**3;
        obj.rotation.y -= A*Math.sin(0.01*time)*d**3;
        obj.rotation.z += A*Math.sin(time);
    });


    render(sceneThreeJs);
}






// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

    sceneThreeJs.sceneGraph = new THREE.Scene();
    sceneThreeJs.camera = sceneInit.createCamera(10,15,10);
    sceneInit.insertAmbientLight(sceneThreeJs.sceneGraph);
    sceneInit.insertLight(sceneThreeJs.sceneGraph,Vector3(-3,50,1));

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls( sceneThreeJs.camera );

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);} );
}

// Fonction de gestion d'animation
function animationLoop(sceneThreeJs, guiParams) {

    // Fonction JavaScript de demande d'image courante à afficher
    requestAnimationFrame(

        // La fonction (dite de callback) recoit en paramètre le temps courant
        function(timeStamp){
            animate(sceneThreeJs, guiParams, timeStamp); // appel de notre fonction d'animation
            animationLoop(sceneThreeJs, guiParams); // relance une nouvelle demande de mise à jour
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

function generateTree(base_pos, n_branches, motion){

    // Invariant definitions
    const brown = MaterialRGB(0.5, 0.2, 0.4);
    const green = MaterialRGB(0.3,0.9,0.1);
    let branch_height = 3;
    let scaling = 0.65;
    let radius = 0.2;
    const cylGeom = primitive.Cylinder(Vector3(0,0,0), Vector3(0, branch_height, 0), radius);
    const sphGeom = primitive.Sphere(Vector3(0,0,0), radius);


    // Main trunk
    const base = new THREE.Mesh(cylGeom, brown);
    base.name = "tree_base";
    base.position.set(base_pos.x, base_pos.y, base_pos.z);
    const base_link = new THREE.Mesh(sphGeom, brown);
    base_link.position.add(Vector3(0,branch_height,0));
    base.add(base_link);
    base.userData.depth = 1;

    // Branches

    // Lists for making the recursion iterative
    let last_branches = [];
    let new_branches = [];
    last_branches.push(base);

    // Loop over the number of levels desired
    for(let k = 1; k <= n_branches; k++){

        // Exhaust all branches to which children must be added
        while(last_branches){
            parent = last_branches.pop();
            if(!parent){break;};
            // Add 4 sub-branches per branch
            let Z = 6;
            for(let i = 0; i <= Z; i++){

                // Generate geometry 
                const branch = new THREE.Mesh(cylGeom, brown);
                const link = new THREE.Mesh(sphGeom, brown);
                link.position.add(Vector3(0, branch_height, 0));
                if(k == n_branches){
                    const leaf = new THREE.Mesh(sphGeom, green);
                    leaf.scale.set(2, 2, 2);
                    leaf.position.add(Vector3(0, radius, 0));
                    leaf.name = "leaf";
                    link.add(leaf);
                }
                branch.add(link);


                // Scale branches
                branch.scale.set(scaling, scaling, scaling);


                branch.rotateOnAxis(Vector3(0, 1, 0), 2*Math.PI*i/Z);
                branch.rotateX(0.6);

                // branch.rotation.x = 0.5;
                // branch.rotation.y = -i/3;
                // branch.rotation.z = i/3;


                // Place child in relation to parent branch
                branch.position.add(Vector3(0, branch_height+radius/2, 0));


                // Assign branch data (depth, radial index) 
                branch.userData = {depth: k,
                                   index: i};

                // Assign branches and update lists
                new_branches.push(branch);
                parent.add(branch);
            }
        }

        last_branches = new_branches;
        new_branches = [];
    }

    return base;
}


