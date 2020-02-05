var scene, camera, myExporter, geoBuf, mirrorGeoBuf, particleSystem, indexArray, nLayers, nSegments, boolRot, boolSlice;
var box, horizontalPlane, cameraOrtho, sceneOrtho, sliceLine, sliceGeometry, mirrorTog, mirrorType, axisline, columngeoBuf;
var mirrorObjMaterial;

var iterations = new function() {
	this.number = 1 ;
}

var xSin = new function() {
	this.xfrequency = 0.0;
	this.xamplitude = 0.0;
	this.xphase = 0.0;
	this.xoffset = 0.0;
}

var zSin = new function() {
	this.zfrequency = 0.0;
	this.zamplitude = 0.0;
	this.zphase = 0.0;
	this.zoffset = 0.0;
}

var pSin = new function() {
	this.pfrequency = 0.0;
	this.pamplitude = 0.0;
	this.pphase = 1.0;
	this.poffset = 0.0;
}

var mAttr =new function() {
	this.mType = "parallel to xx' axis" ;
	this.distance = 0.0;
	this.mm = 0.0;
	this.mc = 0.0;
}

var fourier = new function(){
	this.bool = "false";
	this.ite = 1 ;
}

mirrorTog = false;
boolSlice = false;
concreteTog = false;


function vertexShader() {
	return `
	varying vec3 world_pos;
	varying vec3 normalInterp;
	varying float frequency;

    void main() {
	  	vec3 p = position;

		  frequency = 1.8; 
		  float top_thickness = 0.83;
  
		  if (abs(position.y) > 0.3){
			  p.x += max( 0.0, abs(sin( p.y * frequency )) * 1. );
			  p.z += max( 0.0, abs(cos( p.y * frequency )) * 1. );
		  } else {
			  p.x *= top_thickness;
			  p.z *= top_thickness;
		  }

		gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
		  
		world_pos = p; 
		normalInterp = normal;
    }
  `
}

function fragmentShader() {
	return `
	precision mediump float; // set float to medium precision

	uniform vec3 lightPos1;
	uniform vec3 lightPos2;
	uniform vec3 lightPos3;

	uniform sampler2D texture1;

	varying vec3 world_pos;
	varying vec3 normalInterp;
	varying float frequency;

	// const vec3 ambientColor = vec3(0.870, 0.831, 0.721);
	// const vec3 diffuseColor = vec3(0.870, 0.831, 0.721);
	// const vec3 specColor = vec3(0.870, 0.831, 0.721);

	vec3 getPosNormalized(){
		float x = world_pos.x / 80.0 ;
		float y = world_pos.y / 300. + 1. ;
		float z = world_pos.z / 80.0 ;
		return vec3(x, y, z);
	}

	vec2 getZylindricalUvs(){
		vec3 pos_n = getPosNormalized();

		float a = atan(pos_n.x, -pos_n.z) /3.14;
        float us = mod( ((a + 1.)) * 0.5 * 4.0, 1.0);  // from 0 to 1
		float vs = mod( pos_n.y * 12., 1.0) ;          // from 0 to 1
		
		return vec2(us, vs);
	}

	void main() {

		//calculate uvs
		vec2 vUv = getZylindricalUvs();

		// look up texture
		highp vec2 tex2 = vec2(vUv.x, vUv.y);
		vec4 texColor = texture2D(texture1, tex2);

		//normal and light direction
		vec3 normal = normalize(normalInterp); 
		vec3 light1 = normalize(lightPos1 - world_pos);
		vec3 light2 = normalize(lightPos2 - world_pos);
		vec3 light3 = normalize(lightPos3 - world_pos);
		float lambert = max(0.0, dot(normal,light1)) 
					  + max(0.0, dot(normal,light2)) 
					  + max(0.0, dot(normal,light3) + 0.05);

		// ambient term
		vec3 ambient = texColor.xyz; 
		
		// diffuse term
		vec3 diffuse = texColor.xyz * lambert; // diffuse term

		
		// (fake) specular term
		vec3 eye = normalize(-world_pos);
		vec3 r1 = 2.0*lambert* normal - light1;
		vec3 r2 = 2.0*lambert* normal - light2;
		vec3 r3 = 2.0*lambert* normal - light3;

		float spec_intensity = sin( (world_pos.y -2. ) * frequency * 2.) 
							  *(  pow(max(0.0, -dot(eye, r1) - 0.4), 3.0) 
								+ pow(max(0.0, -dot(eye, r2) - 0.4), 3.0) );
								// + pow(max(0.0, -dot(eye, r3)), 3.0)  );

		vec3 specular = texColor.xyz * spec_intensity;

		// (fake) occclusion
		float occlusion = 1.0 - 0.4 *  sin( (world_pos.y+ 1.5) * frequency * 2.) ;

		vec3 color = 0.65 * ambient - 0.1 * occlusion 
				   + 0.65 * diffuse  - 0.1 * occlusion
				   + specular * 0.03; 

	    gl_FragColor = vec4(color , 1.0);
	}
`
}

