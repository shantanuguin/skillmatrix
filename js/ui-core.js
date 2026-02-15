
// ui-core.js — Retractable Sidebar Navigation System
// Decoupled App Shell: self-contained class, paste into any page

export class NavigationSystem {
    constructor() {
        // DOM Cache — query once, never again
        this.sidebar = document.getElementById('appSidebar');
        this.toggleBtn = document.getElementById('sidebarToggle');
        this.backdrop = document.getElementById('navBackdrop');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.isOpen = false;

        this.init();
    }

    init() {
        // 1. Resolve active page
        this.resolveActiveState();

        // 2. Toggle button (hamburger)
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // 3. Click-away close (backdrop)
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.closeSidebar());
        }

        // 4. Close on nav link click (mobile UX)
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay so the user sees the active state before it closes
                setTimeout(() => this.closeSidebar(), 120);
            });
        });

        // 5. Escape key close (Accessibility)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });

        // 6. Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && this.isOpen) {
                this.closeSidebar();
            }
        });

        // 7. Safe areas for notched devices
        this.initSafeAreas();

        // 8. Touch scrolling fix for iOS
        this.setupScrollableNav();
    }

    // --- Active Link Detection ---
    resolveActiveState() {
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop() || 'index.html';

        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === filename) {
                // Active state
                link.classList.add('active');
                const icon = link.querySelector('i, svg');
                if (icon) icon.classList.add('text-indigo-600');
            } else {
                // Inactive state
                link.classList.remove('active');
            }
        });
    }

    // --- Sidebar Control ---
    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.isOpen = true;
        this.sidebar.classList.add('open');
        this.backdrop.classList.add('open');
        this.toggleBtn.classList.add('open');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }

    closeSidebar() {
        this.isOpen = false;
        this.sidebar.classList.remove('open');
        this.backdrop.classList.remove('open');
        this.toggleBtn.classList.remove('open');
        document.body.style.overflow = ''; // Unlock body scroll
    }

    // --- Safe Area Injection (Notched Phones) ---
    initSafeAreas() {
        const style = document.createElement('style');
        style.textContent = `
            @supports (padding-top: env(safe-area-inset-top)) {
                #appSidebar {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
                #appHeader {
                    padding-left: max(2.5rem, env(safe-area-inset-left));
                    padding-right: max(2.5rem, env(safe-area-inset-right));
                }
            }
        `;
        document.head.appendChild(style);
    }

    // --- Touch Scrolling Fix (iOS) ---
    setupScrollableNav() {
        const navContainer = this.sidebar?.querySelector('nav');
        if (navContainer) {
            navContainer.style.webkitOverflowScrolling = 'touch';
            navContainer.style.overflowY = 'auto';
        }
    }
}

// --- Custom Cursor (Desktop Only) ---
export class Cursor {
    constructor() {
        // Skip on touch devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

        this.cursorDot = document.createElement('div');
        this.cursorOutline = document.createElement('div');

        this.cursorDot.className = 'cursor-dot';
        this.cursorOutline.className = 'cursor-outline';

        document.body.appendChild(this.cursorDot);
        document.body.appendChild(this.cursorOutline);

        this.init();
    }

    init() {
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        // Dot follows instantly via transform
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            this.cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
        });

        // Outline follows with smooth lag via requestAnimationFrame
        const animate = () => {
            outlineX += (mouseX - outlineX) * 0.15;
            outlineY += (mouseY - outlineY) * 0.15;
            this.cursorOutline.style.transform = `translate(${outlineX - 16}px, ${outlineY - 16}px)`;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);

        // Hover effects on interactive elements
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, input, select, .cursor-pointer, [role="button"]')) {
                this.cursorOutline.classList.add('cursor-hover');
                this.cursorDot.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, input, select, .cursor-pointer, [role="button"]')) {
                this.cursorOutline.classList.remove('cursor-hover');
                this.cursorDot.classList.remove('cursor-hover');
            }
        });
    }
}

// --- Initialization Helpers ---
export function initLenis() {
    // Ultra-Snappy: Native scroll, no library overhead
    document.documentElement.style.scrollBehavior = 'smooth';
    return null;
}

export function initAnimations() {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Auto-Init (runs when imported as module) ---
document.addEventListener('DOMContentLoaded', () => {
    new NavigationSystem();
    initAnimations();
    // Cursor is optional — uncomment if desired
    // new Cursor();
});
