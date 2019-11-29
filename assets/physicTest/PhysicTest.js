const Circle = require('Circle');
const Polygon = require('Polygon');
const Collider = require('Collider');
const Contact = require('Contact');
const BVTree = require('BVTree');
const QuadTree = require('QuadTree');
const Component = require('Component');
const {MovingSystem} = require('MovingSystem');
const {Position,Velocity,Accelation} = require("BaseComponents");
const Dice = require('Dice');

let width = 800;
let height = 800;

class PhysicWorld extends Component{
    static defineName(){
        return 'PhysicWorld'
    }
    constructor(){
        super();
        this.quadTree = new QuadTree(0,0,width,height);
        this.bvTree = new BVTree();
        this.quad = false;
    }
    remove(collider,updating=false){
        if (this.quad) {
            this.quadTree.remove(collider,updating)
        }  else {
            this.bvTree.remove(collider,updating);
        }
    }
    insert(collider,updating=false){
        if (this.quad) {
            this.quadTree.insert(collider,updating)
        }  else {
            this.bvTree.insert(collider,updating);
        }
    }
    potentials(collider){
        if (this.quad) {
            return this.quadTree.potentials(collider)
        }  else {
            return this.bvTree.potentials(collider);
        }
    }
    draw(context){
        if (this.quad) {
            this.quadTree.draw(context);
        } else {
            this.bvTree.draw(context);
        }
    }
}

class Canvas extends Component{
    static defineName(){
        return 'Canvas';
    }
    constructor(){
        super();
        this.size = 7;
        this.contexts = [];
        this.nodes = [];
    }
    onAdd(){
        for (let i=0;i<this.size;i++) {
            let node = new cc.Node();
            let context = node.addComponent(cc.Graphics);
            cc.find('Canvas').addChild(node);
            this.nodes.push(node);
            this.contexts.push(context);

        }
    }
    onRemove(ent,ecs) {
        for (let i=0;i<this.nodes.length;i++) {
            this.nodes[i].removeFromParent(true);
        }
        this.nodes = [];
        this.contexts = [];
    }
    getContext(index){
        return this.contexts[index];
    }
    clear(){
        for (let i=0;i<this.contexts.length;i++) {
            this.contexts[i].clear();
        }
    }
}


