import * as BABYLON from '@babylonjs/core';

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);
// const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
const camera = new BABYLON.ArcRotateCamera('Camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
// camera.setTarget(BABYLON.Vector3.Zero());
camera.setPosition(new BABYLON.Vector3(0, 0, 10));
camera.inputs.addMouseWheel();

let spheresV = [];
let paths = [];
let options = [];
const springConstant = 5; // N/m
const l_StructuralSpring = 1; // 構成バネの自然長 m
const l_ShearSpring = Math.sqrt(
  l_StructuralSpring * l_StructuralSpring + l_StructuralSpring * l_StructuralSpring
); // 斜めバネ(せん断バネ)の自然長 m
const l_BendSpring = 2; // 曲げバネの自然長 m
const dt = 0.03;
const m = 0.1; // kg
const g = -9.8; // m/s^2
let time = 0;

const oneLineCount = 10;

//コリジョン用のsphere
let sphereForCollision;

let spheres = new Array(oneLineCount).fill(null).map(() => new Array(oneLineCount).fill(null));
let spheresPrevPosition = new Array(oneLineCount)
  .fill(null)
  .map(() => new Array(oneLineCount).fill(null));

let debugLines = [];

camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;

addSphereForCollision(0, -2, 3);

for (let i = 0; i < oneLineCount; i++) {
  for (let k = 0; k < oneLineCount; k++) {
    const sphere = BABYLON.CreateSphere(i, { segments: 10, diameter: 0.25 }, scene);
    const x = i * l_StructuralSpring - oneLineCount / 2;
    const y = k * l_StructuralSpring - oneLineCount / 2;
    let p = new BABYLON.Vector3(x, y, 0);
    sphere.position = p;
    spheresPrevPosition[i][k] = p;
    spheres[i][k] = sphere;
  }
}

//debug用のlineの作成
//縦のline
for (let i = 0; i < oneLineCount; i++) {
  const path = [];
  const option = {
    points: path, //vec3 array,
    updatable: true,
  };
  for (let k = 0; k < oneLineCount; k++) {
    path.push(spheres[i][k].position);
  }
  const line = BABYLON.MeshBuilder.CreateLines('lines', option, scene);
  debugLines.push(line);
  paths.push(path);
  options.push(option);
}
//横のline
for (let i = 0; i < oneLineCount; i++) {
  const path = [];
  const option = {
    points: path, //vec3 array,
    updatable: true,
  };
  for (let k = 0; k < oneLineCount; k++) {
    path.push(spheres[k][i].position);
  }
  const line = BABYLON.MeshBuilder.CreateLines('lines', option, scene);
  debugLines.push(line);
  paths.push(path);
  options.push(option);
}

const updatePaths = () => {
  for (let i = 0; i < oneLineCount; i++) {
    for (let k = 0; k < oneLineCount; k++) {
      paths[i][k] = spheres[i][k].position;
    }
    options[i].instance = debugLines[i];
    BABYLON.MeshBuilder.CreateLines('lines', options[i]);
  }
  for (let i = 0; i < oneLineCount; i++) {
    for (let k = 0; k < oneLineCount; k++) {
      paths[i + oneLineCount][k] = spheres[k][i].position;
    }
    options[i + oneLineCount].instance = debugLines[i + oneLineCount];
    BABYLON.MeshBuilder.CreateLines('lines', options[i + oneLineCount]);
  }
};

scene.registerBeforeRender(function () {
  updatePaths();
});

function computeForce(position, prevPosition, nextPosition) {
  const vec1 = position.subtract(prevPosition);
  const vec2 = position.subtract(nextPosition);
  const f1 = vec1
    .clone()
    .normalize()
    .scale(-springConstant * (vec1.length() - l_StructuralSpring));
  const f2 = vec2
    .clone()
    .normalize()
    .scale(-springConstant * (vec2.length() - l_StructuralSpring));
  return f1.add(f2);
}

function calculateForce(i, k, offset, equilibriumLength) {
  let length = spheres[i][k].position
    .clone()
    .subtract(spheres[i + offset.x][k + offset.y].position)
    .length();
  let vec = spheres[i][k].position
    .clone()
    .subtract(spheres[i + offset.x][k + offset.y].position)
    .normalize();
  const force = vec.scale(-1 * springConstant * (length - equilibriumLength));
  return force;
}

function calculateTotalForce(i, k) {
  let leftForce = new BABYLON.Vector3(0, 0, 0);
  let rightForce = new BABYLON.Vector3(0, 0, 0);
  let upForce = new BABYLON.Vector3(0, 0, 0);
  let downForce = new BABYLON.Vector3(0, 0, 0);

  let lowerLeftForce = new BABYLON.Vector3(0, 0, 0); //↙
  let lowerRightForce = new BABYLON.Vector3(0, 0, 0); //↘
  let upperLeftForce = new BABYLON.Vector3(0, 0, 0); //↖
  let upperRightForce = new BABYLON.Vector3(0, 0, 0); //↗

  let secondLeftForce = new BABYLON.Vector3(0, 0, 0); //←←
  let secondRightForce = new BABYLON.Vector3(0, 0, 0); //→→
  let secondUpForce = new BABYLON.Vector3(0, 0, 0); //↑↑
  let secondDownForce = new BABYLON.Vector3(0, 0, 0); //↓↓

  let secondLowerLeftForce = new BABYLON.Vector3(0, 0, 0); //↙↙
  let secondLowerRightForce = new BABYLON.Vector3(0, 0, 0); //↘↘
  let secondUpperLeftForce = new BABYLON.Vector3(0, 0, 0); //↖↖
  let secondUpperRightForce = new BABYLON.Vector3(0, 0, 0); //↗↗

  if (i !== 0) {
    //←
    leftForce = calculateForce(i, k, { x: -1, y: 0 }, l_StructuralSpring);

    //↙
    if (k !== oneLineCount - 1) {
      lowerLeftForce = calculateForce(i, k, { x: -1, y: 1 }, l_ShearSpring);
    }

    //←←
    if (i !== 1) {
      secondLeftForce = calculateForce(i, k, { x: -2, y: 0 }, l_BendSpring);
    }

    //↙↙
    if (k !== oneLineCount - 1 && i !== 1) {
      secondLowerLeftForce = calculateForce(i, k, { x: -2, y: 1 }, l_BendSpring);
    }
  }
  if (i !== oneLineCount - 1) {
    //→
    rightForce = calculateForce(i, k, { x: 1, y: 0 }, l_StructuralSpring);

    //↘
    if (k !== oneLineCount - 1) {
      lowerRightForce = calculateForce(i, k, { x: 1, y: 1 }, l_ShearSpring);
    }

    //→→
    if (i !== oneLineCount - 2) {
      secondRightForce = calculateForce(i, k, { x: 2, y: 0 }, l_BendSpring);
    }

    //↘↘
    if (k !== oneLineCount - 1 && i !== oneLineCount - 2) {
      secondLowerRightForce = calculateForce(i, k, { x: 2, y: 1 }, l_BendSpring);
    }
  }
  if (k !== 0) {
    //↑
    upForce = calculateForce(i, k, { x: 0, y: -1 }, l_StructuralSpring);

    //↖
    if (i !== 0) {
      upperLeftForce = calculateForce(i, k, { x: -1, y: -1 }, l_ShearSpring);
    }

    //↗
    if (i !== oneLineCount - 1) {
      upperRightForce = calculateForce(i, k, { x: 1, y: -1 }, l_ShearSpring);
    }

    //↑↑
    if (k !== 1) {
      secondUpForce = calculateForce(i, k, { x: 0, y: -2 }, l_BendSpring);
    }

    //↖↖
    if (i !== 0 && k !== 1) {
      secondUpperLeftForce = calculateForce(i, k, { x: -1, y: -2 }, l_BendSpring);
    }

    //↗↗
    if (i !== oneLineCount - 1 && k !== 1) {
      secondUpperRightForce = calculateForce(i, k, { x: 1, y: -2 }, l_BendSpring);
    }
  }
  if (k !== oneLineCount - 1) {
    //↓
    downForce = calculateForce(i, k, { x: 0, y: 1 }, l_StructuralSpring);

    //↓↓
    if (k !== oneLineCount - 2) {
      secondDownForce = calculateForce(i, k, { x: 0, y: 2 }, l_BendSpring);
    }
  }

  const force = leftForce
    .add(rightForce)
    .add(upForce)
    .add(downForce)
    .add(lowerLeftForce)
    .add(lowerRightForce)
    .add(upperLeftForce)
    .add(upperRightForce)
    .add(secondLeftForce)
    .add(secondRightForce)
    .add(secondUpForce)
    .add(secondDownForce)
    // .add(secondLowerLeftForce)
    // .add(secondLowerRightForce)
    // .add(secondUpperLeftForce)
    // .add(secondUpperRightForce)
    .add(new BABYLON.Vector3(0, m * g, 0))
    .add(new BABYLON.Vector3(0, 0, Math.sin(time * 0.5) * 6));
  return force;
}

function calculateAcceleration(i, k) {
  const force = calculateTotalForce(i, k);
  const adjustForce = spheres[i][k].position
    .clone()
    .subtract(spheresPrevPosition[i][k])
    .scale(1 / dt);
  force.add(adjustForce);
  const a = force.scale(1 / m);
  return a;
}

//コリジョン用のsphereを追加
function addSphereForCollision(x, y, z) {
  sphereForCollision = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 4 }, scene);
  sphereForCollision.position = new BABYLON.Vector3(x, y, z);
  sphereForCollision.material = new BABYLON.StandardMaterial('sphereMaterial', scene);
  sphereForCollision.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
}

