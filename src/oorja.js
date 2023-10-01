import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { Lut } from 'three/examples/jsm/math/Lut';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { heatmapdata } from './model';
import { Color, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene: THREE.Scene, camera: THREE.OrthographicCamera, scene2: THREE.Scene, controls: TrackballControls, renderer2: THREE.WebGLRenderer, renderer: THREE.WebGLRenderer, lut: any, sceneObject: THREE.Object3D = new THREE.Object3D() /* mesh1: THREE.Mesh */;
let axisHelper: THREE.AxesHelper, pointGroup: THREE.Group = new THREE.Group(), cellGroup: THREE.Group = new THREE.Group(), enclosureGroup: THREE.Group = new THREE.Group();
let camera2: THREE.OrthographicCamera;
let messages: any;
let currentContainer: HTMLObjectElement;
let x: any;
let enclosureFlags: Boolean = false;
let tapHeight: number = 2;
let tabheight1: number;
let labelRenderer2: CSS2DRenderer;
let mesh1: THREE.Mesh;
let mesh2: THREE.Mesh;
let mesh3: THREE.Mesh;
let select: HTMLSelectElement;
let selectLight: HTMLSelectElement;

// Aadarsh created an environmap lighting texture
let tex = new THREE.CubeTextureLoader().load([
  'assets/model/cubeMap/px.jpg',
  'assets/model/cubeMap/nx.jpg',
  'assets/model/cubeMap/py.jpg',
  'assets/model/cubeMap/ny.jpg',
  'assets/model/cubeMap/pz.jpg',
  'assets/model/cubeMap/nz.jpg',
])

// Aadarsh made a custom normal + rgb map to wrap on the cell
let normal = new THREE.TextureLoader().load('assets/model/normal.jpg')

// Aadarsh created a parameters object to tweak environment maps's intensity and material parameters
let para = {
  metalness: 0.5, // 0.5
  roughness: 0.215, // 0.215
  envMapIntensity: 5 // 5
}

let material = new THREE.MeshStandardMaterial({ color: 0x48545A, side: THREE.DoubleSide, transparent: true, map: normal, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
let material1 = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, side: THREE.DoubleSide, transparent: true, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
let materialH = new THREE.MeshStandardMaterial({ color: 0x48545A, side: THREE.DoubleSide, transparent: true, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
let materialH1 = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, side: THREE.DoubleSide, transparent: true, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });

// Aadarsh added a gltf model loader
const modelLoader = new GLTFLoader();
scene = new THREE.Scene();
let myModel1: THREE.Object3D | null = null;
let myModel2: THREE.Object3D | null = null;

modelLoader.load('assets/model/externalConnector.glb', (gltf) => {
  const model = gltf.scene;

  myModel1 = model;
  myModel2 = model.clone();

  myModel1.scale.set(7, 7, 7);
  myModel2.scale.set(7, 7, 7);

  const myModel1Material = new THREE.MeshStandardMaterial({ color: 0xff0000, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
  const myModel2Material = new THREE.MeshStandardMaterial({ color: 0x000000, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
  myModel1.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      child.material = myModel1Material;
    }
  });

  myModel2.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      child.material = myModel2Material;
    }
  });
  myModel1.rotation.set(0, Math.PI / 2, Math.PI / 2);
  myModel2.rotation.set(0, Math.PI / 2, Math.PI / 2);
});

// Aadarsh created custom connector strip texture function
function createColorTexture(leftColor: string, middleColor: string, rightColor: string, leftPercent: number, middlePercent: number, rightPercent: number, width: number, height: number): THREE.CanvasTexture {
  const colorTexture: HTMLCanvasElement = document.createElement('canvas');
  colorTexture.width = width;
  colorTexture.height = height;

  const ctx: CanvasRenderingContext2D = colorTexture.getContext('2d')!;

  const leftWidth = colorTexture.width * (leftPercent / 100);
  const middleWidth = colorTexture.width * (middlePercent / 100);
  const rightWidth = colorTexture.width * (rightPercent / 100);

  ctx.fillStyle = leftColor;
  ctx.fillRect(0, 0, leftWidth, colorTexture.height);

  ctx.fillStyle = middleColor;
  ctx.fillRect(leftWidth, 0, middleWidth, colorTexture.height);

  ctx.fillStyle = rightColor;
  ctx.fillRect(leftWidth + middleWidth, 0, rightWidth, colorTexture.height);

  const texture: THREE.CanvasTexture = new THREE.CanvasTexture(colorTexture);
  return texture;
}

// Create a texture from the createColorTexture function
let seriesConnectorTexture: THREE.CanvasTexture = createColorTexture("silver", "green", "silver", 30, 40, 30, 256, 256);

let parallelConnectorOddTexture: THREE.CanvasTexture = createColorTexture("silver", "red", "silver", 30, 40, 30, 256, 256);
parallelConnectorOddTexture.rotation = -Math.PI * 4;

let parallelConnectorEvenTexture: THREE.CanvasTexture = createColorTexture("silver", "black", "silver", 30, 40, 30, 256, 256);
parallelConnectorEvenTexture.rotation = -Math.PI * 4;

let externalConnectorTexture: THREE.CanvasTexture = createColorTexture("silver", "silver", "silver", 10, 80, 10, 256, 256);
externalConnectorTexture.rotation = -Math.PI * 4;

let connectorMaterial = new THREE.MeshStandardMaterial({ map: parallelConnectorOddTexture, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });
let connectorMaterial1 = new THREE.MeshStandardMaterial({ map: parallelConnectorEvenTexture, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });

let connectorSeriesMaterial = new THREE.MeshStandardMaterial({ map: seriesConnectorTexture, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });

let ExternalMaterial = new THREE.MeshStandardMaterial({ map: externalConnectorTexture, envMap: tex, metalness: para.metalness, roughness: para.roughness, envMapIntensity: para.envMapIntensity });

let globalGeometryForCell: THREE.BufferGeometry, globalGeometryForTap: THREE.BufferGeometry;
let globalGeometryForCellPrismatic: THREE.BufferGeometry, globalGeometryForTapPrismatic1: THREE.BufferGeometry, globalGeometryForTapPrismatic2: THREE.BufferGeometry;
let globalGeometryForCellPouch: THREE.BufferGeometry, globalGeometryForTapPouch1: THREE.BufferGeometry, globalGeometryForTapPouch2: THREE.BufferGeometry;
let connGeometryCylinder: any;
let connectorPostitive: THREE.Mesh;
let connectorNegative: THREE.Mesh;
let connectorSeries1: THREE.Mesh;
let connectorSeries2: THREE.Mesh;
let connGeometryPrismatic: any;
let connGeometryseriesPrismatic: any;
let connGeometryPouch: any;
let connGeometryseriesPouch: any;
let connGeometryPouchCorners: any;
let squareMesh1: THREE.Mesh;
let squareMesh2: THREE.Mesh;
let connGeometryPouchCorners1: any;
let connGeometryPrismaticCorners: any;
let connGeometryPrismaticCorners1: any;
let ExternalConnectionGeometry: any;
let ExternalConnection1: THREE.Mesh;
let ExternalConnection2: THREE.Mesh;
let ExternalConnectionGeometryPouch: any;
let ExternalConnectionGeometryCylinder: any;
let connGeometryCylinderS: any;
//Light
let lightsObject: Object3D;
let referencePlane: any = null;
let boolAddLights: boolean;
let isHeatmap1: boolean = false;
let zoomPercentage: number = 0;
let selectedLight: any = null;
let raycasterGlobal: THREE.Raycaster = new THREE.Raycaster();
let offset: THREE.Vector3 = new THREE.Vector3();
let onMouseClickOptions = Object.freeze({ NONE: 0, MOVELIGHT: 1 });
let onMouseClick = onMouseClickOptions.NONE;
//
let cell_type1: string, z1: number, y1: number, x1: number, zcellspacing1: number, Ycellspacing1: number, Xcellspacing1: number, array1: [], cylinderdiameter1: number, cylinderheight1: number, cell_arrangement1: String, cell_stagger_dir1: String, cellThickness1: number, celllength1: number;
let cellheight1: number, cellbreadth1: number;
let connect_array1: any;
let m: number;
let prevArrayLenght: number;
let arrFace: any[] = [];
//
let SeriesOfMaps = new Map();
let trackRow = new Map();
let trackCell = new Map();
let mapCell = new Map();
let params = {
  colorMap: 'cooltowarm',
};
let count = 1.2;
let ID: any = null;
const render = () => {
  renderer.render(scene, camera);
  renderer2.render(scene2, camera2);
  labelRenderer2.render(scene2, camera2);
  renderAxisFonts();
  camera2.position.copy(camera.position);
  camera2.position.sub(controls.target);
  camera2.position.setLength(25);
  camera2.lookAt(scene2.position);
  controls.update();
  camera.updateMatrix();
  camera.updateProjectionMatrix();
};

//update every important variable
function updateVarialble(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any, cell_type: any, cellThickness: number, celllength: number, isHeatmap: boolean, connect_array: [][]): void {
  z1 = z;
  y1 = y;
  x1 = x;
  zcellspacing1 = zcellspacing;
  Ycellspacing1 = Ycellspacing;
  Xcellspacing1 = Xcellspacing;
  array1 = array;
  cylinderdiameter1 = cylinderdiameter;
  cellbreadth1 = cellThickness;
  cellheight1 = cylinderheight;
  cylinderheight1 = cylinderheight;
  cell_arrangement1 = cell_arrangement;
  cell_stagger_dir1 = cell_stagger_dir;
  cell_type1 = cell_type;
  cellThickness1 = cellThickness;
  celllength1 = celllength;
  tabheight1 = 0.2 * celllength;
  isHeatmap1 = isHeatmap;
  connect_array1 = connect_array;
}
//Animate fuction
function animate() {
  ID = requestAnimationFrame(animate);
  render();
}


//render Axis fonts
function renderAxisFonts() {
  if (mesh1 && mesh2 && mesh3) {
    mesh1.lookAt(camera.position);
    mesh2.lookAt(camera.position);
    mesh3.lookAt(camera.position);
    mesh1.quaternion.copy(camera.quaternion);
    mesh2.quaternion.copy(camera.quaternion);
    mesh3.quaternion.copy(camera.quaternion);
  }
}
//Creates and return 3D axis helper
function drawAxisHelpers() {
  let mycanvas1 = <HTMLObjectElement>document.getElementById("AH");
  const width2 = mycanvas1.clientWidth;
  const height2 = mycanvas1.clientHeight;

  const axesHelper = new THREE.AxesHelper(20);
  scene2.add(axesHelper);

  const loader = new FontLoader();
  loader.load('assets/JSON/font.json', function (font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0X0000FF });
    const textGeo1 = new TextGeometry("Z", {
      font: font,
      size: 10.0,
      height: 1.0,
    });
    mesh1 = new THREE.Mesh(textGeo1, textMaterial);
    mesh1.position.set(0, 0, 21);
    scene2.add(mesh1);

    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0X006400 });
    const textGeo2 = new TextGeometry("Y", {
      font: font,
      size: 10.0,
      height: 1.0,
    });
    mesh2 = new THREE.Mesh(textGeo2, textMaterial2);
    mesh2.position.set(0, 21, 0);
    scene2.add(mesh2);

    const textMaterial3 = new THREE.MeshBasicMaterial({ color: 0Xff0000 });
    const textGeo3 = new TextGeometry("X", {
      font: font,
      size: 10.0,
      height: 1.0,
    });
    mesh3 = new THREE.Mesh(textGeo3, textMaterial3);
    mesh3.position.set(21, 0, 0);
    scene2.add(mesh3);
  });

  labelRenderer2 = new CSS2DRenderer();
  labelRenderer2.setSize(width2, height2);
  labelRenderer2.domElement.style.position = 'absolute';
  labelRenderer2.domElement.style.top = '0px';
  mycanvas1.appendChild(labelRenderer2.domElement);

}

function updateDivAxis(container: any): void {
  var div = document.createElement("div");
  div.id = "AH";
  div.style.width = "10%";
  div.style.height = "10%";
  div.style.background = "0xf0f0f0";
  div.style.color = "white";
  div.style.position = "relative";
  div.style.bottom = "20%";
  div.style.left = "0%";
  container.appendChild(div);
  renderer2.setSize(div.offsetWidth, div.offsetHeight);
  div.appendChild(renderer2.domElement);
}

//Creates canvas element for axis helper
function CreateADivForAxisHelper(container: any) {
  /*  if (scene2) {
    updateDivAxis(container);
    return;
  } */
  var div = document.createElement("div");
  div.id = "AH";
  div.style.width = "10%";
  div.style.height = "20%";
  div.style.background = "0xf0f0f0";
  div.style.color = "white";
  div.style.position = "relative";
  div.style.bottom = "20%";
  div.style.left = "0%";

  container.appendChild(div);
  scene2 = new THREE.Scene();
  camera2 = new THREE.OrthographicCamera(div.offsetWidth / - 2, div.offsetWidth / 2, div.offsetHeight / 2, div.offsetHeight / - 2, 0.1, 1000);

  scene2.add(camera2);
  camera2.position.z = 25;
  camera2.up = camera.up;
  drawAxisHelpers();

  renderer2 = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    alpha: true, antialias: true
  });
  renderer2.setClearColor(0x000000, 0);
  renderer2.setSize(div.offsetWidth, div.offsetHeight);
  div.appendChild(renderer2.domElement);
  div.addEventListener('resize', () => {
    //camera2.aspect = div.offsetWidth / div.offsetHeight;
    camera2.updateProjectionMatrix();
    camera2.updateMatrixWorld();
    renderer2.setSize(div.offsetWidth, div.offsetHeight);
  });
}

function colorBar(timeValue: any, maxtemperature: any, mintemperature: any) {
  let time = (timeValue).toFixed(2);
  let val = document.getElementById("colorBarContainer");
  if (val) {
    val.parentElement?.removeChild(val);
  }

  const colorBarContainer = document.createElement("div");
  colorBarContainer.id = "colorBarContainer";
  let maxtemperatureL = maxtemperature.toFixed(2);
  let mintemperatureL = mintemperature.toFixed(2);

  let range: any = (Number(maxtemperatureL) - Number(mintemperatureL)) / 6;
  let range1: any = (Number(mintemperatureL) + Number(range)).toFixed(2);
  let range2: any = (Number(mintemperatureL) + 2 * Number(range)).toFixed(2);
  let range3: any = (Number(mintemperatureL) + 3 * Number(range)).toFixed(2);
  let range4: any = (Number(mintemperatureL) + 4 * Number(range)).toFixed(2);


  var labelMax = document.createElement("label");
  labelMax.setAttribute('style', 'position: relative; display: inline-block;top: -10px;float: right;');
  labelMax.innerHTML = maxtemperatureL;
  labelMax.htmlFor = "colorBar";

  var rangeTemp4 = document.createElement("label");
  rangeTemp4.setAttribute('style', '    position: absolute;display: inline-block;bottom: 80%;float: right;');
  rangeTemp4.innerHTML = range4;
  rangeTemp4.htmlFor = "colorBar";

  var rangeTemp3 = document.createElement("label");
  rangeTemp3.setAttribute('style', '    position: absolute;display: inline-block;bottom: 60%;float: right;');
  rangeTemp3.innerHTML = range3;
  rangeTemp3.htmlFor = "colorBar";

  var rangeTemp2 = document.createElement("label");
  rangeTemp2.setAttribute('style', '    position: absolute;display: inline-block;bottom: 40%;float: right;');
  rangeTemp2.innerHTML = range2;
  rangeTemp2.htmlFor = "colorBar";

  var rangeTemp1 = document.createElement("label");
  rangeTemp1.setAttribute('style', '    position: absolute;display: inline-block;bottom: 20%;float: right;');
  rangeTemp1.innerHTML = range1;
  rangeTemp1.htmlFor = "colorBar";

  var labelMin = document.createElement("label");
  labelMin.setAttribute('style', '    position: absolute;display: inline-block;bottom: 0%;float: right;');
  labelMin.innerHTML = mintemperatureL;
  labelMin.htmlFor = "colorBar";

  colorBarContainer.setAttribute('style', 'z-index: 100; position: absolute;display: inline-block; top: 27%; right: 1%');
  var colorBarContainerImg = document.createElement("img");
  colorBarContainerImg.setAttribute('style', 'width: 25px; height: 300px;');
  colorBarContainerImg.src = "assets/colorBarImage/colorBar.png";


  colorBarContainer.appendChild(colorBarContainerImg);
  colorBarContainer.appendChild(labelMax);
  colorBarContainer.appendChild(rangeTemp4);
  colorBarContainer.appendChild(rangeTemp3);
  colorBarContainer.appendChild(rangeTemp2);
  colorBarContainer.appendChild(rangeTemp1);
  colorBarContainer.appendChild(labelMin);
  currentContainer.appendChild(colorBarContainer);

}
//Updates canvas div
function updateDiv(container: any, index: number) {
  let mainDiv = document.getElementById("MainDiv");
  if (mainDiv) {
    mainDiv.parentElement!.removeChild(mainDiv);
  }
  if (index == 1) {
    container = <HTMLObjectElement>document.getElementById("id1");
  }
  else {
    container = <HTMLObjectElement>document.getElementById("id2");
  }
  currentContainer = container;

  var div = document.createElement("div");
  div.id = "MainDiv";
  div.style.width = "100%";
  div.style.height = "100%";
  container.appendChild(div)
  renderer.setSize(div.offsetWidth, div.offsetHeight);
  div.appendChild(renderer.domElement);
  CreateADivForAxisHelper(div);
  viewUI(div);
}

//Initialize the configurator with main canvas
function InitiateConfigurator(container: any, index: number, toastr: any) {
  // if (scene) {
  //   updateDiv(container, index);
  //   return;
  // }
  container = <HTMLObjectElement>document.getElementById("id1");
  currentContainer = container;
  container.style.padding = "0%";
  container.style.margin = "0%";
  var div = document.createElement("div");
  div.id = "MainDiv";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.position = "absolute";
  div.style.left = "0px";
  div.style.top = "0px";
  container.appendChild(div)
  messages = toastr;
  scene = new THREE.Scene();
  lut = new Lut("blackbody", 20);
  camera = new THREE.OrthographicCamera(div.offsetWidth / - 2, div.offsetWidth / 2, div.offsetHeight / 2, div.offsetHeight / - 2, 0.1, 100000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(div.offsetWidth, div.offsetHeight);
  renderer.setClearColor(0xFFFFFF, 1);
  div.appendChild(renderer.domElement);

  sceneObject.name = 'sceneObject';
  cellGroup.name = 'cellGroup';
  pointGroup.name = 'pointGroup';
  enclosureGroup.name = 'enclosureGroup';
  scene.add(pointGroup);
  scene.add(enclosureGroup);
  scene.add(sceneObject);

  controls = new TrackballControls(camera, renderer.domElement)
  controls.rotateSpeed = 5;
  controls.panSpeed = 2;
  controls.update();
  camera.position.z = 25;
  scene.add(camera);

  div.addEventListener('resize', () => {
    //camera.aspect = div.offsetWidth / div.offsetHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.setSize(div.offsetWidth, div.offsetHeight);
  });
  mesh1 = new THREE.Mesh(undefined, new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    color: 0xF5F5F5,
    vertexColors: true
  }));

  CreateADivForAxisHelper(div);
  viewUI(div);
  AdjustZoom(2);
  animate();
  SetOrientation("ResetView")
}

//Creates prismatic cells and it into the cell group with staggered configuration
/* function CreateStaggeredBoxGeometryAtPosition(boxlength: number, boxbreadth: number, boxheight: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let Box = createBoxCellWithFillet(boxlength, boxbreadth, boxheight);
  cellGroup.add(Box);
  Box.name = "" + i + " " + j + " " + k + "";
  console.log(Box.name);
  if (k % 2 == 0)
    Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing + boxlength / 2, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * Ycellspacing);
  else
    Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * Ycellspacing);
} */
//Creates prismatic cells and and it into the cell group
function CreateBoxGeometryAtPosition(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let Box = createBoxCellWithFillet(boxlength, boxbreadth, boxheight);
  cellGroup.add(Box);
  Box.name = m.toString();
  Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing + j * tabheight1 / 2);
  Box.updateMatrixWorld(true);
}

//Creates cylinder and it into the cell group
function CreateCylinderAtPosition(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  cylinder.updateMatrixWorld(true);
  trackRow.set(m.toString(), k);
  if (k % 2 != 0) {
    cylinder.rotation.x += Math.PI;
    cylinder.position.z += tapHeight;
    trackCell.set(m.toString(), "Flipped");
  }
}

