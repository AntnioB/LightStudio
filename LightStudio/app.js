import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten,perspective, radians } from "../../libs/MV.js";
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
    zBuffer:true,
    backFaceCulling:true,
};

let types={
    shape:"Torus",
};

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    mode=gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    gl.useProgram(program);

    let mProjection = perspective(camera.fovy,camera.aspect,camera.near,camera.far);

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    
    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options,"wireframe").onChange(function(v){
        if(v) mode=gl.LINES;
        else mode=gl.TRIANGLES;
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
    cameraGui.add(camera,"fovy").min(1).max(100).step(1).listen().onChange(function (v){
        mProjection= perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    });
    cameraGui.add(camera,"aspect").listen().domElement.style.pointerEvents="none";
    cameraGui.add(camera,"near").min(0.1).max(20).listen().onChange(function(v){
        camera.near=Math.min(camera.far-0.5,v);
        mProjection=perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    });
    cameraGui.add(camera,"far").min(0.1).max(40).listen().onChange(function(v){
        camera.far=Math.min(camera.far-0.5,v);
        mProjection=perspective(camera.fovy,camera.aspect,camera.near,camera.far);
    })

    const eyeGui=cameraGui.addFolder("eye");
    eyeGui.add(camera.eye,"x").min(-20).max(20).listen();
    eyeGui.add(camera.eye,"y").min(-2).max(10).listen();
    eyeGui.add(camera.eye,"z").min(-20).max(20).listen();

    const atGui=cameraGui.addFolder("at");
    atGui.add(camera.at,"x").min(0).max(20).listen();
    atGui.add(camera.at,"y").min(0).max(20).listen();
    atGui.add(camera.at,"z").min(0).max(20).listen();

    const upGui=cameraGui.addFolder("up");
    upGui.add(camera.up,"x").min(0).max(20).listen();
    upGui.add(camera.up,"y").min(1).max(20).listen();
    upGui.add(camera.up,"z").min(0).max(20).listen();

    //Lights
    const MAX_LIGHTS=8;
    let nLights=0; //number of lights used
    let lights=[];

    const lightsF = gui.addFolder("Lights");

    function addLight(){
        if(nLights<MAX_LIGHTS){
            lights[nLights]={
                x:0,
                y:0,
                z:0,
                Ia:[100,100,100],
                Id:[100,100,100],
                Is:[100,100,100],
                isDirectional:false,
                isActive:true
            };
            const number=nLights;
            const light=lightsF.addFolder("Light "+nLights);
            light.add(lights[nLights],"x").step(0.01);
            light.add(lights[nLights],"y").step(0.01);
            light.add(lights[nLights],"z").step(0.01);
            light.addColor(lights[nLights],"Ia");
            light.addColor(lights[nLights],"Id");
            light.addColor(lights[nLights],"Is");
            light.add(lights[nLights],"isDirectional");
            light.add(lights[nLights],"isActive");
            nLights++;
            const uNLightsLocation = gl.getUniformLocation(program,"uNLights");
            gl.uniform1i(uNLightsLocation,nLights);
            updateLight(number);
        }
    }

    function updateLight(i){
        let lightuLocation= gl.getUniformLocation(program,"uLights["+i+"].pos");
        gl.uniform3f(lightuLocation,lights[i].x,lights[i].y,lights[i].z);
        lightuLocation = gl.getUniformLocation(program,"uLights["+i+"].Ia");
        gl.uniform3fv(lightuLocation,lights[i].Ia);
        lightuLocation = gl.getUniformLocation(program,"uLights["+i+"].Id");
        gl.uniform3fv(lightuLocation,lights[i].Id);
        lightuLocation = gl.getUniformLocation(program,"uLights["+i+"].Is");
        gl.uniform3fv(lightuLocation,lights[i].Is);
        lightuLocation= gl.getUniformLocation(program,"uLights["+i+"].isDirectional");
        gl.uniform1i(lightuLocation,lights[i].isDirectional);
        lightuLocation= gl.getUniformLocation(program,"uLights["+i+"].isActive");
        gl.uniform1i(lightuLocation,lights[i].isActive);
    }

    //Artefact
    let artefactMaterial={
        Ka:[100,100,100],
        Kd:[100,100,100],
        Ks:[100,100,100],
        shininess:50.0
    };    

    const objectGui = new dat.GUI();
    const artefactGui= objectGui.addFolder("Object");
    artefactGui.add(types, "shape",["Cube", "Cylinder", "Pyramid", "Sphere", "Torus"]).onChange(function(v){
        switch(v){
            case "Cube":
                artefact=CUBE;
                break;
            case "Cylinder":
                artefact=CYLINDER;
                break;
            case "Pyramid":
                artefact=PYRAMID;
                break;
            case "Sphere":
                artefact=SPHERE;
                break;
            case "Torus":
                artefact=TORUS;
                break;
        }
    });

    const material= artefactGui.addFolder("Material");
    material.addColor(artefactMaterial,"Ka");
    material.addColor(artefactMaterial,"Kd");
    material.addColor(artefactMaterial,"Ks");
    material.add(artefactMaterial,"shininess").min(1).max(128).step(1);

    function updateMaterial(){
        let materialInfoL = gl.getUniformLocation(program,"uMaterial.Ka");
        gl.uniform3fv(materialInfoL,artefactMaterial.Ka);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.Kd");
        gl.uniform3fv(materialInfoL,artefactMaterial.Kd);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.Ks");
        gl.uniform3fv(materialInfoL,artefactMaterial.Ks);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.shininess");
        gl.uniform1f(materialInfoL,artefactMaterial.shininess);
    }

    //Floor
    let floorMaterial={
        Ka:[100,100,100],
        Kd:[100,100,100],
        Ks:[100,100,100],
        shininess:50.0
    };

    const floorMat=objectGui.addFolder("Floor Material");
    floorMat.addColor(floorMaterial,"Ka").listen();
    floorMat.addColor(floorMaterial,"Kd").listen();
    floorMat.addColor(floorMaterial,"Ks").listen();
    floorMat.add(floorMaterial,"shininess").min(1).max(128);

    function updateFloorMaterial(){
        let materialInfoL = gl.getUniformLocation(program,"uMaterial.Ka");
        gl.uniform3fv(materialInfoL,floorMaterial.Ka);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.Kd");
        gl.uniform3fv(materialInfoL,floorMaterial.Kd);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.Ks");
        gl.uniform3fv(materialInfoL,floorMaterial.Ks);
        materialInfoL = gl.getUniformLocation(program,"uMaterial.shininess");
        gl.uniform1f(materialInfoL,floorMaterial.shininess);
    }

    function syncFloor(){
        floorMaterial.Ka=artefactMaterial.Ka;
        floorMaterial.Kd=artefactMaterial.Kd;
        floorMaterial.Ks=artefactMaterial.Ks;
        floorMaterial.shininess=artefactMaterial.shininess;
    }
    let obj={
        addLight: function() {addLight();},
        syncFloor: function(){syncFloor();}
    };
    lightsF.add(obj,"addLight");
    floorMat.add(obj,"syncFloor");

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
    
    function rotateEye(val){
        let radius= Math.hypot(camera.eye.x, camera.eye.z);
        let t=Math.acos((camera.eye.x)/radius);
        if(camera.eye.z<0)
            t=-t;
        val=radians(val);
        camera.eye.x=radius*Math.cos(t+val);
        camera.eye.z=radius*Math.sin(t+val);
    }
    document.onkeydown = function(event) {
        switch (event.key){
            case 'ArrowUp':
                if(camera.eye.y<=10)
                    camera.eye.y=camera.eye.y+0.1;
                break;
            case 'ArrowDown':
                if(camera.eye.y>=-2)
                    camera.eye.y=camera.eye.y-0.1;
                break;
            case 'ArrowRight':
                rotateEye(1);
                break;
            case 'ArrowLeft':
                rotateEye(-1)
                break;
        }
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function floor()
    {
        updateFloorMaterial();
        pushMatrix();
        multTranslation([0,-0.55,0]);
        multScale([3, 0.1, 3]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }
    function object(){
        updateMaterial();
        //multTranslation([0,0.5,0]);
        uploadModelView();

        artefact.draw(gl,program,mode);
    }

    function light(i){
        updateLight(i);
        if(lights[i].isActive && !lights[i].isDirectional){
            pushMatrix();
            multTranslation([lights[i].x,lights[i].y,lights[i].z]);
            multScale([0.1,0.1,0.1]);
            uploadModelView();
            SPHERE.draw(gl,program,gl.LINES);
            popMatrix();
        }
    }

    function render()
    {
        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt([camera.eye.x,camera.eye.y,camera.eye.z], [camera.at.x,camera.at.y,camera.at.z], [camera.up.x,camera.up.y,camera.up.z]));
        uploadModelView();
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            object();
        popMatrix();
        for(let i =0;i<nLights;i++){
            pushMatrix();
            light(i);
            popMatrix();
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))