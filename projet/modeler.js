"use strict";

/*
Remember to always bind this when passing as a callback argument!
*/

class Modeler{
    constructor(scene){
        this.scene = scene;
        this.main_menu = null;

        this.root_div = document.getElementById("AffichageScene3D");

        this.init_UI();
    }

    init_UI(){
        this.main_menu = document.createElement("div");
        this.main_menu.className = "btn-group";
        this.main_menu.appendChild(new Button("Make body", this.make_body.bind(this)));
        this.main_menu.appendChild(new Button("Make 2", this.make_body.bind(this)));
        this.main_menu.appendChild(new Button("Make 3", this.make_body.bind(this)));

        this.root_div.appendChild(this.main_menu);
    }

    make_body(){
        console.log("Making the body");

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