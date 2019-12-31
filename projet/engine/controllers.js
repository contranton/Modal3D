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

        this.view = "";

        this.selected_obj = null;
        this.current_points = [];
        this.current_line = null;

        this.generated_shape = null

        this.drawing = false;
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
                console.log(intersection.object);
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

            // Add the new point
            this.current_points.push(intersection.point.clone());

            // Remove the previously added line -- not segment! We're redrawing the entire line each time
            if (clicked == false && this.current_line.is_ob) {
                this.scene.sceneGraph.remove(this.current_line);
            }

            // Connect the dots!
            const lineGeometry = new THREE.Geometry();
            lineGeometry.vertices = this.current_points;
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            this.current_line = new THREE.Line(lineGeometry, lineMaterial);
            console.log(this.current_line.geometry.vertices.length)
            this.current_line.finished = false;
            this.current_line.is_ob = true;
            this.scene.sceneGraph.add(this.current_line);
        }
    }

    finish_drawing(name="drawing"){
        /* Called upon release of the mouse on the current drawing

        Manages geometry creation.
        */

        if (this.current_points.length == 0) {return;}

        // Close the shape
        this.current_points.push(this.current_points[0]);

        // Map line to the object (?)
        this.selected_obj.updateMatrix();
        const matrice = this.selected_obj.matrix;
        matrice.getInverse(matrice);
        this.current_line.applyMatrix(matrice);

        // Re-add drawn lines
        this.current_line.finished = true;
        this.scene.sceneGraph.remove(this.current_line);
        this.selected_obj.add(this.current_line);
        
        // Generate triangulation and add to scene
        // TODO: ConvexGeometry or ShapeGeometry? How to ensure we can later get shapes conformed to other objects?

        // Flatten 3D drawing to 2D planes
        let points = [];
        if(this.view == "profile"){
            points = this.current_points.map(x => new THREE.Vector2(x[1], x[2]));
        }else if (this.view == "top"){
            points = this.current_points.map(x => new THREE.Vector2(x[0], x[1]));
        }

        // Generate geometry
        const drawn_geom = new THREE.ShapeGeometry(new THREE.Shape(points));
        const drawn_shape = new THREE.Mesh(drawn_geom, MaterialRGB(1, 0, 0));
        drawn_shape.name = name;

        // Add to scene
        if(this.generated_shape !== null){
            this.scene.sceneGraph.remove(this.generated_shape);
        }
        this.generated_shape = drawn_shape;
        this.scene.sceneGraph.add(this.generated_shape);
        
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
    }

    clear_drawables(){
        this.drawable_objs = [];
        this.callbacks = {};
    }
    
}