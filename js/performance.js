import { subscribeToOperators, subscribeToPerformance, addPerformanceRecord, updatePerformanceRecord, deletePerformanceRecord, getLastPerformanceRecord } from './data-service.js';
import { supervisorMapping, machineFamilies, showToast, updateRealTimeClock, setupModalListeners, openModal, closeModal, getElement, GENERAL_ALLOWANCE } from './common.js?v=1.0.1';
import { NavigationSystem } from './ui-core.js';

let operators = [];
let performanceData = [];
let selectedRecordId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Init common features
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);
    new NavigationSystem();
    setupModalListeners();

    // Subscribe to data
    subscribeToOperators((data) => {
        operators = data;
        populateOperatorSelect();
    });

    subscribeToPerformance((data) => {
        performanceData = data;
        renderPerformanceTable(performanceData);
        updateStats();
        updateLineFilters();

        // Check for incoming operator filter (from operators page)
        handleIncomingOperatorFilter();
    });

    // Populate machine selects
    populateMachineOptions('perfMachine');
    populateMachineOptions('editExistingMachine'); // If reused

    // Event Listeners
    setupEventListeners();
});

/**
 * Handle incoming operator filter from operators page
 * Pre-fills search and triggers filter
 */
function handleIncomingOperatorFilter() {
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const operatorIdFromUrl = urlParams.get('operatorId');

    // Check sessionStorage
    const storedOperatorId = sessionStorage.getItem('filterOperatorId');

    const operatorId = operatorIdFromUrl || storedOperatorId;

    if (operatorId) {
        const searchInput = getElement('searchPerformance');
        if (searchInput) {
            searchInput.value = operatorId;
            filterPerformanceData();

            // Highlight matching rows
            setTimeout(() => {
                const tbody = getElement('performanceBody');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        // Check if operator ID column matches (typically column index 5)
                        const matched = Array.from(cells).some(cell =>
                            cell.textContent.trim() === operatorId
                        );
                        if (matched) {
                            row.style.background = 'rgba(99, 102, 241, 0.15)';
                            row.style.transition = 'background 0.3s ease';

                            // Remove highlight after 3 seconds
                            setTimeout(() => {
                                row.style.background = '';
                            }, 3000);
                        }
                    });
                }
            }, 100);
        }

        // Clear sessionStorage after use
        sessionStorage.removeItem('filterOperatorId');

        // Clear URL params for clean state
        if (operatorIdFromUrl) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

