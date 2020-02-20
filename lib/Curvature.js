//display curvature approximation
//used example https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_curvature.html
//concave convex values


//returns average of elements in a dictionary
function average( dict ) {

    var sum = 0;
    var length = 0;

    Object.keys( dict ).forEach( function ( key ) {

        sum += dict[ key ];
        length ++;

    } );

    return sum / length;

}

//clamp a number between min and max
function clamp( number, min, max ) {

    return Math.max( min, Math.min( number, max ) );

}

//filter the curvature array to only show concave values
function filterConcave( curvature ) {

    for ( var i = 0; i < curvature.length; i ++ ) {

        curvature[ i ] = Math.abs( clamp( curvature[ i ], - 1, 0 ) );

    }

}

//filter the curvature array to only show convex values
function filterConvex( curvature ) {

    for ( var i = 0; i < curvature.length; i ++ ) {

        curvature[ i ] = clamp( curvature[ i ], 0, 1 );

    }

}

//filter the curvature array to show both the concave and convex values
function filterBoth( curvature ) {

    for ( var i = 0; i < curvature.length; i ++ ) {

        curvature[ i ] = Math.abs( curvature[ i ] );

    }

}

//initialize the scene

function curvatureApproximation( geoBuf, cType ){

    //console.log(geoBuf);

    var dict = {};

    for ( var i = 0; i < geoBuf.geometry.attributes.position.count; i += 3 ) {

        //create a dictionary of every position, and its neighboring positions
        var array = geoBuf.geometry.getAttribute('position').array;
        var normArray = geoBuf.geometry.getAttribute('normal').array;
        //console.log(normArray);

        var posA = new THREE.Vector3( array[ 3 * i ], array[ 3 * i + 1 ], array[ 3 * i + 2 ] );
        var posB = new THREE.Vector3( array[ 3 * ( i + 1 ) ], array[ 3 * ( i + 1 ) + 1 ], array[ 3 * ( i + 1 ) + 2 ] );
        var posC = new THREE.Vector3( array[ 3 * ( i + 2 ) ], array[ 3 * ( i + 2 ) + 1 ], array[ 3 * ( i + 2 ) + 2 ] );

        var normA = new THREE.Vector3( normArray[ 3 * i ], normArray[ 3 * i + 1 ], normArray[ 3 * i + 2 ] ).normalize();
        var normB = new THREE.Vector3( normArray[ 3 * ( i + 1 ) ], normArray[ 3 * ( i + 1 ) + 1 ], normArray[ 3 * ( i + 1 ) + 2 ] ).normalize();
        var normC = new THREE.Vector3( normArray[ 3 * ( i + 2 ) ], normArray[ 3 * ( i + 2 ) + 1 ], normArray[ 3 * ( i + 2 ) + 2 ] ).normalize();

        var strA = posA.toArray().toString();
        var strB = posB.toArray().toString();
        var strC = posC.toArray().toString();

        var posB_A = new THREE.Vector3().subVectors( posB, posA );
        var posB_C = new THREE.Vector3().subVectors( posB, posC );
        var posC_A = new THREE.Vector3().subVectors( posC, posA );

        var b2a = normB.dot( posB_A.normalize() );
        var b2c = normB.dot( posB_C.normalize() );
        var c2a = normC.dot( posC_A.normalize() );

        var a2b = - normA.dot( posB_A.normalize() );
        var c2b = - normC.dot( posB_C.normalize() );
        var a2c = - normA.dot( posC_A.normalize() );

        if ( dict[ strA ] === undefined ) {

            dict[ strA ] = {};

        }
        if ( dict[ strB ] === undefined ) {

            dict[ strB ] = {};

        }
        if ( dict[ strC ] === undefined ) {

            dict[ strC ] = {};

        }

        dict[ strA ][ strB ] = a2b;
        dict[ strA ][ strC ] = a2c;
        dict[ strB ][ strA ] = b2a;
        dict[ strB ][ strC ] = b2c;
        dict[ strC ][ strA ] = c2a;
        dict[ strC ][ strB ] = c2b;

    }

    var curvatureDict = {};
    var min = 10, max = 0;

    Object.keys( dict ).forEach( function ( key ) {

        curvatureDict[ key ] = average( dict[ key ] );

    } );

    //smoothing
    var smoothCurvatureDict = Object.create( curvatureDict );

    Object.keys( dict ).forEach( function ( key ) {

        var count = 0;
        var sum = 0;
        Object.keys( dict[ key ] ).forEach( function ( key2 ) {

            sum += smoothCurvatureDict[ key2 ];
            count ++;

        } );
        smoothCurvatureDict[ key ] = sum / count;

    } );

    curvatureDict = smoothCurvatureDict;

    // fit values to 0 and 1
    Object.keys( curvatureDict ).forEach( function ( key ) {

        var val = Math.abs( curvatureDict[ key ] );
        if ( val < min ) min = val;
        if ( val > max ) max = val;

    } );

    var range = ( max - min );


    Object.keys( curvatureDict ).forEach( function ( key ) {

        var val = Math.abs( curvatureDict[ key ] );
        if ( curvatureDict[ key ] < 0 ) {

            curvatureDict[ key ] = ( min - val ) / range;

        } else {

            curvatureDict[ key ] = ( val - min ) / range;

        }

    } );

    curvatureAttribute = new Float32Array( geoBuf.geometry.attributes.position.count );

    for ( var i = 0; i < geoBuf.geometry.attributes.position.count; i ++ ) {

        array = geoBuf.geometry.attributes.position.array;
        var pos = new THREE.Vector3( array[ 3 * i ], array[ 3 * i + 1 ], array[ 3 * i + 2 ] );
        var str = pos.toArray().toString();
        curvatureAttribute[ i ] = Math.abs(curvatureDict[ str ]);
        

    }

    geoBuf.geometry.setAttribute( 'curvature', new THREE.BufferAttribute( curvatureAttribute, 1 ) );

    //starting filter is to show both concave and convex
    var curvatureFiltered = new Float32Array( curvatureAttribute );

    if (cType === "both"){
        filterBoth( curvatureFiltered );
    }else if( cType === "concave"){
        filterConvex(  curvatureFiltered );
    }else if( cType === "convex"){
		filterConvex(  curvatureFiltered );
    }

    geoBuf.geometry.attributes.curvature.array = curvatureFiltered;
    geoBuf.geometry.attributes.curvature.needsUpdate = true;
    
    console.log(curvatureFiltered.length);
    max = Math.max(...curvatureFiltered);
    min = Math.min(...curvatureFiltered);

    //console.log(geoBuf.geometry.getAttribute("curvature").array)

    return [geoBuf, min, max];
}