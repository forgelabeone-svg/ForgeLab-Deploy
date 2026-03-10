// ============================================
// NexaFlow Landing Page - Interactive Scripts
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initMobileMenu();
  initScrollAnimations();
  initSmoothScroll();
  initEmailValidation();
  initParticleSystem();
  initCounterAnimation();
});

// ============================================
// Mobile Hamburger Menu Toggle
// ============================================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  
  if (!hamburger || !mobileMenu) return;

  let isOpen = false;
  
  // Get all span elements safely
  const spans = hamburger.querySelectorAll('span');
  const hasValidSpans = spans.length >= 3;

  // Focusable elements in mobile menu for trap
  const getFocusableElements = () => {
    return mobileMenu.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
  };

  const openMenu = () => {
    isOpen = true;
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('menu-open');
    
    // Animate hamburger to X (with safe checking)
    if (hasValidSpans) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    }
    hamburger.setAttribute('aria-expanded', 'true');
    
    // Focus first focusable element in menu
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 100);
    }
  };

  const closeMenu = () => {
    isOpen = false;
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('menu-open');
    
    // Reset hamburger (with safe checking)
    if (hasValidSpans) {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.focus();
  };

  hamburger.addEventListener('click', () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking a link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) {
        closeMenu();
      }
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  // Focus trap for accessibility
  mobileMenu.addEventListener('keydown', (e) => {
    if (!isOpen || e.key !== 'Tab') return;
    
    if (focusable.length === 0) return;
    
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (isOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });
}

// ============================================
// Scroll-Triggered Fade-In Animations
// ============================================
function initScrollAnimations() {
  // Elements to animate
  const animatedElements = document.querySelectorAll(
    '.glass-card, .feature-card, .step-card, .pricing-card, .testimonial-card, .fade-in, .fade-in-up, .fade-in-left, .fade-in-right'
  );

  // Add initial hidden state
  animatedElements.forEach(el => {
    if (!el.classList.contains('animated')) {
      el.classList.add('animate-on-scroll');
    }
  });

  // Create observer
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        
        // Add staggered delay for grouped elements
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(child => 
            child.classList.contains('animate-on-scroll')
          );
          const index = siblings.indexOf(el);
          if (index > 0) {
            el.style.transitionDelay = `${index * 0.1}s`;
          }
        }
        
        el.classList.add('animated');
        observer.unobserve(el);
      }
    });
  }, observerOptions);

  // Observe all elements
  animatedElements.forEach(el => observer.observe(el));
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// Email Validation for CTA Form
// ============================================
function initEmailValidation() {
  const form = document.querySelector('#cta-form');
  const emailInput = document.querySelector('#email-input');
  const submitBtn = document.querySelector('#submit-btn');
  
  if (!form || !emailInput) return;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const showError = () => {
    emailInput.classList.add('border-red-500', 'focus:ring-red-500');
    emailInput.classList.remove('border-gray-600', 'focus:ring-blue-500');
  };

  const clearError = () => {
    emailInput.classList.remove('border-red-500', 'focus:ring-red-500');
    emailInput.classList.add('border-gray-600', 'focus:ring-blue-500');
  };

  emailInput.addEventListener('input', () => {
    if (emailInput.value && !validateEmail(emailInput.value)) {
      showError();
    } else {
      clearError();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
      showError();
      emailInput.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      showError();
      emailInput.focus();
      return;
    }
    
    clearError();
    
    // Simulate submission
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        submitBtn.textContent = 'Subscribed!';
        emailInput.value = '';
        
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 2000);
      }, 1000);
    }
  });
}

// ============================================
// Particle System for Background
// ============================================
function initParticleSystem() {
  const container = document.querySelector('.particles-container');
  if (!container) return;

  const particleCount = 50;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 3 + 1;
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.1;

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 100%);
      border-radius: 50%;
      left: ${startX}%;
      top: ${startY}%;
      opacity: ${opacity};
      pointer-events: none;
      animation: float ${duration}s ease-in-out ${delay}s infinite;
    `;

    container.appendChild(particle);
    particles.push(particle);
  }

  // Add float animation if not already in stylesheet
  if (!document.querySelector('#particle-animations')) {
    const style = document.createElement('style');
    style.id = 'particle-animations';
    style.textContent = `
      @keyframes float {
        0%, 100% {
          transform: translate(0, 0) scale(1);
          opacity: 0.3;
        }
        25% {
          transform: translate(20px, -30px) scale(1.2);
          opacity: 0.6;
        }
        50% {
          transform: translate(-10px, -50px) scale(0.8);
          opacity: 0.4;
        }
        75% {
          transform: translate(-30px, -20px) scale(1.1);
          opacity: 0.5;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Mouse interaction - particles follow cursor slightly
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  // Subtle parallax effect
  function animateParticles() {
    particles.forEach((particle, index) => {
      const speed = (index % 3 + 1) * 0.5;
      const offsetX = (mouseX - 0.5) * speed * 20;
      const offsetY = (mouseY - 0.5) * speed * 20;
      particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    requestAnimationFrame(animateParticles);
  }

  // Only run parallax on desktop
  if (window.innerWidth > 768) {
    animateParticles();
  }
}

// ============================================
// Counter Animation for Stats
// ============================================
function initCounterAnimation() {
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length === 0) return;

  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  const animateCounter = (element) => {
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    
    let startTime = null;
    let animationFrame = null;

    const updateCounter = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(easedProgress * target);
      
      element.textContent = prefix + currentValue.toLocaleString() + suffix;
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCounter);
      } else {
        element.textContent = prefix + target.toLocaleString() + suffix;
      }
    };

    animationFrame = requestAnimationFrame(updateCounter);
    
    // Return cleanup function
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  };

  // Use IntersectionObserver to trigger animation when visible

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

// ============================================
// Dynamic Styles Injection
// ============================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }

  .animate-on-scroll.animated {
    opacity: 1;
    transform: translateY(0);
  }

  .menu-open {
    animation: slideDown 0.3s ease-out forwards;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  nav {
    transition: transform 0.3s ease, background 0.3s ease;
  }
`;
document.head.appendChild(styleSheet);