function CreateCylinderAtPositionAccordingToConnectorWithoutTap(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
  trackRow.set(m.toString(), k);
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder.rotation.x += Math.PI;
    cylinder.position.z += tapHeight;
    trackCell.set(m.toString(), "Flipped");
  }
  else {
    trackCell.set(m.toString(), "conventional");
  }
  cylinder.updateMatrixWorld(true);
}

function CreateCylinderAtPositionAccordingToConnector(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  trackRow.set(m.toString(), k);
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder.rotation.x += Math.PI;
    cylinder.position.z += tapHeight;
    trackCell.set(m.toString(), "Flipped");
  }
  else {
    trackCell.set(m.toString(), "conventional");
  }
  cylinder.updateMatrixWorld(true);
}

//Creates cylinder and it into the cell group and flip it according to connector data.
function BringCreateCylinderAtPositionAccordingToConnector(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinderName = m.toString();
  let cylinder = cellGroup.getObjectByName((cylinderName));
  cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder!.position.z += tapHeight;
  }
}

function BringCreateStaggeredCylinderAtPositionAccordingToConnector(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinderName = m.toString();
  let cylinder = cellGroup.getObjectByName((cylinderName));
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder!.position.z += tapHeight;
  }
}

function CreateStaggeredCylinderAtPositionAccordingToConnector(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  trackRow.set(m.toString(), k);
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder.rotation.x += Math.PI;
    cylinder.position.z += tapHeight;
    trackCell.set(m.toString(), "Flipped");
  }
  else {
    trackCell.set(m.toString(), "conventional");
  }
  cylinder.updateMatrixWorld(true);
}

function CreateStaggeredCylinderAtPositionAccordingToConnectorWithoutTap(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
  }
  trackRow.set(m.toString(), k);
  let isFlipped = mapCell.get(m);
  if (isFlipped % 2 != 0) {
    cylinder.rotation.x += Math.PI;
    cylinder.position.z += tapHeight;
    trackCell.set(m.toString(), "Flipped");
  }
  else {
    trackCell.set(m.toString(), "conventional");
  }
  cylinder.updateMatrixWorld(true);
}

//saggered cell position according to connector data
function CreateStaggeredCylinderAtPosition(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
}

function CreateCylinderAtPosition1(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
}
// creates cylinder and it into the cell group with staggered configuration

function CreateStaggeredCylinderAtPosition1(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinder = createCylinderwithFillet(cylinderdiameter / 2, cylinderdiameter / 2, cylinderheight);
  cellGroup.add(cylinder);
  cylinder.name = m.toString();
  cylinder.rotation.x += Math.PI / 2;
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
    else
      cylinder.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing);
  }
}

// Create cylinder having fillet at both end circle
function createCylinderwithFillet(radiusTop: number, radiusBottom: number, height: number) {

  //texture.wrapS = THREE.ClampToEdgeWrapping
  //texture.wrapT = THREE.ClampToEdgeWrapping
  //texture.needsUpdate = false;
  let cylinderGroup = new THREE.Group();
  if (!(globalGeometryForCell || globalGeometryForTap)) {
    let smallCylinderheight = tapHeight;
    let smallCylinderDaimeter = 4.5
    let torusdia = 0.1;

    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height - radiusTop / 5, 30, 30, true);
    const geometry1 = new THREE.TorusGeometry(radiusTop - radiusTop / 10, radiusTop / 10, 20, 50, 7);
    let torus = new THREE.Mesh(geometry1);
    geometry1.rotateX(-Math.PI * 0.5);
    geometry1.translate(0, -(height - radiusTop / 10 - radiusTop / 10) / 2, 0);

    const geometry2 = new THREE.TorusGeometry(radiusBottom - radiusBottom / 10, radiusBottom / 10, 20, 30, 7);  //For change in fillet size you can to make changes in the geometry2, geometry3 and geometry4 (try out combination of parameter)
    geometry2.rotateX(-Math.PI * 0.5);
    geometry2.translate(0, (height - radiusTop / 10 - radiusTop / 10) / 2, 0);

    const geometry3 = new THREE.CircleGeometry(radiusTop - radiusTop / 10, 30);
    geometry3.rotateX(-Math.PI * 0.5);
    geometry3.translate(0, (height) / 2, 0);

    const geometry4 = new THREE.CircleGeometry(radiusTop - radiusBottom / 10, 30);
    geometry4.rotateX(Math.PI * 0.5);
    geometry4.translate(0, -(height / 2), 0);

    const smallCylGeometry = new THREE.CylinderGeometry(smallCylinderDaimeter, smallCylinderDaimeter, smallCylinderheight, 100)
    smallCylGeometry.rotateY(-Math.PI * 0.5)
    smallCylGeometry.translate(0, (smallCylinderheight / 2), 0);  //here removed (height/2) parameter to translate the smallCylGeometry & same in smallTorus & geometry5

    const smallTorus = new THREE.TorusGeometry((smallCylinderDaimeter - (torusdia)), torusdia, 50, 100, 7);
    smallTorus.rotateX(-Math.PI * 0.5);
    smallTorus.translate(0, (smallCylinderheight), 0);

    const geometry5 = new THREE.CircleGeometry((smallCylinderDaimeter - (torusdia)), 70);
    geometry5.rotateX(-Math.PI * 0.5);
    geometry5.translate(0, (smallCylinderheight + torusdia), 0);

    const smallCylinder = BufferGeometryUtils.mergeBufferGeometries([smallTorus, smallCylGeometry, geometry5], false);
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries([geometry, geometry1, geometry2, geometry3, geometry4], false);
    globalGeometryForCell = mergedGeometry;
    globalGeometryForTap = smallCylinder;
  }
  if (isHeatmap1) {
    var cylinder1 = new THREE.Mesh(globalGeometryForCell.clone(), materialH.clone());

    var cylinder2 = new THREE.Mesh(globalGeometryForTap.clone(), materialH1.clone());
  }
  else {
    var cylinder1 = new THREE.Mesh(globalGeometryForCell.clone(), material.clone());

    var cylinder2 = new THREE.Mesh(globalGeometryForTap.clone(), material1.clone());
  }



  cylinder2.position.set(cylinder2.position.x, height / 2, cylinder2.position.z)

  cylinder2.geometry.computeBoundingBox();
  cylinder2.updateMatrixWorld(true);
  cylinder1.name = "cylindercell";
  cylinder2.name = "cylindertab";
  cylinderGroup.add(cylinder1);
  cylinderGroup.add(cylinder2);
  cylinder1.geometry.computeBoundingBox();
  cylinder1.updateMatrixWorld(true);
  return cylinderGroup;
}

//Creates boc like geometry for prismatic cell
function createBoxCellWithFillet(boxlength: number, boxbreadth: number, boxheight: number) {
  let tablength = 0.5 * boxbreadth,
    tabbreadth = 0.5 * boxbreadth,
    tabheight = 0.5 * boxbreadth,
    X1 = 0.2 * boxlength;

  let boxGroup = new THREE.Group();
  if (!(globalGeometryForCellPrismatic || globalGeometryForTapPrismatic1 || globalGeometryForTapPrismatic2)) {
    //const geometry = new RoundedBoxGeometry(boxlength, boxbreadth, boxheight, 32, 1);
    //const geometry = new THREE.BoxGeometry(boxlength, boxbreadth, boxheight, 1, 1, 20);  // for change in fillet size for prismatic cell change (2,2) to what you want
    const geometry = new THREE.BoxGeometry(boxlength, boxbreadth, boxheight, 6, 3, 20);
    //  let  Texture1 = new THREE.TextureLoader().load('./assets/images/texturep.png');
    // const material = new THREE.MeshPhongMaterial({ side: THREE.FrontSide, color: 0x7381a5 });
    // var Box = new THREE.Mesh(geometry, material);

    const geometry1 = new RoundedBoxGeometry(tablength, tabbreadth, tabheight);
    //const material1 = new THREE.MeshPhysicalMaterial({ color: 0xC0C0C0, side: THREE.FrontSide, clearcoat: 1.0, clearcoatRoughness: 0.5, metalness: 0.5, roughness: 0.9, transparent: true, opacity: 1 });
    // var Box1 = new THREE.Mesh(geometry1, material1);
    geometry1.translate(-(boxlength / 2 - X1), 0, boxheight / 2);


    const geometry2 = new RoundedBoxGeometry(tablength, tabbreadth, tabheight);
    // const material2 = new THREE.MeshPhysicalMaterial({ color: 0xC0C0C0, side: THREE.FrontSide, clearcoat: 1.0, clearcoatRoughness: 0.5, metalness: 0.5, roughness: 0.9, transparent: true, opacity: 1 });
    //var Box2 = new THREE.Mesh(geometry2, material2);
    geometry2.translate((boxlength / 2 - X1), 0, boxheight / 2);
    globalGeometryForCellPrismatic = geometry;
    globalGeometryForTapPrismatic1 = geometry1;
    globalGeometryForTapPrismatic2 = geometry2;
  }

  if (isHeatmap1) {
    var BoxCell1 = new THREE.Mesh(globalGeometryForCellPrismatic.clone(), materialH.clone());

    var Box11 = new THREE.Mesh(globalGeometryForTapPrismatic1.clone(), materialH1.clone());

    var Box21 = new THREE.Mesh(globalGeometryForTapPrismatic2.clone(), materialH1.clone());
  }

  else {
    var BoxCell1 = new THREE.Mesh(globalGeometryForCellPrismatic.clone(), material.clone());

    var Box11 = new THREE.Mesh(globalGeometryForTapPrismatic1.clone(), material1.clone());

    var Box21 = new THREE.Mesh(globalGeometryForTapPrismatic2.clone(), material1.clone());
  }


  BoxCell1.geometry.computeBoundingBox();
  BoxCell1.updateMatrixWorld(true);
  Box11.geometry.computeBoundingBox();
  Box11.updateMatrixWorld(true);
  Box21.geometry.computeBoundingBox();
  Box21.updateMatrixWorld(true);
  BoxCell1.name = "boxcell";
  Box11.name = "boxtap1";
  Box21.name = "boxtap2";
  boxGroup.add(BoxCell1);
  boxGroup.add(Box11);
  boxGroup.add(Box21);
  return boxGroup;
}

//Creates boc like geometry for pouch cell
function createPouchCellWithFillet(boxlength: number, boxbreadth: number, boxheight: number) {
  let tablength = 0.3 * boxlength,
    tabbreadth = 0.3 * boxbreadth,
    tabheight = 0.1 * boxheight,
    X1 = 0.2 * boxlength;

  let boxGroup = new THREE.Group();
  if (!(globalGeometryForCellPouch || globalGeometryForTapPouch1 || globalGeometryForTapPouch2)) {
    //const geometry = new RoundedBoxGeometry(boxlength, boxbreadth, boxheight, 32, 1);
    //const geometry = new THREE.BoxGeometry(boxlength, boxbreadth, boxheight, 1, 1, 20);  // for change in fillet size for prismatic cell change (2,2) to what you want
    const geometry = new THREE.BoxGeometry(boxlength, boxbreadth, boxheight, 6, 3, 20);
    //  let  Texture1 = new THREE.TextureLoader().load('./assets/images/texturep.png');
    // const material = new THREE.MeshPhongMaterial({ side: THREE.FrontSide, color: 0x7381a5 });
    // var Box = new THREE.Mesh(geometry, material);

    const geometry1 = new RoundedBoxGeometry(tablength, tabbreadth, tabheight);
    // const material1 = new THREE.MeshPhysicalMaterial({ color: 0xC0C0C0, side: THREE.FrontSide, clearcoat: 1.0, clearcoatRoughness: 0.5, metalness: 0.5, roughness: 0.9, transparent: true, opacity: 1 });
    // var Box1 = new THREE.Mesh(geometry1, material1);
    geometry1.translate(-(boxlength / 2 - X1), 0, boxheight / 2);


    const geometry2 = new RoundedBoxGeometry(tablength, tabbreadth, tabheight);
    // const material2 = new THREE.MeshPhysicalMaterial({ color: 0xC0C0C0, side: THREE.FrontSide, clearcoat: 1.0, clearcoatRoughness: 0.5, metalness: 0.5, roughness: 0.9, transparent: true, opacity: 1 });
    // var Box2 = new THREE.Mesh(geometry2, material2);
    geometry2.translate((boxlength / 2 - X1), 0, boxheight / 2);
    globalGeometryForCellPouch = geometry;
    globalGeometryForTapPouch1 = geometry1;
    globalGeometryForTapPouch2 = geometry2;
  }
  if (isHeatmap1) {
    var BoxCell1 = new THREE.Mesh(globalGeometryForCellPouch.clone(), materialH.clone());

    var Box11 = new THREE.Mesh(globalGeometryForTapPouch1.clone(), materialH1.clone());

    var Box21 = new THREE.Mesh(globalGeometryForTapPouch2.clone(), materialH1.clone());
  }
  else {
    var BoxCell1 = new THREE.Mesh(globalGeometryForCellPouch.clone(), material.clone());

    var Box11 = new THREE.Mesh(globalGeometryForTapPouch1.clone(), material1.clone());

    var Box21 = new THREE.Mesh(globalGeometryForTapPouch2.clone(), material1.clone());
  }



  BoxCell1.geometry.computeBoundingBox();
  BoxCell1.updateMatrixWorld(true);
  Box11.geometry.computeBoundingBox();
  Box11.updateMatrixWorld(true);
  Box21.geometry.computeBoundingBox();
  Box21.updateMatrixWorld(true);
  BoxCell1.name = "boxcell";
  Box11.name = "boxtap1";
  Box21.name = "boxtap2";
  boxGroup.add(BoxCell1);
  boxGroup.add(Box11);
  boxGroup.add(Box21);
  return boxGroup;
}

//Sets camera and controls position and orientation
function SetControlsAtOrigin() {
  const box = new THREE.Box3();
  box.setFromObject(cellGroup);
  let center = new THREE.Vector3();
  box.getCenter(center);
  let maxCenter = Math.max(center.x, center.y, center.z);
  camera.position.copy(center.clone().add(new THREE.Vector3(1, 1, 1).multiplyScalar(maxCenter)));
  controls.target.copy(center);
  camera.updateProjectionMatrix();
  controls.update();
  AdjustZoom(2);
}

// Creates view, zoom, pan and toggle enclosure and JSON points.
function viewUI(container: any) {

  const zooomContainer = document.createElement("div");
  zooomContainer.setAttribute('style', 'z-index: 100; position: relative;display: inline-block; top: -121%;float:right');
  var ZoomIn = document.createElement("img");
  ZoomIn.setAttribute('style', 'width: 32px; height: 32px;');
  ZoomIn.setAttribute('class', 'hover_on_icon');
  ZoomIn.setAttribute('title', 'Zoom-In');
  ZoomIn.src = "assets/icons/zoom_in.png";
  zooomContainer.appendChild(ZoomIn);
  ZoomIn.style.padding = "5px";
  var ZoomOut = document.createElement("img");
  ZoomOut.setAttribute('style', 'width: 32px; height: 32px;');
  ZoomOut.setAttribute('class', 'hover_on_icon');
  ZoomOut.setAttribute('title', 'Zoom-Out');
  ZoomOut.src = "assets/icons/zoom_out.png";
  zooomContainer.appendChild(ZoomOut);
  ZoomOut.style.padding = "5px";

  ZoomIn.onclick = function () {
    camera.zoom += 0.2;
    count = camera.zoom;
    AdjustZoom(count);
  }
  ZoomOut.onclick = function () {
    count = camera.zoom;
    if (count < 0.3) {
      //displayAnimationMessage("Sorry, Further Zoom Not possible");
      messages.showWarning("Sorry, Further Zoom-In Not possible", ``)
      return;
    }
    else {
      count -= 0.2;
    }
    AdjustZoom(count);
  }

  //view container
  const viewContainer = document.createElement("div");
  viewContainer.id = "view-container";
  viewContainer.className = "";
  viewContainer.setAttribute('style', 'position: relative;display: inline-block;top: -121%;float:right');
  var iconTop = document.createElement("img");
  iconTop.setAttribute('style', 'width: 32px; height: 32px;');
  iconTop.setAttribute('class', 'hover_on_icon');
  iconTop.setAttribute('title', 'Top-View');
  iconTop.src = "assets/icons/T.png";
  iconTop.style.padding = "5px";
  var iconBottom = document.createElement("img");
  iconBottom.setAttribute('style', 'width: 32px; height: 32px;');
  iconBottom.setAttribute('class', 'hover_on_icon');
  iconBottom.setAttribute('title', 'Bottom-View');
  iconBottom.src = "assets/icons/B.png";
  iconBottom.style.padding = "5px";
  var iconRight = document.createElement("img");
  iconRight.setAttribute('style', 'width: 32px; height: 32px;');
  iconRight.setAttribute('class', 'hover_on_icon');
  iconRight.setAttribute('title', 'Right-View');
  iconRight.src = "assets/icons/R.png";
  iconRight.style.padding = "5px";
  var iconLeft = document.createElement("img");
  iconLeft.setAttribute('style', 'width: 32px; height: 32px;');
  iconLeft.setAttribute('class', 'hover_on_icon');
  iconLeft.setAttribute('title', 'Left-View');
  iconLeft.src = "assets/icons/L.png";
  iconLeft.style.padding = "5px";
  //Front
  var iconFront = document.createElement("img");
  iconFront.setAttribute('style', 'width: 32px; height: 32px;');
  iconFront.setAttribute('class', 'hover_on_icon');
  iconFront.setAttribute('title', 'Front-View');
  iconFront.src = "assets/icons/Front.png";
  iconFront.style.padding = "5px";
  //back
  var iconBack = document.createElement("img");
  iconBack.setAttribute('style', 'width: 32px; height: 32px;');
  iconBack.setAttribute('class', 'hover_on_icon');
  iconBack.setAttribute('title', 'Back-View');
  iconBack.src = "assets/icons/Back.png";
  iconBack.style.padding = "5px";
  //Reset
  var iconReset = document.createElement("img");
  iconReset.setAttribute('style', 'width: 32px; height: 32px;');
  iconReset.setAttribute('class', 'hover_on_icon');
  iconReset.setAttribute('title', 'Reset-View');
  iconReset.src = "assets/icons/reset.png";
  iconReset.style.padding = "5px";
  //PAN
  var iconPAN = document.createElement("img");
  iconPAN.id = "PAN";
  iconPAN.setAttribute('style', 'width: 32px; height: 32px;');
  iconPAN.setAttribute('class', 'hover_on_icon');
  iconPAN.setAttribute('title', 'PAN-Toggle');
  iconPAN.src = "assets/icons/PAN.png";
  iconPAN.style.padding = "5px";
  //Toggle Enclosure
  var iconToggleEnclosure = document.createElement("img");
  iconToggleEnclosure.setAttribute('style', 'width: 32px; height: 32px;');
  iconToggleEnclosure.setAttribute('class', 'hover_on_icon');
  iconToggleEnclosure.setAttribute('title', 'Enclosure-Toggle');
  iconToggleEnclosure.src = "assets/icons/enclosure.png";
  iconToggleEnclosure.style.padding = "5px";

  var iconToggleOpacityEnclosure = document.createElement("img");
  iconToggleOpacityEnclosure.setAttribute('style', 'width: 32px; height: 32px;');
  iconToggleOpacityEnclosure.setAttribute('class', 'hover_on_icon');
  iconToggleOpacityEnclosure.setAttribute('title', 'Enclosure-Opacity-Toggle');
  iconToggleOpacityEnclosure.src = "assets/icons/opacity.png";
  iconToggleOpacityEnclosure.style.padding = "5px";

  iconToggleOpacityEnclosure.onclick = function () {
    if (enclosureFlags == true)
      iconToggleOpacityValueEnclosure();
    else
      // displayAnimationMessage("please enable visibility of enclosure first")
      messages.showWarning("Please enable visibility of enclosure first", ``)
  }

  iconToggleEnclosure.onclick = function () {
    toggleEnclosure();
  }
  // Toggle JSON points
  /*  var iconTogglePoints = document.createElement("img");
   iconTogglePoints.setAttribute('style', 'width: 25px; height: 25px;');
   iconTogglePoints.setAttribute('title', 'Points-Toggle');
   iconTogglePoints.src = "assets/icons/points.png";
   iconTogglePoints.style.padding = "5px";

   iconTogglePoints.onclick = function () {
     togglePoints();
   } */

  viewContainer.appendChild(iconTop);
  viewContainer.appendChild(iconBottom);
  viewContainer.appendChild(iconRight);
  viewContainer.appendChild(iconLeft);
  viewContainer.appendChild(iconFront);
  viewContainer.appendChild(iconBack);
  viewContainer.appendChild(iconReset);
  viewContainer.appendChild(iconPAN);
  viewContainer.appendChild(iconToggleEnclosure);
  viewContainer.appendChild(iconToggleOpacityEnclosure);
  //viewContainer.appendChild(iconTogglePoints)

  iconTop.onclick = function () {
    SetOrientation("TopView")
  }
  iconBottom.onclick = function () {
    SetOrientation("BottomView")
  }
  iconRight.onclick = function () {
    SetOrientation("RightView")
  }
  iconLeft.onclick = function () {
    SetOrientation("LeftView")
  }
  iconFront.onclick = function () {
    SetOrientation("FrontView")
  }
  iconBack.onclick = function () {
    SetOrientation("BackView")
  }
  iconReset.onclick = function () {
    SetOrientation("ResetView")
  }
  iconPAN.onclick = function () {
    if (controls.enabled == false) {
      controls.enabled = true;
      (<HTMLImageElement>document.getElementById("PAN")).src = "assets/icons/PAN.png";
    }
    else {
      controls.enabled = false;
      (<HTMLImageElement>document.getElementById("PAN")).src = "assets/icons/PAN-Disable.png";
    }
  }

  container.appendChild(viewContainer);
  container.appendChild(zooomContainer);
}

