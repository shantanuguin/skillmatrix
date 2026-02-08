
// ui-core.js - Handles strict design system requirements: Navigation, Cursor, Lenis, GSAP

/* global gsap, Lenis, SplitType, lucide */

export class NavigationSystem {
    constructor() {
        this.sidebar = document.getElementById('appSidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.toggleButton = document.getElementById('sidebarToggle');
        this.isOpen = false;

        this.init();
    }

    init() {
        if (!this.sidebar || !this.overlay || !this.toggleButton) return;

        // Set initial state
        this.updateState();

        // Event listeners with cleanup logic (though unnecessary on page load)
        this.toggleButton.onclick = (e) => {
            e.stopPropagation();
            this.toggle();
        }; // Use onclick to override any previous listeners if possible, or just addEventListener
        // Better stick to addEventListener but assume unique instantiation

        // Actually, let's use addEventListener but careful about double binding.
        // Since we are replacing the class, as long as it's instantiated once, we are good.
        // We removed onclick from HTML, so no double binding there.

        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.overlay.addEventListener('click', () => this.close());

        // Close on navigation link click for mobile
        if (window.innerWidth < 1024) {
            document.querySelectorAll('#appSidebar a').forEach(link => {
                link.addEventListener('click', () => this.close());
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && this.isOpen) this.close();
        });

        this.highlightActiveLink();
    }

    open() {
        this.sidebar.classList.remove('-translate-x-full');
        this.overlay.classList.remove('hidden');

        // Force reflow
        void this.overlay.offsetWidth;

        this.overlay.classList.remove('opacity-0');
        document.body.classList.add('sidebar-open');
        this.isOpen = true;

        // Animate links staggering in
        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.nav-link',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }

    close() {
        this.overlay.classList.add('opacity-0');
        this.sidebar.classList.add('-translate-x-full');

        // Wait for opacity transition before hiding
        setTimeout(() => {
            if (!this.isOpen) {
                this.overlay.classList.add('hidden');
                document.body.classList.remove('sidebar-open');
            }
        }, 300);

        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    updateState() {
        this.isOpen = !this.sidebar.classList.contains('-translate-x-full');
    }

    highlightActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const links = document.querySelectorAll('.nav-link');

        links.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active', 'bg-indigo-50/50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
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