function setupEventListeners() {
    // Search & Filter
    getElement('searchPerformance')?.addEventListener('input', filterPerformanceData);
    getElement('perfLineFilter')?.addEventListener('change', filterPerformanceData);
    getElement('dateFilter')?.addEventListener('change', filterPerformanceData);

    // Buttons
    getElement('addPerformanceBtn')?.addEventListener('click', () => {
        populateOperatorSelect();
        openModal('addPerformanceModal');
    });

    // Forms
    getElement('addPerformanceForm')?.addEventListener('submit', handleAddPerformance);
    getElement('editPerformanceForm')?.addEventListener('submit', handleEditPerformance);

    // Add Cycle Time Input Row
    getElement('addCycleTimeBtn')?.addEventListener('click', () => {
        const container = getElement('manualCycleTimes');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'cycle-input-group'; // Reuse CSS class if available or style it
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="number" class="manual-cycle-time" step="0.001" placeholder="Cycle ${count} (sec)" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white;">
        `;
        container.appendChild(div);
    });

    // Machine select change for 'Others'
    getElement('perfMachine')?.addEventListener('change', (e) => {
        const customRow = getElement('perfCustomMachineRow');
        if (customRow) {
            customRow.style.display = e.target.value === 'Others' ? 'block' : 'none';
        }
    });

    // Intelligent Auto-fill: Retrieve detail on operator selection
    getElement('perfOperatorId')?.addEventListener('change', async (e) => {
        const opId = e.target.value;
        if (!opId) return;

        // 1. Get from Operator Profile
        const op = operators.find(o => o.operatorId === opId);
        if (op && op.sewLine) {
            getElement('perfLineNo').value = op.sewLine;
        }

        // 2. Get from Last Performance Record (Style, Product, Operation, Machine)
        const lastRecord = await getLastPerformanceRecord(opId);
        if (lastRecord) {
            if (lastRecord.styleNo) getElement('perfStyleNo').value = lastRecord.styleNo;
            if (lastRecord.productDesc) getElement('perfProductDesc').value = lastRecord.productDesc;
            if (lastRecord.operation) getElement('perfOperation').value = lastRecord.operation;

            // Set machine if available in options
            if (lastRecord.machineName) {
                const machineSelect = getElement('perfMachine');
                // Check if option exists
                const options = Array.from(machineSelect.options).map(opt => opt.value);
                if (options.includes(lastRecord.machineName)) {
                    machineSelect.value = lastRecord.machineName;
                    machineSelect.dispatchEvent(new Event('change')); // Trigger custom row check
                } else if (lastRecord.machineName === 'Others') {
                    machineSelect.value = 'Others';
                    machineSelect.dispatchEvent(new Event('change'));
                    if (lastRecord.customMachineName) {
                        getElement('perfCustomMachineName').value = lastRecord.customMachineName;
                    }
                }
            }
            showToast('Auto-filled data from last record', 'info');
        }
    });

    // Auto-calculate Working SMV if Standard SMV changed (optional, naive implementation)
    // Actually, normally Working SMV comes from cycle times. If user inputs manually, they just input it.
}

function filterPerformanceData() {
    const searchTerm = getElement('searchPerformance')?.value.toLowerCase() || '';
    const lineFilter = getElement('perfLineFilter')?.value || '';
    const dateFilter = getElement('dateFilter')?.value || '';

    const filtered = performanceData.filter(record => {
        const matchesSearch = !searchTerm ||
            (record.operatorId?.toLowerCase().includes(searchTerm)) ||
            (record.operatorName?.toLowerCase().includes(searchTerm)) ||
            (record.styleNo?.toLowerCase().includes(searchTerm));

        const matchesLine = !lineFilter || record.lineNo === lineFilter;

        let matchesDate = true;
        if (dateFilter) {
            const date = record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp); // Handle Firebase Timestamp if raw
            // Note: data-service converts timestamp to Date object
            const today = new Date();
            if (dateFilter === 'today') {
                matchesDate = date.toDateString() === today.toDateString();
            } else if (dateFilter === 'week') {
                const diffTime = Math.abs(today - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchesDate = diffDays <= 7;
            } else if (dateFilter === 'month') {
                matchesDate = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            }
        }

        return matchesSearch && matchesLine && matchesDate;
    });

    renderPerformanceTable(filtered);
}

function renderPerformanceTable(data) {
    const tbody = getElement('performanceBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="18" style="text-align:center; padding: 20px;">No performance records found</td></tr>`;
        return;
    }

    data.forEach((record, index) => {
        const date = record.timestamp ? new Date(record.timestamp).toLocaleString() : '-';
        const otherMachinesDisplay = record.otherMachines ? record.otherMachines.replace(/,/g, ', ') : '-';

        // Calculate Other Machine Efficiency display
        let otherMachineEffDisplay = '-';
        if (record.otherMachines && record.otherMachineEfficiencies) {
            const otherMachines = record.otherMachines.split(', ').map(m => m.trim());
            const efficiencies = record.otherMachineEfficiencies;
            otherMachineEffDisplay = otherMachines.map(machine => {
                const efficiency = efficiencies[machine] || 0;
                return `${efficiency.toFixed(1)}%`;
            }).join(', ');
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${date}</td>
            <td>${record.lineNo || '-'}</td>
            <td>${record.styleNo || '-'}</td>
            <td>${record.productDesc || '-'}</td>
            <td>${record.operatorId || '-'}</td>
            <td>${record.operatorName || '-'}</td>
            <td>${record.operation || '-'}</td>
            <td>${record.machineName || '-'}</td>
            <td>${otherMachinesDisplay}</td>
            <td>${record.standardSMV?.toFixed(2) || '0.00'}</td>
            <td>
                ${record.workingSMV?.toFixed(2) || '0.00'}
                <button class="btn-icon-tiny view-breakdown" data-id="${record.id}" title="View Breakdown">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
            <td>
                <span class="status-badge ${getEfficiencyClass(record.efficiency)}">
                    ${record.efficiency?.toFixed(1) || '0.0'}%
                </span>
            </td>
            <td>${otherMachineEffDisplay}</td>
            <td>${record.operationGrade || '-'}</td>
            <td>${(record.criticalToQuality === 'critical' || record.ctq === 'critical' || record.ctqStatus === 'critical') ? '<span class="badge-critical">Critical</span>' : '<span class="text-xs text-slate-400">No</span>'}</td>
            <td>${record.bottleneck ? '<span class="badge-bottleneck">Bottleneck</span>' : '<span class="text-xs text-slate-400">No</span>'}</td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-icon edit-record" data-id="${record.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-record" data-id="${record.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Event Delegation
    if (!tbody.hasAttribute('data-listeners-attached')) {
        tbody.setAttribute('data-listeners-attached', 'true');
        tbody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-breakdown');
            const editBtn = e.target.closest('.edit-record');
            const deleteBtn = e.target.closest('.delete-record');

            if (viewBtn) {
                showCycleTimesDetail(viewBtn.dataset.id);
            } else if (editBtn) {
                openEditModalForRecord(editBtn.dataset.id);
            } else if (deleteBtn) {
                handleDeleteRecord(deleteBtn.dataset.id);
            }
        });
    }
}

function updateStats() {
    if (!performanceData.length) {
        getElement('avgSMV').textContent = '0.00';
        getElement('avgWorkingSMV').textContent = '0.00';
        return;
    }

    const totalStd = performanceData.reduce((sum, r) => sum + (parseFloat(r.standardSMV) || 0), 0);
    const totalWorking = performanceData.reduce((sum, r) => sum + (parseFloat(r.workingSMV) || 0), 0);

    getElement('avgSMV').textContent = (totalStd / performanceData.length).toFixed(2);
    getElement('avgWorkingSMV').textContent = (totalWorking / performanceData.length).toFixed(2);
}

function populateOperatorSelect() {
    const select = getElement('perfOperatorId');
    if (!select) return;

    // Save current selection if any
    const currentVal = select.value;

    select.innerHTML = '<option value="">Select Operator</option>';
    operators.forEach(op => {
        const option = document.createElement('option');
        option.value = op.operatorId;
        option.textContent = `${op.operatorId} - ${op.name}`;
        select.appendChild(option);
    });

    if (operators.some(op => op.operatorId === currentVal)) {
        select.value = currentVal;
    }
}

function populateMachineOptions(selectId) {
    const select = getElement(selectId);
    if (!select) return;

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

function updateLineFilters() {
    const select = getElement('perfLineFilter');
    if (!select) return;

    const lines = [...new Set(performanceData.map(d => d.lineNo).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Filter by Line...</option>';
    lines.forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        select.appendChild(option);
    });
}

function getEfficiencyClass(efficiency) {
    if (efficiency >= 85) return 'status-high';
    if (efficiency >= 70) return 'status-medium';
    return 'status-low';
}

function showCycleTimesDetail(recordId) {
    const record = performanceData.find(r => r.id === recordId);
    if (!record) return;

    getElement('detailOperatorName').textContent = record.operatorName || '-';
    getElement('detailOperation').textContent = record.operation || '-';
    getElement('detailStdSMV').textContent = record.standardSMV?.toFixed(2) || '0.00';
    getElement('detailWorkingSMV').textContent = record.workingSMV?.toFixed(2) || '0.00';
    getElement('detailEfficiency').textContent = (record.efficiency?.toFixed(1) || '0') + '%';

    // Variance
    const variance = record.standardSMV > 0 ?
        ((record.workingSMV - record.standardSMV) / record.standardSMV) * 100 : 0;
    getElement('detailVariance').textContent = variance.toFixed(1) + '%';

    // Cycle Times
    const list = getElement('cycleTimesList');
    if (list) {
        list.innerHTML = '';
        if (record.cycleTimes && record.cycleTimes.length > 0) {
            let totalTime = 0;
            record.cycleTimes.forEach((time, index) => {
                totalTime += time;
                const row = document.createElement('div');
                row.className = 'lap-item'; // Reuse styles
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.padding = '8px';
                row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                row.innerHTML = `<span>Cycle ${index + 1}</span><span>${time.toFixed(3)}s</span>`;
                list.appendChild(row);
            });

            const avgRow = document.createElement('div');
            avgRow.style.display = 'flex';
            avgRow.style.justifyContent = 'space-between';
            avgRow.style.padding = '8px';
            avgRow.style.backgroundColor = 'rgba(76, 201, 240, 0.1)';
            avgRow.style.marginTop = '10px';
            avgRow.innerHTML = `<strong>Average</strong><strong>${(totalTime / record.cycleTimes.length).toFixed(3)}s</strong>`;
            list.appendChild(avgRow);
        } else {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No cycle time data available</div>';
        }
    }

    openModal('cycleDetailModal');
}

function openEditModalForRecord(id) {
    selectedRecordId = id;
    const record = performanceData.find(r => r.id === id);
    if (!record) return;

    getElement('editRecordId').textContent = id;
    getElement('editRecordOperator').textContent = record.operatorName;
    getElement('editRecordStdSMV').value = record.standardSMV;
    getElement('editRecordWorkingSMV').value = record.workingSMV;
    getElement('editRecordOperationGrade').value = record.operationGrade || '';
    getElement('editRecordCtqDropdown').value = record.criticalToQuality || '';
    getElement('editRecordBottleneck').checked = record.bottleneck || false;

    if (record.cycleTimes) {
        getElement('editRecordCycleTimes').value = record.cycleTimes.join(', ');
    } else {
        getElement('editRecordCycleTimes').value = '';
    }

    openModal('editPerformanceModal');
}

async function handleAddPerformance(e) {
    e.preventDefault();

    const operatorId = getElement('perfOperatorId').value;
    const operator = operators.find(op => op.operatorId === operatorId);

    if (!operator) {
        showToast('Please select a valid operator', 'error');
        return;
    }

    // Collect manual cycle times
    const manualInputs = document.querySelectorAll('.manual-cycle-time');
    const cycleTimes = Array.from(manualInputs).map(input => parseFloat(input.value)).filter(val => !isNaN(val) && val > 0);

    let workingSMV = parseFloat(getElement('perfWorkingSMV').value);

    // If working SMV not provided but cycle times are, calculate it
    if ((!workingSMV || workingSMV === 0) && cycleTimes.length > 0) {
        const avgTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
        workingSMV = (avgTime / 60) * (1 + GENERAL_ALLOWANCE / 100);
    }

    const stdSMV = parseFloat(getElement('perfStdSMV').value);
    const efficiency = workingSMV > 0 ? (stdSMV / workingSMV) * 100 : 0;

    const machineName = getElement('perfMachine').value;
    const customMachine = machineName === 'Others' ? getElement('perfCustomMachineName').value : '';

    const record = {
        operatorId: operatorId,
        operatorName: operator.name,
        lineNo: getElement('perfLineNo').value,
        styleNo: getElement('perfStyleNo').value,
        productDesc: getElement('perfProductDesc').value,
        operation: getElement('perfOperation').value,
        machineName: machineName,
        customMachineName: customMachine,
        standardSMV: stdSMV,
        workingSMV: workingSMV,
        efficiency: efficiency,
        cycleTimes: cycleTimes,
        avgCycleTime: cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0,
        allowance: GENERAL_ALLOWANCE,
        // Criticality Indicators
        operationGrade: getElement('perfOperationGrade')?.value || '',
        criticalToQuality: getElement('perfCtqDropdown')?.value || 'non-critical',
        bottleneck: getElement('perfBottleneckCheckbox')?.checked || false
    };

    const success = await addPerformanceRecord(record);
    if (success) {
        showToast('Performance record added successfully');
        closeModal('addPerformanceModal');
        e.target.reset();
        getElement('manualCycleTimes').innerHTML = '';
        getElement('perfCustomMachineRow').style.display = 'none';

        // Update operator skill if needed (machine skill) - logic from original app could be added to data service or here
        // For now, keeping it simple
    }
}

async function handleEditPerformance(e) {
    e.preventDefault();
    if (!selectedRecordId) return;

    // Parse cycle times
    const cycleTimesStr = getElement('editRecordCycleTimes').value;
    const cycleTimes = cycleTimesStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

    let workingSMV = parseFloat(getElement('editRecordWorkingSMV').value);
    const stdSMV = parseFloat(getElement('editRecordStdSMV').value);

    // Recalculate working SMV if cycle times changed and working SMV not manually overridden (logic: if cycle time input exists, trust it + general allowance?)
    // Simpler: Just rely on user input for Working SMV unless they cleared it? 
    // Let's replicate original app logic: if cycle times present, recalc working SMV
    if (cycleTimes.length > 0) {
        const avgTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
        // Check if user manually changed working SMV significantly? 
        // For simplicity, let's recalculate efficiency based on the inputs
        // But if user manually entered Working SMV, we use that.
        // However, the edit modal allows changing both.
    }

    // Re-calc efficiency
    const efficiency = workingSMV > 0 ? (stdSMV / workingSMV) * 100 : 0;

    const updates = {
        standardSMV: stdSMV,
        workingSMV: workingSMV,
        efficiency: efficiency,
        operationGrade: getElement('editRecordOperationGrade').value,
        criticalToQuality: getElement('editRecordCtqDropdown').value,
        bottleneck: getElement('editRecordBottleneck').checked,
        cycleTimes: cycleTimes,
        avgCycleTime: cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0
    };

    const success = await updatePerformanceRecord(selectedRecordId, updates);
    if (success) {
        showToast('Record updated successfully');
        closeModal('editPerformanceModal');
    }
}

async function handleDeleteRecord(id) {
    if (confirm('Are you sure you want to delete this performance record?')) {
        const success = await deletePerformanceRecord(id);
        if (success) showToast('Record deleted');
    }
}
