class PhysObj {
    static defaultOTens() {
        return [[1,0,0],[0,1,0],[0,0,1]];
    }

    setup(pointsMat,comP,comV,initW,colCheckDist,comNode=null,oTens=PhysObj.defaultOTens(),princMomTens=null) {
        this.pointsMat=pointsMat;
        this.checkDist=colCheckDist;
        this.oTens=oTens;
        if(comNode==null) {
            this.setDefaultComNode(comP,comV); // centers pointsMat
        } else {
            this.comNode=comNode;
        }
        this.stepObj=new StepObj(this.comNode,this.oTens,this.pointsMat);
        if(princMomTens==null) {
            this.princMomTens=PF.getMomentTensor2(this.pointsMat)
        } else {
            this.princMomTens=princMomTens;
        }
        this.angMom=math.multiply(this.princMomTens,initW);
    }

    step(dt,vlc,angMomFrac) {
        this.updateStepObj(dt);
        const colPoint=this.floorColCheck(this.stepObj);
        if(!colPoint[0]) {
            this.updateFrom(this.stepObj);
            this.angMom=math.multiply(this.angMom,angMomFrac);
        } else {
            this.floorCollide(colPoint[1],vlc,dt); //passes the point of collision
            this.angMom=math.multiply(this.angMom,angMomFrac);
        }
    }

    updateStepObj(dt) {
        this.stepObj.comNode.p=math.add(this.comNode.p,math.multiply(math.add(this.comNode.v,math.multiply(this.comNode.a,dt/2)),dt));
        this.stepObj.comNode.v=math.add(this.comNode.v,math.multiply(this.comNode.a,dt));
        const w=PF.getCorrW(this.oTens,this.princMomTens,this.angMom,dt);
        this.stepObj.oTens=Rot.oTens2(this.oTens,w,dt);
    }

    updateFrom(stepObj) {
        this.comNode=stepObj.comNode;
        this.oTens=stepObj.oTens;
    }

    getPointsBelow(stepObj) {
        const orientedPoints=stepObj.getOriented(stepObj.pointsMat)
        const returnedPoints=stepObj.getReturnedPointsMat2(orientedPoints);
        let pointsBelow=[];
        for(var i=0;i<returnedPoints.length;i++) {
            if(returnedPoints[i][2]<=0) {
                pointsBelow.push(orientedPoints[i]);
            }
        }
        if(pointsBelow.length==0) {
            return [false,null];
        } else {
            return [true,VF.getAvgPoint(pointsBelow)];
        }
    }

    floorColCheck(stepObj) {
        if(this.comNode.p[2]<this.checkDist) {
            return this.getPointsBelow(stepObj);
        } else {
            return [false,null];
        }
    }

    floorCollide(colPoint,vlc,dt) {
        const vFinal=VF.abs(vlc*this.comNode.v[2]);
        const deltaV=[0,0,vFinal-this.comNode.v[2]];
        this.comNode.v[2]=vFinal;
        this.angMom=math.add(this.angMom,math.multiply(math.cross(colPoint,deltaV),this.comNode.m))
        this.updateStepObj(dt)
        this.updateFrom(this.stepObj);
    }

    centerPointsMat() {
        const comP=this.comNode.p;
        const centeredPointsMat=this.pointsMat.map(function(point) {
            return math.subtract(point,comP);
        });
        return centeredPointsMat;
    }

    setDefaultComNode(comP,comV) {
        // assumes all points have mass of one
        this.comNode=new ComNode(VF.getAvgPoint(this.pointsMat),this.pointsMat.length,comV);
        this.centerPointsMat();
        this.comNode.p=comP;
    }

    getOriented(pointsMat) {
        return math.multiply(pointsMat,this.oTens);
    }

    getReturnedPointsMat() {
        return VF.addVecToRows(this.getOriented(this.pointsMat),this.comNode.p);
    }
}

class StepObj {
    constructor(comNode,oTens,pointsMat) {
        this.comNode=comNode;
        this.oTens=oTens;
        this.pointsMat=pointsMat;
    }

    getOriented(pointsMat) {
        return math.multiply(pointsMat,this.oTens);
    }

    getReturnedPointsMat() {
        return VF.addVecToRows(this.getOriented(this.pointsMat),this.comNode.p);
    }

    getReturnedPointsMat2(orientedPointsMat) {
        return VF.addVecToRows(orientedPointsMat,this.comNode.p);
    }
}

class ComNode {
    constructor(p,m,v) {
        this.p=p;
        this.m=m;
        this.v=v;
        this.a=[0,0,0];
    }
}