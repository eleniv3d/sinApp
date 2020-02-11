function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
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

function applySimplePattern(verticesRow, l, pSin, zSin){

    newVertices = [];
				
    verticesRow.forEach(myFunction);

    function myFunction(vertex, index) {

        var origin = vertex.clone();

        zFreq = zSin.zfrequency ;
        zAmp = zSin.zamplitude  ;
        zPhase = zSin.zphase;
        zOffset = zSin.zoffset * vertex.y / 600;
        zFunction = new SinusFunction( zFreq, zAmp, zPhase, zOffset);
        pos_z = (vertex.y / 600) * 2 * Math.PI;
        mag_z = zFunction.getValue(pos_z);
 

        pFreq = pSin.pfrequency * 3;
        pAmp = 1;
        //pPhase = pSin.pphase * mag_z;
        pOffset = pSin.poffset;

        pPhase = 0;
        //pPhase = l * Math.PI/24


        pFunction = new SinusFunction( pFreq, pAmp, pPhase, pOffset);
        pos_p = (index/verticesRow.length)*2*Math.PI;
        mag_p = pFunction.getValue(pos_p);

        magnitude = mag_p
        // if (fourier.bool === "true"){

        //     //SinFourier(val,freq,amp,phase,ite)

        //     pSinFourier = SinFourier(pos_p , pFreq, pAmp, pPhase, fourier.ite);
        //     magnitude = pSinFourier;
        // }

        if (index > 0) {
                iPrev = (index-1);
            } else {
                iPrev = verticesRow.length - 1
        }
        
        iNext = (index+1)%(verticesRow.length);
        //console.log(index, iPrev, iNext);
        v0 = verticesRow[iPrev].clone();
        v2 = verticesRow[iNext].clone();

        nvec = normalVertex2D( v0, vertex, v2);
        nvec.multiplyScalar(magnitude);

        //origin.add(nvec)

        if (l%2 === 0){
            origin.add(nvec) //move the vertice by the calculated vector
        }else{
            nvec.setX( -nvec.x)
            nvec.setZ( -nvec.z)
            // newvec = new THREE.Vector3().St
            origin.add(nvec) //move the vertice by the calculated vector
        }
        
        newVertices.push( origin );
    }
    verticesRow = newVertices;
    
    return verticesRow
}

function applySimpleNoise(verticesRow, l){

    newVertices = [];
    
    deltaAngle = Math.PI * 2.0 / verticesRow.length;
    NoiseMaxy = 2 * Math.sin( 0.02 * verticesRow[0].y);
    NoiseMaxx = 2 * Math.sin( 0.02 * verticesRow[0].y);

    verticesRow.forEach(myFunction);

    function myFunction(vertex, index) {

        var origin = vertex.clone();
        cAngle = index * deltaAngle;
        xoff = map_range( Math.cos(5*cAngle), -1, 1, 0, NoiseMaxx)
        yoff = map_range( Math.sin(5*cAngle), -1, 1, 0, NoiseMaxy)

        value = noise.simplex2(xoff,yoff)
        magnitude = map_range(value, 0, 1, 0.8, 2);
        //console.log(magnitude);

        if (index > 0) {
                iPrev = (index-1);
            } else {
                iPrev = verticesRow.length - 1
        }
        
        iNext = (index+1)%(verticesRow.length);
        //console.log(index, iPrev, iNext);
        v0 = verticesRow[iPrev].clone();
        v2 = verticesRow[iNext].clone();

        nvec = normalVertex2D( v0, vertex, v2);
        nvec.multiplyScalar(magnitude);

        origin.add(nvec);

        // if (l%2 === 0){
        //     origin.add(nvec) //move the vertice by the calculated vector
        // }else{
        //     nvec.setX( -nvec.x)
        //     nvec.setZ( -nvec.z)
        //     // newvec = new THREE.Vector3().St
        //     origin.add(nvec) //move the vertice by the calculated vector
        // }
        newVertices.push( origin );
    }
    verticesRow = newVertices;
    
    return verticesRow
}

