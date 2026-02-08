// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-kUUKaIP5h6uXCiSYYCePf0pWmf6QcwY",
    authDomain: "skill-matrix-3be5a.firebaseapp.com",
    projectId: "skill-matrix-3be5a",
    storageBucket: "skill-matrix-3be5a.firebasestorage.app",
    messagingSenderId: "614498722664",
    appId: "1:614498722664:web:e2a602f71b0ecb59c4acdd",
    measurementId: "G-60LG5FH4WB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Application state
let operators = [];
let performanceData = [];
let selectedOperatorId = null;
let lineDetails = JSON.parse(localStorage.getItem('lineDetails')) || {};
let operatorMachineSkills = JSON.parse(localStorage.getItem('operatorMachineSkills')) || {};
let operatorAllocatedSkills = JSON.parse(localStorage.getItem('operatorAllocatedSkills')) || {};
let lastAddedOperatorId = null;

// Supervisor mapping
const supervisorMapping = {
    'S-01': 'WASANA-1',
    'S-01A': 'WASANA-2',
    'S-02': 'SOHRAB',
    'S-03': 'SOHEL',
    'S-04': 'AHMAD',
    'S-05': 'OMAR FARUK',
    'S-06': 'SUMI',
    'S-07': 'NAGENDRA',
    'S-07A': 'KAMAL-2',
    'S-08': 'BALISTER',
    'S-09': 'MONJURUL',
    'S-10': 'RAJKUMAR',
    'S-11': 'KAMAL-1',
    'S-12': 'DARMENDRAH',
    'S-13': 'SUMON',
    'S-14': 'SHARIF',
    'S-15': 'MUNSEF',
    'S-16': 'RAHMAN',
    'S-17': 'MASUM',
    'S-18': 'DIANA',
    'S-19': 'ALAMGIR',
    'S-20': 'KAZAL',
    'S-21': 'DEVRAJ',
    'S-22': 'ASHARFUL',
    'S-23': 'RUMA',
    'S-24': 'NASIR',
    'S-25': 'AKBAR',
    'S-26': 'HIMAYAT',
    'S-28': 'ROOP NARAYAN',
    'S-29': 'SUBA',
    'S-30': 'RAJIB',
    'S-31': 'AKASH',
    'S-32': 'KALU CHARAN'
};

// Machine families grouped for dropdowns
const machineFamilies = {
    'KANSAI Family': [
        'KANSAI',
        'FLATSEAMER',
        'MULTI_NEEDLE'
    ],
    'Single Needle Family': [
        'SNLS',
        'SNCS'
    ],
    'Double Needle Family': [
        'DNLS'
    ],
    'Feed of Arm': [
        'FOA'
    ],
    'Overlock Family': [
        'OVERLOCK'
    ],
    'Flatlock Family': [
        'FLATLOCK'
    ],
    'Button & Buttonhole': [
        'BUTTON_ATTACH',
        'BUTTONHOLE'
    ],
    'Bartack': [
        'BARTACK'
    ],
    'Automation Machines': [
        'AUTOMATIC_DRAWCORD',
        'AUTO_POCKET_HEM',
        'AUTO_POCKET_WELT',
        'AUTOMATIC_POCKET_SETTER',
        'AUTOMATIC_BELT_LOOP_ATTACH',
        'BLIND_LOOP_MAKING',
        'AUTOMATIC_LABEL_ASSEMBLY',
        'AUTOMATIC_LABEL_FIXING',
        'HANG_TAG_STRING_INSERTION',
        'AUTO_RIVET',
        'SNAP_ATTACH',
        'AUTOMATIC_FLAT_BOTTOM_HEMMING'
    ],
    'Hemming Machines': [
        'BLIND_HEM',
        'BOTTOM_HEM'
    ],
    'Special Machines': [
        'POLO_SHIRT_PLACKET_AUTOMATION',
        'PATTERN_SEWER',
        'MINI_PATTERN_SEAMER',
        'QUILTING',
        'ZIGZAG_STITCH'
    ],
    'Pressing & Heat': [
        'HEAT_SEAL',
        'INSEAM_IRON',
        'IRON_TABLE'
    ],
    'Others': [
        'Others'
    ]
};

// Stopwatch variables with pause functionality
let stopwatchRunning = false;
let stopwatchPaused = false;
let stopwatchStartTime = 0;
let stopwatchTotalElapsed = 0;
let lapStartTime = 0;
let lapElapsed = 0;
let lapCounter = 0;
let lapTimes = [];
let stopwatchInterval = null;
let cycleCount = 3;

// Dashboard charts
let efficiencyChart = null;
let linePerformanceChart = null;
let machinePerformanceChart = null;
let weeklyTrendChart = null;
let bottleneckChart = null;

// General allowance of 16.67% for all machines
const GENERAL_ALLOWANCE = 16.67;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    sidebarCurrentTime: document.getElementById('sidebarCurrentTime'),
    sidebarLastUpdated: document.getElementById('sidebarLastUpdated'),
    headerLastSync: document.getElementById('headerLastSync'),
    headerTotalOps: document.getElementById('headerTotalOps'),
    headerActiveLines: document.getElementById('headerActiveLines'),
    headerTimeStudies: document.getElementById('headerTimeStudies'),
    dataVersion: document.getElementById('dataVersion'),
    lastSync: document.getElementById('lastSync'),
    // Operator tab - UPDATED: Removed elements for 4 cards
    searchInput: document.getElementById('searchInput'),
    skillFilter: document.getElementById('skillFilter'),
    lineFilter: document.getElementById('lineFilter'),
    operatorsBody: document.getElementById('operatorsBody'),
    // Performance tab - UPDATED: Removed average efficiency and machine usage statistics
    performanceBody: document.getElementById('performanceBody'),
    notificationToast: document.getElementById('notificationToast'),
    toastMessage: document.getElementById('toastMessage'),
    stopwatchDisplay: document.getElementById('stopwatchDisplay'),
    lapDisplay: document.getElementById('lapDisplay'),
    lapsList: document.getElementById('lapsList'),
    // UPDATED: Removed machine usage stats from performance tab
    groupOperatorsList: document.getElementById('groupOperatorsList'),
    groupModalTitle: document.getElementById('groupModalTitle'),
    groupOperatorCount: document.getElementById('groupOperatorCount'),
    groupAvgEfficiency: document.getElementById('groupAvgEfficiency'),
    groupDescription: document.getElementById('groupDescription'),
    // Dashboard elements - UPDATED: Added new dashboard elements
    dashboardTotalOperators: document.getElementById('dashboardTotalOperators'),
    dashboardGroupACount: document.getElementById('dashboardGroupACount'),
    dashboardGroupBCount: document.getElementById('dashboardGroupBCount'),
    dashboardGroupCCount: document.getElementById('dashboardGroupCCount'),
    dashboardGroupDCount: document.getElementById('dashboardGroupDCount'),
    dashboardAvgEfficiency: document.getElementById('dashboardAvgEfficiency'),
    dashboardAvgSMV: document.getElementById('dashboardAvgSMV'),
    dashboardAvgWorkingSMV: document.getElementById('dashboardAvgWorkingSMV'),
    dashboardTotalOperations: document.getElementById('dashboardTotalOperations'),
    dashboardActiveLines: document.getElementById('dashboardActiveLines'),
    dashboardMachineUsage: document.getElementById('dashboardMachineUsage'),
    dashboardTimeStudiesCount: document.getElementById('dashboardTimeStudiesCount'),
    // Garment SMV elements
    totalStandardSMV: document.getElementById('totalStandardSMV'),
    totalWorkingSMV: document.getElementById('totalWorkingSMV'),
    standardSMVLineSelect: document.getElementById('standardSMVLineSelect'),
    standardSMVStyleSelect: document.getElementById('standardSMVStyleSelect'),
    workingSMVLineSelect: document.getElementById('workingSMVLineSelect'),
    workingSMVStyleSelect: document.getElementById('workingSMVStyleSelect'),
    // Time study elements
    studyLineNo: document.getElementById('studyLineNo'),
    studyStyleNo: document.getElementById('studyStyleNo'),
    studyProductDesc: document.getElementById('studyProductDesc'),
    // Allowance display elements
    allowanceInfo: document.getElementById('allowanceInfo'),
    generalAllowanceDisplay: document.getElementById('generalAllowanceDisplay'),
    // Mobile menu
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    setupSidebarNavigation();
    updateRealTimeClock();
    loadOperatorMachineSkills();
    loadOperatorAllocatedSkills();
    
    // Start real-time clock
    setInterval(updateRealTimeClock, 1000);
    
    // Hide loading overlay
    setTimeout(() => {
        elements.loadingOverlay.style.display = 'none';
    }, 1500);
    
    // Check for last added operator highlight
    if (lastAddedOperatorId) {
        setTimeout(() => {
            highlightNewOperator(lastAddedOperatorId);
        }, 1000);
    }
});

// Update real-time clock
function updateRealTimeClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateString = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    elements.sidebarCurrentTime.textContent = timeString;
    elements.sidebarLastUpdated.textContent = dateString;
    elements.headerLastSync.textContent = timeString;
    elements.lastSync.textContent = timeString;
    elements.dataVersion.textContent = '22.0.0'; // Updated version
}

// Setup sidebar navigation
function setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                    
                    // Load specific data for each tab
                    if (tabId === 'dashboard') {
                        updateDashboard();
                        createDashboardCharts();
                        updateGarmentSMVSelectors();
                        updateBottleneckCard();
                        updateHighPriorityCard(); // NEW: Update high priority card
                    } else if (tabId === 'performance') {
                        // UPDATED: Remove machine usage stats update
                        // Just render the performance table
                        renderPerformanceTable();
                    }
                }
            });
            
            // Close mobile sidebar if open
            if (window.innerWidth <= 768) {
                closeMobileSidebar();
            }
        });
    });
    
    // Make summary cards clickable - UPDATED: Removed for operator tab cards
    document.querySelectorAll('.stat-card.clickable:not([data-tab="operators"])').forEach(card => {
        card.addEventListener('click', () => {
            const tab = card.getAttribute('data-tab');
            const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (navItem) {
                navItem.click();
            }
        });
    });
}

// Setup mobile menu toggle
function setupMobileMenu() {
    if (!elements.mobileMenuToggle) return;
    
    elements.mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileSidebar();
    });
    
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', () => {
            closeMobileSidebar();
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (elements.sidebar && !elements.sidebar.contains(e.target) && 
                elements.mobileMenuToggle && !elements.mobileMenuToggle.contains(e.target)) {
                closeMobileSidebar();
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Reset sidebar for desktop
            if (elements.sidebar) {
                elements.sidebar.style.transform = 'translateX(0)';
                elements.sidebar.style.width = '240px';
            }
            if (elements.sidebarOverlay) {
                elements.sidebarOverlay.classList.remove('active');
            }
            if (elements.mobileMenuToggle) {
                elements.mobileMenuToggle.classList.remove('active');
            }
        } else {
            // Ensure sidebar is hidden on mobile initially
            if (elements.sidebar) {
                elements.sidebar.style.transform = 'translateX(-100%)';
                elements.sidebar.style.width = '240px';
            }
        }
    });
}

function toggleMobileSidebar() {
    if (!elements.sidebar) return;
    
    if (elements.sidebar.style.transform === 'translateX(0px)' || elements.sidebar.style.transform === '') {
        openMobileSidebar();
    } else {
        closeMobileSidebar();
    }
}

function openMobileSidebar() {
    if (elements.sidebar) {
        elements.sidebar.style.transform = 'translateX(0)';
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.add('active');
    }
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.classList.add('active');
    }
}

function closeMobileSidebar() {
    if (elements.sidebar) {
        elements.sidebar.style.transform = 'translateX(-100%)';
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.remove('active');
    }
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.classList.remove('active');
    }
}

// Update Garment SMV selectors - UPDATED: Added high priority selectors
function updateGarmentSMVSelectors() {
    // Get unique lines from performance data
    const lines = new Set();
    const stylesByLine = {};
    
    performanceData.forEach(record => {
        if (record.lineNo) {
            lines.add(record.lineNo);
            if (!stylesByLine[record.lineNo]) {
                stylesByLine[record.lineNo] = new Set();
            }
            if (record.styleNo) {
                stylesByLine[record.lineNo].add(record.styleNo);
            }
        }
    });
    
    // Populate line selectors
    const lineSelectors = [
        elements.standardSMVLineSelect,
        elements.workingSMVLineSelect,
        document.getElementById('dashboardLineSelect'),
        document.getElementById('operatorsLineFilter'),
        document.getElementById('lineFilter'),
        document.getElementById('perfLineFilter'),
        document.getElementById('dashboardLineFilter'),
        document.getElementById('timeStudiesLineSelect'),
        document.getElementById('bottleneckLineSelect'),
        document.getElementById('highPriorityLineSelect') // NEW: Add high priority line select
    ];
    
    lineSelectors.forEach(select => {
        if (select) {
            // Clear existing options except the first one
            const firstOption = select.options[0];
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);
            
            // Add line options
            Array.from(lines).sort().forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                select.appendChild(option);
            });
        }
    });
    
    // Update line datalist for time study and performance forms
    const lineNoList = document.getElementById('lineNoList');
    if (lineNoList) {
        lineNoList.innerHTML = '';
        Array.from(lines).sort().forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            lineNoList.appendChild(option);
        });
        
        // Add operators' sew lines to datalist
        operators.forEach(operator => {
            if (operator.sewLine && !Array.from(lines).includes(operator.sewLine)) {
                const option = document.createElement('option');
                option.value = operator.sewLine;
                lineNoList.appendChild(option);
            }
        });
    }
    
    // Add event listeners for style dropdown updates
    if (elements.standardSMVLineSelect) {
        elements.standardSMVLineSelect.addEventListener('change', function() {
            updateStyleDropdown(this.value, elements.standardSMVStyleSelect);
            calculateGarmentSMV('standard');
        });
    }
    
    if (elements.workingSMVLineSelect) {
        elements.workingSMVLineSelect.addEventListener('change', function() {
            updateStyleDropdown(this.value, elements.workingSMVStyleSelect);
            calculateGarmentSMV('working');
        });
    }
    
    if (elements.standardSMVStyleSelect) {
        elements.standardSMVStyleSelect.addEventListener('change', () => calculateGarmentSMV('standard'));
    }
    
    if (elements.workingSMVStyleSelect) {
        elements.workingSMVStyleSelect.addEventListener('change', () => calculateGarmentSMV('working'));
    }
    
    // Event listeners for bottleneck card filters
    const bottleneckLineSelect = document.getElementById('bottleneckLineSelect');
    const bottleneckStyleSelect = document.getElementById('bottleneckStyleSelect');
    
    if (bottleneckLineSelect) {
        bottleneckLineSelect.addEventListener('change', function() {
            updateBottleneckStyleDropdown(this.value);
            updateBottleneckCard();
        });
    }
    
    if (bottleneckStyleSelect) {
        bottleneckStyleSelect.addEventListener('change', updateBottleneckCard);
    }
    
    // NEW: Event listeners for high priority card filters
    const highPriorityLineSelect = document.getElementById('highPriorityLineSelect');
    const highPriorityStyleSelect = document.getElementById('highPriorityStyleSelect');
    
    if (highPriorityLineSelect) {
        highPriorityLineSelect.addEventListener('change', function() {
            updateHighPriorityStyleDropdown(this.value);
            updateHighPriorityCard();
        });
    }
    
    if (highPriorityStyleSelect) {
        highPriorityStyleSelect.addEventListener('change', updateHighPriorityCard);
    }
    
    // Initial calculation
    calculateGarmentSMV('standard');
    calculateGarmentSMV('working');
}

