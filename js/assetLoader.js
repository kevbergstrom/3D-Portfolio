import * as THREE from '../three/build/three.module.js';
import {TTFLoader} from '../three/examples/jsm/loaders/TTFLoader.js';
import {GLTFLoader} from '../three/examples/jsm/loaders/GLTFLoader.js';

function loadAssets(data){
    const {textures, fonts, models} = data;
    if(textures){ loadTextures(textures) };
    if(fonts){ loadFonts(fonts) };
    if(models){ loadModels(models) };
}

function loadTextures(textures){
    const textureLoader = new THREE.TextureLoader();
    for(const obj of Object.values(textures)){
        obj.texture = textureLoader.load(obj.url);
    }
}

function loadFonts(fonts){
    const ttfLoader = new TTFLoader();
    const fontLoader = new THREE.FontLoader();
    for(const obj of Object.values(fonts)){
        ttfLoader.load(obj.url, (data) =>{
            obj.font = fontLoader.parse(data);
        })
    }
}

function loadModels(models){
    const loader = new GLTFLoader();
    for(const obj of Object.values(models)){
        loader.load(obj.url, (gltf) =>{
            obj.gltf = gltf;
        })
    }
}

export default loadAssets