function displayAnimationMessage(msg: any) {
  var animationMsgVar = setTimeout(function () {
    let msgDiv = document.getElementsByClassName("general-message")[0];
    if (msgDiv) msgDiv.parentNode!.removeChild(msgDiv);
  }, 3000);

  let msgDiv = document.getElementsByClassName("general-message")[0];
  if (msgDiv) {
    msgDiv.parentNode!.removeChild(msgDiv);
    clearInterval(animationMsgVar);
  }
  let div = document.createElement("div");
  div.className = "general-message";
  let p = document.createElement("p");
  p.innerText = msg;
  p.style.margin = "10px";
  div.setAttribute('style', ' position: fixed; z-index: 10; right: 10px; height: 50px; bottom: 10px; font-size: 25px;  background-color: #1A325F; border-radius: 2px;  color: #C0CEE1');
  //div.setAttribute('style',' animation: animation-msg-fadein 0.5s, animation-msg-fadeout 0.5s 2.5s;');
  div.appendChild(p);
  currentContainer.appendChild(div);
}

//Toggles opacity of enclosure on click
function iconToggleOpacityValueEnclosure() {
  const opacityArr = [1, 0.5, 0];

  let enclosureInnerOpacity: THREE.Mesh = <THREE.Mesh>scene.getObjectByName("enclosureInner");
  let enclosureOuterOpacity: THREE.Mesh = <THREE.Mesh>scene.getObjectByName("enclosureOuter");

  if ((<THREE.Material>enclosureInnerOpacity.material).opacity == opacityArr[0]) {
    (<THREE.Material>enclosureInnerOpacity.material).opacity = opacityArr[1];
    (<THREE.Material>enclosureOuterOpacity.material).opacity = opacityArr[1];
  }
  else if ((<THREE.Material>enclosureOuterOpacity.material).opacity == opacityArr[1]) {
    (<THREE.Material>enclosureInnerOpacity.material).opacity = opacityArr[2];
    (<THREE.Material>enclosureOuterOpacity.material).opacity = opacityArr[2];
  }
  else if ((<THREE.Material>enclosureInnerOpacity.material).opacity == opacityArr[2]) {
    (<THREE.Material>enclosureInnerOpacity.material).opacity = opacityArr[0];
    (<THREE.Material>enclosureOuterOpacity.material).opacity = opacityArr[0];
  }
}

//Toggles enclosure show/hide
function toggleEnclosure() {
  var enclosure = scene.getObjectByName("enclosureGroup");
  if (enclosure!.visible) {
    enclosure!.visible = false;
    enclosureFlags = false;
  }
  else {
    enclosure!.visible = true;
    enclosureFlags = true;
  }
}

//Toggle points show/hide
function togglePoints() {
  var points = scene.getObjectByName("pointGroup");
  if (points!.visible) {
    points!.visible = false;
  }
  else {
    points!.visible = true;
  }
}

//Sets camera position as per view data given by user
function SetOrientation(viewmode: string): void {
  const box = new THREE.Box3();
  box.setFromObject(cellGroup);
  let center = new THREE.Vector3();
  box.getCenter(center);
  let daigonalLength = box.max.clone().distanceTo(box.min);
  var cameraPos = new THREE.Vector3();

  switch (viewmode) {
    case 'TopView':
      cameraPos = new THREE.Vector3(center.x, center.y, center.z + daigonalLength);
      camera.up.set(0, 1, 0);
      break;
    case 'BottomView':
      cameraPos = new THREE.Vector3(center.x, center.y, -(center.z + daigonalLength));
      camera.up.set(0, 1, 0);
      break;
    case 'LeftView':
      cameraPos = new THREE.Vector3(center.x, -(center.y + daigonalLength), center.z);
      camera.up.set(0, 0, 1);
      break;
    case 'RightView':
      cameraPos = new THREE.Vector3(center.x, (center.y + daigonalLength), center.z);
      camera.up.set(0, 0, 1);
      break;
    case 'FrontView':
      cameraPos = new THREE.Vector3(center.x + daigonalLength, center.y, center.z);
      camera.up.set(0, 0, 1);
      break;
    case 'BackView':
      cameraPos = new THREE.Vector3(-(center.x + daigonalLength), center.y, center.z);
      camera.up.set(0, 0, 1);
      break;
    case 'ResetView':
      cameraPos = new THREE.Vector3((center.x + daigonalLength), (center.y + daigonalLength), (center.z + daigonalLength));
      camera.up.set(0, 0, 1);
      AdjustZoom(2);
      break;
    default:
      //console.log('Invalid View Mode ', viewmode);
      break;
  }
  camera.position.copy(cameraPos);
  camera.lookAt(center);
  controls.target.copy(center);
  camera.updateProjectionMatrix();
  controls.update();
}

function DeleteSelectedCylinder() {

}

//Clear Mesh from sceneObject.
function clearAllCylindersFromScene() {
  for (let i = 0; i < sceneObject.children.length; i++) {
    if (sceneObject.children[i].type === "Group" && sceneObject.children[i].name != "pointGroup" && sceneObject.children[i].name != "enclosureGroup") {
      sceneObject.children[i].clear();
      cellGroup.updateMatrixWorld(true);
      sceneObject.updateMatrixWorld(true);

    }
  }
}

//clear all geometries except connectors
function clearCellsButNotConnector() {
  for (let i = 0; i < cellGroup.children.length;) {
    if (!cellGroup.children[i].name.includes("Connector")) {
      cellGroup.remove(cellGroup.children[i]);

    }
    else {
      i++;
    }
  }
}

