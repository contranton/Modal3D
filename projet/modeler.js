"use strict";

var DEBUG = false;
var _extrudes = null; // debug data

/*
Remember to always bind this when passing as a callback argument!
*/

// These classes must implement on_return
class proc_MakeBody{
    constructor(scene, after){
        /**@type {Scene} */
        this.scene = scene;
        if(this.scene.body !== null){
            this.scene.sceneGraph.remove(this.scene.body);
            this.scene.body = null;
        }

        this.after = after;
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
        
        s.drawer.draw_on(s.yz, this.top.bind(this));
        s.drawer.flatten_along("x");
        s.drawer.enabled = true;
        s.disable_controls();
    }

    top(){
        document.getElementById("txt").innerText = "Dessinez la vue du haut du corps";

        let s = this.scene;
        s.drawer.clear_drawables();
        s.drawer.view = "top";

        s.orthographic_camera();
        s.change_perspective(Vector3(0, 1, 0), Vector3(0, 0, 0));

        s.yz.visible = false;
        s.zx.visible = true;

        // Show symmetry line
        var geom = new THREE.Geometry();
        geom.vertices.push(new THREE.Vector3(0, 0, -3), new THREE.Vector3(0, 0, 3));
        this.line = new THREE.Line(geom,
            new THREE.LineDashedMaterial({color: 0x000000, dashSize: 1, gapSize: 0.1})
        )

        s.sceneGraph.add(this.line);

        s.drawer.draw_on(
            s.zx,                               // Plane 
            this.generate.bind(this),           // Callback
            [-1, 1, 1]);                        // Symmetry (x is flipped)
        s.drawer.flatten_along("y");
        s.drawer.enabled = true;
        s.disable_controls();
    }