// Update bottleneck style dropdown
function updateBottleneckStyleDropdown(line) {
    const bottleneckStyleSelect = document.getElementById('bottleneckStyleSelect');
    if (!bottleneckStyleSelect) return;
    
    // Clear existing options
    bottleneckStyleSelect.innerHTML = '<option value="">All Styles</option>';
    
    if (!line) {
        bottleneckStyleSelect.disabled = true;
        return;
    }
    
    // Get styles for the selected line
    const styles = new Set();
    performanceData.forEach(record => {
        if (record.lineNo === line && record.styleNo) {
            styles.add(record.styleNo);
        }
    });
    
    if (styles.size === 0) {
        bottleneckStyleSelect.disabled = true;
        return;
    }
    
    bottleneckStyleSelect.disabled = false;
    
    // Add style options
    Array.from(styles).sort().forEach(style => {
        const option = document.createElement('option');
        option.value = style;
        option.textContent = style;
        bottleneckStyleSelect.appendChild(option);
    });
}

// NEW: Update high priority style dropdown
function updateHighPriorityStyleDropdown(line) {
    const highPriorityStyleSelect = document.getElementById('highPriorityStyleSelect');
    if (!highPriorityStyleSelect) return;
    
    // Clear existing options
    highPriorityStyleSelect.innerHTML = '<option value="">All Styles</option>';
    
    if (!line) {
        highPriorityStyleSelect.disabled = true;
        return;
    }
    
    // Get styles for the selected line
    const styles = new Set();
    performanceData.forEach(record => {
        if (record.lineNo === line && record.styleNo) {
            styles.add(record.styleNo);
        }
    });
    
    if (styles.size === 0) {
        highPriorityStyleSelect.disabled = true;
        return;
    }
    
    highPriorityStyleSelect.disabled = false;
    
    // Add style options
    Array.from(styles).sort().forEach(style => {
        const option = document.createElement('option');
        option.value = style;
        option.textContent = style;
        highPriorityStyleSelect.appendChild(option);
    });
}

// Auto-fill style and product from the latest record for the line
function autoFillStyleAndProduct(lineNo, type = 'study') {
    if (!lineNo) return;
    
    // Find ALL performance records for this line and sort by timestamp (newest first)
    const lineRecords = performanceData
        .filter(record => record.lineNo === lineNo)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (lineRecords.length > 0) {
        // Always use the latest record (most recent timestamp)
        const latestRecord = lineRecords[0];
        
        if (type === 'study' && elements.studyStyleNo && elements.studyProductDesc) {
            elements.studyStyleNo.value = latestRecord.styleNo || '';
            elements.studyProductDesc.value = latestRecord.productDesc || '';
        } else {
            const perfStyleNo = document.getElementById('perfStyleNo');
            const perfProductDesc = document.getElementById('perfProductDesc');
            if (perfStyleNo && perfProductDesc) {
                perfStyleNo.value = latestRecord.styleNo || '';
                perfProductDesc.value = latestRecord.productDesc || '';
            }
        }
        
        // Show toast notification about auto-fill
        showToast(`Auto-filled Style & Description from latest record for Line ${lineNo}`);
    } else {
        // Clear fields if no records found
        if (type === 'study' && elements.studyStyleNo && elements.studyProductDesc) {
            elements.studyStyleNo.value = '';
            elements.studyProductDesc.value = '';
        } else {
            const perfStyleNo = document.getElementById('perfStyleNo');
            const perfProductDesc = document.getElementById('perfProductDesc');
            if (perfStyleNo && perfProductDesc) {
                perfStyleNo.value = '';
                perfProductDesc.value = '';
            }
        }
    }
}

// Update style dropdown based on selected line
function updateStyleDropdown(line, styleSelect) {
    if (!styleSelect) return;
    
    // Clear existing options except the first one
    const firstOption = styleSelect.options[0];
    styleSelect.innerHTML = '';
    if (firstOption) styleSelect.appendChild(firstOption);
    
    if (!line) {
        styleSelect.disabled = true;
        return;
    }
    
    // Get styles for the selected line
    const styles = new Set();
    performanceData.forEach(record => {
        if (record.lineNo === line && record.styleNo) {
            styles.add(record.styleNo);
        }
    });
    
    if (styles.size === 0) {
        styleSelect.disabled = true;
        return;
    }
    
    styleSelect.disabled = false;
    
    // Add style options
    Array.from(styles).sort().forEach(style => {
        const option = document.createElement('option');
        option.value = style;
        option.textContent = style;
        styleSelect.appendChild(option);
    });
}

// Calculate Garment SMV
function calculateGarmentSMV(type) {
    const lineSelect = type === 'standard' ? elements.standardSMVLineSelect : elements.workingSMVLineSelect;
    const styleSelect = type === 'standard' ? elements.standardSMVStyleSelect : elements.workingSMVStyleSelect;
    const totalElement = type === 'standard' ? elements.totalStandardSMV : elements.totalWorkingSMV;
    
    if (!lineSelect || !totalElement) return;
    
    const line = lineSelect.value;
    
    if (!line) {
        totalElement.textContent = '0.00';
        return;
    }
    
    // Filter performance data by line and style
    let filteredData = performanceData.filter(record => record.lineNo === line);
    
    if (styleSelect && styleSelect.value) {
        filteredData = filteredData.filter(record => record.styleNo === styleSelect.value);
    }
    
    if (filteredData.length === 0) {
        totalElement.textContent = '0.00';
        return;
    }
    
    // Calculate total SMV
    let totalSMV = 0;
    filteredData.forEach(record => {
        if (type === 'standard') {
            totalSMV += record.standardSMV || 0;
        } else {
            totalSMV += record.workingSMV || 0;
        }
    });
    
    totalElement.textContent = totalSMV.toFixed(2);
}

// Stopwatch functions with pause functionality and general allowance
function formatTime(milliseconds) {
    const totalSeconds = milliseconds / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function updateStopwatch() {
    const currentTime = Date.now();
    stopwatchTotalElapsed = currentTime - stopwatchStartTime;
    lapElapsed = currentTime - lapStartTime;
    
    if (elements.stopwatchDisplay) {
        elements.stopwatchDisplay.textContent = formatTime(stopwatchTotalElapsed);
    }
    if (elements.lapDisplay) {
        elements.lapDisplay.textContent = `Lap: ${formatTime(lapElapsed)}`;
    }
}

function startStopwatch() {
    if (!stopwatchRunning && !stopwatchPaused) {
        const now = Date.now();
        stopwatchStartTime = now - stopwatchTotalElapsed;
        lapStartTime = now - lapElapsed;
        
        stopwatchInterval = setInterval(updateStopwatch, 10);
        stopwatchRunning = true;
        stopwatchPaused = false;
        
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const lapBtn = document.getElementById('lapBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) {
            pauseBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
        if (lapBtn) lapBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = true;
    } else if (stopwatchPaused) {
        // Resume from pause
        const now = Date.now();
        stopwatchStartTime = now - stopwatchTotalElapsed;
        lapStartTime = now - lapElapsed;
        
        stopwatchInterval = setInterval(updateStopwatch, 10);
        stopwatchRunning = true;
        stopwatchPaused = false;
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }
}

function pauseStopwatch() {
    if (stopwatchRunning && !stopwatchPaused) {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchPaused = true;
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        }
    } else if (stopwatchPaused) {
        // Resume
        startStopwatch();
    }
}

function recordLap() {
    if (lapCounter < cycleCount || cycleCount === 0) {
        lapCounter++;
        const lapTimeSeconds = lapElapsed / 1000;
        lapTimes.push(lapTimeSeconds);
        
        // Add lap to display with serial number
        if (elements.lapsList) {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <div class="lap-number">Cycle ${lapCounter}</div>
                <div class="lap-time">${lapTimeSeconds.toFixed(3)} sec</div>
            `;
            elements.lapsList.appendChild(lapItem);
        }
        
        // Reset lap timer for next lap
        const now = Date.now();
        lapStartTime = now;
        lapElapsed = 0;
        if (elements.lapDisplay) {
            elements.lapDisplay.textContent = 'Lap: 00:00:00.000';
        }
        
        // Check if we've reached the maximum cycles
        if (cycleCount > 0 && lapCounter >= cycleCount) {
            pauseStopwatch();
            calculateResults();
        }
    }
}

function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchRunning = false;
    stopwatchPaused = false;
    stopwatchTotalElapsed = 0;
    lapElapsed = 0;
    lapCounter = 0;
    lapTimes = [];
    
    if (elements.stopwatchDisplay) {
        elements.stopwatchDisplay.textContent = '00:00:00.000';
    }
    if (elements.lapDisplay) {
        elements.lapDisplay.textContent = 'Lap: 00:00:00.000';
    }
    if (elements.lapsList) {
        elements.lapsList.innerHTML = '';
    }
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const lapBtn = document.getElementById('lapBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
    if (lapBtn) lapBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = true;
    
    // Reset results
    document.getElementById('avgCycleTime').textContent = '0.00';
    document.getElementById('totalCycleTime').textContent = '0.00';
    document.getElementById('workingSMVResult').textContent = '0.00';
    document.getElementById('efficiencyResult').textContent = '0%';
}

// Update allowance display
function updateAllowanceDisplay() {
    if (!elements.allowanceInfo) return;
    
    elements.allowanceInfo.style.display = 'block';
    
    // Update display elements with general allowance
    if (elements.generalAllowanceDisplay) {
        elements.generalAllowanceDisplay.textContent = '16.67%';
    }
}

// Calculate results with general allowance
function calculateResults() {
    if (lapTimes.length === 0) return;
    
    const totalTime = lapTimes.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / lapTimes.length;
    
    // Use general allowance of 16.67%
    const workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE/100);
    const standardSMV = parseFloat(document.getElementById('standardSMV')?.value) || 0;
    const efficiency = standardSMV > 0 ? (standardSMV / workingSMV) * 100 : 0;
    
    const avgCycleTimeElem = document.getElementById('avgCycleTime');
    const totalCycleTimeElem = document.getElementById('totalCycleTime');
    const workingSMVResultElem = document.getElementById('workingSMVResult');
    const efficiencyResultElem = document.getElementById('efficiencyResult');
    
    if (avgCycleTimeElem) avgCycleTimeElem.textContent = avgTime.toFixed(2);
    if (totalCycleTimeElem) totalCycleTimeElem.textContent = totalTime.toFixed(2);
    if (workingSMVResultElem) workingSMVResultElem.textContent = workingSMV.toFixed(2);
    if (efficiencyResultElem) {
        efficiencyResultElem.textContent = efficiency.toFixed(1) + '%';
        
        // Color code efficiency
        efficiencyResultElem.className = 'result-value ';
        if (efficiency >= 85) {
            efficiencyResultElem.classList.add('efficiency-high');
        } else if (efficiency >= 70) {
            efficiencyResultElem.classList.add('efficiency-medium');
        } else {
            efficiencyResultElem.classList.add('efficiency-low');
        }
    }
}

// Calculate manual cycle times with general allowance
function calculateManualCycles() {
    const manualTimes = [];
    document.querySelectorAll('.manual-cycle-time').forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value) && value > 0) {
            manualTimes.push(value);
        }
    });
    
    if (manualTimes.length === 0) {
        showToast('Please enter at least one valid cycle time', 'error');
        return;
    }
    
    lapTimes = manualTimes;
    lapCounter = manualTimes.length;
    
    // Update laps display with serial numbers
    if (elements.lapsList) {
        elements.lapsList.innerHTML = '';
        manualTimes.forEach((time, index) => {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <div class="lap-number">Cycle ${index + 1}</div>
                <div class="lap-time">${time.toFixed(3)} sec</div>
            `;
            elements.lapsList.appendChild(lapItem);
        });
    }
    
    calculateResults();
    showToast(`Calculated ${manualTimes.length} manual cycle times`);
}

// Load data from Firestore
async function loadData() {
    try {
        // Load operators with real-time updates
        const operatorsQuery = query(collection(db, 'operators'), orderBy('operatorId'));
        onSnapshot(operatorsQuery, (snapshot) => {
            operators = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                operators.push({
                    id: doc.id,
                    operatorId: data.operatorId || '',
                    name: data.name || '',
                    sewLine: data.sewLine || '',
                    skillLevel: data.skillLevel || '',
                    skillScore: data.skillScore || 0,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    lastUpdated: data.lastUpdated?.toDate() || new Date()
                });
            });
            renderOperatorsTable();
            updateStats();
            updateDashboardStats();
            populateOperatorDropdowns();
            populateLineFilter();
            populateDashboardLineSelect();
            populateOperatorsLineFilter();
            updateGarmentSMVSelectors();
            updateActiveLinesCount();
            if (elements.headerTotalOps) {
                elements.headerTotalOps.textContent = operators.length;
            }
            
            showToast(`${operators.length} operators loaded successfully!`);
        });
        
        // Load performance data
        const performanceQuery = query(collection(db, 'performance'), orderBy('timestamp', 'desc'));
        onSnapshot(performanceQuery, (snapshot) => {
            performanceData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                performanceData.push({
                    id: doc.id,
                    operatorId: data.operatorId || '',
                    operatorName: data.operatorName || '',
                    lineNo: data.lineNo || '',
                    styleNo: data.styleNo || '',
                    productDesc: data.productDesc || '',
                    operation: data.operation || '',
                    machineName: data.machineName || '',
                    customMachineName: data.customMachineName || '',
                    standardSMV: data.standardSMV || 0,
                    workingSMV: data.workingSMV || 0,
                    efficiency: data.efficiency || 0,
                    cycleTimes: data.cycleTimes || [],
                    otherMachines: data.otherMachines || '',
                    otherMachineEfficiencies: data.otherMachineEfficiencies || {},
                    operationGrade: data.operationGrade || '',
                    criticalToQuality: data.criticalToQuality || '',
                    bottleneck: data.bottleneck || false,
                    allowance: GENERAL_ALLOWANCE,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    lastUpdated: data.lastUpdated?.toDate() || new Date()
                });
            });
            renderPerformanceTable();
            updatePerformanceStats();
            updateSummaryStats();
            // UPDATED: Removed machine usage stats update for performance tab
            updateDashboardStats();
            updateGarmentSMVSelectors();
            updateActiveLinesCount();
            updateTimeStudiesCount();
            updateBottleneckCard();
            updateHighPriorityCard(); // NEW: Update high priority card
            
            // Update dashboard if active
            if (document.getElementById('dashboard')?.classList.contains('active')) {
                updateDashboard();
                createDashboardCharts();
            }
        });
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data: ' + error.message, 'error');
        if (elements.loadingOverlay) {
            elements.loadingOverlay.style.display = 'none';
        }
    }
}

// Update active lines count
function updateActiveLinesCount() {
    const activeLinesSet = new Set();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Count lines with operators assigned
    operators.forEach(operator => {
        if (operator.sewLine) {
            activeLinesSet.add(operator.sewLine);
        }
    });
    
    // Count lines with performance data in last 7 days
    performanceData.forEach(record => {
        if (record.lineNo && record.timestamp) {
            const recordDate = new Date(record.timestamp);
            if (recordDate >= sevenDaysAgo) {
                activeLinesSet.add(record.lineNo);
            }
        }
    });
    
    const activeLinesCount = activeLinesSet.size;
    if (elements.headerActiveLines) {
        elements.headerActiveLines.textContent = activeLinesCount;
    }
    if (elements.dashboardActiveLines) {
        elements.dashboardActiveLines.textContent = activeLinesCount;
    }
    
    return activeLinesCount;
}

