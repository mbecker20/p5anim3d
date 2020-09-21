class Rect3D extends PhysObj {
    constructor(length,width,center,normal,fillColor,initW=[0,0,0],comV=[0,0,0]) {
        super();
        const colCheckDist=VF.mag([length/2,width/2])+.2
        this.setup(this.makePointsMat(length,width,normal),center,comV,initW,colCheckDist)
        this.vertIndOrder=[0,1,3,2];
        this.fillColor=fillColor;
        this.lineGroups=[[0,1],[1,3],[3,2],[2,0]];
        this.center=center;
    }

    getOTens(normal) {
        // normal must be normalized
        if(normal[2]==1) {
            return[[1,0,0],[0,1,0],[0,0,1]]
        } else {
            let xPrime=VF.unit(math.cross(normal,[0,0,1]));
            let yPrime=VF.unit(math.cross(normal,xPrime));
            return [xPrime,yPrime,normal];
        }
    }

    makePointsMat(length,width,normal) {
        const xVals=[-length/2,length/2];
        const yVals=[-width/2,width/2];
        let pointsMat=[];
        xVals.forEach(function(x) {
            yVals.forEach(function(y) {
                pointsMat.push([x,y,0]);
            });
        });
        const oTens=this.getOTens(normal);
        return math.multiply(pointsMat,oTens);
    }

    draw(viewer) {
        const returnedPointsMat=this.getReturnedPointsMat();
        viewer.addPoly(returnedPointsMat,this.vertIndOrder,this.fillColor);
        viewer.addLines(returnedPointsMat,this.lineGroups);
    }
}

class Isocahedron extends PhysObj {
    constructor(size,center,alpha=200,initW=[0,0,0],comV=[0,0,0],fillColor=null) {
        super();
        const colCheckDist=VF.mag([size,size*math.phi])+.2;
        this.setup(this.makePointsMat(size),center,comV,initW,colCheckDist);
        this.sideGroups=[[0,10,4],[0,4,5],[0,5,11],[2,6,10],[2,7,6],[2,11,7],[1,4,8],[1,5,4],[1,9,5],[3,8,6],[3,6,7],[3,7,9],[0,2,10],[0,11,2],[1,8,3],[1,3,9],[8,4,10],[8,10,6],[9,11,5],[9,7,11]];
        this.center=center;
        if(fillColor==null) {
            this.fillColors=MyColors.randColors(20,alpha,[50,150,250],50);
        } else {
            this.fillColors=this.makeFillColors(fillColor);
        }
    }

    getOTens(normal) {
        // normal must be normalized
        if(normal[2]==1) {
            return[[1,0,0],[0,1,0],[0,0,1]]
        } else {
            let xPrime=VF.unit(math.cross(normal,[0,0,1]));
            let yPrime=VF.unit(math.cross(normal,xPrime));
            return [xPrime,yPrime,normal];
        }
    }

    makeFillColors(fillColor) {
        let fillColors=[];
        for(var i=0;i<12;i++) {
            fillColors.push(fillColor);
        }
    }

    makeRect(length,width,normal) {
        const xVals=[-length/2,length/2];
        const yVals=[-width/2,width/2];
        let pointsMat=[];
        xVals.forEach(function(x) {
            yVals.forEach(function(y) {
                pointsMat.push([x,y,0]);
            });
        });
        const oTens=this.getOTens(normal);
        return math.multiply(pointsMat,oTens);
    }

    makePointsMat(size) {
        let isoc=this.makeRect(size,size*math.phi,[0,0,1]);
        isoc=isoc.concat(this.makeRect(size*math.phi,size,[0,1,0]));
        isoc=isoc.concat(this.makeRect(size,size*math.phi,[1,0,0]));
        return isoc;
    }

    draw(viewer) {
        const returnedPointsMat=this.getReturnedPointsMat()
        viewer.addManyTriangles(returnedPointsMat,this.sideGroups,this.fillColors);
    }
}

