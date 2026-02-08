// Common utilities and configuration

// Supervisor mapping (Line -> Supervisor Name)
export const supervisorMapping = {
    'S-01': 'WASANA',
    'S-01A': 'WASANA',
    'S-02': 'SOHRAB',
    'S-02A': 'SOHRAB',
    'S-03': 'SOHEL',
    'S-03A': 'SOHEL',
    'S-04': 'AHMAD',
    'S-05': 'OMAR FARUK',
    'S-05A': 'OMAR FARUK',
    'S-06': 'SUMI',
    'S-07': 'NAGENDRA',
    'S-07A': 'KAMAL',
    'S-08': 'BALISTER',
    'S-09': 'MONJURUL',
    'S-10': 'RAJKUMAR',
    'S-11': 'KAMAL',
    'S-12': 'DARMENDRAH',
    'S-13': 'SUMON',
    'S-14': 'SHARIF',
    'S-14A': 'SHARIF',
    'S-15': 'MUNSEF',
    'S-16': 'RAHMAN',
    'S-16A': 'RAHMAN',
    'S-17': 'MASUM',
    'S-18': 'DIANA',
    'S-19': 'ALOMGIR',
    'S-20': 'KAZAL',
    'S-21': 'DEVRAJ',
    'S-21A': 'SUMON',
    'S-22': 'ASHARFUL',
    'S-23': 'RUMA',
    'S-24': 'NASIR',
    'S-25': 'AKBAR',
    'S-26': 'SHAHBAN',
    'S-27': 'TRAYAL RUN',
    'S-27-A': 'SAKIR',
    'S-28': 'ROOP NARAYAN',
    'S-29': 'SUBA',
    'S-30': 'RAJIB',
    'S-30A': 'RAJIB',
    'S-31': 'AKASH',
    'S-32': 'KALU CHARAN',
    'F-02': 'DHANANJAY',
    'F-2-N/S': 'DHANANJAY'
};

// Helper function to get supervisor for a line
export function getSupervisorForLine(lineNo) {
    if (!lineNo) return 'Unknown';
    const normalized = lineNo.toUpperCase().trim();
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
// Mobile Menu - DEPRECATED: Use NavigationSystem from ui-core.js
export function setupMobileMenu() {
    console.warn('setupMobileMenu is deprecated. Use NavigationSystem from ui-core.js instead.');
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
