// ============================================
// ForgeLab Landing Page - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initMobileMenu();
  initScrollAnimations();
  initSmoothScroll();
  initInteractiveStates();
  initParticleBackground();
  initForms();
});

// ============================================
// Mobile Hamburger Menu Toggle
// ============================================
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  if (!menuBtn || !mobileMenu) {
    console.warn('Mobile menu elements not found');
    return;
  }

  let isOpen = false;

  function toggleMenu() {
    isOpen = !isOpen;
    
    if (isOpen) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.classList.add('flex');
      if (menuIcon) menuIcon.classList.add('hidden');
      if (closeIcon) closeIcon.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Animate menu items stagger
      mobileLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
        }, index * 50);
      });
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      if (menuIcon) menuIcon.classList.remove('hidden');
      if (closeIcon) closeIcon.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  menuBtn.addEventListener('click', toggleMenu);

  // Close menu when clicking a link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) toggleMenu();
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleMenu();
  });

  // Close menu on window resize (if switching to desktop)
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && isOpen) {
      toggleMenu();
    }
  });
}

// ============================================
// Scroll-Triggered Fade-In Animations
// ============================================
function initScrollAnimations() {
  // Elements to animate
  const animatedElements = document.querySelectorAll(
    '.glass-card, .feature-card, .pricing-card, .testimonial-card, ' +
    '.step-container, section > div > *:not(.no-animate), ' +
    'h2, h3, p, .btn-gradient, .animate-on-scroll'
  );

  // Add initial hidden state
  animatedElements.forEach(el => {
    if (!el.classList.contains('animate-in')) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all animated elements
  animatedElements.forEach(el => {
    if (!el.classList.contains('animate-in')) {
      observer.observe(el);
    }
  });
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Skip if it's just "#" or empty
      if (href === '#' || href === '') return;
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        const headerOffset = 80; // Account for fixed header
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL hash without jumping
        history.pushState(null, null, href);
      }
    });
  });
}

// ============================================
// Interactive States & Hover Effects
// ============================================
function initInteractiveStates() {
  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn-gradient, .btn-secondary');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add focus styles for accessibility
  const focusableElements = document.querySelectorAll('a, button, input, textarea, select');
  
  focusableElements.forEach(el => {
    el.addEventListener('focus', () => {
      el.classList.add('focus-visible');
    });
    
    el.addEventListener('blur', () => {
      el.classList.remove('focus-visible');
    });
  });

  // Typing effect for hero headline (optional enhancement)
  const heroHighlight = document.querySelector('.gradient-text');
  if (heroHighlight && heroHighlight.dataset.typed) {
    typeWriter(heroHighlight, heroHighlight.textContent);
  }

  // Add parallax effect to hero section
  const hero = document.querySelector('.hero-section');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.3;
      hero.style.transform = `translateY(${rate}px)`;
    });
  }
}

// ============================================
// Particle Background Animation
// ============================================
function initParticleBackground() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) {
    // Create canvas if it doesn't exist
    const particleContainer = document.querySelector('.particle-bg') || document.querySelector('header');
    if (!particleContainer) return;
    
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'particle-canvas';
    newCanvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;';
    particleContainer.style.position = 'relative';
    particleContainer.insertBefore(newCanvas, particleContainer.firstChild);
    
    initParticles(newCanvas);
    return;
  }
  
  initParticles(canvas);
}

function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let particles = [];
  const particleCount = 50;
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2
    };
  }

  function initParticleArray() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticle(particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function connectParticles() {
    const maxDistance = 150;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#3b82f6';
          ctx.globalAlpha = (1 - distance / maxDistance) * 0.2;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function updateParticle(particle) {
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // Wrap around edges
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      updateParticle(particle);
      drawParticle(particle);
    });
    
    connectParticles();
    requestAnimationFrame(animate);
  }

  // Initialize
  resizeCanvas();
  initParticleArray();
  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticleArray();
  });
}

// ============================================
// Form Handling
// ============================================
function initForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        submitBtn.style.opacity = '0.7';
      }
      
      try {
        // Simulate API call (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Success
        showNotification('Message sent successfully!', 'success');
        form.reset();
        
      } catch (error) {
        // Error
        showNotification('Something went wrong. Please try again.', 'error');
        console.error('Form submission error:', error);
        
      } finally {
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.style.opacity = '1';
        }
      }
    });
  });

  // Email validation for newsletter
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateEmail(input);
    });
    
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateEmail(input);
      }
    });
  });
}

// ============================================
// Helper Functions
// ============================================

function validateEmail(input) {
  const email = input.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    input.classList.add('error');
    input.style.borderColor = '#ef4444';
    return false;
  } else {
    input.classList.remove('error');
    input.style.borderColor = '';
    return true;
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    font-weight: 500;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 9999;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateY(0)';
  });
  
  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translateY(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// ============================================
// Add CSS Animation for Ripple Effect
// ============================================
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .error {
    border-color: #ef4444 !important;
  }
`;
document.head.appendChild(style);