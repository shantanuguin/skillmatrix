
// ui-core.js - Handles strict design system requirements: Navigation, Cursor, Lenis, GSAP

/* global gsap, Lenis, SplitType, lucide */

export class NavigationSystem {
    constructor() {
        this.sidebar = document.getElementById('appSidebar');
        this.toggleBtn = document.getElementById('sidebarToggle');
        this.appContent = document.getElementById('appContent');
        this.overlay = document.getElementById('sidebarOverlay');

        this.init();
    }

    init() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }

        // Close on resize > md
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.closeSidebar();
            }
        });

        // Active link handling
        this.highlightActiveLink();
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('-translate-x-full');
        this.overlay.classList.toggle('hidden');
        this.overlay.classList.toggle('opacity-0');

        // Animate links staggering in
        if (!this.sidebar.classList.contains('-translate-x-full')) {
            gsap.fromTo('.nav-link',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }

    closeSidebar() {
        this.sidebar.classList.add('-translate-x-full');
        this.overlay.classList.add('hidden');
        this.overlay.classList.add('opacity-0');
    }

    highlightActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const links = document.querySelectorAll('.nav-link');

        links.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active', 'bg-indigo-50/50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
                // Icon color
                const icon = link.querySelector('i') || link.querySelector('svg');
                if (icon) icon.classList.add('text-indigo-600');
            } else {
                link.classList.remove('active', 'bg-indigo-50/50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
                link.classList.add('text-slate-500', 'hover:bg-slate-50', 'hover:text-slate-900');
            }
        });
    }
}

export class Cursor {
    constructor() {
        this.cursorDot = document.createElement('div');
        this.cursorOutline = document.createElement('div');

        this.cursorDot.className = 'fixed w-2 h-2 bg-indigo-600 rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block';
        this.cursorOutline.className = 'fixed w-8 h-8 border border-slate-400 rounded-full pointer-events-none z-[9999] opacity-50 transition-transform duration-300 hidden md:block';

        document.body.appendChild(this.cursorDot);
        document.body.appendChild(this.cursorOutline);

        this.init();
    }

    init() {
        // Move logic
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows instantly
            gsap.to(this.cursorDot, {
                x: posX - 1,
                y: posY - 1,
                duration: 0.1,
                ease: 'power2.out'
            });

            // Outline follows with lag
            gsap.to(this.cursorOutline, {
                x: posX - 16,
                y: posY - 16,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        // Hover effects
        const interactiveElements = document.querySelectorAll('a, button, input, select, .cursor-pointer');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.scaleUp());
            el.addEventListener('mouseleave', () => this.scaleDown());
        });
    }

    scaleUp() {
        gsap.to(this.cursorOutline, {
            scale: 1.5,
            borderColor: '#4f46e5', // indigo-600
            duration: 0.3
        });
        gsap.to(this.cursorDot, {
            scale: 0.5,
            duration: 0.3
        });
    }

    scaleDown() {
        gsap.to(this.cursorOutline, {
            scale: 1,
            borderColor: '#94a3b8', // slate-400
            duration: 0.3
        });
        gsap.to(this.cursorDot, {
            scale: 1,
            duration: 0.3
        });
    }
}

export function initLenis() {
    // Ultra-Snappy Mode: Disable Lenis entirely for native scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    console.log('Native Scroll Enabled for Max Performance');
    return null;
}

export function initAnimations() {
    // Check if gsap is available
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded, skipping animations');
        return;
    }

    // Register ScrollTrigger if available (for sticky headers etc if needed)
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Subtle entrance for shell
    gsap.from('#appShell', {
        y: 10,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    });

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
