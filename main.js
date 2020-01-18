var scene, camera, myExporter, geo, geoBuf, mirrorGeoBuf, particleSystem, indexArray, nLayers, nSegments, boolRot, boolSlice;
var box, horizontalPlane, cameraOrtho, sceneOrtho, sliceLine, sliceGeometry, mirrorTog, mirrorGeo, mirrorType, axisline;
var mirrorObjMaterial;

var xSin = new function() {
	this.xfrequency = 0.02;
	this.xamplitude = 0.03;
	this.xphase = 0.03;
	this.xoffset = 0.0;
}

var zSin = new function() {
	this.zfrequency = 0.0;
	this.zamplitude = 0.0;
	this.zphase = 0.0;
	this.zoffset = 0.0;
}

var pSin = new function() {
	this.pfrequency = 5;
	this.pamplitude = 5;
	this.pphase = 0.03;
	this.poffset = 0;
}

var mAttr =new function() {
	this.mType = 0;
	this.md = 0.0;
	this.mm = 0.0;
	this.mc = 0.0;
}

mirrorTog = false;
boolSlice = false;

function addGeo(objMaterial, tog, xSin, zSin, pSin, mAttr ) {
	if ( geo !== undefined ) {
		scene.remove( geoBuf );
		//geo.geometry.dispose();
	}
	columnGeo = getGeometry('myCylinder', 5, objMaterial, xSin, zSin, pSin, tog, 0, mAttr);
	columngeoBuf = new THREE.BufferGeometry().fromGeometry( columnGeo );

	geo = new THREE.Mesh(columnGeo, objMaterial);
	geoBuf = new THREE.Mesh(columngeoBuf, objMaterial);

	geoBuf.castShadow = true;
	geoBuf.name = 'column-1';

	scene.add(geoBuf);	
}

