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
        if(this.drawer.on_ctrl){
            this.drawer.enabled = true;
        }
    }

}

function onKeyUp(event) {
    // CTRL off : stop picking
    if (event.ctrlKey) {
        if(this.drawer.on_ctrl){
            this.drawer.enabled = false;
        }
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
        //this.disable_controls();
        //this.drawer.draw_point(x, y, true, false);
        this.drawer.clicked = true;
    }

}

function onMouseUp(event) {
    this.picker.enableDragAndDrop = false;

    if(this.drawer.enabled){
        //this.drawer.enabled = false;
        this.enable_controls();
        this.drawer.clicked = false;
        if(this.drawer.drawing){
            this.drawer.drawing = false;
            this.drawer.finish_drawing(this.drawer.view);
        }
    }
}

var tick = 0;
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
    if(this.drawer.clicked){
        this.drawer.drawing = true;
        this.disable_controls();
        this.drawer.clicked = false;
    }
    if (this.drawer.drawing && tick ==0){
        this.drawer.draw_point(x, y, false, true);
    }
    tick = (tick+1) % this.drawer.period;

}
