import * as THREE from '../three/build/three.module.js';
import {EffectComposer} from '../three/examples/jsm/postprocessing/EffectComposer.js';
import {ShaderPass} from '../three/examples/jsm/postprocessing/ShaderPass.js';
import {FXAAShader} from '../three/examples/jsm/shaders/FXAAShader.js';
import {BufferGeometryUtils} from '../three/examples/jsm/utils/BufferGeometryUtils.js'

import loadAssets from './assetLoader.js'
import treeData from '../assets/models/trees.js';
import * as PostShader from './shaders/post.js';
import {generateOptions} from './options.js';
import daytime from './daytime.js'
import configs from '../config/config.js'

function degToRad(deg){
    return deg * Math.PI/180;
}

function main(){
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({
        canvas, 
        antialias: false, 
        alpha: false,
        stencil: false,
        depth: false,
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.toneMappingExposure = 1.25;

    //for phones with large pixel ratios
    //renderer.setPixelRatio(Math.min(renderer.getPixelRatio(), 2));
    renderer.setPixelRatio(1);

    if(renderer.getPixelRatio() > 1){ configs.fxaa = false };

    //how can I measure performance?

    // Create the camera
    const fov = configs.fov;
    const aspect = 2;
    const near = configs.near;
    const far = configs.far; //should this be lower?
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    const startingY = configs.cameraPosition[1];
    camera.position.set(...configs.cameraPosition);

    let frustumHeight = 2*near*Math.tan(degToRad(fov*0.5));

    // Create the scene so we can place stuff in it
    const scene = new THREE.Scene();

    // time uniform for shaders
    let uTime = {value: 0.0};

    const textures = {
        caustic: {url: '../assets/textures/caustics.jpg' },
    }
    const fonts = { ...configs.fonts }
    const models = {
        lowPolyLake: {url: '../assets/models/lpLake.gltf'},
        lowPolyTree: {url: '../assets/models/lpTree.gltf'},
        lowPolyRocks: {url: '../assets/models/lpRocks.gltf'},
        lowPolyMountain: {url: '../assets/models/lpMountain.gltf'},
        lowPolyCabin: {url: '../assets/models/lpCabin.gltf'},
    }

    THREE.DefaultLoadingManager.onLoad = init
    THREE.DefaultLoadingManager.onError = loadError
    THREE.DefaultLoadingManager.onProgress = loadProgress

    loadAssets({textures, fonts, models});

    let animFrame = 0;

    function loadProgress(url, itemsLoaded, itemsTotal){
        document.getElementById('loadingBar').style.width = `${100*itemsLoaded/itemsTotal}%`;
    }

    function loadError(url){
        let elements = document.getElementsByClassName('noBack')
        for(let i = 0;i<elements.length;i++){
            elements[i].classList.remove("noBack");
        }

        //stop the screen from rendering
        cancelAnimationFrame(animFrame);
        document.getElementById('loadScreenError').innerHTML = `Error: Couldn't load file ${url}`;
        document.getElementById('optionButtons').remove();
        //document.getElementById('loadScreen').remove();
    }

    //name text
    const worldText = new THREE.Object3D();
    worldText.position.set(...configs.landingText.position);
    scene.add(worldText);

    //adding assets that needed to be loaded
    function init(){
        function getModelMeshes(model, meshes, materials){
            model.children.forEach( child => {
                if(child.type === "Mesh"){
                    let geo = child.geometry;

                    geo.translate(model.position.x, model.position.y, model.position.z);
                    geo.translate(child.position.x, child.position.y, child.position.z);
                    geo.rotateX(child.rotation.x);
                    geo.rotateY(child.rotation.y);
                    geo.rotateZ(child.rotation.z);

                    meshes.push(geo);
                    materials.push(child.material)
                }else if(child.type === "Group"){
                    model = child;
                }
                getModelMeshes(child, meshes, materials);
            } );
        }

        function createMergedMesh(model){
            let meshes = [];
            let materials = [];
            getModelMeshes(model, meshes, materials);
    
            // let geo = new THREE.BufferGeometry();
            let mergedGeo = BufferGeometryUtils.mergeBufferGeometries(meshes);
            let mergedMesh = new THREE.Mesh(mergedGeo, materials[0]);
            return mergedMesh;
        }

        const lake = models.lowPolyLake.gltf.scene;
        const mergedLake = createMergedMesh(lake);
        mergedLake.matrixAutoUpdate = false;
        scene.add(mergedLake);

        const rocks = models.lowPolyRocks.gltf.scene;
        const mergedRocks = createMergedMesh(rocks);
        mergedRocks.matrixAutoUpdate = false;
        scene.add(mergedRocks);

        const cabin = models.lowPolyCabin.gltf.scene;
        const mergedCabin = createMergedMesh(cabin);
        mergedCabin.matrixAutoUpdate = false;
        scene.add(mergedCabin);

        const mountain = models.lowPolyMountain.gltf.scene;
        const mergedMountain = createMergedMesh(mountain);
        mergedMountain.matrixAutoUpdate = false;
        scene.add(mergedMountain);

        //instancing trees
        const _trunkMesh = models.lowPolyTree.gltf.scene.getObjectByName( 'trunk' );
        const _treeMesh = models.lowPolyTree.gltf.scene.getObjectByName( 'tree' );
    
        let trunkGeo = _trunkMesh.geometry.clone();
        let treeGeo = _treeMesh.geometry.clone();
    
        let trunkMat = _trunkMesh.material;
        let treeMat = _treeMesh.material;
    
        let trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeData.length);
        let treeMesh = new THREE.InstancedMesh(treeGeo, treeMat, treeData.length);
    
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        
        for(let i = 0; i < treeData.length; i++){
            const tree = treeData[i];
    
            let matrix = new THREE.Matrix4();
    
            const position = new THREE.Vector3(...tree.translation);
            const scale = new THREE.Vector3(...tree.scale);
            //quaternion.setFromEuler( rotation );
    
            matrix.compose( position, quaternion, scale );
    
            trunkMesh.setMatrixAt(i, matrix);
            treeMesh.setMatrixAt(i, matrix);
        }
    
        trunkMesh.matrixAutoUpdate = false;
        treeMesh.matrixAutoUpdate = false;

        scene.add(trunkMesh);
        scene.add(treeMesh); 

        let textMat = new THREE.MeshBasicMaterial({
            ...configs.landingText.material
        });

        //fonts stuff
        let nameConfig = configs.landingText.name;
        const nameGeo = new THREE.TextBufferGeometry(nameConfig.text, {
            ...nameConfig,
            font: fonts[nameConfig.font].font
        })

        nameGeo.translate(0.0, configs.landingText.start, 0.0);
    
        let titleConfig = configs.landingText.title;
        const titleGeo = new THREE.TextBufferGeometry(titleConfig.text, {
            ...titleConfig,
            font: fonts[titleConfig.font].font
        })

        const nameMesh = new THREE.Mesh(nameGeo, textMat);
        nameMesh.geometry.computeBoundingBox();
        const nameSize = nameMesh.geometry.boundingBox.max.y - nameMesh.geometry.boundingBox.min.y;

        titleGeo.translate(0.0, configs.landingText.start-nameSize+0.12, 0.0);

        let mergedGeo = BufferGeometryUtils.mergeBufferGeometries([nameGeo, titleGeo]);
        let mergedMesh = new THREE.Mesh(mergedGeo, textMat);
        mergedMesh.matrixAutoUpdate = false;
        worldText.add(mergedMesh);

        const planeGeo = new THREE.PlaneBufferGeometry(100,50,1);
        const planeMesh = new THREE.Mesh(planeGeo, textMat);
        planeMesh.rotation.set(degToRad(90),0,0);
        planeMesh.position.set(0,-5,-20);
        scene.add(planeMesh);

        //start rendering after everything is loaded
        timeOfDay = configs.timeOfDay;
        setTimeOfDay(timeOfDay);
        requestAnimationFrame(render);

        document.getElementById('fallbackFront').style.display = 'none';
        document.getElementById('fallbackScreen').style.display = 'none';
        document.getElementById('loadScreen').remove();
    }

    let causticTexture = textures.caustic.texture;
    causticTexture.wrapS = THREE.RepeatWrapping;
    causticTexture.wrapT = THREE.RepeatWrapping;

    let lightTarget = new THREE.Object3D();
    lightTarget.position.set(5,-5,-5);
    scene.add(lightTarget);

    // sun lamp
    const dirLight = new THREE.DirectionalLight( 0xffe38b, 6.5 );
    dirLight.position.set( 15, 20.5, 18 );
    dirLight.target = lightTarget;
    scene.add( dirLight );

    const light = new THREE.AmbientLight( 0xff0000, 0.8 );
    scene.add( light );

    // Depth buffer
    const depthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
    depthTarget.texture.format = THREE.RGBFormat;
    depthTarget.texture.minFilter = THREE.NearestFilter;
    depthTarget.texture.magFilter = THREE.NearestFilter;
    depthTarget.texture.generateMipmaps = false;
    depthTarget.stencilBuffer = false;
    depthTarget.depthBuffer = true;
    depthTarget.depthTexture = new THREE.DepthTexture();
    depthTarget.depthTexture.type = THREE.UnsignedShortType;
    
    let waveSize = {value: 1.0};
    let waterColor = { value: new THREE.Color(0x0082FF) };
    let showDepth = false;

    const postProc = {
        uniforms: {
            uTime,
            scrollY: { value: 0.0 },
            pixelUnits: { value: frustumHeight },
            res: {type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
            cameraNear: {value: near},
            cameraFar: {value: far},
            tDepth: {type: 't', value: depthTarget.depthTexture},
            showDepth: {value: showDepth},
            tCaustic: {type: 't', value: causticTexture},
            uProjInverse: { value: camera.projectionMatrixInverse},
            uMatrixWorld: { value: camera.matrixWorld},
            waterColor,
            skyColorPrimary: { value: new THREE.Color(0x2795FF) },
            skyColorSecondary: { value: new THREE.Color(0x27EEFF) },
            waveSize,
            tDiffuse2: { value: null },
        },  
        vertexShader: PostShader.vert,
        fragmentShader: PostShader.frag,
    }

    const postShader = new ShaderPass(postProc);
    postShader.uniforms.uTime = uTime;
    // have to set the shader's uniforms texture after it is created
    postShader.uniforms.tCaustic.value = causticTexture;

    // fxaa antialiasing 
    let effectFXAA = new ShaderPass( FXAAShader );
    let pixelRatio = renderer.getPixelRatio();
    // effectFXAA.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
    // effectFXAA.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );
    effectFXAA.material.uniforms[ 'resolution' ].value.x = 1 / ( canvas.width );
    effectFXAA.material.uniforms[ 'resolution' ].value.y = 1 / ( canvas.height );

    const composer = new EffectComposer(renderer);
    composer.addPass(postShader);

    if(configs.fxaa){
        composer.addPass( effectFXAA );
    }

    let timeOfDay = 12;

    function setTimeOfDay(time){
            timeOfDay = parseFloat(time);
            let skyColors = daytime.getSkyColorAtTime(timeOfDay);
            postShader.uniforms.skyColorPrimary.value = new THREE.Color(skyColors.primary);
            postShader.uniforms.skyColorSecondary.value = new THREE.Color(skyColors.secondary);
            dirLight.color = new THREE.Color(skyColors.light);
            dirLight.position.set( Math.abs(Math.sin(3.14*(time-6)/12))*15, Math.sin(3.14*time/24)*20, 18 );
            updateDepthBuffer()
    }

    let options = [
        {
            data: false,
            title: 'Basic View',
            update: (e => {
                if(e == true){
                    cancelAnimationFrame(animFrame);
                    renderer.clear();
                    document.getElementById('fallbackFront').style.display = 'flex';
                    document.getElementById('fallbackScreen').style.display = 'inline';
                }else{
                    requestAnimationFrame(render);
                    document.getElementById('fallbackFront').style.display = 'none';
                    document.getElementById('fallbackScreen').style.display = 'none';
                }
            }),
        },
        {
            data: timeOfDay,
            title: 'Time',
            show: true,
            min: 0,
            max: 24,
            step: 0.01,
            describe: (e => `${daytime.valueToTime(parseFloat(e))}`),
            update: setTimeOfDay,
        },
        // {
        //     data: waveSize.value,
        //     title: 'Wave Size',
        //     show: true,
        //     min: 0,
        //     max: 50,
        //     step: 0.1,
        //     update: (e => {postShader.uniforms.waveSize.value = e}),
        // },
        // {
        //     data: waterColor.value,
        //     title: 'Water Color',
        //     type: 'color',
        //     show: true,
        //     min: 0,
        //     max: 360,
        //     step: 0.1,
        //     update: (e => {postShader.uniforms.waterColor.value = new THREE.Color(`hsl(${e}, 54%, 43%)`)}),
        // },
        {
            data: configs.fxaa,
            title: 'Antialiasing',
            update: (e => e? composer.addPass( effectFXAA ) :  
                             composer.removePass( effectFXAA ))
        },
        {
            data: showDepth,
            title: 'Depth Map',
            update: (e => {
                showDepth = e
                postShader.uniforms.showDepth.value = showDepth
            })
        },
    ]

    generateOptions(options, 'optionForms');

    function resizeRendererToDisplaySize(renderer){
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== Math.floor(width*pixelRatio) || 
                            canvas.height !== Math.floor(height*pixelRatio);
        if(needResize){
            renderer.setSize(width, height, false);
            frustumHeight = 2*near*Math.tan(degToRad(fov*0.5));
        }
        return needResize;
    }

    function updateDepthBuffer(){
        renderer.setRenderTarget(depthTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);

        postShader.uniforms.scrollY.value = scrollY;
        postShader.uniforms.tDepth.value = depthTarget.depthTexture;
        postShader.uniforms.tDiffuse2.value = depthTarget.texture;
        postShader.uniforms.uMatrixWorld.value.copy(camera.matrixWorld);
    }

    let prev = 0;
    let scrollY = 1;

    // function logStats(){
    //     console.log(composer)
    //     console.log("Scene polycount:", renderer.info.render.triangles)
    //     console.log("Active Drawcalls:", renderer.info.render.calls)
    //     console.log("Textures in Memory", renderer.info.memory.textures)
    //     console.log("Geometries in Memory", renderer.info.memory.geometries)
    // }
    // logStats();

    function render(now){
        now *= 0.001;
        const delta = now - prev;
        prev = now;

        uTime.value = now;

        // fixes bluriness and distortion
        if(resizeRendererToDisplaySize(renderer)){
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            composer.setSize(canvas.width, canvas.height);

            scrollY = window.scrollY;
            camera.position.y = frustumHeight/2 - scrollY*(frustumHeight/window.innerHeight) + startingY;

            if(camera.aspect < 0.5){
                worldText.scale.set(0.75,0.75,0.75);
            } else {
                worldText.scale.set(1,1,1);
            }

            postShader.uniforms.pixelUnits.value = frustumHeight;
            postShader.uniforms.res.value.x = canvas.width;
            postShader.uniforms.res.value.y = canvas.height;
            postShader.uniforms.uProjInverse.value.copy(camera.projectionMatrixInverse);

            effectFXAA.material.uniforms[ 'resolution' ].value.x = 1 / ( canvas.width );
            effectFXAA.material.uniforms[ 'resolution' ].value.y = 1 / ( canvas.height );
            
            depthTarget.setSize(canvas.width, canvas.height);
            updateDepthBuffer();
        }

        if(scrollY != window.scrollY){
            scrollY = window.scrollY;

            // Convert pixels to 3js units
            camera.position.y = frustumHeight/2 - scrollY*(frustumHeight/window.innerHeight) + startingY;
            updateDepthBuffer();
        }

        composer.render(delta);
        
        animFrame = requestAnimationFrame(render);
    }
}
main();