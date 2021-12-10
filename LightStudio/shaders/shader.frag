precision highp float;

varying vec3 fNormal;

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

void main() {
    vec3 c = fNormal + vec3(1.0, 1.0, 1.0);
    //gl_FragColor = vec4(0.5*c, 1.0);
    gl_FragColor= vec4(uMaterial.Ka / 255.0,1.0);
}