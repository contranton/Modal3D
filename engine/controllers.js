// https://gist.github.com/webinista/11240585#gistcomment-1781756
// Splits an array r into j-sized subarrays
const foldm = (r, j) => r.reduce((a, b, i, g) => !(i % j) ? a.concat([g.slice(i, i + j)]) : a, []);


// Global drawers for unified event handling
let drawers = [];
let _id = 0;

class DrawController {
    constructor(scene) {
        this.scene = scene
        this.id = _id++;

        this.enabled = false;
        this.drawable_objs = [];
        this.callbacks = {};

        // Name of the final mesh
        this.view = "";

        // Raycasted object
        this.selected_obj = null;

        // Draw trigger object
        this.trigger_obj = null;

        this.i_points = 0;
        this.MAX_POINTS = 256;

        // Final mesh
        this.generated_shape = null;

        // Is in the process of drawing (i.e. mouse held down)
        this.drawing = false;

        // Whether to only draw when holding ctrl
        this.on_ctrl = false;

        // Point addition period per mouse move event
        this.period = 5;
        this.tick = 0;

        drawers.push(this);
    }

    __new_line() {
        // BufferGeometry for efficient point addition
        // Geometry gets rebuilt if maximum point number is surpassed
        this.i_points = 0;
        const line_geom = new THREE.BufferGeometry();
        const positions = new Float32Array(this.MAX_POINTS * 3);
        line_geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        line_geom.setDrawRange(0, this.i_points);

        // Line Object
        const line_mat = new THREE.LineBasicMaterial({ color: 0x000000 });
        return new THREE.Line(line_geom, line_mat);
    }

    draw_point(screen_x, screen_y, clicked = false, rem = false) {
        console.log(this.id, ":draw_point");
        const raycaster = this.scene.raycaster;
        const camera = this.scene.active_camera;

        // Position the raycaster at the camera position towards the chosen x, y
        raycaster.setFromCamera(new THREE.Vector2(screen_x, screen_y), camera);

        // Launch the ray
        const intersects = raycaster.intersectObjects(this.drawable_objs);

        // If we had a hit
        if (intersects.length > 0) {

            // Get the first hit objects
            let first = intersects[0];
            let second = null;
            if (this.trigger_obj && intersects.length > 1) {
                second = intersects[1];
            }
            console.log("state: ", this.id, this.ok2draw, first.object.name, second ? second.object.name : "..")

            // Draw only on the first object touched by the mouse
            // if (clicked) {
            //     this.selected_obj = first.object;
            // } else if(first.object != this.selected_obj) {
            //     return;
            // }
            this.selected_obj = first.object;

            // Really sorry for the cascade, wouldn't work otherwise 
            if (!this.ok2draw) {
                if (this.trigger_obj != null) {
                    if (second != null) {
                        if (second.object != this.trigger_obj) {
                            console.log("YOu have to draw over ", this.trigger_obj.name);
                            return;
                        } else {
                            /* All good! */
                            this.behind = second;
                        }
                    } else return;
                }
            }
            console.log("SUCCESS");
            this.ok2draw = true;

            let line = this.selected_obj.current_line;
            let sym_line = this.symmetry ? this.selected_obj.mirror_line : null;
            if (this.symmetry) this.scene.sceneGraph.add(sym_line);

            // if(line.finished){
            //     this.clear_current_line(this.selected_obj);
            // }

            // Get new point
            let p = first.point.clone();
            // If symmetry enabled, prevent depassing symmetry plane
            if (this.symmetry !== null) {
                var s = this.symmetry;
                for (var i = 0; i < 3; i++) {
                    if (s[i] < 0 && p.toArray()[i] < 0) {
                        var pp = p.toArray();
                        pp[i] = 0;
                        p = new THREE.Vector3(pp[0], pp[1], pp[2]);
                    }
                }
            }

            // Update geometry
            var position = line.geometry.attributes.position;
            position.array[this.i_points++] = p.x;
            position.array[this.i_points++] = p.y;
            position.array[this.i_points++] = p.z;
            /* // And connect it to the first point
            position.array[this.i_points+1] = position.array[0];
            position.array[this.i_points+2] = position.array[1];
            position.array[this.i_points+3] = position.array[2]; */
            position.needsUpdate = true;
            if (this.symmetry) {
                this.i_points -= 3;
                position = sym_line.geometry.attributes.position;
                position.array[this.i_points++] = p.x * this.symmetry[0];
                position.array[this.i_points++] = p.y * this.symmetry[1];
                position.array[this.i_points++] = p.z * this.symmetry[2];
                /* // And connect it to the first point
                position.array[this.i_points+1] = position.array[0];
                position.array[this.i_points+2] = position.array[1];
                position.array[this.i_points+3] = position.array[2]; */
                position.needsUpdate = true;
            }



            // Rebuild geometry if not enough points
            var line_vec = [line];
            if (this.symmetry) line_vec.push(sym_line);
            for (var line_ of line_vec) {
                if (this.i_points >= this.MAX_POINTS * 3) {
                    console.log("Rebuilding")
                    this.MAX_POINTS *= 2;
                    let new_geom = new THREE.BufferGeometry();
                    let old_geom = line_.geometry;
                    let positions = new Float32Array(this.MAX_POINTS * 3);
                    new_geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                    new_geom.attributes.position.array.set(old_geom.attributes.position.array);
                    line_.geometry = new_geom;
                }

                line_.geometry.setDrawRange(0, this.i_points / 3);
                line_.geometry.computeBoundingSphere();

                line_.finished = false;
                line_.is_ob = true;
            }

        }
    }


