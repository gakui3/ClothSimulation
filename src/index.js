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
const springConstant = 10.0; // N/m
const l = 1; // m
const dt = 0.03;
const m = 0.1; // kg
const g = -9.8; // m/s^2
let time = 0;

const oneLineCount = 10;

let spheres = new Array(oneLineCount).fill(null).map(() => new Array(oneLineCount).fill(null));
let spheresPrevPosition = new Array(oneLineCount)
  .fill(null)
  .map(() => new Array(oneLineCount).fill(null));

let debugLines = [];

camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;

for (let i = 0; i < oneLineCount; i++) {
  for (let k = 0; k < oneLineCount; k++) {
    const sphere = BABYLON.CreateSphere(i, { segments: 10, diameter: 0.25 }, scene);
    const x = i * l - oneLineCount / 2;
    const y = k * l - oneLineCount / 2;
    let p = new BABYLON.Vector3(x, y, 0);
    sphere.position = p;
    spheresPrevPosition[i][k] = p;
    spheres[i][k] = sphere;
  }
}

function computeForce(position, prevPosition, nextPosition) {
  const vec1 = position.subtract(prevPosition);
  const vec2 = position.subtract(nextPosition);
  const f1 = vec1
    .clone()
    .normalize()
    .scale(-springConstant * (vec1.length() - l));
  const f2 = vec2
    .clone()
    .normalize()
    .scale(-springConstant * (vec2.length() - l));
  return f1.add(f2);
}

function calculateForce(i, k, offset) {
  let length = spheres[i][k].position
    .clone()
    .subtract(spheres[i + offset.x][k + offset.y].position)
    .length();
  let vec = spheres[i][k].position
    .clone()
    .subtract(spheres[i + offset.x][k + offset.y].position)
    .normalize();
  const force = vec.scale(-1 * springConstant * (length - l));
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
    leftForce = calculateForce(i, k, { x: -1, y: 0 });

    //↙
    if (k !== oneLineCount - 1) {
      lowerLeftForce = calculateForce(i, k, { x: -1, y: 1 });
    }

    //←←
    if (i !== 1) {
      secondLeftForce = calculateForce(i, k, { x: -2, y: 0 });
    }

    //↙↙
    if (k !== oneLineCount - 1 && i !== 1) {
      secondLowerLeftForce = calculateForce(i, k, { x: -2, y: 1 });
    }
  }
  if (i !== oneLineCount - 1) {
    //→
    rightForce = calculateForce(i, k, { x: 1, y: 0 });

    //↘
    if (k !== oneLineCount - 1) {
      lowerRightForce = calculateForce(i, k, { x: 1, y: 1 });
    }

    //→→
    if (i !== oneLineCount - 2) {
      secondRightForce = calculateForce(i, k, { x: 2, y: 0 });
    }

    //↘↘
    if (k !== oneLineCount - 1 && i !== oneLineCount - 2) {
      secondLowerRightForce = calculateForce(i, k, { x: 2, y: 1 });
    }
  }
  if (k !== 0) {
    //↑
    upForce = calculateForce(i, k, { x: 0, y: -1 });

    //↖
    if (i !== 0) {
      upperLeftForce = calculateForce(i, k, { x: -1, y: -1 });
    }

    //↗
    if (i !== oneLineCount - 1) {
      upperRightForce = calculateForce(i, k, { x: 1, y: -1 });
    }

    //↑↑
    if (k !== 1) {
      secondUpForce = calculateForce(i, k, { x: 0, y: -2 });
    }

    //↖↖
    if (i !== 0 && k !== 1) {
      secondUpperLeftForce = calculateForce(i, k, { x: -1, y: -2 });
    }

    //↗↗
    if (i !== oneLineCount - 1 && k !== 1) {
      secondUpperRightForce = calculateForce(i, k, { x: 1, y: -2 });
    }
  }
  if (k !== oneLineCount - 1) {
    //↓
    downForce = calculateForce(i, k, { x: 0, y: 1 });

    //↓↓
    if (k !== oneLineCount - 2) {
      secondDownForce = calculateForce(i, k, { x: 0, y: 2 });
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
    // .add(secondLeftForce)
    // .add(secondRightForce)
    // .add(secondUpForce)
    // .add(secondDownForce)
    // .add(secondLowerLeftForce)
    // .add(secondLowerRightForce)
    // .add(secondUpperLeftForce)
    // .add(secondUpperRightForce)
    .add(new BABYLON.Vector3(0, m * g, 0))
    .add(new BABYLON.Vector3(0, 0, Math.sin(time * 0.5) * 2));
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
        const nextPos = spheres[i][k].position
          .clone()
          .scale(2)
          .subtract(spheresPrevPosition[i][k])
          .add(a.scale(dt * dt));
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

  if (debugLines.length > 0) {
    debugLines.forEach((line) => {
      line.dispose();
    });
    debugLines = [];
  }
  for (let i = 0; i < oneLineCount; i++) {
    for (let k = 0; k < oneLineCount; k++) {
      //debug用のlineを作成。各球の中心から右と下の球の中心に向かう線を作成
      if (i !== oneLineCount - 1) {
        const line = BABYLON.MeshBuilder.CreateLines(
          'line',
          { points: [spheres[i][k].position, spheres[i + 1][k].position] },
          scene
        );
        debugLines.push(line);
      }
      if (k !== oneLineCount - 1) {
        const line = BABYLON.MeshBuilder.CreateLines(
          'line',
          { points: [spheres[i][k].position, spheres[i][k + 1].position] },
          scene
        );
        debugLines.push(line);
      }
    }
  }

  scene.render();
});