function CreatePouchGeometryAtPosition(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let Box = createPouchCellWithFillet(boxlength, boxbreadth, boxheight);
  cellGroup.add(Box);
  Box.name = m.toString();
  Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing + j * tabheight1 / 2);
  Box.updateMatrixWorld(true);
}
//Pouch cell
function CreatPouchCells(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        CreatePouchGeometryAtPosition(celllength, cellbreadth, cellheight, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
        m++;
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

//Creates prismatic or pouch cell.
function CreatPrismaticCells(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        CreateBoxGeometryAtPosition(celllength, cellbreadth, cellheight, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
        m++;
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function deletecellfromScene(m: number) {
  let cylinderPresent = <THREE.Mesh>scene.getObjectByName(m.toString());
  cellGroup.remove(cylinderPresent);
  cellGroup.updateMatrixWorld(true);
}

//Creates cylinder cells.
function CreateCells(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any) {
  clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          CreateCylinderAtPosition(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        }
        else {
          CreateStaggeredCylinderAtPosition(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function mapCells(connectorArray: [][]) {
  for (let i = 0; i < connectorArray.length; i++) {
    if (connectorArray[i].length > 0) {
      for (let j = 0; j < connectorArray[i].length; j++) {
        mapCell.set(connectorArray[i][j], i);
      }
    }
  }
}

//Create cells according to connector data
function createCellsAccordingToConnector(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any, connectorArray: [][]) {
  clearAllCylindersFromScene();
  mapCells(connectorArray)
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          CreateCylinderAtPositionAccordingToConnector(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        }
        else {
          CreateStaggeredCylinderAtPositionAccordingToConnector(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function createCellsAccordingToConnectorwithoutTap(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any, connectorArray: [][]) {
  //clearAllCylindersFromScene();
  clearCellsButNotConnector()
  mapCells(connectorArray)
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          CreateCylinderAtPositionAccordingToConnectorWithoutTap(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        }
        else {
          CreateStaggeredCylinderAtPositionAccordingToConnectorWithoutTap(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

//Zooms in/out by perticular margin.
function AdjustZoom(Zoomvalue: number) {
  camera.zoom = Zoomvalue;
  camera.updateProjectionMatrix();
}

//Adds enclosure to cell grid.
function addEnclosure(thickness: number, gap_x: number, gap_y: number, gap_z: number, x: number, y: number, z: number, cylinderdiameter: number, cylinderheight: number, cell_to_cell_gap_x: number, cell_to_cell_gap_y: number, cell_to_cell_gap_z: number, cell_arrangement: any, cell_stagger_dir: any, cell_type: any) {
  let prevEnclosure = scene.getObjectByName('enclosureGroup');
  if (prevEnclosure) {
    prevEnclosure.clear();
  }
  var box = new THREE.Box3();
  box.setFromObject(cellGroup);
  let boxDimension = new THREE.Vector3(); //W H D
  let cellgroupcenter = boxDimension.clone();
  box.getSize(boxDimension);
  box.getCenter(cellgroupcenter);
  cellGroup.localToWorld(cellgroupcenter)
  if (cell_type == "cylindrical") {
    if (cell_arrangement == "grid") {
      var innerEnclosureWidth = (x * cylinderdiameter) + 2 * gap_x + (x - 1) * cell_to_cell_gap_x;
      var innerEnclosureHeight = (y * cylinderdiameter) + 2 * gap_y + (y - 1) * cell_to_cell_gap_y;
    }
    else {
      if (cell_stagger_dir == "x") {
        var innerEnclosureWidth = (x * cylinderdiameter) + 2 * gap_x + (x - 1) * cell_to_cell_gap_x + cylinderdiameter / 2;
        var innerEnclosureHeight = (y * cylinderdiameter) + 2 * gap_y + (y - 1) * cell_to_cell_gap_y;
      }
      else {
        var innerEnclosureWidth = (x * cylinderdiameter) + 2 * gap_x + (x - 1) * cell_to_cell_gap_x;
        var innerEnclosureHeight = (y * cylinderdiameter) + 2 * gap_y + (y - 1) * cell_to_cell_gap_y + cylinderdiameter / 2;
      }
    }
    var innerEnclosureDepth = (z * cylinderheight) + 2 * gap_z + (z - 1) * cell_to_cell_gap_z + z * tapHeight;
  }
  else if (cell_type == "prismatic") {
    var innerEnclosureWidth = (x * celllength1) + 2 * gap_x + (x - 1) * cell_to_cell_gap_x;
    var innerEnclosureHeight = (y * cellThickness1) + 2 * gap_y + (y - 1) * cell_to_cell_gap_y;
    var innerEnclosureDepth = (z * cylinderheight) + 2 * gap_z + (z - 1) * cell_to_cell_gap_z + z * tabheight1 / 2;
  }
  else if (cell_type == "pouch") {
    var innerEnclosureWidth = (x * celllength1) + 2 * gap_x + (x - 1) * cell_to_cell_gap_x;
    var innerEnclosureHeight = (y * cellThickness1) + 2 * gap_y + (y - 1) * cell_to_cell_gap_y;
    var innerEnclosureDepth = (z * cylinderheight) + 2 * gap_z + (z - 1) * cell_to_cell_gap_z + z * tabheight1 / 2;
  }
  let outerEnclosureWidth = innerEnclosureWidth! + 2 * thickness;
  let outerEnclosureHeight = innerEnclosureHeight! + 2 * thickness;
  let outerEnclosureDepth = innerEnclosureDepth! + 2 * thickness;

  const enclosureInnerGeometry = new THREE.BoxGeometry(innerEnclosureWidth!, innerEnclosureHeight!, innerEnclosureDepth!);
  const enclosureInnermaterial = new THREE.MeshPhysicalMaterial({ color: 0xA8A9AD, opacity: 1, transparent: true, /* depthWrite: true */ });
  const enclosureInner = new THREE.Mesh(enclosureInnerGeometry, enclosureInnermaterial);
  enclosureInner.renderOrder = 20;
  const enclosureOuterGeometry = new THREE.BoxGeometry(outerEnclosureWidth, outerEnclosureHeight, outerEnclosureDepth);
  const enclosureOutermaterial = new THREE.MeshPhysicalMaterial({ color: 0xA8A9AD, opacity: 1, transparent: true, /* depthWrite: false  */ });
  const enclosureOuter = new THREE.Mesh(enclosureOuterGeometry, enclosureOutermaterial);
  enclosureOuter.renderOrder = 21;
  enclosureInner.name = "enclosureInner";
  enclosureOuter.name = "enclosureOuter";
  enclosureGroup.add(enclosureOuter);
  enclosureGroup.add(enclosureInner);
  // scene.updateMatrixWorld(true, true);
  scene.updateMatrixWorld(true);
  let dirvec = new THREE.Vector3().sub(cellgroupcenter);
  let dist = cellgroupcenter.distanceTo(new THREE.Vector3());

  let newpos = new THREE.Vector3().clone().add(dirvec.normalize().multiplyScalar(dist));
  cellGroup.position.copy(newpos);

  enclosureGroup.add(enclosureOuter);
  enclosureGroup.add(enclosureInner);

  //scene.updateMatrixWorld(true, true);
  scene.updateMatrixWorld(true);
  var box1 = new THREE.Box3();
  box1.setFromObject(enclosureOuter);
  let minvec = box1.min;
  let secdirvec = new THREE.Vector3().sub(minvec);
  let dist2 = new THREE.Vector3().distanceTo(minvec);
  let newpos2 = new THREE.Vector3().clone().add(secdirvec.normalize().multiplyScalar(dist2));
  enclosureOuter.position.copy(newpos2);
  //scene.updateMatrixWorld(true, true);
  scene.updateMatrixWorld(true);

  let thicknessvector = new THREE.Vector3(thickness, thickness, thickness);

  box1.setFromObject(enclosureInner);
  let maxvec = box1.max.clone().add(thicknessvector);
  secdirvec = maxvec.sub(new THREE.Vector3())
  dist2 = new THREE.Vector3().distanceTo(maxvec);
  newpos2 = new THREE.Vector3().clone().add(secdirvec.normalize().clone().multiplyScalar(dist2));
  enclosureInner.position.copy(newpos2);
  //scene.updateMatrixWorld(true, true);
  scene.updateMatrixWorld(true);

  box1.setFromObject(cellGroup);
  let mincellgrooup = box1.min;
  let myvec = new THREE.Vector3().sub(mincellgrooup.clone());
  let dist4 = new THREE.Vector3().distanceTo(mincellgrooup.clone());
  let newpt = cellGroup.position.clone().add(myvec.normalize().multiplyScalar(dist4));
  cellGroup.position.copy(newpt);
  //scene.updateMatrixWorld(true, true);
  scene.updateMatrixWorld(true);

  let gapvector = new THREE.Vector3(gap_x, gap_y, gap_z);

  box1.setFromObject(cellGroup);
  maxvec = box1.min.clone().add(thicknessvector).clone().add(gapvector);
  secdirvec = maxvec.sub(new THREE.Vector3())
  dist2 = new THREE.Vector3().distanceTo(maxvec);
  newpos2 = new THREE.Vector3().clone().add(secdirvec.normalize().clone().multiplyScalar(dist2));
  cellGroup.position.copy(newpos2);
  enclosureGroup.visible = false;

}


function CreatePt(pt: THREE.Vector3, check: boolean) {
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  let material11;
  if (check) {
    material11 = new THREE.MeshBasicMaterial({ color: "red" });
  }
  else {
    material11 = new THREE.MeshBasicMaterial({ color: 0x15f4e2 });
  }
  const sphere = new THREE.Mesh(geometry, material11);
  sphere.position.copy(pt);
  cellGroup.add(sphere);


}

//Light
function addPlane() {
  const sceneBb = new THREE.Box3();
  sceneBb.setFromObject(cellGroup);
  const lengthX = sceneBb.max.x - sceneBb.min.x;
  const lengthY = sceneBb.max.y - sceneBb.min.y;
  const lengthZ = sceneBb.max.z - sceneBb.min.z;

  let max = lengthX;
  if (lengthY > max) max = lengthY;
  if (lengthZ > max) max = lengthZ;

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(10 * max, 10 * max, 8, 8), new THREE.MeshBasicMaterial({ color: 0xb3e0ff, alphaTest: 0, visible: false }));
  plane.name = "Light_plane";
  scene.add(plane);
  return plane;
}

function setRayCaster(event: any) {
  const mouse = new THREE.Vector2()
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycasterGlobal.setFromCamera(mouse, camera);
}

function getIntersectedObject(event: any, object: any) {
  setRayCaster(event)
  const mouse = new THREE.Vector2()
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycasterGlobal.setFromCamera(mouse, camera);
  return raycasterGlobal.intersectObjects(object, true);
}

function onMouseUp() {
  controls.enabled = true;
  selectedLight = null;
}


function onMouseMove() {
  setRayCaster(event);
  if (selectedLight) {
    var intersects = raycasterGlobal.intersectObject(referencePlane);
    const vectorp = new THREE.Vector3();
    offset.x = 0; offset.y = 0; offset.z = 0;
    if (intersects[0]) {
      if (intersects[0].point) {
        vectorp.copy(intersects[0].point.sub(offset));
      }
    }
    selectedLight.parent.position.copy(vectorp);
  } else {
    if (lightsObject) {
      const intersects = raycasterGlobal.intersectObjects(lightsObject.children, true);

      if (intersects.length > 0) {
        referencePlane.position.copy(intersects[0].object.parent!.position);
        referencePlane.lookAt(camera.position);
      } else {

      }
    }
  }
}

function onMouseDown(event: any) {
  setRayCaster(event);
  if (event.button === 0) {
    if (lightsObject) {
      const intersectedObject = getIntersectedObject(event, lightsObject.children);

      if (intersectedObject.length > 0) {
        controls.enabled = false;
        selectedLight = intersectedObject[0].object;
        let intersects = raycasterGlobal.intersectObject(referencePlane);
        offset.copy(intersects[0].point);
        offset.sub(referencePlane.position);

      } else {

      }
    }

  }
}

function setLightsEnv() {
  referencePlane = addPlane();
  lightsObject = new THREE.Object3D();
  lightsObject.name = "Light";
  scene.add(lightsObject);
  renderer.domElement.addEventListener("mousedown", onMouseDown, false);
  renderer.domElement.addEventListener("mousemove", onMouseMove, false);
  renderer.domElement.addEventListener("mouseup", onMouseUp, false);
  // renderer.domElement.addEventListener("contextmenu", onContextMenu, false);
}

function scaleObject(boundingBox: any) {
  "use strict";
  var xDimension = boundingBox.max.x - boundingBox.min.x;
  var yDimension = boundingBox.max.y - boundingBox.min.y;
  var zDimension = boundingBox.max.z - boundingBox.min.z;

  var maxOfXY = Math.max(xDimension, yDimension);
  var lengthOfLargestDimension = Math.max(maxOfXY, zDimension);
  var scaleFactor = 1 / lengthOfLargestDimension * (60 + ((zoomPercentage / 100) * 60));
  return scaleFactor;
}

function getBoundingBoxLight(light: any) {
  let bbox = new THREE.Box3();
  bbox.setFromObject(cellGroup);
  let bboxMaxVal;
  if (bbox.max.x > bbox.max.y && bbox.max.x > bbox.max.z) {
    bboxMaxVal = bbox.max.x;
  }
  else if (bbox.max.y > bbox.max.z) {
    bboxMaxVal = bbox.max.y;
  }
  else {
    bboxMaxVal = bbox.max.z;
  }

  light.shadow.camera.left = - bboxMaxVal;
  light.shadow.camera.right = bboxMaxVal;
  light.shadow.camera.top = bboxMaxVal;
  light.shadow.camera.bottom = - bboxMaxVal;

  return light;
}
function getSphere(scaleFactor: any, color: any) {
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({ color: color }));
  sphere.position.set(0, 0, 0);
  sphere.scale.set(1 / scaleFactor, 1 / scaleFactor, 1 / scaleFactor);
  return sphere;
}
function addSpotLight(color: number, intensity: number, distance: number, angle: number, penumbra: number, decay: number, pos: any) {
  const spotLight = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
  const sceneBb = new THREE.Box3();
  sceneBb.setFromObject(cellGroup);
  const scaleFactor = scaleObject(sceneBb);
  const bbCentre = new THREE.Vector3();
  sceneBb.getCenter(bbCentre);
  spotLight.position.set((pos.x / scaleFactor + bbCentre.x), (pos.y / scaleFactor + bbCentre.y), (pos.z / scaleFactor + bbCentre.z));
  spotLight.castShadow = false;
  let retSpotLight = getBoundingBoxLight(spotLight);
  retSpotLight.add(getSphere(scaleFactor, 0x00ff00));
  lightsObject.add(retSpotLight);
  selectedLight = retSpotLight.children[0];
  return spotLight;
}

function addLight(name: string) {
  if (!lightsObject) {
    setLightsEnv();
  }

  let defaultPos = { x: 0, y: 0, z: 0 };
  name = name.substring(15, 5);
  switch (name) {
    case "Spot Light": addSpotLight(0xffffff, 1, 200, Math.PI / 4, 0.05, 2, defaultPos);
      boolAddLights = true;
      break;
    default:
      console.log(name + ": This option not found");
  }

}

function lighPallet() {
  let SeriesOfLight = ["Spot Light"];

  selectLight = <HTMLSelectElement>document.createElement("select");
  selectLight.classList.add("form-control");
  selectLight.name = "Light";
  selectLight.id = "Light";
  var optionDefault = document.createElement("option");
  optionDefault.value = "None";
  optionDefault.innerText = "None";
  selectLight.appendChild(optionDefault);
  optionDefault.setAttribute('selected', 'selected');
  let label = document.createElement("label");
  for (let light of SeriesOfLight) {
    let option = document.createElement("option");
    option.value = light;
    option.innerText = light;
    selectLight.appendChild(option);

  }
  label.setAttribute('style', 'position: relative;display: inline-block;top: 6%;float:left');
  label.innerHTML = "Light : "
  label.htmlFor = "Light";

  selectLight.onchange = () => addLight(selectLight.innerText);
  currentContainer.appendChild(label).appendChild(selectLight);

}
//Loads temperature point on the scene using JSON data.
function loadHeatPoints() {
  var points = scene.getObjectByName("Points");
  if (!points) {
    const loader = new THREE.BufferGeometryLoader();
    loader.load('assets/JSON/CES_5P20S_Temperature_data_heatmap.json', function (geometry) {
      const positionAttribute = geometry.getAttribute('position');
      const count = geometry.attributes['position'].count;

      geometry.center();
      geometry.computeVertexNormals();
      let vertices = [];
      for (let i = 0; i < positionAttribute.count; i++) {

        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);
        vertices.push(vertex);

      }
      const pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
      const pointsMaterial = new THREE.PointsMaterial({
        color: new THREE.Color("red"),
        size: 1,
        alphaTest: 0.5
      });
      const points = new THREE.Points(pointsGeometry, pointsMaterial);
      points.name = 'Points';
      pointGroup.add(points);
      //sceneObject.add(pointGroup);

      // scene.add(sceneObject);
    });
  }
}

//Checks if any heatmap point is inside cylinder if not it calculate it using raycaster
function CheckIfPointPresentInsideCylinder(mesh: THREE.Mesh, json: heatmapdata[]) {
  let newarr: heatmapdata[] = [];
  scene.updateMatrixWorld(true);
  mesh.updateMatrixWorld();
  if (!mesh.userData["heatmapIntersection"]) {
    for (let i = 0; i < json.length; i++) {
      let origin = new THREE.Vector3(json[i].xCoord, json[i].yCoord, json[i].zCoord);
      let dir1 = new THREE.Vector3(0, 0, 1);
      let dir2 = new THREE.Vector3(0, 1, 0);
      let dir3 = new THREE.Vector3(1, 0, 0);
      let dir4 = new THREE.Vector3(0, 0, -1);
      let dir5 = new THREE.Vector3(0, -1, 0);
      let dir6 = new THREE.Vector3(-1, 0, 0);
      let raycaster = new THREE.Raycaster(origin, dir1);
      let raycaster2 = new THREE.Raycaster(origin, dir2);
      let raycaster3 = new THREE.Raycaster(origin, dir3);
      let raycaster4 = new THREE.Raycaster(origin, dir4);
      let raycaster5 = new THREE.Raycaster(origin, dir5);
      let raycaster6 = new THREE.Raycaster(origin, dir6);
      const intersects = raycaster.intersectObjects([mesh]);
      const intersects2 = raycaster2.intersectObjects([mesh], true);
      const intersects3 = raycaster3.intersectObjects([mesh], true);
      const intersects4 = raycaster4.intersectObjects([mesh], true);
      const intersects5 = raycaster5.intersectObjects([mesh], true);
      const intersects6 = raycaster6.intersectObjects([mesh], true);
      if (1 == intersects.length || 1 == intersects2.length || 1 == intersects3.length || 1 == intersects4.length || 1 == intersects5.length || 1 == intersects6.length) {
        newarr.push(json[i]);
      }
    }
    mesh.userData["heatmapIntersection"] = newarr;
  }
  return mesh.userData["heatmapIntersection"];
}

function checkifDataPresentinCell(mesh: THREE.Mesh, tempcondition: number, json: heatmapdata[]) {
  if (mesh instanceof THREE.Mesh) {
    if (!mesh.userData["heatmapdata"]) {
      let bbox = new THREE.Box3().setFromObject(mesh);
      let myarr = json.filter((x: { time: number; xCoord: number; yCoord: number; zCoord: number; }) => (x.xCoord > bbox.min.x && x.yCoord > bbox.min.y && x.zCoord > bbox.min.z
        && x.xCoord < bbox.max.x && x.yCoord < bbox.max.y && x.zCoord < bbox.max.z));
      mesh.userData["heatmapdata"] = myarr;
    }
    return mesh.userData["heatmapdata"].filter((x: { time: number }) => (tempcondition == x.time));
  }
}
let GetmygappedArrayValues = (start: number, end: number, gap: number): number[] => {
  if (start > end) {
    return (GetmygappedArrayValues(end, start, gap)).reverse();
  }
  let step = (end - start) / (gap + 1);
  let temparr: number[] = [];
  for (let i = 1; i <= gap; i++) {
    temparr.push(start + (i * step));
  }
  return temparr;
}

function heatMapArray(initialarray: number[]) {

  let numberofgaps: number = initialarray.length - 1;
  let sizeofnewarray: number = 50;

  let numberofelementsrequired: number = sizeofnewarray - initialarray.length;
  let elementsInEachGap: number = numberofelementsrequired / numberofgaps;
  let remainingelements: number = numberofelementsrequired % numberofgaps;

  var finalarray = [];

  for (let i = 0; i < initialarray.length - 1; i++) {
    finalarray.push(initialarray[i]);
    if (i == initialarray.length - 2)
      finalarray.push(...GetmygappedArrayValues(initialarray[i], initialarray[i + 1], elementsInEachGap + remainingelements));
    else
      finalarray.push(...GetmygappedArrayValues(initialarray[i], initialarray[i + 1], elementsInEachGap));
  }
  finalarray.push(initialarray[initialarray.length - 1]);

  //console.log("finalarray ", finalarray);
  return finalarray;
}

function heatMapArray21(initialarray: number[]) {

  let numberofgaps: number = initialarray.length - 1;
  let sizeofnewarray: number = 21;

  let numberofelementsrequired: number = sizeofnewarray - initialarray.length;
  let elementsInEachGap: number = numberofelementsrequired / numberofgaps;
  let remainingelements: number = numberofelementsrequired % numberofgaps;

  var finalarray = [];

  for (let i = 0; i < initialarray.length - 1; i++) {
    finalarray.push(initialarray[i]);
    if (i == initialarray.length - 2)
      finalarray.push(...GetmygappedArrayValues(initialarray[i], initialarray[i + 1], elementsInEachGap + remainingelements));
    else
      finalarray.push(...GetmygappedArrayValues(initialarray[i], initialarray[i + 1], elementsInEachGap));
  }
  finalarray.push(initialarray[initialarray.length - 1]);

  //console.log("finalarray ", finalarray);
  return finalarray;
}

function getTemperatureArray(bbarray: any[]) {
  var temparray = [];
  for (let i = 0; i < bbarray.length; i++) {
    temparray.push(bbarray[i].temperature);
  }
  return temparray;
}

function connectorStartEndTemperature(child: any, bbarray: any, l: number) {

  let coordinates: Float32Array = child.geometry.attributes['position'].array;
  let ptCout = coordinates.length / 3;
  let arr = [];
  for (let i = 0; i < 8;) {
    let p = new THREE.Vector3(coordinates[i * 3], coordinates[i * 3 + 1], coordinates[i * 3 + 2]);
    arr.push(p);
    i = i + 2;
  }
  let face11 = new THREE.Vector3(arr[0].x, arr[0].y, arr[0].z);
  let face12 = new THREE.Vector3(arr[1].x, arr[1].y, arr[1].z);
  let face21 = new THREE.Vector3(arr[2].x, arr[2].y, arr[2].z);
  let face22 = new THREE.Vector3(arr[3].x, arr[3].y, arr[3].z);
  let midPoint1 = face11.clone().add(face11.clone().sub(face12).normalize().multiplyScalar(face11.distanceTo(face12) / 2));
  let midPoint2 = face21.clone().add(face21.clone().sub(face22).normalize().multiplyScalar(face21.distanceTo(face22) / 2));
  let arrFace = [midPoint1, midPoint2];

  let mindist = 10000000;
  let updatedtemp = 1;
  let closestptfromjson = new THREE.Vector3();
  let vectorUsed = arrFace[l];
  let pos = new THREE.Vector3().copy(vectorUsed);
  child.localToWorld(pos);
  cellGroup.localToWorld(pos);
  for (let i = 0; i < bbarray.length; i++) {
    let pts = new THREE.Vector3(bbarray[i].xCoord, bbarray[i].yCoord, bbarray[i].zCoord);
    let dist = pts.distanceTo(pos);
    if (dist < mindist) {
      closestptfromjson = pts;
      mindist = dist;
      updatedtemp = bbarray[i].temperature;
    }
  }

  return updatedtemp;
}

function returnCellNOFromString(str: String) {
  let str1 = str.slice(9, str.length);
  let strSplit = str1.split("\&");
  return strSplit;
}

//Heatmap for cylindrical cells connector
function repaintConnectorCylindrical(tempcondition: string, maxtemperature: number, mintemperature: number, json: heatmapdata[]) {
  if (maxtemperature == mintemperature)
    mintemperature = maxtemperature + 0.1;
  lut.setMax(maxtemperature);
  lut.setMin(mintemperature);
  let tempArray: number[] = [];
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if (child1.name.includes("Connector")) {
      let child = <THREE.Mesh>child1;
      let cellNoArray = returnCellNOFromString(child.name);
      let cell1 = <THREE.Mesh>cellGroup.getObjectByName(cellNoArray[0]);
      let cell2 = <THREE.Mesh>cellGroup.getObjectByName(cellNoArray[1]);
      if (cell1 != undefined && cell2 != undefined) {
        let cylinderCell1 = <THREE.Mesh>cell1.children[0];
        let cylinderCell2 = <THREE.Mesh>cell2.children[0];
        let bbarray1 = checkifDataPresentinCell(cylinderCell1, eval(tempcondition), json);
        bbarray1 = CheckIfPointPresentInsideCylinder(cylinderCell1, bbarray1);
        let bbarray2 = checkifDataPresentinCell(cylinderCell2, eval(tempcondition), json);
        bbarray2 = CheckIfPointPresentInsideCylinder(cylinderCell2, bbarray2);

        let temp1 = connectorStartEndTemperature(cylinderCell1, bbarray1, 0);
        let temp2 = connectorStartEndTemperature(cylinderCell2, bbarray2, 1);
        tempArray = [temp1, temp2];
      }
      else {
        if (cell1 == undefined) {
          //let cylinderCell1 = <THREE.Mesh>cell1.children[0];
          let cylinderCell2 = <THREE.Mesh>cell2.children[0];
          // let bbarray1 = checkifDataPresentinCell(cylinderCell1, eval(tempcondition), json);
          //bbarray1 = CheckIfPointPresentInsideCylinder(cylinderCell1, bbarray1);
          let bbarray2 = checkifDataPresentinCell(cylinderCell2, eval(tempcondition), json);
          bbarray2 = CheckIfPointPresentInsideCylinder(cylinderCell2, bbarray2);

          // let temp1 = connectorStartEndTemperature(cylinderCell1,bbarray1,0);
          let temp2 = connectorStartEndTemperature(cylinderCell2, bbarray2, 1);
          let temp1 = temp2 - 1;
          tempArray = [temp1, temp2];
        }
        else if (cell2 == undefined) {
          let cylinderCell1 = <THREE.Mesh>cell1.children[0];
          //let cylinderCell2 = <THREE.Mesh>cell2.children[0];
          let bbarray1 = checkifDataPresentinCell(cylinderCell1, eval(tempcondition), json);
          bbarray1 = CheckIfPointPresentInsideCylinder(cylinderCell1, bbarray1);
          //let bbarray2 = checkifDataPresentinCell(cylinderCell2, eval(tempcondition), json);
          //  bbarray2 = CheckIfPointPresentInsideCylinder(cylinderCell2, bbarray2);

          let temp1 = connectorStartEndTemperature(cylinderCell1, bbarray1, 0);
          //let temp2 = connectorStartEndTemperature(cylinderCell2,bbarray2,1);
          let temp2 = temp1 - 1;
          tempArray = [temp1, temp2];
        }
      }

      var segmentArray = heatMapArray21(tempArray);

      let geometry1 = child.geometry;
      const count = geometry1.attributes['position'].count;
      geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const positions1 = geometry1.attributes['position'];
      const colors1 = geometry1.attributes['color'];

      var countSegmant = Math.round(count / segmentArray.length);
      for (let i = 0; i < segmentArray.length; i++) {
        const color = lut.getColor(segmentArray[i]);
        colorPerticularsegment(i, colors1, color);
      }
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: false,
        vertexColors: true,
        shininess: 0,
        side: THREE.DoubleSide
      });

      const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
      child.geometry.dispose();
      child.geometry = geometry1;
      child.material = material;
      child.updateMatrixWorld(true);

    }
  }
}

//Heatmap for cylinder cells.
function RepaintGrid(tempcondition: string, maxtemperature: number, mintemperature: number, json: heatmapdata[]) {
  if (maxtemperature == mintemperature)
    mintemperature = maxtemperature + 0.1;
  lut.setMax(maxtemperature);
  lut.setMin(mintemperature);
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if ("Group" == child1.type) {
      let child = <THREE.Mesh>child1.children[0];
      let bbarray = [];
      bbarray = checkifDataPresentinCell(child, eval(tempcondition), json);
      bbarray = CheckIfPointPresentInsideCylinder(child, bbarray);
      var tempArray = getTemperatureArray(bbarray);
      if (tempArray.length > 2) {
        let maxtemperatureforthismap = Math.max.apply(Math, tempArray);
        let mintemperatureforthismap = Math.min.apply(Math, tempArray);
        tempArray = [];
        tempArray.push(maxtemperatureforthismap);
        tempArray.push(mintemperatureforthismap);
      }
      let isFlipped = trackCell.get(child1.name.toString());
      var segmentArray = heatMapArray(tempArray);
      /* if(isFlipped == "Flipped"){
        segmentArray = segmentArray.reverse();
      } */
      /*   for (let p = 0; p < bbarray.length; p++) {
         CreatePt(new THREE.Vector3(bbarray[p].xCoord, bbarray[p].yCoord, bbarray[p].zCoord))
       } */
      let geometry1 = child.geometry;
      const count = geometry1.attributes['position'].count;
      geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const positions1 = geometry1.attributes['position'];
      const colors1 = geometry1.attributes['color'];

      var countSegmant = Math.round(count / segmentArray.length);
      if (segmentArray.length > 1) {
        for (let j = 0; j < segmentArray.length; j++) {
          let x = countSegmant * (j);
          for (let i = x; i < countSegmant * (j + 1); i++) {


            if (i > 2400 && i < 2715) {
              let color = lut.getColor(segmentArray[0]);      //Top circle
              //colors1.setXYZ(i,0, 255 , 0);
              colors1.setXYZ(i, color.r, color.g, color.b);
            }
            else if (i > 2715) {
              let color = lut.getColor(segmentArray[20]);
              // colors1.setXYZ(i,0, 255 , 255);                 //Bottom circle
              colors1.setXYZ(i, color.r, color.g, color.b);
            }
            else if (i > 1600 && i < 2000) {
              let color = lut.getColor(segmentArray[20]);    // bottom ring
              // colors1.setXYZ(i,0, 255 , 0);
              colors1.setXYZ(i, color.r, color.g, color.b);
            }
            else if (i > 2000 && i < 2400) {
              let color = lut.getColor(segmentArray[0]);   // top ring
              // colors1.setXYZ(i,0, 255 , 0);
              colors1.setXYZ(i, color.r, color.g, color.b);
            }
            else {
              let color = lut.getColor(segmentArray[j]);
              colors1.setXYZ(i, color.r, color.g, color.b);   // main cylinder
            }
          }

        }
      }
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: false,
        vertexColors: true,
        shininess: 0,
        side: THREE.DoubleSide
      });

      const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
      child.geometry.dispose();
      //child.material.dispose();
      child.geometry = geometry1;
      child.material = material;
      child.updateMatrixWorld(true);
      // render();
    }
  }
}

function colorPerticularsegment(n: number, colors1: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, color: THREE.Color) {
  //face1
  colors1.setXYZ(125 - n, color.r, color.g, color.b);
  colors1.setXYZ(125 + 21 - n, color.r, color.g, color.b);  //146
  colors1.setXYZ(125 - 21 - n, color.r, color.g, color.b);  //104
  colors1.setXYZ(125 + 42 - n, color.r, color.g, color.b);

  //face2
  // colors1.setXYZ(314+n*7, 1, 1, 0);//YELLOW
  colors1.setXYZ(315 + n * 7, color.r, color.g, color.b);//YELLOW
  colors1.setXYZ(316 + n * 7, color.r, color.g, color.b);
  colors1.setXYZ(317 + n * 7, color.r, color.g, color.b);
  colors1.setXYZ(318 + n * 7, color.r, color.g, color.b);
  colors1.setXYZ(319 + n * 7, color.r, color.g, color.b);
  colors1.setXYZ(320 + n * 7, color.r, color.g, color.b);
  colors1.setXYZ(321 + n * 7, color.r, color.g, color.b)

  //face3
  colors1.setXYZ(314 - n * 7, color.r, color.g, color.b);//WHITE
  colors1.setXYZ(313 - n * 7, color.r, color.g, color.b);
  colors1.setXYZ(312 - n * 7, color.r, color.g, color.b);
  colors1.setXYZ(311 - n * 7, color.r, color.g, color.b);
  colors1.setXYZ(310 - n * 7, color.r, color.g, color.b);
  colors1.setXYZ(309 - n * 7, color.r, color.g, color.b);
  colors1.setXYZ(308 - n * 7, color.r, color.g, color.b);

  //FACE4
  colors1.setXYZ(0 + n, color.r, color.g, color.b) //RED
  colors1.setXYZ(21 + n, color.r, color.g, color.b);
  colors1.setXYZ(42 + n, color.r, color.g, color.b);
  colors1.setXYZ(63 + n, color.r, color.g, color.b);
  if (0 == n) {
    for (let i = 462; i < 490; i++) {
      colors1.setXYZ(i, color.r, color.g, color.b);
    }
  }
  if (20 == n) {
    for (let i = 490; i < 529; i++) {
      colors1.setXYZ(i, color.r, color.g, color.b);
    }
  }
}

//Maps 12 points to pouch an prismatic cells.
function fourSideArray12(bbarray: any[]) {
  let zCoords: any[] = [];
  let xCoords: any[] = [];
  let yCoords: any[] = [];
  let point1: any = []; //top1
  let point2: any = [];//top2
  let point3: any = [];//top3
  let point4: any = [];//top4
  let point5: any = [];//middle1
  let point6: any = [];//middle2
  let point7: any = [];//middle3
  let point8: any = [];//middle4
  let point9: any = []; //bottom1
  let point10: any = []; //bottom2
  let point11: any = []; //bottom3
  let point12: any = []; //bottom4

  let bbarrayInForm = [];



  for (let i = 0; i < bbarray.length; i++) {
    zCoords.push(bbarray[i].zCoord);
    yCoords.push(bbarray[i].yCoord);
    xCoords.push(bbarray[i].xCoord);
  }

  xCoords.sort();
  yCoords.sort();
  zCoords.sort();
  //z
  point1[2] = zCoords[zCoords.length - 1];
  point2[2] = zCoords[zCoords.length - 2];     // top z
  point3[2] = zCoords[zCoords.length - 3];
  point4[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point5[2] = zCoords[zCoords.length - 1];
  point6[2] = zCoords[zCoords.length - 2];  //middle z
  point7[2] = zCoords[zCoords.length - 3];
  point8[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point9[2] = zCoords[zCoords.length - 1]
  point10[2] = zCoords[zCoords.length - 2];
  point11[2] = zCoords[zCoords.length - 3];  // bottom z
  point12[2] = zCoords[zCoords.length - 4];

  //y
  point1[1] = yCoords[yCoords.length - 1];
  point2[1] = yCoords[yCoords.length - 2];     // top y
  point3[1] = yCoords[yCoords.length - 3];
  point4[1] = yCoords[yCoords.length - 4];

  yCoords.pop();
  yCoords.pop();
  yCoords.pop();
  yCoords.pop();

  point5[1] = yCoords[yCoords.length - 1];
  point6[1] = yCoords[yCoords.length - 2];  //middle y
  point7[1] = yCoords[yCoords.length - 3];
  point8[1] = yCoords[yCoords.length - 4];

  yCoords.pop();
  yCoords.pop();
  yCoords.pop();
  yCoords.pop();

  point9[1] = yCoords[yCoords.length - 1];
  point10[1] = yCoords[yCoords.length - 2];
  point11[1] = yCoords[yCoords.length - 3];  // bottom y
  point12[1] = yCoords[yCoords.length - 4];

  //x
  point1[0] = xCoords[xCoords.length - 1];
  point2[0] = xCoords[xCoords.length - 2];     // top x
  point3[0] = xCoords[xCoords.length - 3];
  point4[0] = xCoords[xCoords.length - 4];

  xCoords.pop();
  xCoords.pop();
  xCoords.pop();
  xCoords.pop();

  point5[0] = xCoords[xCoords.length - 1];
  point6[0] = xCoords[xCoords.length - 2];  //middle x
  point7[0] = xCoords[xCoords.length - 3];
  point8[0] = xCoords[xCoords.length - 4];

  xCoords.pop();
  xCoords.pop();
  xCoords.pop();
  xCoords.pop();

  point9[0] = xCoords[xCoords.length - 1];
  point10[0] = xCoords[xCoords.length - 2];
  point11[0] = xCoords[xCoords.length - 3];  // bottom x
  point12[0] = xCoords[xCoords.length - 4];

  bbarrayInForm.push(point1);
  bbarrayInForm.push(point2);
  bbarrayInForm.push(point3);
  bbarrayInForm.push(point4);
  bbarrayInForm.push(point5);
  bbarrayInForm.push(point6);
  bbarrayInForm.push(point7);
  bbarrayInForm.push(point8);
  bbarrayInForm.push(point9);
  bbarrayInForm.push(point10);
  bbarrayInForm.push(point11);
  bbarrayInForm.push(point12);
  let tempArray = [];
  for (let i = 0; i < bbarrayInForm.length; i++) {
    for (let j = 0; j < bbarray.length; j++) {
      if (bbarrayInForm[i][0] == bbarray[j].xCoord && bbarrayInForm[i][1] == bbarray[j].yCoord && bbarrayInForm[i][2] == bbarray[j].zCoord) {
        tempArray.push(bbarray[j].temperature);
        break;
      }
    }
  }

  let side1 = [tempArray[0], tempArray[4], tempArray[8]]; //top1.middle1,bottom1
  let side2 = [tempArray[1], tempArray[5], tempArray[9]]; //top2.middle2,bottom2
  let side3 = [tempArray[2], tempArray[6], tempArray[10]]; //top3.middle3,bottom3
  let side4 = [tempArray[3], tempArray[7], tempArray[11]]; //top4.middle4,bottom4

  let finalArray = [side1, side2, side3, side4];

  return finalArray;
}

//Maps 45 points to pouch an prismatic cells.
function fourSideArray45(bbarray: any[]) {
  let zCoords: any[] = [];
  let xCoords: any[] = [];
  let yCoords: any[] = [];
  let point1: any = []; //top1
  let point2: any = [];//top2
  let point3: any = [];//top3
  let point4: any = [];//top4
  let point5: any = [];//;
  let point6: any = [];//;
  let point7: any = [];//;
  let point8: any = [];//;
  let point9: any = []; //;
  let point10: any = []; //;
  let point11: any = []; //;
  let point12: any = [];
  let point13: any = [];
  let point14: any = [];
  let point15: any = [];
  let point16: any = [];
  let point17: any = [];//bottom1
  let point18: any = [];//bottom2
  let point19: any = [];//bottom3
  let point20: any = [];//bottom4

  let bbarrayInForm = [];



  for (let i = 0; i < bbarray.length; i++) {
    zCoords.push(bbarray[i].zCoord);
    yCoords.push(bbarray[i].yCoord);
    xCoords.push(bbarray[i].xCoord);
  }

  xCoords.sort();
  yCoords.sort();
  zCoords.sort();
  let xMin = Math.min(Math.min.apply(Math, xCoords));
  let yMin = Math.min(Math.min.apply(Math, yCoords));
  let xMax = Math.min(Math.max.apply(Math, xCoords));
  let yMax = Math.min(Math.max.apply(Math, yCoords));

  //Top
  point1[2] = zCoords[zCoords.length - 1];
  point2[2] = zCoords[zCoords.length - 2];
  point3[2] = zCoords[zCoords.length - 3];
  point4[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point1[1] = yMin;
  point1[0] = xMin;
  point2[1] = yMin;
  point2[0] = xMax;
  point3[1] = yMax;
  point3[0] = xMax;
  point4[1] = yMax;
  point4[0] = xMin;

  //M1
  point5[2] = zCoords[zCoords.length - 1];
  point6[2] = zCoords[zCoords.length - 2];
  point7[2] = zCoords[zCoords.length - 3];
  point8[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point5[1] = yMin;
  point5[0] = xMin;
  point6[1] = yMin;
  point6[0] = xMax;
  point7[1] = yMax;
  point7[0] = xMax;
  point8[1] = yMax;
  point8[0] = xMin;

  //M2
  point9[2] = zCoords[zCoords.length - 1];
  point10[2] = zCoords[zCoords.length - 2];
  point11[2] = zCoords[zCoords.length - 3];
  point12[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point9[1] = yMin;
  point9[0] = xMin;
  point10[1] = yMin;
  point10[0] = xMax;
  point11[1] = yMax;
  point11[0] = xMax;
  point12[1] = yMax;
  point12[0] = xMin;

  //M3
  point13[2] = zCoords[zCoords.length - 1];
  point14[2] = zCoords[zCoords.length - 2];
  point15[2] = zCoords[zCoords.length - 3];
  point16[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point13[1] = yMin;
  point13[0] = xMin;
  point14[1] = yMin;
  point14[0] = xMax;
  point15[1] = yMax;
  point15[0] = xMax;
  point16[1] = yMax;
  point16[0] = xMin;

  //Bottom
  point17[2] = zCoords[zCoords.length - 1];
  point18[2] = zCoords[zCoords.length - 2];
  point19[2] = zCoords[zCoords.length - 3];
  point20[2] = zCoords[zCoords.length - 4];

  zCoords.pop();
  zCoords.pop();
  zCoords.pop();
  zCoords.pop();

  point17[1] = yMin;
  point17[0] = xMin;
  point18[1] = yMin;
  point18[0] = xMax;
  point19[1] = yMax;
  point19[0] = xMax;
  point20[1] = yMax;
  point20[0] = xMin;

  bbarrayInForm.push(point1);
  bbarrayInForm.push(point2);
  bbarrayInForm.push(point3);
  bbarrayInForm.push(point4);
  bbarrayInForm.push(point5);
  bbarrayInForm.push(point6);
  bbarrayInForm.push(point7);
  bbarrayInForm.push(point8);
  bbarrayInForm.push(point9);
  bbarrayInForm.push(point10);
  bbarrayInForm.push(point11);
  bbarrayInForm.push(point12);
  bbarrayInForm.push(point13);
  bbarrayInForm.push(point14);
  bbarrayInForm.push(point15);
  bbarrayInForm.push(point16);
  bbarrayInForm.push(point17);
  bbarrayInForm.push(point18);
  bbarrayInForm.push(point19);
  bbarrayInForm.push(point20);

  let tempArray = [];
  for (let i = 0; i < bbarrayInForm.length; i++) {
    for (let j = 0; j < bbarray.length; j++) {
      if (bbarrayInForm[i][0] == bbarray[j].xCoord && bbarrayInForm[i][1] == bbarray[j].yCoord && bbarrayInForm[i][2] == bbarray[j].zCoord) {
        tempArray.push(bbarray[j].temperature);
        break;
      }
    }
  }

  let side1 = [tempArray[0], tempArray[4], tempArray[8], tempArray[12], tempArray[16]]; //top1.middle1,bottom1
  let side2 = [tempArray[1], tempArray[5], tempArray[9], tempArray[13], tempArray[17]]; //top2.middle2,bottom2
  let side3 = [tempArray[2], tempArray[6], tempArray[10], tempArray[14], tempArray[18]]; //top3.middle3,bottom3
  let side4 = [tempArray[3], tempArray[7], tempArray[11], tempArray[15], tempArray[19]]; //top4.middle4,bottom4

  let finalArray = [side1, side2, side3, side4];

  return finalArray;
}

//Heatmap for prismatic cell having 2 points inside it.
function repaintGridPrismatic(tempcondition: string, maxtemperature: number, mintemperature: number, json: heatmapdata[]) {
  if (maxtemperature == mintemperature)
    mintemperature = maxtemperature + 0.1;
  lut.setMax(maxtemperature);
  lut.setMin(mintemperature);
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if ("Group" == child1.type) {
      let child = <THREE.Mesh>child1.children[0];

      let bbarray = [];
      bbarray = checkifDataPresentinCell(child, eval(tempcondition), json);
      bbarray = CheckIfPointPresentInsideCylinder(child, bbarray);
      var tempArray = getTemperatureArray(bbarray);
      if (tempArray.length > 2) {
        let maxtemperatureforthismap = Math.max.apply(Math, tempArray);
        let mintemperatureforthismap = Math.min.apply(Math, tempArray);
        tempArray = [];
        tempArray.push(maxtemperatureforthismap);
        tempArray.push(mintemperatureforthismap);
      }
      var segmentArray = heatMapArray21(tempArray);

      let geometry1 = child.geometry;
      const count = geometry1.attributes['position'].count;
      geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const positions1 = geometry1.attributes['position'];
      const colors1 = geometry1.attributes['color'];

      var countSegmant = Math.round(count / segmentArray.length);
      for (let i = 0; i < segmentArray.length; i++) {
        const color = lut.getColor(segmentArray[i]);
        colorPerticularsegment(i, colors1, color);
      }
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: false,
        vertexColors: true,
        shininess: 0,
        side: THREE.DoubleSide
      });

      const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
      child.geometry.dispose();
      child.geometry = geometry1;
      child.material = material;
      child.updateMatrixWorld(true);
    }
  }
}

function getextrapolatedArray(A1: any[], sizeofnewarray: number) {
  let numberofgaps = A1.length - 1;
  let finalarrayA1 = [];
  let numberofelementsrequired = sizeofnewarray - A1.length;
  let elementsInEachGap = numberofelementsrequired / numberofgaps;
  let remainingelements = numberofelementsrequired % numberofgaps;
  for (let i = 0; i < A1.length - 1; i++) {
    finalarrayA1.push(A1[i]);
    if (i == A1.length - 2)
      finalarrayA1.push(...GetmygappedArrayValues(A1[i], A1[i + 1], elementsInEachGap + remainingelements));
    else
      finalarrayA1.push(...GetmygappedArrayValues(A1[i], A1[i + 1], elementsInEachGap));
  }
  finalarrayA1.push(A1[A1.length - 1]);
  return finalarrayA1;
}

function updatecolors(n: number, finalarrayA: any[], finalarrayB: any[], finalarrayC: any[], finalarrayD: any[], geometry1: any, lut: any) {

  var colors1 = geometry1.attributes['color'];
  for (let a = 0; a < 4; a++) {
    const color = lut.getColor(finalarrayD[a]);
    colors1.setXYZ(104 + 21 * a - n, color.r, color.g, color.b);
  }
  for (let b = 0; b < 7; b++) {
    const color = lut.getColor(finalarrayC[b]);
    colors1.setXYZ(315 + b + 7 * n, color.r, color.g, color.b);
  }
  for (let c = 0; c < 7; c++) {
    const color = lut.getColor(finalarrayA[c]);
    colors1.setXYZ(308 + c - 7 * n, color.r, color.g, color.b);
  }
  for (let d = 0; d < 4; d++) {
    const color = lut.getColor(finalarrayB[d]);
    colors1.setXYZ(21 * d + n, color.r, color.g, color.b);
  }
  console.log(finalarrayB);

  return geometry1;

}

function colortopface(A: any[], B: any[], C: any[], D: any[], geometry1: any, lut: any) {
  let initialarrayG = getextrapolatedArray([A, B], 4)
  let initialarrayH = getextrapolatedArray([D, C], 4)
  for (let n = 0; n < 4; n++) {
    let finalarrtemp2 = getextrapolatedArray([initialarrayH[n], initialarrayG[n]], 7);
    for (let i = 0; i < 7; i++) {
      let color2 = lut.getColor(finalarrtemp2[i]);
      geometry1.attributes['color'].setXYZ(462 + 7 * n + i, color2.r, color2.g, color2.b);
    }
  }
  return geometry1;
}

function ColorOneRow(n: number, initialarrayA: any[], initialarrayB: any[], initialarrayC: any[], initialarrayD: any[], geometry1: any, lut: any) {
  let finalarrayA = getextrapolatedArray(initialarrayA, 7);
  let finalarrayB = getextrapolatedArray(initialarrayB, 4);
  let finalarrayC = getextrapolatedArray(initialarrayC, 7);
  let finalarrayD = getextrapolatedArray(initialarrayD, 4);

  /* finalarrayA[finalarrayA.length-3] = finalarrayA[finalarrayA.length-3] +30
  finalarrayB[finalarrayB.length-3] = finalarrayB[finalarrayB.length-3] +30
  finalarrayC[finalarrayC.length-3] = finalarrayC[finalarrayC.length-3] + 30
  finalarrayD[finalarrayD.length-3] = finalarrayD[finalarrayD.length-3] +30

   finalarrayA[finalarrayA.length-1] = finalarrayA[finalarrayA.length-1] +30
   finalarrayB[finalarrayB.length-1] = finalarrayB[finalarrayB.length-1] +30
   finalarrayC[finalarrayC.length-1] = finalarrayC[finalarrayC.length-1] + 30
   finalarrayD[finalarrayD.length-1] = finalarrayD[finalarrayD.length-1] +30 */

  console.log("finalarrayD", finalarrayD);
  geometry1 = updatecolors(n, finalarrayA, finalarrayB, finalarrayC, finalarrayD, geometry1, lut);
  if (n == 0) {
    //color top face
    geometry1 = colortopface(finalarrayA[0], finalarrayB[0], finalarrayC[0], finalarrayD[0], geometry1, lut)

  }
  else if (n == 20) {
    //color bottom face
    geometry1 = colorbottomface(finalarrayA[finalarrayA.length - 1], finalarrayB[finalarrayB.length - 1], finalarrayC[finalarrayC.length - 1], finalarrayD[finalarrayD.length - 1], geometry1, lut)
  }
  return geometry1;
}

function ColorOneRow9(n: number, initialarrayA: any[], initialarrayB: any[], initialarrayC: any[], initialarrayD: any[], initialarrayE: any[], initialarrayF: any[], initialarrayG: any[], initialarrayH: any[], initialarrayI: any[], geometry1: THREE.BufferGeometry, lut: any) {
  // let sizeofnewarray = 7;
  let finalarrayA = getextrapolatedArray(initialarrayA, 7);
  let finalarrayB = getextrapolatedArray(initialarrayB, 4);
  let finalarrayC = getextrapolatedArray(initialarrayC, 7);
  let finalarrayD = getextrapolatedArray(initialarrayD, 4);
  let finalarrayE = getextrapolatedArray(initialarrayA, 7);
  let finalarrayF = getextrapolatedArray(initialarrayB, 4);
  let finalarrayG = getextrapolatedArray(initialarrayC, 7);
  let finalarrayH = getextrapolatedArray(initialarrayD, 4);

  console.log("finalarrayD", finalarrayD);
  geometry1 = updatecolors(n, finalarrayA, finalarrayB, finalarrayC, finalarrayD, geometry1, lut);
  if (n == 0) {
    //color top face
    geometry1 = colortopface(finalarrayA[0], finalarrayB[0], finalarrayC[0], finalarrayD[0], geometry1, lut)

  }
  else if (n == 20) {
    //color bottom face
    geometry1 = colorbottomface(finalarrayA[finalarrayA.length - 1], finalarrayB[finalarrayB.length - 1], finalarrayC[finalarrayC.length - 1], finalarrayD[finalarrayD.length - 1], geometry1, lut)
  }
  return geometry1;
}

function colorbottomface(A: any[], B: any[], C: any[], D: any[], geometry1: any, lut: any) {
  let initialarrayE = getextrapolatedArray([A, D], 4)
  let initialarrayF = getextrapolatedArray([C, B], 4)
  for (let n = 0; n < 4; n++) {
    let finalarrtemp = getextrapolatedArray([initialarrayF[n], initialarrayE[n]], 7);
    for (let i = 0; i < 7; i++) {
      let color2 = lut.getColor(finalarrtemp[i]);
      geometry1.attributes['color'].setXYZ(490 + 7 * n + i, color2.r, color2.g, color2.b);
    }
  }
  return geometry1;
}

//Heatmap for prismatic and pouch cell having 12 or 45 points inside it.
function repaintGridPouch1245(tempcondition: string, maxtemperature: number, mintemperature: number, json: heatmapdata[]) {
  if (maxtemperature == mintemperature)
    mintemperature = maxtemperature + 0.1;
  lut.setMax(maxtemperature);
  lut.setMin(mintemperature);
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if ("Group" == child1.type) {
      let child = <THREE.Mesh>child1.children[0];

      let bbarray = [];
      bbarray = checkifDataPresentinCell(child, eval(tempcondition), json);
      bbarray = CheckIfPointPresentInsideCylinder(child, bbarray);
      let geometry1 = child.geometry;
      const count = geometry1.attributes['position'].count;
      geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      let finalArray: any[] = [];
      if (bbarray.length == 12)
        finalArray = fourSideArray12(bbarray);
      else if (bbarray.length == 45) {
        finalArray = fourSideArray45(bbarray);
      }
      if (finalArray != null) {
        /*  for (let p = 0; p < bbarray.length; p++) {
           CreatePt(new THREE.Vector3(bbarray[p].xCoord, bbarray[p].yCoord, bbarray[p].zCoord), true);
         } */
        let sizeofnewarray = 21;
        let finalarrayA1 = getextrapolatedArray(finalArray[0], sizeofnewarray);
        let finalarrayA2 = getextrapolatedArray(finalArray[1], sizeofnewarray);
        let finalarrayA3 = getextrapolatedArray(finalArray[2], sizeofnewarray);
        let finalarrayA4 = getextrapolatedArray(finalArray[3], sizeofnewarray);

        for (let i = 0; i < 21; i++) {
          geometry1 = ColorOneRow(i, [finalarrayA1[i], finalarrayA2[i]], [finalarrayA2[i], finalarrayA3[i]], [finalarrayA4[i], finalarrayA3[i]], [finalarrayA1[i], finalarrayA4[i]], geometry1, lut);
        }

        const material = new THREE.MeshPhongMaterial({
          color: "white",
          flatShading: false,
          vertexColors: true,
          shininess: 0,
          side: THREE.DoubleSide,
          /* opacity : 0.2,
                  transparent: true */
        });

        const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
        child.geometry.dispose();
        //child.material.dispose();
        child.geometry = geometry1;
        child.material = material;
        child.updateMatrixWorld(true);
        // render();
      }
    }
  }
}

function repaintGridPouch(tempcondition: string, maxtemperature: number, mintemperature: number, json: heatmapdata[]) {
  if (maxtemperature == mintemperature)
    mintemperature = maxtemperature + 0.1;
  lut.setMax(maxtemperature);
  lut.setMin(mintemperature);
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if ("Group" == child1.type) {
      let child = <THREE.Mesh>child1.children[0];

      let bbarray = [];
      bbarray = checkifDataPresentinCell(child, eval(tempcondition), json);
      bbarray = CheckIfPointPresentInsideCylinder(child, bbarray);
      var tempArray = getTemperatureArray(bbarray);
      if (tempArray.length > 2) {
        let maxtemperatureforthismap = Math.max.apply(Math, tempArray);
        let mintemperatureforthismap = Math.min.apply(Math, tempArray);
        tempArray = [];
        tempArray.push(maxtemperatureforthismap);
        tempArray.push(mintemperatureforthismap);
      }
      var segmentArray = heatMapArray21(tempArray);

      let geometry1 = child.geometry;
      const count = geometry1.attributes['position'].count;
      geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const positions1 = geometry1.attributes['position'];
      const colors1 = geometry1.attributes['color'];

      var countSegmant = Math.round(count / segmentArray.length);
      for (let i = 0; i < segmentArray.length; i++) {
        const color = lut.getColor(segmentArray[i]);
        colorPerticularsegment(i, colors1, color);
      }
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: false,
        vertexColors: true,
        shininess: 0,
        side: THREE.DoubleSide
      });

      const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
      child.geometry.dispose();
      //child.material.dispose();
      child.geometry = geometry1;
      child.material = material;
      child.updateMatrixWorld(true);
      // render();
    }
  }
}

function GenerateVertexColors(json: heatmapdata[]) {
  /*  for (let [time, map] of SeriesOfMaps) {
   for (let [pts, temp] of map) {
     CreatePt(pts,true);
   }
   break;
 } */
  let select1 = <HTMLSelectElement>document.getElementById("Time");
  if (select1) {
    select1.parentElement!.removeChild(select1);
  }
  select = <HTMLSelectElement>document.createElement("select");
  select.name = "Time";
  select.id = "Time";
  var label = document.createElement("label");
  for (let [temp, map] of SeriesOfMaps) {
    var option = document.createElement("option");
    option.value = temp;
    option.text = temp.toFixed(2);
    select.appendChild(option);
  }
  label.setAttribute('style', 'position: relative;display: inline-block;top: 10%;float:right');
  label.innerHTML = "Time : "
  label.htmlFor = "Time";
  select[select.length - 1].setAttribute('selected', 'selected');
  currentContainer.appendChild(label).appendChild(select);
  x = select;
  select.selectedIndex = select.length - 1;

  if (connect_array1) {
    let parallelArray = connect_array1["P"];
    createCellsAccordingToConnectorwithoutTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1, parallelArray)
    //drawConnection(parallelArray);
    //let seriesArray = connect_array1["S"];
    //drawSeriesConnection(seriesArray);
    //drawExternalConnectionForCylinder(connect_array1['PT'], connect_array1['NT']);
    OnChangeTimeForHeatMap(json);
    BringcreateCellsAccordingToConnector(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1, parallelArray)
  }
  else {
    CreateCells1(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1)
    OnChangeTimeForHeatMap(json);
    bringCylinderToWithTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1);
  }
  select.onchange = function () {
    if (connect_array1) {
      let parallelArray = connect_array1["P"];
      createCellsAccordingToConnectorwithoutTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1, parallelArray)
      OnChangeTimeForHeatMap(json);
      BringcreateCellsAccordingToConnector(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1, parallelArray)
    }
    else {
      CreateCells1(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1)
      OnChangeTimeForHeatMap(json);
      bringCylinderToWithTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cylinderdiameter1, cylinderheight1, cell_arrangement1, cell_stagger_dir1);
    }
  }
  return;
}

