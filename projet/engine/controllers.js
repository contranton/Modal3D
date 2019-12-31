// https://gist.github.com/webinista/11240585#gistcomment-1781756
// Splits an array r into j-sized subarrays
const foldm = (r,j) => r.reduce((a,b,i,g) => !(i % j) ? a.concat([g.slice(i,i+j)]) : a, []);

class PickController {
    constructor(scene) {
        this.scene = scene;

        this.enabled = false;          // Mode picking en cours ou désactivé (CTRL enfoncé)
        this.enableDragAndDrop = false; // Drag and drop en cours ou désactivé
        this.selectableObjects = [];  // Les objets selectionnables par picking
        this.selectedObject = null;     // L'objet actuellement selectionné
        this.selectedPlane = { p: null, n: null }; // Le plan de la caméra au moment de la selection. Plan donné par une position p; et une normale n.

        this.visualRepresentation = {
            sphereSelection: null,    // Une sphère montrant le point d'intersection au moment du picking
            sphereTranslation: null, // Une sphère montrant l'état actuel de la translation
        };

    }

    on_down(x, y){
        /* Manages object selection */

        // Calcul d'un rayon passant par le point (x,y)
        //  c.a.d la direction formé par les points p de l'espace tels que leurs projections sur l'écran par la caméra courante soit (x,y).
        this.scene.raycaster.setFromCamera(new THREE.Vector2(x, y), this.scene.active_camera);

        // Calcul des interections entre le rayon et les objets passés en paramètres
        const intersects = this.scene.raycaster.intersectObjects(this.selectableObjects);

        const nbrIntersection = intersects.length;
        if (nbrIntersection > 0) {

            // Les intersections sont classés par distance le long du rayon. On ne considère que la première.
            const intersection = intersects[0];

            // Sauvegarde des données du picking
            this.selectedObject = intersection.object; // objet selectionné
            this.selectedPlane.p = intersection.point.clone(); // coordonnées du point d'intersection 3D
            this.selectedPlane.n = new Vector3();
            this.scene.active_camera.getWorldDirection(this.selectedPlane.n); // normale du plan de la caméra

            // Affichage de la selection
            const sphereSelection = this.visualRepresentation.sphereSelection;
            sphereSelection.position.copy(this.selectedPlane.p);
            sphereSelection.visible = true;
            this.enableDragAndDrop = true;
        }
    }

    on_move(x, y){
        /* Manages drag-and-drop behavior */

        // Projection inverse passant du point 2D sur l'écran à un point 3D
        const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/);
        selectedPoint.unproject(this.scene.active_camera);

        // Direction du rayon passant par le point selectionné
        const p0 = this.scene.active_camera.position;
        const d = selectedPoint.clone().sub(p0);

        // Intersection entre le rayon 3D et le plan de la camera
        const p = this.selectedPlane.p;
        const n = this.selectedPlane.n.subScalar(0.25 / 2);
        // tI = <p-p0,n> / <d,n>
        const tI = ((p.clone().sub(p0)).dot(n)) / (d.dot(n));
        // pI = p0 + tI d
        const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection


        // Translation à appliquer
        const translation = pI.clone().sub(p);

        const obj = this.selectedObject;
        // Translation de l'objet et de la représentation visuelle
        obj.translateX(translation.x);
        obj.translateY(translation.y);
        obj.translateZ(translation.z);

        // If Translation depasses box, undo it
        let verts = [...obj.geometry.vertices.map(p => p.clone())];
        verts.map(p => p.add(obj.position));
        if (verts.some(p => !inBox(p))) {
            obj.translateX(-translation.x);
            obj.translateY(-translation.y);
            obj.translateZ(-translation.z);
        }

        this.selectedPlane.p.add(translation);

        this.visualRepresentation.sphereTranslation.visible = true;
        this.visualRepresentation.sphereTranslation.position.copy(p);
    }

}

class DrawController {
    constructor(scene) {
        this.scene = scene

        this.enabled = false;
        this.drawable_objs = [];
        this.callbacks = {};

        // Name of the final mesh
        this.view = "";

        // Raycasted object
        this.selected_obj = null;
        this.current_points = [];

        this.i_points = 0;
        this.MAX_POINTS = 256;
        this.__new_line()

        // Final mesh
        this.generated_shape = null

        // Is in the process of drawing (i.e. mouse held down)
        this.drawing = false;
    }

