"use strict";

var DEBUG = false;

/*
Remember to always bind this when passing as a callback argument!
*/

// These classes must implement on_return
class proc_MakeBody{
    constructor(scene){
        /**@type {Scene} */
        this.scene = scene;
        if(this.scene.body !== null){
            this.scene.sceneGraph.remove(this.scene.body);
            this.scene.body = null;
        }

        this.profile();
    }

    update_gen_button(){
        console.log("HI :3")
        const side = this.scene.sceneGraph.getObjectByName("YZ").drawing;
        const top = this.scene.sceneGraph.getObjectByName("ZX").drawing;

        if(side !== null && top !== null){
            document.getElementById("gen").disabled = false;
        }

        // TODO: Show the extrusions here
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
        s.drawer.flatten_along("x");
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

        s.drawer.draw_on(
            s.zx,                               // Plane 
            this.update_gen_button.bind(this),  // Callback
            [-1, 1, 1]);                       // Symmetry (x is flipped)
        s.drawer.flatten_along("y");
        s.drawer.enabled = true;
        s.disable_controls();
    }

    generate(){

        // Extrude each plane
        const prf = this.scene.sceneGraph.getObjectByName("YZ").drawing;
        const top = this.scene.sceneGraph.getObjectByName("ZX").drawing;

        // Get bounding box to normalize drawing sizes
        var top_dat = {
            min_x: Math.min(...top.getPoints().map((_)=>_.x)),
            max_x: Math.max(...top.getPoints().map((_)=>_.x)),
            min_y: Math.min(...top.getPoints().map((_)=>_.y)),
            max_y: Math.max(...top.getPoints().map((_)=>_.y))
        }
        var prf_dat = {
            min_x: Math.min(...prf.getPoints().map((_)=>_.x)),
            max_x: Math.max(...prf.getPoints().map((_)=>_.x)),
            min_y: Math.min(...prf.getPoints().map((_)=>_.y)),
            max_y: Math.max(...prf.getPoints().map((_)=>_.y))
        }
        var bounding = {
            profile: {width: prf_dat.max_x - prf_dat.min_x,
                        height: prf_dat.max_y - prf_dat.min_y},
            top: {width: top_dat.max_x - top_dat.min_x,
                    height: top_dat.max_y - top_dat.min_y}
        }
        var width_ratio  = bounding.top.width  / bounding.profile.width;
        var height_ratio = bounding.top.height / bounding.profile.height;

        console.log(bounding);

        // Normalize top to profile's dimensions
        for(let crv of top.curves){
            for(let v of [crv.v1, crv.v2]){
                v.x -= top_dat.min_x;
                v.x /= width_ratio;

                v.y -= top_dat.min_y;
                v.y /= height_ratio;
            }
        }
        for(let crv of prf.curves){
            for(let v of [crv.v1, crv.v2]){
                v.x -= prf_dat.min_x;
                v.y -= prf_dat.min_y;
            }
        }

        
        var depth = 2;
        var opts = {
            steps: 2,
            depth: depth,
            bevelEnabled: false
        };


        // Generate geometry
        const prf_geom = new THREE.ExtrudeGeometry(prf, opts);
        const top_geom = new THREE.ExtrudeGeometry(top, opts);
        
        const prf_obj = new THREE.Mesh(prf_geom, MaterialRGB(1, 0, 0, 0.2));
        const top_obj = new THREE.Mesh(top_geom, MaterialRGB(0, 1, 0, 0.2));
        // const prf_wire = new THREE.WireframeHelper(prf_obj, 0x0000ff);
        // const top_wire = new THREE.WireframeHelper(top_obj, 0x0000ff); 
        
        //top_obj.translateX(-prf_dat.min_x);
        prf_obj.rotateX(Math.PI/2);
        prf_obj.translateX(-depth/2);
        top_obj.translateY(depth/2);
        // prf_wire.translateX(-depth/2);
        // top_wire.translateY(depth/2);

        prf_obj.rotateY(Math.PI/2);
        //prf_obj.rotateX(Math.PI/2);
        top_obj.rotateX(Math.PI/2);
        // prf_wire.rotateY(Math.PI/2);
        // top_wire.rotateX(Math.PI/2);

        if(DEBUG){
            this.scene.sceneGraph.add(prf_obj);
            this.scene.sceneGraph.add(top_obj);     
        }


        // Intersect the geometries
        const inter = threecsg.intersect(prf_obj, top_obj, this.scene.materials.METAL);
        inter.geometry.computeVertexNormals();
        inter.geometry.computeFaceNormals();
        inter.name = "Body";
        inter.position.multiplyScalar(0);

        this.scene.body = inter;
        this.scene.ship_elements.push(inter);

        this.scene.sceneGraph.add(inter);
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
    constructor(scene){
        this.scene = scene;
        this.drawing = null;

        this.scene.drawer.draw_on(this.scene.body, this.extrude_drawing.bind(this));
        this.scene.drawer.flatten_along("x");
        this.scene.drawer.enabled = true;
    }

    extrude_drawing(){
        this.drawing = this.scene.body.drawing;
        var g1 = new THREE.ExtrudeGeometry(this.drawing, {steps:2, depth:2, bevelEnabled:false});

        var w = new THREE.Mesh(g1, this.scene.materials.METAL);

        w.rotateY(Math.PI/2); w.rotateZ(Math.PI/2);
        w.translateZ(-1);

        this.scene.sceneGraph.add(w);
    }

    on_return(){
        this.scene.drawer.enabled = false;
    }

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

        // Main Menu
        this.main_menu = document.createElement("div");
        this.main_menu.className = "group-left";
        this.main_buttons = document.createElement("div"); // Button group
        this.main_buttons.className = "btn-group";

        // Main menu buttons
        this.btn_body = new Button("Make Main Body", this.menu_MakeBody.bind(this));
        this.main_buttons.appendChild(this.btn_body);
        this.btn_extr = new Button("New Extrusion", this.menu_MakeExtrusion.bind(this))
        this.btn_extr.disabled = true;
        this.main_buttons.appendChild(this.btn_extr);
        this.main_buttons.appendChild(new Button("New Detail", this.menu_MakeDetail.bind(this)));
        //this.main_buttons.appendChild(new Button("Export .obj", this.menu_Export.bind(this)));
        this.main_menu.appendChild(this.main_buttons);


        // Top Menu
        this.top_menu = document.createElement("div");
        this.top_menu.className = "group-top";        

        // Pause/play animation button
        const button_anim = new Button("Toggle animation", this.toggle_anim.bind(this));
        button_anim.classList.add("group-top", "with-icon", "play-pause");
        const play_png  = document.createElement("img")
        play_png.id = "play";
        play_png.src= "textures/icons/play.png";
        play_png.classList.add("hidden");
        const pause_png = document.createElement("img")
        pause_png.id = "pause";
        pause_png.src= "textures/icons/pause.png";
        button_anim.appendChild(play_png);
        button_anim.appendChild(pause_png);
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
        if(this.scene.body !== null){
            this.btn_extr.disabled = false;
        }
        return;
    }

