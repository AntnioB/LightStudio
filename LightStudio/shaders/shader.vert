uniform mat4 mModelView;
uniform mat4 mProjection;
uniform float normals;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;
varying vec3 vVertex;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fNormal= vNormal*normals;
    vVertex= vec3(gl_Position);
}