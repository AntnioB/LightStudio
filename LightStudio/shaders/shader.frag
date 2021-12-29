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

    int nLights=uNLights;
    
    vec3 toLight;

    vec3 color=vec3(0.0,0.0,0.0);
    
    if(isLightSource)
        gl_FragColor=vec4(0.8,0.85,0.85,0.85);
    else{

        for(int i=0;i<MAX_LIGHTS;i++){
            if(uLights[i].isActive){
            
                float dl= sqrt( pow(uLights[i].pos.x,2.0) + pow(uLights[i].pos.y,2.0) +  pow(uLights[i].pos.z,2.0) );
            
                if(uLights[i].isDirectional)
                    toLight=normalize(vec3(mModelView1*vec4(uLights[i].pos,0.0)));
                else
                    toLight=normalize(vec3(mModelView1 * vec4(uLights[i].pos,0.0)) - vVertex);
                
                vec3 normalizeFNormal= normalize(fNormal);
                float cosAngle1 = dot(normalizeFNormal,toLight);
                cosAngle1=clamp(cosAngle1,0.0,1.0);
            
                vec3 reflection = reflect(toLight*(-1.0),normalizeFNormal);
        
                vec3 toCamera = normalize(-1.0 * vVertex);
                float cosAngle2=dot(reflection,toCamera);
                cosAngle2=cos(acos(cosAngle2)/2.0);
                cosAngle2=clamp(cosAngle2,0.0,1.0);
                cosAngle2= pow(cosAngle2,uMaterial.shininess);
        
                color = color + 
                    (((uLights[i].Ia/255.0) * (uMaterial.Ka/255.0)) +               //ambient
                    min(1.0, (1.0/(0.05*pow(dl, 2.0) + 0.001*dl+ 0.0005))) *        //fatt
                    (((uMaterial.Kd/255.0) * (uLights[i].Id/255.0) * cosAngle1) +   //difuse
                    ((uLights[i].Is/255.0) * (uMaterial.Ks/255.0) *cosAngle2)));    //specular 
            }
        }
    gl_FragColor=vec4(color,1.0);}
}