function getCustomMaterial(){
	uniforms = {
	lightPos1 : {type: 'vec3', value: [-300, 200, 40]},
	lightPos2 : {type: 'vec3', value: [300, 200, 40]},
	lightPos3 : {type: 'vec3', value: [0, 100, 30]},
	texture1: { type: 't', value:  THREE.ImageUtils.loadTexture( 'assets/textures/AS2_concrete_13.jpg' ) } //concrete_texture
	}
	selectedMaterial = new THREE.ShaderMaterial({
		side: THREE.DoubleSide,
		uniforms: uniforms,
		fragmentShader: fragmentShader(),
		vertexShader: vertexShader(),
	})
	return selectedMaterial;
}


function addGeo(objMaterial, tog, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog ) {

	if ( geoBuf !== undefined ) {
		scene.remove( geoBuf );
	}
	columngeoBuf = getGeometry('myCylinder', 5, objMaterial, xSin, zSin, pSin, tog, 0, mAttr, iterations, fourier);
	// columngeoBuf = new THREE.BufferGeometry().fromGeometry( columnGeo );

	if (concreteTog === true){
		objMaterial = getCustomMaterial(); /// Custom shader mtl
	}

	//geo = new THREE.Mesh(columnGeo, objMaterial);

	//find bounding box for Shader
	// test = geo.geometry.vertices;
	// xlist = []
	// ylist = []
	// zlist = []

	// for (i = 0; i < test.length; i++) {
	// 	xlist.push( test[i].x )
	// 	ylist.push( test[i].y )
	// 	zlist.push (test[i].z)
	// }
	// xmax = Math.max.apply(null,xlist);
	// console.log(xmax);
	// xmin = Math.min.apply(null,xlist);
	// console.log(xmin);

	// ymax = Math.max.apply(null,ylist);
	// console.log(ymax);
	// ymin = Math.min.apply(null,ylist);
	// console.log(ymin);

	// zmax = Math.max.apply(null,zlist);
	// console.log(zmax);
	// zmin = Math.min.apply(null,zlist);
	// console.log(zmin);

	geoBuf = new THREE.Mesh(columngeoBuf, objMaterial);

	geoBuf.castShadow = true;
	geoBuf.name = 'column-1';

	scene.add(geoBuf);	
}


function addMirrorGeo(mirrorObjMaterial, tog, xSin, zSin, pSin,mAttr, iterations, fourier, concreteTog ) {

	if ( mirrorGeoBuf !== undefined ) {
		scene.remove( mirrorGeoBuf );
		//mirrorGeo.geometry.dispose();
	}
	mirrorcolumnGeoBuf = getGeometry('myCylinder', 5, mirrorObjMaterial, xSin, zSin, pSin, tog, 1, mAttr, iterations, fourier);
	// mirrorcolumnGeoBuf = new THREE.BufferGeometry().fromGeometry( mirrorcolumnGeo );

	if (concreteTog === true){
		mirrorObjMaterial = getCustomMaterial(); /// Custom shader mtl
	}
	mirrorGeoBuf = new THREE.Mesh(mirrorcolumnGeoBuf,  mirrorObjMaterial);

	mirrorGeoBuf.castShadow = true;
	mirrorGeoBuf.name = 'column-2'
	scene.add(mirrorGeoBuf);
}

function addSlice(ch, sliceLine, sliceGeometry, c, type) {

	//here update slicer
	for(var i=0; i < sceneOrtho.children.length; i++){
		obj = sceneOrtho.children[i];
		if ( (type === 0) && (obj.name === 'column') ){
			sceneOrtho.remove(obj);
		}else if( (type === 1) && (obj.name === "mirror")){
			sceneOrtho.remove(obj);
		} 							
	    
	}

	helperDataSt = ch.geometry.getAttribute('position').array;
	horizontalc = horizontalPlane.constant;

	layerIndex = Math.floor(600 + horizontalPlane.constant*2);
	
	sliceGeometry = new THREE.Geometry();
	var sliceMaterial = new THREE.LineBasicMaterial( { color: c, linewidth: 1 } );	
	vertex1 = new THREE.Vector3( helperDataSt[3*((layerIndex)*(nSegments)+1)]*5, helperDataSt[3*((layerIndex)*(nSegments)+1)+2]*5,0)
	for (var ka = 3*((layerIndex)*(nSegments)+1); ka < 3*(layerIndex+1)*(nSegments); ka+=3) {
		sliceGeometry.vertices.push( new THREE.Vector3( helperDataSt[ka]*5 , helperDataSt[ka+2]*5 , 0 ));
	}

	sliceGeometry.vertices.push(vertex1);
	var sliceLine = new THREE.Line( sliceGeometry, sliceMaterial );
	sliceLine.rotation.z = Math.PI*0.5;
	w = window.innerWidth
	h = window.innerHeight
	squareSize = 460;
	sliceLine.position.x = - w - margin + squareSize*0.5 + 48;
	sliceLine.position.z = 0;
	sliceLine.position.y = -h - margin + squareSize*0.5 + 50;
	
	if (type === 0){
		sliceLine.name = "column"
	}else{
		sliceLine.name = "mirror"
	}
	sceneOrtho.add(sliceLine)
	
}