    generate(){
        document.getElementById("txt").innerText = "Générant...";

        this.scene.sceneGraph.remove(this.line);

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
        // Squishes top to fit profile
        for(let crv of top.curves){
            for(let v of [crv.v1, crv.v2]){
                //v.x -= top_dat.min_x;
                //v.x /= width_ratio;

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
        /* for(let crv of prf.curves){
            for(let v of [crv.v1, crv.v2]){
                v.x -= prf_dat.min_x;
                v.x *= width_ratio;

                //v.y -= prf_dat.min_y;
                //v.y /= height_ratio;
            }
        }
        for(let crv of top.curves){
            for(let v of [crv.v1, crv.v2]){
                v.x -= top_dat.min_x;
                v.y -= top_dat.min_y;
            }
        } */

        
        var depth = 2;
        var opts = {
            steps: 2,
            depth: 2*depth,
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
        prf_obj.rotateY(Math.PI/2);
        
        top_obj.translateY(depth/2);
        top_obj.rotateX(Math.PI/2);

        _extrudes = [prf_obj, top_obj];

        if(false){
            this.scene.sceneGraph.add(prf_obj);
            this.scene.sceneGraph.add(top_obj);     
        }


        // Intersect the geometries
        const inter = threecsg.intersect(prf_obj, top_obj, this.scene.materials.METAL);
        inter.geometry.computeVertexNormals();
        inter.geometry.computeFaceNormals();
        inter.name = "Body";
        inter.position.multiplyScalar(0);

        inter.geometry.normalize();
        //inter.geometry.scale(1, 1, 1);

        this.scene.body = inter;
        this.scene.ship_elements.push(inter);

        this.scene.sceneGraph.add(inter);

        this.on_return();
    }

    on_return(){
        document.getElementById("txt").innerText = "";

        this.scene.yz.visible = false;
        this.scene.zx.visible = false;
        this.scene.drawer.view = "";
        this.scene.drawer.enabled = false;

        this.scene.enable_controls();
        this.scene.perspective_camera();
        this.scene.change_perspective(Vector3(1, 1.5, 3), Vector3(0, 0, 0,))
        console.log("We've called on_return from MakeBody");

        // this.scene. sceneGraph.rotation.y = -Math.PI/2;
        this.after();
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

    add_details(object){
        var g = null;
        var details = new THREE.Object3D();
        for(var i = 0; i < 500; i++){
            this.sampler.sample(this.target_pos, this.target_normal);
            g = primitive.Cube(this.target_pos, 1);
            g.scale(this.scale*Math.random(), this.scale*Math.random(), this.scale/8);
            var m = new THREE.Mesh(g, scene.materials.METAL);
            m.lookAt(this.target_normal.multiplyScalar(-1));
            m.position.copy(this.target_pos);
            details.add(m);
        }
        details.name = "details";
        object.add(details);
    }

    add_lights(object, size_mult=1){
        var lights = new THREE.Object3D();
        var g = null;
        for(var i = 0; i < 10; i++){
            this.sampler.sample(this.target_pos, this.target_normal);
            var col = Math.random() < 0.5 ? 0xee1111 : 0xeeee11; //#ee1111 #eeee11
            g = new THREE.PointLight(col, 0.8, 0.5*size_mult, 0.5);
            g.castShadow = false;
            var rad = 0.003
            g.add(new THREE.Mesh(primitive.Sphere(new THREE.Vector3(0, 0, 0), rad), new MaterialRGB(col)))
            g.position.copy(this.target_pos);
            g.position.addScaledVector(this.target_normal, this.scale);
            g.children[0].position.addScaledVector(this.target_normal, -this.scale + rad*2);
            lights.add(g);
        }
        lights.name = "lights";
        object.add(lights);
    }

    constructor(scene, after, run=true){
        this.target_pos = new THREE.Vector3();
        this.target_normal = new THREE.Vector3();

        this.scale = 0.075;

        var mesh_clone = scene.body.clone();
        mesh_clone.geometry = new THREE.BufferGeometry().fromGeometry(scene.body.geometry)
        this.sampler = new MeshSurfaceSampler(mesh_clone);
        this.sampler.setWeightAttribute('random');
        this.sampler.build();

        if(run){
            // Add scifi details
            this.add_details(scene.body);

            // Add lights
            this.add_lights(scene.body);

            after();
        }
    }
}

class Modeler{
    constructor(scene){
        this.scene = scene;


        this.boids_possible = false; // If there's a shape to instance
        this.boids = false;         // If selected boids

        this.wings_done = false;

        this.div_root = document.getElementById("AffichageScene3D");
        this.init_UI();

        // this.debug_drawings();
        // return;
        
        var DEBUG = false;
        if(DEBUG) this.pre_made_obj()
        else this.make_body();

    }

    init_UI(){

        // Top Menu
        this.top_menu = document.createElement("div");
        this.top_menu.className = "group-top";        

        // Pause/play animation button
        // TODO: Make this the toggle animation button
        this.button_anim = new Button("Toggle animation", this.toggle_anim.bind(this));
        this.button_anim.classList.add("group-top", "with-icon", "play-pause");
        const play_png  = document.createElement("img")
        play_png.id = "play";
        play_png.src= "textures/icons/play.png";
        play_png.classList.add("hidden");
        const pause_png = document.createElement("img")
        pause_png.id = "pause";
        pause_png.src= "textures/icons/pause.png";
        this.button_anim.appendChild(play_png);
        this.button_anim.appendChild(pause_png);
        this.top_menu.appendChild(this.button_anim);
        this.button_anim.hidden = true;

        // Boids animation button
        // TODO: Make this the toggle animation button
        this.button_boids = new Button("Toggle boids", this.toggle_boids.bind(this));
        this.button_boids.classList.add("group-top", "with-icon");
        const boid_png  = document.createElement("img")
        boid_png.src= "textures/icons/war.png";
        this.button_boids.appendChild(boid_png);
        this.top_menu.appendChild(this.button_boids);
        this.button_boids.disabled = true;

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

        // Download button
        this.download = new Button("Download", this.download.bind(this));
        this.download.classList.add("group-top", "with-icon");
        const dl_png  = document.createElement("img")
        dl_png.src= "textures/icons/save.png";
        this.download.appendChild(dl_png);
        this.top_menu.appendChild(this.download);
        this.download.disabled = true;


        this.div_root.appendChild(this.top_menu);

    }

    pre_made_obj(){
        document.getElementById("txt").hidden = true;
        var geom = new primitive.Cone(Vector3(0, 0, 0), Vector3(0, 0, 1), 0.2);
        var mesh = new THREE.Mesh(geom, MaterialRGB(1, 0, 0));
        mesh.lights = {visible: false};
        mesh.details = {visible: false};
        this.scene.body = mesh;
        this.scene.sceneGraph.add(mesh);
        this.activate_editing();
    }

    debug_drawings(){
        document.getElementById("txt").hidden = true;

        this.scene.xy.visible = true;
        this.scene.drawer.enabled = true;
        this.scene.drawer.period = 3;
        this.scene.drawer.draw_on(this.scene.xy, this.__debug.bind(this));
        this.scene.change_perspective(Vector3(0, 0, 1), Vector3(0, 0, 0));
        this.scene.drawer.flatten_along("z");
    }

    __debug(){
        var d = this.scene.xy.drawing;

        var new_sign = x=>x>=0;

        var max_dist = Math.max(...d.curves.map((x)=>d.currentPoint.distanceTo(x.v1)));
        var last_dist = d.currentPoint.distanceTo(d.curves[0].v1);

        // Old code for debugging curve recognition
        /* var _cross = d.curves.map(x=>x.v1.cross(x.v2));
        var _cross2 = d.curves.map(x=>x.v1)          .map((x,i,s)=>(i<s.length-1)?(x.cross(s[i+1])):0)
        var sense_changes = diff(_cross.map(new_sign));
        var sense_changes2 = diff(_cross2.map(new_sign));
        console.log("-----------------");
        console.log({
            "Curvature changes: ": sense_changes.filter(x=>x),
            //console.log("Curvature changes V2: ", sense_changes_2.map(Math.sign));
            "d_max - d_e2e: ": delta_dist,
            "_cross: ": _cross,
            "_cross2: ": _cross2,
            "_cross3: ": _cross3,
            "sense changes": sense_changes
        });
        console.log("v2 x v1:\t\t\t\t", sense_changes .filter(x=>x).length);
        console.log("v_(i+1) x v_i:\t\t\t ", sense_changes2.filter(x=>x).length);*/
        
        // THe third version has won! Cross product between successive difference vectors
        // [v2_(i+1) - v1_(i+1)] x [v2_(i) - v1_(i)]
        var _cross3 = d.curves
        .map(x=>x.v2.sub(x.v1))
        .map((x,i,s)=>(i<s.length-1)?(x.cross(s[i+1])):0)
        .filter((x,i,s)=>i > 2 && i < s.length-2)
        var sense_changes3 = diff(_cross3.map(new_sign));
        console.log("(v2-v1)_(i+1) x (v2-v1)_i):\t", _cross3);
    
        var delta_dist = max_dist - last_dist;
        var delta_curv = sense_changes3.filter((x)=>x);

        console.log(delta_curv, delta_dist)
        switch(delta_curv.length){
            case 0: // Single-orientation curve
                switch(delta_dist > 0){
                    case true: // Looped curve
                        console.log("Loop"); break;
                    case false: // Open/straight curve
                        console.log("Open"); break;
                }
                break;
            case 1: // Once turned-around curve
                console.log("Propeller"); break;
        }


        this.debug_drawings();
    }

    make_body(){
        new proc_MakeBody(this.scene,
            this.make_detail.bind(this));
    }
    
    make_detail(){
        // this.toggle_bg();
        // this.toggle_bg();
        new proc_MakeDetail(this.scene,
            this.activate_editing.bind(this));
    }

    activate_editing(){
        //alert("You can now edit E X P R E S S I V E L Y");
        this.scene.drawer.draw_on(this.scene.body, this.parse_drawing.bind(this));
        this.scene.drawer.on_ctrl = true;
        this.scene.drawer.flatten_along("x");

        this.boids_possible = true;
        this.button_boids.disabled = false;

        this.download.disabled = false;

        this.button_anim.hidden = false;

    }

    parse_drawing(){
        let drawing = this.scene.drawer.generated_shape;

        if(this.wings_done){ // Parse all other details
            //loop, propeller, etc;
        }else{
            if(this.scene.drawer.selected_obj.name == "ZAP"){ // if drew starting from the green thing
                console.log("WOOOO");
            }else{ // if drawing on body itself
                drawing.curves.push(drawing.curves[0].clone());
                drawing.curves.push(drawing.curves[0].clone());
        
                //extrusion for highlighting
                let geom = new THREE.ExtrudeGeometry(drawing, {steps:1, depth:2 , bevelEnabled:false});
                geom.computeFaceNormals();
                this.highlight_mesh = new THREE.Mesh(geom, MaterialRGB(0, 1, 0, 0.1));
                this.highlight_mesh.rotateX(Math.PI/2);
                this.highlight_mesh.translateX(-1);
                this.highlight_mesh.rotateY(Math.PI/2);
                var tmp = new DrawController(this.scene);
                tmp.draw_on_if_touch(this.scene.camera_plane, this.highlight_mesh);
                tmp.enabled = true;
                
                this.highlight_mesh.name == "ZAP";
                var p = this.highlight_mesh.position;
        
                this.scene.body.add(this.highlight_mesh);
            }
        }

        // Distance between first and last point of the drawing
        let dist_e2e = drawing.currentPoint.distanceTo(drawing.curves[0].v1);
        console.log(dist_e2e);

        // Accept the next drawing
        this.scene.drawer.draw_on(this.scene.body, this.parse_drawing.bind(this));
        this.scene.drawer.on_ctrl = true;
        this.scene.drawer.flatten_along("x");
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
            //this.scene.materials.METAL.metalness = 0;
            this.scene.sceneGraph.background = null;
            this.scene.background_on = false;
            this.scene.sun.intensity = 2;

            bg_on_png.hidden = false;
            bg_off_png.hidden = true;
        }else{
            console.log("on");
            //this.scene.materials.METAL.metalness = 1;
            this.scene.sceneGraph.background = this.scene.textureCube;
            this.scene.background_on = true;
            this.scene.sun.intensity = 0.5;

            bg_on_png.hidden = true;
            bg_off_png.hidden = false;
        }
        
    }

    download(){
        var exporter = new PLYExporter();
        var data = exporter.parse(this.scene.body);
        download(data, "My_Ship.ply");
    }

    toggle_boids(){
        // #427288 #c48f8b
        var mat1 = new THREE.MeshStandardMaterial({color: 0x427288, roughness: 0.7, metalness: 0.5});
        var mat2 = new THREE.MeshStandardMaterial({color: 0xa35650, roughness: 0.7, metalness: 0.5});
        if(!this.boids && this.boids_possible){
            console.log("BOIDS");

            // Scene settings
            if(!this.scene.background_on){
                this.toggle_bg();
            }
            this.boids = true;
            this.last_camera_pos = this.scene.persp_camera.position.clone();
            this.scene.change_perspective(Vector3(-5, 5, -5), Vector3(0, 0, 0));
            this.scene.persp_camera.setFocalLength(50);

            // Generate boids
            var N = 10;
            this.scene.boids = [];
            for(var i = 0 ;i < N; i++){
                var mesh = this.scene.body.clone();

                // Remake lights from 0 to ensure they light up
                // For some reason they don't show up in the animation otherwise
                var lights = mesh.getObjectByName("lights");
                mesh.remove(lights);
                if(i == 0){
                    var tmp = new proc_MakeDetail(this.scene, null, false);
                    tmp.add_lights(mesh, 10);
                }

                // Scale and add to scene
                mesh.scale.multiplyScalar(10);
                //mesh.receiveShadow = true;
                this.scene.sceneGraph.add(mesh);

                // Add to new boids instance
                var b = new Boid(mesh);
                b.team = Math.random() > 0.5 ? 0 : 1;
                b.object.traverse(
                    function(obj){
                        if(obj.type == "PointLight") return;
                        if(obj.parent.type == "PointLight") return;
                        obj.material = (b.team == 0) ? mat1 : mat2;
                    });
                b.set_rotation();
                this.scene.boids.push(b);
            }

            var enemies = {
                0: this.scene.boids.filter(bbb => bbb.team != 0),
                1: this.scene.boids.filter(bbb => bbb.team != 1)
            }
            // Assign targets
            for(var [i, boid] of this.scene.boids.entries()){
                if(i == 0){
                    var enb = enemies[boid.team];
                    if(enb.length > 0){
                        boid.target = enb[Math.floor(Math.random() * enb.length)];
                        boid.setGoal(boid.target.position);//.clone().addScaledVector(boid.target.velocity, -2));
                    }else{
                        boid.target = null;
                    }
                }else{
                    boid.target = null;
                }
            }

            // Hide the main body that's sitting at the origin
            this.scene.body.visible = false;
        }else{
            this.toggle_bg();
            this.boids = false;
            this.scene.body.visible = true;
            this.scene.persp_camera.position.copy(this.last_camera_pos);
            this.scene.persp_camera.lookAt(Vector3(0, 0, 0));
            this.scene.persp_camera.setFocalLength(45);
            for(var b of this.scene.boids){
                this.scene.sceneGraph.remove(b.object);
                
            }
            this.scene.boids = [];
        }
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

function diff(A) {
    return A.slice(1).map(function(n, i) { return n - A[i]; });
}