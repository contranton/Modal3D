"use strict";

/*
Remember to always bind this when passing as a callback argument!
*/

// These classes must implement on_return
class proc_MakeBody{
    constructor(scene){
        /**@type {Scene} */
        this.scene = scene;

        this.profile();
    }

    update_gen_button(){
        console.log("HI :3")
        const side = this.scene.sceneGraph.getObjectByName("YZ").getObjectByProperty('finished', true)
        const top = this.scene.sceneGraph.getObjectByName("ZX").getObjectByProperty('finished', true)

        if(!(side === null && top === null)){
            document.getElementById("gen").disabled = false;
        }
    }

    profile(){
        let s = this.scene;
        s.drawer.clear_drawables();
        s.drawer.view = "profile";

        s.orthographic_camera();
        s.change_perspective(Vector3(1, 0, 0), Vector3(0, 0, 0));

        s.yz.visible = true;
        s.zx.visible = false;

        s.drawer.draw_on(s.yz, this.update_gen_button.bind(this));
        s.drawer.enabled = true;
        s.disable_controls();
    }

    top(){
        let s = this.scene;
        s.drawer.clear_drawables();
        s.drawer.view = "top";

        s.orthographic_camera();
        s.change_perspective(Vector3(0, 1, 0), Vector3(0, 0, 0));

        s.yz.visible = false;
        s.zx.visible = true;

        s.drawer.draw_on(s.zx, this.update_gen_button.bind(this));
        s.drawer.enabled = true;
        s.disable_controls();
    }

    generate(){
        // Generate CSG geometry for each extruded plane

        console.log("Generating GEOM")
        // Calculate their intersection

        // Smooth the result using mean-curvature-flow
    }

    on_return(){
        this.scene.yz.visible = false;
        this.scene.zx.visible = false;
        this.scene.drawer.view = "";

        this.scene.enable_controls();
        this.scene.perspective_camera();
        this.scene.change_perspective(Vector3(1, 1.5, 3), Vector3(0, 0, 0,))
        console.log("We've called on_return from MakeBody");
    }
}

class proc_MakeExtrusion{

}

class proc_MakeDetail{

}

class Modeler{
    constructor(scene){
        this.scene = scene;
        this.main_menu = null;

        this.div_root = document.getElementById("AffichageScene3D");

        this.init_UI();
    }

    init_UI(){

        // Main Menu and its Buttons
        this.main_menu = document.createElement("div");
        this.main_menu.className = "group-left";
        this.main_buttons = document.createElement("div"); // Button group
        this.main_buttons.className = "btn-group";
        this.main_buttons.appendChild(new Button("Make Main Body", this.menu_MakeBody.bind(this)));
        //this.main_buttons.appendChild(new Button("New Extrusion", this.menu_MakeExtrusion.bind(this)));
        //this.main_buttons.appendChild(new Button("New Detail", this.menu_MakeDetail.bind(this)));
        //this.main_buttons.appendChild(new Button("Export .obj", this.menu_Export.bind(this)));
        this.main_menu.appendChild(this.main_buttons);

        // Pause/play animation button
        const button_anim = new Button("Toggle animation", this.toggle_anim.bind(this));
        button_anim.classList.add("with-icon", "play-pause");
        const play_svg  = document.createElement("img")
        play_svg.id = "play";
        play_svg.src= "textures/icons/play.svg";
        play_svg.classList.add("hidden");
        const pause_svg = document.createElement("img")
        pause_svg.id = "pause";
        pause_svg.src= "textures/icons/pause.svg";
        button_anim.appendChild(play_svg);
        button_anim.appendChild(pause_svg);
        this.div_root.appendChild(button_anim);

        this.div_root.appendChild(this.main_menu);

    }

    _toggle_main_menu(){
        this.main_menu.classList.toggle("hidden");
    }

    // Submenu must be a class with a method on_return if do_return is to be true
    _new_menu(submenu, do_return=false){
        const div = document.createElement("div");
        div.className = "group-left";
        div.classList.add("btn-group")
        if(do_return){
            div.appendChild(new Button("Return", function(){
                submenu.on_return();
                this._return(div);
            }.bind(this)));
        }
        return div;
    }

    _return(div){
        /*  Returns to the main menu */
        this.on_return();
        div.hidden = true;
        this.div_root.removeChild(div);
        this._toggle_main_menu();
    }

    on_return(){
        console.log("wrong return!");
        return;
    }

    //////////////////////
    // Button callbacks //
    //////////////////////

    toggle_anim(){
        const play_svg = document.getElementById("play");
        const pause_svg = document.getElementById("pause");

        if(this.scene.do_animate){
            this.scene.do_animate = false;

            play_svg.classList.remove("hidden");
            pause_svg.classList.add("hidden");
        }else{
            this.scene.do_animate = true;
            this.scene.animationLoop();

            play_svg.classList.add("hidden");
            pause_svg.classList.remove("hidden");
        }
    }

    menu_MakeBody(){
        this._toggle_main_menu();

        console.log("Making the body");

        const body_modeler = new proc_MakeBody(this.scene);
        const div_makeBody = this._new_menu(body_modeler, true);
        div_makeBody.appendChild(new Button("Profile View", body_modeler.profile.bind(body_modeler)));
        div_makeBody.appendChild(new Button("Top View", body_modeler.top.bind(body_modeler)));
        div_makeBody.appendChild(new Button("Generate", body_modeler.generate.bind(body_modeler),
                                           {id: "gen", disabled: true}));
        this.div_root.appendChild(div_makeBody);
    }
    
    menu_MakeExtrusion(){
    }

    menu_MakeDetail(){

    }

    menu_Export(){

    }

}

class Button{
    constructor(text, callback, options){
        const button = document.createElement("button");
        button.onclick = callback;
        button.innerText = text;

        for(let opt in options){
            button.setAttribute(opt, options[opt]);
        }

        return button;

    }
}