// Update time studies count for specific line
function updateTimeStudiesCountForLine(line) {
    if (!line) return updateTimeStudiesCount();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count time studies for today for the specific line
    const timeStudiesCount = performanceData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= today && 
               record.cycleTimes && 
               record.cycleTimes.length > 0 &&
               record.lineNo === line;
    }).length;
    
    // Update dashboard card
    if (elements.dashboardTimeStudiesCount) {
        elements.dashboardTimeStudiesCount.textContent = timeStudiesCount;
    }
    
    return timeStudiesCount;
}

// Update time studies count
function updateTimeStudiesCount() {
    // Count time studies (performance records with cycle times)
    const timeStudiesCount = performanceData.filter(record => 
        record.cycleTimes && record.cycleTimes.length > 0
    ).length;
    
    // Update header
    if (elements.headerTimeStudies) {
        elements.headerTimeStudies.textContent = timeStudiesCount;
    }
    
    // Update dashboard card
    if (elements.dashboardTimeStudiesCount) {
        elements.dashboardTimeStudiesCount.textContent = timeStudiesCount;
    }
    
    return timeStudiesCount;
}

// Load operator machine skills
function loadOperatorMachineSkills() {
    const skills = localStorage.getItem('operatorMachineSkills');
    if (skills) {
        operatorMachineSkills = JSON.parse(skills);
    }
}

// Load operator allocated skills
function loadOperatorAllocatedSkills() {
    const skills = localStorage.getItem('operatorAllocatedSkills');
    if (skills) {
        operatorAllocatedSkills = JSON.parse(skills);
    }
}

// Save operator machine skills
function saveOperatorMachineSkills() {
    localStorage.setItem('operatorMachineSkills', JSON.stringify(operatorMachineSkills));
}

// Save operator allocated skills
function saveOperatorAllocatedSkills() {
    localStorage.setItem('operatorAllocatedSkills', JSON.stringify(operatorAllocatedSkills));
}

// Update operator machine skill based on performance
function updateOperatorMachineSkill(operatorId, machineName, efficiency) {
    if (!operatorMachineSkills[operatorId]) {
        operatorMachineSkills[operatorId] = {};
    }
    
    if (!operatorMachineSkills[operatorId][machineName]) {
        operatorMachineSkills[operatorId][machineName] = {
            operations: new Set(),
            efficiencies: [],
            lastUpdated: new Date()
        };
    }
    
    // Add operation to set (unique operations)
    const operation = document.getElementById('studyOperation')?.value || 
                    document.getElementById('perfOperation')?.value || 'Unknown';
    operatorMachineSkills[operatorId][machineName].operations.add(operation);
    
    // Add efficiency to array
    operatorMachineSkills[operatorId][machineName].efficiencies.push(efficiency);
    
    // Keep only last 10 efficiencies
    if (operatorMachineSkills[operatorId][machineName].efficiencies.length > 10) {
        operatorMachineSkills[operatorId][machineName].efficiencies.shift();
    }
    
    operatorMachineSkills[operatorId][machineName].lastUpdated = new Date();
    saveOperatorMachineSkills();
}

// Calculate skill level for a machine based on performance
function calculateMachineSkillLevel(operatorId, machineName) {
    if (!operatorMachineSkills[operatorId] || !operatorMachineSkills[operatorId][machineName]) {
        // Check allocated skills
        if (operatorAllocatedSkills[operatorId] && operatorAllocatedSkills[operatorId][machineName]) {
            const efficiency = operatorAllocatedSkills[operatorId][machineName].efficiency;
            if (efficiency >= 85) return 'A';
            else if (efficiency >= 70) return 'B';
            else if (efficiency >= 50) return 'C';
            else return 'D';
        }
        return 'D';
    }
    
    const data = operatorMachineSkills[operatorId][machineName];
    const avgEfficiency = data.efficiencies.length > 0 ? 
        data.efficiencies.reduce((a, b) => a + b, 0) / data.efficiencies.length : 0;
    const operationCount = data.operations.size;
    
    // Determine skill level based on new logic
    if (operationCount >= 3 && avgEfficiency >= 85) {
        return 'A';
    } else if (operationCount >= 3 && avgEfficiency >= 70) {
        return 'B';
    } else if (operationCount >= 2 && avgEfficiency >= 50) {
        return 'C';
    } else {
        return 'D';
    }
}

// Get all machines for an operator (from performance data and allocated skills)
function getOperatorMachines(operatorId) {
    const machines = new Set();
    
    // Get machines from performance data
    performanceData.forEach(record => {
        if (record.operatorId === operatorId && record.machineName) {
            let machineName = record.machineName;
            if (record.machineName === 'Others' && record.customMachineName) {
                machineName = record.customMachineName;
            }
            machines.add(machineName);
        }
    });
    
    // Get machines from allocated skills
    if (operatorAllocatedSkills[operatorId]) {
        Object.keys(operatorAllocatedSkills[operatorId]).forEach(machine => {
            machines.add(machine);
        });
    }
    
    return Array.from(machines);
}

// Calculate multi-skill grade based on new logic with allocated skills
function calculateMultiSkillGrade(operatorId) {
    const machines = getOperatorMachines(operatorId);
    const machineCount = machines.length;
    
    if (machineCount === 0) {
        return 'Group D';
    }
    
    // Get skill levels for each machine
    const machineSkillLevels = machines.map(machine => 
        calculateMachineSkillLevel(operatorId, machine)
    );
    
    // Count machines by skill level
    const levelCounts = {
        'A': machineSkillLevels.filter(level => level === 'A').length,
        'B': machineSkillLevels.filter(level => level === 'B').length,
        'C': machineSkillLevels.filter(level => level === 'C').length,
        'D': machineSkillLevels.filter(level => level === 'D').length
    };
    
    // Get operator's average efficiency
    const operatorEfficiency = getOperatorAverageEfficiency(operatorId);
    
    // Apply grading criteria
    if (machineCount >= 3 && levelCounts['A'] >= 1 && 
        (levelCounts['B'] >= 1 || levelCounts['C'] >= 1) &&
        operatorEfficiency >= 70) {
        return 'Group A';
    }
    else if (machineCount >= 2 && levelCounts['B'] >= 1 && 
             (levelCounts['C'] >= 1 || machineCount === 2) &&
             operatorEfficiency >= 60) {
        return 'Group B';
    }
    else if (machineCount >= 2 && levelCounts['C'] >= 2 &&
             operatorEfficiency >= 50) {
        return 'Group C';
    }
    else {
        return 'Group D';
    }
}

// Populate operator dropdowns
function populateOperatorDropdowns() {
    const studyOperatorId = document.getElementById('studyOperatorId');
    const perfOperatorId = document.getElementById('perfOperatorId');
    const editExistingOperatorSelect = document.getElementById('editExistingOperatorSelect');
    
    // Clear existing options except the first one
    [studyOperatorId, perfOperatorId, editExistingOperatorSelect].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Operator</option>';
        }
    });
    
    operators.forEach(operator => {
        const option1 = document.createElement('option');
        option1.value = operator.operatorId;
        option1.textContent = `${operator.operatorId} - ${operator.name}`;
        if (studyOperatorId) studyOperatorId.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = operator.operatorId;
        option2.textContent = `${operator.operatorId} - ${operator.name}`;
        if (perfOperatorId) perfOperatorId.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = operator.operatorId;
        option3.textContent = `${operator.operatorId} - ${operator.name}`;
        if (editExistingOperatorSelect) editExistingOperatorSelect.appendChild(option3);
    });
    
    // Update operator selection in time study
    if (studyOperatorId) {
        studyOperatorId.addEventListener('change', function() {
            const operatorId = this.value;
            if (operatorId) {
                const operator = operators.find(op => op.operatorId === operatorId);
                if (operator && operator.sewLine && elements.studyLineNo) {
                    elements.studyLineNo.value = operator.sewLine;
                    // Also trigger auto-fill for the line
                    setTimeout(() => {
                        autoFillStyleAndProduct(operator.sewLine, 'study');
                    }, 100);
                }
            }
        });
    }
}

// Populate line filter
function populateLineFilter() {
    const lineFilter = document.getElementById('lineFilter');
    const perfLineFilter = document.getElementById('perfLineFilter');
    const dashboardLineFilter = document.getElementById('dashboardLineFilter');
    const timeStudiesLineSelect = document.getElementById('timeStudiesLineSelect');
    const bottleneckLineSelect = document.getElementById('bottleneckLineSelect');
    const highPriorityLineSelect = document.getElementById('highPriorityLineSelect'); // NEW
    
    // Clear and add default option
    [lineFilter, perfLineFilter, dashboardLineFilter, timeStudiesLineSelect, bottleneckLineSelect, highPriorityLineSelect].forEach(select => {
        if (select) {
            select.innerHTML = select.id === 'dashboardLineFilter' || select.id === 'timeStudiesLineSelect' || 
                              select.id === 'bottleneckLineSelect' || select.id === 'highPriorityLineSelect'
                ? '<option value="">All Lines</option>' 
                : '<option value="">Filter by Sew Line...</option>';
        }
    });
    
    // Collect unique sew lines from supervisor mapping
    const sewLines = Object.keys(supervisorMapping).sort();
    
    // Add options
    sewLines.forEach(line => {
        const option1 = document.createElement('option');
        option1.value = line;
        option1.textContent = line;
        if (lineFilter) lineFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = line;
        option2.textContent = line;
        if (perfLineFilter) perfLineFilter.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = line;
        option3.textContent = line;
        if (dashboardLineFilter) dashboardLineFilter.appendChild(option3);
        
        const option4 = document.createElement('option');
        option4.value = line;
        option4.textContent = line;
        if (timeStudiesLineSelect) timeStudiesLineSelect.appendChild(option4);
        
        const option5 = document.createElement('option');
        option5.value = line;
        option5.textContent = line;
        if (bottleneckLineSelect) bottleneckLineSelect.appendChild(option5);
        
        // NEW: Add option for high priority line select
        const option6 = document.createElement('option');
        option6.value = line;
        option6.textContent = line;
        if (highPriorityLineSelect) highPriorityLineSelect.appendChild(option6);
    });
}

// Populate dashboard line select
function populateDashboardLineSelect() {
    const dashboardLineSelect = document.getElementById('dashboardLineSelect');
    
    if (!dashboardLineSelect) return;
    
    // Clear existing options
    dashboardLineSelect.innerHTML = '<option value="">All Lines</option>';
    
    // Collect unique lines from supervisor mapping
    const lines = Object.keys(supervisorMapping).sort();
    
    // Add options
    lines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        dashboardLineSelect.appendChild(option);
    });
}

// Populate operators line filter
function populateOperatorsLineFilter() {
    const operatorsLineFilter = document.getElementById('operatorsLineFilter');
    
    if (!operatorsLineFilter) return;
    
    // Clear existing options
    operatorsLineFilter.innerHTML = '<option value="">All Lines</option>';
    
    // Collect unique lines from supervisor mapping
    const lines = Object.keys(supervisorMapping).sort();
    
    // Add options
    lines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        operatorsLineFilter.appendChild(option);
    });
}