    //////////////////////
    // Button callbacks //
    //////////////////////

    toggle_anim(){
        const play_png = document.getElementById("play");
        const pause_png = document.getElementById("pause");

        if(this.scene.do_animate){
            this.scene.do_animate = false;

            play_png.classList.remove("hidden");
            pause_png.classList.add("hidden");
        }else{
            this.scene.do_animate = true;
            this.scene.animationLoop();

            play_png.classList.add("hidden");
            pause_png.classList.remove("hidden");
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
        this._toggle_main_menu();

        const extruder = new proc_MakeExtrusion(this.scene);
        const div_extrude = this._new_menu(extruder, true);
        this.div_root.appendChild(div_extrude);
    }

    menu_MakeDetail(){
        var target_pos = new THREE.Vector3();
        var target_normal = new THREE.Vector3();

        var mesh_clone = scene.body.clone();
        mesh_clone.geometry = new THREE.BufferGeometry().fromGeometry(this.scene.body.geometry)
        var sampler = new MeshSurfaceSampler(mesh_clone);
        sampler.setWeightAttribute('random');
        sampler.build();

        var scale = 0.075;

        for(var i = 0; i < 1000; i++){
            sampler.sample(target_pos, target_normal);
            var g = primitive.Cube(target_pos, 1);
            g.scale(scale*Math.random(), scale*Math.random(), scale/5);
            var m = new THREE.Mesh(g, this.scene.materials.METAL);
            m.lookAt(target_normal);
            m.position.copy(target_pos);
            this.scene.sceneGraph.add(m);
        }
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
