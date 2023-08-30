/* Demo JS */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { gsap } from 'gsap';
import { DoubleSide, EquirectangularRefractionMapping } from 'three';
import { AnimationUtils } from 'three';

const canvas = document.querySelector('.canvas');
let bgTexture, sphere, ground, box;

//load manager
const loadManager = new THREE.LoadingManager();
const loader = new RGBELoader(loadManager);

loader.load('/assets/bg.hdr', function (texture) {
  texture.mapping = EquirectangularRefractionMapping;
  bgTexture = texture;
});

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfefefe);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(10, 6, 15);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.autoRotate = true;

//cannon world
const world = new CANNON.World({
  gravity:  new CANNON.Vec3(0, -9.81, 0)
})

const groundPhysMat = new CANNON.Material()
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(10,10,0.1)),
  // mass: 0,
  type: CANNON.Body.STATIC,
  material: groundPhysMat
})

world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0,0)

const spherePhysMat = new CANNON.Material()
const sphereBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(1,50,50),
  position: new CANNON.Vec3(0, 7, 0),
  material: spherePhysMat
})
world.addBody(sphereBody);

sphereBody.linearDamping = 0.6;

const sphereContactMat = new CANNON.ContactMaterial(groundPhysMat, spherePhysMat, {
  restitution: 0.9
})
world.addContactMaterial(sphereContactMat)

const boxPhysMat = new CANNON.Material();
const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
  position: new CANNON.Vec3(1, 10, 0),
  material: boxPhysMat
})
const boxContactMat = new CANNON.ContactMaterial(groundPhysMat, boxPhysMat, {
  friction: 0.025
})
world.addContactMaterial(boxContactMat)
world.addBody(boxBody);


loadManager.onLoad = () =>{
  scene.background = bgTexture;

  addModel();
  animate();
  helpers();
  addEventListeners();
}


function addModel(){
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 50, 50),
    new THREE.MeshStandardMaterial({
      roughness: 0,
      metalness: 0,
      color: 0xffffff,
      envMap: bgTexture,
    })
  );

  box = new THREE.Mesh(
    new THREE.BoxGeometry(2),
    new THREE.MeshStandardMaterial({
      roughness: 0,
      metalness: 0,
      color: 0xffffff,
      envMap: bgTexture,
    })
  );
  
  ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    })
  )

  scene.add(sphere,ground, box);
}

const clock = new THREE.Clock();
let oldElapsedTime = 0

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime
  oldElapsedTime = elapsedTime

  world.step(1 / 60, deltaTime, 3)
  ground.position.copy(groundBody.position);
  ground.quaternion.copy(groundBody.quaternion)

  sphere.position.copy(sphereBody.position);
  sphere.quaternion.copy(sphereBody.quaternion)

  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion)

  renderer.render(scene, camera);
  orbit.update();
  renderer.setAnimationLoop(animate);
}

function resizeEvent() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function helpers(){
  // Sets a 12 by 12 gird helper
  const gridHelper = new THREE.GridHelper(12, 12);
  scene.add(gridHelper);

  // Sets the x, y, and z axes with each having a length of 4
  const axesHelper = new THREE.AxesHelper(4);
  scene.add(axesHelper);
}

function addEventListeners(){
  window.addEventListener('resize', resizeEvent);
}