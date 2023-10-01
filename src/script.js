import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pane } from 'tweakpane';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

/**
 * Base
 */
// GLTF loader
const gltfLoader = new GLTFLoader()

// Debug
const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

const fpsGraph = pane.addBlade({
    view: 'fpsgraph',
    label: 'fpsgraph',
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/***
 *  Lights
 */

// set of 6 point lights

// let lightDistance = 20
// // Add lights to the scene from all directions
// const light1 = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// light1.position.set(0, 0, lightDistance);
// scene.add(light1);
// const lightb = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// lightb.position.set(0, 0, -lightDistance);
// scene.add(lightb);

// const light2 = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// light2.position.set(0, lightDistance, 0);
// scene.add(light2);

// const light3 = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// light3.position.set(lightDistance, 0, 0);
// scene.add(light3);

// const light4 = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// light4.position.set(0, -lightDistance, 0);
// scene.add(light4);

// const light5 = new THREE.PointLight(0xffffff, 0.3, 0, 2);
// light5.position.set(-lightDistance, 0, 0);
// scene.add(light5);


// const sphereSize = 1;
// const pointLightHelper1 = new THREE.PointLightHelper( light1, sphereSize );
// const pointLightHelper2 = new THREE.PointLightHelper( light2, sphereSize );
// const pointLightHelper3 = new THREE.PointLightHelper( light3, sphereSize );
// const pointLightHelper4 = new THREE.PointLightHelper( light4, sphereSize );
// const pointLightHelper5 = new THREE.PointLightHelper( light5, sphereSize );
// const pointLightHelperb = new THREE.PointLightHelper( lightb, sphereSize );
// scene.add( pointLightHelper1, pointLightHelper2, pointLightHelper3, pointLightHelper4, pointLightHelper5, pointLightHelperb );



// lighting using environment maps
let tex = new THREE.CubeTextureLoader().load([
    '0/px.jpg',
    '0/nx.jpg',
    '0/py.jpg',
    '0/ny.jpg',
    '0/pz.jpg',
    '0/nz.jpg',
])
/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 7
camera.position.x = 4
camera.position.y = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// controls.dampingFactor = 0.04
// controls.minDistance = 5
// controls.maxDistance = 60
// controls.enableRotate = true
// controls.enableZoom = true
// controls.maxPolarAngle = Math.PI /2.5

/**
 *  Model
 */

// // Texture Loader
// const textureLoader = new THREE.TextureLoader()
// const bakedTexture = textureLoader.load('any.jpg')
// bakedTexture.flipY = false
// bakedTexture.encoding = THREE.sRGBEncoding


// // Material
// const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture})

// let model;
// gltfLoader.load(
//     'DeskTop.glb',
//     (gltf) => {

//         //for singular object scene only
//         // gltf.scene.traverse((child) => {
//         //     child.material = bakedMaterial
//         // })

//         // Target's specific object only to apply textures
//         screenMesh = gltf.scene.children.find((child) => {
//             return child.name === 'any'
//         })

//         model = gltf.scene
//         model.scale.set(0.5, 0.5, 0.5) 

//         model = gltf.scene;
//         scene.add(model)
//     }
// )

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x18142c, 1);


/**
 *  Gui 
 */
const params = { color: '#ffffff' };

// add a folder for the scene background color
const folder = pane.addFolder({ title: 'Background Color' });

folder.addInput(params, 'color').on('change', () => {
    const color = new THREE.Color(params.color);
    scene.background = color;
});

// For Tweaking Numbers

// // add a number input to the pane
// const params2 = {value: 1};
// const numberInput = pane.addInput(params2, 'value', {
//   min: 1,
//   max: 5,
//   step: 0.001,
// });

// // update the number value when the input value changes
// numberInput.on('change', () => {
//   console.log(`Number value updated to ${params2.value}`);
// });

////////////// Color Strip /////////////////
const colorStrip = document.getElementById("strip");
const ctx = colorStrip.getContext("2d");

const gradient = ctx.createLinearGradient(0, 0, 0, colorStrip.height);
gradient.addColorStop(0, "red");
gradient.addColorStop(0.5, "yellow");
gradient.addColorStop(1, "blue");

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, colorStrip.width, colorStrip.height);

