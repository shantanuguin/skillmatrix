import { subscribeToOperators, addPerformanceRecord, getLastPerformanceRecord } from './data-service.js';
import { machineFamilies, showToast, updateRealTimeClock, setupMobileMenu, formatTime, getElement, GENERAL_ALLOWANCE, populateMachineOptions } from './common.js?v=1.0.1';

let operators = [];
let startTime = 0;
let updatedTime = 0;
let difference = 0;
let timerInterval = null;
let running = false;
let lapTimes = [];
let cycleCount = 3;

document.addEventListener('DOMContentLoaded', () => {
    // Init common features
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);
    setupMobileMenu();

    // Subscribe to data
    subscribeToOperators((data) => {
        operators = data;
        populateOperatorSelect();

        // Check for incoming operator from URL params or sessionStorage (from operators page)
        handleIncomingOperator();
    });

    // Populate machine selects
    populateMachineOptions('studyMachine');
    const otherContainer = getElement('otherMachinesOptions');
    if (otherContainer) populateOtherMachinesDropdown(otherContainer);

    setupMultiSelect();
    setupManualCycleInputs(3);

    // Event Listeners
    setupEventListeners();
});

/**
 * Handle pre-selection of operator when coming from operators page
 * Reads from URL params and sessionStorage
 */
function handleIncomingOperator() {
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const operatorIdFromUrl = urlParams.get('operatorId');

    // Check sessionStorage for more data
    const storedData = sessionStorage.getItem('timeStudyOperator');

    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            const select = getElement('studyOperatorId');

            if (select && data.operatorId) {
                // Set the operator in dropdown
                select.value = data.operatorId;

                // Auto-fill sew line if available
                if (data.sewLine && getElement('studyLineNo')) {
                    getElement('studyLineNo').value = data.sewLine;
                }

                // Trigger change event to load last performance data
                const event = new Event('change');
                select.dispatchEvent(event);

                // Focus on operation field for quick entry
                setTimeout(() => {
                    const operationField = getElement('studyOperation');
                    if (operationField) {
                        operationField.focus();
                    }
                }, 100);

                showToast(`Time study ready for ${data.operatorName}. Enter operation details to begin.`, 'success');
            }

            // Clear sessionStorage after use
            sessionStorage.removeItem('timeStudyOperator');
        } catch (e) {
            console.error('Error parsing time study data:', e);
        }
    } else if (operatorIdFromUrl) {
        // Fallback to just URL param
        const select = getElement('studyOperatorId');
        if (select) {
            select.value = operatorIdFromUrl;

            // Find operator for sew line
            const operator = operators.find(op => op.operatorId === operatorIdFromUrl);
            if (operator && operator.sewLine && getElement('studyLineNo')) {
                getElement('studyLineNo').value = operator.sewLine;
            }

            // Trigger change event
            const event = new Event('change');
            select.dispatchEvent(event);
        }
    }
}