function addLineShape(layer) {

	var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3( -10, 0, 0) );
	geometry.vertices.push(new THREE.Vector3( 0, 10, 0) );
	geometry.vertices.push(new THREE.Vector3( 10, 0, 0) );
	var line = new THREE.Line( geometry, material );

}

function addMirrorAxis() {

	var test = sceneOrtho.getObjectByName("axis");
	if (test !== undefined){
		sceneOrtho.remove(test)
	}

	var axisMaterial = new THREE.LineDashedMaterial( {color: 0x336597, linewidth: 100, scale: 5, dashSize: 40, gapSize: 25 } );
	var axisGeometry = new THREE.Geometry();

	if (mAttr.mType === "parallel to xx' axis" ){
		mirrorType = 0;
	}else{
		mirrorType = 1;
	}


	if (mirrorType === 0){
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin, -h + margin + 0.5* squareSize + ( 5*mAttr.distance), 0) );
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + squareSize , -h + margin + 0.5* squareSize + (5*mAttr.distance), 0) );
		axisline = new THREE.Line( axisGeometry, axisMaterial );
	}else if(mirrorType === 1){
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + 0.5* squareSize - ( 5*mAttr.distance), -h + margin, 0) );
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + 0.5* squareSize - ( 5*mAttr.distance) , -h + margin + squareSize, 0) );
		axisline = new THREE.Line( axisGeometry, axisMaterial );
	}else{
		axisGeometry.vertices.push(new THREE.Vector3( 0, mAttr.mc, 0) );
		axisGeometry.vertices.push(new THREE.Vector3(  100, -300 + mAttr.mc , 0) );
		axisline = new THREE.Line( axisGeometry, axisMaterial );
		axisline.position.x = -w + margin + 0.5* squareSize
		axisline.position.y = -h + margin + 0.5* squareSize
		axisline.position.z = 0;
	}

	
	axisline.computeLineDistances()
	axisline.name = "axis";
	sceneOrtho.add(axisline);
}

