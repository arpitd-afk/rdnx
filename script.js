/**
 * RDNX Industries - Hero Section JavaScript
 * Handles mobile menu, scroll effects, and animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const header = document.querySelector('.header');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile Menu Toggle
    const toggleMobileMenu = () => {
        mobileMenuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    };

    mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // Close mobile menu on window resize (if desktop size)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && nav.classList.contains('active')) {
                toggleMobileMenu();
            }
        }, 250);
    });

    // Header scroll effect
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
        const scrollY = window.scrollY;
        
        // Add shadow on scroll
        if (scrollY > 10) {
            header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
        } else {
            header.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        }

        lastScrollY = scrollY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe elements that should animate on scroll
    document.querySelectorAll('.hero-badge, .hero-title, .hero-description, .hero-cta, .hero-stats, .about-content, .feature-card, .section-header, .product-main-card, .sidebar-card, .infra-card, .cert-card, .client-card, .solar-card, .gallery-item, .footer-cta, .hero-sub-content, .overview-content, .vision-mission-card, .feature-card-clean, .team-info-box, .expertise-list-card, .infra-detailed-card, .machinery-card, .stats-bar-item, .contact-form-card, .info-card-clean, .map-section, .specs-main-card, .capacity-card, .features-dark-text, .checklist-ul, .quality-text-side, .quality-ul, .cert-item-card, .testing-col').forEach(el => {
        observer.observe(el);
    });

    // Gallery Slider Functionality
    const galleryTrack = document.querySelector('.gallery-track');
    const prevBtn = document.querySelector('.gallery-ctrl.prev');
    const nextBtn = document.querySelector('.gallery-ctrl.next');

    if (galleryTrack && prevBtn && nextBtn) {
        const updateSliderButtons = () => {
            const scrollLeft = galleryTrack.scrollLeft;
            const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
            
            // Set prev button state
            if (scrollLeft <= 5) {
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.classList.remove('disabled');
            }
            
            // Set next button state
            if (scrollLeft >= maxScroll - 5) {
                nextBtn.classList.add('disabled');
            } else {
                nextBtn.classList.remove('disabled');
            }
        };

        nextBtn.addEventListener('click', () => {
            galleryTrack.scrollBy({ left: 340, behavior: 'smooth' });
            setTimeout(updateSliderButtons, 500); // Wait for smooth scroll
        });

        prevBtn.addEventListener('click', () => {
            galleryTrack.scrollBy({ left: -340, behavior: 'smooth' });
            setTimeout(updateSliderButtons, 500); // Wait for smooth scroll
        });

        galleryTrack.addEventListener('scroll', updateSliderButtons);
        
        // Initial check
        updateSliderButtons();
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Stats counter animation
    const animateCounter = (element, target, duration = 2000) => {
        let start = 0;
        const increment = target / (duration / 16);
        const suffix = element.textContent.replace(/[0-9]/g, '');
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + suffix;
            }
        };
        
        updateCounter();
    };

    // Trigger counter animation when stats section is visible
    const statsSection = document.querySelector('.hero-stats');
    let statsAnimated = false;

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                document.querySelectorAll('.stat-number').forEach(stat => {
                    const text = stat.textContent;
                    const number = parseInt(text.replace(/[^0-9]/g, ''));
                    const suffix = text.replace(/[0-9]/g, '');
                    stat.textContent = '0' + suffix;
                    
                    setTimeout(() => {
                        animateCounter(stat, number, 1500);
                    }, 200);
                });
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Add subtle parallax effect to hero background
    const heroBackground = document.querySelector('.hero-bg-image');
    
    if (heroBackground && window.matchMedia('(min-width: 769px)').matches) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const rate = scrolled * 0.3;
            heroBackground.style.transform = `translateY(${rate}px)`;
        });
    }

    // Keyboard accessibility for mobile menu
    mobileMenuToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMobileMenu();
        }
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            toggleMobileMenu();
        }
    });

    console.log('RDNX Industries - Hero Section Initialized');
});
