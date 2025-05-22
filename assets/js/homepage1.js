// script.js

document.addEventListener('DOMContentLoaded', () => {
    const passiveEvents = { passive: true };

    // Page loading animation
    const loader = document.getElementById('loader');
    const header = document.getElementById('header');

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden'); // Use class for visibility
            setTimeout(() => {
                loader.style.display = 'none'; // Fully remove after transition
                header.classList.add('visible'); // Show header with animation
            }, 800); // Matches loader's transition time
        }, 800); // Loader visible for 0.8 seconds
    }, passiveEvents);

    // Mobile menu functionality
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    const navItems = navLinks.querySelectorAll('a');

    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
        mobileMenuBtn.classList.toggle('active'); // For hamburger icon animation
        navLinks.classList.toggle('active');
        // Manage focus for accessibility (trap focus in future iterations)
        if (navLinks.classList.contains('active')) {
            navLinks.focus(); // Set focus to the menu itself or first item
        }
    });

    // Close mobile menu when a nav link is clicked or clicking outside
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        // Check if the click is outside the nav and not on the menu button
        if (!e.target.closest('nav') && navLinks.classList.contains('active')) {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });

    // Slider functionality
    let slideIndex = 1;
    let slideInterval;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const sliderContainer = document.getElementById('slider');

    function showSlide(n) {
        if (n > slides.length) slideIndex = 1;
        if (n < 1) slideIndex = slides.length;

        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.setAttribute('aria-hidden', 'true'); // Hide inactive slides from screen readers
            if (i === slideIndex - 1) {
                slide.setAttribute('tabindex', '0'); // Make active slide focusable
            } else {
                slide.setAttribute('tabindex', '-1'); // Make inactive slides unfocusable
            }
        });

        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
            // Update aria-label for dots
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        });

        slides[slideIndex - 1].classList.add('active');
        slides[slideIndex - 1].setAttribute('aria-hidden', 'false');
        dots[slideIndex - 1].classList.add('active');
        dots[slideIndex - 1].setAttribute('aria-selected', 'true');

        // Announce slide change to screen readers (polite live region)
        sliderContainer.setAttribute('aria-live', 'polite');
    }

    function currentSlide(n) {
        clearInterval(slideInterval);
        showSlide(slideIndex = n);
        startAutoSlider();
    }

    function startAutoSlider() {
        // Only start if user hasn't opted for reduced motion
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            slideInterval = setInterval(() => {
                slideIndex++;
                showSlide(slideIndex);
            }, 6000); // Increased to 6 seconds for better user comprehension and accessibility
        }
    }

    // Initialize slider
    showSlide(slideIndex);
    startAutoSlider();

    // Pause auto-slider when user interacts with or hovers over slider
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('mouseleave', startAutoSlider);
    sliderContainer.addEventListener('focusin', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('focusout', startAutoSlider);


    // Keyboard navigation for slider dots
    document.addEventListener('keydown', (e) => {
        if (e.target && e.target.classList.contains('slider-dot')) {
            const currentDotIndex = Array.from(dots).indexOf(e.target) + 1;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                currentSlide(currentDotIndex - 1);
                // Move focus to the new active dot
                dots[(slideIndex - 1 + slides.length) % slides.length].focus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                currentSlide(currentDotIndex + 1);
                // Move focus to the new active dot
                dots[slideIndex - 1].focus();
            } else if (e.key === 'Home') { // Go to first slide
                e.preventDefault();
                currentSlide(1);
                dots[0].focus();
            } else if (e.key === 'End') { // Go to last slide
                e.preventDefault();
                currentSlide(slides.length);
                dots[slides.length - 1].focus();
            }
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Start animation a bit earlier
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = [
        document.getElementById('slider-heading'),
        document.getElementById('features-heading'),
        ...document.querySelectorAll('.feature-card')
    ].filter(Boolean); // Filter out null elements

    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Determine offset for fixed header
                const headerHeight = document.getElementById('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight - 20; // Add small margin

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Set focus to the target element after scrolling for accessibility
                // Use a timeout to ensure focus is set after scroll completion
                setTimeout(() => {
                    targetElement.focus({ preventScroll: true });
                    // If the element is not typically focusable, add tabindex="-1" and then remove it.
                    if (!targetElement.hasAttribute('tabindex')) {
                        targetElement.setAttribute('tabindex', '-1');
                        targetElement.addEventListener('blur', () => {
                            targetElement.removeAttribute('tabindex');
                        }, { once: true });
                    }
                }, 500); // Adjust timeout as needed for scroll duration
            }
        });
    });

    // Header scroll effect with performance optimization
    let lastScrollTop = 0;
    let ticking = false;

    function updateHeaderVisibility() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const headerElement = document.getElementById('header');

        // Show header when scrolling up, hide when scrolling down past a certain point
        if (scrollTop > lastScrollTop && scrollTop > headerElement.offsetHeight) {
            headerElement.classList.remove('visible');
        } else {
            headerElement.classList.add('visible');
        }
        lastScrollTop = scrollTop;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderVisibility);
            ticking = true;
        }
    }, passiveEvents);

    // Initial check for header visibility on page load
    updateHeaderVisibility();


    // Update current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Service Worker registration for offline capabilities (if available)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // navigator.serviceWorker.register('/service-worker.js').then(registration => {
            //     console.log('ServiceWorker registration successful with scope: ', registration.scope);
            // }, err => {
            //     console.log('ServiceWorker registration failed: ', err);
            // });
            console.log('Service Worker support detected. (Registration commented out for this example)');
        });
    }
});