function init() {

	var gui = new dat.GUI();
	var gui2 = new dat.GUI(); 
	scene = new THREE.Scene();
	sceneOrtho = new THREE.Scene();
	var stats = new Stats();
	stats.showPanel( 0 );

	document.body.appendChild(stats.dom);

	//add simple square around slice
	var squareMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 30 } );
	var squareGeometry = new THREE.Geometry();
	w = window.innerWidth;
	h =  window.innerHeight;
	squareSize = 460;
	margin = 26;
	squareGeometry.vertices.push(new THREE.Vector3( -w + margin, -h + margin, 0) );
	squareGeometry.vertices.push(new THREE.Vector3( -w + margin, -h + margin + squareSize , 0) );
	squareGeometry.vertices.push(new THREE.Vector3( -w + margin + squareSize , -h + margin + squareSize , 0) );
	squareGeometry.vertices.push(new THREE.Vector3( -w + margin + squareSize , -h + margin, 0) );
	squareGeometry.vertices.push(new THREE.Vector3( -w + margin, -h + margin, 0) )

	var line = new THREE.Line( squareGeometry, squareMaterial );
	
	line.name = 'rec';
	//sceneOrtho.add(objTest);
	sceneOrtho.add(line);

	var clock = new THREE.Clock();

	myExporter = new THREE.STLExporter();

	// ***** Clipping planes: *****
	horizontalPlane = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.0 );

	var folder2 = gui.addFolder('iterations');
	folder2.add( iterations, 'number', 1, 4, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin,mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 );
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0);
		}

	} );

	folder2.open();

	var folder3 = gui.addFolder('xSin');
	folder3.add(xSin, 'xfrequency', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 );
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0);
		}

	} );

	folder3.add(xSin, 'xamplitude', 0.0, 10);
	folder3.add(xSin, 'xphase', 0, 0.5 * Math.PI);
	folder3.add(xSin, 'xoffset', 0, 3); //0.5 *z/nLayers

	// folder3.open();

	var folder5 = gui.addFolder('pSin');
	folder5.add(pSin, 'pfrequency', 0.0, 10,1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );
	folder5.add(pSin, 'pamplitude', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );
	folder5.add(pSin, 'pphase', 1, 10, 0.1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );
	folder5.add(pSin, 'poffset', 0, 10, 0.1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );

	folder5.open();


	var folder4 = gui.addFolder('zSin');
	folder4.add(zSin, 'zfrequency', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb(220, 220, 220)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0);
		}

	} );
	folder4.add(zSin, 'zamplitude', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );
	folder4.add(zSin, 'zphase', 0.0, 2 * Math.PI).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin,mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );
	folder4.add(zSin, 'zoffset', 0.0, 3).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)',  1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );

	folder4.open();



	var folderf = gui.addFolder('fourier');
	folderf.add(fourier, 'bool', ["true", "false"]).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}
	} );

	folderf.add(fourier, 'ite', 1, 5, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}

	} );

	folderf.open();

	var folder6 = gui.addFolder('mAttr');
	folder6.add(mAttr, 'mType', ["parallel to xx' axis", "parallel to yy' axis"]).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}
	} );

	folder6.add(mAttr, 'distance', -10, 10, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
			if (boolSlice === true){
				addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}
	} );

	folder6.open();
	test = window.innerHeight - squareSize + 110;
	gui.domElement.style.marginTop = "10px";
	gui.domElement.style.marginLeft = "1010px";
	gui2.domElement.style.marginTop = new String(test)+"px";


	// initialize objects
	concreteTog = false;

	objMaterial = getMaterial('lambert', 'rgb( 255, 255, 255)');
	mirrorObjMaterial =  getMaterial('lambert', 'rgb( 255, 255, 255)');
	
	addGeo(objMaterial, false, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog)

	//'rgb(255, 220, 180)'
	col = 'rgb(235, 235, 225)'
	var lightLeft = getSpotLight(1, col);
	var lightRight = getSpotLight(1, col );
	var lightBottom = getPointLight(0.33, col );

	lightLeft.position.x = -300;
	lightLeft.position.y = 200;
	lightLeft.position.z = 40;

	lightRight.position.x = 300;
	lightRight.position.y = 200;
	lightRight.position.z = 40;

	lightBottom.position.x = 0;
	lightBottom.position.y = 10;
	lightBottom.position.z = 0;


	// dat.gui
	// var folder1 = gui.addFolder('lightLeft');
	// folder1.add(lightLeft, 'intensity', 0, 10);
	// folder1.add(lightLeft.position, 'x', -500, 500);
	// folder1.add(lightLeft.position, 'y', -500, 500);
	// folder1.add(lightLeft.position, 'z', -500, 500);

	// var folder2 = gui.addFolder('lightRight');
	// folder2.add(lightRight, 'intensity', 0, 10);
	// folder2.add(lightRight.position, 'x', -500, 500);
	// folder2.add(lightRight.position, 'y', -500, 500);
	// folder2.add(lightRight.position, 'z', -500, 500);

	// add other objects to the scene
	scene.add(lightLeft);
	scene.add(lightRight);
	scene.add(lightBottom);
	//scene.add(helper);

	// camera

	cameraOrtho = new THREE.OrthographicCamera( - window.innerWidth , window.innerWidth, window.innerHeight, - window.innerHeight , -10000, 10000 );

	var cameraGroup = new THREE.Group();
	camera = new THREE.PerspectiveCamera(
		50, // field of view
		window.innerWidth / window.innerHeight, // aspect ratio
		1, // near clipping plane
		1000 // far clipping plane
	);
	
	camera.position.x = -300;
	camera.position.y = 100;
	camera.position.z = 50;

	cameraGroup.add(camera);
	cameraGroup.name = 'sceneCameraGroup';
	scene.add(cameraGroup);

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.autoClear = false; // to allow overlay
	document.body.appendChild(renderer.domElement);

	renderer.localClippingEnabled = true;

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	
	camX = camera.position.x
	camY = camera.position.y
	camZ = camera.position.z
	controls.object.position.set(camX, camY, camZ);

	targetX = 0;
	targetY = -100;
	targetZ = 0;
	controls.target = new THREE.Vector3(targetX, targetY, targetZ);
	
	// GUI

	folderHorizontal = gui2.addFolder( 'Horizontal Clipping' ),
	propsHorizontal = {
		get 'Enabled'() {
			return renderer.localClippingEnabled;
		},
		set 'Enabled'( v ) {
			renderer.localClippingEnabled = v;
		},
		
		get 'Plane'() {
			return horizontalPlane.constant;
		},
		set 'Plane'( v ) {
			horizontalPlane.constant = v;
		}
	};
	folderHorizontal.open();

	folderHorizontal.add( propsHorizontal, 'Enabled' );
	folderHorizontal.add( propsHorizontal, 'Plane', -300, 0, -5 ).onChange( function () {
		if ( boolSlice == true){
			addSlice( geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0)
		}
		if (mirrorTog === true){
			addSlice(mirrorGeoBuf, sliceLine, sliceGeometry,'rgb( 255, 255, 255)', 1 )
		}
		
	} );

	myExporter.name = 'exp'
	var buttonExportStl = document.getElementById( 'exportStl' );
	buttonExportStl.addEventListener( 'click', exportSTL );

	var buttonReset = document.getElementById( 'reset' );
	buttonReset.addEventListener( 'click', reset );

	var buttonConcrete =  document.getElementById('concrete');
	buttonConcrete.addEventListener( 'click', concrete );

	var buttonMirror = document.getElementById( 'mirror' );
	buttonMirror.addEventListener( 'click', mirror );

	window.addEventListener( 'resize', onWindowResize, false );
	
	boolRot = true;
	var buttonRotate = document.getElementById( 'rotate' );
	buttonRotate.addEventListener( 'click', rotateGeo );

	var buttonCreateBase = document.getElementById( 'base' );
	buttonCreateBase.addEventListener( 'click', base );

	var buttonSlice = document.getElementById( 'slice' );
	buttonSlice.addEventListener( 'click', slice );

	var particleGeo = new THREE.Geometry();
	var particleMat = new THREE.PointsMaterial( {
		color: 'rgb(255, 255, 255)',
		size: 3,
		map : new THREE.TextureLoader().load('assets/textures/particle.jpg'),
		transparent: true,
		blending : THREE.AdditiveBlending,
		depthWrite : false,
	});

	var particleCount = 50000;
	var particleDistance = 500;

	for (var i=0; i<particleCount; i++) {
		var posX = (Math.random() - 0.5) * particleDistance;
		var posY = (Math.random() - 0.5) * particleDistance;
		var posZ = (Math.random() - 0.5) * particleDistance;
		var particle = new THREE.Vector3( posX, posY, posZ);
		particleGeo.vertices.push(particle);
	}

	particleSystem = new THREE.Points(
		particleGeo,
		particleMat
	);

	particleSystem.name = 'particleSystem';

	var buttonMakeItSnow = document.getElementById( 'snow' );
	buttonMakeItSnow.addEventListener( 'click', snow );
	
    update(renderer, scene, camera, controls, clock , sceneOrtho, cameraOrtho, stats);

	return scene;
}

