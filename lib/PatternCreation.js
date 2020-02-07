function applyCrossingPattern(curves, v_thresholds, num_of_waves, amplitude, start_layer_index, cross_start_layer_index, cross_end_layer_index, end_layer_index, shift){
    
    //calculate applied_vector and move all vertices
    //v_thresholds is a list of three values for example [0.11, 0.09, 0.08]

    pattern_applied_curves = [];
    curve_points = [];
    normals = [];
    WORLD_Y = THREE.Vector3(0,1,0);
    current_shift = 2 * Math.PI;
    num_of_waves = float(num_of_waves);

    //pick which 
    applied_curves = curves.slice(start_layer_index, end_layer_index);
    number_of_curves = applied_curves.length;

    curve_index = start_layer_index

    for (curve of applied_curves){

        alpha = curve_index / float(number_of_curves);

        //decide which threshold value to use from the list
        threshold_index = int( (len (v_thresholds) -1) * alpha )

        start_v_threshold = v_thresholds[threshold_index]
        end_v_threshold = v_thresholds[threshold_index + 1]

        v_threshold = start_v_threshold * (1.0 - alpha) + end_v_threshold * alpha

        curve_index += 1

        //set a period according to number of points
        new_period = curve.getLength() / num_of_waves

        freq = 1 / new_period

        for (var i = 0; i< nSegements; i++){

            v = i/nSegments;
            p = points[i]
        
            //find a tangent Vector for this point
            tangent = curve.getTangent()
            //find the normal on this point
            normal = THREE.Vector3.crossVectors(tangent, WORLD_Y)
            normal.normalize()

            //z variation

            if (curve_index < cross_start_layer_index){
                z_multiplier = (curve_index - start_layer_index) / float(cross_start_layer_index - start_layer_index);
                z_status = 1;
            }else if ( curve_index < cross_end_layer_index){
                z_multiplier = (curve_index - cross_start_layer_index) / float(cross_end_layer_index - cross_start_layer_index);
                z_status = 2;
            }else{
                z_multiplier = (curve_index - cross_end_layer_index) / float(end_layer_index - cross_end_layer_index);
                z_status = 3;
            }
    
            pattern_status = 0;

            if (v < v_threshold){
                //apply something
                pattern_status = 1;
                taper_threshold = v_threshold * 0.1;
                alpha = 1.0;

                if (v < taper_threshold){

                    alpha = Math.sin(v / taper_threshold * math.pi * 0.5);

                }else if(v > v_threshold - taper_threshold){

                    inside = (v - v_threshold + taper_threshold) / taper_threshold * (math.pi * 0.5);
                    alpha  = Math.cos(inside);
                }                

                base_amplitude_vector = alpha * normal;

            }else if( v > 1.0 - v_threshold){
                //apply something (reversed)

                pattern_status = 2;
                tmp_v = v - (1.0 - v_threshold);
                taper_threshold = v_threshold * 0.1;
                alpha = 1.0;

                if (tmp_v < taper_threshold){
                    alpha = Math.sin(tmp_v / taper_threshold * Math.PI * 0.5)
                }else if(tmp_v > v_threshold - taper_threshold){
                    inside = (tmp_v - v_threshold + taper_threshold) / taper_threshold * (Math.PI * 0.5);
                    alpha  =  Math.cos(inside);
                }                    

                base_amplitude_vector = alpha * normal;
            }else{
                //do nothing
                base_amplitude_vector = 0 * normal;
            }

            tep = 0.2;
            if (z_multiplier < tep){

                z_multiplier = math.sin(math.pi * 0.5 * z_multiplier / tep);
            }else if(z_multiplier > 1.0 - tep){
                z_multiplier = math.sin(math.pi * 0.5 * (1.0 - z_multiplier) / tep);
            }else{
                z_multiplier = 1.0;
            }

            base_amplitude_vector *= z_multiplier

            half_amplitude_diff = amplitude * 0.5

            current_length = v * length

            applied_vector = rg.Vector3d(0, 0, 0)

            if ( (pattern_status === 1 && z_status <= 2) || (pattern_status === 2 && z_status === 2) || (pattern_status === 2 && z_status === 3)){

                base_angle = current_length * freq * math.pi
                phase = current_shift
                angle = base_angle - phase
                applied_vector += base_amplitude_vector * (half_amplitude_diff * math.sin(angle))

            }
    
            if ( (pattern_status === 2 && z_status <= 2) || (pattern_status === 1 && z_status === 2) || (pattern_status === 1 && z_status === 3)){

                base_angle = (length - current_length) * freq * math.pi
                phase = current_shift
                angle = base_angle - phase
                applied_vector += base_amplitude_vector * (half_amplitude_diff * math.sin(angle))

            }

            if (z_status === 2){
                applied_vector /= 2
            }

            //move points
            p.X += applied_vector.X
            p.Z += applied_vector.Z

        }
    }
}

function applyFacedBasedPattern(){
    //do something
}

function applyCurvatureBasedPattern(){
    //do something
}