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
        const side = this.scene.sceneGraph.getObjectByName("YZ").drawing;
        const top = this.scene.sceneGraph.getObjectByName("ZX").drawing;

        if(side !== null && top !== null){
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

        s.drawer.draw_on(s.yz, this.update_gen_button.bind(this), true);
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

        s.drawer.draw_on(s.zx, this.update_gen_button.bind(this), true);
        s.drawer.enabled = true;
        s.disable_controls();
    }

    generate(){

        // Extrude each plane
        const prf = this.scene.sceneGraph.getObjectByName("YZ").drawing;
        const top = this.scene.sceneGraph.getObjectByName("ZX").drawing;

        const depth = 2;

        const opts = {
            steps: 2,
            depth: depth,
            bevelEnabled: false
        };

        const prf_geom = new THREE.ExtrudeGeometry(prf, opts);
        const top_geom = new THREE.ExtrudeGeometry(top, opts);

        const prf_obj = new THREE.Mesh(prf_geom, MaterialRGB(1, 0, 0, 0.2));
        const top_obj = new THREE.Mesh(top_geom, MaterialRGB(0, 1, 0, 0.2));
        // const prf_wire = new THREE.WireframeHelper(prf_obj, 0x0000ff);
        // const top_wire = new THREE.WireframeHelper(top_obj, 0x0000ff); 

        prf_obj.translateX(-depth/2);
        top_obj.translateY(depth/2);
        // prf_wire.translateX(-depth/2);
        // top_wire.translateY(depth/2);

        prf_obj.rotateY(Math.PI/2);
        top_obj.rotateX(Math.PI/2);
        // prf_wire.rotateY(Math.PI/2);
        // top_wire.rotateX(Math.PI/2);

        //this.scene.sceneGraph.add(prf_obj);
        //this.scene.sceneGraph.add(top_obj);     
        // this.scene.sceneGraph.add(prf_wire);
        // this.scene.sceneGraph.add(top_wire);

        // Generate CSG geometry for each extruded plane and intersect them

        //const inter_geom = new ThreeBSP(prf_geom).intersect(new ThreeBSP(top_geom)).toGeometry();
        const inter = threecsg.intersect(prf_obj, top_obj, MaterialRGB(0, 0, 1));
        inter.name = "Body";
        const inter_wire = new THREE.WireframeHelper(inter, 0x000000);

        this.scene.sceneGraph.add(inter);
        this.scene.sceneGraph.add(inter_wire);

        // Smooth the result using mean-curvature-flow
    }

    on_return(){
        this.scene.yz.visible = false;
        this.scene.zx.visible = false;
        this.scene.drawer.view = "";
        this.scene.drawer.enabled = false;

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

        this.top_menu = document.createElement("div");
        this.top_menu.className = "group-top";
        

        // Pause/play animation button
        const button_anim = new Button("Toggle animation", this.toggle_anim.bind(this));
        button_anim.classList.add("group-top", "with-icon", "play-pause");
        const play_svg  = document.createElement("img")
        play_svg.id = "play";
        play_svg.src= "textures/icons/play.svg";
        play_svg.classList.add("hidden");
        const pause_svg = document.createElement("img")
        pause_svg.id = "pause";
        pause_svg.src= "textures/icons/pause.svg";
        button_anim.appendChild(play_svg);
        button_anim.appendChild(pause_svg);
        this.top_menu.appendChild(button_anim);

        // Change Visualization button
        const button_bg = new Button("Toggle BG", this.toggle_bg.bind(this));
        button_bg.classList.add("group-top", "with-icon", "bg");
        const bg_on_png  = document.createElement("img")
        bg_on_png.id = "bg_on";
        bg_on_png.src= "textures/icons/bg_on.png";
        const bg_off_png = document.createElement("img")
        bg_off_png.id = "bg_off";
        bg_off_png.src= "textures/icons/bg_off.png";
        bg_off_png.hidden = true;
        button_bg.appendChild(bg_on_png);
        button_bg.appendChild(bg_off_png);
        this.top_menu.appendChild(button_bg);

        this.div_root.appendChild(this.main_menu);
        this.div_root.appendChild(this.top_menu);

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

    toggle_bg(){
        console.log("togglin");
        const bg_on_png = document.getElementById("bg_on");
        const bg_off_png = document.getElementById("bg_off");

        if(this.scene.background_on){
            console.log("off")
            this.scene.materials.METAL.metalness = 0;
            this.scene.materials.METAL.roughness = 0.5;
            this.scene.sceneGraph.background = null;
            this.scene.background_on = false;

            bg_on_png.hidden = false;
            bg_off_png.hidden = true;
        }else{
            console.log("on");
            this.scene.materials.METAL.metalness = 1;
            this.scene.materials.METAL.roughness = 0.01;
            this.scene.sceneGraph.background = this.scene.textureCube;
            this.scene.background_on = true;

            bg_on_png.hidden = true;
            bg_off_png.hidden = false;
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
