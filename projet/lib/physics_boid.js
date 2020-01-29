// Based on http://threejs.org/examples/canvas_geometry_birds.html ,
// which is based on http://www.openprocessing.org/visuals/?visualID=6910

var Boid = function(object) {

	this.object = object;
	this.team = 0;

	var vector = new THREE.Vector3(),
	_acceleration, _width = 500, _height = 500, _depth = 500, _goal, _neighborhoodRadius = 60,
	_maxSpeed = 6, _maxSteerForce = 0.01, _avoidWalls = false;

	this.position = new THREE.Vector3();
	this.velocity = new THREE.Vector3();
	_acceleration = new THREE.Vector3();

	this.setGoal = function ( target ) {
		_goal = target;
	}

	this.setAvoidWalls = function ( value ) {
		_avoidWalls = value;
	}

	this.setWorldSize = function ( width, height, depth ) {
		_width = width;
		_height = height;
		_depth = depth;
	}

	this.position.x = Math.random() * _width - _width/2;
	this.position.y = Math.random() * _height - _height/2;
	this.position.z = Math.random() * _depth - _depth/2;
	this.velocity.x = Math.random();
	this.velocity.y = Math.random();
	this.velocity.z = Math.random();
	this.setAvoidWalls( true );
	this.setWorldSize( _width, _width, _depth );

	this.run = function ( boids ) {

		if ( _avoidWalls ) {

			vector.set( - _width, this.position.y, this.position.z );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );

			vector.set( _width, this.position.y, this.position.z );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );

			vector.set( this.position.x, - _height, this.position.z );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );

			vector.set( this.position.x, _height, this.position.z );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );

			vector.set( this.position.x, this.position.y, - _depth );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );

			vector.set( this.position.x, this.position.y, _depth );
			vector = this.avoid( vector );
			vector.multiplyScalar( 5 );
			_acceleration.add( vector );
		}/* else {
			this.checkBounds();
		}
		*/

		if ( Math.random() > 0.5 ) {
			this.flock( boids );
		}
		this.move();
	}

	this.flock = function ( boids ) {
		if ( _goal ) {
			_acceleration.add( this.reach( _goal, 0.005 ) );
		}

		_acceleration.add( this.attack ( boids ) );
		_acceleration.add( this.alignment( boids ) );
		_acceleration.add( this.cohesion( boids ) );
		_acceleration.add( this.separation( boids ) );
	}

	this.move = function () {
		this.velocity.add( _acceleration );

		var l = this.velocity.length();
		if ( l > _maxSpeed ) {
			this.velocity.divideScalar( l / _maxSpeed );
		}

		this.position.add( this.velocity );
		this.object.position.copy(this.position);
		this.object.updateMatrix();
		this.object.lookAt(this.position.clone().addScaledVector(this.velocity, 0.01));
		_acceleration.set( 0, 0, 0 );
	}

	this.checkBounds = function () {
		if ( this.position.x >   _width ) this.position.x = - _width;
		if ( this.position.x < - _width ) this.position.x =   _width;
		if ( this.position.y >   _height ) this.position.y = - _height;
		if ( this.position.y < - _height ) this.position.y =  _height;
		if ( this.position.z >  _depth ) this.position.z = - _depth;
		if ( this.position.z < - _depth ) this.position.z =  _depth;
	}

	this.avoid = function ( target ) {
		var steer = new THREE.Vector3();
		steer.copy( this.position );
		steer.sub( target );
		steer.multiplyScalar( 1 / this.position.distanceToSquared( target ) );
		return steer;
	}

	this.repulse = function ( target ) {
		var distance = this.position.distanceTo( target );

		if ( distance < 300 ) {
			var steer = new THREE.Vector3();
			steer.subVectors( this.position, target );
			steer.multiplyScalar( 0.5 / distance );
			_acceleration.add( steer );
		}
	}

	this.reach = function ( target, amount ) {
		var steer = new THREE.Vector3();
		steer.subVectors( target, this.position );
		steer.multiplyScalar( amount );
		return steer;
	}

	this.attack = function ( boids ) {
		var steerSum = new THREE.Vector3();
		count = 0;
		for ( var i = 0, il = boids.length; i < il; i++ ) {
			boid = boids[ i ];

			distance = boid.position.distanceTo( this.position );

			if(distance > 0 &&  boid.team != this.team){
				steerSum.add(this.reach(boid.position,
					1 / boid.position.distanceTo(this.position)));
				count++;
			}
		}
		if(count > 0){
			steerSum.divideScalar(count);
			var l = steerSum.length();
			if ( l > _maxSteerForce ) {
				steerSum.divideScalar( l / _maxSteerForce );
			}
		}

		return steerSum;
	}

	this.alignment = function ( boids ) {
		var boid, velSum = new THREE.Vector3(),
		count = 0;

		for ( var i = 0, il = boids.length; i < il; i++ ) {
			boid = boids[ i ];


			if ( Math.random() > 0.6 ) continue;

			distance = boid.position.distanceTo( this.position );

			if ( distance > 0 && distance <= _neighborhoodRadius ) {
				velSum.add( boid.velocity );
				count++;
			}
		}

		if ( count > 0 ) {
			velSum.divideScalar( count );
			var l = velSum.length();
			if ( l > _maxSteerForce ) {
				velSum.divideScalar( l / _maxSteerForce );
			}
		}

		return velSum;
	}

	this.cohesion = function ( boids ) {

		var boid, distance,
		posSum = new THREE.Vector3(),
		steer = new THREE.Vector3(),
		count = 0;

		for ( var i = 0, il = boids.length; i < il; i ++ ) {

			
			boid = boids[ i ];

			if ( Math.random() > 0.6 ) continue;
			

			distance = boid.position.distanceTo( this.position );

			if ( distance > 0 && distance <= _neighborhoodRadius ) {
				posSum.add( boid.position );
				count++;
			}

		}

		if ( count > 0 ) {
			posSum.divideScalar( count );
		}

		steer.subVectors( posSum, this.position );

		var l = steer.length();

		if ( l > _maxSteerForce ) {
			steer.divideScalar( l / _maxSteerForce );
		}

		return steer;
	}

	this.separation = function ( boids ) {
		var boid, distance,
		posSum = new THREE.Vector3(),
		repulse = new THREE.Vector3();

		for ( var i = 0, il = boids.length; i < il; i ++ ) {
			if ( Math.random() > 0.6 ) continue;

			boid = boids[ i ];
			distance = boid.position.distanceTo( this.position );

			if ( distance > 0 && distance <= _neighborhoodRadius ) {
				repulse.subVectors( this.position, boid.position );
				repulse.normalize();
				repulse.divideScalar( distance );
				posSum.add( repulse );
			}
		}
		return posSum;
	}

	this.set_rotation = function(){
		this.rotation   = new THREE.Vector3();
		this.rotation.x = this.rotation.y = this.rotation.z = 0;
	  
		this.rotation_v = new THREE.Vector3();
		this.rotation_v.x = Math.random() / 10;
		this.rotation_v.y = Math.random() / 10;
		this.rotation_v.z = Math.random() / 10;
	  }

	

}