function GenerateVertexColorsPrismatic(json: heatmapdata[]) {
  /*  for (let [time, map] of SeriesOfMaps) {
 for (let [pts, temp] of map) {
   CreatePt(pts, false);
 }
 break;
} */
  let select1 = <HTMLSelectElement>document.getElementById("Time");
  if (select1) {
    select1.parentElement!.removeChild(select1);
  }
  select = <HTMLSelectElement>document.createElement("select");
  select.name = "Time";
  select.id = "Time";
  var label = document.createElement("label");
  for (let [temp, map] of SeriesOfMaps) {
    var option = document.createElement("option");
    option.value = temp;
    option.text = temp.toFixed(2);
    select.appendChild(option);
  }
  label.setAttribute('style', 'position: relative;display: inline-block;top: 10%;float:right');
  label.innerHTML = "Time : "
  label.htmlFor = "Time";
  select[select.length - 1].setAttribute('selected', 'selected');
  currentContainer.appendChild(label).appendChild(select);
  x = select;
  select.selectedIndex = select.length - 1;
  CreateCellsPrismaticWithoutTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
  OnChangeTimeForHeatMap(json);
  CreateCellsPrismaticWithTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);

  select.onchange = function () {
    CreateCellsPrismaticWithoutTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
    OnChangeTimeForHeatMap(json);
    CreateCellsPrismaticWithTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
  }
  return;
}