////

//// Attempt 3


const batteryGroup = new THREE.Group();

function create() {
    batteryGroup.clear()
    //getting values from user
    const xDim = parseInt(document.getElementById("x-dim").value);
    const yDim = parseInt(document.getElementById("y-dim").value);
    const zDim = parseInt(document.getElementById("z-dim").value);

    // Define the battery pack as a group of cylinder meshes
    const cellRadius = 0.5;
    const cellHeight = 2;
    const cellSpacing = 0.15;
    const numCellsX = xDim;
    const numCellsY = yDim;
    const numCellsZ = zDim;

    let cell, batteryCap;

    let cellID = 0
    for (let layer = 1; layer <= numCellsZ; layer++) {
        for (let row = 1; row <= numCellsY; row++) {
            cellID+=1
            for (let col = 1; col <= numCellsX; col++) {
                cell = new THREE.Mesh(new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 32));
                cell.name = `cell${cellID}`
                cell.position.set(
                    col * (cellRadius * 2 + cellSpacing) - numCellsX / 2 * (cellRadius * 2 + cellSpacing) + cellRadius,
                    row * (cellHeight + cellSpacing),
                    layer * (cellRadius * 2 + cellSpacing) + cellRadius
                );

                // Create the positive terminal cap for this cell
                batteryCap = new THREE.Mesh(new THREE.CylinderGeometry(cellRadius - 0.25, cellRadius - 0.25, 0.1, 32));
                batteryCap.name = `batteryCap`
                batteryCap.position.set(
                    cell.position.x,
                    cell.position.y + cellHeight / 2 + 0.05,
                    cell.position.z
                );

                if (layer % 2 == 0 && layer > 1) {
                    batteryCap.position.set(
                        cell.position.x,
                        cell.position.y - cellHeight / 2 - 0.05,
                        cell.position.z
                    );
                }
                batteryGroup.add(batteryCap);
                batteryGroup.add(cell);
            }
        }
    }


    // Create a material for the cylinder mesh that will change color based on the temperature
    const temperatureMaterial = new THREE.MeshStandardMaterial({
        metalness: 1,
        roughness: 0.15,
        envMap: tex,
        envMapIntensity: 4
    });

    // Load temperature data from a JSON object
    const temperatureData = {};

    let temperatureCount = 10000
    for (let i = 0; i < temperatureCount; i++) {
        const cellId = "cell" + i;

        // console.log(cellId);

        temperatureData[cellId] = {
            "top": Math.floor(Math.random() * 100),
            "middle": Math.floor(Math.random() * 100),
            "bottom": Math.floor(Math.random() * 100)
        };
    }
    // console.log(temperatureData);
    // const temperatureData = {
    //     "cell0":  {"top": 50, "middle": 25, "bottom": 75},
    //     "cell1":  {"top": 10, "middle": 90, "bottom": 40},
    //     "cell2":  {"top": 60, "middle": 80, "bottom": 20},
    //     "cell3":  {"top": 70, "middle": 30, "bottom": 85},
    //     "cell4":  {"top": 15, "middle": 65, "bottom": 45},
    //     "cell5":  {"top": 25, "middle": 50, "bottom": 75},
    //     "cell6":  {"top": 70, "middle": 20, "bottom": 85},
    //     "cell7":  {"top": 40, "middle": 60, "bottom": 90},
    //     "cell8":  {"top": 30, "middle": 70, "bottom": 15},
    //     "cell9":  {"top": 85, "middle": 45, "bottom": 65},
    //     "cell10": {"top": 60, "middle": 10, "bottom": 75},
    //     "cell11": {"top": 80, "middle": 30, "bottom": 50},
    //     "cell12": {"top": 20, "middle": 65, "bottom": 35},
    //     "cell13": {"top": 50, "middle": 90, "bottom": 15},
    //     "cell14": {"top": 75, "middle": 40, "bottom": 60}
    //   };

    // Set the material color for each cell based on the temperature data
    batteryGroup.children.forEach(cell => {
        const cellId = "cell" + batteryGroup.children.indexOf(cell);

        const topTemperature = temperatureData[cellId].top;
        const middleTemperature = temperatureData[cellId].middle;
        const bottomTemperature = temperatureData[cellId].bottom;

        cell.material = temperatureMaterial.clone();

        const topColor = getTemperatureColor(bottomTemperature, -cellHeight / 2);
        const middleColor = getTemperatureColor(middleTemperature, 0);
        const bottomColor = getTemperatureColor(topTemperature, cellHeight / 2);

        const gradient = new THREE.DataTexture(
            new Uint8Array([
                topColor.r * 255, topColor.g * 255, topColor.b * 255,
                middleColor.r * 255, middleColor.g * 255, middleColor.b * 255,
                bottomColor.r * 255, bottomColor.g * 255, bottomColor.b * 255
            ]),
            1, 3,
            THREE.RGBFormat,
            THREE.UnsignedByteType,
            THREE.Texture.DEFAULT_MAPPING,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.LinearFilter,
            THREE.LinearFilter,
            1,
            THREE.LinearEncoding
        );

        gradient.needsUpdate = true;
        cell.material.map = gradient;
    });

    // Define the getTemperatureColor function that returns a color based on the temperature
    function getTemperatureColor(temperature, height) {
        let color;

        //for red,yellow,blue theme
        if (temperature >= 50) {
            color = new THREE.Color('red');
        } else if (temperature >= 25 && temperature < 50) {
            color = new THREE.Color('yellow');
        } else {
            color = new THREE.Color('blue');
        }

        // for red,yellow,cyan,blue theme
        // if (temperature >= 70) {
        //     color = new THREE.Color('red');
        // } else if (temperature >= 40 && temperature < 70) {
        //     color = new THREE.Color('cyan');
        // } else if (temperature >= 25 && temperature < 40) {
        //     color = new THREE.Color('yellow');
        // } else if(temperature < 40) {
        //     color = new THREE.Color('blue');
        // }



        // cool looking ice effect to cells comment above iff and use this to activatre it

        // const temperatureRange = 100;
        // const halfRange = temperatureRange / 2; // use for cool ice efect
        // if (temperature >= halfRange) {
        //     const t = (temperature - halfRange) / halfRange;
        //     color = new THREE.Color().setHSL(0.6667 * (1 - t), 1, 0.5 + 0.5 * t);
        // } else {
        //     const t = temperature / halfRange;
        //     color = new THREE.Color().setHSL(0.6667 * t, 1, 0.5 + 0.5 * (1 - t));
        // }

        // const lightness = THREE.MathUtils.lerp(0.2, 1, height / cellHeight );
        // color.setHSL(color.getHSL(color).h, color.getHSL(color).s, lightness);
        return color;
    }

    scene.add(batteryGroup);
    batteryGroup.position.set(-1, -1, -1.5)
}

let btn = document.getElementById('btn')
btn.addEventListener('click', create)


// reset input values
window.onload = function () {
    var inputs = document.getElementsByClassName("input");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = "2";
    }
    create()
};

// Added a grid to help with alignment
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
gridHelper.position.y = -0.5

// created a new axes helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

import OutlineEffect from './OutlineEffect';
import GetMeshData from './GetMeshData.js';

let outlineEffect = new OutlineEffect(scene, camera, renderer);
const GetMeshDataInstance = new GetMeshData();
GetMeshDataInstance.debugMode = false
/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () => {
    fpsGraph.begin()

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    // if(model){

    //     // group.rotation.y = elapsedTime 
    // }

    // Update controls
    controls.update()

    // Render
    // renderer.render(scene, camera)
    outlineEffect.render();

    fpsGraph.end()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()