    finish_drawing(name = "drawing") {
        console.log(this.id, ":finish_Drawing");
        /* Called upon release of the mouse on the current drawing

        Manages geometry creation.
        */
        let sym_line = this.symmetry ? this.selected_obj.mirror_line : null;

        if (this.trigger_obj != null) {
            if (this.behind != null) {
                if (this.behind.object != this.trigger_obj) {
                    return;
                } else {
                    /* All good! */
                }
            } else return;
        }
        let line = this.selected_obj.current_line;
        // Map line to the object (?)
        this.selected_obj.updateMatrix();
        const matrice = this.selected_obj.matrix;
        matrice.getInverse(matrice);
        line.applyMatrix(matrice);
        if (this.symmetry) sym_line.applyMatrix(matrice);


        // Re-add drawn lines
        line.finished = true;
        if (this.symmetry) sym_line.finished = true;
        //this.selected_obj.remove(line);
        //this.selected_obj.add(line.clone());

        // Generate triangulation and add to scene
        // TODO: ConvexGeometry or ShapeGeometry? How to ensure we can later get shapes conformed to other objects?

        // Flatten 3D drawing to 2D planes
        let points = foldm(line.geometry.attributes.position.array.slice(0, this.i_points), 3);

        if (points.length > 0) {
            // Manage symmetry
            if (this.symmetry !== null) {
                var s = this.symmetry;

                // Traverse points from the most recently added backwards
                for (var i = points.length - 1; i >= 0; i--) {
                    var p = points[i];
                    // Flip them according to the symmetry vector
                    var pp = new Float32Array([s[0] * p[0], s[1] * p[1], s[2] * p[2]]);
                    points.push(pp);
                }
            }

            switch (this.flat_coord) {
                case "x":
                    points = points.map(x => new THREE.Vector2(x[1], x[2])).slice(0, this.i_points);
                    break;
                case "y":
                    points = points.map(x => new THREE.Vector2(x[0], x[2])).slice(0, this.i_points);
                    break;
                case "z":
                    points = points.map(x => new THREE.Vector2(x[0], x[1])).slice(0, this.i_points);
                    break;
                // Deal with arbitrary geometry here. Project onto the minimum base plane?
                case null:
                    break
                default:
                    var M = scene.camera_plane.matrix.clone();
                    M.getInverse(M);
                    points = points.map(p=>Vector3(p[0],p[1],p[2]).applyMatrix4(M))
                                   .map(p=>new THREE.Vector2(p.x, p.y));
            }

            // Assign drawing to object
            const drawn_shape = new THREE.Shape(points);
            console.log(this.flat_coord, points, drawn_shape);
            drawn_shape.autoClose = true;
            drawn_shape.name = name;
            this.generated_shape = drawn_shape;
            this.selected_obj.drawing = drawn_shape;
        }


        this.on_ctrl = false;

        this.drawing = false;
        this.clicked = false;
        this.enabled = false;

        // Call any callbacks
        let callback = this.callbacks[this.selected_obj];
        if (callback) { callback(); }
    }

    // TODO: Handle symmetric line
    clear_obj(object) {
        var old_line = null;

        while (old_line = object.getObjectByProperty('finished', true)) {
            object.remove(old_line);
        }
        delete (object.drawing);
    }

    flatten_along(coord) {
        this.flat_coord = coord;
    }

    draw_on(object, callback = null, symmetry = null) {
        console.log(this.id, ":draw_on");
        /* Makes object drawable

        Can accept a callback function which will be called when the drawing on
        the object is done */
        this.trigger_obj = null;
        this.flat_coord = null;
        this.ok2draw = true;

        this.drawable_objs.push(object);
        this.callbacks[object] = callback;
        this.symmetry = symmetry

        this.clear_obj(object);

        object.current_line = this.__new_line();
        object.add(object.current_line);

        if (symmetry != null) {
            object.mirror_line = this.__new_line();
            object.add(object.mirror_line);
        }
    }

    set_trigger_obj(trigger_obj) {
        this.trigger_obj = trigger_obj;
        this.drawable_objs.push(trigger_obj);
        this.ok2draw = false;
    }

    draw_on_if_touch(trigger_obj, object) {
        console.log("Setting up ", trigger_obj.name, " as trigger")
        this.draw_on(object);

    }

    clear_drawables() {
        this.drawable_objs = [];
        this.callbacks = {};
    }

}