function GenerateVertexColorsPouch(json: heatmapdata[]) {
  /*  for (let [time, map] of SeriesOfMaps) {
  for (let [pts, temp] of map) {
    CreatePt(pts, false);
  }
  break;
} */
  let select1 = <HTMLSelectElement>document.getElementById("Time");
  if (select1) {
    select1.parentElement!.removeChild(select1);
  }
  select = <HTMLSelectElement>document.createElement("select");
  select.name = "Time";
  select.id = "Time";
  var label = document.createElement("label");
  for (let [temp, map] of SeriesOfMaps) {
    var option = document.createElement("option");
    option.value = temp;
    option.text = temp.toFixed(2);
    select.appendChild(option);
  }
  label.setAttribute('style', 'position: relative;display: inline-block;top: 10%;float:right');
  label.innerHTML = "Time : "
  label.htmlFor = "Time";
  select[select.length - 1].setAttribute('selected', 'selected');
  currentContainer.appendChild(label).appendChild(select);
  x = select;
  select.selectedIndex = select.length - 1;
  CreateCellsPouchWithoutTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1)
  OnChangeTimeForHeatMap(json);
  CreateCellsPouchWithTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
  select.onchange = function () {
    CreateCellsPouchWithoutTapPosition(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
    OnChangeTimeForHeatMap(json);
    CreateCellsPouchWithTap(z1, y1, x1, zcellspacing1, Ycellspacing1, Xcellspacing1, array1, cellheight1, celllength1, cellThickness1);
  }
  return;
}

function BringcreateCellsAccordingToConnector(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any, parallelArray: any) {
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          BringCreateCylinderAtPositionAccordingToConnector(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        }
        else {
          BringCreateStaggeredCylinderAtPositionAccordingToConnector(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }

}

function bringCylinderToWithTapPosition(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any) {
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          changeCreateCylinderAtPosition(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        }
        else {
          changeStaggeredCylinderAtPosition(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }
}

function CreateCellsPrismaticWithTap(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  // clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        bringBoxToWithTapPositionCreatPrismaticCells(celllength1, cellbreadth1, cellheight1, m, i, k, j, zcellspacing1, Ycellspacing1, Xcellspacing1);
        m++;
      }
      count++;
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function CreateCellsPouchWithTap(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  // clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        bringBoxToWithTapPositionCreatPouchCells(celllength1, cellbreadth1, cellheight1, m, i, k, j, zcellspacing1, Ycellspacing1, Xcellspacing1);

        m++;

      }
      count++;
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
  //addEnclosure();
  // loadHeatPoints();
}

function CreateCells1(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cylinderdiameter: number, cylinderheight: number, cell_arrangement: any, cell_stagger_dir: any) {
  clearAllCylindersFromScene();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        if (cell_arrangement == "grid") {
          CreateCylinderAtPosition1(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
          m++;
        } else {
          CreateStaggeredCylinderAtPosition1(cylinderheight, cylinderdiameter, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing, cell_stagger_dir);
          m++;
        }
        count++;
      }
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function CreateCellsPrismaticWithoutTapPosition(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  //clearAllCylindersFromScene();
  clearCellsButNotConnector();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        CreateBoxGeometryAtPosition1(celllength, cellbreadth, cellheight, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
        m++;

      }
      count++;
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function CreateCellsPouchWithoutTapPosition(z: number, y: number, x: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, array: [], cellheight: number, celllength: number, cellbreadth: number) {
  clearCellsButNotConnector();
  let count = 0;
  m = 1;
  for (let i = 0; i < z; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < x; k++) {
        if (array) {
          if (0 == array[count]) {
            count++;
            m++;
            continue;
          }
        }
        CreateBoxGeometryAtPositionPouch(celllength, cellbreadth, cellheight, m, i, k, j, zcellspacing, Ycellspacing, Xcellspacing);
        m++;

      }
      count++;
    }
  }
  cellGroup.updateMatrixWorld(true);
  sceneObject.add(cellGroup);
  sceneObject.updateMatrixWorld(true);
  scene.add(sceneObject);
  SetControlsAtOrigin();
}

function changeCreateCylinderAtPosition(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let cylinderName = m.toString();
  let cylinder = cellGroup.getObjectByName((cylinderName));
  cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
}

function changeStaggeredCylinderAtPosition(cylinderheight: number, cylinderdiameter: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number, cell_stagger_dir: any) {
  let cylinderName = m.toString();
  let cylinder = cellGroup.getObjectByName((cylinderName));
  if (cell_stagger_dir == "x") {
    if (k % 2 == 0)
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing + cylinderdiameter / 2, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
  else if (cell_stagger_dir == "y") {
    if (i % 2 == 0)
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing + cylinderdiameter / 2, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
    else
      cylinder!.position.set((i * cylinderdiameter + cylinderdiameter / 2) + i * Xcellspacing, (k * cylinderdiameter + cylinderdiameter / 2) + k * Ycellspacing, (j * cylinderheight + cylinderheight / 2) + j * zcellspacing + j * tapHeight);
  }
}

function bringBoxToWithTapPositionCreatPrismaticCells(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let boxPresent = cellGroup.getObjectByName(m.toString());
  let Box = boxPresent;
  Box!.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing + j * tabheight1 / 2);

}

function bringBoxToWithTapPositionCreatPouchCells(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let boxPresent = cellGroup.getObjectByName(m.toString());
  let Box = boxPresent;
  Box!.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing + j * tabheight1 / 2);

}

function CreateBoxGeometryAtPosition1(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let Box = createBoxCellWithFillet(boxlength, boxbreadth, boxheight);
  cellGroup.add(Box);
  //cellGroup.updateMatrixWorld(true);
  Box.name = m.toString();
  Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing);
  Box.updateMatrixWorld(true);
}

function CreateBoxGeometryAtPositionPouch(boxlength: number, boxbreadth: number, boxheight: number, m: number, i: number, j: number, k: number, zcellspacing: number, Ycellspacing: number, Xcellspacing: number) {
  let Box = createPouchCellWithFillet(boxlength, boxbreadth, boxheight);
  cellGroup.add(Box);
  Box.name = m.toString();
  /*  if( m%2 == 0){
     Box.rotation.z += Math.PI ;
   } */
  Box.position.set((i * boxlength + boxlength / 2) + i * Xcellspacing, (k * boxbreadth + boxbreadth / 2) + k * Ycellspacing, (j * boxheight + boxheight / 2) + j * zcellspacing);
  Box.updateMatrixWorld(true);
}

function OnChangeTimeForHeatMap(json: heatmapdata[]) {
  let maxtemperature = 0;
  let mintemperature = 10000000;
  var tempArray: any = [];
  let tempSize: any = [];
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    if ("Group" == child1.type) {
      let child = <THREE.Mesh>child1.children[0];
      let bbarray: any = [];
      bbarray = checkifDataPresentinCell(child, eval(x.value), json);
      bbarray = CheckIfPointPresentInsideCylinder(child, bbarray);
      tempSize = bbarray.length;
      for (let j = 0; j < bbarray.length; j++) {
        tempArray.push(bbarray[j].temperature);
      }
    }
  }
  let maxtemperatureforthismap = Math.max.apply(Math, tempArray);
  let mintemperatureforthismap = Math.min.apply(Math, tempArray);

  if (maxtemperatureforthismap > maxtemperature)
    maxtemperature = maxtemperatureforthismap;

  if (mintemperatureforthismap < mintemperature)
    mintemperature = mintemperatureforthismap;
  if (cell_type1 == "cylindrical") {
    if (tempSize > 2) {
      RepaintGrid(x.value, maxtemperature, mintemperature, json);
      repaintConnectorCylindrical(x.value, maxtemperature, mintemperature, json);
    }
    else {
      RepaintGrid(x.value, maxtemperature, mintemperature, json);
      repaintConnectorCylindrical(x.value, maxtemperature, mintemperature, json);
    }
  }
  else if (cell_type1 == "prismatic") {
    if (tempSize > 2) {
      repaintGridPouch1245(x.value, maxtemperature, mintemperature, json)
    }
    else {
      repaintGridPrismatic(x.value, maxtemperature, mintemperature, json);
    }

  }
  else if (cell_type1 == "pouch") {
    if (tempSize > 2) {
      repaintGridPouch1245(x.value, maxtemperature, mintemperature, json)
    }
    else {
      repaintGridPouch(x.value, maxtemperature, mintemperature, json);
    }

  }
  let y = Number(x.value);
  let min = Number(mintemperature);
  let max = Number(maxtemperature);
  colorBar(y, max, min);
}

function BringconnectConnector(x: number, y: number) {
  console.log(x, y);
  BringconnectorCell(x, y);

}

function connectConnector(x: number, y: number) {
  connectorCell(x, y);
}

function createConnectorStart(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  x1.localToWorld(worldPositioinforTab);

  let isFlipped = trackCell.get(x.toString());
  if (isFlipped == "Flipped") {
    worldPositioinforTab.z -= tapHeight;
    worldPositioinforTab.z -= 0.3;
  }
  else {
    worldPositioinforTab.z += 0.1;
    worldPositioinforTab.z += tapHeight;
  }
  const geometry5 = new THREE.CylinderGeometry(5, 5, 0.2, 5, 5, false, 0, Math.PI)
  geometry5.rotateX(-Math.PI * 0.5);
  geometry5.rotateZ(-Math.PI);
  // connectorMaterial = new THREE.MeshPhongMaterial({ color: "red", emissive: 0xe70d0d, specular: 0x501616, shininess: 50 });
  var circleMesh1 = new THREE.Mesh(geometry5, connectorMaterial);

  circleMesh1.position.copy(worldPositioinforTab);

  // var connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 50 });
  const circleMesh2 = new THREE.Mesh(geometry5, connectorMaterial1);
  if (isFlipped == "Flipped") {
    worldPositioinforTab.z += (cylinderheight1 + tapHeight);
    worldPositioinforTab.z += 0.3;
  }
  else {
    worldPositioinforTab.z -= (cylinderheight1 + tapHeight);
    worldPositioinforTab.z -= 0.3;
  }

  circleMesh2.position.copy(worldPositioinforTab);
  cellGroup.add(circleMesh1);
  cellGroup.add(circleMesh2);
}

function createConnectorEnd(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  x1.localToWorld(worldPositioinforTab);

  let isFlipped = trackCell.get(x.toString());
  if (isFlipped == "Flipped") {
    worldPositioinforTab.z -= tapHeight;
    worldPositioinforTab.z -= 0.3;
  }
  else {
    worldPositioinforTab.z += 0.1;
    worldPositioinforTab.z += tapHeight;
  }
  const geometry5 = new THREE.CylinderGeometry(5, 5, 0.2, 5, 5, false, 0, Math.PI)
  geometry5.rotateX(-Math.PI * 0.5);
  geometry5.rotateZ(-Math.PI * 2);
  // connectorMaterial = new THREE.MeshPhongMaterial({ color: "red", emissive: 0xe70d0d, specular: 0x501616, shininess: 50 });
  var circleMesh1 = new THREE.Mesh(geometry5, connectorMaterial);

  circleMesh1.position.copy(worldPositioinforTab);

  // connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 50 });
  const circleMesh2 = new THREE.Mesh(geometry5, connectorMaterial1);
  if (isFlipped == "Flipped") {
    worldPositioinforTab.z += (cylinderheight1 + tapHeight);
    worldPositioinforTab.z += 0.3;
  }
  else {
    worldPositioinforTab.z -= (cylinderheight1 + tapHeight);
    worldPositioinforTab.z -= 0.3;
  }

  circleMesh2.position.copy(worldPositioinforTab);
  cellGroup.add(circleMesh1);
  cellGroup.add(circleMesh2);
}

function clearConnector() {
  for (let i = 0; i < cellGroup.children.length; i++) {
    let child1 = <THREE.Mesh>cellGroup.children[i];
    console.log(child1.name);
    if (child1.name.includes("Connector")) {
      child1.parent?.remove(child1);
    }
  }
}

//draws parallel connection or cylindrical cell
function drawConnection(ConnectorArray: number[][]) {
  // clearConnector()
  connGeometryCylinder = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        connectConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
        if (j == 0) {
          // createConnectorStart(ConnectorArray[i][j]);
        }
        else if (j == ConnectorArray[i].length - 2) {
          //createConnectorEnd(ConnectorArray[i][j + 1]);
        }
      }
    }
  }
}

function BringdrawConnection(ConnectorArray: number[][]) {
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        BringconnectConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
        if (j == 0) {
          // createConnectorStart(ConnectorArray[i][j]);
        }
        else if (j == ConnectorArray[i].length - 2) {
          //createConnectorEnd(ConnectorArray[i][j + 1]);
        }
      }
    }
  }
}
//connector logic
let subArrayIndicesForPositiveConnectors: any = []
let subArrayIndicesForNegativeConnectors: any = []

function connectorCell(x: number, y: number) {
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let row1 = trackRow.get(x.toString());
  let row2 = trackRow.get(y.toString());
  if (!(group1 && group2))
    return;
  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);

  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));

  if (connGeometryCylinder == null) {
    // connGeometryCylinder = new THREE.BoxGeometry(distanceofTap, 10, 0.2);

    // Aadarsh created new connector grometry for connectors
    const roundedRectShape = new THREE.Shape();

    const width = distanceofTap / 3.5; // Width of the rectangle
    const height = 2; // Height of the rectangle
    const cornerRadius = 1; // Radius of the rounded corners

    roundedRectShape.moveTo(-width / 2 + cornerRadius, -height / 2);
    roundedRectShape.lineTo(width / 2 - cornerRadius, -height / 2);
    roundedRectShape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + cornerRadius);
    roundedRectShape.lineTo(width / 2, height / 2 - cornerRadius);
    roundedRectShape.quadraticCurveTo(width / 2, height / 2, width / 2 - cornerRadius, height / 2);
    roundedRectShape.lineTo(-width / 2 + cornerRadius, height / 2);
    roundedRectShape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - cornerRadius);
    roundedRectShape.lineTo(-width / 2, -height / 2 + cornerRadius);
    roundedRectShape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + cornerRadius, -height / 2);

    // Create the geometry by extruding the shape
    const extrudeSettings = {
      depth: 0, // Depth of the extrusion(connector thickness)
      bevelEnabled: false // Disable beveling for sharp edges
    };

    const connGeometryCylinder = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);

    connectorPostitive = new THREE.Mesh(connGeometryCylinder, connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryCylinder, connectorMaterial1.clone());

    // Aadarsh scale the curved connector strips 
    connectorPostitive.scale.set(4, 4, 4);
    connectorNegative.scale.set(4, 4, 4);
  }
  else {
    connectorPostitive = new THREE.Mesh(connGeometryCylinder.clone(), connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryCylinder.clone(), connectorMaterial1.clone());
  }
  connectorPostitive.name = 'Connector' + x.toString() + "\&" + y.toString();
  connectorNegative.name = 'Connector' + y.toString() + "\&" + x.toString();

  let isFlipped = trackCell.get(x.toString());
  if (isFlipped == "Flipped") {
    midPoint.z -= tapHeight - 0.1;
  }
  else {
    midPoint.z += tapHeight - 0.1;
  }
  connectorPostitive.position.copy(midPoint);

  if (isFlipped == "Flipped") {
    midPoint.z += (cylinderheight1 + tapHeight);
  }
  else {
    midPoint.z -= (cylinderheight1 + tapHeight);
  }
  connectorNegative.position.copy(midPoint);

  if (row1 != row2) {
    connectorPostitive.rotation.z += Math.PI / 2;
    connectorNegative.rotation.z += Math.PI / 2;
  }


  // Aadarsh rotating +ve and -ve connectors based on index of custom made sub connectors array using odd-even method
  if (cell_arrangement1 != "grid") {
    if (cell_stagger_dir1 == "x") {
      subArrayIndicesForPositiveConnectors.push(connectorPostitive)
      subArrayIndicesForNegativeConnectors.push(connectorNegative)

      // top
      subArrayIndicesForPositiveConnectors.forEach((e: any, i: number) => {
        if (i % 2 === 1) {
          // console.log(i, "odd -> rotate strip anti clockwise", e);
          e.rotation.z = -((Math.PI * 2) - Math.PI / 3);
        }
      });
      subArrayIndicesForPositiveConnectors.forEach((e: any, i: number) => {
        if (i % 2 === 0) {
          // console.log(i, "even -> rotate strip clockwise", e);
          e.rotation.z = ((Math.PI * 2) - Math.PI / 3)
        }
      });

      //bottom
      subArrayIndicesForNegativeConnectors.forEach((e: any, i: number) => {
        if (i % 2 === 1) {
          // console.log(i, "odd -> rotate strip anti clockwise", e);
          e.rotation.z = -((Math.PI * 2) - Math.PI / 3);
        }
      });
      subArrayIndicesForNegativeConnectors.forEach((e: any, i: number) => {
        if (i % 2 === 0) {
          // console.log(i, "even -> rotate strip clockwise", e);
          e.rotation.z = ((Math.PI * 2) - Math.PI / 3);
        }
      });
    }
  }

  cellGroup.attach(connectorPostitive);
  cellGroup.attach(connectorNegative);
}