function normalVertex2D(vprev,v,vnext) {

	helper1 = v.clone();
    vec1 = helper1.sub(vprev);
	vec1.normalize();
	
	helper2 = vnext.clone();
    vec2 = helper2.sub(v);
    vec2 = vec2.normalize();
    //vec2 = vec2.multiplyScalar(5)
    vec1.add(vec2);
    vec1.multiplyScalar(0.5);
    t = vec1.x;
    vec1.setX(vec1.z);
	vec1.setZ(-t);
	newvec = new THREE.Vector3( vec1.x, vec1.y, vec1.z);
    return newvec;
}

function snow() {

	test = scene.getObjectByName('particleSystem');
	if (test === undefined){
		scene.add(particleSystem);
	}else{
		scene.remove(particleSystem);
	}
	
}

function reset() {

	window.location.reload();
}
function SinFourier(val, freq, amp, phase, ite){
	pos_y = 0;
    for (var j=0; j<ite; j++){
        n = j * 2 + 1
        local_radius = amp * (4 / ( n * Math.PI))
		pos_y += local_radius * Math.sin( freq * n * (val + phase) )
	}
    return pos_y
}

function ColumnGeometry( radiusTop, radiusBottom, height, segments, heightSegments, thetaStart, thetaLength, xSin, zSin, pSin, tog, helper, mAttr, iterations, fourier ) {

	
	geometry = new THREE.BufferGeometry();
	heightSegments = Math.floor( heightSegments ) ;

	// buffers

	var indices = [];
	numVertices = segments * (heightSegments + 1);
	console.log(numVertices*3);
	var vertices = new Float32Array(numVertices * 3);
	//var vertices = [];
	//var normals = [];
	var uvs = new Float32Array(numVertices * 2);

	// helper variables

	var index = 0;
	var indexArray = [];
	let posNdx = 0;
	let uvNdx = 0;

	// var halfHeight = height / 2;

	// generate geometry

	var vertex = new THREE.Vector3();
	// var normal = new Vector3();


	// generate vertices

	for ( var y = 0; y <= heightSegments; y ++ ) {

		var indexRow = []; //a list to know in which row we are
		var verticesRow = []; //all the vertices per profile

		var v = y / heightSegments; //a ratio to know in which height of the cylinder we are

		// calculate the radius of the current row

		var radius = v * ( radiusBottom - radiusTop ) + radiusTop; //could be improved for more differentiation

		var deltaAngle = Math.PI * 2.0 / segments
		for ( var x = 0; x < segments; x ++ ) { //create a list of  vertices for every profile

			var u = x / segments;

			var cAngle = x * deltaAngle

			// create the vertices of a circle

			vertex.x = radius * Math.cos(cAngle)
			currentHeight = y * (height/heightSegments);
			vertex.y = - y * (height/heightSegments);
	
			vertex.z = radius * Math.sin(cAngle);
	
			//vertices.push( vertex.x, vertex.y, vertex.z );
			verticesRow.push( new THREE.Vector3(vertex.x, vertex.y, vertex.z ) );

			// normal

			// normal.set( Math.cos(cAngle), 0, Math.sin(cAngle) ).normalize();
			// normals.push( normal.x, normal.y, normal.z );

			// uv

			uvs[uvNdx] = u ;
			uvs[uvNdx+1] = 1 - v ;
			uvNdx += 2;

			// save index of vertex in respective row

			indexRow.push( index ++ );
		}

		if (tog === true){

			for (var it = 0; it < iterations.number; it++) {

				newVertices = [];
				
				verticesRow.forEach(myFunction);

				function myFunction(vertex, index) {

					var origin = vertex.clone();
					zFreq = zSin.zfrequency;
					zAmp = zSin.zamplitude;
					zPhase = zSin.zphase;
					zOffset = zSin.zoffset * vertex.y / heightSegments;
					zFunction = new SinusFunction( zFreq, zAmp, zPhase, zOffset);
					pos_z = (currentHeight/heightSegments) * 2 * Math.PI;
					mag_z = zFunction.getValue(pos_z);

					xFreq = xSin.xfrequency;
					xAmp = xSin.xamplitude;
					xPhase = xSin.xphase;
					xOffset = xSin.xoffset * vertex.y / heightSegments;
					xFunction = new SinusFunction( xFreq, xAmp, xPhase, xOffset);
					pos_x = (currentHeight/heightSegments) *2*Math.PI;
					mag_x = xFunction.getValue(pos_z);

					pFreq = pSin.pfrequency;
					pAmp = pSin.pamplitude;
					pPhase = pSin.pphase * mag_z;

					pOffset = pSin.poffset
					pFunction = new SinusFunction( pFreq, pAmp, pPhase, pOffset);
					pos_p = (index/segments)*2*Math.PI
					mag_p = pFunction.getValue(pos_p);

					magnitude = mag_p
					if (fourier.bool === "true"){

						//SinFourier(val,freq,amp,phase,ite)

						pSinFourier = SinFourier(pos_p , pFreq, pAmp, pPhase, fourier.ite);
						magnitude = pSinFourier;
					}

					if (index > 0) {
							iPrev = (index-1);
						} else {
							iPrev = segments - 1
					}
					
					iNext = (index+1)%(segments);
					//console.log(index, iPrev, iNext);
					v0 = verticesRow[iPrev].clone();
					v2 = verticesRow[iNext].clone();

					nvec = normalVertex2D( v0, vertex, v2);
					nvec.multiplyScalar(magnitude);

					origin.add(nvec) //move the vertice by the calculated vector
					newVertices.push( origin );
				}
				verticesRow = newVertices;
			}
		}

		if (helper === 1){

			newVertices2 = [];

			verticesRow.forEach(mynewFunction);

			function mynewFunction(vertex) {
				
				if (mAttr.mType === "parallel to xx' axis" ){
					mirrorType = 0;
				}else{
					mirrorType = 1;
				}

				d = mAttr.distance ;
				m = mAttr.mm ;
				c = mAttr.mc ;

				if (mirrorType === 0){
					newVertices2.push( new THREE.Vector3( 2*d-vertex.x , vertex.y, vertex.z) );
				}
				else if (mirrorType === 1){
					newVertices2.push( new THREE.Vector3(vertex.x , vertex.y, 2*d-vertex.z) );
				}
				else{
					
					k = (vertex.x + (vertex.z - c) * m ) / (1 + m**2)
					newVertices2.push( new THREE.Vector3( 2 * k - vertex.x , vertex.y, 2 * k * m - vertex.z + 2 * c) );
				}
			}
			verticesRow = newVertices2;

		}

		// console.log(verticesRow.length);
		for (var vertex of verticesRow){
			//vertices.push( vertex.x, vertex.y, vertex.z );
			vertices[posNdx] = vertex.x;
			vertices[posNdx+1] = vertex.y;
			vertices[posNdx+2] = vertex.z;
			posNdx +=3;
		}

		// now save vertices of the row in our index array

		indexArray.push( indexRow ); //nested list with all the indexes

	}

	// generate indices

	for ( x = 0; x < segments; x ++ ) {

		for ( y = 0; y < heightSegments; y ++ ) {

			// we use the index array to access the correct indices

			var a = indexArray[ y ][ x ]; 
			var b = indexArray[ y + 1 ][ x ]; 10
			var c = indexArray[ y + 1 ][ (x + 1)%segments ]; 11
			var d = indexArray[ y ][ (x + 1)%segments ];

			// faces
			if (helper === 1){

				indices.push( a, b, d );
				// geometry.faces.push( new THREE.Face3(  a, b, d ) );

				indices.push( b, c, d );

				// geometry.faces.push( new THREE.Face3(  b, c, d ) );
			}else{
				indices.push( d, b, a );
				// geometry.faces.push( new THREE.Face3(  d, b, a ) );

				indices.push( d, c, b );
				// geometry.faces.push( new THREE.Face3(  d, c, b ) );
			}
		}
	}

	//console.log(vertices.length);

	geometry.setIndex(indices);
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	// geometry.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
	geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry
}