class BlockCorners {
    constructor(xLen,yLen,zLen,center) {
        this.pointsMat=this.makePointsMat(xLen,yLen,zLen,center);
        this.lineGroups=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
        this.center=center;
    }

    makePointsMat(xLen,yLen,zLen,center) {
        const xVals=[-xLen/2,xLen/2];
        const yVals=[-yLen/2,yLen/2];
        const zVals=[-zLen/2,zLen/2];
        let pointsMat=[];
        xVals.forEach(function(xVal) {
            yVals.forEach(function(yVal) {
                zVals.forEach(function(zVal) {
                    pointsMat.push([xVal,yVal,zVal]);
                });
            });
        });
        return VF.addVecToRows(pointsMat,center);
    }
    
    draw(viewer) {
        viewer.addLines(this.pointsMat,this.lineGroups);
    }
}

class Node {
    constructor(p,m) {
        this.p=p;
        this.m=m;
    }
}

class CornerNode {
    constructor(p,m,c) {
        this.p=p;
        this.m=m;
        this.color=c;
    }
}

class Block extends PhysObj {
    constructor(nodeMass,xnodes,ynodes,znodes,spacing,comP,comV,initW) {
        super();
        this.nm=nodeMass;
        this.xnodes=xnodes;
        this.ynodes=ynodes;
        this.znodes=znodes;
        this.spacing=spacing;
        this.makeBlock();
        let totalBlock=this.block.concat(this.corners);
        let comNode=PF.getComNode(totalBlock,comV,0);
        const princMomTens=PF.getMomentTensor(this.getCenteredNodes(comNode,totalBlock));
        let pointsMat=this.getPointsMat(this.getCenteredNodes(comNode,this.corners));
        comNode.p=comP
        let oTens=[[1,0,0],[0,1,0],[0,0,1]];
        let checkDist=VF.mag([(xnodes-1)*spacing/2,(ynodes-1)*spacing/2,(znodes-1)*spacing/2])+.1
        this.setup(pointsMat,comP,comV,initW,checkDist,comNode,oTens,princMomTens);
        this.lineGroups=[[1,3],[1,5],[1,0],[6,2],[6,4],[6,7],[0,2],[2,3],[3,7],[7,5],[5,4],[4,0]];
    }

    draw(viewer) {
        const returnedCornersMat=this.getReturnedPointsMat();
        viewer.addLines(returnedCornersMat,this.lineGroups);
    }

    getCenteredNodes(comNode,totalBlock) {
        const comP=comNode.p;
        const centeredNodes=totalBlock.map(function(n) {
            return new Node(math.subtract(n.p,comP),n.m);
        });
        return centeredNodes;
    }

    getPointsMat(centeredNodes) {
        const pointsMat=centeredNodes.map(function(n) {
            return n.p;
        });
        return pointsMat;
    }

    makeLine(corner) {
        let line=[];
        for(var i=0;i<this.xnodes;i++) {
            line.push(new Node(math.add(corner,[i*this.spacing,0,0]),this.nm));
        }
        return line;
    }

    makeCornerLine(corner) {
        let line=[];
        let corners=[new Node(corner,this.nm),new Node(math.add(corner,[(this.xnodes-1)*this.spacing,0,0]),this.nm)];
        for(var i=1;i<this.xnodes-1;i++) {
            line.push(new Node(math.add(corner,[i*this.spacing,0,0]),this.nm));
        }
        return [line,corners];
    }

    makeSheet(corner) {
        let sheet=[];
        for(var i=0;i<this.ynodes;i++) {
            sheet=sheet.concat(this.makeLine(math.add(corner,[0,i*this.spacing,0])));
        }
        return sheet;
    }

