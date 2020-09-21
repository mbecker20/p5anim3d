function setup() {
  //block
  window.anim=makeScene(1200,600) //returns anim3d object

  window.dt=.02;
  window.stepsPerFrame=1;
}

function draw() {
  window.anim.stepAnim(window.dt,window.stepsPerFrame);
}

