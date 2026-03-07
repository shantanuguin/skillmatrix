// Common utilities and configuration

// Supervisor mapping (Line -> Supervisor Name)
export const supervisorMapping = {
    'S-01': 'WASANA',
    'S-01A': 'WASANA',
    'S-02': 'SOHORAB',
    'S-02A': 'SOHORAB',
    'S-03': 'SOHEL',
    'S-03A': 'SOHEL',
    'S-04': 'AHMAD',
    'S-05': 'FARUK',
    'S-05A': 'FARUK',
    'S-06': 'SHAKIL',
    'S-07': 'NAGENDER',
    'S-07A': 'KAMAL',
    'S-08': 'BALISTER',
    'S-09': 'SUMI',
    'S-10': 'RAJ KUMAR',
    'S-11': 'KAMAL',
    'S-12': 'DHARAMEDER',
    'S-13': 'SUMON',
    'S-14': 'SHARIF',
    'S-14A': 'SHARIF',
    'S-15': 'MUNSAF',
    'S-16': 'RAHMAN',
    'S-16A': 'RHANIA',
    'S-17': 'MUSUM',
    'S-18': 'JAKIR',
    'S-19': 'ALAMGIR',
    'S-20': 'GAYANI',
    'S-21': 'DEVRAJ',
    'S-21A': 'SUMON',
    'S-22': 'ASHRAFUL',
    'S-23': 'RUMA',
    'S-24': 'NASIR',
    'S-25': 'AKBAR',
    'S-26': 'HIMAYIT',
    'S-27': 'TRAYAL RUN',
    'S-27-A': 'SAKIR',
    'S-28': 'RUPNANAYAN',
    'S-29': 'SUBA',
    'S-30': 'RAZIB',
    'S-30A': 'RAZIB',
    'S-31': 'AKESH',
    'S-32': 'KALU',
    'F-02': 'DHANANJAY',
    'F-2-N/S': 'DHANANJAY'
};

// Helper function to normalize line numbers (e.g., S-9 -> S-09, 9 -> S-09)
export function normalizeLineNo(lineNo) {
    if (!lineNo) return '';
    let normalized = String(lineNo).toUpperCase().trim();

    // Remove variations of "LINE " prefix
    normalized = normalized.replace(/^(LINE|SEW\s*LINE)\s*-?\s*/i, '');

    // If it's a pure number like "9", "09", "9A"
    if (/^\d+[A-Z]*$/.test(normalized)) {
        // Assume 'S' prefix by default for pure numbers
        normalized = 'S-' + normalized;
    }

    // Remove internal spaces (e.g. "S 9" -> "S9")
    normalized = normalized.replace(/\s+/g, '');

    // Pad single digits (e.g. S-9 -> S-09, S9 -> S-09, F-2 -> F-02)
    const singleDigitRegex = /^([A-Z]+)-?(\d)(?!\d)(.*)$/;
    const match = normalized.match(singleDigitRegex);
    if (match) {
        normalized = `${match[1]}-0${match[2]}${match[3]}`;
    } else {
        // Ensure proper dash format for multidigit too (e.g. S10 -> S-10)
        const multiDigitRegex = /^([A-Z]+)-?(\d{2,})(.*)$/;
        const matchMulti = normalized.match(multiDigitRegex);
        if (matchMulti) {
            normalized = `${matchMulti[1]}-${matchMulti[2]}${matchMulti[3]}`;
        }
    }

    return normalized;
}

// Helper function to get supervisor for a line
export function getSupervisorForLine(lineNo) {
    if (!lineNo) return 'Unknown';
    const normalized = normalizeLineNo(lineNo);
    return supervisorMapping[normalized] || 'Unknown';
}

