// https://github.com/greggman/twgl.js

import type { ProgramInfo, UniformTypeInfo, UniformSetter, UniformType, UniformInfo, AttributeInfo } from '../types.d.ts';

/** Better WebGL */
export class BWGL {

    static createProgramInfo(gl: WebGL2RenderingContext, vertSource: string, fragSource: string): ProgramInfo {
        
        const program = createProgram(gl, vertSource, fragSource);
        const uniformInfo = createUniformInfo(gl, program);
        const attributeInfo = {} as Record<string, AttributeInfo>;

        return {
            program,
            uniformInfo,
            attributeInfo
        } as ProgramInfo;

    }

    static setUniforms(programInfo: ProgramInfo, uniformObject: Record<string, number[]>) {

        for (const [k, v] of Object.entries(uniformObject)) {
            if (!(k in programInfo.uniformInfo)) {
                console.error("Invalid uniform: " + k);
                continue;
            }
            programInfo.uniformInfo[k].setter(v);
        }

    }

}


// Create and compile a new program
function createProgram(gl: WebGL2RenderingContext, vertSource: string, fragSource: string): WebGLProgram {
    
    const program = gl.createProgram();
    if (!program)
        throw new Error("Unable to create Program");
    
    createShader(gl, program, vertSource, VERTEX_SHADER);
    createShader(gl, program, fragSource, FRAGMENT_SHADER);

    // Linking
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, LINK_STATUS))
        console.error('Program linking failed:\n\n', gl.getProgramInfoLog(program));
    if (!gl.getProgramParameter(program, VALIDATE_STATUS))
        console.error('Program validation failed:\n\n', gl.getProgramInfoLog(program));

    // Settings
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CW);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.75, 0.85, 0.8, 1);

    gl.useProgram(program);
    return program;

}


/** Create a `type` shader from `source`, compile and attach to `program` */
function createShader(gl: WebGL2RenderingContext, program: WebGLProgram, source: string, type: GLenum): WebGLShader {
    
    const shader = gl.createShader(type);
    if (!shader)
        throw new Error("Unable to create Shader");
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    const didCompile = gl.getShaderParameter(shader, COMPILE_STATUS);
    if (!didCompile)
        throw new Error("Unable to compile Shader.\n\n" + gl.getShaderInfoLog(shader));
    
    gl.attachShader(program, shader);

    return shader;

}



