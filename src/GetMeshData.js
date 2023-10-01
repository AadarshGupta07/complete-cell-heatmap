import * as THREE from 'three';

export default class GetMeshData {
    constructor() {
        this.debugMode = false; // Set initial debug mode to false
        window.addEventListener('objectClicked', this.onObjectClicked.bind(this));
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode; // Toggle debug mode
    }

    drawBoundingBox(object) {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const boundingBoxHelper = new THREE.Box3Helper(boundingBox, 0xffff00); // Yellow color
        object.add(boundingBoxHelper);
    }

    getObjectDimensions(object) {
        const objectGeometry = new THREE.Box3().setFromObject(object);
        const dimensions = objectGeometry.getSize(new THREE.Vector3());
        return dimensions;
    }

    // Prompting part
    promptForNewMeshName(currentName) {
        const newName = prompt('Enter a new name for the Mesh:', currentName);
        return newName !== null ? newName : currentName;
    }

    // Prompting part
    confirmAction(message) {
        return confirm(message);
    }

    printObjectDetails(object) {
        const dimensions = this.getObjectDimensions(object);
        const width = dimensions.x;
        const height = dimensions.y;
        const depth = dimensions.z;

        const name = object.name || 'Unnamed Object';
        const position = object.position.clone();

        // Log the details of the clicked object
        console.log('Name:', name);
        console.log('Position:', position);
        console.log('Width:', width);
        console.log('Height:', height);
        console.log('Depth:', depth);

        // Prompting part
        // if (this.confirmAction('Do you want to edit the Mesh Name?')) {
        //     const newName = this.promptForNewMeshName(name);
        //     object.name = newName;
        //     console.log('Mesh name updated to:', newName);
        // }
    }

    onObjectClicked(event) {
        const clickedObject = event.detail.clickedObject;
        this.printObjectDetails(clickedObject);
    }
}
