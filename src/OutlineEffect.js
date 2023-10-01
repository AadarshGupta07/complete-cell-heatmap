import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
// import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import RaycasterHandler from './RaycastHandler.js';

export default class OutlineEffect {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.composer = new EffectComposer(renderer);

        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
        this.composer.addPass(this.outlinePass);
        this.outlinePass.edgeStrength = 3.0
        this.outlinePass.edgeGlow = 1.0
        this.outlinePass.edgeThickness = 1.0
        this.outlinePass.pulsePeriod = 0 // 0 no pulse
        this.outlinePass.visibleEdgeColor = new THREE.Color('#ffffff')
        this.outlinePass.hiddenEdgeColor = new THREE.Color('#190a05')

        // this.outputPass = new OutputPass();
        // this.composer.addPass(this.outputPass);

        this.effectFXAA = new ShaderPass(FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        this.composer.addPass(this.effectFXAA);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedObjects = [];
        this.hoveredObject = null;

        this.raycasterHandler = new RaycasterHandler(this.scene, this.camera, undefined);


        // renderer.domElement.style.touchAction = 'none';
        renderer.domElement.addEventListener('click', this.onClick.bind(this)); // Add click event listener
    }

    addSelectedObject(object) {
        this.selectedObjects = [];
        this.selectedObjects.push(object);
    }

    lerp(x, y, a) {
        return x * (1 - a) + y * a;
    }

    onClick(event) {
        const intersects = this.raycasterHandler.intersectObjects(event);

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;

            // Apply the outline effect to the selected object
            this.addSelectedObject(selectedObject);
            this.outlinePass.selectedObjects = this.selectedObjects;

            // console.log("Selected Mesh Name: ", selectedObject.name); // Log the name of the selected mesh
        } else {
            // No mesh intersected, so remove the outline effect
            this.selectedObjects = [];
            this.outlinePass.selectedObjects = [];
        }
    }
    
    render() {
        this.composer.render();
    }
    
}