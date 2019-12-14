"use strict";

/*
In the following, 'this' is the scene instance bound during scene initialization (scene.js)
*/

function onKeyDown(event) {
    const ctrlPressed = event.ctrlKey;

    // Relachement de ctrl : activation du mode picking
    if (ctrlPressed) {
        this.picker.enabled = true;
        this.p_controls.enabled = false;
        this.o_controls.enabled = false;
    }

}

function onKeyUp(event) {

    const ctrlPressed = event.ctrlKey;

    // Relachement de ctrl : fin du picking actuel
    if (ctrlPressed === false) {
        this.picker.enabled = false;
        this.picker.enableDragAndDrop = false;
        this.p_controls.enabled = true;
        this.o_controls.enabled = true;
        this.picker.selectedObject = null;
        this.picker.visualRepresentation.sphereSelection.visible = false;
        this.picker.visualRepresentation.sphereTranslation.visible = false;
    }

}

function onMouseDown(event) {

    // Gestion du picking
    if (this.picker.enabled === true) { // activation si la touche CTRL est enfoncée

        // Coordonnées du clic de souris
        const xPixel = event.clientX;
        const yPixel = event.clientY;

        const x = 2 * xPixel / this.w - 1;
        const y = -2 * yPixel / this.h + 1;

        // Calcul d'un rayon passant par le point (x,y)
        //  c.a.d la direction formé par les points p de l'espace tels que leurs projections sur l'écran par la caméra courante soit (x,y).
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

        // Calcul des interections entre le rayon et les objets passés en paramètres
        const intersects = this.raycaster.intersectObjects(this.picker.selectableObjects);

        const nbrIntersection = intersects.length;
        if (nbrIntersection > 0) {

            // Les intersections sont classés par distance le long du rayon. On ne considère que la première.
            const intersection = intersects[0];

            // Sauvegarde des données du picking
            this.picker.selectedObject = intersection.object; // objet selectionné
            this.picker.selectedPlane.p = intersection.point.clone(); // coordonnées du point d'intersection 3D
            this.picker.selectedPlane.n = this.camera.getWorldDirection().clone(); // normale du plan de la caméra

            // Affichage de la selection
            const sphereSelection = this.picker.visualRepresentation.sphereSelection;
            sphereSelection.position.copy(this.picker.selectedPlane.p);
            sphereSelection.visible = true;
            this.picker.enableDragAndDrop = true;

        }
    }

}

function onMouseUp(event) {
    this.picker.enableDragAndDrop = false;
}

function onMouseMove(event) {

    // Gestion du drag & drop
    if (this.picker.enableDragAndDrop === true) {

        // Coordonnées de la position de la souris
        const xPixel = event.clientX;
        const yPixel = event.clientY;

        const x = 2 * xPixel / this.w - 1;
        const y = -2 * yPixel / this.h + 1;

        // Projection inverse passant du point 2D sur l'écran à un point 3D
        const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/);
        selectedPoint.unproject(this.camera);

        // Direction du rayon passant par le point selectionné
        const p0 = this.camera.position;
        const d = selectedPoint.clone().sub(p0);

        // Intersection entre le rayon 3D et le plan de la camera
        const p = this.picker.selectedPlane.p;
        const n = this.picker.selectedPlane.n.subScalar(0.25 / 2);
        // tI = <p-p0,n> / <d,n>
        const tI = ((p.clone().sub(p0)).dot(n)) / (d.dot(n));
        // pI = p0 + tI d
        const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection


        // Translation à appliquer
        const translation = pI.clone().sub(p);

        const obj = this.picker.selectedObject;
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

        this.picker.selectedPlane.p.add(translation);

        this.picker.visualRepresentation.sphereTranslation.visible = true;
        this.picker.visualRepresentation.sphereTranslation.position.copy(p);


    }

}