// Update machine usage statistics - UPDATED: Added text wrapping for machine names
function updateMachineUsageStats() {
    const machineUsage = {};
    
    // Count unique operators per machine
    performanceData.forEach(record => {
        let machineName = record.machineName || 'Unknown';
        if (record.machineName === 'Others' && record.customMachineName) {
            machineName = record.customMachineName;
        }
        
        if (!machineUsage[machineName]) {
            machineUsage[machineName] = new Set();
        }
        machineUsage[machineName].add(record.operatorId);
    });
    
    // Convert to counts
    const machineOperatorCounts = {};
    Object.keys(machineUsage).forEach(machine => {
        const count = machineUsage[machine].size;
        // Only include machines with count >= 1
        if (count >= 1) {
            machineOperatorCounts[machine] = count;
        }
    });
    
    // Sort by count descending
    const sortedMachines = Object.entries(machineOperatorCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Update dashboard machine usage with text wrapping
    updateDashboardMachineUsage(sortedMachines);
}

// Update dashboard machine usage with text wrapping
function updateDashboardMachineUsage(sortedMachines) {
    if (!elements.dashboardMachineUsage) return;
    
    if (sortedMachines.length === 0) {
        elements.dashboardMachineUsage.innerHTML = `
            <div class="machine-usage-item">
                <span class="machine-name" style="white-space: normal; word-wrap: break-word; text-align: left;">No data available</span>
                <span class="machine-count">0</span>
            </div>
        `;
        return;
    }
    
    let machineHTML = '';
    sortedMachines.slice(0, 5).forEach(([machine, count]) => {
        machineHTML += `
            <div class="machine-usage-item">
                <span class="machine-name" style="white-space: normal; word-wrap: break-word; text-align: left;">${machine}</span>
                <span class="machine-count">${count} operators</span>
            </div>
        `;
    });
    
    elements.dashboardMachineUsage.innerHTML = machineHTML;
}

// Update dashboard
function updateDashboard() {
    updateDashboardStats();
    createDashboardCharts();
    updateGarmentSMVSelectors();
    updateActiveLinesCount();
    updateTimeStudiesCount();
    updateBottleneckCard();
    updateHighPriorityCard(); // NEW: Update high priority card
    updateMachineUsageStats(); // Update machine usage with text wrapping
}

// Update dashboard statistics
function updateDashboardStats() {
    // Total operators with line filter
    const selectedLine = document.getElementById('dashboardLineSelect')?.value || '';
    let filteredOperators = operators;
    
    if (selectedLine) {
        filteredOperators = filteredOperators.filter(op => op.sewLine === selectedLine);
    }
    
    if (elements.dashboardTotalOperators) {
        elements.dashboardTotalOperators.textContent = filteredOperators.length;
    }
    
    // Calculate groups using new multi-skill logic with allocated skills
    let groupACount = 0;
    let groupBCount = 0;
    let groupCCount = 0;
    let groupDCount = 0;
    
    filteredOperators.forEach(operator => {
        const multiSkillGrade = calculateMultiSkillGrade(operator.operatorId);
        
        if (multiSkillGrade === 'Group A') groupACount++;
        else if (multiSkillGrade === 'Group B') groupBCount++;
        else if (multiSkillGrade === 'Group C') groupCCount++;
        else if (multiSkillGrade === 'Group D') groupDCount++;
    });
    
    // Update group cards in the new layout
    if (elements.dashboardGroupACount) elements.dashboardGroupACount.textContent = groupACount;
    if (elements.dashboardGroupBCount) elements.dashboardGroupBCount.textContent = groupBCount;
    if (elements.dashboardGroupCCount) elements.dashboardGroupCCount.textContent = groupCCount;
    if (elements.dashboardGroupDCount) elements.dashboardGroupDCount.textContent = groupDCount;
    
    // Performance metrics
    let filteredPerformance = performanceData;
    const dateRange = document.getElementById('dashboardDateRange')?.value || 'week';
    const now = new Date();
    
    if (dateRange !== 'all') {
        filteredPerformance = filteredPerformance.filter(record => {
            const recordDate = new Date(record.timestamp);
            switch (dateRange) {
                case 'today':
                    return recordDate.toDateString() === now.toDateString();
                case 'week':
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    return recordDate >= weekStart;
                case 'month':
                    return recordDate.getMonth() === now.getMonth() &&
                           recordDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    if (selectedLine) {
        filteredPerformance = filteredPerformance.filter(record => record.lineNo === selectedLine);
    }
    
    const totalOps = filteredPerformance.length;
    if (totalOps === 0) {
        if (elements.dashboardAvgEfficiency) elements.dashboardAvgEfficiency.textContent = '0%';
        if (elements.dashboardAvgSMV) elements.dashboardAvgSMV.textContent = '0.00';
        if (elements.dashboardAvgWorkingSMV) elements.dashboardAvgWorkingSMV.textContent = '0.00';
        if (elements.dashboardTotalOperations) elements.dashboardTotalOperations.textContent = '0';
        return;
    }
    
    const totalEfficiency = filteredPerformance.reduce((sum, record) => sum + (record.efficiency || 0), 0);
    const totalStdSMV = filteredPerformance.reduce((sum, record) => sum + (record.standardSMV || 0), 0);
    const totalWorkingSMV = filteredPerformance.reduce((sum, record) => sum + (record.workingSMV || 0), 0);
    
    if (elements.dashboardAvgEfficiency) elements.dashboardAvgEfficiency.textContent = (totalEfficiency / totalOps).toFixed(1) + '%';
    if (elements.dashboardAvgSMV) elements.dashboardAvgSMV.textContent = (totalStdSMV / totalOps).toFixed(2);
    if (elements.dashboardAvgWorkingSMV) elements.dashboardAvgWorkingSMV.textContent = (totalWorkingSMV / totalOps).toFixed(2);
    if (elements.dashboardTotalOperations) elements.dashboardTotalOperations.textContent = totalOps;
    
    // Update time studies count with line filter
    const timeStudiesLine = document.getElementById('timeStudiesLineSelect')?.value || '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let timeStudiesFiltered = performanceData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= today && record.cycleTimes && record.cycleTimes.length > 0;
    });
    
    if (timeStudiesLine) {
        timeStudiesFiltered = timeStudiesFiltered.filter(record => record.lineNo === timeStudiesLine);
    }
    
    const timeStudiesCount = timeStudiesFiltered.length;
    
    if (elements.dashboardTimeStudiesCount) {
        elements.dashboardTimeStudiesCount.textContent = timeStudiesCount;
    }
}

// Create dashboard charts - UPDATED: Removed weekly trend chart
function createDashboardCharts() {
    // Destroy existing charts if they exist
    if (efficiencyChart) efficiencyChart.destroy();
    if (linePerformanceChart) linePerformanceChart.destroy();
    if (machinePerformanceChart) machinePerformanceChart.destroy();
    if (bottleneckChart) bottleneckChart.destroy();
    
    // 1. Efficiency Distribution Chart
    const efficiencyCtx = document.getElementById('efficiencyChart')?.getContext('2d');
    if (efficiencyCtx) {
        const efficiencyRanges = {
            'Below 70%': 0,
            '70-85%': 0,
            'Above 85%': 0
        };
        
        const selectedLine = document.getElementById('dashboardLineSelect')?.value || '';
        let filteredPerformance = performanceData;
        
        if (selectedLine) {
            filteredPerformance = filteredPerformance.filter(record => record.lineNo === selectedLine);
        }
        
        filteredPerformance.forEach(record => {
            const efficiency = record.efficiency || 0;
            if (efficiency < 70) efficiencyRanges['Below 70%']++;
            else if (efficiency < 85) efficiencyRanges['70-85%']++;
            else efficiencyRanges['Above 85%']++;
        });
        
        efficiencyChart = new Chart(efficiencyCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(efficiencyRanges),
                datasets: [{
                    data: Object.values(efficiencyRanges),
                    backgroundColor: [
                        'rgba(248, 150, 30, 0.8)',
                        'rgba(67, 97, 238, 0.8)',
                        'rgba(76, 201, 240, 0.8)'
                    ],
                    borderColor: [
                        'rgba(248, 150, 30, 1)',
                        'rgba(67, 97, 238, 1)',
                        'rgba(76, 201, 240, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
    
    // 2. Line Performance Chart
    const lineCtx = document.getElementById('linePerformanceChart')?.getContext('2d');
    if (lineCtx) {
        const linePerformance = {};
        
        performanceData.forEach(record => {
            if (record.lineNo && record.efficiency) {
                if (!linePerformance[record.lineNo]) {
                    linePerformance[record.lineNo] = { total: 0, count: 0 };
                }
                linePerformance[record.lineNo].total += record.efficiency || 0;
                linePerformance[record.lineNo].count++;
            }
        });
        
        const linesArray = Object.entries(linePerformance).map(([line, data]) => ({
            line,
            avgEfficiency: data.total / data.count
        }));
        
        linesArray.sort((a, b) => b.avgEfficiency - a.avgEfficiency);
        const topLines = linesArray.slice(0, 8);
        
        linePerformanceChart = new Chart(lineCtx, {
            type: 'bar',
            data: {
                labels: topLines.map(l => l.line),
                datasets: [{
                    label: 'Average Efficiency %',
                    data: topLines.map(l => l.avgEfficiency),
                    backgroundColor: topLines.map(l => {
                        if (l.avgEfficiency >= 85) return 'rgba(76, 201, 240, 0.8)';
                        if (l.avgEfficiency >= 70) return 'rgba(67, 97, 238, 0.8)';
                        return 'rgba(248, 150, 30, 0.8)';
                    }),
                    borderColor: topLines.map(l => {
                        if (l.avgEfficiency >= 85) return 'rgba(76, 201, 240, 1)';
                        if (l.avgEfficiency >= 70) return 'rgba(67, 97, 238, 1)';
                        return 'rgba(248, 150, 30, 1)';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
    
    // 3. Machine Performance Chart
    const machineCtx = document.getElementById('machinePerformanceChart')?.getContext('2d');
    if (machineCtx) {
        const machinePerformance = {};
        
        performanceData.forEach(record => {
            let machineName = record.machineName;
            if (record.machineName === 'Others' && record.customMachineName) {
                machineName = record.customMachineName;
            }
            
            if (machineName && record.efficiency) {
                if (!machinePerformance[machineName]) {
                    machinePerformance[machineName] = { total: 0, count: 0 };
                }
                machinePerformance[machineName].total += record.efficiency;
                machinePerformance[machineName].count++;
            }
        });
        
        const machinesArray = Object.entries(machinePerformance).map(([name, data]) => ({
            name,
            avgEfficiency: data.total / data.count
        }));
        
        machinesArray.sort((a, b) => b.avgEfficiency - a.avgEfficiency);
        const topMachines = machinesArray.slice(0, 8);
        
        // Calculate max value for y-axis (allow for values above 100%)
        const maxEfficiency = Math.max(...topMachines.map(m => m.avgEfficiency));
        const yAxisMax = Math.max(100, Math.ceil(maxEfficiency / 10) * 10);
        
        machinePerformanceChart = new Chart(machineCtx, {
            type: 'bar',
            data: {
                labels: topMachines.map(m => m.name),
                datasets: [{
                    label: 'Average Efficiency %',
                    data: topMachines.map(m => m.avgEfficiency),
                    backgroundColor: 'rgba(248, 37, 133, 0.8)',
                    borderColor: 'rgba(248, 37, 133, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: yAxisMax,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
    
    // 4. Bottleneck Operations Chart
    const bottleneckCtx = document.getElementById('bottleneckChart')?.getContext('2d');
    if (bottleneckCtx) {
        // Get bottleneck operations
        const bottleneckOperations = performanceData.filter(record => record.bottleneck === true);
        
        // Group by operation
        const operationCounts = {};
        bottleneckOperations.forEach(record => {
            const operation = record.operation || 'Unknown';
            if (!operationCounts[operation]) {
                operationCounts[operation] = 0;
            }
            operationCounts[operation]++;
        });
        
        // Sort by count
        const sortedOperations = Object.entries(operationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        bottleneckChart = new Chart(bottleneckCtx, {
            type: 'bar',
            data: {
                labels: sortedOperations.map(([operation]) => operation),
                datasets: [{
                    label: 'Bottleneck Occurrences',
                    data: sortedOperations.map(([, count]) => count),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
}

// Update Bottleneck Card - UPDATED: Beautified with better display
function updateBottleneckCard() {
    const bottleneckLineSelect = document.getElementById('bottleneckLineSelect');
    const bottleneckStyleSelect = document.getElementById('bottleneckStyleSelect');
    const bottleneckOperationsList = document.getElementById('bottleneckOperationsList');
    
    if (!bottleneckLineSelect || !bottleneckOperationsList) return;
    
    const selectedLine = bottleneckLineSelect.value;
    const selectedStyle = bottleneckStyleSelect.value;
    
    // Filter bottleneck operations
    let filteredData = performanceData.filter(record => record.bottleneck === true);
    
    if (selectedLine) {
        filteredData = filteredData.filter(record => record.lineNo === selectedLine);
    }
    
    if (selectedStyle) {
        filteredData = filteredData.filter(record => record.styleNo === selectedStyle);
    }
    
    // Clear existing list
    bottleneckOperationsList.innerHTML = '';
    
    if (filteredData.length === 0) {
        bottleneckOperationsList.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>No bottleneck operations found${selectedLine ? ` for Line ${selectedLine}` : ''}${selectedStyle ? `, Style ${selectedStyle}` : ''}</p>
            </div>
        `;
        return;
    }
    
    // Group by operation and count occurrences
    const operationCounts = {};
    filteredData.forEach(record => {
        const operation = record.operation || 'Unknown';
        if (!operationCounts[operation]) {
            operationCounts[operation] = {
                count: 0,
                records: []
            };
        }
        operationCounts[operation].count++;
        operationCounts[operation].records.push(record);
    });
    
    // Sort by count descending
    const sortedOperations = Object.entries(operationCounts)
        .sort((a, b) => b[1].count - a[1].count);
    
    // Display bottleneck operations with beautified layout
    sortedOperations.forEach(([operation, data]) => {
        const operationItem = document.createElement('div');
        operationItem.className = 'performance-metric-item';
        
        // Get efficiency for this operation
        const avgEfficiency = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.efficiency || 0), 0) / data.records.length : 0;
        
        // Get average SMV
        const avgStandardSMV = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.standardSMV || 0), 0) / data.records.length : 0;
        
        // Get average working SMV
        const avgWorkingSMV = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.workingSMV || 0), 0) / data.records.length : 0;
        
        operationItem.innerHTML = `
            <div class="metric-header">
                <div class="metric-title">${operation}</div>
                <div class="metric-count">${data.count} occurrence${data.count > 1 ? 's' : ''}</div>
            </div>
            <div class="metric-details">
                <div class="metric-row">
                    <div class="metric-column">
                        <span class="metric-label">Avg. Efficiency:</span>
                        <span class="metric-value ${avgEfficiency >= 85 ? 'efficiency-high' : avgEfficiency >= 70 ? 'efficiency-medium' : 'efficiency-low'}">
                            ${avgEfficiency.toFixed(1)}%
                        </span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Std. SMV:</span>
                        <span class="metric-value">${avgStandardSMV.toFixed(2)}</span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Working SMV:</span>
                        <span class="metric-value">${avgWorkingSMV.toFixed(2)}</span>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric-column">
                        <span class="metric-label">Lines:</span>
                        <span class="metric-value">
                            ${[...new Set(data.records.map(r => r.lineNo || 'N/A'))].join(', ')}
                        </span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Operators:</span>
                        <span class="metric-value">
                            ${[...new Set(data.records.map(r => r.operatorName || 'N/A'))].slice(0, 3).join(', ')}
                            ${[...new Set(data.records.map(r => r.operatorName || 'N/A'))].length > 3 ? '...' : ''}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        bottleneckOperationsList.appendChild(operationItem);
    });
}

// NEW: Update High Priority Card - Similar to bottleneck card
function updateHighPriorityCard() {
    const highPriorityLineSelect = document.getElementById('highPriorityLineSelect');
    const highPriorityStyleSelect = document.getElementById('highPriorityStyleSelect');
    const highPriorityOperationsList = document.getElementById('highPriorityOperationsList');
    
    if (!highPriorityLineSelect || !highPriorityOperationsList) return;
    
    const selectedLine = highPriorityLineSelect.value;
    const selectedStyle = highPriorityStyleSelect.value;
    
    // Filter high priority operations (critical to quality)
    let filteredData = performanceData.filter(record => record.criticalToQuality === 'critical');
    
    if (selectedLine) {
        filteredData = filteredData.filter(record => record.lineNo === selectedLine);
    }
    
    if (selectedStyle) {
        filteredData = filteredData.filter(record => record.styleNo === selectedStyle);
    }
    
    // Clear existing list
    highPriorityOperationsList.innerHTML = '';
    
    if (filteredData.length === 0) {
        highPriorityOperationsList.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>No high priority operations found${selectedLine ? ` for Line ${selectedLine}` : ''}${selectedStyle ? `, Style ${selectedStyle}` : ''}</p>
            </div>
        `;
        return;
    }
    
    // Group by operation and count occurrences
    const operationCounts = {};
    filteredData.forEach(record => {
        const operation = record.operation || 'Unknown';
        if (!operationCounts[operation]) {
            operationCounts[operation] = {
                count: 0,
                records: []
            };
        }
        operationCounts[operation].count++;
        operationCounts[operation].records.push(record);
    });
    
    // Sort by count descending
    const sortedOperations = Object.entries(operationCounts)
        .sort((a, b) => b[1].count - a[1].count);
    
    // Display high priority operations with beautified layout
    sortedOperations.forEach(([operation, data]) => {
        const operationItem = document.createElement('div');
        operationItem.className = 'performance-metric-item';
        
        // Get efficiency for this operation
        const avgEfficiency = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.efficiency || 0), 0) / data.records.length : 0;
        
        // Get average SMV
        const avgStandardSMV = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.standardSMV || 0), 0) / data.records.length : 0;
        
        // Get average working SMV
        const avgWorkingSMV = data.records.length > 0 ?
            data.records.reduce((sum, record) => sum + (record.workingSMV || 0), 0) / data.records.length : 0;
        
        // Check if any are also bottleneck
        const bottleneckCount = data.records.filter(r => r.bottleneck).length;
        
        operationItem.innerHTML = `
            <div class="metric-header">
                <div class="metric-title">${operation}</div>
                <div class="metric-count">${data.count} occurrence${data.count > 1 ? 's' : ''}</div>
            </div>
            <div class="metric-details">
                <div class="metric-row">
                    <div class="metric-column">
                        <span class="metric-label">Avg. Efficiency:</span>
                        <span class="metric-value ${avgEfficiency >= 85 ? 'efficiency-high' : avgEfficiency >= 70 ? 'efficiency-medium' : 'efficiency-low'}">
                            ${avgEfficiency.toFixed(1)}%
                        </span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Std. SMV:</span>
                        <span class="metric-value">${avgStandardSMV.toFixed(2)}</span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Working SMV:</span>
                        <span class="metric-value">${avgWorkingSMV.toFixed(2)}</span>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric-column">
                        <span class="metric-label">Lines:</span>
                        <span class="metric-value">
                            ${[...new Set(data.records.map(r => r.lineNo || 'N/A'))].join(', ')}
                        </span>
                    </div>
                    <div class="metric-column">
                        <span class="metric-label">Bottleneck:</span>
                        <span class="metric-value ${bottleneckCount > 0 ? 'bottleneck-yes' : 'bottleneck-no'}">
                            ${bottleneckCount} of ${data.count}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        highPriorityOperationsList.appendChild(operationItem);
    });
}

// Render operators table with new multi-skill logic and serial numbers
function renderOperatorsTable(filteredData = operators) {
    if (!elements.operatorsBody) return;
    
    elements.operatorsBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        elements.operatorsBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 50px;">
                    <i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 15px; display: block;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 10px;">No Operators Found</h3>
                    <p style="color: var(--text-secondary);">Add your first operator to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Show all operators with scroll
    filteredData.forEach((operator, index) => {
        // Calculate multi-skill grade using new logic with allocated skills
        const multiSkillGrade = calculateMultiSkillGrade(operator.operatorId);
        const skillClass = `skill-group-${multiSkillGrade.charAt(multiSkillGrade.length - 1).toLowerCase()}`;
        
        // Calculate skill score based on overall efficiency
        const skillScore = calculateSkillScore(operator.operatorId);
        const skillScoreClass = getSkillScoreClass(skillScore);
        
        // Check if this is the newly added operator
        const isNewOperator = lastAddedOperatorId === operator.operatorId;
        const rowClass = isNewOperator ? 'new-operator-highlight' : '';
        
        const row = document.createElement('tr');
        row.className = rowClass;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="operator-id">${operator.operatorId || ''}</td>
            <td>${operator.name || ''}</td>
            <td style="text-align: center;">${operator.sewLine || '-'}</td>
            <td>
                ${multiSkillGrade ?
                    `<span class="skill-level ${skillClass}">${multiSkillGrade}</span>` :
                    '-'
                }
            </td>
            <td>
                <span class="skill-score ${skillScoreClass}">
                    ${skillScore > 0 ? skillScore.toFixed(2) : '0.00'}
                </span>
            </td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-icon edit-operator" data-id="${operator.operatorId}" title="Edit Operator">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-operator" data-id="${operator.operatorId}" title="Delete Operator">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon view-performance" data-id="${operator.operatorId}" title="View Performance Records">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-icon-timer time-study-operator" data-id="${operator.operatorId}" title="Start Time Study for this Operator">
                        <i class="fas fa-stopwatch"></i>
                    </button>
                    <button class="btn-icon edit-existing-details" data-id="${operator.operatorId}" title="Edit Existing Details">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </td>
        `;
        elements.operatorsBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.edit-operator').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operatorId = e.target.closest('button').getAttribute('data-id');
            openEditModal(operatorId);
        });
    });
    
    document.querySelectorAll('.delete-operator').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operatorId = e.target.closest('button').getAttribute('data-id');
            deleteOperator(operatorId);
        });
    });
    
    document.querySelectorAll('.view-performance').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operatorId = e.target.closest('button').getAttribute('data-id');
            viewOperatorPerformance(operatorId);
        });
    });
    
    document.querySelectorAll('.time-study-operator').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operatorId = e.target.closest('button').getAttribute('data-id');
            startTimeStudyForOperator(operatorId);
        });
    });
    
    document.querySelectorAll('.edit-existing-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operatorId = e.target.closest('button').getAttribute('data-id');
            openEditExistingDetailsModal(operatorId);
        });
    });
    
    // Remove highlight after 10 seconds
    if (lastAddedOperatorId) {
        setTimeout(() => {
            document.querySelectorAll('.new-operator-highlight').forEach(row => {
                row.classList.remove('new-operator-highlight');
            });
            lastAddedOperatorId = null;
        }, 10000);
    }
}

// Open Edit Existing Details Modal - UPDATED: Fixed CTQ and Bottleneck updates
function openEditExistingDetailsModal(operatorId = null) {
    const operator = operatorId ? operators.find(op => op.operatorId === operatorId) : null;
    
    // If operatorId is provided, set it in the dropdown
    if (operator && document.getElementById('editExistingOperatorSelect')) {
        document.getElementById('editExistingOperatorSelect').value = operatorId;
        // Trigger change to load records
        const event = new Event('change');
        document.getElementById('editExistingOperatorSelect').dispatchEvent(event);
    }
    
    // Show modal
    document.getElementById('editExistingDetailsModal').classList.add('active');
}

// Get operator average efficiency
function getOperatorAverageEfficiency(operatorId) {
    const operatorRecords = performanceData.filter(record => record.operatorId === operatorId);
    if (operatorRecords.length === 0) return 0;
    
    const totalEfficiency = operatorRecords.reduce((sum, record) => sum + (record.efficiency || 0), 0);
    return totalEfficiency / operatorRecords.length;
}

// Start time study for specific operator
function startTimeStudyForOperator(operatorId) {
    const operator = operators.find(op => op.operatorId === operatorId);
    if (!operator) {
        showToast('Operator not found!', 'error');
        return;
    }
    
    // Switch to time study tab
    document.querySelector('.nav-item[data-tab="time-study"]').click();
    
    // Set the operator in the dropdown
    const studyOperatorId = document.getElementById('studyOperatorId');
    if (studyOperatorId) {
        studyOperatorId.value = operatorId;
        
        // Trigger change event
        const event = new Event('change');
        studyOperatorId.dispatchEvent(event);
    }
    
    // Set the line number if operator has a sew line
    if (operator.sewLine && elements.studyLineNo) {
        elements.studyLineNo.value = operator.sewLine;
        
        // Trigger auto-fill
        setTimeout(() => {
            autoFillStyleAndProduct(operator.sewLine, 'study');
        }, 100);
    }
    
    // Focus on operation name field
    const studyOperation = document.getElementById('studyOperation');
    if (studyOperation) {
        studyOperation.focus();
    }
    
    showToast(`Time study ready for ${operator.name}. Enter line number and operation details to begin.`, 'success');
}

// Calculate skill score based on overall efficiency
function calculateSkillScore(operatorId) {
    const operatorPerformances = performanceData.filter(p => p.operatorId === operatorId);
    if (operatorPerformances.length === 0) return 0;
    
    let totalEfficiency = 0;
    let count = 0;
    
    operatorPerformances.forEach(perf => {
        if (perf.efficiency) {
            totalEfficiency += perf.efficiency;
            count++;
        }
    });
    
    const avgEfficiency = count > 0 ? totalEfficiency / count : 0;
    
    // Convert efficiency to skill score (0.0 - 1.0)
    if (avgEfficiency >= 90) return 0.9 + (avgEfficiency - 90) * 0.01;
    else if (avgEfficiency >= 80) return 0.7 + (avgEfficiency - 80) * 0.02;
    else if (avgEfficiency >= 70) return 0.4 + (avgEfficiency - 70) * 0.03;
    else if (avgEfficiency >= 60) return 0.2 + (avgEfficiency - 60) * 0.02;
    else return avgEfficiency * 0.0033;
}

// Get skill score class based on value
function getSkillScoreClass(score) {
    if (score >= 0.67) return 'group-a';
    else if (score >= 0.34) return 'group-b';
    else if (score >= 0.1) return 'group-c';
    else return 'group-d';
}

// Update statistics - UPDATED: Removed 4 cards from operator tab
function updateStats() {
    const selectedLine = document.getElementById('operatorsLineFilter')?.value || '';
    let filteredOperators = operators;
    
    if (selectedLine) {
        filteredOperators = filteredOperators.filter(op => op.sewLine === selectedLine);
    }
    
    // UPDATED: Only update the operators table, removed 4 cards
    // The table rendering is handled in renderOperatorsTable
}

// Update summary stats - UPDATED: Removed time study summary
function updateSummaryStats() {
    // Performance summary
    const totalRecords = performanceData.length;
    const totalEfficiency = performanceData.reduce((sum, record) => sum + (record.efficiency || 0), 0);
    const avgEfficiency = totalRecords > 0 ? (totalEfficiency / totalRecords) : 0;
    
    // UPDATED: Only update performance metrics, removed time study summary
}

// Update performance statistics - UPDATED: Removed average efficiency card
function updatePerformanceStats() {
    // UPDATED: This function is no longer needed as we removed the average efficiency card
    // Performance stats are now handled by updateDashboardStats
}

// Render performance table with edit button and serial numbers - UPDATED: Fixed CTQ display
function renderPerformanceTable(filteredData = performanceData) {
    if (!elements.performanceBody) return;
    
    elements.performanceBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        elements.performanceBody.innerHTML = `
            <tr>
                <td colspan="18" style="text-align: center; padding: 50px;">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 15px; display: block;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 10px;">No Performance Data Found</h3>
                    <p style="color: var(--text-secondary);">Add your first performance record to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Show all performance records with scroll
    filteredData.forEach((record, index) => {
        const formattedDate = record.timestamp ? record.timestamp.toLocaleString() : 'N/A';
        const efficiency = record.efficiency || 0;
        const efficiencyClass = efficiency >= 85 ? 'efficiency-high' :
                              efficiency >= 70 ? 'efficiency-medium' : 'efficiency-low';
        
        // Get machine name
        let machineName = record.machineName || '-';
        if (record.machineName === 'Others' && record.customMachineName) {
            machineName = record.customMachineName;
        }
        
        // Get other machines with efficiencies
        let otherMachinesDisplay = '-';
        let otherMachineEfficiencyDisplay = '-';
        if (record.otherMachines) {
            const otherMachines = record.otherMachines.split(', ');
            const efficiencies = record.otherMachineEfficiencies || {};
            otherMachinesDisplay = otherMachines.join(', ');
            otherMachineEfficiencyDisplay = otherMachines.map(machine => {
                const efficiency = efficiencies[machine] || 0;
                return `${efficiency.toFixed(1)}%`;
            }).join(', ');
        }
        
        // Format CTQ/Bottleneck
        const ctqDisplay = record.criticalToQuality === 'critical' ? 
            '<span class="ctq-badge critical">Critical</span>' : 
            record.criticalToQuality === 'not-critical' ? 
            '<span class="ctq-badge not-critical">Not Critical</span>' : 
            '-';
        
        const bottleneckDisplay = record.bottleneck ? 
            '<span class="bottleneck-badge yes">Yes</span>' : 
            '<span class="bottleneck-badge no">No</span>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDate}</td>
            <td>${record.lineNo || '-'}</td>
            <td>${record.styleNo || '-'}</td>
            <td>${record.productDesc || '-'}</td>
            <td>${record.operatorId || '-'}</td>
            <td>${record.operatorName || '-'}</td>
            <td>${record.operation || '-'}</td>
            <td>${machineName}</td>
            <td>${otherMachinesDisplay}</td>
            <td>${record.standardSMV ? record.standardSMV.toFixed(2) : '-'}</td>
            <td class="working-smv-cell">
                <button class="working-smv-btn" data-id="${record.id}">
                    ${record.workingSMV ? record.workingSMV.toFixed(2) : '0.00'}
                </button>
            </td>
            <td class="${efficiencyClass}">${efficiency ? efficiency.toFixed(1) + '%' : '-'}</td>
            <td>${otherMachineEfficiencyDisplay}</td>
            <td>${record.operationGrade || '-'}</td>
            <td>${ctqDisplay}</td>
            <td>${bottleneckDisplay}</td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-icon delete-perf-btn" data-id="${record.id}" title="Delete Record">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon edit-perf-btn" data-id="${record.id}" title="Edit Record">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        elements.performanceBody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.working-smv-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const recordId = e.target.closest('button').getAttribute('data-id');
            showCycleTimesDetail(recordId);
        });
    });
    
    document.querySelectorAll('.delete-perf-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('button').getAttribute('data-id');
            if (confirm('Are you sure you want to delete this performance record?')) {
                await deletePerformanceRecord(id);
            }
        });
    });
    
    document.querySelectorAll('.edit-perf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const recordId = e.target.closest('button').getAttribute('data-id');
            openEditPerformanceModal(recordId);
        });
    });
}

// Open edit performance modal - UPDATED: Fixed CTQ dropdown and bottleneck checkbox
function openEditPerformanceModal(recordId) {
    const record = performanceData.find(r => r.id === recordId);
    if (!record) return;
    
    document.getElementById('editRecordId').textContent = recordId;
    document.getElementById('editRecordOperator').textContent = `${record.operatorName} (${record.operatorId})`;
    document.getElementById('editRecordStdSMV').value = record.standardSMV || 0;
    document.getElementById('editRecordWorkingSMV').value = record.workingSMV || 0;
    document.getElementById('editRecordOperationGrade').value = record.operationGrade || '';
    document.getElementById('editRecordCycleTimes').value = record.cycleTimes ? record.cycleTimes.join(', ') : '';
    
    // UPDATED: Set CTQ dropdown and Bottleneck checkbox
    const ctqDropdown = document.getElementById('editRecordCTQ');
    if (ctqDropdown && record.criticalToQuality) {
        ctqDropdown.value = record.criticalToQuality;
    }
    
    const bottleneckCheckbox = document.getElementById('editRecordBottleneck');
    if (bottleneckCheckbox) {
        bottleneckCheckbox.checked = record.bottleneck || false;
    }
    
    document.getElementById('editPerformanceModal').classList.add('active');
}

// Open edit modal
function openEditModal(operatorId) {
    const operator = operators.find(op => op.operatorId === operatorId);
    if (!operator) {
        showToast('Operator not found!', 'error');
        return;
    }
    
    selectedOperatorId = operatorId;
    document.getElementById('editOperatorId').textContent = operatorId;
    document.getElementById('editOperatorName').textContent = operator.name || '';
    document.getElementById('editSewLine').value = operator.sewLine || '';
    
    // Calculate multi-skill grade with allocated skills
    const multiSkillGrade = calculateMultiSkillGrade(operatorId);
    document.getElementById('editSkillLevel').value = multiSkillGrade;
    
    // Calculate and set skill score
    const skillScore = calculateSkillScore(operatorId);
    document.getElementById('editSkillScore').value = skillScore.toFixed(2);
    const scoreSlider = document.getElementById('scoreSlider');
    if (scoreSlider) {
        scoreSlider.value = Math.round(skillScore * 100);
    }
    
    document.getElementById('editCellModal').classList.add('active');
}

// View operator performance records
function viewOperatorPerformance(operatorId) {
    const operator = operators.find(op => op.operatorId === operatorId);
    if (!operator) {
        showToast('Operator not found!', 'error');
        return;
    }
    
    const operatorRecords = performanceData.filter(record => record.operatorId === operatorId);
    
    if (operatorRecords.length === 0) {
        showToast(`No performance records found for operator ${operator.name}. Create one in the time study tab.`, 'error');
        return;
    }
    
    // Switch to performance tab
    document.querySelector('.nav-item[data-tab="performance"]').click();
    
    // Filter by operator
    const searchPerformance = document.getElementById('searchPerformance');
    if (searchPerformance) {
        searchPerformance.value = operatorId;
        filterPerformanceData();
    }
    
    // Highlight the records
    setTimeout(() => {
        const rows = document.querySelectorAll('#performanceBody tr');
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 6 && cells[5].textContent === operatorId) {
                row.classList.add('highlight-row');
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    row.classList.remove('highlight-row');
                }, 3000);
            }
        });
        
        showToast(`Showing ${operatorRecords.length} performance records for ${operator.name}`, 'success');
    }, 500);
}

// Filter operators
function filterOperators() {
    let filtered = operators;
    const searchTerm = elements.searchInput?.value.toLowerCase() || '';
    const selectedLine = document.getElementById('operatorsLineFilter')?.value || '';
    
    if (searchTerm) {
        filtered = filtered.filter(operator =>
            (operator.operatorId && operator.operatorId.toLowerCase().includes(searchTerm)) ||
            (operator.name && operator.name.toLowerCase().includes(searchTerm)) ||
            (operator.sewLine && operator.sewLine.toLowerCase().includes(searchTerm))
        );
    }
    
    const skillLevel = elements.skillFilter?.value || '';
    if (skillLevel) {
        filtered = filtered.filter(operator => {
            const multiSkillGrade = calculateMultiSkillGrade(operator.operatorId);
            return multiSkillGrade === skillLevel;
        });
    }
    
    const sewLine = elements.lineFilter?.value || '';
    if (sewLine) {
        filtered = filtered.filter(operator =>
            operator.sewLine && operator.sewLine.toLowerCase().includes(sewLine.toLowerCase())
        );
    }
    
    if (selectedLine) {
        filtered = filtered.filter(operator => operator.sewLine === selectedLine);
    }
    
    renderOperatorsTable(filtered);
}

// Filter performance data
function filterPerformanceData() {
    const searchTerm = document.getElementById('searchPerformance')?.value.toLowerCase() || '';
    const lineFilter = document.getElementById('perfLineFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    
    let filtered = performanceData;
    
    if (searchTerm) {
        filtered = filtered.filter(record =>
            (record.operatorId && record.operatorId.toLowerCase().includes(searchTerm)) ||
            (record.operatorName && record.operatorName.toLowerCase().includes(searchTerm)) ||
            (record.styleNo && record.styleNo.toLowerCase().includes(searchTerm)) ||
            (record.productDesc && record.productDesc.toLowerCase().includes(searchTerm))
        );
    }
    
    if (lineFilter) {
        filtered = filtered.filter(record => record.lineNo === lineFilter);
    }
    
    if (dateFilter) {
        const now = new Date();
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.timestamp);
            switch (dateFilter) {
                case 'today':
                    return recordDate.toDateString() === now.toDateString();
                case 'week':
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    return recordDate >= weekStart;
                case 'month':
                    return recordDate.getMonth() === now.getMonth() &&
                           recordDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    renderPerformanceTable(filtered);
}

// Save operator with skill score
async function saveOperator(operatorData, isEdit = false) {
    try {
        let result;
        
        if (isEdit) {
            // Find the operator document
            const operator = operators.find(op => op.operatorId === selectedOperatorId);
            if (!operator) {
                throw new Error('Operator not found');
            }
            
            const operatorRef = doc(db, 'operators', operator.id);
            
            // Calculate skill score from performance
            const skillScore = calculateSkillScore(selectedOperatorId);
            
            result = await updateDoc(operatorRef, {
                sewLine: operatorData.sewLine,
                skillLevel: operatorData.skillLevel,
                skillScore: skillScore,
                lastUpdated: serverTimestamp()
            });
            
            showToast('Operator updated successfully!');
        } else {
            // Check if operator ID already exists
            const existingOperator = operators.find(op => op.operatorId === operatorData.operatorId);
            if (existingOperator) {
                throw new Error('Operator ID already exists!');
            }
            
            const docRef = doc(collection(db, 'operators'));
            result = await setDoc(docRef, {
                operatorId: operatorData.operatorId,
                name: operatorData.name,
                sewLine: operatorData.sewLine || null,
                skillLevel: operatorData.skillLevel || null,
                skillScore: 0,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });
            
            // Set last added operator for highlighting
            lastAddedOperatorId = operatorData.operatorId;
            
            showToast('Operator added successfully!');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving operator:', error);
        showToast('Error: ' + error.message, 'error');
        return false;
    }
}

// Delete operator
async function deleteOperator(operatorId) {
    if (!confirm(`Are you sure you want to delete operator ${operatorId}?`)) {
        return;
    }
    
    try {
        const operator = operators.find(op => op.operatorId === operatorId);
        if (!operator) {
            throw new Error('Operator not found');
        }
        
        await deleteDoc(doc(db, 'operators', operator.id));
        showToast('Operator deleted successfully!');
    } catch (error) {
        console.error('Error deleting operator:', error);
        showToast('Error deleting operator: ' + error.message, 'error');
    }
}

// Reset time study form - UPDATED: Replaced CTQ radio buttons with dropdown
function resetTimeStudyForm() {
    // Don't clear line number, style, and product desc
    // Let them be auto-filled when user enters line number
    
    const studyOperatorId = document.getElementById('studyOperatorId');
    if (studyOperatorId) studyOperatorId.value = '';
    // Keep line number field for auto-fill
    const studyOperation = document.getElementById('studyOperation');
    if (studyOperation) studyOperation.value = '';
    const studyMachine = document.getElementById('studyMachine');
    if (studyMachine) studyMachine.value = '';
    const customMachineName = document.getElementById('customMachineName');
    if (customMachineName) customMachineName.value = '';
    const customMachineRow = document.getElementById('customMachineRow');
    if (customMachineRow) customMachineRow.style.display = 'none';
    const standardSMV = document.getElementById('standardSMV');
    if (standardSMV) standardSMV.value = '';
    const operationGrade = document.getElementById('operationGrade');
    if (operationGrade) operationGrade.value = '';
    
    // UPDATED: Reset CTQ dropdown
    const ctqDropdown = document.getElementById('studyCTQ');
    if (ctqDropdown) {
        ctqDropdown.value = '';
    }
    
    // UPDATED: Reset bottleneck checkbox
    const bottleneckCheckbox = document.getElementById('bottleneckCheckbox');
    if (bottleneckCheckbox) {
        bottleneckCheckbox.parentElement.style.display = 'block';
        bottleneckCheckbox.checked = false;
    }
    
    // Reset stopwatch
    resetStopwatch();
    
    // Reset manual inputs
    const manualCycleInputs = document.getElementById('manualCycleInputs');
    if (manualCycleInputs) manualCycleInputs.style.display = 'none';
    document.querySelectorAll('.manual-cycle-time').forEach(input => {
        input.value = '';
    });
    
    // Hide allowance info
    if (elements.allowanceInfo) {
        elements.allowanceInfo.style.display = 'none';
    }
    
    // Reset other machines selection
    const selectedOtherMachines = document.getElementById('selectedOtherMachines');
    if (selectedOtherMachines) {
        selectedOtherMachines.innerHTML = '';
    }
    
    // Uncheck all other machine checkboxes
    document.querySelectorAll('#otherMachinesOptions input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Show toast notification
function showToast(message, type = 'success') {
    if (!elements.notificationToast || !elements.toastMessage) return;
    
    elements.toastMessage.textContent = message;
    const toast = elements.notificationToast;
    const icon = toast.querySelector('i');
    
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('toast-error');
        if (icon) icon.className = 'fas fa-exclamation-circle';
    } else {
        toast.classList.add('toast-success');
        if (icon) icon.className = 'fas fa-check-circle';
    }
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Enhanced Working SMV breakdown modal
function showCycleTimesDetail(recordId) {
    const record = performanceData.find(r => r.id === recordId);
    if (!record) return;
    
    // Populate modal with data
    const detailOperatorName = document.getElementById('detailOperatorName');
    const detailOperation = document.getElementById('detailOperation');
    const detailStdSMV = document.getElementById('detailStdSMV');
    const detailWorkingSMV = document.getElementById('detailWorkingSMV');
    const detailEfficiency = document.getElementById('detailEfficiency');
    const detailVariance = document.getElementById('detailVariance');
    const cycleTimesList = document.getElementById('cycleTimesList');
    
    if (detailOperatorName) detailOperatorName.textContent = record.operatorName || 'Unknown';
    if (detailOperation) detailOperation.textContent = record.operation || 'Unknown';
    if (detailStdSMV) detailStdSMV.textContent = record.standardSMV ? record.standardSMV.toFixed(2) : '0.00';
    if (detailWorkingSMV) detailWorkingSMV.textContent = record.workingSMV ? record.workingSMV.toFixed(2) : '0.00';
    if (detailEfficiency) detailEfficiency.textContent = record.efficiency ? record.efficiency.toFixed(1) + '%' : '0%';
    
    // Calculate variance
    const variance = record.standardSMV > 0 ? 
        ((record.workingSMV - record.standardSMV) / record.standardSMV) * 100 : 0;
    if (detailVariance) detailVariance.textContent = variance.toFixed(1) + '%';
    
    // Populate cycle times list
    if (cycleTimesList) {
        cycleTimesList.innerHTML = '';
        
        if (record.cycleTimes && record.cycleTimes.length > 0) {
            let totalTime = 0;
            record.cycleTimes.forEach((time, index) => {
                totalTime += time;
                const row = document.createElement('div');
                row.className = 'lap-item';
                row.innerHTML = `
                    <div class="lap-number">Cycle ${index + 1}</div>
                    <div class="lap-time">${time.toFixed(3)} seconds</div>
                `;
                cycleTimesList.appendChild(row);
            });
            
            // Add average
            const avgRow = document.createElement('div');
            avgRow.className = 'lap-item';
            avgRow.style.backgroundColor = 'rgba(76, 201, 240, 0.1)';
            avgRow.innerHTML = `
                <div class="lap-number"><strong>Average</strong></div>
                <div class="lap-time"><strong>${(totalTime / record.cycleTimes.length).toFixed(3)} seconds</strong></div>
            `;
            cycleTimesList.appendChild(avgRow);
        } else {
            cycleTimesList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No cycle time data available</div>';
        }
    }
    
    // Show modal
    document.getElementById('cycleDetailModal').classList.add('active');
}

// Setup multi-select for other machines
function setupMultiSelect() {
    const timeStudyOtherMachinesOptions = document.getElementById('otherMachinesOptions');
    const perfOtherMachinesOptions = document.getElementById('perfOtherMachinesOptions');
    
    // Clear existing options
    if (timeStudyOtherMachinesOptions) timeStudyOtherMachinesOptions.innerHTML = '';
    if (perfOtherMachinesOptions) perfOtherMachinesOptions.innerHTML = '';
    
    // Add grouped options
    Object.entries(machineFamilies).forEach(([family, machines]) => {
        // Time study options
        if (timeStudyOtherMachinesOptions) {
            const groupDiv1 = document.createElement('div');
            groupDiv1.className = 'multi-select-option-group';
            groupDiv1.innerHTML = `<div class="option-group-label">${family}</div>`;
            
            machines.forEach(machine => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'multi-select-option';
                optionDiv.innerHTML = `
                    <input type="checkbox" value="${machine}">
                    <span>${machine}</span>
                `;
                groupDiv1.appendChild(optionDiv);
            });
            
            timeStudyOtherMachinesOptions.appendChild(groupDiv1);
        }
        
        // Performance modal options
        if (perfOtherMachinesOptions) {
            const groupDiv2 = document.createElement('div');
            groupDiv2.className = 'multi-select-option-group';
            groupDiv2.innerHTML = `<div class="option-group-label">${family}</div>`;
            
            machines.forEach(machine => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'multi-select-option';
                optionDiv.innerHTML = `
                    <input type="checkbox" value="${machine}">
                    <span>${machine}</span>
                `;
                groupDiv2.appendChild(optionDiv);
            });
            
            perfOtherMachinesOptions.appendChild(groupDiv2);
        }
    });
    
    // Setup event listeners for multi-select
    setupMultiSelectEvents('otherMachinesSelect', 'otherMachinesOptions', 'selectedOtherMachines');
    setupMultiSelectEvents('perfOtherMachinesSelect', 'perfOtherMachinesOptions', 'perfSelectedOtherMachines');
}

function setupMultiSelectEvents(selectId, optionsId, selectedId) {
    const select = document.getElementById(selectId);
    const options = document.getElementById(optionsId);
    const selected = document.getElementById(selectedId);
    
    if (!select || !options || !selected) return;
    
    const display = select.querySelector('.multi-select-display');
    if (display) {
        display.addEventListener('click', () => {
            options.classList.toggle('show');
        });
    }
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!select.contains(e.target)) {
            options.classList.remove('show');
        }
    });
    
    // Handle checkbox changes
    options.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const value = e.target.value;
            const checked = e.target.checked;
            
            if (checked) {
                // Add tag
                const tag = document.createElement('div');
                tag.className = 'selected-tag';
                tag.innerHTML = `
                    ${value}
                    <i class="fas fa-times" data-value="${value}"></i>
                `;
                selected.appendChild(tag);
            } else {
                // Remove tag
                const tag = selected.querySelector(`.selected-tag i[data-value="${value}"]`)?.parentElement;
                if (tag) {
                    tag.remove();
                }
            }
        }
    });
    
    // Handle tag removal
    selected.addEventListener('click', (e) => {
        if (e.target.classList.contains('fa-times')) {
            const value = e.target.getAttribute('data-value');
            const checkbox = options.querySelector(`input[value="${value}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
            e.target.parentElement.remove();
        }
    });
}

// Modal close functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Highlight new operator after adding
function highlightNewOperator(operatorId) {
    lastAddedOperatorId = operatorId;
    
    // Switch to operators tab
    const operatorsNav = document.querySelector('.nav-item[data-tab="operators"]');
    if (operatorsNav) {
        operatorsNav.click();
    }
    
    // Sort operators by ID for refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Reset sorting
            lastAddedOperatorId = null;
            renderOperatorsTable(operators);
        });
    }
}

// Show group operators modal
function showGroupOperators(group, source = 'dashboard') {
    let filteredOperators = operators.filter(operator => {
        const multiSkillGrade = calculateMultiSkillGrade(operator.operatorId);
        return multiSkillGrade === group;
    });
    
    // Apply line filter if selected
    const lineFilterId = source === 'dashboard' ? 'dashboardLineSelect' : 'operatorsLineFilter';
    const selectedLine = document.getElementById(lineFilterId)?.value || '';
    
    if (selectedLine) {
        filteredOperators = filteredOperators.filter(op => op.sewLine === selectedLine);
    }
    
    if (filteredOperators.length === 0) {
        showToast(`No operators found in ${group}${selectedLine ? ` for line ${selectedLine}` : ''}`, 'error');
        return;
    }
    
    // Calculate average efficiency for the group
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    
    filteredOperators.forEach(operator => {
        const operatorEfficiency = getOperatorAverageEfficiency(operator.operatorId);
        if (operatorEfficiency > 0) {
            totalEfficiency += operatorEfficiency;
            efficiencyCount++;
        }
    });
    
    const avgEfficiency = efficiencyCount > 0 ? (totalEfficiency / efficiencyCount) : 0;
    
    // Update modal title and info
    if (elements.groupModalTitle) {
        elements.groupModalTitle.textContent = `${group} Operators${selectedLine ? ` - Line ${selectedLine}` : ''}`;
    }
    if (elements.groupOperatorCount) {
        elements.groupOperatorCount.textContent = filteredOperators.length;
    }
    if (elements.groupAvgEfficiency) {
        elements.groupAvgEfficiency.textContent = avgEfficiency.toFixed(1) + '%';
    }
    
    // Set group description
    let description = '';
    if (group === 'Group A') {
        description = 'Grade A: 3+ machine types, with at least 1 machine at A grade, others at B or C';
    } else if (group === 'Group B') {
        description = 'Grade B: 2+ machine types, with at least 1 machine at B grade, the other at C';
    } else if (group === 'Group C') {
        description = 'Grade C: 2 machine types, both at C grade';
    } else {
        description = 'Grade D: Only manual operations, but can handle 1 machine at D grade';
    }
    if (elements.groupDescription) {
        elements.groupDescription.textContent = description;
    }
    
    // Render group operators with serial numbers
    renderGroupOperatorsList(filteredOperators, 'skillScore');
    
    // Show modal
    document.getElementById('groupOperatorsModal').classList.add('active');
}

// Render group operators list with sorting and serial numbers
function renderGroupOperatorsList(operatorsList, sortBy = 'skillScore') {
    if (!elements.groupOperatorsList) return;
    
    // Sort operators
    let sortedOperators = [...operatorsList];
    
    switch (sortBy) {
        case 'skillScore':
            sortedOperators.sort((a, b) => {
                const scoreA = calculateSkillScore(a.operatorId);
                const scoreB = calculateSkillScore(b.operatorId);
                return scoreB - scoreA;
            });
            break;
        case 'efficiency':
            sortedOperators.sort((a, b) => {
                const effA = getOperatorAverageEfficiency(a.operatorId);
                const effB = getOperatorAverageEfficiency(b.operatorId);
                return effB - effA;
            });
            break;
        case 'name':
            sortedOperators.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'line':
            sortedOperators.sort((a, b) => (a.sewLine || '').localeCompare(b.sewLine || ''));
            break;
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('groupSearchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        sortedOperators = sortedOperators.filter(operator =>
            (operator.operatorId && operator.operatorId.toLowerCase().includes(searchTerm)) ||
            (operator.name && operator.name.toLowerCase().includes(searchTerm)) ||
            (operator.sewLine && operator.sewLine.toLowerCase().includes(searchTerm))
        );
    }
    
    // Populate operators list with serial numbers
    elements.groupOperatorsList.innerHTML = '';
    
    if (sortedOperators.length === 0) {
        elements.groupOperatorsList.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                <p>No operators found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.innerHTML = `
        <thead>
            <tr>
                <th>S.No.</th>
                <th>Operator ID</th>
                <th>Name</th>
                <th>Line</th>
                <th>Skill Score</th>
            </tr>
        </thead>
        <tbody id="groupOperatorsTableBody">
        </tbody>
    `;
    elements.groupOperatorsList.appendChild(table);
    
    const tableBody = document.getElementById('groupOperatorsTableBody');
    if (!tableBody) return;
    
    sortedOperators.forEach((operator, index) => {
        const skillScore = calculateSkillScore(operator.operatorId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${operator.operatorId}</td>
            <td>${operator.name}</td>
            <td>${operator.sewLine || 'No line'}</td>
            <td>${skillScore.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Setup manual cycle inputs
function setupManualCycleInputs(count) {
    const manualCycleGrid = document.getElementById('manualCycleGrid');
    if (!manualCycleGrid) return;
    
    manualCycleGrid.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const cycleDiv = document.createElement('div');
        cycleDiv.className = 'cycle-input-group';
        cycleDiv.innerHTML = `
            <label>Cycle ${i} (seconds)</label>
            <input type="number" class="manual-cycle-time" step="0.001" placeholder="e.g., 25.345">
        `;
        manualCycleGrid.appendChild(cycleDiv);
    }
}

// Save performance data from time study WITH GENERAL ALLOWANCE - UPDATED: CTQ dropdown
async function saveTimeStudyData() {
    try {
        const operatorId = document.getElementById('studyOperatorId')?.value;
        const operator = operators.find(op => op.operatorId === operatorId);
        if (!operator) {
            showToast('Please select a valid operator', 'error');
            return false;
        }
        
        if (lapTimes.length === 0) {
            showToast('Please record at least one cycle time', 'error');
            return false;
        }
        
        const avgTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        
        // Use general allowance of 16.67%
        const workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE/100);
        const standardSMV = parseFloat(document.getElementById('standardSMV')?.value) || 0;
        
        if (!standardSMV || standardSMV <= 0) {
            showToast('Please enter a valid Standard SMV', 'error');
            return false;
        }
        
        const efficiency = (standardSMV / workingSMV) * 100;
        
        // Get operation complexity grade
        const operationGrade = document.getElementById('operationGrade')?.value || '';
        
        // UPDATED: Get CTQ from dropdown and Bottleneck from checkbox
        const ctqDropdown = document.getElementById('studyCTQ');
        const criticalToQuality = ctqDropdown ? ctqDropdown.value : '';
        
        const bottleneckCheckbox = document.getElementById('bottleneckCheckbox');
        const bottleneck = bottleneckCheckbox ? bottleneckCheckbox.checked : false;
        
        // Get custom machine name if applicable
        let customMachineName = '';
        if (document.getElementById('studyMachine')?.value === 'Others') {
            customMachineName = document.getElementById('customMachineName')?.value.trim() || '';
            if (!customMachineName) {
                showToast('Please enter a custom machine name', 'error');
                return false;
            }
        }
        
        // Get other machines
        const otherMachines = [];
        const otherMachineEfficiencies = {};
        document.querySelectorAll('#selectedOtherMachines .selected-tag').forEach(tag => {
            const machineValue = tag.querySelector('i')?.getAttribute('data-value');
            if (machineValue) {
                otherMachines.push(machineValue);
                // For now, set default efficiency of 50% for other machines
                otherMachineEfficiencies[machineValue] = 50;
            }
        });
        
        // Update operator machine skill
        const machineName = document.getElementById('studyMachine')?.value === 'Others' ? 
            customMachineName : document.getElementById('studyMachine')?.value;
        if (machineName) {
            updateOperatorMachineSkill(operatorId, machineName, efficiency);
        }
        
        // Save performance record
        const docRef = doc(collection(db, 'performance'));
        await setDoc(docRef, {
            timestamp: serverTimestamp(),
            lineNo: elements.studyLineNo?.value || '',
            styleNo: elements.studyStyleNo?.value || '',
            productDesc: elements.studyProductDesc?.value || '',
            operatorId: operatorId,
            operatorName: operator.name,
            operation: document.getElementById('studyOperation')?.value || '',
            machineName: document.getElementById('studyMachine')?.value || '',
            customMachineName: customMachineName,
            standardSMV: standardSMV,
            workingSMV: workingSMV,
            efficiency: efficiency,
            operationGrade: operationGrade,
            criticalToQuality: criticalToQuality,
            bottleneck: bottleneck,
            otherMachines: otherMachines.join(', '),
            otherMachineEfficiencies: otherMachineEfficiencies,
            cycleTimes: lapTimes,
            avgCycleTime: avgTime,
            allowance: GENERAL_ALLOWANCE,
            lastUpdated: serverTimestamp()
        });
        
        showToast('Performance data saved successfully!');
        resetTimeStudyForm();
        return true;
    } catch (error) {
        console.error('Error saving performance data:', error);
        showToast('Error saving data: ' + error.message, 'error');
        return false;
    }
}

// Update performance record with general allowance - UPDATED: CTQ dropdown
async function updatePerformanceRecord(recordId, formData) {
    try {
        const recordRef = doc(db, 'performance', recordId);
        const record = performanceData.find(r => r.id === recordId);
        
        if (!record) {
            throw new Error('Record not found');
        }
        
        // Parse cycle times
        const cycleTimes = formData.cycleTimes
            .split(',')
            .map(time => parseFloat(time.trim()))
            .filter(time => !isNaN(time));
        
        // Recalculate working SMV and efficiency with general allowance
        const avgTime = cycleTimes.length > 0 ? 
            cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0;
        const workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE/100);
        const efficiency = formData.standardSMV > 0 ? 
            (formData.standardSMV / workingSMV) * 100 : 0;
        
        await updateDoc(recordRef, {
            standardSMV: formData.standardSMV,
            workingSMV: workingSMV,
            efficiency: efficiency,
            operationGrade: formData.operationGrade,
            criticalToQuality: formData.criticalToQuality,
            bottleneck: formData.bottleneck,
            cycleTimes: cycleTimes,
            avgCycleTime: avgTime,
            allowance: GENERAL_ALLOWANCE,
            lastUpdated: serverTimestamp()
        });
        
        showToast('Performance record updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating record:', error);
        showToast('Error updating record: ' + error.message, 'error');
        return false;
    }
}

// Delete performance record
async function deletePerformanceRecord(id) {
    try {
        await deleteDoc(doc(db, 'performance', id));
        showToast('Performance record deleted successfully!');
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Error deleting record: ' + error.message, 'error');
    }
}

// Setup event listeners for V22
function setupEventListeners() {
    // Setup mobile menu
    setupMobileMenu();
    
    // Dashboard Tab - UPDATED: Added high priority card refresh
    const dashboardLineSelect = document.getElementById('dashboardLineSelect');
    if (dashboardLineSelect) {
        dashboardLineSelect.addEventListener('change', () => {
            updateDashboard();
        });
    }
    
    const timeStudiesLineSelect = document.getElementById('timeStudiesLineSelect');
    if (timeStudiesLineSelect) {
        timeStudiesLineSelect.addEventListener('change', () => {
            updateTimeStudiesCountForLine(timeStudiesLineSelect.value);
            updateDashboard();
        });
    }
    
    const dashboardDateRange = document.getElementById('dashboardDateRange');
    if (dashboardDateRange) {
        dashboardDateRange.addEventListener('change', () => {
            updateDashboard();
        });
    }
    
    const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', () => {
            updateDashboard();
            showToast('Dashboard refreshed!');
        });
    }
    
    // Bottleneck card refresh button
    const refreshBottleneckBtn = document.getElementById('refreshBottleneckBtn');
    if (refreshBottleneckBtn) {
        refreshBottleneckBtn.addEventListener('click', () => {
            updateBottleneckCard();
            showToast('Bottleneck card refreshed!');
        });
    }
    
    // NEW: High priority card refresh button
    const refreshHighPriorityBtn = document.getElementById('refreshHighPriorityBtn');
    if (refreshHighPriorityBtn) {
        refreshHighPriorityBtn.addEventListener('click', () => {
            updateHighPriorityCard();
            showToast('High priority card refreshed!');
        });
    }
    
    // Clickable Skill Group Cards in dashboard
    const groupCards = [
        { id: 'dashboardGroupACard', group: 'Group A' },
        { id: 'dashboardGroupBCard', group: 'Group B' },
        { id: 'dashboardGroupCCard', group: 'Group C' },
        { id: 'dashboardGroupDCard', group: 'Group D' }
    ];
    
    groupCards.forEach(({ id, group }) => {
        const card = document.getElementById(id);
        if (card) {
            card.addEventListener('click', () => showGroupOperators(group, 'dashboard'));
        }
    });
    
    // Operators Tab
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', filterOperators);
    }
    if (elements.skillFilter) {
        elements.skillFilter.addEventListener('change', filterOperators);
    }
    if (elements.lineFilter) {
        elements.lineFilter.addEventListener('change', filterOperators);
    }
    
    const operatorsLineFilter = document.getElementById('operatorsLineFilter');
    if (operatorsLineFilter) {
        operatorsLineFilter.addEventListener('change', () => {
            updateStats();
            filterOperators();
        });
    }
    
    // Performance Tab - UPDATED: Removed machine usage stats
    const searchPerformance = document.getElementById('searchPerformance');
    if (searchPerformance) {
        searchPerformance.addEventListener('input', filterPerformanceData);
    }
    
    const perfLineFilter = document.getElementById('perfLineFilter');
    if (perfLineFilter) {
        perfLineFilter.addEventListener('change', filterPerformanceData);
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterPerformanceData);
    }
    
    // Action buttons
    const addOperatorBtn = document.getElementById('addOperatorBtn');
    if (addOperatorBtn) {
        addOperatorBtn.addEventListener('click', () => {
            document.getElementById('addOperatorModal').classList.add('active');
            document.getElementById('newOperatorId').focus();
        });
    }
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            showToast('All changes saved to cloud!');
        });
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadData();
            showToast('Refreshing data...');
        });
    }
    
    const addPerformanceBtn = document.getElementById('addPerformanceBtn');
    if (addPerformanceBtn) {
        addPerformanceBtn.addEventListener('click', () => {
            document.getElementById('addPerformanceModal').classList.add('active');
            document.getElementById('perfOperatorId').focus();
        });
    }
    
    const editExistingDetailsBtn = document.getElementById('editExistingDetailsBtn');
    if (editExistingDetailsBtn) {
        editExistingDetailsBtn.addEventListener('click', () => {
            openEditExistingDetailsModal();
        });
    }
    
    // Stopwatch event listeners
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startStopwatch);
    }
    
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseStopwatch);
    }
    
    const lapBtn = document.getElementById('lapBtn');
    if (lapBtn) {
        lapBtn.addEventListener('click', recordLap);
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetStopwatch);
    }
    
    const savePerformanceDataBtn = document.getElementById('savePerformanceData');
    if (savePerformanceDataBtn) {
        savePerformanceDataBtn.addEventListener('click', async () => {
            await saveTimeStudyData();
        });
    }
    
    const resetStopwatchBtn = document.getElementById('resetStopwatch');
    if (resetStopwatchBtn) {
        resetStopwatchBtn.addEventListener('click', () => {
            resetStopwatch();
            if (elements.lapsList) {
                elements.lapsList.innerHTML = '';
            }
            document.getElementById('avgCycleTime').textContent = '0.00';
            document.getElementById('totalCycleTime').textContent = '0.00';
            document.getElementById('workingSMVResult').textContent = '0.00';
            document.getElementById('efficiencyResult').textContent = '0%';
        });
    }
    
    // Cycle count selection
    document.querySelectorAll('input[name="cycleCount"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const value = e.target.value;
            cycleCount = value === 'manual' ? 0 : parseInt(value);
            
            if (value === 'manual') {
                const manualCycleInputs = document.getElementById('manualCycleInputs');
                if (manualCycleInputs) {
                    manualCycleInputs.style.display = 'block';
                }
                // Set up manual inputs
                setupManualCycleInputs(3);
            } else {
                const manualCycleInputs = document.getElementById('manualCycleInputs');
                if (manualCycleInputs) {
                    manualCycleInputs.style.display = 'none';
                }
                if (lapCounter > 0) {
                    if (confirm('Changing cycle count will reset the current measurements. Continue?')) {
                        resetStopwatch();
                    } else {
                        // Revert to previous selection
                        const previousValue = lapCounter >= 5 ? '5' : '3';
                        const prevRadio = document.querySelector(`input[name="cycleCount"][value="${previousValue}"]`);
                        if (prevRadio) {
                            prevRadio.checked = true;
                        }
                    }
                }
            }
        });
    });
    
    // Manual cycle calculation
    const calculateManualBtn = document.getElementById('calculateManualBtn');
    if (calculateManualBtn) {
        calculateManualBtn.addEventListener('click', calculateManualCycles);
    }
    
    const addManualCycleBtn = document.getElementById('addManualCycleBtn');
    if (addManualCycleBtn) {
        addManualCycleBtn.addEventListener('click', () => {
            const cycleNum = document.querySelectorAll('.manual-cycle-time').length + 1;
            const cycleDiv = document.createElement('div');
            cycleDiv.className = 'cycle-input-group';
            cycleDiv.innerHTML = `
                <label>Cycle ${cycleNum} (seconds)</label>
                <input type="number" class="manual-cycle-time" step="0.001" placeholder="e.g., 25.345">
            `;
            const manualCycleGrid = document.getElementById('manualCycleGrid');
            if (manualCycleGrid) {
                manualCycleGrid.appendChild(cycleDiv);
            }
        });
    }
    
    // Machine dropdown with custom option
    const studyMachine = document.getElementById('studyMachine');
    if (studyMachine) {
        studyMachine.addEventListener('change', (e) => {
            if (e.target.value === 'Others') {
                const customMachineRow = document.getElementById('customMachineRow');
                if (customMachineRow) {
                    customMachineRow.style.display = 'block';
                }
            } else {
                const customMachineRow = document.getElementById('customMachineRow');
                if (customMachineRow) {
                    customMachineRow.style.display = 'none';
                    const customMachineName = document.getElementById('customMachineName');
                    if (customMachineName) {
                        customMachineName.value = '';
                    }
                }
            }
            
            // Update allowance display
            updateAllowanceDisplay();
        });
    }
    
    // Update allowance display when custom machine name is entered
    const customMachineName = document.getElementById('customMachineName');
    if (customMachineName) {
        customMachineName.addEventListener('input', () => {
            updateAllowanceDisplay();
        });
    }
    
    const perfMachine = document.getElementById('perfMachine');
    if (perfMachine) {
        perfMachine.addEventListener('change', (e) => {
            if (e.target.value === 'Others') {
                const perfCustomMachineRow = document.getElementById('perfCustomMachineRow');
                if (perfCustomMachineRow) {
                    perfCustomMachineRow.style.display = 'block';
                }
            } else {
                const perfCustomMachineRow = document.getElementById('perfCustomMachineRow');
                if (perfCustomMachineRow) {
                    perfCustomMachineRow.style.display = 'none';
                    const perfCustomMachineName = document.getElementById('perfCustomMachineName');
                    if (perfCustomMachineName) {
                        perfCustomMachineName.value = '';
                    }
                }
            }
        });
    }
    
    // Line number auto-fill for time study
    if (elements.studyLineNo) {
        elements.studyLineNo.addEventListener('change', function() {
            const lineNo = this.value;
            if (lineNo) {
                autoFillStyleAndProduct(lineNo, 'study');
            }
        });
    }
    
    // Line number auto-fill for performance modal
    const perfLineNo = document.getElementById('perfLineNo');
    if (perfLineNo) {
        perfLineNo.addEventListener('change', function() {
            const lineNo = this.value;
            if (lineNo) {
                autoFillStyleAndProduct(lineNo, 'performance');
            }
        });
    }
    
    // Group modal search and sort
    const groupSearchInput = document.getElementById('groupSearchInput');
    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', () => {
            const sortBy = document.getElementById('groupSortBy')?.value || 'skillScore';
            const currentGroup = document.getElementById('groupModalTitle')?.textContent.replace(' Operators', '').split(' - ')[0];
            if (currentGroup) {
                showGroupOperators(currentGroup);
            }
        });
    }
    
    const groupSortBy = document.getElementById('groupSortBy');
    if (groupSortBy) {
        groupSortBy.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            const currentGroup = document.getElementById('groupModalTitle')?.textContent.replace(' Operators', '').split(' - ')[0];
            if (currentGroup) {
                showGroupOperators(currentGroup);
            }
        });
    }
    
    // Add operator form
    const addOperatorForm = document.getElementById('addOperatorForm');
    if (addOperatorForm) {
        addOperatorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const operatorData = {
                operatorId: document.getElementById('newOperatorId').value.trim(),
                name: document.getElementById('newOperatorName').value.trim(),
                sewLine: document.getElementById('newSewLine').value.trim() || null,
                skillLevel: document.getElementById('newSkillLevel').value || null
            };
            
            if (await saveOperator(operatorData, false)) {
                addOperatorForm.reset();
                closeModal('addOperatorModal');
                populateOperatorDropdowns();
                populateLineFilter();
                populateDashboardLineSelect();
                populateOperatorsLineFilter();
                updateGarmentSMVSelectors();
            }
        });
    }
    
    // Edit operator form
    const editCellForm = document.getElementById('editCellForm');
    if (editCellForm) {
        editCellForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const operatorData = {
                sewLine: document.getElementById('editSewLine').value.trim() || null,
                skillLevel: document.getElementById('editSkillLevel').value || null
            };
            
            if (await saveOperator(operatorData, true)) {
                closeModal('editCellModal');
            }
        });
    }

    // Edit performance form with general allowance - UPDATED: CTQ dropdown
    const editPerformanceForm = document.getElementById('editPerformanceForm');
    if (editPerformanceForm) {
        editPerformanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recordId = document.getElementById('editRecordId').textContent;
            const ctqDropdown = document.getElementById('editRecordCTQ');
            const formData = {
                standardSMV: parseFloat(document.getElementById('editRecordStdSMV').value),
                workingSMV: parseFloat(document.getElementById('editRecordWorkingSMV').value),
                operationGrade: document.getElementById('editRecordOperationGrade').value,
                criticalToQuality: ctqDropdown ? ctqDropdown.value : '',
                bottleneck: document.getElementById('editRecordBottleneck').checked,
                cycleTimes: document.getElementById('editRecordCycleTimes').value
            };
            
            if (await updatePerformanceRecord(recordId, formData)) {
                editPerformanceForm.reset();
                closeModal('editPerformanceModal');
            }
        });
    }
    
    // Score slider sync
    const editSkillScoreInput = document.getElementById('editSkillScore');
    const scoreSlider = document.getElementById('scoreSlider');
    
    if (scoreSlider && editSkillScoreInput) {
        scoreSlider.addEventListener('input', (e) => {
            editSkillScoreInput.value = (e.target.value / 100).toFixed(2);
        });
        
        editSkillScoreInput.addEventListener('input', (e) => {
            const value = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
            scoreSlider.value = Math.round(value * 100);
            editSkillScoreInput.value = value.toFixed(2);
        });
    }
    
    // Close modals
    document.querySelectorAll('.close-modal, .btn-secondary[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal') || 
                           e.target.closest('.close-modal')?.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Setup multi-select after DOM is loaded
    setTimeout(() => {
        setupMultiSelect();
    }, 1000);
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // UPDATED: CTQ dropdown is always visible
    const timeStudyCTQContainer = document.getElementById('ctqContainer');
    const perfCTQContainer = document.getElementById('perfCTQContainer');
    
    if (timeStudyCTQContainer) {
        timeStudyCTQContainer.style.display = 'block';
    }
    
    if (perfCTQContainer) {
        perfCTQContainer.style.display = 'block';
    }
    
    // Bottleneck checkbox is always visible
    const timeStudyBottleneckContainer = document.getElementById('bottleneckContainer');
    const perfBottleneckContainer = document.getElementById('perfBottleneckContainer');
    
    if (timeStudyBottleneckContainer) {
        timeStudyBottleneckContainer.style.display = 'block';
    }
    
    if (perfBottleneckContainer) {
        perfBottleneckContainer.style.display = 'block';
    }
    
    // Edit Existing Details Modal functionality - UPDATED: Fixed CTQ and Bottleneck
    const editExistingOperatorSelect = document.getElementById('editExistingOperatorSelect');
    if (editExistingOperatorSelect) {
        editExistingOperatorSelect.addEventListener('change', function() {
            const operatorId = this.value;
            if (operatorId) {
                const operator = operators.find(op => op.operatorId === operatorId);
                if (operator) {
                    // Update operator info
                    document.getElementById('editExistingOperatorName').textContent = operator.name;
                    document.getElementById('editExistingOperatorId').textContent = operatorId;
                    document.getElementById('editExistingCurrentGrade').textContent = calculateMultiSkillGrade(operatorId);
                    
                    // Get performance records for this operator
                    const operatorRecords = performanceData.filter(record => record.operatorId === operatorId);
                    document.getElementById('editExistingRecordCount').textContent = operatorRecords.length;
                    
                    // Populate record select
                    const recordSelect = document.getElementById('editExistingRecordSelect');
                    if (recordSelect) {
                        recordSelect.innerHTML = '<option value="">Select Record</option>';
                        operatorRecords.forEach((record, index) => {
                            const option = document.createElement('option');
                            option.value = record.id;
                            option.textContent = `Record ${index + 1}: ${record.operation || 'No Operation'} (${record.timestamp.toLocaleString()})`;
                            recordSelect.appendChild(option);
                        });
                    }
                    
                    // Load all other machines for this operator
                    loadOtherMachinesForOperator(operatorId);
                }
            }
        });
    }
    
    // Load all other machines for operator
    function loadOtherMachinesForOperator(operatorId) {
        const otherMachinesContainer = document.getElementById('otherMachinesContainer');
        if (!otherMachinesContainer) return;
        
        // Clear existing machines
        otherMachinesContainer.innerHTML = '';
        
        // Get all performance records for this operator
        const operatorRecords = performanceData.filter(record => record.operatorId === operatorId);
        
        // Collect unique other machines from all records
        const allOtherMachines = new Set();
        const machineEfficiencies = {};
        
        operatorRecords.forEach(record => {
            if (record.otherMachines) {
                const machines = record.otherMachines.split(', ');
                const efficiencies = record.otherMachineEfficiencies || {};
                
                machines.forEach(machine => {
                    if (machine.trim()) {
                        allOtherMachines.add(machine.trim());
                        if (efficiencies[machine.trim()] && !machineEfficiencies[machine.trim()]) {
                            machineEfficiencies[machine.trim()] = efficiencies[machine.trim()];
                        }
                    }
                });
            }
        });
        
        // Add each machine as an input
        allOtherMachines.forEach(machine => {
            const machineItem = document.createElement('div');
            machineItem.className = 'other-machine-item';
            machineItem.innerHTML = `
                <div style="flex: 2;">
                    <input type="text" class="other-machine-name" value="${machine}" readonly>
                </div>
                <div style="flex: 1;">
                    <input type="number" class="other-machine-efficiency" min="0" max="200" step="0.1" 
                           value="${machineEfficiencies[machine] || ''}" placeholder="Efficiency %">
                </div>
                <div>
                    <button type="button" class="btn-icon remove-other-machine" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            otherMachinesContainer.appendChild(machineItem);
            
            // Add remove event listener
            machineItem.querySelector('.remove-other-machine').addEventListener('click', () => {
                machineItem.remove();
            });
        });
    }
    
    const editExistingRecordSelect = document.getElementById('editExistingRecordSelect');
    if (editExistingRecordSelect) {
        editExistingRecordSelect.addEventListener('change', function() {
            const recordId = this.value;
            if (recordId) {
                const record = performanceData.find(r => r.id === recordId);
                if (record) {
                    // Populate form fields
                    document.getElementById('editExistingOperation').value = record.operation || '';
                    document.getElementById('editExistingMachine').value = record.machineName || '';
                    document.getElementById('editExistingStdSMV').value = record.standardSMV || '';
                    document.getElementById('editExistingWorkingSMV').value = record.workingSMV || '';
                    document.getElementById('editExistingEfficiency').value = record.efficiency || '';
                    document.getElementById('editExistingOperationGrade').value = record.operationGrade || '';
                    
                    // UPDATED: Set CTQ dropdown and Bottleneck checkbox
                    const ctqDropdown = document.getElementById('editExistingCTQ');
                    if (ctqDropdown && record.criticalToQuality) {
                        ctqDropdown.value = record.criticalToQuality;
                    }
                    
                    const bottleneckCheckbox = document.getElementById('editExistingBottleneck');
                    if (bottleneckCheckbox) {
                        bottleneckCheckbox.checked = record.bottleneck || false;
                    }
                    
                    // Show/hide custom machine row
                    const customMachineRow = document.getElementById('editExistingCustomMachineRow');
                    if (customMachineRow) {
                        if (record.machineName === 'Others') {
                            customMachineRow.style.display = 'block';
                            document.getElementById('editExistingCustomMachineName').value = record.customMachineName || '';
                        } else {
                            customMachineRow.style.display = 'none';
                        }
                    }
                    
                    // Populate other machine efficiencies for this specific record
                    if (record.otherMachineEfficiencies) {
                        document.querySelectorAll('#otherMachinesContainer .other-machine-item').forEach(item => {
                            const machineNameInput = item.querySelector('.other-machine-name');
                            const efficiencyInput = item.querySelector('.other-machine-efficiency');
                            
                            if (machineNameInput && efficiencyInput) {
                                const machineName = machineNameInput.value;
                                if (record.otherMachineEfficiencies[machineName]) {
                                    efficiencyInput.value = record.otherMachineEfficiencies[machineName];
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    
    // Add other machine button
    const addOtherMachineBtn = document.getElementById('addOtherMachineBtn');
    if (addOtherMachineBtn) {
        addOtherMachineBtn.addEventListener('click', () => {
            const container = document.getElementById('otherMachinesContainer');
            if (container) {
                const newItem = document.createElement('div');
                newItem.className = 'other-machine-item';
                newItem.innerHTML = `
                    <div style="flex: 2;">
                        <select class="other-machine-select" style="width: 100%;">
                            <option value="">Select Machine</option>
                            ${Object.entries(machineFamilies).map(([family, machines]) => `
                                <optgroup label="${family}">
                                    ${machines.map(machine => `
                                        <option value="${machine}">${machine}</option>
                                    `).join('')}
                                </optgroup>
                            `).join('')}
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <input type="number" class="other-machine-efficiency" min="0" max="200" step="0.1" placeholder="Efficiency %">
                    </div>
                    <div>
                        <button type="button" class="btn-icon remove-other-machine" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                container.appendChild(newItem);
                
                // Add remove event listener
                newItem.querySelector('.remove-other-machine').addEventListener('click', () => {
                    newItem.remove();
                });
            }
        });
    }
    
    // Save existing details button - UPDATED: Fixed CTQ and Bottleneck
    const saveExistingDetailsBtn = document.getElementById('saveExistingDetailsBtn');
    if (saveExistingDetailsBtn) {
        saveExistingDetailsBtn.addEventListener('click', async () => {
            const recordId = document.getElementById('editExistingRecordSelect').value;
            if (!recordId) {
                showToast('Please select a record to edit', 'error');
                return;
            }
            
            try {
                const recordRef = doc(db, 'performance', recordId);
                const ctqDropdown = document.getElementById('editExistingCTQ');
                
                const updates = {
                    operation: document.getElementById('editExistingOperation').value,
                    machineName: document.getElementById('editExistingMachine').value,
                    standardSMV: parseFloat(document.getElementById('editExistingStdSMV').value) || 0,
                    workingSMV: parseFloat(document.getElementById('editExistingWorkingSMV').value) || 0,
                    efficiency: parseFloat(document.getElementById('editExistingEfficiency').value) || 0,
                    operationGrade: document.getElementById('editExistingOperationGrade').value,
                    criticalToQuality: ctqDropdown ? ctqDropdown.value : '',
                    bottleneck: document.getElementById('editExistingBottleneck').checked || false,
                    lastUpdated: serverTimestamp()
                };
                
                // Handle custom machine
                if (updates.machineName === 'Others') {
                    updates.customMachineName = document.getElementById('editExistingCustomMachineName').value || '';
                }
                
                // Handle other machines
                const otherMachineItems = document.querySelectorAll('#otherMachinesContainer .other-machine-item');
                const otherMachines = [];
                const otherMachineEfficiencies = {};
                
                otherMachineItems.forEach(item => {
                    const machineNameInput = item.querySelector('.other-machine-name');
                    const efficiencyInput = item.querySelector('.other-machine-efficiency');
                    
                    if (machineNameInput && machineNameInput.value && efficiencyInput && efficiencyInput.value) {
                        const machine = machineNameInput.value;
                        const efficiency = parseFloat(efficiencyInput.value) || 0;
                        otherMachines.push(machine);
                        otherMachineEfficiencies[machine] = efficiency;
                    }
                });
                
                updates.otherMachines = otherMachines.join(', ');
                updates.otherMachineEfficiencies = otherMachineEfficiencies;
                
                await updateDoc(recordRef, updates);
                showToast('Record updated successfully!');
                closeModal('editExistingDetailsModal');
            } catch (error) {
                console.error('Error updating record:', error);
                showToast('Error updating record: ' + error.message, 'error');
            }
        });
    }
}

// Initialize the application
window.addEventListener('load', () => {
    // Ensure DOM is fully loaded
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            // Charts are loaded
            console.log('Chart.js loaded successfully');
        }
    }, 1000);
});
