const VERTEXT_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // pass the texCoord to the fragment shader
    // The GPU will interpolate this value between points.
    v_texCoord = a_texCoord;
}`;
const FRAGMENT_SHADER = `
precision mediump float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord).rrba;
}`;
const canvas = document.createElement("canvas");
if (canvas == null) {
  throw new Error("Missing Canvas");
}
const gl = canvas.getContext("webgl2");
if (!gl) {
  throw new Error("Missing WebGL2 context");
}
export function glTransformImage(image) {
  canvas.width = image.width;
  canvas.height = image.height;
  const shaders = [
    loadShader(gl, VERTEXT_SHADER, gl.VERTEX_SHADER),
    loadShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER)
  ];
  const program = createProgram(gl, shaders);
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setRectangle(gl, 0, 0, image.width, image.height);
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1
  ]), gl.STATIC_DRAW);
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var size = 2;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  var size = 2;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
  return gl.canvas.toDataURL();
}
function setRectangle(gl2, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl2.STATIC_DRAW);
}
function loadShader(gl2, shaderSource, shaderType) {
  const shader = gl2.createShader(shaderType);
  gl2.shaderSource(shader, shaderSource);
  gl2.compileShader(shader);
  const compiled = gl2.getShaderParameter(shader, gl2.COMPILE_STATUS);
  if (!compiled) {
    console.error(gl2.getShaderInfoLog(shader));
    gl2.deleteShader(shader);
    return null;
  }
  return shader;
}
function createProgram(gl2, shaders) {
  const program = gl2.createProgram();
  shaders.forEach(function(shader) {
    gl2.attachShader(program, shader);
  });
  gl2.linkProgram(program);
  const linked = gl2.getProgramParameter(program, gl2.LINK_STATUS);
  if (!linked) {
    console.error(gl2.getProgramInfoLog(program));
    gl2.deleteProgram(program);
    return null;
  }
  return program;
}