function applyCrossingPattern(curves, v_thresholds, num_of_waves, amplitude, start_layer_index, cross_start_layer_index, cross_end_layer_index, end_layer_index, shift){
    
    //v_thresholds is a list of three values for example [0.11, 0.09, 0.08]

    // pattern_applied_curves = [];
    // curve_points = [];
    // normals = [];

    // WORLD_Y = new THREE.Vector3(0,1,0);
    // current_shift = 2 * Math.PI;
    // //num_of_waves = float(num_of_waves);

    // //pick which 
    // applied_curves = curves.slice(start_layer_index, end_layer_index);
    // number_of_curves = applied_curves.length;

    // curve_index = start_layer_index

    // for (curve of applied_curves){

    //     alpha = curve_index / number_of_curves;
    //     //console.log(alpha);

    //     //decide which threshold value to use from the list
    //     threshold_index = Math.floor( (v_thresholds.length -1) * alpha );
    //     //console.log(threshold_index);
    //     start_v_threshold = v_thresholds[threshold_index];
    //     end_v_threshold = v_thresholds[threshold_index + 1];

    //     v_threshold = start_v_threshold * (1.0 - alpha) + end_v_threshold * alpha;
    //     //console.log(v_threshold);
    //     curve_index += 1

    //     //set a period according to number of points
    //     new_period = curve.getLength() / num_of_waves;
    //     //console.log(new_period);
    //     freq = 1 / new_period;
    //     points = curve.points;

    //     for (var i = 0; i< 200; i++){

    //         v = i/200.0;
    //         p = points[i]
        
    //         //find a tangent Vector for this point
    //         tangent = curve.getTangent(v)
    //         normal = new THREE.Vector3().crossVectors(tangent, WORLD_Y)
    //         normal.normalize()

    //         //z variation

    //         if (curve_index < cross_start_layer_index){
    //             z_multiplier = (curve_index - start_layer_index) / (cross_start_layer_index - start_layer_index);
    //             z_status = 1;
    //         }else if ( curve_index < cross_end_layer_index){
    //             z_multiplier = (curve_index - cross_start_layer_index) / (cross_end_layer_index - cross_start_layer_index);
    //             z_status = 2;
    //         }else{
    //             z_multiplier = (curve_index - cross_end_layer_index) / (end_layer_index - cross_end_layer_index);
    //             z_status = 3;
    //         }
    
    //         pattern_status = 0;

    //         if (v < v_threshold){
    //             //apply something
    //             pattern_status = 1;
    //             taper_threshold = v_threshold * 0.1;
    //             alpha = 1.0;

    //             if (v < taper_threshold){

    //                 alpha = Math.sin(v / taper_threshold * Math.PI * 0.5);

    //             }else if(v > v_threshold - taper_threshold){

    //                 inside = (v - v_threshold + taper_threshold) / taper_threshold * ( Math.PI * 0.5);
    //                 alpha  = Math.cos(inside);
    //             }                

    //             base_amplitude_vector = alpha * normal;

    //         }else if( v > 1.0 - v_threshold){
    //             //apply something (reversed)

    //             pattern_status = 2;
    //             tmp_v = v - (1.0 - v_threshold);
    //             taper_threshold = v_threshold * 0.1;
    //             alpha = 1.0;

    //             if (tmp_v < taper_threshold){
    //                 alpha = Math.sin(tmp_v / taper_threshold * Math.PI * 0.5)
    //             }else if(tmp_v > v_threshold - taper_threshold){
    //                 inside = (tmp_v - v_threshold + taper_threshold) / taper_threshold * (Math.PI * 0.5);
    //                 alpha  =  Math.cos(inside);
    //             }                    

    //             base_amplitude_vector = alpha * normal;
    //         }else{
    //             //do nothing
    //             base_amplitude_vector = 0 * normal;
    //         }

    //         tep = 0.2;
    //         if (z_multiplier < tep){

    //             z_multiplier = Math.sin(Math.PI * 0.5 * z_multiplier / tep);
    //         }else if(z_multiplier > 1.0 - tep){

    //             z_multiplier = Math.sin(Math.PI * 0.5 * (1.0 - z_multiplier) / tep);
    //         }else{
                
    //             z_multiplier = 1.0;
    //         }

    //         base_amplitude_vector *= z_multiplier;

    //         half_amplitude_diff = amplitude * 0.5;

    //         current_length = v * length;

    //         var applied_vector = new THREE.Vector3(0,0,0);

    //         if ( (pattern_status === 1 && z_status <= 2) || (pattern_status === 2 && z_status === 2) || (pattern_status === 2 && z_status === 3)){

    //             base_angle = current_length * freq * Math.PI;
    //             phase = current_shift;
    //             angle = base_angle - phase;
    //             applied_vector += base_amplitude_vector * (half_amplitude_diff * Math.sin(angle));

    //         }
    
    //         if ( (pattern_status === 2 && z_status <= 2) || (pattern_status === 1 && z_status === 2) || (pattern_status === 1 && z_status === 3)){

    //             base_angle = (length - current_length) * freq * Math.PI;
    //             phase = current_shift;
    //             angle = base_angle - phase;
    //             applied_vector += base_amplitude_vector * (half_amplitude_diff * Math.sin(angle));
    //         }

    //         if (z_status === 2){
    //             applied_vector /= 2;
    //         }

    //         points[i].x += applied_vector.x
    //         points[i].z += applied_vector.z

    //     }
        
    //     current_shift += shift
    // }
}

function applyFacedBasedPattern(){
    //do something
}

function applyCurvatureBasedPattern(){
    //do something
}