    makeCornerSheet(corner) {
        let corners=[];
        let sheet=[];
        const cornerLine0=this.makeCornerLine(corner);
        sheet=sheet.concat(cornerLine0[0]);
        corners=corners.concat(cornerLine0[1]);
        const cornerLine1=this.makeCornerLine(math.add(corner,[0,((this.ynodes-1)*this.spacing),0]));
        corners=corners.concat(cornerLine1[1]);
        for(var i=1;i<this.ynodes-1;i++) {
            sheet=sheet.concat(this.makeLine(math.add(corner,[0,i*this.spacing,0])));
        }
        sheet=sheet.concat(cornerLine1[0]);
        return [sheet,corners];
    }

    makeBlock() {
        let cornerSheet0=this.makeCornerSheet([0,0,0]);
        let block=cornerSheet0[0];
        let corners=cornerSheet0[1];
        for(var i=1;i<this.znodes-1;i++) {
            block=block.concat(this.makeSheet([0,0,i*this.spacing]));
        }
        let cornerSheet1=this.makeCornerSheet([0,0,(this.znodes-1)*this.spacing]);
        corners=corners.concat(cornerSheet1[1]);
        block=block.concat(cornerSheet1[0]);
        this.block=block;
        this.corners=corners;
    }
}

class FuncSheet {
    constructor(xrange,yrange,func,alpha=200) {
        // func takes x and y, returns z
        this.setColorRange(func,xrange,yrange);
        this.makeSheet(func,xrange,yrange,scale);
        this.makeTriGroups(xrange,alpha);
        this.center=[(xrange[0]+xrange[1])/2,(yrange[0]+yrange[1])/2,0]
    }

    draw(viewer) {
        viewer.addManyTriangles(this.pointsMat,this.triGroups,this.triColors);
    }

    makeSheet(func,xrange,yrange) {
        //first square has corner at xrange[0],yrange[0]
        this.pointsMat=[];
        let x;
        let y;
        for(var j=0;j<yrange[1]-yrange[0]+1;j++) {
            for(var i=0;i<xrange[1]-xrange[0]+1;i++) {
                x=xrange[0]+i
                y=yrange[0]+j
                this.pointsMat.push([x,y,func(x,y)]);
            }
        }
    }

    makeTriGroups(xrange,alpha) {
        this.triGroups=[];
        this.triColors=[];
        const xspread=xrange[1]-xrange[0];
        const maxInd=this.pointsMat.length-xspread-2;
        let endInd=xspread
        for(var i=0;i<maxInd;i++) {
            if(i!=endInd) {
                this.triGroups.push([i,i+1,i+xspread+1]);
                const triColor1=this.getColor(VF.getAvgNum([this.pointsMat[i][2],this.pointsMat[i+1][2],this.pointsMat[i+xspread+1][2]]),alpha);
                this.triColors.push(triColor1)
                this.triGroups.push([i+1,i+xspread+2,i+xspread+1]);
                const triColor2=this.getColor(VF.getAvgNum([this.pointsMat[i+1][2],this.pointsMat[i+xspread+2][2],this.pointsMat[i+xspread+1][2]]),alpha);
                this.triColors.push(triColor2);
            } else {
                endInd+=xspread+1;
            }
        }
    }

    setColorRange(func,xrange,yrange) {
        const numX=xrange[1]-xrange[0]+1;
        const numY=yrange[1]-yrange[0]+1;
        let x;
        let y;
        let z;
        let min=func(xrange[0],yrange[0]);
        let max=min;
        for(var i=0;i<numX;i++) {
            for(var j=0;j<numY;j++) {
                x=xrange[0]+i;
                y=yrange[0]+j;
                z=func(x,y);
                if(z<min) {
                    min=z;
                } else if(z>max) {
                    max=z;
                }
            }
        }
        this.minZ=min;
        this.maxZ=max;
        this.zSpread=max-min
    }

    getColor(z,alpha) {
        const red=((z-this.minZ)/this.zSpread)*255;
        const green=((this.maxZ-z)/this.zSpread)*255;
        return color(red,green,200,alpha);
    }
}