function createUniformInfo(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, UniformInfo> {
    
    const uniforms: Record<string, UniformInfo> = {};
    const uCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    
    for (let i = 0; i < uCount; i++) {
        const info = gl.getActiveUniform(program, i);
        if (!info) continue;
        
        uniforms[info.name] = {
            location: gl.getUniformLocation(program, info.name)!,
            setter: typeMap[info.type].setter(gl, info.type)
        };
    }
    
    return uniforms;

}


// const TEXTURE0        = 0x84c0;
const COMPILE_STATUS  = 0x8b81;
const LINK_STATUS     = 0x8b82;
const VALIDATE_STATUS = 0x8B83;
const FRAGMENT_SHADER = 0x8b30;
const VERTEX_SHADER   = 0x8b31;

const FLOAT = 0x1406, FLOAT_VEC2 = 0x8B50, FLOAT_VEC3 = 0x8B51, FLOAT_VEC4 = 0x8B52;
const INT   = 0x1404, INT_VEC2   = 0x8B53, INT_VEC3   = 0x8B54, INT_VEC4   = 0x8B55;
const BOOL  = 0x8B56, BOOL_VEC2  = 0x8B57, BOOL_VEC3  = 0x8B58, BOOL_VEC4  = 0x8B59;

const FLOAT_MAT2 = 0x8B5A, FLOAT_MAT2x3 = 0x8B65, FLOAT_MAT2x4 = 0x8B66;
const FLOAT_MAT3 = 0x8B5B, FLOAT_MAT3x2 = 0x8B67, FLOAT_MAT3x4 = 0x8B68;
const FLOAT_MAT4 = 0x8B5C, FLOAT_MAT4x2 = 0x8B69, FLOAT_MAT4x3 = 0x8B6A;

const UNSIGNED_INT      = 0x1405, UNSIGNED_INT_VEC2 = 0x8DC6;
const UNSIGNED_INT_VEC3 = 0x8DC7, UNSIGNED_INT_VEC4 = 0x8DC8;

// const SAMPLER_2D = 0x8B5E, SAMPLER_CUBE = 0x8B60, SAMPLER_3D = 0x8B5F;
// const SAMPLER_2D_SHADOW       = 0x8B62, SAMPLER_2D_ARRAY    = 0x8DC1;
// const SAMPLER_2D_ARRAY_SHADOW = 0x8DC4, SAMPLER_CUBE_SHADOW = 0x8DC5;
// const INT_SAMPLER_2D   = 0x8DCA, INT_SAMPLER_3D       = 0x8DCB;
// const INT_SAMPLER_CUBE = 0x8DCC, INT_SAMPLER_2D_ARRAY = 0x8DCF;
// const UNSIGNED_INT_SAMPLER_2D   = 0x8DD2, UNSIGNED_INT_SAMPLER_3D       = 0x8DD3;
// const UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4, UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

// const TEXTURE_2D = 0x0DE1, TEXTURE_CUBE_MAP = 0x8513;
// const TEXTURE_3D = 0x806F, TEXTURE_2D_ARRAY = 0x8C1A;

const typeMap: Record<UniformType, UniformTypeInfo> = {};
typeMap[FLOAT]                         = { type: Float32Array, size:  4, setter: floatArraySetter, cols: 1, };
typeMap[FLOAT_VEC2]                    = { type: Float32Array, size:  8, setter: floatVec2Setter,  cols: 2, };
typeMap[FLOAT_VEC3]                    = { type: Float32Array, size: 12, setter: floatVec3Setter,  cols: 3, };
typeMap[FLOAT_VEC4]                    = { type: Float32Array, size: 16, setter: floatVec4Setter,  cols: 4, };
typeMap[INT]                           = { type: Int32Array,   size:  4, setter: intArraySetter,   cols: 1, };
typeMap[INT_VEC2]                      = { type: Int32Array,   size:  8, setter: intVec2Setter,    cols: 2, };
typeMap[INT_VEC3]                      = { type: Int32Array,   size: 12, setter: intVec3Setter,    cols: 3, };
typeMap[INT_VEC4]                      = { type: Int32Array,   size: 16, setter: intVec4Setter,    cols: 4, };
typeMap[UNSIGNED_INT]                  = { type: Uint32Array,  size:  4, setter: uintArraySetter,  cols: 1, };
typeMap[UNSIGNED_INT_VEC2]             = { type: Uint32Array,  size:  8, setter: uintVec2Setter,   cols: 2, };
typeMap[UNSIGNED_INT_VEC3]             = { type: Uint32Array,  size: 12, setter: uintVec3Setter,   cols: 3, };
typeMap[UNSIGNED_INT_VEC4]             = { type: Uint32Array,  size: 16, setter: uintVec4Setter,   cols: 4, };
typeMap[BOOL]                          = { type: Uint32Array,  size:  4, setter: intArraySetter,   cols: 1, };
typeMap[BOOL_VEC2]                     = { type: Uint32Array,  size:  8, setter: intVec2Setter,    cols: 2, };
typeMap[BOOL_VEC3]                     = { type: Uint32Array,  size: 12, setter: intVec3Setter,    cols: 3, };
typeMap[BOOL_VEC4]                     = { type: Uint32Array,  size: 16, setter: intVec4Setter,    cols: 4, };
typeMap[FLOAT_MAT2]                    = { type: Float32Array, size: 32, setter: floatMat2Setter,  rows: 2, cols: 2, };
typeMap[FLOAT_MAT3]                    = { type: Float32Array, size: 48, setter: floatMat3Setter,  rows: 3, cols: 3, };
typeMap[FLOAT_MAT4]                    = { type: Float32Array, size: 64, setter: floatMat4Setter,  rows: 4, cols: 4, };
typeMap[FLOAT_MAT2x3]                  = { type: Float32Array, size: 32, setter: floatMat23Setter, rows: 2, cols: 3, };
typeMap[FLOAT_MAT2x4]                  = { type: Float32Array, size: 32, setter: floatMat24Setter, rows: 2, cols: 4, };
typeMap[FLOAT_MAT3x2]                  = { type: Float32Array, size: 48, setter: floatMat32Setter, rows: 3, cols: 2, };
typeMap[FLOAT_MAT3x4]                  = { type: Float32Array, size: 48, setter: floatMat34Setter, rows: 3, cols: 4, };
typeMap[FLOAT_MAT4x2]                  = { type: Float32Array, size: 64, setter: floatMat42Setter, rows: 4, cols: 2, };
typeMap[FLOAT_MAT4x3]                  = { type: Float32Array, size: 64, setter: floatMat43Setter, rows: 4, cols: 3, };
// typeMap[SAMPLER_2D]                    = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
// typeMap[SAMPLER_CUBE]                  = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
// typeMap[SAMPLER_3D]                    = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
// typeMap[SAMPLER_2D_SHADOW]             = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
// typeMap[SAMPLER_2D_ARRAY]              = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
// typeMap[SAMPLER_2D_ARRAY_SHADOW]       = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
// typeMap[SAMPLER_CUBE_SHADOW]           = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
// typeMap[INT_SAMPLER_2D]                = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
// typeMap[INT_SAMPLER_3D]                = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
// typeMap[INT_SAMPLER_CUBE]              = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
// typeMap[INT_SAMPLER_2D_ARRAY]          = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
// typeMap[UNSIGNED_INT_SAMPLER_2D]       = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
// typeMap[UNSIGNED_INT_SAMPLER_3D]       = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
// typeMap[UNSIGNED_INT_SAMPLER_CUBE]     = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
// typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { type: null,         size:  0, setter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };


function floatArraySetter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform1fv(location, v); };
}

