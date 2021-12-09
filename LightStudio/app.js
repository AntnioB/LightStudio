    import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";
import * as dat from "../../libs/dat.gui.module.js";
import * as CUBE from '../../libs/cube.js';

/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

const VP_DISTANCE = 5;

let camera ={
    eye:{
        x:5,
        y:0,
        z:0,
    },
    at:{
        x:0,
        y:1,
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

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    mode=gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    
    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options,"wireframe").onChange(function(v){
        if(v) mode=gl.LINES;
        else mode=gl.TRIANGLES;
    });
    optionsGui.add(options, "normals").onChange(function(v){
        //TODO
    });
    optionsGui.add(options,"zBuffer").onChange(function(v){
        if(v) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);
    })
    optionsGui.add(options,"backFaceCulling").onChange(function(v){
        if(v) gl.enable(gl.CULL_FACE);
        else gl.disable(gl.CULL_FACE);
    })

    

    const cameraGui= gui.addFolder("camera");
    cameraGui.add(camera,"fovy").min(1).max(100).step(1).listen();
    cameraGui.add(camera,"aspect").min(0).max(10).step(1).listen().domElement.style.pointerEvents="none";
    cameraGui.add(camera,"near").min(0.1).max(20).listen().onChange(function(v){
        camera.near=Math.min(camera.far-0.5,v);
    });
    cameraGui.add(camera,"far").min(0.1).max(20).listen().onChange(function(v){
        camera.far=Math.min(camera.far-0.5,v);
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
    upGui.add(camera.up,"y").min(0).max(20).listen();
    upGui.add(camera.up,"z").min(0).max(20).listen();

    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    CUBE.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    gl.enable(gl.CULL_FACE);    //Enables Back-face Culling
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*camera.aspect,VP_DISTANCE*camera.aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function Sun()
    {
        // Don't forget to scale the sun, rotate it around the y axis at the correct speed
        multScale([3, 0.1, 3]);
        multTranslation([0,-0.05,0]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        CUBE.draw(gl, program, mode);
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
            Sun();
        popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))