function setupEventListeners() {
    // Stopwatch Controls
    getElement('startBtn')?.addEventListener('click', startStopwatch);
    getElement('pauseBtn')?.addEventListener('click', pauseStopwatch);
    getElement('lapBtn')?.addEventListener('click', recordLap);
    getElement('resetBtn')?.addEventListener('click', resetStopwatch);


    // Intelligent Auto-fill: Retrieve detail on operator selection
    getElement('studyOperatorId')?.addEventListener('change', async (e) => {
        const opId = e.target.value;
        if (!opId) return;

        // 1. Get from Operator Profile
        const op = operators.find(o => o.operatorId === opId);
        if (op && op.sewLine) {
            getElement('studyLineNo').value = op.sewLine;
        }

        // 2. Get from Last Performance Record (Style, Product, Operation, Machine)
        const lastRecord = await getLastPerformanceRecord(opId);
        if (lastRecord) {
            if (lastRecord.styleNo) getElement('studyStyleNo').value = lastRecord.styleNo;
            if (lastRecord.productDesc) getElement('studyProductDesc').value = lastRecord.productDesc;
            if (lastRecord.operation) getElement('studyOperation').value = lastRecord.operation;

            // Set machine if available in options
            if (lastRecord.machineName) {
                const machineSelect = getElement('studyMachine');
                // Check if option exists
                const options = Array.from(machineSelect.options).map(opt => opt.value);
                if (options.includes(lastRecord.machineName)) {
                    machineSelect.value = lastRecord.machineName;
                    machineSelect.dispatchEvent(new Event('change')); // Trigger custom row check
                } else if (lastRecord.machineName === 'Others') {
                    machineSelect.value = 'Others';
                    machineSelect.dispatchEvent(new Event('change'));
                    if (lastRecord.customMachineName) {
                        getElement('customMachineName').value = lastRecord.customMachineName;
                    }
                }
            }
            showToast('Auto-filled data from last record', 'info');
        }
    });

    // Results Actions
    getElement('resetStopwatch')?.addEventListener('click', resetForm);
    getElement('savePerformanceData')?.addEventListener('click', handleSaveData);

    // Cycle Count Radio
    document.querySelectorAll('input[name="cycleCount"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const value = e.target.value;
            cycleCount = value === 'manual' ? 0 : parseInt(value);

            const manualInputs = getElement('manualCycleInputs');
            if (manualInputs) {
                manualInputs.style.display = value === 'manual' ? 'block' : 'none';
            }

            if (value === 'manual') {
                setupManualCycleInputs(3);
            } else if (lapTimes.length > 0) {
                if (confirm('Changing cycle count will reset current measurements. Continue?')) {
                    resetStopwatch();
                } else {
                    // Revert radio logic if needed, simplify for now
                }
            }
        });
    });

    // Manual Calculation
    getElement('calculateManualBtn')?.addEventListener('click', calculateManualCycles);
    getElement('addManualCycleBtn')?.addEventListener('click', () => {
        const grid = getElement('manualCycleGrid');
        const count = grid.children.length + 1;
        const div = document.createElement('div');
        div.className = 'cycle-input-group';
        div.innerHTML = `
            <label>Cycle ${count} (seconds)</label>
            <input type="number" class="manual-cycle-time" step="0.001" placeholder="e.g., 25.345">
        `;
        grid.appendChild(div);
    });

    // Machine 'Others' toggle
    getElement('studyMachine')?.addEventListener('change', (e) => {
        const customRow = getElement('customMachineRow');
        if (customRow) {
            customRow.style.display = e.target.value === 'Others' ? 'block' : 'none';
        }
    });

    // Standard SMV input -> calculate efficiency preview if result exists
    getElement('standardSMV')?.addEventListener('input', updateResultsPreview);
}

function startStopwatch() {
    if (!running) {
        startTime = new Date().getTime() - difference;
        timerInterval = setInterval(updateDisplay, 10);
        running = true;

        getElement('startBtn').disabled = true;
        getElement('pauseBtn').disabled = false;
        getElement('lapBtn').disabled = false;
        getElement('resetBtn').disabled = false; // allow reset while running? usually pause first
    }
}

function pauseStopwatch() {
    if (running) {
        clearInterval(timerInterval);
        difference = new Date().getTime() - startTime;
        running = false;

        getElement('startBtn').disabled = false;
        getElement('pauseBtn').disabled = true;
        getElement('lapBtn').disabled = true;
    }
}

function resetStopwatch() {
    clearInterval(timerInterval);
    running = false;
    difference = 0;
    startTime = 0;
    lapTimes = [];

    getElement('stopwatchDisplay').textContent = "00:00:00.000";
    getElement('lapDisplay').textContent = "Lap: 00:00:00.000";
    getElement('lapsList').innerHTML = "";

    getElement('startBtn').disabled = false;
    getElement('pauseBtn').disabled = true;
    getElement('lapBtn').disabled = true;
    getElement('resetBtn').disabled = false;

    updateResultsPreview();
}

function updateDisplay() {
    updatedTime = new Date().getTime() - startTime;
    getElement('stopwatchDisplay').textContent = formatTime(updatedTime);
}

