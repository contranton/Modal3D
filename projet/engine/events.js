"use strict";

/*
In the following, 'this' is the scene instance bound during scene initialization (scene.js)
*/

////////////////
// Key Events //
////////////////

function onKeyDown(event) {
    // CTRL on : picking mode
    if (event.ctrlKey) {
        this.picker.enabled = true;
        this.disable_controls();
    }

}

function onKeyUp(event) {
    // CTRL off : stop picking
    if (!event.ctrlKey) {
        this.picker.enabled = false;
        this.picker.enableDragAndDrop = false;
        this.picker.selectedObject = null;
        this.picker.visualRepresentation.sphereSelection.visible = false;
        this.picker.visualRepresentation.sphereTranslation.visible = false;
        this.enable_controls();
    }

}

//////////////////
// Mouse Events //
//////////////////

function onMouseDown(event) {

    // Coordonnées du clic de souris
    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x = 2 * xPixel / this.w - 1;
    const y = -2 * yPixel / this.h + 1;

    if (this.picker.enabled === true) {
        this.picker.on_down();
    }

    if (this.drawer.enabled === true) {
        this.drawer.draw_point(x, y, true, false);
        this.drawer.drawing = true;
    }

}

function onMouseUp(event) {
    this.picker.enableDragAndDrop = false;

    this.drawer.drawing = false;
    this.drawer.finish_drawing(this.drawer.view);

}

function onMouseMove(event) {

    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x = 2 * xPixel / this.w - 1;
    const y = -2 * yPixel / this.h + 1;

    // Gestion du drag & drop
    if (this.picker.enableDragAndDrop === true) {
        this.picker.on_move(x, y);
    }

    // Drawing
    if (this.drawer.drawing) {
        this.drawer.draw_point(x, y, false, true);
    }

}