function ColumnGeometry( radiusTop, radiusBottom, height, segments, heightSegments, thetaStart, thetaLength, xSin, zSin, pSin, tog, helper, mAttr, iterations, fourier ) {

	
	geometry = new THREE.BufferGeometry();
	heightSegments = Math.floor( heightSegments ) ;

	// buffers

	var indices = [];
	numVertices = segments * (heightSegments + 1);
	//console.log(numVertices*3);
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
				indices.push( b, c, d );

			}else{
				indices.push( d, b, a );
				indices.push( d, c, b );
				
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