function addMirrorGeo(mirrorObjMaterial, tog, xSin, zSin, pSin,mAttr ) {
	if ( mirrorGeoBuf !== undefined ) {
		scene.remove( mirrorGeoBuf );
		//mirrorGeo.geometry.dispose();
	}
	mirrorcolumnGeo = getGeometry('myCylinder', 5, mirrorObjMaterial, xSin, zSin, pSin, tog, 1, mAttr);
	mirrorcolumnGeoBuf = new THREE.BufferGeometry().fromGeometry( mirrorcolumnGeo );

	mirrorGeo = new THREE.Mesh(mirrorcolumnGeo,  mirrorObjMaterial);
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

	//sliceGeometry.dispose();
	//sceneOrtho.remove( sliceLine );

	helperDataSt = ch.geometry.vertices;
	horizontalc = horizontalPlane.constant;
	layerIndex = Math.floor((600 - horizontalc)/5) ;
	sliceGeometry = new THREE.Geometry();
	var sliceMaterial = new THREE.LineBasicMaterial( { color: c, linewidth: 1 } );	
	vertex1 = new THREE.Vector3( helperDataSt[(layerIndex)*(nSegments)+1].x*5, helperDataSt[(layerIndex)*(nSegments)+1].z*5,0)
	for (var ka = (layerIndex)*(nSegments)+1; ka < (layerIndex+1)*(nSegments); ka++) {
		sliceGeometry.vertices.push( new THREE.Vector3( helperDataSt[ka].x*5 , helperDataSt[ka].z*5 , 0 ));
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

	var axisMaterial = new THREE.LineDashedMaterial( {color: 0xffffff, linewidth: 1, scale: 10, dashSize: 3, gapSize: 8 } );
	var axisGeometry = new THREE.Geometry();

	if (mAttr.mType === 0){
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin, -h + margin + 0.5* squareSize + ( 5*mAttr.md), 0) );
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + squareSize , -h + margin + 0.5* squareSize + (5*mAttr.md), 0) );
		axisline = new THREE.Line( axisGeometry, axisMaterial );
	}else if(mAttr.mType === 1){
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + 0.5* squareSize - ( 5*mAttr.md), -h + margin, 0) );
		axisGeometry.vertices.push(new THREE.Vector3( -w + margin + 0.5* squareSize - ( 5*mAttr.md) , -h + margin + squareSize, 0) );
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
	//var gui = new dat.GUI({ autoPlace: false }); 
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
	horizontalPlane = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.8 );

	var folder3 = gui.addFolder('xSin');
	folder3.add(xSin, 'xfrequency', 0.1, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin,mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 );
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0);
		}

	} );
	folder3.add(xSin, 'xamplitude', 0.1, 10);
	folder3.add(xSin, 'xphase', 0, 0.5 * Math.PI);
	folder3.add(xSin, 'xoffset', 0, 3); //0.5 *z/nLayers

	folder3.open();

	var folder4 = gui.addFolder('zSin');
	folder4.add(zSin, 'zfrequency', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0);
		}

	} );
	folder4.add(zSin, 'zamplitude', 0.0, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );
	folder4.add(zSin, 'zphase', 0.0, 2 * Math.PI).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin,mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );
	folder4.add(zSin, 'zoffset', 0.0, 3).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00,  1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );

	folder4.open();

	var folder5 = gui.addFolder('pSin');
	folder5.add(pSin, 'pfrequency', 1, 10,1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );
	folder5.add(pSin, 'pamplitude', 0.1, 10).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );
	folder5.add(pSin, 'pphase', 0, Math.PI).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );
	folder5.add(pSin, 'poffset', 0, 3).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}

	} );

	folder5.open();

	var folder6 = gui.addFolder('mAttr');
	folder6.add(mAttr, 'mType', 0, 2, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}
	} );

	folder6.add(mAttr, 'md', -5, 5, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}
	} );

	folder6.add(mAttr, 'mm', 0, 5, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}
	} );

	folder6.add(mAttr, 'mc', 0, 50, 1).onChange( function () {

		addGeo(objMaterial, true, xSin, zSin, pSin, mAttr)
		if (mirrorTog === true){
			addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
			if (boolSlice === true){
				addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
				addMirrorAxis()
			}
		}
		if (boolSlice === true){
			addSlice(geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}
	} );

	folder6.open();
	test = window.innerHeight - squareSize + 110;
	gui.domElement.style.marginTop = "10px";
	gui.domElement.style.marginLeft = "1010px";
	gui2.domElement.style.marginTop = new String(test)+"px";


	// initialize objects
	objMaterial = getMaterial('lambert', 'rgb(255, 0, 0)');
	mirrorObjMaterial =  getMaterial('lambert', 'rgb(0, 255, 0)');

	addGeo(objMaterial, false, xSin, zSin, pSin, mAttr)

	var lightLeft = getSpotLight(1, 'rgb(255, 220, 180)');
	var lightRight = getSpotLight(1, 'rgb(255, 220, 180)');
	var lightBottom = getPointLight(0.33, 'rgb(255, 220, 150)');

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
			addSlice( geo, sliceLine, sliceGeometry, 0xff0000, 0)
		}
		if (mirrorTog === true){
			addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
		}
		
	} );

	myExporter.name = 'exp'
	var buttonExportStl = document.getElementById( 'exportStl' );
	buttonExportStl.addEventListener( 'click', exportSTL );

	var buttonMirror = document.getElementById( 'mirror' );
	buttonMirror.addEventListener( 'click', mirror );

	window.addEventListener( 'resize', onWindowResize, false );
	
	boolRot = false;
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
		map : new THREE.TextureLoader().load('/assets/textures/particle.jpg'),
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