    __new_line(){
        // BufferGeometry for efficient point addition
        // Geometry gets rebuilt if maximum point number is surpassed
        this.i_points = 0;
        const line_geom = new THREE.BufferGeometry();
        const positions = new Float32Array(this.MAX_POINTS * 3);
        line_geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        line_geom.setDrawRange(0, this.i_points);

        // Line Object
        const line_mat = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.current_line = new THREE.Line(line_geom, line_mat);
    }

    draw_point(screen_x, screen_y, clicked=false, rem=false) {
        const raycaster = this.scene.raycaster;
        const camera = this.scene.active_camera;

        // Position the raycaster at the camera position towards the chosen x, y
        raycaster.setFromCamera(new THREE.Vector2(screen_x, screen_y), camera);

        // Launch the ray
        const intersects = raycaster.intersectObjects(this.drawable_objs);

        // If we had a hit
        if (intersects.length > 0) {

            // Get the first hit object
            let intersection = intersects[0];

            // Draw only on the first object touched by the mouse
            if (clicked) {
                this.selected_obj = intersection.object;
            } else if(intersection.object != this.selected_obj) {
                return;
            }

            // Clear previous drawings
            if(rem){
                var to_rem = true;
                while(to_rem){
                    to_rem = this.selected_obj.getObjectByProperty('finished', true);     
                    this.selected_obj.remove(to_rem);
                }
            }


            // Update geometry


            let position = this.current_line.geometry.attributes.position;
            const p = intersection.point.clone();
            // Add new point
            position.array[this.i_points++] = p.x;
            position.array[this.i_points++] = p.y;
            position.array[this.i_points++] = p.z;
            /* // And connect it to the first point
            position.array[this.i_points+1] = position.array[0];
            position.array[this.i_points+2] = position.array[1];
            position.array[this.i_points+3] = position.array[2]; */

            position.needsUpdate = true;

            // Rebuild geometry if not enough points
            if(this.i_points >= this.MAX_POINTS*3){
                console.log("Rebuilding")
                this.MAX_POINTS *= 2;
                let new_geom = new THREE.BufferGeometry();
                let old_geom = this.current_line.geometry;
                let positions = new Float32Array(this.MAX_POINTS * 3);
                new_geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                new_geom.attributes.position.array.set(old_geom.attributes.position.array);
                this.current_line.geometry = new_geom;
            }

            this.current_line.geometry.setDrawRange(0, this.i_points-1);
            this.current_line.geometry.computeBoundingSphere();

            this.current_line.finished = false; 
            this.current_line.is_ob = true;
 
        }
    }

    finish_drawing(name="drawing"){
        /* Called upon release of the mouse on the current drawing

        Manages geometry creation.
        */


        // Map line to the object (?)
        this.selected_obj.updateMatrix();
        const matrice = this.selected_obj.matrix;
        matrice.getInverse(matrice);
        this.current_line.applyMatrix(matrice);

        // Re-add drawn lines
        this.current_line.finished = true;
        //this.selected_obj.remove(this.current_line);
        this.selected_obj.add(this.current_line.clone());
        
        // Generate triangulation and add to scene
        // TODO: ConvexGeometry or ShapeGeometry? How to ensure we can later get shapes conformed to other objects?

        // Flatten 3D drawing to 2D planes
        let points = foldm(this.current_line.geometry.attributes.position.array, 3);

        switch(this.view){
            case "profile":
                points = points.map(x => new THREE.Vector2(x[1], x[2])).slice(0, this.i_points/3);
                break;
            case "top":
                points = points.map(x => new THREE.Vector2(x[0], x[2])).slice(0, this.i_points/3);
                break;
            // Deal with arbitrary geometry here. Project onto the minimum base plane?
        }

        // Assign drawing to object
        const drawn_shape = new THREE.Shape(points);
        drawn_shape.autoClose = true;
        drawn_shape.name = name;
        this.selected_obj.drawing = drawn_shape;
        
        // Clear point buffer
        this.current_points = [];

        // Call any callbacks
        let callback = this.callbacks[this.selected_obj];
        if(callback){callback();}
    }

    draw_on(object, callback=None){
        /* Makes object drawable

        Can accept a callback function which will be called when the drawing on
        the object is done */
        this.drawable_objs.push(object);
        this.callbacks[object] = callback;

        this.__new_line();
        this.scene.sceneGraph.add(this.current_line);
    }

    clear_drawables(){
        this.drawable_objs = [];
        this.callbacks = {};
    }
    
}