function floatVec2Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform2fv(location, v); };
}

function floatVec3Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform3fv(location, v); };
}

function floatVec4Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform4fv(location, v); };
}

function intArraySetter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform1iv(location, v); };
}

function intVec2Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform2iv(location, v); };
}

function intVec3Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform3iv(location, v); };
}

function intVec4Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform4iv(location, v); };
}

function uintArraySetter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform1uiv(location, v); };
}

function uintVec2Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform2uiv(location, v); };
}

function uintVec3Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform3uiv(location, v); };
}

function uintVec4Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniform4uiv(location, v); };
}

function floatMat2Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter {
    return function(v: number[]) { gl.uniformMatrix2fv(location, false, v); };
}

function floatMat3Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix3fv(location, false, v); };
}

function floatMat4Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix4fv(location, false, v); };
}

function floatMat23Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix2x3fv(location, false, v); };
}

function floatMat32Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix3x2fv(location, false, v); };
}

function floatMat24Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix2x4fv(location, false, v); };
}

function floatMat42Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix4x2fv(location, false, v); };
}

function floatMat34Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix3x4fv(location, false, v); };
}

function floatMat43Setter(gl: WebGL2RenderingContext, location: WebGLUniformLocation): UniformSetter  {
    return function(v: number[]) { gl.uniformMatrix4x3fv(location, false, v); };
}


// function samplerArraySetter(gl: WebGL2RenderingContext, type: UniformType, unit: number, location: WebGLUniformLocation, size: number) {
//     const bindPoint = typeMap[type].bindPoint!;
//     const units = new Int32Array(size);
//     for (let ii = 0; ii < size; ++ii) {
//         units[ii] = unit + ii;
//     }

//     return function(textures: []) {
//         gl.uniform1iv(location, units);
//         textures.forEach(function(textureOrPair, index) {
//             gl.activeTexture(TEXTURE0 + units[index]);
//             let texture;
//             let sampler;
//             if (!textureOrPair || helper.isTexture(gl, textureOrPair)) {
//                 texture = textureOrPair;
//                 sampler = null;
//             } else {
//                 texture = textureOrPair.texture;
//                 sampler = textureOrPair.sampler;
//             }
//             gl.bindSampler(unit, sampler);
//             gl.bindTexture(bindPoint, texture);
//         });
//     }
// }