function BringconnectorCell(x: number, y: number) {
  let groupC1: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + x + "\&" + y);
  let groupC2: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + y + "\&" + x);

  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let row1 = trackRow.get(x.toString());
  let row2 = trackRow.get(y.toString());

  if (!(group1 && group2))
    return;
  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);

  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));

  let isFlipped = trackCell.get(x.toString());
  if (isFlipped == "Flipped") {
    midPoint.z -= tapHeight - 0.1;
  }
  else {
    midPoint.z += tapHeight - 0.1;
  }
  groupC1.position.copy(midPoint);

  if (isFlipped == "Flipped") {
    midPoint.z += (cylinderheight1 + tapHeight);
  }
  else {
    midPoint.z -= (cylinderheight1 + tapHeight);
  }
  groupC2.position.copy(midPoint);

  /* if (row1 != row2) {
    connectorPostitive.rotation.z += Math.PI / 2;
    connectorNegative.rotation.z += Math.PI / 2;
  } */
}

function BringconnectorseriesCell(x: number, y: number, i: number) {
  let groupC1: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + x + "\&" + y);
  let groupC2: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + y + "\&" + x);
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let isFlippedx = trackCell.get(x.toString());
  let isFlippedy = trackCell.get(y.toString());
  let row1 = trackRow.get(x.toString());
  let row2 = trackRow.get(y.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);
  if (isFlippedx == "Flipped") {
    worldPositioinforTab.z += (cylinderheight1 + tapHeight);
  }

  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);
  if (isFlippedy == "Flipped") {
    worldPositioinforTab1.z += (cylinderheight1 + tapHeight);
  }

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));

  groupC1.position.copy(midPoint);


  midPoint.z -= (cylinderheight1 + tapHeight);
  groupC2.position.copy(midPoint);

  /*  if (row1 != row2) {
     connectorSeries1.rotation.z += Math.PI / 2;
     connectorSeries2.rotation.z += Math.PI / 2;
   }
   cellGroup.attach(connectorSeries1);
   cellGroup.attach(connectorSeries2); */

}

function connectorseriesCell(x: number, y: number, i: number) {
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let isFlippedx = trackCell.get(x.toString());
  let isFlippedy = trackCell.get(y.toString());
  let row1 = trackRow.get(x.toString());

  let row2 = trackRow.get(y.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);
  if (isFlippedx == "Flipped") {
    worldPositioinforTab.z += (cylinderheight1 + tapHeight);
  }

  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);
  if (isFlippedy == "Flipped") {
    worldPositioinforTab1.z += (cylinderheight1 + tapHeight);
  }

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));

  if (connGeometryCylinderS == null) {
    // connGeometryCylinderS = new THREE.BoxGeometry(distanceofTap, 10, 0.2);

    // Aadarsh created new connector grometry
    const roundedRectShape = new THREE.Shape();

    const width = distanceofTap / 3.5; // Width of the rectangle
    const height = 2; // Height of the rectangle
    const cornerRadius = 1; // Radius of the rounded corners

    roundedRectShape.moveTo(-width / 2 + cornerRadius, -height / 2);
    roundedRectShape.lineTo(width / 2 - cornerRadius, -height / 2);
    roundedRectShape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + cornerRadius);
    roundedRectShape.lineTo(width / 2, height / 2 - cornerRadius);
    roundedRectShape.quadraticCurveTo(width / 2, height / 2, width / 2 - cornerRadius, height / 2);
    roundedRectShape.lineTo(-width / 2 + cornerRadius, height / 2);
    roundedRectShape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - cornerRadius);
    roundedRectShape.lineTo(-width / 2, -height / 2 + cornerRadius);
    roundedRectShape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + cornerRadius, -height / 2);

    // Create the geometry by extruding the shape
    const extrudeSettings = {
      depth: 0, // Depth of the extrusion
      bevelEnabled: false // Disable beveling for sharp edges
    };

    const connGeometryCylinderS = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);

    connectorSeries1 = new THREE.Mesh(connGeometryCylinderS, connectorSeriesMaterial.clone());
    connectorSeries2 = new THREE.Mesh(connGeometryCylinderS, connectorSeriesMaterial.clone());

    connectorSeries1.scale.set(4, 4, 4);
    connectorSeries2.scale.set(4, 4, 4);
  }
  else {
    connectorSeries1 = new THREE.Mesh(connGeometryCylinderS.clone(), connectorSeriesMaterial.clone());
    connectorSeries2 = new THREE.Mesh(connGeometryCylinderS.clone(), connectorSeriesMaterial.clone());
  }
  connectorSeries1.name = 'Connector' + x.toString() + "\&" + y.toString();
  connectorSeries2.name = 'Connector' + y.toString() + "\&" + x.toString();
  // var connGeometry = new THREE.BoxGeometry(distanceofTap, 10, 0.2);
  // connectorSeriesMaterial = new THREE.MeshPhongMaterial({ color: 0x00f58b, emissive: 0x2f5045, specular: 0x111312, shininess: 80 });

  // Aadarsh added +0.6 to avoid z fighting issue at the top of cells
  midPoint.z += 0.6;

  connectorSeries1.position.copy(midPoint);
  // connectorSeries1.position.z += ;

  // Aadarsh added +1.3 to avoid z fighting issue at bottom of cells
  midPoint.z -= (cylinderheight1 + tapHeight + 1.3);
  connectorSeries2.position.copy(midPoint);
  //connectorSeries2.position.z -= ;
  if (row1 != row2) {
    connectorSeries1.rotation.z += Math.PI / 2;
    connectorSeries2.rotation.z += Math.PI / 2;
  }
  cellGroup.attach(connectorSeries1);
  cellGroup.attach(connectorSeries2);

  // Aadarsh rotated the connectors
  if (cell_stagger_dir1 == "y") {
    // connectorSeries1.rotation.z = -((Math.PI * 2) - Math.PI/10)
    // connectorSeries2.rotation.z = ((Math.PI * 2) - Math.PI/10)
  }
}

function BringconnectSeriesConnector(x: number, y: number) {
  console.log(x, y);
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  BringconnectorseriesCell(x, y, i);
}

// Aadarsh storing subArray Indices For Green(series) Connectors
let subArrayIndicesForTopGreenConnectors: any = []
let subArrayIndicesForBottomGreenConnectors: any = []

function connectSeriesConnector(x: number, y: number) {
  // console.log(x, y);
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  connectorseriesCell(x, y, i);



  // Aadarsh rotating green series connectors based on index values of sub array 
  if (cell_stagger_dir1 == "y") {

    subArrayIndicesForTopGreenConnectors.push(connectorSeries1)
    subArrayIndicesForBottomGreenConnectors.push(connectorSeries2)

    // top
    subArrayIndicesForTopGreenConnectors.forEach((e: any, i: number) => {
      if (i % 2 === 1) {
        // console.log(i, "odd -> rotate strip anti clockwise", e);
        e.rotation.z = -((Math.PI * 2) - Math.PI / 10);
      }
    });
    subArrayIndicesForTopGreenConnectors.forEach((e: any, i: number) => {
      if (i % 2 === 0) {
        // console.log(i, "even -> rotate strip clockwise", e);
        e.rotation.z = ((Math.PI * 2) - Math.PI / 10);
      }
    });

    //bottom
    subArrayIndicesForBottomGreenConnectors.forEach((e: any, i: number) => {
      if (i % 2 === 1) {
        // console.log(i, "odd -> rotate strip anti clockwise", e);
        e.rotation.z = -((Math.PI * 2) - Math.PI / 10);
      }
    });
    subArrayIndicesForBottomGreenConnectors.forEach((e: any, i: number) => {
      if (i % 2 === 0) {
        // console.log(i, "even -> rotate strip clockwise", e);
        e.rotation.z = ((Math.PI * 2) - Math.PI / 10);
      }
    });
  }
}

// Draw series connectiion for cylindrical cell
function drawSeriesConnection(ConnectorArray: number[][]) {
  connGeometryCylinderS = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        connectSeriesConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
      }
    }
  }
}

function BringdrawSeriesConnection(ConnectorArray: number[][]) {
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        BringconnectSeriesConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
      }
    }
  }
}

function connectorseriesCellPrismatic(x: number, y: number, i: number) {
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab = group1.children[2].position.clone();
  group1.localToWorld(worldPositioinforTab);
  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);


  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  if (connGeometryseriesPrismatic! == null) {
    connGeometryseriesPrismatic = new THREE.BoxGeometry(distanceofTap / 2, 0.5 * cellbreadth1 + 3, 0.2);
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPrismatic, connectorSeriesMaterial.clone());
  }
  else {
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPrismatic.clone(), connectorSeriesMaterial.clone());
  }
  connectorSeries1.name = 'Connector' + x.toString() + "\&" + y.toString();

  midPoint.z += cellheight1 / 2 + tabheight1 / 2 - 0.1;
  connectorSeries1.position.copy(midPoint);
  connectorSeries1.rotation.z += Math.PI;
  cellGroup.add(connectorSeries1);
}

function connectSeriesConnectorPrismatic(x: number, y: number) {
  console.log(x, y);
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  connectorseriesCellPrismatic(x, y, i);
}


function BringconnectSeriesConnectorPrismatic(x: number, y: number, i: number) {
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab = group1.children[2].position.clone();
  group1.localToWorld(worldPositioinforTab);
  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);


  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  if (connGeometryseriesPrismatic! == null) {
    connGeometryseriesPrismatic = new THREE.BoxGeometry(distanceofTap / 2, 0.5 * cellbreadth1 + 3, 0.2);
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPrismatic, connectorSeriesMaterial.clone());
  }
  else {
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPrismatic.clone(), connectorSeriesMaterial.clone());
  }
  connectorSeries1.name = 'Connector' + x.toString() + "\&" + y.toString();

  midPoint.z += cellheight1 / 2 + tabheight1 / 2 - 0.1;
  connectorSeries1.position.copy(midPoint);
  connectorSeries1.rotation.z += Math.PI;
  cellGroup.add(connectorSeries1);
}

function BringconnectSeriesConnectorPrismatic1(x: number, y: number) {
  console.log(x, y);
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  BringconnectSeriesConnectorPrismatic(x, y, i);
}

function BringdrawSeriesConnectionPrismatic(ConnectorArray: number[][]) {
  connGeometryseriesPrismatic = null;
  scene.updateMatrixWorld(true);
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        BringconnectSeriesConnectorPrismatic1(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
      }
    }
  }
}
// Draw series connectiion for prismatic cell
function drawSeriesConnectionPrismatic(ConnectorArray: number[][]) {
  connGeometryseriesPrismatic = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        connectSeriesConnectorPrismatic(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
      }
    }
  }
}

function connectorPrismaticCell(x: number, y: number, i: number) {
  //for Tab 1
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;
  group1.children[1].updateMatrixWorld(true);
  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);

  //for Tab 2
  group2.children[1].updateMatrixWorld(true);
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  let X1 = 0.2 * celllength1;

  if (connGeometryPrismatic == null) {
    connGeometryPrismatic = new THREE.BoxGeometry(distanceofTap, 0.5 * cellbreadth1 + 3, 0.2);
    connectorPostitive = new THREE.Mesh(connGeometryPrismatic, connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPrismatic, connectorMaterial1.clone());
  }
  else {
    connectorPostitive = new THREE.Mesh(connGeometryPrismatic.clone(), connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPrismatic.clone(), connectorMaterial1.clone());
  }
  connectorPostitive.name = 'Connector' + x.toString() + "\&" + y.toString();
  connectorNegative.name = 'Connector' + y.toString() + "\&" + x.toString();

  midPoint.z += (cellheight1 / 2 + tabheight1 / 2);
  midPoint.x += -(celllength1 / 2 - X1);
  connectorPostitive.position.copy(midPoint);
  connectorPostitive.rotation.z += Math.PI / 2;

  midPoint.x += (celllength1 / 2 + X1 / 2);
  connectorNegative.position.copy(midPoint);
  connectorNegative.rotation.z += Math.PI / 2;
  cellGroup.add(connectorPostitive);
  cellGroup.add(connectorNegative);
  console.log(connectorPostitive.position);
}



function connectPrismaticConnector(x: number, y: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  connectorPrismaticCell(x, y, i);
}

function createConnectorStartPrismatic(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);

  if (connGeometryPrismaticCorners == null) {
    connGeometryPrismaticCorners = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.5 * cellbreadth1 + 3, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners.clone(), connectorMaterial1.clone());
  }
  squareMesh1.name = 'Connector' + x.toString() + "1";
  squareMesh2.name = 'Connector' + x.toString() + "2";
  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += -(cellThickness1 / 4 - X1 / 4)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;

  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += -(cellThickness1 / 4 - X1 / 4)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);

}
function createConnectorEndPrismatic(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);
  if (connGeometryPrismaticCorners1 == null) {
    connGeometryPrismaticCorners1 = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.5 * cellbreadth1 + 3, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners1, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners1, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners1.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners1.clone(), connectorMaterial1.clone());
  }
  squareMesh1.name = 'Connector' + x.toString() + "1";
  squareMesh2.name = 'Connector' + x.toString() + "2";

  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += (cellThickness1 / 4 - X1 / 4)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;

  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += (cellThickness1 / 4 - X1 / 4)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);
}

function BringcreateConnectorStartPrismatic(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  // let groupC1: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + x + "\&" + y);
  //let groupC2: THREE.Group = <THREE.Group>cellGroup.getObjectByName("Connector" + y + "\&" + x);

  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);

  if (connGeometryPrismaticCorners == null) {
    connGeometryPrismaticCorners = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.5 * cellbreadth1 + 3, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners.clone(), connectorMaterial1.clone());
  }
  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += -(cellThickness1 / 4 - X1 / 4)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;

  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += -(cellThickness1 / 4 - X1 / 4)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);

}
function BringcreateConnectorEndPrismatic(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);
  if (connGeometryPrismaticCorners1 == null) {
    connGeometryPrismaticCorners1 = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.5 * cellbreadth1 + 3, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners1, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners1, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPrismaticCorners1.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPrismaticCorners1.clone(), connectorMaterial1.clone());
  }
  // const geometry5 = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.5 * cellbreadth1, 0.2);
  //  connectorMaterial = new THREE.MeshPhongMaterial({ color: "red", emissive: 0xe70d0d, specular: 0x501616, shininess: 80 });
  // var squareMesh1 = new THREE.Mesh(geometry5, connectorMaterial);
  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += (cellThickness1 / 4 - X1 / 4)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;
  // connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 80 });
  //const squareMesh2 = new THREE.Mesh(geometry5, connectorMaterial1);
  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += (cellThickness1 / 4 - X1 / 4)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);
}

function BringconnectorPrismaticCell(x: number, y: number, i: number) {
  //for Tab 1
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;
  group1.children[1].updateMatrixWorld(true);
  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);

  //for Tab 2
  group2.children[1].updateMatrixWorld(true);
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  let X1 = 0.2 * celllength1;

  if (connGeometryPrismatic == null) {
    connGeometryPrismatic = new THREE.BoxGeometry(distanceofTap, 0.5 * cellbreadth1 + 3, 0.2);
    connectorPostitive = new THREE.Mesh(connGeometryPrismatic, connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPrismatic, connectorMaterial1.clone());
  }
  else {
    connectorPostitive = new THREE.Mesh(connGeometryPrismatic.clone(), connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPrismatic.clone(), connectorMaterial1.clone());
  }
  connectorPostitive.name = 'Connector' + x.toString() + "\&" + y.toString();
  connectorNegative.name = 'Connector' + y.toString() + "\&" + x.toString();
  //midPoint.x += x1;
  //midPoint.y -= 7;
  midPoint.z += (cellheight1 / 2 + tabheight1 / 2);
  midPoint.x += -(celllength1 / 2 - X1);
  connectorPostitive.position.copy(midPoint);
  connectorPostitive.rotation.z += Math.PI / 2;

  midPoint.x += (celllength1 / 2 + X1 / 2);
  connectorNegative.position.copy(midPoint);
  connectorNegative.rotation.z += Math.PI / 2;
  cellGroup.add(connectorPostitive);
  cellGroup.add(connectorNegative);
  console.log(connectorPostitive.position);

}

function BringconnectPrismaticConnector(x: number, y: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  BringconnectorPrismaticCell(x, y, i);
}

function BringdrawConnectionPrismatic(ConnectorArray: number[][]) {
  connGeometryPrismatic = null;
  connGeometryPrismaticCorners = null;
  connGeometryPrismaticCorners1 = null;
  cellGroup.updateMatrixWorld(true);
  sceneObject.updateMatrixWorld(true);
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length; j++) {
        if (ConnectorArray[i][j] != undefined && ConnectorArray[i][j + 1] != undefined) {
          BringconnectPrismaticConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
        }
        if (j == 0) {
          BringcreateConnectorStartPrismatic(ConnectorArray[i][j]);
        }
        else if (j == ConnectorArray[i].length - 1) {
          BringcreateConnectorEndPrismatic(ConnectorArray[i][j]);
        }
      }
    }
  }
}

//draws parallel connection or prismatic cell
function drawConnectionPrismatic(ConnectorArray: number[][]) {
  connGeometryPrismatic = null;
  connGeometryPrismaticCorners = null;
  connGeometryPrismaticCorners1 = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length; j++) {
        if (ConnectorArray[i][j] != undefined && ConnectorArray[i][j + 1] != undefined) {
          connectPrismaticConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
        }
        if (j == 0) {
          createConnectorStartPrismatic(ConnectorArray[i][j]);
        }
        else if (j == ConnectorArray[i].length - 1) {
          createConnectorEndPrismatic(ConnectorArray[i][j]);
        }
      }
    }
  }
}

function connectorPouchCell(x: number, y: number, i: number) {
  //for Tab 1
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;
  let worldPositioinforTab = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab);

  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);

  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  let X1 = 0.2 * celllength1;

  if (connGeometryPouch == null) {
    connGeometryPouch = new THREE.BoxGeometry(distanceofTap, 0.3 * celllength1 + 2, 0.2);
    connectorPostitive = new THREE.Mesh(connGeometryPouch, connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPouch, connectorMaterial1.clone());
  }
  else {
    connectorPostitive = new THREE.Mesh(connGeometryPouch.clone(), connectorMaterial.clone());
    connectorNegative = new THREE.Mesh(connGeometryPouch.clone(), connectorMaterial1.clone());
  }
  connectorPostitive.name = 'Connector' + x.toString() + "\&" + y.toString();
  connectorNegative.name = 'Connector' + y.toString() + "\&" + x.toString();
  midPoint.z += (cellheight1 / 2 + tabheight1 / 2 - 0.3);
  midPoint.x += -(celllength1 / 2 - X1);
  connectorPostitive.position.copy(midPoint);
  connectorPostitive.rotation.z += Math.PI / 2;


  //connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 80 });
  //const connectorNegative = new THREE.Mesh(connGeometry, connectorMaterial1);
  midPoint.x += (celllength1 / 2 + X1 / 2);
  connectorNegative.position.copy(midPoint);
  connectorNegative.rotation.z += Math.PI / 2;
  cellGroup.add(connectorPostitive);
  cellGroup.add(connectorNegative);
}

function connectPouchConnector(x: number, y: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  connectorPouchCell(x, y, i);
}