// Machine families
export const machineFamilies = {
    'KANSAI Family': ['KANSAI', 'FLATSEAMER', 'MULTI_NEEDLE'],
    'Single Needle Family': ['SNLS', 'SNCS'],
    'Double Needle Family': ['DNLS'],
    'Feed of Arm': ['FOA'],
    'Overlock Family': ['OVERLOCK'],
    'Flatlock Family': ['FLATLOCK'],
    'Button & Buttonhole': ['BUTTON_ATTACH', 'BUTTONHOLE'],
    'Bartack': ['BARTACK'],
    'Automation Machines': [
        'AUTOMATIC_DRAWCORD', 'AUTO_POCKET_HEM', 'AUTO_POCKET_WELT',
        'AUTOMATIC_POCKET_SETTER', 'AUTOMATIC_BELT_LOOP_ATTACH', 'BLIND_LOOP_MAKING',
        'AUTOMATIC_LABEL_ASSEMBLY', 'AUTOMATIC_LABEL_FIXING', 'HANG_TAG_STRING_INSERTION',
        'AUTO_RIVET', 'SNAP_ATTACH', 'AUTOMATIC_FLAT_BOTTOM_HEMMING'
    ],
    'Hemming Machines': ['BLIND_HEM', 'BOTTOM_HEM'],
    'Special Machines': [
        'POLO_SHIRT_PLACKET_AUTOMATION', 'PATTERN_SEWER', 'MINI_PATTERN_SEAMER',
        'QUILTING', 'ZIGZAG_STITCH'
    ],
    'Pressing & Heat': ['HEAT_SEAL', 'INSEAM_IRON', 'IRON_TABLE'],
    'Others': ['Others']
};

export const GENERAL_ALLOWANCE = 16.67;

// DOM Elements getter (safe version)
export const getElement = (id) => document.getElementById(id);

// Toast Notification
export function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) return;

    // Set icon based on type
    const icon = toast.querySelector('i');
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' :
            type === 'error' ? 'fas fa-exclamation-circle' :
                'fas fa-info-circle';
    }

    // Set color
    if (type === 'error') {
        toast.style.borderLeft = '4px solid var(--accent-color)';
    } else if (type === 'info') {
        toast.style.borderLeft = '4px solid var(--primary-color)';
    } else {
        toast.style.borderLeft = '4px solid var(--success-color)';
    }

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format Time (Stopwatch)
export function formatTime(milliseconds) {
    const totalSeconds = milliseconds / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((milliseconds % 1000) / 10);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Real-time Clock
export function updateRealTimeClock() {
    const now = new Date();
    const timeElements = [
        document.getElementById('sidebarCurrentTime'),
        document.getElementById('headerLastSync'),
        document.getElementById('lastSync')
    ];

    const dateElements = [
        document.getElementById('sidebarLastUpdated')
    ];

    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const dateString = now.toLocaleDateString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });

    timeElements.forEach(el => { if (el) el.textContent = timeString; });
    dateElements.forEach(el => { if (el) el.textContent = dateString; });
}

// Mobile Menu
export function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar) return;

    const closeMenu = () => {
        sidebar.style.transform = 'translateX(-100%)';
        if (overlay) overlay.classList.remove('active');
        toggle.classList.remove('active');
    };

    const openMenu = () => {
        sidebar.style.transform = 'translateX(0)';
        if (overlay) overlay.classList.add('active');
        toggle.classList.add('active');
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.style.transform === 'translateX(0px)') {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (overlay) overlay.addEventListener('click', closeMenu);

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.style.transform = 'translateX(0)';
            if (overlay) overlay.classList.remove('active');
        } else {
            sidebar.style.transform = 'translateX(-100%)';
        }
    });
}

// Modal Utilities
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

export function setupModalListeners() {
    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Cancel buttons
    document.querySelectorAll('.btn-secondary[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Click outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// Populate Machine Dropdown
export function populateMachineOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Clear existing options except possibly the first one if we want to preserve "Select Machine"
    // But usually we just rebuild it
    select.innerHTML = '<option value="">Select Machine</option>';

    Object.entries(machineFamilies).forEach(([family, machines]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = family;
        machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine;
            option.textContent = machine;
            optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
    });
}
