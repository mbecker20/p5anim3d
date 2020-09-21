class Anim3d {
    constructor(viewer,dynObjs,statObjs,grav,vlc,angMomFrac) {
        this.viewer=viewer;
        this.objs=dynObjs.concat(statObjs);
        this.numDynObjs=dynObjs.length;
        this.setG(grav);
        this.vlc=vlc;
        this.angMomFrac=angMomFrac;
    }

    stepAnim(dt,stepsPerFrame) {
        this.updatePicture(); //draws over previous frame
        this.updateDynObjs(dt,stepsPerFrame);
        this.viewer.updateParams();
    }

    updatePicture() {
        background(0);
        this.drawObjs();
    }

    drawObjs() {
        let objDists=[];
        for(var i=0;i<this.numDynObjs;i++) {
            objDists.push(VF.mag(VF.R(this.objs[i].comNode.p,this.viewer.viewPoint)))
        }
        for(var i=this.numDynObjs;i<this.objs.length;i++) {
            objDists.push(VF.mag(VF.R(this.objs[i].center,this.viewer.viewPoint)))
        }
        let plotOrder=VF.getSortedIndices(objDists);
        for(var i=0;i<this.objs.length;i++) {
            this.objs[plotOrder[i]].draw(this.viewer);
        }
    }

    updateDynObjs(dt,stepsPerFrame) {
        for(var i=0;i<this.numDynObjs;i++) {
            for(var j=0;j<stepsPerFrame;j++) {
                this.objs[i].step(dt,this.vlc,this.angMomFrac);
            }
        }
    }

    setG(grav) {
        for(var i=0;i<this.numDynObjs;i++) {
            this.objs[i].comNode.a=[0,0,grav];
        }
    }
}