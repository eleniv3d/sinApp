	precision mediump float; // set float to medium precision

	uniform vec3 lightPos;
	uniform sampler2D texture1;

	varying vec3 world_pos;
	varying vec3 normalInterp;
	varying float frequency;

	const vec3 ambientColor = vec3(0.870, 0.831, 0.721);
	const vec3 diffuseColor = vec3(0.870, 0.831, 0.721);
	const vec3 specColor = vec3(0.870, 0.831, 0.721);

	vec3 getPosNormalized(){
		float x = world_pos.x / 80.0 ;
		float y = world_pos.y / 300. + 1. ;
		float z = world_pos.z / 80.0 ;
		return vec3(x, y, z);
	}

	vec2 getZylindricalUvs(){
		vec3 pos_n = getPosNormalized();

		float a = atan(pos_n.x, -pos_n.z) /3.14;
        float us = ((a + 1.)) * 0.5;  // from 0 to 1
		float vs = pos_n.y * 1.;          // from 0 to 1
		
		return vec2(us, vs);
	}

	void main() {

		//calculate uvs
		vec2 vUv = getZylindricalUvs();

		// ambient term
		vec3 ambient = ambientColor; 

		// look up texture
		highp vec2 tex2 = vec2(vUv.x, vUv.y);
		vec4 texColor = texture2D(texture1, tex2);
		
		// diffuse term
		vec3 normal = normalize(normalInterp); 
		vec3 light = normalize(lightPos - world_pos);
		float lambert = max(0.0, -dot(normal,light));
		vec3 diffuse = diffuseColor * lambert; // diffuse term

		// fake occclusion
		float occlusion = 1.0 - 0.3 * sin( (world_pos.y+ 1.) * frequency * 2.) ;

		// fake specular
		float specular = 1.0 * sin( (world_pos.y -2. ) * frequency * 2.) * max(0., pow(-dot(normal,light), 15.0) ) ;

		// vec3 color = ambient * 0.35 - 0.1*occlusion + diffuse * 0.9 * occlusion + specular * 0.3; 

		vec3 color = texColor.xyz;

	    gl_FragColor = vec4(color , 1.0);
	}