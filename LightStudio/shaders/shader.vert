uniform mat4 mModelView;
uniform mat4 mProjection;
uniform float normals;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;
varying vec3 vVertex;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fNormal= vec3(mModelView*vec4(vNormal,0.0));
    vVertex= vec3(mModelView*vPosition);//vec3(gl_Position);
}