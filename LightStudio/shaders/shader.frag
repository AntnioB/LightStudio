precision highp float;

varying vec3 fNormal;
varying vec3 vVertex;
varying mat4 mModelView1;

const int MAX_LIGHTS=8;

struct LightInfo{
    vec3 pos;
    vec3 Ia;
    vec3 Id;
    vec3 Is;
    bool isDirectional;
    bool isActive;
};

struct MaterialInfo{
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform int uNLights; //Effective number of lights used

uniform LightInfo uLights[MAX_LIGHTS]; //Array of lights present in the scene
uniform MaterialInfo uMaterial; //Material of the object being drawn

uniform bool isLightSource;

void main() {

    if(isLightSource){
        gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    }
    else{
    //Ambient
    vec3 ambientColor= vec3(0.0,0.0,0.0);
    int nLights=uNLights;
    for(int i=0;i<MAX_LIGHTS;i++){
        if(uLights[i].isActive)
            ambientColor=ambientColor + uLights[i].Ia/255.0;
    }
    ambientColor= ambientColor* uMaterial.Ka/255.0;

    //General calculations
    vec3 toLight;
    vec3 normalizeFNormal= normalize(fNormal);

    //Difuse
    float cosAngle;
    vec3 difuseColor = vec3(0.0,0.0,0.0);
    for(int i=0;i<MAX_LIGHTS;i++){
        if(!uLights[i].isActive) continue;
        if(!uLights[i].isDirectional){
            toLight =vec3(mModelView1* vec4(uLights[i].pos,0.0)) - vVertex;
        }else{
            toLight=vec3(mModelView1 * vec4(uLights[i].pos,0.0));
        }
        toLight = normalize(toLight);
        cosAngle = dot(normalizeFNormal,toLight);
        cosAngle= clamp(cosAngle,0.0,1.0);
        difuseColor = difuseColor + uMaterial.Kd/255.0*uLights[i].Id/255.0*cosAngle;
    }

    //Specular
    vec3 specularColor=vec3(0.0,0.0,0.0);
    for(int i = 0; i<MAX_LIGHTS;i++){
        if(!uLights[i].isActive) continue;
        if(uLights[i].isDirectional)
            toLight=vec3(mModelView1*vec4(uLights[i].pos,0.0));
        else toLight =vec3(mModelView1*vec4(uLights[i].pos,0.0)) - vVertex;
        toLight = normalize(toLight);
        vec3 reflection = 2.0 * dot(toLight,normalizeFNormal)*normalizeFNormal-toLight;
        reflection=normalize(reflection);

        vec3 toCamera= -1.0 * vVertex;
        toCamera= normalize(toCamera);

        cosAngle=dot(reflection,toCamera);
        cosAngle=clamp(cosAngle,0.0,1.0);
        cosAngle= pow(cosAngle,uMaterial.shininess);
        specularColor=specularColor + uLights[i].Is/255.0 * uMaterial.Ks/255.0*cosAngle;
    }

    vec3 color = ambientColor + difuseColor + specularColor;
    gl_FragColor=vec4(color,1.0);
    }
}