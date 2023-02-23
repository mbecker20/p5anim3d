function makeScene(xPix,yPix) {
    const nodeMass=1;
    const xNodes=4;
    const yNodes=8;
    const zNodes=12;
    const spacing=1;
    let comP=[50,0,30];
    let comV=[0,0,0];
    let initW=[5,0,1];
    let block0=new Block(nodeMass,xNodes,yNodes,zNodes,spacing,comP,comV,initW);

    let block1=new Block(nodeMass,xNodes,yNodes,zNodes,spacing,[60,0,40],comV,initW);

    const xLen=60;
    const yLen=60;
    const zLen=60;
    const centerBB=[50,0,30];
    let boundingBox=new BlockCorners(xLen,yLen,zLen,centerBB);

    //color
    const fillColor0=color(200,0,150,100); //magenta
    const fillColor1=color(0,100,255,102); //blue
    const fillColor2=color(25,255,100,100); //green

    const length=40;
    const width=40;
    const normal0=[0,0,1];
    const centerFloor0=[50,0,0];
    let floor0=new Rect3D(length,width,centerFloor0,normal0,fillColor0);
    
    const centerWall0=[50,30,30];
    const normalWall0=[0,1,0];
    let wall0=new Rect3D(length,width,centerWall0,normalWall0,fillColor1);

    const centerWall1=[50,-30,30];
    let wall1=new Rect3D(length,width,centerWall1,normalWall0,fillColor2);

    const width2=length*math.phi
    let plane0=new Rect3D(length,width2,[140,0,50],[0,0,1],fillColor0,[0,1,0]);
    let plane1=new Rect3D(width2,length,[140,0,50],[0,1,0],fillColor1);
    let plane2=new Rect3D(length,width2,[140,0,50],[1,0,0],fillColor2);

    let isoc0=new Isocahedron(20,[0,0,10],200,[0,0,1]);
    let isoc1=new Isocahedron(length,[140,80,50],100,[0,0,1]);
    let isoc2=new Isocahedron(length,[140,-80,50],255,[0,0,1]);

    const xyrange=[-7,7];
    let sheet0=new FuncSheet(xyrange,xyrange,function(x,y) {
        const rAndTheta=VF.toPolar(x,y);
        let r=rAndTheta[0];
        const theta=rAndTheta[1];
        //if(r==0) {
        //    r=.01;
        //}
        return (1/9)*r*r*Math.cos(2*theta);
    },190);

    let sheet1=new FuncSheet(xyrange,xyrange,function(x,y) {
        const rAndTheta=VF.toPolar(x,y);
        let r=rAndTheta[0];
        const theta=rAndTheta[1];
        //if(r==0) {
        //    r=.01;
        //}
        return (1/30)*r*r*Math.sin(4*theta);
    },245);

    //viewer
    let viewPoint=[-10,-8,20];
    let viewDir=VF.unit([4,1,0]);
    let fovTheta=Math.PI/5;
    let moveDist=.2;
    let rotRad=.04;
    let deltaTheta=.001;
    let mouseRotScale=.003;
    let viewer=new Viewer(viewPoint,viewDir,fovTheta,xPix,yPix,moveDist,rotRad,deltaTheta,mouseRotScale);

    //anim
    let dynObjs=[block0,block1,isoc1];
    let statObjs=[floor0,wall0,wall1,plane0,plane1,plane2,boundingBox];
    //let dynObjs=[isoc0,isoc1,isoc2];
    //let statObjs=[boundingBox,centerFloor0,sheet0,plane0,plane1,plane2];
    const grav=-10;
    const vlc=1;
    const angMomFrac=.98;
    createCanvas(xPix,yPix);
    return new Anim3d(viewer,dynObjs,statObjs,grav,vlc,angMomFrac);
}