function ColumnGeometry( radiusTop, radiusBottom, height, segments, heightSegments, thetaStart, thetaLength, xSin, zSin, pSin, tog, helper, mAttr ) {

	geometry = new THREE.Geometry();
	heightSegments = Math.floor( heightSegments ) ;

	// buffers

	var indices = [];
	var vertices = [];

	// helper variables

	var index = 0;
	indexArray = [];
	var halfHeight = height / 2;

	// generate geometry

	var vertex = new THREE.Vector3();

	// generate vertices

	for ( var y = 0; y <= heightSegments; y ++ ) {

		var indexRow = []; //a list to know in which row we are
		var verticesRow = []; //all the vertices per profile

		var v = y / heightSegments; //a ratio to know in which height of the cylinder we are

		// calculate the radius of the current row

		var radius = v * ( radiusBottom - radiusTop ) + radiusTop; //could be improved for more differentiation
		var deltaAngle = Math.PI * 2.0 / segments
		for ( var x = 0; x < segments; x ++ ) { //create a list of  vertices for every profile

			cAngle = x * deltaAngle

			// create the vertices of a circle

			vertex.x = radius * Math.cos(cAngle)
			currentHeight = y * (height/heightSegments);
			vertex.y = - y * (height/heightSegments);
	
			vertex.z = radius * Math.sin(cAngle);
	
			vertices.push( vertex.x, vertex.y, vertex.z );
			verticesRow.push( new THREE.Vector3(vertex.x, vertex.y, vertex.z ) );
			// save index of vertex in respective row

			indexRow.push( index ++ );
		}

		if (tog === true){

			newVertices = [];

			
			verticesRow.forEach(myFunction);

			function myFunction(vertex, index) {

				var origin = vertex.clone();
				zFreq = zSin.zfrequency;
				zAmp = zSin.zamplitude;
				zPhase = zSin.zphase;
				zOffset = 5 * vertex.y / heightSegments;
				zFunction = new SinusFunction( zFreq, zAmp, zPhase, zOffset);
				pos_z = (currentHeight/heightSegments) * 2 * Math.PI;
				mag_z = zFunction.getValue(pos_z);

				xFreq = 2;
				xAmp = 0.5;
				xPhase = 0.5*Math.PI;
				xOffset = 0.5 * vertex.y / heightSegments;
				xFunction = new SinusFunction( xFreq, xAmp, xPhase, xOffset);
				pos_x = (currentHeight/heightSegments) *2*Math.PI;
				mag_x = xFunction.getValue(pos_z);

				pFreq = pSin.pfrequency;
				pAmp = pSin.pamplitude;
				pPhase = 0.5 * mag_z;
				//pPhase = 5 ;
				pOffset = pSin.poffset;
				pFunction = new SinusFunction( pFreq, pAmp, pPhase, pOffset);
				pos_p = (index/segments)*2*Math.PI
				mag_p = pFunction.getValue(pos_p);

				magnitude = mag_p

				if (index>0) {
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

		if (helper === 1){

			newVertices2 = [];

			verticesRow.forEach(mynewFunction);

			function mynewFunction(vertex) {
				
				mirrorType = mAttr.mType ;
				d = mAttr.md ;
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

		verticesRow.forEach(function(vertex, index) {
			geometry.vertices.push( vertex );
		});

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

			indices.push( a, b, d );
			geometry.faces.push( new THREE.Face3(  d, b, a ) );
			indices.push( b, c, d );
			geometry.faces.push( new THREE.Face3(  d, c, b ) );
		}

	}

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

function getGeometry(type, size, material, xSin,zSin, pSin, tog, helper, mAttr) {
	var geometry;

	switch (type) {
		case 'base':
			geometry = new THREE.BoxGeometry( 2*size, size/2, 2*size );
			
			return geometry;

		case 'myCylinder':
			nLayers = 600;
			nSegments = 200;
			height = 300;
			geometry = ColumnGeometry(20, 20, height, nSegments, nLayers, 0, 2* Math.PI, xSin, zSin, pSin, tog, helper, mAttr );
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

function rotateGeo() {

	boolRot = !(boolRot);
}

function slice() {

	boolSlice = !(boolSlice);

	helperDataSt = geo.geometry.vertices;
	
	horizontalc = horizontalPlane.constant;
	layerIndex = Math.floor((300 + horizontalPlane.constant)/5) ;

	if (boolSlice === true){
		sliceGeometry = new THREE.Geometry();
		var sliceMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } );
		vertex1 = new THREE.Vector3( helperDataSt[(layerIndex)*(nSegments)+1].x*5, helperDataSt[(layerIndex)*(nSegments)+1].z*5,0)
		for (var ka = (layerIndex)*(nSegments)+1; ka < (layerIndex+1)*(nSegments); ka++) {
			sliceGeometry.vertices.push( new THREE.Vector3( helperDataSt[ka].x*5 , helperDataSt[ka].z*5 , 0 ));
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
			addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
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
		addMirrorGeo(mirrorObjMaterial, true, xSin, zSin, pSin, mAttr )
		if (boolSlice === true){
			addSlice(mirrorGeo, sliceLine, sliceGeometry, 0x00ff00, 1 )
			addMirrorAxis()
		}
	}else{
		scene.remove(mirrorGeoBuf)
		for(var i=0; i < sceneOrtho.children.length; i++){
			obj = sceneOrtho.children[i];
			addMirrorAxis()
			if (obj.name === "mirror") {	
				sceneOrtho.remove(obj);

			} 
		}
	}
}

function base() {

	objMaterial2 = getMaterial('lambert', 'rgb(255, 255, 255)');

	if (box === undefined){
		geoBox = getGeometry('base', 40, objMaterial2, undefined,undefined,undefined, undefined, 0);
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