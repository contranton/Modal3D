"use strict";

/*
Remember to always bind this when passing as a callback argument!
*/

// These classes must implement on_return
class MakeBody{
    constructor(scene){
        /**@type {Scene} */
        this.scene = scene;
        this.profile();
    }

    profile(){
        this.scene.orthographic_camera();
        this.scene.change_perspective(Vector3(1, 0, 0), Vector3(0, 0, 0));
    }

    top(){
        this.scene.orthographic_camera();
        this.scene.change_perspective(Vector3(0, 1, 0), Vector3(0, 0, 0));
    }

    generate(){
        alert("MAKING THE 3D THINGY");
    }

    on_return(){
        this.scene.perspective_camera();
        this.scene.change_perspective(Vector3(1, 1.5, 3), Vector3(0, 0, 0,))
        console.log("We've called on_return from MakeBody");
    }
}

class MakeExtrusion{

}

class MakeDetail{

}

class Modeler{
    constructor(scene){
        this.scene = scene;
        this.main_menu = null;

        this.div_root = document.getElementById("AffichageScene3D");

        this.init_UI();
    }

    init_UI(){
        this.main_menu = document.createElement("div");
        this.main_menu.className = "btn-group";
        this.main_menu.appendChild(new Button("Make Main Body", this.menu_MakeBody.bind(this)));
        this.main_menu.appendChild(new Button("New Extrusion", this.menu_MakeExtrusion.bind(this)));
        this.main_menu.appendChild(new Button("New Detail", this.menu_MakeDetail.bind(this)));
        this.main_menu.appendChild(new Button("Export .obj", this.menu_Export.bind(this)));

        this.div_root.appendChild(this.main_menu);
    }

    _toggle_main_menu(){
        this.main_menu.hidden = !this.main_menu.hidden;
    }

    // Submenu must be a class with a method on_return if do_return is to be true
    _new_menu(submenu, do_return=false){
        const div = document.createElement("div");
        div.className = "btn-group";
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

    menu_MakeBody(){
        this._toggle_main_menu();

        console.log("Making the body");

        const body_modeler = new MakeBody(this.scene);
        const div_makeBody = this._new_menu(body_modeler, true);
        div_makeBody.appendChild(new Button("Profile View", body_modeler.profile.bind(body_modeler)));
        div_makeBody.appendChild(new Button("Top View", body_modeler.top.bind(body_modeler)));
        div_makeBody.appendChild(new Button("Generate", body_modeler.generate.bind(body_modeler)));
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
    constructor(text, callback){
        const button = document.createElement("button");
        button.onclick = callback;
        button.innerText = text;

        return button;
    }
}
