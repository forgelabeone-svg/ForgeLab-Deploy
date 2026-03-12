/**
 * NexaCore Landing Page - Interactive JavaScript
 * Features: Hamburger menu, scroll animations, particles, smooth scroll
 */

(function() {
  'use strict';

  // ============================================
  // MOBILE NAVIGATION TOGGLE
  // ============================================
  const navToggle = document.querySelector('#nav-toggle');
  const navMenu = document.querySelector('#nav-menu');
  const header = document.querySelector('#header');
  const navLinks = document.querySelectorAll('.nav-link');

  // Toggle mobile menu
  function toggleMenu() {
    const isOpen = navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  // Close menu when clicking nav links
  function closeMenu() {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', toggleMenu);
    
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  // ============================================
  // HEADER SCROLL STATE
  // ============================================
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeaderOnScroll() {
    const scrollY = window.scrollY;
    
    // Add background on scroll
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Hide/show header on scroll direction
    if (scrollY > lastScrollY && scrollY > 100) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    
    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeaderOnScroll);
      ticking = true;
    }
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just "#"
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = header.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without jumping
        history.pushState(null, null, href);
      }
    });
  });

  // ============================================
  // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  // ============================================
  const fadeElements = document.querySelectorAll('.fade-in');
  
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing once animated
        fadeObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });
  
  fadeElements.forEach(element => {
    fadeObserver.observe(element);
  });

  // ============================================
  // PARTICLE BACKGROUND ANIMATION
  // ============================================
  const particlesContainer = document.querySelector('.bg-particles');
  const particleCount = 50;
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 20 + 10}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
      pointer-events: none;
    `;
    return particle;
  }
  
  if (particlesContainer) {
    for (let i = 0; i < particleCount; i++) {
      particlesContainer.appendChild(createParticle());
    }
  }

  // ============================================
  // TYPING ANIMATION FOR CODE BLOCK
  // ============================================
  const codeHighlight = document.querySelector('.code-highlight');
  
  if (codeHighlight) {
    const originalText = codeHighlight.textContent;
    codeHighlight.textContent = '';
    
    let charIndex = 0;
    const typingSpeed = 50;
    
    function typeCode() {
      if (charIndex < originalText.length) {
        codeHighlight.textContent += originalText.charAt(charIndex);
        charIndex++;
        setTimeout(typeCode, typingSpeed);
      }
    }
    
    // Start typing after a delay when hero section is visible
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(typeCode, 2000);
          heroObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    const heroSection = document.querySelector('#hero');
    if (heroSection) {
      heroObserver.observe(heroSection);
    }
  }

  // ============================================
  // COUNTER ANIMATION FOR STATS
  // ============================================
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const text = target.textContent;
        
        // Check if it's a number with suffix
        const match = text.match(/^(\d+\.?\d*)(.*)$/);
        
        if (match) {
          const finalNumber = parseFloat(match[1]);
          const suffix = match[2];
          const duration = 2000;
          const startTime = performance.now();
          
          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentNumber = finalNumber * easeOut;
            
            if (text.includes('.')) {
              target.textContent = currentNumber.toFixed(1) + suffix;
            } else {
              target.textContent = Math.floor(currentNumber) + suffix;
            }
            
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          }
          
          requestAnimationFrame(updateCounter);
        }
        
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(stat => {
    counterObserver.observe(stat);
  });

  // ============================================
  // REDUCED MOTION PREFERENCES
  // ============================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function handleReducedMotion() {
    if (prefersReducedMotion.matches) {
      // Disable animations
      document.documentElement.style.setProperty('--animation-duration', '0s');
      
      // Remove particle animations
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
      
      // Make all fade-in elements visible immediately
      fadeElements.forEach(el => {
        el.classList.add('visible');
      });
    }
  }
  
  handleReducedMotion();
  prefersReducedMotion.addEventListener('change', handleReducedMotion);

  // ============================================
  // INITIALIZE
  // ============================================
  console.log('🚀 NexaCore Landing Page initialized');
})();