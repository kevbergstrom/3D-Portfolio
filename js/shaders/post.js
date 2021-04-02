function displacement(x, y) {
    return `cos(${x} * 5.0 + uTime*2.0) * 0.05`;  
}

const vert = `
varying vec2 vUv;
uniform float uTime;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
`;

const frag = `
#include <packing>

varying vec2 vUv;
uniform mat4 uProjInverse;
uniform mat4 uMatrixWorld;
uniform float uTime;
uniform float scrollY;
uniform float pixelUnits;    //3d engine units to pixels
uniform vec2 res;
uniform float cameraNear;
uniform float cameraFar;
uniform sampler2D tDepth;
uniform sampler2D tCaustic;
uniform vec3 waterColor;
uniform vec3 skyColorPrimary;
uniform vec3 skyColorSecondary;
uniform sampler2D tDiffuse2;

uniform float waveSize;

float readDepth( sampler2D depthSampler, vec2 coord ) {
    float fragCoordZ = texture2D( depthSampler, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToPerspectiveDepth( viewZ, cameraNear, cameraFar );
}

vec3 getWorldPosition( float depth){

    vec4 ndc = vec4(
        (vUv.x * 2.0) - 1.0,
        (vUv.y * 2.0) - 1.0,
        (depth * 2.0) - 1.0,
        1.0);

    vec4 clip = uProjInverse * ndc;
    vec4 view = uMatrixWorld * (clip / clip.w);
    vec3 result = view.xyz;
    
    return result;
}

void main() {

    vec4 previousPassColor = texture2D(tDiffuse2, vUv);
    gl_FragColor = previousPassColor;//vec4( previousPassColor.rgb * waterColor, previousPassColor.a);
    float unitHeight = res.y/pixelUnits;

    float screenPosY = res.y - gl_FragCoord.y + scrollY;
    float waterHeight = res.y + (${displacement(`( (vUv.x-0.5)*(res.x/res.y)*pixelUnits/10.0 )`,`(res.x/res.y)*pixelUnits`)})*-unitHeight*waveSize;   
    //why is x divided by 10.0? it wont work for any other wavelength than 5.0
    //the watershader's wavelength doesnt change while this function's wavelength does
    //I think it has something to do with the number of polygons in the water mesh

    float distanceToSurface = abs( screenPosY - waterHeight );

    float depth = readDepth( tDepth, vUv );

    float foamSize = 0.0075*unitHeight;

    vec3 worldPos = getWorldPosition(depth);       // Is this laggy?

    if(screenPosY > waterHeight-foamSize ){

        // float X = vUv.x*25.0+uTime;
        // float Y = vUv.y*25.0+uTime;
    
        // vUv.y += cos(X+Y)*0.01*cos(Y);
        // vUv.x += sin(X-Y)*0.01*sin(Y);
    
        //previousPassColor = texture2D(tDiffuse, vUv);

        //underwater fog effect
        float depthStart = 0.15;
        gl_FragColor = previousPassColor + ((vec4(waterColor, 1.0)*1.0-distanceToSurface/res.y/10.0) - previousPassColor) * (depthStart+(depth*(1.0-depthStart)));

        waterHeight = ${displacement(`( worldPos.x/10.0 )`,`( worldPos.y )`)}*unitHeight*waveSize;
        //water surface check
        if(worldPos.y > waterHeight/unitHeight){
            gl_FragColor.rgb = waterColor*0.8 + gl_FragColor.rgb*0.2;
        }

        //fake godrays effect
        float falloff = clamp((res.y*pixelUnits*1.5-distanceToSurface)/distanceToSurface, 0.0, 1.0);
        vec4 causticPoint = texture2D(tCaustic, vec2(((vUv.x-0.5)*res.x/pixelUnits/200.0)+distanceToSurface/600.0, uTime*0.2));
        gl_FragColor.rgb += causticPoint.r*0.07*falloff;

    } else {
        //foam on geometry effect
        waterHeight = ${displacement(`( worldPos.x/10.0 )`,`( worldPos.y )`)}*unitHeight*waveSize;
        distanceToSurface = abs(worldPos.y - ${displacement(`( worldPos.x/10.0 )`,`( worldPos.y )`)}*waveSize)*unitHeight;

        //mirroring
        float axis = 0.45 + (scrollY)/(res.y*10.0);
        vec2 mirror = vec2(vUv.x, 2.0*axis - vUv.y);
        previousPassColor = texture2D(tDiffuse2, mirror);

        //skybox
        if(depth == 1.0){
            vec3 skyColor = skyColorPrimary*((vUv.y*2.0)-1.0) + skyColorSecondary*((1.0-vUv.y)*2.0);
            gl_FragColor.rgb = skyColor;
            //gl_FragColor.rgb += (2.0-vUv.y*2.0);
        }

        //water surface check
        if(worldPos.y < waterHeight/unitHeight ){
            gl_FragColor.rgb = waterColor*0.8 + gl_FragColor.rgb*0.2;
            gl_FragColor += previousPassColor*0.15;
        }
    }

    //foam on window effect
    if(distanceToSurface < foamSize){
        gl_FragColor.rbg += 1.0;
    }
}
`;

export {vert, frag}