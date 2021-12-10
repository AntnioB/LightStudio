    import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten,perspective } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";
import * as dat from "../../libs/dat.gui.module.js";
import * as CUBE from '../../libs/cube.js';
import * as TORUS from '../../libs/torus.js';
import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as PYRAMID from '../../libs/pyramid.js';


/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
let artefact=TORUS;     //Type of object to be drawn

const VP_DISTANCE = 5;

let camera ={
    eye:{
        x:5,
        y:2,
        z:4,
    },
    at:{
        x:0,
        y:0,
        z:0,
    },
    up:{
        x:0,
        y:1,
        z:0,
    },
    fovy:45,
    aspect:1,
    near:0.1,
    far:20
};

let options={
    wireframe: false,
    normals: true,
    zBuffer:true,
    backFaceCulling:true
};

let types={
    cube: false,
    sphere: false,
    cylinder: false,
    pyramid: false,
    torus: true,
};

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    mode=gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    gl.useProgram(program);
<<<<<<< HEAD

=======
>>>>>>> a9942c5 (Multiple artefactcs working)

    let mProjection = perspective(camera.fovy,camera.aspect,camera.near,camera.far);

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    
    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options,"wireframe").onChange(function(v){
        if(v) mode=gl.LINES;
        else mode=gl.TRIANGLES;
    });
    
    const normalsLocation= gl.getUniformLocation(program,"normals");
    optionsGui.add(options, "normals").onChange(function(v){
        if(v) gl.uniform1f(normalsLocation,1.0);
        else gl.uniform1f(normalsLocation,0.0);
    });
    gl.uniform1f(normalsLocation,1.0);
    
    optionsGui.add(options,"zBuffer").onChange(function(v){
        if(v) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);
    })
    optionsGui.add(options,"backFaceCulling").onChange(function(v){
        if(v) gl.enable(gl.CULL_FACE);
        else gl.disable(gl.CULL_FACE);
    })

    

    const cameraGui= gui.addFolder("camera");
    cameraGui.add(camera,"fovy").min(1).max(100).step(1).listen().onChange(function (v){
        mProjection= perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    });
    cameraGui.add(camera,"aspect").min(0).max(10).step(1).listen().domElement.style.pointerEvents="none";
    cameraGui.add(camera,"near").min(0.1).max(20).listen().onChange(function(v){
        camera.near=Math.min(camera.far-0.5,v);
        mProjection=perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    });
    cameraGui.add(camera,"far").min(0.1).max(20).listen().onChange(function(v){
        camera.far=Math.min(camera.far-0.5,v);
        mProjection=perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    })

    const eyeGui=cameraGui.addFolder("eye");
    eyeGui.add(camera.eye,"x").min(0).max(20).listen();
    eyeGui.add(camera.eye,"y").min(0).max(20).listen();
    eyeGui.add(camera.eye,"z").min(0).max(20).listen();

    const atGui=cameraGui.addFolder("at");
    atGui.add(camera.at,"x").min(0).max(20).listen();
    atGui.add(camera.at,"y").min(0).max(20).listen();
    atGui.add(camera.at,"z").min(0).max(20).listen();

    const upGui=cameraGui.addFolder("up");
    upGui.add(camera.up,"x").min(0).max(20).listen();
    upGui.add(camera.up,"y").min(1).max(20).listen();
    upGui.add(camera.up,"z").min(0).max(20).listen();

    const artefactGui= gui.addFolder("Object");
    const artefactType = artefactGui.addFolder("Type");
    artefactType.add(types,"cube").listen().onChange(function(v){
        if(v){
            types.cylinder=false;
            types.pyramid=false;
            types.sphere=false;
            types.torus=false;
            artefact=CUBE;
        }
        else types.cube=true;
    });
    artefactType.add(types,"cylinder").listen().onChange(function(v){
        if(v){
            types.cube=false;
            types.pyramid=false;
            types.sphere=false;
            types.torus=false;
            artefact=CYLINDER;
        }
        else types.cylinder=true;
    });
    artefactType.add(types,"pyramid").listen().onChange(function(v){
        if(v){
            types.cylinder=false;
            types.cube=false;
            types.sphere=false;
            types.torus=false;
            artefact=PYRAMID;
        }
        else types.pyramid=true;
    });
    artefactType.add(types,"sphere").listen().onChange(function(v){
        if(v){
            types.cylinder=false;
            types.cube=false;
            types.pyramid=false;
            types.torus=false;
            artefact=SPHERE;
        }
        else types.sphere=true;
    });
    artefactType.add(types,"torus").listen().onChange(function(v){
        if(v){
            types.cylinder=false;
            types.cube=false;
            types.sphere=false;
            types.pyramid=false;
            artefact=TORUS;
        }
        else types.torus=true;
    });

    gl.clearColor(0.25, 0.25, 0.25, 1.0);
    CUBE.init(gl);
    TORUS.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    gl.enable(gl.CULL_FACE);    //Enables Back-face Culling
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function floor()
    {
        multScale([3, 0.1, 3]);
        multTranslation([0,-0.05,0]);
        uploadModelView();

        CUBE.draw(gl, program, mode);
    }
    function object(){
        multTranslation([0,0.8,0]);
        uploadModelView();

        artefact.draw(gl,program,mode);
    }

    function render()
    {
        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt([camera.eye.x,camera.eye.y,camera.eye.z], [camera.at.x,camera.at.y,camera.at.z], [camera.up.x,camera.up.y,camera.up.z]));
        
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            object();
        popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))