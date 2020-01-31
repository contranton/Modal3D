"use strict";

/*
In the following, 'this' is the scene instance bound during scene initialization (scene.js)
*/

////////////////
// Key Events //
////////////////

function onKeyDown(event) {
    if (event.ctrlKey) {
        for(var drawer of drawers){
            if(drawer.on_ctrl){
                drawer.enabled = true;
            }
        }
            
    }

}

function onKeyUp(event) {
    if (event.ctrlKey) {
        for(var drawer of drawers){
            if(drawer.on_ctrl && drawer.drawing){
                drawer.enabled = false;
            }
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

    for(var drawer of drawers){
        if(drawer.enabled === true) {
            //this.disable_controls();
            drawer.draw_point(x, y, true, false);
            drawer.clicked = true;
        }
    }

}

function onMouseUp(event) {

    for(var drawer of drawers){
        if(drawer.enabled && drawer.ok2draw){
            //drawer.enabled = false;
            this.enable_controls();
            drawer.clicked = false;
            if(drawer.drawing){
                drawer.drawing = false;
                drawer.finish_drawing(drawer.view);
            }
    
        }
    }
}

function onMouseMove(event) {

    const xPixel = event.clientX;
    const yPixel = event.clientY;

    const x = 2 * xPixel / this.w - 1;
    const y = -2 * yPixel / this.h + 1;

    // Drawing
    for(var drawer of drawers){
        if(drawer.clicked ){
            if(drawer.ok2draw){
                drawer.drawing = true;
                this.disable_controls();
                drawer.clicked = false;
            }else this.enable_controls();
        }
        if (drawer.drawing && drawer.ok2draw && drawer.tick ==0){
            drawer.draw_point(x, y, false, true);
        }
        drawer.tick = (drawer.tick+1) % drawer.period;
    }

}