	varying vec3 world_pos;
	varying vec3 normalInterp;
	varying float frequency;

    void main() {
	  	vec3 p = position;

		frequency = 1.8; 
	  	p.x += max( 0.0, abs(sin( p.y * frequency )) * 1.0 - 0.4);
	  	p.z += max( 0.0, abs(cos( p.y * frequency )) * 1.0 - 0.4);

		gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
		  
		world_pos = p; 
		normalInterp = normal;
    }