function createConnectorStartPouch(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);
  if (connGeometryPouchCorners == null) {
    connGeometryPouchCorners = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.3 * celllength1 + 2, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPouchCorners, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPouchCorners, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPouchCorners.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPouchCorners.clone(), connectorMaterial1.clone());
  }
  squareMesh1.name = 'Connector' + x.toString() + "1";
  squareMesh2.name = 'Connector' + x.toString() + "2";
  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2 - 0.3);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += -(cellThickness1 / 4 - X1 / 4 + 0.1)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;
  // connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 80 });

  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2 - 0.3);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += -(cellThickness1 / 4 - X1 / 4 + 0.1)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);

}

function createConnectorEndPouch(x: number) {
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let X1 = 0.2 * celllength1;
  if (!x1)
    return;
  let worldPositioinforTab = x1.children[1].position.clone();
  let worldPositioinforTab1 = x1.children[2].position.clone();
  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  x1.localToWorld(worldPositioinforTab);
  x1.localToWorld(worldPositioinforTab1);
  if (connGeometryPouchCorners1 == null) {
    connGeometryPouchCorners1 = new THREE.BoxGeometry(0.3 * cellbreadth1, 0.3 * celllength1 + 2, 0.2);
    squareMesh1 = new THREE.Mesh(connGeometryPouchCorners1, connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPouchCorners1, connectorMaterial1.clone());
  }
  else {
    squareMesh1 = new THREE.Mesh(connGeometryPouchCorners1.clone(), connectorMaterial.clone());
    squareMesh2 = new THREE.Mesh(connGeometryPouchCorners1.clone(), connectorMaterial1.clone());
  }
  squareMesh1.name = 'Connector' + x.toString() + "1";
  squareMesh2.name = 'Connector' + x.toString() + "2";

  worldPositioinforTab.z += (cellheight1 / 2 + tabheight1 / 2 - 0.3);
  worldPositioinforTab.x += -(celllength1 / 2 - X1)
  worldPositioinforTab.y += (cellThickness1 / 4 - X1 / 4 + 0.1)
  squareMesh1.position.copy(worldPositioinforTab);
  squareMesh1.rotation.z += Math.PI / 2;
  //connectorMaterial1 = new THREE.MeshPhongMaterial({ color: "black", emissive: 0x000000, specular: 0x100f0f, shininess: 80 });
  //const squareMesh2 = new THREE.Mesh(geometry5, connectorMaterial1);
  worldPositioinforTab1.z += (cellheight1 / 2 + tabheight1 / 2 - 0.3);
  worldPositioinforTab1.x += (celllength1 / 2 - X1)
  worldPositioinforTab1.y += (cellThickness1 / 4 - X1 / 4 + 0.1)
  squareMesh2.position.copy(worldPositioinforTab1);
  squareMesh2.rotation.z += Math.PI / 2;
  cellGroup.add(squareMesh1);
  cellGroup.add(squareMesh2);
}

//draws parallel connection or pouch cell
function drawConnectionPouch(ConnectorArray: number[][]) {
  connGeometryPouch = null;
  connGeometryPouchCorners = null;
  connGeometryPouchCorners1 = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length; j++) {
        if (ConnectorArray[i][j] != undefined && ConnectorArray[i][j + 1] != undefined) {
          connectPouchConnector(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
        }
        if (j == 0) {
          createConnectorStartPouch(ConnectorArray[i][j]);
        }
        else if (j == ConnectorArray[i].length - 1) {
          createConnectorEndPouch(ConnectorArray[i][j]);
        }
      }
    }
  }
}

function connectorseriesCellPouch(x: number, y: number, i: number) {
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab = group1.children[2].position.clone();
  group1.localToWorld(worldPositioinforTab);
  //for Tab 2
  let worldPositioinforTab1 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab1);


  var distanceofTap = worldPositioinforTab.distanceTo(worldPositioinforTab1);
  let midPoint = worldPositioinforTab.clone().add(worldPositioinforTab1.clone().sub(worldPositioinforTab).normalize().multiplyScalar(distanceofTap / 2));
  if (connGeometryseriesPouch! == null) {
    connGeometryseriesPouch = new THREE.BoxGeometry(distanceofTap / 2, 0.5 * cellbreadth1, 0.2);
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPouch, connectorSeriesMaterial.clone());
  }
  else {
    connectorSeries1 = new THREE.Mesh(connGeometryseriesPouch.clone(), connectorSeriesMaterial.clone());
  }
  connectorSeries1.name = 'Connector' + x.toString() + "\&" + y.toString();
  midPoint.z += cellheight1 / 2 + tabheight1 / 2 - 0.4;
  connectorSeries1.position.copy(midPoint);
  connectorSeries1.rotation.z += Math.PI;

  cellGroup.add(connectorSeries1);

}

function connectSeriesConnectorPouch(x: number, y: number) {
  console.log(x, y);
  let x1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(x.toString());
  let x2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(y.toString());
  let i = trackRow.get(x.toString());
  connectorseriesCellPouch(x, y, i);
}

// Draw series connectiion for pouch cell
function drawSeriesConnectionPouch(ConnectorArray: number[][]) {
  connGeometryseriesPouch = null;
  for (let i = 0; i < ConnectorArray.length; i++) {
    if (ConnectorArray[i].length > 0) {
      for (let j = 0; j < ConnectorArray[i].length - 1; j++) {
        connectSeriesConnectorPouch(ConnectorArray[i][j], ConnectorArray[i][j + 1]);
      }
    }
  }
}

//Draw external connection for clindrical cell
function drawExternalConnectionForCylinder(PT: [], NT: []) {
  ExternalConnectionGeometryCylinder = null;
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(PT.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(NT.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab1 = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab1);
  //for Tab 2
  let worldPositioinforTab2 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab2);

  let worldPositioinforTab1CY = group1.children[0].position.clone();
  group1.localToWorld(worldPositioinforTab1CY);
  //for Tab 2
  let worldPositioinforTab2CY = group2.children[0].position.clone();
  group2.localToWorld(worldPositioinforTab2CY);

  let positionExConn1 = new THREE.Vector3(worldPositioinforTab1.x, worldPositioinforTab1.y, worldPositioinforTab1.z);
  let positionExConn2 = new THREE.Vector3(worldPositioinforTab2.x, worldPositioinforTab2.y, worldPositioinforTab2.z);

  if (ExternalConnectionGeometryCylinder == null) {
    ExternalConnectionGeometryCylinder = new THREE.BoxGeometry(100, 10, 0.2);
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometryCylinder, ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometryCylinder, ExternalMaterial.clone());
  }
  else {
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometryCylinder.clone(), ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometryCylinder.clone(), ExternalMaterial.clone());
  }
  ExternalConnection1.name = 'Connector' + PT.toString();
  ExternalConnection2.name = 'Connector' + NT.toString();

  let arr1: any = [];
  let arr2: any = [];
  let isFlippedPT = trackCell.get(PT.toString());
  let isFlippedNT = trackCell.get(NT.toString());

  arr1 = externalDirection(worldPositioinforTab1CY);
  arr2 = externalDirection(worldPositioinforTab2CY);

  // Aadarsh added +0.2 offset to external connectors to avoid z fighting
  positionExConn1.z += 1.9 + 0.2;
  // Aadarsh added this line to fix the z fighting of external connector
  positionExConn2.z -= 0.4;

  if (isFlippedNT == "Flipped")
    positionExConn2.z += 1 + cellheight1;
  else
    positionExConn2.z -= 0.1 + cellheight1;

  //EX-CO-1
  if (arr1[0].x == 1) {
    positionExConn1.x += 45;
  }
  else if (arr1[0].x == -1) {
    // positionExConn1.x -= 45;
  }
  else if (arr1[0].y == 1) {
    ExternalConnection1.rotation.set(Math.PI / 2, 0, 0)
    // positionExConn1.y += 45;
  }

  else if (arr1[0].y == -1) {
    ExternalConnection1.rotation.set(Math.PI / 2, 0, 0)
    // positionExConn1.y -= 45;
  }

  //EX-CO-2
  if (arr2[0].x == 1) {
    // positionExConn2.x += 45;
    // ExternalConnection2.rotation.x += Math.PI / 2;
  }
  else if (arr2[0].x == -1) {
    // positionExConn2.x -= 45;
    // ExternalConnection2.rotation.x += Math.PI / 2;
  }

  else if (arr2[0].y == 1) {
    // ExternalConnection2.rotation.z += Math.PI / 2;
    // positionExConn2.y += 45;
    ExternalConnection2.rotation.set(-Math.PI / 2, Math.PI, 0)
  }

  else if (arr2[0].y == -1) {
    // ExternalConnection2.rotation.z += Math.PI / 2;
    // positionExConn2.y -= 45;
    ExternalConnection2.rotation.set(-Math.PI / 2, Math.PI, 0)
  }

  // Aadarsh attached external connector model to cell group
  if (myModel1 && myModel2) {
    myModel1.position.copy(positionExConn1);
    myModel2.position.copy(positionExConn2);
    myModel1.rotation.copy(ExternalConnection1.rotation);
    myModel2.rotation.copy(ExternalConnection2.rotation);

    cellGroup.attach(myModel1);
    cellGroup.attach(myModel2);
  }
}

//Draw external connection for pouch cell
function drawExternalConnectionForPouch(PT: [], NT: []) {
  ExternalConnectionGeometryPouch = null;
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(PT.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(NT.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab1 = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab1);
  //for Tab 2
  let worldPositioinforTab2 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab2);

  let worldPositioinforTab1CY = group1.children[0].position.clone();
  group1.localToWorld(worldPositioinforTab1CY);
  cellGroup.localToWorld(worldPositioinforTab1CY);
  //for Tab 2
  let worldPositioinforTab2CY = group2.children[0].position.clone();
  group2.localToWorld(worldPositioinforTab2CY);
  cellGroup.localToWorld(worldPositioinforTab2CY);

  let positionExConn1 = new THREE.Vector3(worldPositioinforTab1.x, worldPositioinforTab1.y, worldPositioinforTab1.z);
  let positionExConn2 = new THREE.Vector3(worldPositioinforTab2.x, worldPositioinforTab2.y, worldPositioinforTab2.z);

  if (ExternalConnectionGeometryPouch == null) {
    ExternalConnectionGeometryPouch = new THREE.BoxGeometry(40, 2.5, 0.2);
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometryPouch, ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometryPouch, ExternalMaterial.clone());
  }
  else {
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometryPouch.clone(), ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometryPouch.clone(), ExternalMaterial.clone());
  }
  ExternalConnection1.name = 'Connector' + PT.toString();
  ExternalConnection2.name = 'Connector' + NT.toString();
  let arr1: any = [];
  let arr2: any = [];
  arr1 = externalDirection(worldPositioinforTab1CY);
  arr2 = externalDirection(worldPositioinforTab2CY);

  positionExConn1.z += (cellheight1 / 2 + tabheight1 / 2);
  positionExConn2.z += (cellheight1 / 2 + tabheight1 / 2);
  positionExConn1.x -= 6;
  positionExConn2.x += 6;
  let isFlippedPT = trackCell.get(PT.toString());
  let isFlippedNT = trackCell.get(NT.toString());

  //EX-CO-1
  if (arr1[0].x == 1) {
    positionExConn1.x += 19;
  }
  else if (arr1[0].x == -1) {
    positionExConn1.x -= 19;
  }
  else if (arr1[0].y == 1) {
    ExternalConnection1.rotation.z += Math.PI / 2;
    positionExConn1.y += 19;
  }

  else if (arr1[0].y == -1) {
    ExternalConnection1.rotation.z += Math.PI / 2;
    positionExConn1.y -= 19;
  }

  //EX-CO-2
  if (arr2[0].x == 1) {
    positionExConn2.x += 19;
  }
  else if (arr2[0].x == -1) {
    positionExConn2.x -= 19;
  }

  else if (arr2[0].y == 1) {
    ExternalConnection2.rotation.z += Math.PI / 2;
    positionExConn2.y += 19;
  }

  else if (arr2[0].y == -1) {
    ExternalConnection2.rotation.z += Math.PI / 2;
    positionExConn2.y -= 19;
  }

  ExternalConnection1.position.copy(positionExConn1);
  ExternalConnection2.position.copy(positionExConn2);
  cellGroup.add(ExternalConnection1);
  cellGroup.add(ExternalConnection2);
}

//Adds external connection for prismatic cell
function drawExternalConnectionPrismatic(PT: [], NT: []) {
  ExternalConnectionGeometry = null;
  let group1: THREE.Group = <THREE.Group>cellGroup.getObjectByName(PT.toString());
  let group2: THREE.Group = <THREE.Group>cellGroup.getObjectByName(NT.toString());
  if (!(group1 && group2))
    return;

  let worldPositioinforTab1 = group1.children[1].position.clone();
  group1.localToWorld(worldPositioinforTab1);
  //for Tab 2
  let worldPositioinforTab2 = group2.children[1].position.clone();
  group2.localToWorld(worldPositioinforTab2);

  let worldPositioinforTab1CY = group1.children[0].position.clone();
  group1.localToWorld(worldPositioinforTab1CY);
  //for Tab 2
  let worldPositioinforTab2CY = group2.children[0].position.clone();
  group2.localToWorld(worldPositioinforTab2CY);

  let positionExConn1 = new THREE.Vector3(worldPositioinforTab1.x, worldPositioinforTab1.y, worldPositioinforTab1.z);
  let positionExConn2 = new THREE.Vector3(worldPositioinforTab2.x, worldPositioinforTab2.y, worldPositioinforTab2.z);

  if (ExternalConnectionGeometry == null) {
    ExternalConnectionGeometry = new THREE.BoxGeometry(100, 10, 0.2);
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometry, ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometry, ExternalMaterial.clone());
  }
  else {
    ExternalConnection1 = new THREE.Mesh(ExternalConnectionGeometry.clone(), ExternalMaterial.clone());

    ExternalConnection2 = new THREE.Mesh(ExternalConnectionGeometry.clone(), ExternalMaterial.clone());
  }
  ExternalConnection1.name = 'Connector' + PT.toString();
  ExternalConnection2.name = 'Connector' + NT.toString();
  let arr1: any = [];
  let arr2: any = [];
  arr1 = externalDirection(worldPositioinforTab1CY);
  arr2 = externalDirection(worldPositioinforTab2CY);
  positionExConn1.z += (cellheight1 / 2 + tabheight1 / 2 + 0.6);
  positionExConn2.z += (cellheight1 / 2 + tabheight1 / 2 + 0.6);
  positionExConn1.x -= 21;
  positionExConn2.x += 21;
  //EX-CO-1
  if (arr1[0].x == 1) {
    positionExConn1.x += 45;
  }
  else if (arr1[0].x == -1) {
    positionExConn1.x -= 45;
  }
  else if (arr1[0].y == 1) {
    ExternalConnection1.rotation.z += Math.PI / 2;
    positionExConn1.y += 45;
  }

  else if (arr1[0].y == -1) {
    ExternalConnection1.rotation.z += Math.PI / 2;
    positionExConn1.y -= 45;
  }

  //EX-CO-2
  if (arr2[0].x == 1) {
    positionExConn2.x += 45;
  }
  else if (arr2[0].x == -1) {
    positionExConn2.x -= 45;
  }

  else if (arr2[0].y == 1) {
    ExternalConnection2.rotation.z += Math.PI / 2;
    positionExConn2.y += 45;
  }

  else if (arr2[0].y == -1) {
    ExternalConnection2.rotation.z += Math.PI / 2;
    positionExConn2.y -= 45;
  }

  ExternalConnection1.position.copy(positionExConn1);
  ExternalConnection2.position.copy(positionExConn2);
  cellGroup.add(ExternalConnection1);
  cellGroup.add(ExternalConnection2);
}

//deltes shpere from scene
function removePT() {
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].name == "pointGroup") {
      scene.children[i].clear();
    }
  }
}

function onlyUnique(value: any, index: any, array: any) {
  return array.indexOf(value) === index;
}


//returns external connection direction (always outwards)
function externalDirection(worldPositioinforTab: any) {
  let cell3DObject = cellGroup.children;
  let arr: any = [];
  // removePT()
  let origin = new THREE.Vector3(worldPositioinforTab.x, worldPositioinforTab.y, worldPositioinforTab.z);
  let dir1 = new THREE.Vector3(0, 1, 0);
  let dir2 = new THREE.Vector3(0, -1, 0);
  let dir3 = new THREE.Vector3(1, 0, 0);
  let dir4 = new THREE.Vector3(-1, 0, 0);
  let raycaster1 = new THREE.Raycaster(origin, dir1);
  let raycaster2 = new THREE.Raycaster(origin, dir2);
  let raycaster3 = new THREE.Raycaster(origin, dir3);
  let raycaster4 = new THREE.Raycaster(origin, dir4);
  let intersects1 = raycaster1.intersectObjects(cell3DObject);
  let intersects2 = raycaster2.intersectObjects(cell3DObject);
  let intersects3 = raycaster3.intersectObjects(cell3DObject);
  let intersects4 = raycaster4.intersectObjects(cell3DObject);

  let A1: any = [];
  let A2: any = [];
  let A3: any = [];
  let A4: any = [];
  // CreatePt(origin,false);
  for (let i = 0; i < intersects1.length; i++) {
    A1.push(intersects1[i].distance)
  }
  for (let i = 0; i < intersects2.length; i++) {
    A2.push(intersects2[i].distance)
  }
  for (let i = 0; i < intersects3.length; i++) {
    A3.push(intersects3[i].distance)
  }
  for (let i = 0; i < intersects4.length; i++) {
    A4.push(intersects4[i].distance)
  }


  var unique1 = A1.filter(onlyUnique);
  var unique2 = A2.filter(onlyUnique);
  var unique3 = A3.filter(onlyUnique);
  var unique4 = A4.filter(onlyUnique);
  if (unique1.length == 1) {
    arr.push(dir1);
    return arr;
  }
  else if (unique2.length == 1) {
    arr.push(dir2);
    return arr;
  }
  else if (unique3.length == 1) {
    arr.push(dir3);
    return arr;
  }
  else if (unique4.length == 1) {
    arr.push(dir4);
    return arr;
  }
  else {
    return arr;
  }
}

//Analyze all heatmap data to next level
function AnalyseData(json: heatmapdata[]) {
  lut.setColorMap("blackbody");
  SeriesOfMaps.clear();
  let dataarray = Object.values(json);
  for (let i = 0; i < dataarray.length; i++) {
    if (!SeriesOfMaps.get(dataarray[i].time)) {
      let innermap = new Map();
      SeriesOfMaps.set(dataarray[i].time, innermap);
    }
    let pt = new THREE.Vector3(dataarray[i].xCoord, dataarray[i].yCoord, dataarray[i].zCoord);
    SeriesOfMaps.get(dataarray[i].time).set(pt, dataarray[i].temperature);
  }
  if (cell_type1 == "cylindrical")
    GenerateVertexColors(json);
  else if (cell_type1 == "prismatic")
    GenerateVertexColorsPrismatic(json);
  else if (cell_type1 == "pouch")
    GenerateVertexColorsPouch(json);
}

function stop() {
  cancelAnimationFrame(ID);
}

// clear render and its context
function destroyContext() {
  closeScene();
  document.getElementById("MainDiv")!.removeChild(renderer.domElement);
  renderer.forceContextLoss();
  //renderer.context = null ;
  // renderer.domElement = null;
  // renderer = null;
}

//clear the complete scene
function closeScene() {
  "use strict";
  if (scene !== null) {
    if (sceneObject !== null) {
      var object = scene;
      if (object instanceof THREE.Object3D) {
        object.traverse(function (mesh) {
          if (mesh instanceof THREE.Mesh) {
            mesh.geometry.dispose();
            mesh.geometry = null;
            if (mesh.material.length != undefined) {
              if (mesh.material.length > 0) {
                for (var i = 0; i < mesh.material.length; i++) {
                  if (mesh.material[i].map) {
                    mesh.material[i].map.dispose();
                  }
                  mesh.material[i].dispose();
                }
              }
            } else {
              if (mesh.material.map) {
                mesh.material.map.dispose();
              }
              mesh.material.dispose();

            }
          }
        });
      }
      scene.remove(sceneObject);
      scene.clear();
    }
  }
}

export { InitiateConfigurator, drawExternalConnectionPrismatic, drawExternalConnectionForPouch, drawExternalConnectionForCylinder, drawConnectionPouch, drawSeriesConnectionPouch, createCellsAccordingToConnector, drawSeriesConnectionPrismatic, drawConnectionPrismatic, drawSeriesConnection, stop, destroyContext, CreatPouchCells, clearAllCylindersFromScene, lighPallet, drawConnection, updateVarialble, CreateCells1, AnalyseData, loadHeatPoints, addEnclosure, viewUI, SetOrientation, DeleteSelectedCylinder, CreateCells, CreatPrismaticCells, AdjustZoom };
