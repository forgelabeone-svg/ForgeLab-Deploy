// Starfield.js — parallax starfield background for "Orbit Drift"
// Vanilla JS, no dependencies. Generates 2-3 layers of stars with
// different sizes/speeds/opacity for a subtle parallax drift effect.

const LAYER_CONFIG = [
  { sizeMin: 0.4, sizeMax: 1.1, speedMin: 2, speedMax: 6, alphaMin: 0.25, alphaMax: 0.45, density: 0.00022, color: '150, 180, 220' },
  { sizeMin: 0.8, sizeMax: 1.8, speedMin: 6, speedMax: 14, alphaMin: 0.35, alphaMax: 0.65, density: 0.00014, color: '190, 220, 255' },
  { sizeMin: 1.2, sizeMax: 2.6, speedMin: 14, speedMax: 28, alphaMin: 0.5, alphaMax: 0.9, density: 0.00008, color: '220, 240, 255' }
];

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

class Starfield {
  constructor(width, height, layerCount = 3) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.layerCount = Math.min(Math.max(1, layerCount), LAYER_CONFIG.length);
    this.layers = [];
    this._generate();
  }

  _generate() {
    this.layers = [];
    for (let i = 0; i < this.layerCount; i++) {
      const cfg = LAYER_CONFIG[i % LAYER_CONFIG.length];
      const area = this.width * this.height;
      const starCount = Math.max(20, Math.round(area * cfg.density));
      const stars = [];
      for (let s = 0; s < starCount; s++) {
        stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: randRange(cfg.sizeMin, cfg.sizeMax),
          speed: randRange(cfg.speedMin, cfg.speedMax),
          baseAlpha: randRange(cfg.alphaMin, cfg.alphaMax),
          // slight per-star phase for subtle twinkle
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: randRange(0.4, 1.2)
        });
      }
      this.layers.push({
        color: cfg.color,
        stars,
        driftX: randRange(-0.15, 0.15),
        time: 0
      });
    }
  }

  // Resize the field, remapping existing stars proportionally so the
  // distribution stays roughly consistent rather than fully regenerating.
  resize(width, height) {
    const newWidth = Math.max(1, width);
    const newHeight = Math.max(1, height);
    if (newWidth === this.width && newHeight === this.height) return;

    const scaleX = newWidth / this.width;
    const scaleY = newHeight / this.height;

    this.layers.forEach((layer) => {
      layer.stars.forEach((star) => {
        star.x *= scaleX;
        star.y *= scaleY;
      });
    });

    this.width = newWidth;
    this.height = newHeight;
  }

  update(dt) {
    if (!dt || dt <= 0) return;
    this.layers.forEach((layer) => {
      layer.time += dt;
      layer.stars.forEach((star) => {
        // Downward drift (parallax scroll) plus a tiny horizontal sway
        star.y += star.speed * dt;
        star.x += layer.driftX * star.speed * dt * 0.2;

        // Wrap around vertical edges
        if (star.y > this.height + star.size) {
          star.y = -star.size;
          star.x = Math.random() * this.width;
        } else if (star.y < -star.size) {
          star.y = this.height + star.size;
          star.x = Math.random() * this.width;
        }

        // Wrap around horizontal edges
        if (star.x > this.width + star.size) {
          star.x = -star.size;
        } else if (star.x < -star.size) {
          star.x = this.width + star.size;
        }
      });
    });
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();

    this.layers.forEach((layer) => {
      layer.stars.forEach((star) => {
        const twinkle = 0.75 + 0.25 * Math.sin(layer.time * star.twinkleSpeed + star.twinklePhase);
        const alpha = Math.max(0, Math.min(1, star.baseAlpha * twinkle));

        ctx.beginPath();
        ctx.fillStyle = `rgba(${layer.color}, ${alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow for the larger/brighter stars
        if (star.size > 1.4) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${layer.color}, ${alpha * 0.15})`;
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    ctx.restore();
  }
}

export default Starfield;