class SinusFunction{
	constructor(frequency, amplitude=1, phase=0, offset=0){
		this.frequency = frequency
		this.amplitude = amplitude
		this.phase = phase
		this.offset = offset
	}

	getValue(value){
		return Math.sin(this.frequency * value + this.phase) * this.amplitude + this.offset
	}
}

function getGeometry(type, size, material, xSin, zSin, pSin, tog, helper, mAttr, iterations, fourier) {
	var geometry;

	switch (type) {
		case 'base':
			geometry = new THREE.BoxGeometry( 2*size, size/2, 2*size );
			
			return geometry;

		case 'myCylinder':
			nLayers = 600;
			nSegments = 300;
			height = 300;
			geometry = ColumnGeometry(20, 20, height, nSegments, nLayers, 0, 2* Math.PI, xSin, zSin, pSin, tog, helper, mAttr, iterations, fourier );

			return geometry;
	}

}

function getMaterial(type, color) {
	var selectedMaterial;
	var materialOptions = {
		color: color,
		side: THREE.DoubleSide,
		//wireframe: true,
		// ***** Clipping setup (material): *****
		clippingPlanes: [ horizontalPlane ],
		clipShadows: true
	};

	switch (type) {
		case 'basic':
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
		case 'lambert':
			selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
			break;
		case 'phong':
			selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
			break;
		case 'standard':
			selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
			break;
		default: 
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
	}

	return selectedMaterial;
}

