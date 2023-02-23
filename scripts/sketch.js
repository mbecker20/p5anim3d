function setup() {
  //block
  window.anim=makeScene(window.windowWidth,window.windowHeight) //returns anim3d object

  window.dt=.02;
  window.stepsPerFrame=1;
}

function draw() {
  window.anim.stepAnim(window.dt,window.stepsPerFrame);
}

