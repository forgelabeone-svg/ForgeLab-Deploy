/**
 * NexusAI Landing Page - Main JavaScript
 * Handles: Mobile menu, scroll animations, email validation, particle background
 */

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuIcon = mobileMenuBtn?.querySelector('svg');

function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.contains('hidden');
  
  if (isOpen) {
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('animate-fade-in');
    // Change icon to X
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    `;
  } else {
    mobileMenu.classList.add('hidden');
    // Change icon back to hamburger
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    `;
  }
}

mobileMenuBtn?.addEventListener('click', toggleMobileMenu);

// Close mobile menu when clicking a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    `;
  });
});

// ============================================
// SCROLL-TRIGGERED FADE-IN ANIMATIONS
// ============================================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-in-up');
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Apply to all elements with data-animate attribute
document.querySelectorAll('[data-animate]').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  fadeObserver.observe(el);
});

// Staggered animations for grid items
document.querySelectorAll('[data-animate-stagger]').forEach((container, containerIndex) => {
  const items = container.querySelectorAll('.stagger-item');
  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transitionDelay = `${index * 100}ms`;
    
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    staggerObserver.observe(item);
  });
});

// ============================================
// ANIMATED BADGE
// ============================================
const badge = document.querySelector('.badge-pulse');

function animateBadge() {
  if (!badge) return;
  
  badge.style.animation = 'pulse 2s infinite';
  
  // Add subtle floating effect
  badge.animate([
    { transform: 'translateY(0px)' },
    { transform: 'translateY(-5px)' },
    { transform: 'translateY(0px)' }
  ], {
    duration: 2000,
    iterations: Infinity,
    easing: 'ease-in-out'
  });
}

animateBadge();

// ============================================
// CTA EMAIL VALIDATION
// ============================================
const ctaForm = document.querySelector('.cta-form');
const emailInput = document.querySelector('.cta-email-input');
const submitBtn = document.querySelector('.cta-submit-btn');
const errorMsg = document.querySelector('.email-error');
const successMsg = document.querySelector('.email-success');

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showError(message) {
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    errorMsg.classList.add('animate-shake');
    setTimeout(() => errorMsg.classList.remove('animate-shake'), 500);
  }
  if (successMsg) {
    successMsg.classList.add('hidden');
  }
  emailInput?.classList.add('border-red-500');
  emailInput?.classList.remove('border-green-500');
}

function showSuccess() {
  if (successMsg) {
    successMsg.classList.remove('hidden');
  }
  if (errorMsg) {
    errorMsg.classList.add('hidden');
  }
  emailInput?.classList.remove('border-red-500');
  emailInput?.classList.add('border-green-500');
}

function resetValidation() {
  if (errorMsg) errorMsg.classList.add('hidden');
  if (successMsg) successMsg.classList.add('hidden');
  emailInput?.classList.remove('border-red-500', 'border-green-500');
}

// Real-time validation
emailInput?.addEventListener('input', () => {
  resetValidation();
  
  if (emailInput.value && !validateEmail(emailInput.value)) {
    // Show subtle warning but don't error until submit
    emailInput.classList.add('border-yellow-500');
  } else if (emailInput.value && validateEmail(emailInput.value)) {
    emailInput.classList.remove('border-yellow-500');
  }
});

ctaForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = emailInput?.value.trim();
  
  if (!email) {
    showError('Please enter your email address');
    return;
  }
  
  if (!validateEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Success state
  showSuccess();
  
  // Simulate form submission
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin h-5 w-5 inline-block mr-2" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
    Subscribing...
  `;
  
  // Simulate API call
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Join Waitlist';
    submitBtn.classList.add('bg-green-500');
    
    // Show success message
    const successBanner = document.createElement('div');
    successBanner.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50';
    successBanner.innerHTML = '✓ Successfully joined the waitlist!';
    document.body.appendChild(successBanner);
    
    setTimeout(() => {
      successBanner.classList.add('animate-fade-out');
      setTimeout(() => successBanner.remove(), 300);
    }, 3000);
    
    emailInput.value = '';
    resetValidation();
  }, 1500);
});

// ============================================
// ANIMATED PARTICLE BACKGROUND
// ============================================
const particleCanvas = document.getElementById('particle-canvas');
let ctx = null;
let particles = [];
let animationId = null;

if (particleCanvas) {
  ctx = particleCanvas.getContext('2d');
  
  function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  
  function createParticle() {
    return {
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1
    };
  }
  
  function initParticles() {
    particles = [];
    const particleCount = Math.floor((particleCanvas.width * particleCanvas.height) / 15000);
    for (let i = 0; i < Math.min(particleCount, 100); i++) {
      particles.push(createParticle());
    }
  }
  
  function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    particles.forEach((particle, i) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = particleCanvas.width;
      if (particle.x > particleCanvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = particleCanvas.height;
      if (particle.y > particleCanvas.height) particle.y = 0;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
      ctx.fill();
      
      // Draw connections
      particles.slice(i + 1).forEach(other => {
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 150)})`;
          ctx.stroke();
        }
      });
    });
    
    animationId = requestAnimationFrame(animateParticles);
  }
  
  // Initialize
  resizeCanvas();
  initParticles();
  animateParticles();
  
  // Handle resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });
  
  // Pause animation when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animateParticles();
    }
  });
}

// ============================================
// SMOOTH SCROLL ENHANCEMENT
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// HEADER SCROLL EFFECT
// ============================================
const header = document.querySelector('header');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  
  // Add background on scroll
  if (currentScrollY > 50) {
    header?.classList.add('bg-[#050810]/90', 'backdrop-blur-lg', 'shadow-lg');
  } else {
    header?.classList.remove('bg-[#050810]/90', 'backdrop-blur-lg', 'shadow-lg');
  }
  
  lastScrollY = currentScrollY;
});

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================
document.querySelectorAll('.btn-ripple').forEach(button => {
  button.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'absolute rounded-full bg-white/30 animate-ping';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.marginLeft = '-50px';
    ripple.style.marginTop = '-50px';
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOutQuart);
    
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Observe counters
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target, 10);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(counter => {
  counterObserver.observe(counter);
});

// ============================================
// TESTIMONIAL CARD TILT EFFECT
// ============================================
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
});

// ============================================
// TYPING EFFECT FOR HEADLINE
// ============================================
function typeWriter(element, text, speed = 50) {
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
// LAZY LOAD IMAGES
// ============================================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================
document.addEventListener('keydown', (e) => {
  // ESC to close mobile menu
  if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
    toggleMobileMenu();
  }
  
  // Tab focus trap for mobile menu
  if (e.key === 'Tab' && !mobileMenu.classList.contains('hidden')) {
    const focusableElements = mobileMenu.querySelectorAll('a, button');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
});

// ============================================
// PERFORMANCE: Debounce scroll events
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debounced scroll handler for heavy operations
const debouncedScrollHandler = debounce(() => {
  // Any additional scroll-based operations
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

// ============================================
// INITIALIZATION COMPLETE
// ============================================
console.log('NexusAI Landing Page initialized successfully!');