function getPointLight(intensity, color) {
	var light = new THREE.PointLight(color, intensity);
	light.castShadow = true;

	return light;
}

function getSpotLight(intensity, color) {
	color = color === undefined ? 'rgb(255, 255, 255)' : color;
	var light = new THREE.SpotLight(color, intensity);
	light.castShadow = true;
	light.penumbra = 0.5;

	//Set up shadow properties for the light
	light.shadow.mapSize.width = 1024;  // default: 512
	light.shadow.mapSize.height = 1024; // default: 512
	light.shadow.camera.near = 0.1;       // default
	light.shadow.camera.far = 500;      // default
	light.shadow.camera.fov = 30;      // default
	light.shadow.bias = 0.001;

	return light;
}

function exportSTL() {

	var result = myExporter.parse( scene, { binary: true } );
	saveArrayBuffer( result, 'column.stl' );
}

function concrete() {

	concreteTog = !(concreteTog);

	addGeo(objMaterial, true, xSin, zSin, pSin,mAttr, iterations, fourier, concreteTog)
	if (boolSlice === true){
		addSlice(geoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 0);
	}

	if (mirrorTog === true){
		addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
		if (boolSlice === true){
			addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 );
		}
	}
	

}

function rotateGeo() {

	boolRot = !(boolRot);
}

