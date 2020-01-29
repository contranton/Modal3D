"use strict";

var DEBUG = false;

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
        document.getElementById("txt").innerText = "Dessinez la vue du haut";

        let s = this.scene;
        s.drawer.clear_drawables();
        s.drawer.view = "top";

        s.orthographic_camera();
        s.change_perspective(Vector3(0, 1, 0), Vector3(0, 0, 0));

        s.yz.visible = false;
        s.zx.visible = true;

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
    constructor(scene, after){
        var target_pos = new THREE.Vector3();
        var target_normal = new THREE.Vector3();

        var mesh_clone = scene.body.clone();
        mesh_clone.geometry = new THREE.BufferGeometry().fromGeometry(scene.body.geometry)
        var sampler = new MeshSurfaceSampler(mesh_clone);
        sampler.setWeightAttribute('random');
        sampler.build();


        // Add scifi details
        var scale = 0.075;
        var g = null;
        var details = new THREE.Object3D();
        for(var i = 0; i < 500; i++){
            sampler.sample(target_pos, target_normal);
            g = primitive.Cube(target_pos, 1);
            g.scale(scale*Math.random(), scale*Math.random(), scale/8);
            var m = new THREE.Mesh(g, scene.materials.METAL);
            m.lookAt(target_normal.multiplyScalar(-1));
            m.position.copy(target_pos);
            details.add(m);
        }
        scene.body.add(details);

        // Add lights
        var lights = new THREE.Object3D();
        for(var i = 0; i < 0; i++){
            sampler.sample(target_pos, target_normal);
            var col = Math.random() < 0.1 ? 0xee1111 : 0x11ee11;
            g = new THREE.PointLight(col, 1, 0.5, 10);
            g.castShadow = false;
            g.add(new THREE.Mesh(primitive.Sphere(new THREE.Vector3(0, 0, 0), 0.004), new MaterialRGB(col)))
            g.position.copy(target_pos);
            g.position.addScaledVector(target_normal, scale);
            g.children[0].position.addScaledVector(target_normal, -scale);
            lights.add(g);
        }
        scene.body.add(lights);

        after();
    }
}

class Modeler{
    constructor(scene){
        this.scene = scene;


        this.boids_possible = false; // If there's a shape to instance
        this.boids = false;         // If selected boids

        this.div_root = document.getElementById("AffichageScene3D");
        this.init_UI();

        this.make_body();

        // For debugging. Make sure to first comment out make_body
        //this.debug_drawings();
        //this.pre_made_obj();
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
        this.button_boids.hidden = true;

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


        this.div_root.appendChild(this.top_menu);

    }

    pre_made_obj(){
        var geom = new primitive.Sphere(Vector3(0, 0, 0), 1);
        var mesh = new THREE.Mesh(geom, MaterialRGB(1, 0, 0));
        mesh.lights = {visible: false};
        mesh.details = {visible: false};
        this.scene.body = mesh;
        this.scene.sceneGraph.add(mesh);
        this.activate_editing();
    }

    debug_drawings(){
        this.scene.xy.visible = true;
        this.scene.drawer.enabled = true;
        this.scene.drawer.period = 5;
        this.scene.drawer.draw_on(this.scene.xy, this.__debug.bind(this));
        this.scene.change_perspective(Vector3(0, 0, 1), Vector3(0, 0, 0));
        this.scene.drawer.flatten_along("z");
    }

    __debug(){
        var d = this.scene.xy.drawing;
        console.log("hi, breakpoint here");

        var max_dist = Math.max(...d.curves.map((x)=>d.currentPoint.distanceTo(x.v1)));
        var last_dist = d.currentPoint.distanceTo(d.curves[0].v1);
        var sense_changes = diff(d.curves.map((x)=>Math.sign(x.v1.cross(x.v2))));
    
        var delta_dist = max_dist - last_dist;
        var delta_curv = sense_changes.filter((x)=>x!=0);

        // new sense_changes
        var sense_changes_2 = [];
        var d1 = [];
        var d2 = [];
        var A = d.curves.map(x=>x.v1)
        for(var i = 1; i < A.length-2; i++){
            d1.push(A[i+1].clone().sub(A[i]));
            d2.push(A[i-1].clone().add(A[i+1]).addScaledVector(A[i], -2))
        }
        for(var i = 0; i < d2.length; i++){
            sense_changes_2.push(d1[i].x*d2[i].y - d1[i].y*d2[i].x);
        }

        console.log("-----------------");
        console.log("Curvature changes: ", sense_changes);
        //console.log("Curvature changes V2: ", sense_changes_2.map(Math.sign));
        console.log("d_max - d_e2e: ", delta_dist);
        //alert();
        if(sense_changes.filter(x=>x!=0).length!=0){
            alert("!")
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
        this.scene.drawer.draw_on_ctrl(this.scene.body, this.parse_drawing.bind(this));

        this.boids_possible = true;
        this.button_boids.hidden = false;

        this.button_anim.hidden = false;

    }

    parse_drawing(){
        let drawing = this.scene.body.drawing;

        // Distance between first and last point of the drawing
        let dist_e2e = drawing.currentPoint.distanceTo(drawing.curves[0].v1);
        console.log(dist_e2e);

        // Accept the next drawing
        this.scene.drawer.draw_on_ctrl(this.scene.body, this.parse_drawing.bind(this));
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
            this.scene.sceneGraph.background = null;
            this.scene.background_on = false;
            this.scene.sun.visible = true;

            bg_on_png.hidden = false;
            bg_off_png.hidden = true;
        }else{
            console.log("on");
            this.scene.materials.METAL.metalness = 1;
            this.scene.sceneGraph.background = this.scene.textureCube;
            this.scene.background_on = true;
            this.scene.sun.visible = false;

            bg_on_png.hidden = true;
            bg_off_png.hidden = false;
        }
        
    }

    toggle_boids(){
        var mat1 = new THREE.MeshStandardMaterial({color: 0xdc3264, roughness: 0.7, metalness: 0.5});
        var mat2 = new THREE.MeshStandardMaterial({color: 0x6432dc, roughness: 0.7, metalness: 0.5});
        if(!this.boids && this.boids_possible){
            console.log("BOIDS");

            // Scene settings
            this.toggle_bg();
            this.boids = true;
            this.last_camera_pos = this.scene.persp_camera.position.clone();
            this.scene.change_perspective(Vector3(-5, 5, -5), Vector3(0, 0, 0));
            this.scene.persp_camera.setFocalLength(50);

            // Generate boids
            var N = 25;
            this.scene.boids = [];
            for(var i = 0 ;i < N; i++){
                var mesh = this.scene.body.clone();
                if(mesh.lights){
                    mesh.lights.visible = false;
                }
                mesh.scale.multiplyScalar(10);
                mesh.receiveShadow = true;
                this.scene.sceneGraph.add(mesh);

                var b = new Boid(mesh);
                b.team = Math.random() > 0.5 ? 0 : 1;
                b.object.traverse(obj => obj.material = (b.team == 0) ? mat1 : mat2);
                b.set_rotation();
                this.scene.boids.push(b);
            }
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