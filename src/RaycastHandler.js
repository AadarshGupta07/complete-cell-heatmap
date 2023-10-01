import * as THREE from 'three';

export default class RaycasterHandler {
    constructor(scene, camera, additionalMeshes = []) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.scene = scene;
        this.camera = camera;
        this.additionalMeshes = additionalMeshes.length > 0 ? additionalMeshes : this.scene.children;
        this.currentIntersect = null;

        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('click', this.onClick.bind(this), false);
    }

    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.additionalMeshes, true);

        if (intersects.length > 0) {
            const newIntersect = intersects[0].object;
            if (this.currentIntersect !== newIntersect) {
                // Mouse enter event
                if (this.currentIntersect) {
                    this.currentIntersect.material.color = this.createColorFromHSL(200, 100, 20);// Change color on mouse leave
                }
                this.currentIntersect = newIntersect;
                this.currentIntersect.material.color = this.createColorFromHSL(200, 100, 80); // Change color on mouse enter
            }
        } else {
            // Mouse leave event
            if (this.currentIntersect) {
                this.currentIntersect.material.color = this.createColorFromHSL(200, 100, 20);; // Change color on mouse leave
            }
            this.currentIntersect = null;
        }
    }

    intersectObjects(event) {
        // Calculate mouse coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Perform raycasting
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        return intersects;
    }

    onClick(event) {
        // Handle click logic here
        const intersects = this.raycaster.intersectObjects(this.additionalMeshes, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;

            // Create custom event
            const clickEvent = new CustomEvent('objectClicked', {
                detail: {
                    clickedObject: clickedObject,
                    clickEvent: event
                }
            });

            // Dispatch the custom event
            window.dispatchEvent(clickEvent);
        }
    }

    createColorFromHSL(hueDeg, saturationPercent, lightnessPercent) {
        const h = (hueDeg % 360) / 360;
        const s = Math.min(1, Math.max(0, saturationPercent / 100));

        // Set a minimum lightness threshold (e.g., 20%)
        const minLightness = 0.7;

        // If the calculated lightness is below the threshold, increase it to the threshold value
        const l = Math.max(minLightness, lightnessPercent / 100);

        const color = new THREE.Color();
        color.setHSL(h, s, l);

        return color;
    }
}
