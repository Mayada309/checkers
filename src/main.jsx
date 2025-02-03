import { Draughts } from 'draughts';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';

var scene, camera, renderer, controls, draughts, board, pointer, raycaster, selectedPiece = null;

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;
camera.position.y = 1;


const square = new THREE.BoxGeometry(1, 0.1, 1);
const lightSquare = new THREE.MeshBasicMaterial({ color: 0xE0C4AB });
const darkSquare = new THREE.MeshBasicMaterial({ color: 0x6A4236 });

board = new THREE.Group();

let squareNumber = 1;

for (let x = 0; x < 10; x++) {
  for (let z = 0; z < 10; z++) {
    let cube;
    if (z % 2 === 0) {
      cube = new THREE.Mesh(square, (x % 2 === 0 ? lightSquare : darkSquare));
      if (x % 2 !== 0) {
        cube.userData.squareNumber = squareNumber;
        squareNumber++;
      }
    }
    else {
      cube = new THREE.Mesh(square, (x % 2 !== 0 ? lightSquare : darkSquare));
      if (x % 2 === 0) {
        cube.userData.squareNumber = squareNumber;
        squareNumber++;
      }
    }
    cube.position.set(x, 0, z);
    board.add(cube);

  }

}

scene.add(board);

function positionForSquare(square) {
  const found = board.children.find((child) => child.userData.squareNumber == square);
  if (found)
    return found.position;
  return null;
}

function addCheckers(checkMesh) {
  for (let i = 0; i < 51; i++) {
    let pieceOn = draughts.get(i);
    const piece = checkMesh.clone(true);
    const squarePosition = positionForSquare(i);
    if (pieceOn === 'b') {
      piece.material = new THREE.MeshStandardMaterial({ color: 0x222222 });
      piece.userData.color = 'b';
      piece.userData.currentSquare = i;
      piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
      scene.add(piece);
    } else if (pieceOn === 'w') {
      piece.material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
      piece.userData.color = 'w';
      piece.userData.currentSquare = i;
      piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
      scene.add(piece);
    }
  }
}


const loader = new GLTFLoader();
loader.load('../public/checker.glb', function (gltf) {
  const checkerMesh = gltf.scene.children.find((child) => child.name === 'Cylinder');
  checkerMesh.scale.set(checkerMesh.scale.x * 0.5, checkerMesh.scale.y * 0.5, checkerMesh.scale.z * 0.5);
  checkerMesh.position.y += checkerMesh.scale.y;
  addCheckers(checkerMesh);
});

const light = new THREE.PointLight(0xffffff, 200, 200);
light.position.set(4, 10, 4.5);
light.castShadow = true;
scene.add(light);



renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);

pointer = new THREE.Vector2();
raycaster = new THREE.Raycaster();

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
};



function onClick() {
  raycaster.setFromCamera(pointer, camera);
  let intersects = raycaster.intersectObjects(scene.children);

  if (selectedPiece) {
    intersects = raycaster.intersectObjects(board.children);

    if (intersects.length > 0 && intersects[0].object.userData.squareNumber) {
      const targetSquare = intersects[0].object.userData.squareNumber;
      const selectedObject = scene.children.find((child) => child.userData.currentSquare == selectedPiece);
      if (!selectedObject || !targetSquare) return;
      const targetPosition = positionForSquare(targetSquare);
      selectedObject.position.set(targetPosition.x, selectedObject.position.y, targetPosition.z);
      selectedObject.currentSquare = targetSquare;
      selectedPiece = null;
    }
  }


  if (intersects.length > 0) {
    selectedPiece = intersects[0].object.userData.currentSquare;
    return;
  }

}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onClick);

controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(4.5, 0, 4.5);
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 3;
controls.maxDistance = 15;

draughts = new Draughts();
// console.log(draughts.fen());



function resetPiece() {

  // Reset transparency for all checkers first
  scene.children.forEach((child) => {
    if (child.userData.color) { // Check if it's a checker piece
      if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.transparent = true;
        child.material.opacity = (child.userData.currentSquare === selectedPiece) ? 0.5 : 1; // Reset opacity
      }
    }
  });
}



function hoverPieces() {
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, true); // 'true' ensures it checks child objects

  // // Reset transparency for all checkers first
  // scene.children.forEach((child) => {
  //   if (child.userData.color) { // Check if it's a checker piece
  //     if (child.material instanceof THREE.MeshStandardMaterial) {
  //       child.material.transparent = true;
  //       child.material.opacity = 1; // Reset opacity
  //     }
  //   }
  // });

  for (let i = 0; i < intersects.length; i++) { // Fix 'lenght' typo
    const obj = intersects[i].object;
    if (obj.userData.color) { // Ensure it's a checker piece
      if (obj.material instanceof THREE.MeshStandardMaterial) {
        obj.material.transparent = true;
        obj.material.opacity = 0.5;
      }
    }
  }

};



function animate() {
  requestAnimationFrame(animate);

  controls.update();

  resetPiece();
  hoverPieces();

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
};

animate();
