//display overhang approximation


//initialize the scene

function overhangApproximation( geoBuf ){

    //console.log(geoBuf);


    var overhangDict = {};

    for ( var i = 0; i < geoBuf.geometry.attributes.position.count; i += 1 ) {

        //create a dictionary of every position, and its neighboring positions
        var array = geoBuf.geometry.getAttribute('position').array;
        var normArray = geoBuf.geometry.getAttribute('normal').array;
        //console.log(normArray);


        var posA = new THREE.Vector3( array[ 3 * i ], array[ 3 * i + 1 ], array[ 3 * i + 2 ] );

        var normA = new THREE.Vector3( normArray[ 3 * i ], normArray[ 3 * i + 1 ], normArray[ 3 * i + 2 ] ).normalize();

        var strA = posA.toArray().toString();

        worldY = new THREE.Vector3(0,1,0);

        // overhangDict[ strA  ] = Math.abs(normA.y);
        // var angle = normA.angleTo(worldY);
        var prod = normA.dot(worldY);

        // if (angle>0){
        //     overhangDict[ strA ] = Math.PI/2 - angle;
        // }else{
        //     overhangDict[ strA ] = Math.PI/2 + angle;
        // }
        overhangDict[ strA ] = Math.abs(prod)
        
    }

    //console.log(overhangDict);

    overhangAttribute = new Float32Array( geoBuf.geometry.attributes.position.count );

    for ( var i = 0; i < geoBuf.geometry.attributes.position.count; i ++ ) {

        array = geoBuf.geometry.attributes.position.array;
        var pos = new THREE.Vector3( array[ 3 * i ], array[ 3 * i + 1 ], array[ 3 * i + 2 ] );
        var str = pos.toArray().toString();
        overhangAttribute[ i ] = overhangDict[ str ];
        //console.log(overhangDict[ str ]);

    }

    geoBuf.geometry.setAttribute( 'overhang', new THREE.BufferAttribute( overhangAttribute, 1 ) );

    var overhangFiltered = new Float32Array( overhangAttribute );
    max = Math.max(...overhangFiltered);
    min = Math.min(...overhangFiltered);

    console.log(overhangFiltered.length);
    console.log(max);
    console.log(min);

    geoBuf.geometry.attributes.overhang.array = overhangFiltered;
	geoBuf.geometry.attributes.overhang.needsUpdate = true;

    //console.log(geoBuf.geometry.getAttribute("overhang").array)

    return [geoBuf, min, max];
}