// Render every frame
engine.runRenderLoop(() => {
  time += dt;

  let newPos = new Array(oneLineCount).fill(null).map(() => new Array(oneLineCount));

  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < spheres.length; i++) {
      for (let k = 0; k < spheres.length; k++) {
        if (k === oneLineCount - 1) {
          newPos[i][k] = spheres[i][k].position.clone();
          continue;
        }
        const a = calculateAcceleration(i, k);
        let nextPos = spheres[i][k].position
          .clone()
          .scale(2)
          .subtract(spheresPrevPosition[i][k])
          .add(a.scale(dt * dt));

        //衝突判定
        const dist = nextPos.subtract(sphereForCollision.position).length();
        if (dist <= 2.2) {
          const vec = nextPos.clone().subtract(sphereForCollision.position).normalize();
          const pos = sphereForCollision.position.clone().add(vec.scale(2.21));
          nextPos = pos;
          spheresPrevPosition[i][k] = pos;
        }

        spheresPrevPosition[i][k] = spheres[i][k].position.clone();
        newPos[i][k] = nextPos;
      }
    }
  }

  // 更新
  for (let i = 0; i < oneLineCount; i++) {
    for (let k = 0; k < oneLineCount; k++) {
      spheres[i][k].position = newPos[i][k];
    }
  }

  scene.render();
});
