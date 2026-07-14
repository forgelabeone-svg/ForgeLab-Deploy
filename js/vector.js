// js/vector.js
// 2D vector math utilities for "Orbit Drift" physics/rendering.
// Every vector is a plain object of shape { x: number, y: number }.
// This module is dependency-free and frame-rate agnostic.

/**
 * Add two vectors: a + b
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {{x:number,y:number}}
 */
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract two vectors: a - b
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {{x:number,y:number}}
 */
export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scale a vector by a scalar: v * s
 * @param {{x:number,y:number}} v
 * @param {number} s
 * @returns {{x:number,y:number}}
 */
export function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

/**
 * Length (magnitude) of a vector.
 * @param {{x:number,y:number}} v
 * @returns {number}
 */
export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Squared length of a vector (cheaper than length(), useful for comparisons).
 * @param {{x:number,y:number}} v
 * @returns {number}
 */
export function lengthSq(v) {
  return v.x * v.x + v.y * v.y;
}

/**
 * Normalize a vector to unit length. Returns {x:0,y:0} for a zero vector
 * to avoid division-by-zero / NaN propagation.
 * @param {{x:number,y:number}} v
 * @returns {{x:number,y:number}}
 */
export function normalize(v) {
  const len = length(v);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
}

/**
 * Euclidean distance between two points/vectors.
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
export function distance(a, b) {
  return length(sub(a, b));
}

/**
 * Squared distance between two points/vectors (cheaper, avoids sqrt).
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
export function distanceSq(a, b) {
  return lengthSq(sub(a, b));
}

/**
 * Build a vector from an angle (radians) and magnitude.
 * Angle 0 points along +x, increasing angle rotates clockwise in
 * standard canvas coordinate space (y grows downward).
 * @param {number} angle - radians
 * @param {number} magnitude
 * @returns {{x:number,y:number}}
 */
export function fromAngle(angle, magnitude) {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  };
}

/**
 * Clamp a vector's length to a maximum, preserving its direction.
 * If the vector's length is already <= maxLength (or it's a zero vector),
 * it is returned unchanged (as a new object).
 * @param {{x:number,y:number}} v
 * @param {number} maxLength
 * @returns {{x:number,y:number}}
 */
export function lerp(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}