function slice() {

	boolSlice = !(boolSlice);

	console.log(columngeoBuf.getAttribute('position').array);
	helperDataSt = columngeoBuf.getAttribute('position').array;
	
	horizontalc = horizontalPlane.constant;

	layerIndex = Math.floor(600 + horizontalPlane.constant*2) ;
	// console.log(layerIndex);
	
	if (boolSlice === true){
		sliceGeometry = new THREE.Geometry();
		var sliceMaterial = new THREE.LineBasicMaterial( { color: 'rgb( 255, 255, 255)', linewidth: 1 } );
		vertex1 = new THREE.Vector3( helperDataSt[3*((layerIndex)*(nSegments)+1)]*5, helperDataSt[3*((layerIndex)*(nSegments)+1)+2]*5,0)
		for (var ka = 3*((layerIndex)*(nSegments)+1); ka < 3*(layerIndex+1)*(nSegments); ka+=3) {
			sliceGeometry.vertices.push( new THREE.Vector3( helperDataSt[ka]*5 , helperDataSt[ka+2]*5 , 0 ));
		}
		sliceGeometry.vertices.push(vertex1);
		var sliceLine = new THREE.Line( sliceGeometry, sliceMaterial );
		squareSize = 460;
		sliceLine.rotation.z = Math.PI*0.5;
		sliceLine.position.x = - w - margin + squareSize*0.5 + 48;
		sliceLine.position.z = 0;
		sliceLine.position.y = -h - margin + squareSize*0.5 + 50;
		sliceLine.name = "column"
		sceneOrtho.add(sliceLine)

		if (mirrorTog === true){
			addSlice(mirrorGeoBuf, sliceLine, sliceGeometry, 'rgb( 255, 255, 255)', 1 )
			addMirrorAxis()
		}
	}
	
	if (boolSlice === false){
		for(var i=0; i < sceneOrtho.children.length; i++){
			obj = sceneOrtho.children[i];
			if (obj.name !== 'rec'){
				sceneOrtho.remove(obj);
			}						
		}

		for(var i=0; i < sceneOrtho.children.length; i++){
			obj = sceneOrtho.children[i];
			if (obj.name !== 'rec'){
				sceneOrtho.remove(obj);
			}						
		}
	}
}


function mirror() {

	mirrorTog = !(mirrorTog);

	if (mirrorTog === true){
		addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr, iterations, fourier, concreteTog )
		if (boolSlice === true){
			addSlice(mirrorGeoBuf, sliceLine, sliceGeometry,'rgb( 255, 255, 255)', 1 )
			addMirrorAxis()
		}
	}else{
		scene.remove(mirrorGeoBuf)
		for(var i=0; i < sceneOrtho.children.length; i++){
			obj = sceneOrtho.children[i];
			if ((obj.name !== "column") && (obj.name !== "rec")){	
				sceneOrtho.remove(obj);
			}
			if (boolSlice === true){
				obj = sceneOrtho.getObjectByName("axis");
				sceneOrtho.remove(obj);
			}

		}
	}
}

function base() {

	objMaterial2 = getMaterial('lambert', 'rgb(255, 255, 255)');

	if (box === undefined){
		geoBox = getGeometry('base', 40, objMaterial2, undefined,undefined,undefined, undefined, 0, iterations);
		box = new THREE.Mesh(geoBox,objMaterial2);
		box.castShadow = true;
		box.name = 'base';
		box.position.y = -310;
		scene.add(box);
	}else{
		
		scene.remove(box);
		box = undefined;
	}
}

var link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

function save( blob, filename ) {
	link.href = URL.createObjectURL( blob );
	link.download = filename;
	link.click();
}

function saveArrayBuffer( buffer, filename ) {
	save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function update(renderer, scene, camera, controls, clock, sceneOrtho, cameraOrtho, stats) {
	// rotate camera around the origin
	var sceneCameraGroup = scene.getObjectByName('sceneCameraGroup');

	var particleSystem = scene.getObjectByName('particleSystem');
	//particleSystem.rotation.y += 0.005;

	

	if (typeof particleSystem !== 'undefined') {

		particleSystem.geometry.vertices.forEach(function(particle) {
			particle.x += (Math.random() - 1) * 0.1;
			particle.y += (Math.random() - 0.75) * 0.1;
			particle.z += (Math.random()) * 0.1;
	
			if (particle.x < -500) {
				particle.x = 500;
			}
	
			if (particle.y < -500) {
				particle.y = 500;
			}
	
			if (particle.z < -500) {
				particle.z = 500;
			}
	
			if (particle.z > 500) {
				particle.z = -500;
			}
		});
		particleSystem.geometry.verticesNeedUpdate = true;

	}
	
	if (boolRot === true){
		geoBuf.rotation.y -= 0.01;

		if (box !== undefined){
			box.rotation.y -= 0.01;
		}

		if (mirrorGeoBuf !== undefined){
			mirrorGeoBuf.rotation.y -= 0.01; 
		}
	}

	//rendering loop
	renderer.clear();
	renderer.render(scene, camera);
	renderer.clearDepth();
	renderer.render( sceneOrtho, cameraOrtho );


	controls.update();

	stats.update();

	requestAnimationFrame(function(){
        update(renderer, scene, camera, controls, clock, sceneOrtho, cameraOrtho, stats);
    })
}

var scene = init();