function recordLap() {
    if (!running) return;

    // Calculate lap time
    const currentLapTime = updatedTime;
    const lastLapTime = lapTimes.length > 0 ? lapTimes[lapTimes.length - 1].totalTime : 0; // if storing total
    // Actually we want individual lap duration usually?
    // Let's store individual duration
    // Actually simpler: just capture current timer value as the lap duration from 0 if we reset per lap? 
    // Or capture split.
    // The original app code seemed to capture splits or reset.
    // Let's assume we capture the duration of THIS cycle.
    // If it's a continuous run, we diff from last lap.

    // Simplification: We record the time ELAPSED since start (or last lap).
    // Let's say we are timing ONE cycle. 
    // If we are timing 3 cycles continuously: Start -> Lap (c1) -> Lap (c2) -> Stop (c3).
    // We need to keep track of last split.

    // For simplicity, let's assume we just grab the current timer value and RESTART the timer for next lap?
    // Or subtract previous accum value.

    // Original app logic check: 
    // It captures "lapTime" as (currentTime - lastLapTime).

    const lapDuration = lapTimes.length === 0 ? updatedTime : (updatedTime - lapTimes.reduce((a, b) => a + b.duration, 0));
    // Wait, simpler:
    // Store total accumulated time so far in a var?
    // Let's allow multiple laps.

    // Actually, simpler logic:
    // Lap 1: Time = T1
    // Lap 2: Time = T2 (from T1 to T2)

    // Let's just push the diff.
    const grandTotal = updatedTime;
    const previousTotal = lapTimes.reduce((acc, lap) => acc + (lap * 1000), 0); // lap is in seconds? No, let's store ms.

    // Let's just store the split in Seconds for layout
    const splitMs = lapTimes.length === 0 ? updatedTime : (updatedTime - lapTimes[lapTimes.length - 1].absoluteTime);

    const lapObj = {
        absoluteTime: updatedTime,
        duration: splitMs
    };

    // We only store the duration in the results array
    const durationSec = splitMs / 1000;
    lapTimes.push({ absoluteTime: updatedTime, durationSec: durationSec });

    // Update UI
    const row = document.createElement('div');
    row.className = 'lap-item';
    row.innerHTML = `
        <div class="lap-number">Cycle ${lapTimes.length}</div>
        <div class="lap-time">${durationSec.toFixed(3)}s</div>
    `;
    getElement('lapsList').prepend(row);
    getElement('lapDisplay').textContent = `Lap: ${formatTime(splitMs)}`;

    // Check progress
    if (cycleCount > 0 && lapTimes.length >= cycleCount) {
        pauseStopwatch();
        playBeep();
        calculateResults();
        showToast(`Recorded ${cycleCount} cycles`);
    }
}

function calculateResults() {
    const cycles = lapTimes.map(l => l.durationSec);
    if (cycles.length === 0) return;

    const avgTime = cycles.reduce((a, b) => a + b, 0) / cycles.length;

    displayResults(avgTime, cycles.reduce((a, b) => a + b, 0));
}

function calculateManualCycles() {
    const inputs = document.querySelectorAll('.manual-cycle-time');
    const values = Array.from(inputs).map(i => parseFloat(i.value)).filter(v => !isNaN(v) && v > 0);

    if (values.length === 0) {
        showToast('Please enter valid cycle times', 'error');
        return;
    }

    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;

    // Update lapTimes manually so we can save
    lapTimes = values.map(v => ({ durationSec: v }));

    displayResults(avg, total);
}

function displayResults(avgTime, totalTime) {
    getElement('avgCycleTime').textContent = avgTime.toFixed(3);
    getElement('totalCycleTime').textContent = totalTime.toFixed(3);

    // Calculate derived
    const workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE / 100);
    getElement('workingSMVResult').textContent = workingSMV.toFixed(2);

    const stdSMV = parseFloat(getElement('standardSMV').value) || 0;
    const efficiency = workingSMV > 0 && stdSMV > 0 ? (stdSMV / workingSMV) * 100 : 0;

    getElement('efficiencyResult').textContent = efficiency.toFixed(1) + '%';
}

function updateResultsPreview() {
    if (lapTimes.length > 0) {
        const cycles = lapTimes.map(l => l.durationSec);
        const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length;
        displayResults(avg, cycles.reduce((a, b) => a + b, 0));
    }
}

