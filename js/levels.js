// js/levels.js
// Orbit Drift — hand-designed level data
// Each level: { id, name, bounds:{width,height}, start:{x,y}, goal:{x,y,radius},
//   planets:[{x,y,radius,mass,orbit?:{centerX,centerY,radius,speed,angle}}],
//   maxThrusts, thrustPower, parTime, parThrusts }
//
// Moving planets (Level 4 & 5) carry an `orbit` descriptor. The physics/game
// modules are responsible for updating planet.x/planet.y each frame from:
//   planet.x = orbit.centerX + Math.cos(orbit.angle) * orbit.radius
//   planet.y = orbit.centerY + Math.sin(orbit.angle) * orbit.radius
//   orbit.angle += orbit.speed * dt
// The initial x/y below match angle 0 for consistency at load time.

const levels = [
  {
    id: 1,
    name: 'Első Lépések',
    bounds: { width: 1000, height: 700 },
    start: { x: 90, y: 350 },
    goal: { x: 910, y: 350, radius: 34 },
    planets: [
      { x: 500, y: 350, radius: 46, mass: 5200 },
    ],
    maxThrusts: 8,
    thrustPower: 220,
    parTime: 10,
    parThrusts: 4,
  },
  {
    id: 2,
    name: 'Kettős Vonzás',
    bounds: { width: 1100, height: 750 },
    start: { x: 90, y: 640 },
    goal: { x: 1010, y: 120, radius: 32 },
    planets: [
      { x: 420, y: 470, radius: 40, mass: 4600 },
      { x: 760, y: 260, radius: 52, mass: 6400 },
    ],
    maxThrusts: 7,
    thrustPower: 220,
    parTime: 13,
    parThrusts: 5,
  },
  {
    id: 3,
    name: 'Szűk Folyosó',
    bounds: { width: 1200, height: 800 },
    start: { x: 80, y: 400 },
    goal: { x: 1120, y: 400, radius: 30 },
    planets: [
      { x: 350, y: 250, radius: 44, mass: 5000 },
      { x: 620, y: 550, radius: 44, mass: 5200 },
      { x: 900, y: 250, radius: 48, mass: 5600 },
    ],
    maxThrusts: 6,
    thrustPower: 230,
    parTime: 15,
    parThrusts: 4,
  },
  {
    id: 4,
    name: 'Forgó Veszély',
    bounds: { width: 1300, height: 850 },
    start: { x: 80, y: 760 },
    goal: { x: 1220, y: 100, radius: 30 },
    planets: [
      { x: 380, y: 560, radius: 42, mass: 4800 },
      { x: 760, y: 700, radius: 38, mass: 4200 },
      {
        x: 920,
        y: 380,
        radius: 34,
        mass: 3800,
        orbit: { centerX: 920, centerY: 380, radius: 130, speed: 0.6, angle: 0 },
      },
      { x: 620, y: 220, radius: 46, mass: 5400 },
    ],
    maxThrusts: 6,
    thrustPower: 230,
    parTime: 20,
    parThrusts: 5,
  },
  {
    id: 5,
    name: 'Végső Örvény',
    bounds: { width: 1400, height: 900 },
    start: { x: 80, y: 820 },
    goal: { x: 1320, y: 80, radius: 28 },
    planets: [
      { x: 340, y: 620, radius: 40, mass: 4600 },
      {
        x: 700,
        y: 700,
        radius: 34,
        mass: 3600,
        orbit: { centerX: 700, centerY: 620, radius: 110, speed: 0.75, angle: 0 },
      },
      { x: 980, y: 500, radius: 46, mass: 5600 },
      {
        x: 1080,
        y: 260,
        radius: 30,
        mass: 3200,
        orbit: { centerX: 1080, centerY: 260, radius: 150, speed: -0.5, angle: 1.57 },
      },
      { x: 560, y: 260, radius: 42, mass: 5000 },
    ],
    maxThrusts: 5,
    thrustPower: 240,
    parTime: 24,
    parThrusts: 5,
  },
];

export const TOTAL_LEVELS = levels.length;

export default levels;
// [FL:DONE]