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

function calculateForce(i, k) {
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

  if (i !== 0) {
    //←
    let length = spheres[i][k].position
      .clone()
      .subtract(spheres[i - 1][k].position)
      .length();
    const leftVec = spheres[i][k].position
      .clone()
      .subtract(spheres[i - 1][k].position)
      .normalize();
    leftForce = leftVec.scale(-springConstant * (length - l));

    //↙
    if (k !== oneLineCount - 1) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 1][k + 1].position)
        .length();
      const lowerLeftVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 1][k + 1].position)
        .normalize();
      lowerLeftForce = lowerLeftVec.scale(-springConstant * (length - l));
    }

    //←←
    if (i !== 1) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 2][k].position)
        .length();
      const secondLeftVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 2][k].position)
        .normalize();
      secondLeftForce = secondLeftVec.scale(-springConstant * (length - l));
    }
  }
  if (i !== oneLineCount - 1) {
    //→
    let length = spheres[i][k].position
      .clone()
      .subtract(spheres[i + 1][k].position)
      .length();
    const rightVec = spheres[i][k].position
      .clone()
      .subtract(spheres[i + 1][k].position)
      .normalize();
    rightForce = rightVec.scale(-springConstant * (length - l));

    //↘
    if (k !== oneLineCount - 1) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 1][k + 1].position)
        .length();
      const lowerRightVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 1][k + 1].position)
        .normalize();
      lowerRightForce = lowerRightVec.scale(-springConstant * (length - l));
    }

    //→→
    if (i !== oneLineCount - 2) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 2][k].position)
        .length();
      const secondRightVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 2][k].position)
        .normalize();
      secondRightForce = secondRightVec.scale(-springConstant * (length - l));
    }
  }
  if (k !== 0) {
    //↑
    let length = spheres[i][k].position
      .clone()
      .subtract(spheres[i][k - 1].position)
      .length();
    const upVec = spheres[i][k].position
      .clone()
      .subtract(spheres[i][k - 1].position)
      .normalize();
    upForce = upVec.scale(-springConstant * (length - l));

    //↖
    if (i !== 0) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 1][k - 1].position)
        .length();
      const upperLeftVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i - 1][k - 1].position)
        .normalize();
      upperLeftForce = upperLeftVec.scale(-springConstant * (length - l));
    }

    //↗
    if (i !== oneLineCount - 1) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 1][k - 1].position)
        .length();
      const upperRightVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i + 1][k - 1].position)
        .normalize();
      upperRightForce = upperRightVec.scale(-springConstant * (length - l));
    }

    //↑↑
    if (k !== 1) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i][k - 2].position)
        .length();
      const secondUpVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i][k - 2].position)
        .normalize();
      secondUpForce = secondUpVec.scale(-springConstant * (length - l));
    }
  }
  if (k !== oneLineCount - 1) {
    //↓
    let length = spheres[i][k].position
      .clone()
      .subtract(spheres[i][k + 1].position)
      .length();
    const downVec = spheres[i][k].position
      .clone()
      .subtract(spheres[i][k + 1].position)
      .normalize();
    downForce = downVec.scale(-springConstant * (length - l));

    //↓↓
    if (k !== oneLineCount - 2) {
      let length = spheres[i][k].position
        .clone()
        .subtract(spheres[i][k + 2].position)
        .length();
      const secondDownVec = spheres[i][k].position
        .clone()
        .subtract(spheres[i][k + 2].position)
        .normalize();
      secondDownForce = secondDownVec.scale(-springConstant * (length - l));
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
    .add(new BABYLON.Vector3(0, m * g, 0))
    .add(new BABYLON.Vector3(0, 0, Math.sin(time * 0.5) * 2));
  return force;
}

function calculateAcceleration(i, k) {
  const force = calculateForce(i, k);
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
  // let newPos = new Array(spheres.length);
  // let newV = new Array(spheres.length);

  // for (let i = 1; i < spheres.length - 1; i++) {
  //   const force = computeForce(
  //     spheres[i].position,
  //     spheres[i - 1].position,
  //     spheres[i + 1].position
  //   );

  //   const k1_v = force.scale(dt);
  //   const k1_p = spheresV[i].scale(dt);

  //   const k2_v = computeForce(
  //     spheres[i].position.add(k1_p.scale(0.5)),
  //     spheres[i - 1].position,
  //     spheres[i + 1].position
  //   ).scale(dt);
  //   const k2_p = spheresV[i].add(k1_v.scale(0.5)).scale(dt);

  //   const k3_v = computeForce(
  //     spheres[i].position.add(k2_p.scale(0.5)),
  //     spheres[i - 1].position,
  //     spheres[i + 1].position
  //   ).scale(dt);
  //   const k3_p = spheresV[i].add(k2_v.scale(0.5)).scale(dt);

  //   const k4_v = computeForce(
  //     spheres[i].position.add(k3_p),
  //     spheres[i - 1].position,
  //     spheres[i + 1].position
  //   ).scale(dt);
  //   const k4_p = spheresV[i].add(k3_v).scale(dt);

  //   newV[i] = spheresV[i].add(
  //     k1_v
  //       .add(k2_v.scale(2))
  //       .add(k3_v.scale(2))
  //       .add(k4_v)
  //       .scale(1 / 6)
  //   );
  //   newPos[i] = spheres[i].position.add(
  //     k1_p
  //       .add(k2_p.scale(2))
  //       .add(k3_p.scale(2))
  //       .add(k4_p)
  //       .scale(1 / 6)
  //   );
  // }

  // newPos[0] = spheres[0].position.clone();
  // newV[0] = spheresV[0].clone();
  // newPos[spheres.length - 1] = spheres[spheres.length - 1].position.clone();
  // newV[spheres.length - 1] = spheresV[spheres.length - 1].clone();

  // ------

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