async function handleSaveData() {
    const operatorId = getElement('studyOperatorId').value;
    if (!operatorId) {
        showToast('Please select an operator', 'error');
        return;
    }

    if (lapTimes.length === 0) {
        showToast('No cycle data recorded', 'error');
        return;
    }

    const stdSMV = parseFloat(getElement('standardSMV').value);
    if (!stdSMV) {
        showToast('Please enter Standard SMV', 'error');
        return;
    }

    const cycles = lapTimes.map(l => l.durationSec);
    const avgTime = cycles.reduce((a, b) => a + b, 0) / cycles.length;
    const workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE / 100);
    const efficiency = (stdSMV / workingSMV) * 100;

    const machineName = getElement('studyMachine').value;
    const customMachine = machineName === 'Others' ? getElement('customMachineName').value : '';

    // Collect Other Machines
    const otherMachines = [];
    document.querySelectorAll('#selectedOtherMachines .selected-tag i').forEach(icon => {
        otherMachines.push(icon.getAttribute('data-value'));
    });

    const record = {
        operatorId: operatorId,
        operatorName: operators.find(o => o.operatorId === operatorId)?.name || 'Unknown',
        lineNo: getElement('studyLineNo').value,
        styleNo: getElement('studyStyleNo').value,
        productDesc: getElement('studyProductDesc').value,
        operation: getElement('studyOperation').value,
        machineName: machineName,
        customMachineName: customMachine,
        standardSMV: stdSMV,
        workingSMV: workingSMV,
        efficiency: efficiency,
        operationGrade: getElement('operationGrade').value,
        criticalToQuality: getElement('ctqDropdown').value,
        bottleneck: getElement('bottleneckCheckbox').checked,
        otherMachines: otherMachines.join(', '),
        cycleTimes: cycles,
        avgCycleTime: avgTime,
        allowance: GENERAL_ALLOWANCE
    };

    const success = await addPerformanceRecord(record);
    if (success) {
        showToast('Performance record saved successfully');
        resetForm();
    }
}

function resetForm() {
    resetStopwatch();
    getElement('studyLineNo').value = '';
    getElement('studyStyleNo').value = '';
    getElement('studyProductDesc').value = '';
    getElement('studyOperation').value = '';
    getElement('standardSMV').value = '';

    // Don't reset Operator ID strictly unless desired
    // getElement('studyOperatorId').value = ''; 

    getElement('avgCycleTime').textContent = '0.00';
    getElement('totalCycleTime').textContent = '0.00';
    getElement('workingSMVResult').textContent = '0.00';
    getElement('efficiencyResult').textContent = '0%';
}

function populateOperatorSelect() {
    const select = getElement('studyOperatorId');
    if (!select) return;
    select.innerHTML = '<option value="">Select Operator</option>';
    operators.forEach(op => {
        const option = document.createElement('option');
        option.value = op.operatorId;
        option.textContent = `${op.operatorId} - ${op.name}`;
        select.appendChild(option);
    });
}

// function populateMachineOptions removed - using shared utility

function populateOtherMachinesDropdown(container) {
    container.innerHTML = '';
    Object.entries(machineFamilies).forEach(([family, machines]) => {
        const group = document.createElement('div');
        group.className = 'multi-select-option-group';
        group.innerHTML = `<div class="option-group-label" style="padding: 5px 10px; font-weight: bold; color: var(--primary-color);">${family}</div>`;

        machines.forEach(machine => {
            const div = document.createElement('div');
            div.className = 'multi-select-option';
            div.style.padding = '5px 10px';
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <input type="checkbox" value="${machine}" style="margin-right: 8px;">
                <span>${machine}</span>
            `;
            group.appendChild(div);
        });
        container.appendChild(group);
    });
}

function setupMultiSelect() {
    const display = document.querySelector('.multi-select-display');
    const options = getElement('otherMachinesOptions');

    if (display && options) {
        display.addEventListener('click', () => {
            options.style.display = options.style.display === 'block' ? 'none' : 'block';
        });

        // Handle selection
        options.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const val = e.target.value;
                const container = getElement('selectedOtherMachines');

                if (e.target.checked) {
                    const tag = document.createElement('div');
                    tag.className = 'selected-tag';
                    tag.innerHTML = `${val} <i class="fas fa-times" data-value="${val}"></i>`;
                    container.appendChild(tag);
                } else {
                    const tag = container.querySelector(`i[data-value="${val}"]`)?.parentNode;
                    if (tag) tag.remove();
                }
            }
        });

        // Remove tag
        getElement('selectedOtherMachines')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-times')) {
                const val = e.target.getAttribute('data-value');
                const checkbox = options.querySelector(`input[value="${val}"]`);
                if (checkbox) checkbox.checked = false;
                e.target.parentNode.remove();
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.multi-select')) {
                options.style.display = 'none';
            }
        });
    }
}

function setupManualCycleInputs(count) {
    const container = getElement('manualCycleGrid');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'cycle-input-group';
        div.innerHTML = `
            <label>Cycle ${i} (seconds)</label>
            <input type="number" class="manual-cycle-time" step="0.001" placeholder="e.g., 25.345">
        `;
        container.appendChild(div);
    }
}

function playBeep() {
    // Optional beep sound
    // const audio = new Audio('beep.mp3');
    // audio.play().catch(e => console.log('Audio play failed', e));
}
