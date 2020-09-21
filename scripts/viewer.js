class Viewer {
    constructor(viewPoint,viewDir,fovTheta,xPix,yPix,moveDist,rotRad,deltaTheta,mouseRotScale) {
        this.viewPoint=viewPoint;
        this.viewOTens=this.getviewOTens(viewDir);
        this.fovTheta=fovTheta;
        this.rotRad=rotRad;
        this.deltaTheta=deltaTheta;
        this.mouseRotScale=mouseRotScale;
        this.xPix=xPix;
        this.yPix=yPix;
        this.setPlaneDist();
        this.zTol=.1;
        this.winCenter=[xPix/2,yPix/2,0];
        this.moveDist=moveDist;
        this.setForwardVec();
        this.fovMax=Math.PI/2.5;
        this.fovMin=Math.PI/24;
    }

    updateParams() {
        this.rotateCheck();
        this.rotateCheckMouse();
        this.moveCheck();
        this.fovCheck();
    }

    getOrientedPoints(pointsMat) {
        let centeredPoints=VF.addVecToRows(pointsMat,math.multiply(this.viewPoint,-1));
        return math.multiply(centeredPoints,math.transpose(this.viewOTens));
    }
    
    getProjectedPointsInFront(points) {
        let scale;
        let projX;
        let projY;
        const planeDist=this.planeDist;
        let projPoints=points.map(function(point) {
            scale=planeDist/point[2];
            projX=scale*point[0];
            projY=scale*point[1];
            return [projX,projY,point[2]];
        });
        return VF.addVecToRows(projPoints,this.winCenter);
    }
    
    setPlaneDist() {
        this.planeDist=0.5*this.yPix/math.tan(this.fovTheta);
    }

    getviewOTens(viewDir) {
        // viewDir must be normalized
        const xPrime=VF.unit(math.cross(viewDir,[0,0,1]));
        const yPrime=VF.unit(math.cross(viewDir,xPrime));
        return [xPrime,yPrime,viewDir];
    }

    addLines(pointsMat,lineGroups) {
        const orientedPointsMat=this.getOrientedPoints(pointsMat);
        let linePoints=[];
        const zTol=this.zTol;
        lineGroups.forEach(function(group) {
            if(orientedPointsMat[group[0]][2]>0) {
                linePoints.push(orientedPointsMat[group[0]]);
                if(orientedPointsMat[group[1]][2]>0) {
                    linePoints.push(orientedPointsMat[group[1]]);
                } else {
                    linePoints.push(VF.getPointBetweenWithZ(orientedPointsMat[group[0]],orientedPointsMat[group[1]],zTol));
                }
            } else if(orientedPointsMat[group[1]][2]>0) {
                linePoints.push(orientedPointsMat[group[1]]);
                linePoints.push(VF.getPointBetweenWithZ(orientedPointsMat[group[0]],orientedPointsMat[group[1]],zTol));
            }
        });
        if(linePoints.length!=0) {
            let projectedPoints=this.getProjectedPointsInFront(linePoints);
            stroke(255);
            for(var i=0;i<linePoints.length;i+=2) {
                line(projectedPoints[i][0],projectedPoints[i][1],projectedPoints[i+1][0],projectedPoints[i+1][1]);
            }
        }
    }

    addPoly(pointsMat,vertInd,fillColor) {
        // vertInd are the indices of the vertexes that are rows of pointsMat in the right order (around center)
        const orientedPointsMat=this.getOrientedPoints(pointsMat);
        let polyPoints=[];
        for(var i=0;i<vertInd.length;i++) {
            if(orientedPointsMat[vertInd[i]][2]>0) {
                polyPoints.push(orientedPointsMat[vertInd[i]]);
            } else {
                if(i==0) {
                    if(orientedPointsMat[vertInd[vertInd.length-1]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[vertInd.length-1]],orientedPointsMat[vertInd[0]],this.zTol));
                    } 
                    if(orientedPointsMat[vertInd[1]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[1]],orientedPointsMat[vertInd[0]],this.zTol));
                    }
                } else if(i==orientedPointsMat.length-1) {
                    if(orientedPointsMat[vertInd[i-1]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[i-1]],orientedPointsMat[vertInd[i]],this.zTol));
                    }
                    if(orientedPointsMat[vertInd[0]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[0]],orientedPointsMat[vertInd[i]],this.zTol));
                    }
                } else {
                    if(orientedPointsMat[vertInd[i-1]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[i-1]],orientedPointsMat[vertInd[i]],this.zTol));
                    }
                    if(orientedPointsMat[vertInd[i+1]][2]>0) {
                        polyPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[vertInd[i+1]],orientedPointsMat[vertInd[i]],this.zTol));
                    }
                }
            }
        }
        if(polyPoints.length!=0) {
            const projPolyPoints=this.getProjectedPointsInFront(polyPoints);
            let center=[0,0,0];
            projPolyPoints.forEach(function(point) {
                center=math.add(center,point);
            });
            center=math.divide(center,projPolyPoints.length);
            fill(fillColor);
            noStroke();
            for(var i=0;i<projPolyPoints.length;i++) {
                if(i==projPolyPoints.length-1) {
                    triangle(center[0],center[1],projPolyPoints[i][0],projPolyPoints[i][1],projPolyPoints[0][0],projPolyPoints[0][1]);
                } else {
                    triangle(center[0],center[1],projPolyPoints[i][0],projPolyPoints[i][1],projPolyPoints[i+1][0],projPolyPoints[i+1][1]);
                }
            }
        }
    }

    addTriangle(orientedPointsMat,fillColor) {
        let triPoints=[];
        for(var i=0;i<3;i++) {
            if(orientedPointsMat[i][2]>0) {
                triPoints.push(orientedPointsMat[i]);
            } else {
                if(i==0) {
                    if(orientedPointsMat[2][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[2],orientedPointsMat[0],this.zTol));
                    } 
                    if(orientedPointsMat[1][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[1],orientedPointsMat[0],this.zTol));
                    }
                } else if(i==2) {
                    if(orientedPointsMat[1][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[1],orientedPointsMat[2],this.zTol));
                    }
                    if(orientedPointsMat[0][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[0],orientedPointsMat[2],this.zTol));
                    }
                } else {
                    if(orientedPointsMat[0][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[0],orientedPointsMat[1],this.zTol));
                    }
                    if(orientedPointsMat[2][2]>0) {
                        triPoints.push(VF.getPointBetweenWithZ(orientedPointsMat[2],orientedPointsMat[1],this.zTol));
                    }
                }
            }
        }
        if(triPoints.length!=0) {
            const projTriPoints=this.getProjectedPointsInFront(triPoints);
            fill(fillColor);
            noStroke();
            if(triPoints.length==3) {
                triangle(projTriPoints[0][0],projTriPoints[0][1],projTriPoints[1][0],projTriPoints[1][1],projTriPoints[2][0],projTriPoints[2][1]);
            } else if(triPoints.length==4) {
                quad(projTriPoints[0][0],projTriPoints[0][1],projTriPoints[1][0],projTriPoints[1][1],projTriPoints[2][0],projTriPoints[2][1],projTriPoints[3][0],projTriPoints[3][1]);
            }
        }
    }
    
    addManyTriangles(pointsMat,groups,fillColors) {
        let avgDists=[]; //furthest to closest
        let orientedPointsMats=[];
        for(var i=0;i<groups.length;i++) {
            const orientedPoints=this.getOrientedPoints([pointsMat[groups[i][0]],pointsMat[groups[i][1]],pointsMat[groups[i][2]]])
            orientedPointsMats.push(orientedPoints);
            avgDists.push(VF.getAvgNum([VF.mag(orientedPoints[0]),VF.mag(orientedPoints[1]),VF.mag(orientedPoints[2])]));
        }
        const drawOrder=VF.getSortedIndices(avgDists); //furthest to closest
        for(var i=0;i<groups.length;i++) {
            this.addTriangle(orientedPointsMats[drawOrder[i]],fillColors[drawOrder[i]]);
        }

    }

    setForwardVec() {
        this.forwardVec=VF.unit([this.viewOTens[2][0],this.viewOTens[2][1],0]);
    }

    moveForward(dist) {
        // positive dist forward, neg backward
        this.viewPoint=math.add(this.viewPoint,math.multiply(this.forwardVec,dist));
    }

    moveSide(dist) {
        // positive dist to right, neg to left
        this.viewPoint=math.add(this.viewPoint,math.multiply(this.viewOTens[0],dist));
    }

    moveVerticle(dist) {
        // positive dist up, neg down
        this.viewPoint=math.add(this.viewPoint,[0,0,dist]);
    }

    moveCheck() {
        if(keyIsDown(65)) { //a
            if(!keyIsDown(68)) { //d
                this.moveSide((-1)*this.moveDist);
            }
        } else if(keyIsDown(68)) {
            this.moveSide(this.moveDist);
        }
        if(keyIsDown(87)) { //w
            if(!keyIsDown(83)) { //s
                this.moveForward(this.moveDist);
            }
        } else if(keyIsDown(83)) {
            this.moveForward((-1)*this.moveDist);
        }
        if(keyIsDown(32)) { //spacebar
            if(!keyIsDown(SHIFT)) {
                this.moveVerticle(this.moveDist);
            }
        } else if(keyIsDown(SHIFT)) {
            this.moveVerticle((-1)*this.moveDist);
        }
    }

    rotateAlt(rad) {
        // positive rad turns up
        this.viewOTens=Rot.oTens(this.viewOTens,this.viewOTens[0],rad);
    }

    rotateAzim(rad) {
        this.viewOTens=Rot.oTens(this.viewOTens,[0,0,-1],rad);
        this.setForwardVec();
    }

    rotateCheck() {
        if(keyIsDown(73)) { //i -- up
            if(!keyIsDown(75)) { //k -- down
                this.rotateAlt(this.rotRad*this.fovTheta);
            }
        } else if(keyIsDown(75)) {
            this.rotateAlt((-1)*this.rotRad*this.fovTheta);
        }
        if(keyIsDown(74)) { //j -- left
            if(!keyIsDown(76)) { //l -- right
                this.rotateAzim((-1)*this.rotRad*this.fovTheta);
            }
        } else if(keyIsDown(76)) {
            this.rotateAzim(this.rotRad*this.fovTheta);
        }
    }

    rotateCheckMouse() {
        if(mouseIsPressed) {
            this.rotateAlt((pmouseY-mouseY)*this.mouseRotScale);
            this.rotateAzim((mouseX-pmouseX)*this.mouseRotScale);
        }
    }

    changeFOV(deltaTheta) {
        this.fovTheta+=deltaTheta;
        if(this.fovTheta>this.fovMax) {
            this.fovTheta=this.fovMax;
        } else if(this.fovTheta<this.fovMin) {
            this.fovTheta=this.fovMin;
        }
        this.setPlaneDist()
    }

    fovCheck() {
        if(keyIsDown(57)) { //9 - increase fov
            if(!keyIsDown(48)) { //0 - decrease fov
                this.changeFOV(this.deltaTheta);
            }
        } else if(keyIsDown(48)) {
            this.changeFOV((-1)*this.deltaTheta);
        }
    }
}