module.exports = {
    name:'PhysicTest',
    onLoad:function (ecs) {
        ecs.registerComponent(Circle);
        ecs.registerComponent(Polygon);
        ecs.registerComponent(Collider);
        ecs.registerSingleton(Canvas);
        ecs.registerSingleton(PhysicWorld);
        ecs.registerComponent(Position);
        ecs.registerComponent(Velocity);
        ecs.registerComponent(Accelation);
        ecs.registerSystem(MovingSystem);
        ecs.registerSystem({
            name:'updating',
            components:[Collider,[Circle,Polygon]],
            update:function (ent,dt,now,ecs) {
                let cCollider = ent.get('Collider');
                cCollider.updateBorder();
                let world = ecs.getSingleton(PhysicWorld);
                world.remove(cCollider,true);
                world.insert(cCollider,true);
            }
        });

        ecs.registerSystem({
            name:'collision',
            enable:false,
            components:[Collider,[Circle,Polygon],Velocity],
            update:function (ent,dt,now,ecs) {
                let world = ecs.getSingleton(PhysicWorld);
                let colliderA = ent.get('Collider');
                let posA = ent.get('Polygon')||ent.get('Circle');
                let velA = ent.get('Velocity')||ent.get('Velocity');
                let result = new Contact();
                let potentials = world.potentials(ent);
                for(const colliderB of potentials) {
                    if(colliderA.collide(colliderB, result)) {

                        let posB = colliderB.getSibling('Polygon')||colliderB.getSibling('Circle');
                        let velB = colliderB.getSibling('Velocity')||colliderB.getSibling('Velocity');
                        posA.x -= result.overlap * result.overlap_x;
                        posA.y -= result.overlap * result.overlap_y;

                        let velAN = velA.normalize();
                        let speed = velA.speed;

                        let dot = velAN.x * result.overlap_y + velAN.y * -result.overlap_x;

                        velAN.x = 2 * dot * result.overlap_y - velAN.x;
                        velAN.y = 2 * dot * -result.overlap_x - velAN.y;
                        velAN.normalize(true);
                        velA.x = velAN.x*speed;
                        velA.y = velAN.y*speed;

                        if (velB) {
                            let velBN = velB.normalize();
                            speed = velB.speed;
                            dot = velBN.x * result.overlap_y + velBN.y * -result.overlap_x;
                            velBN.x = 2 * dot * result.overlap_y - velBN.x;
                            velBN.x = 2 * dot * -result.overlap_x - velBN.y;
                            velBN.normalize(true);
                            velB.x = velBN.x*speed;
                            velB.y = velBN.y*speed;
                        }
                    }
                }
            }
        });

        ecs.registerSystem({
            name:'shapeRenderer',
            components:[[Circle,Polygon]],
            beforeUpdate:function (dt,now,ecs) {
                if (this.getSize()<2500) {
                    ecs.spawnEntity('Circle',Dice.rng(-300,300),Dice.rng(-300,300),Dice.rng(3,8),1);
                    ecs.spawnEntity('Polygon',Dice.rng(-300,300),Dice.rng(-300,300),[[-4, -4], [4, -4], [4, 4], [-4, 4]],Dice.rng(0,3),1);
                }
                let cCanvas = ecs.getSingleton('Canvas');
                cCanvas.clear();
            },
            update:(ent,dt,now,ecs) => {
                let cPolygon = ent.get('Polygon');
                let cCircle = ent.get('Circle');
                let cCanvas = ecs.getSingleton('Canvas');
                let context = cCanvas.getContext(Dice.rngInt(0,6));
                cPolygon&&cPolygon.draw(context);
                cCircle&&cCircle.draw(context);
            },
            afterUpdate:function (dt,now,ecs) {
                let cCanvas = ecs.getSingleton('Canvas');
                for (let i=0;i<7;i++) {
                    cCanvas.getContext(i).strokeColor = cc.Color.BLUE;
                    cCanvas.getContext(i).stroke();
                }
            }
        });

        ecs.setSpawner('Polygon',function (ecs,x,y,points,rotation,scaleX,scaleY) {
            let ent = ecs.createEntity();
            ent.add(Polygon,x,y,points,rotation,scaleX,scaleY);
            ent.add(Collider);
            ecs.getSingleton(PhysicWorld).insert(ent);
            return ent;
        });
        ecs.setSpawner('Polygon1',function (ecs,x,y,points,rotation,scaleX,scaleY) {
            let ent = ecs.createEntity();
            ent.add(Polygon,x,y,points,rotation,scaleX,scaleY);
            ent.add(Collider);
            ecs.getSingleton(PhysicWorld).insert(ent);
            return ent;
        });

        ecs.setSpawner('Circle',function (ecs,x,y,radius,scale) {
            let ent = ecs.createEntity();
            ent.add(Circle,x,y,radius,scale);
            ent.add(Collider);
            let speed = ent.add(Velocity,1,1);
            speed.angle = Dice.rng(0,360);
            speed.speed = Dice.rng(34,60);
            ecs.getSingleton(PhysicWorld).insert(ent);
            return ent;
        });
        ecs.spawnEntity('Polygon1',-width/2, -height/2, [[0, 0], [width, 0]]);
        ecs.spawnEntity('Polygon1',-width/2, -height/2, [[width, 0], [width, height]]);
        ecs.spawnEntity('Polygon1',-width/2, -height/2, [[width, height], [0, height]]);
        ecs.spawnEntity('Polygon1',-width/2, -height/2, [[0, height], [0, 0]]);
        console.log(cc.macro.BATCH_VERTEX_COUNT);
    }
};