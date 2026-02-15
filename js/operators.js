import { subscribeToOperators, subscribeToPerformance, addOperator, updateOperator, deleteOperator, updatePerformanceRecord } from './data-service.js';
import { supervisorMapping, getSupervisorForLine, showToast, updateRealTimeClock, setupMobileMenu, setupModalListeners, openModal, closeModal, getElement, populateMachineOptions, machineFamilies } from './common.js?v=1.0.1';

let operators = [];
let performanceData = [];
let selectedOperatorId = null;
let lastAddedOperatorId = null; // Track newly added operators for highlighting
let currentEditRecordId = null; // Track record being edited in Edit Existing Details modal

document.addEventListener('DOMContentLoaded', () => {
    // Init common features
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);
    setupMobileMenu();
    setupModalListeners();

    // Subscribe to data
    subscribeToOperators((data) => {
        operators = data;
        renderOperatorsTable(operators);
        updateLineFilters();
    });

    subscribeToPerformance((data) => {
        performanceData = data;
        // Re-render to update skill grades based on performance data
        renderOperatorsTable(operators);
    });

    // Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Search & Filter
    getElement('searchInput')?.addEventListener('input', filterOperators);
    getElement('skillFilter')?.addEventListener('change', filterOperators);
    getElement('lineFilter')?.addEventListener('change', filterOperators);

    // Buttons
    getElement('addOperatorBtn')?.addEventListener('click', () => {
        populateSewLineSelect('newSewLine');
        openModal('addOperatorModal');
    });

    getElement('refreshBtn')?.addEventListener('click', () => {
        renderOperatorsTable(operators);
        showToast('Operators list refreshed');
    });

    // Forms
    getElement('addOperatorForm')?.addEventListener('submit', handleAddOperator);
    getElement('editCellForm')?.addEventListener('submit', handleEditOperator);

    // Slider
    const scoreSlider = getElement('scoreSlider');
    const skillScoreInput = getElement('editSkillScore');

    if (scoreSlider && skillScoreInput) {
        scoreSlider.addEventListener('input', (e) => {
            skillScoreInput.value = (e.target.value / 100).toFixed(2);
        });

        skillScoreInput.addEventListener('input', (e) => {
            scoreSlider.value = Math.round(e.target.value * 100);
        });
    }

    // Edit Existing Details Button (from action bar)
    getElement('editExistingDetailsBtn')?.addEventListener('click', () => {
        openEditExistingDetailsModal();
    });

    // Edit Existing Details Modal - Operator selection
    getElement('editExistingOperatorSelect')?.addEventListener('change', (e) => {
        loadOperatorRecords(e.target.value);
    });

    // Edit Existing Details Modal - Record selection
    getElement('editExistingRecordSelect')?.addEventListener('change', (e) => {
        loadRecordDetails(e.target.value);
    });

    // Save Existing Details Button
    getElement('saveExistingDetailsBtn')?.addEventListener('click', () => {
        saveExistingDetails();
    });

    // Add Other Machine Button
    getElement('addOtherMachineBtn')?.addEventListener('click', () => {
        addOtherMachineRow();
    });
}

function filterOperators() {
    const searchTerm = getElement('searchInput')?.value.toLowerCase() || '';
    const skillLevel = getElement('skillFilter')?.value || '';
    const lineFilter = getElement('lineFilter')?.value || '';

    const filtered = operators.filter(op => {
        const matchesSearch = !searchTerm ||
            (op.operatorId?.toLowerCase().includes(searchTerm)) ||
            (op.name?.toLowerCase().includes(searchTerm));

        // Calculate dynamic skill grade if needed, or use stored
        const grade = calculateMultiSkillGrade(op.operatorId);
        const matchesSkill = !skillLevel || grade === skillLevel;

        const matchesLine = !lineFilter || op.sewLine === lineFilter;

        return matchesSearch && matchesSkill && matchesLine;
    });

    renderOperatorsTable(filtered);
}

function renderOperatorsTable(data) {
    const tbody = getElement('operatorsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">No operators found</td></tr>`;
        return;
    }

    data.forEach((op, index) => {
        const tr = document.createElement('tr');

        const multiSkillGrade = calculateMultiSkillGrade(op.operatorId);
        const skillClass = `skill-group-${multiSkillGrade.slice(-1).toLowerCase()}`; // Group A -> group-a
        const skillScore = calculateSkillScore(op.operatorId);
        const skillScoreClass = getSkillScoreClass(skillScore);
        const supervisor = getSupervisorForLine(op.sewLine);

        // Check if this is a newly added operator for highlighting
        const isNew = lastAddedOperatorId === op.operatorId;
        if (isNew) {
            tr.classList.add('highlight-new');
            // Remove highlight after 5 seconds
            setTimeout(() => {
                tr.classList.remove('highlight-new');
                lastAddedOperatorId = null;
            }, 5000);
        }

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td class="operator-id">${op.operatorId}</td>
            <td>${op.name}</td>
            <td style="text-align: center;">${op.sewLine || '-'}</td>
            <td style="text-align: center;">${supervisor}</td>
            <td><span class="skill-level ${skillClass}">${multiSkillGrade}</span></td>
            <td><span class="skill-score ${skillScoreClass}">${skillScore.toFixed(2)}</span></td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-icon edit-operator" data-id="${op.operatorId}" title="Edit Operator">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger delete-operator" data-id="${op.id}" data-operator-id="${op.operatorId}" title="Delete Operator">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon btn-icon-success view-performance" data-id="${op.operatorId}" title="View Performance Records">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon time-study-operator" data-id="${op.operatorId}" title="Start Time Study">
                        <i class="fas fa-stopwatch"></i>
                    </button>
                    <button class="btn-icon btn-icon-warning edit-existing-details" data-id="${op.operatorId}" title="Edit Existing Details">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Event Delegation for Operator Table Actions
    // tbody is already defined in scope of renderOperatorsTable
    if (tbody && !tbody.hasAttribute('data-listeners-attached')) {
        tbody.setAttribute('data-listeners-attached', 'true');

        tbody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-operator');
            const deleteBtn = e.target.closest('.delete-operator');
            const viewPerfBtn = e.target.closest('.view-performance');
            const timeStudyBtn = e.target.closest('.time-study-operator');
            const editExistingBtn = e.target.closest('.edit-existing-details');

            if (editBtn) {
                const opId = editBtn.dataset.id;
                openEditModalForOperator(opId);
            } else if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const operatorId = deleteBtn.dataset.operatorId;
                handleDeleteOperator(id, operatorId);
            } else if (viewPerfBtn) {
                const opId = viewPerfBtn.dataset.id;
                viewOperatorPerformance(opId);
            } else if (timeStudyBtn) {
                const opId = timeStudyBtn.dataset.id;
                startTimeStudyForOperator(opId);
            } else if (editExistingBtn) {
                const opId = editExistingBtn.dataset.id;
                openEditExistingDetailsModal(opId);
            }
        });
    }
}

/**
 * Full Multi-Skill Grade Calculation based on specification:
 * 
 * Tier 1: Machine Proficiency Level (per machine)
 * - A: Efficiency > 60% AND Waste 0–2%
 * - B: Efficiency 55–59% AND Waste 2.5–3%
 * - C: Efficiency 50–54% AND Waste 3.5–5%
 * - D: Efficiency < 50% OR Waste 5.5–7%
 * 
 * Tier 2: Overall Operator Grade (based on unique machine types)
 * - Grade A: 3+ machine types, at least 1 at A, others B or C
 * - Grade B: 2+ machine types, at least 1 at B, others C
 * - Grade C: 2 machine types, both at C
 * - Grade D: 1 machine type at D (or lacks versatility)
 */
function calculateMultiSkillGrade(operatorId) {
    const op = operators.find(o => o.operatorId === operatorId);
    if (!op) return 'Group D';

    const opRecords = performanceData.filter(p => p.operatorId === operatorId);
    if (opRecords.length === 0) return op.skillLevel || 'Group D';

    // Step 1: Get unique machines by (operator, style, line) - Anti-Inflation
    const machineGrades = {};

    opRecords.forEach(record => {
        const machineKey = record.machineName || 'Unknown';

        // Calculate Tier 1 grade for this machine
        const efficiency = record.efficiency || 0;
        const waste = record.wastePercentage || 0; // Assuming this field exists

        let tier1Grade;
        if (efficiency > 60 && waste <= 2) {
            tier1Grade = 'A';
        } else if (efficiency >= 55 && efficiency <= 59 && waste >= 2.5 && waste <= 3) {
            tier1Grade = 'B';
        } else if (efficiency >= 50 && efficiency <= 54 && waste >= 3.5 && waste <= 5) {
            tier1Grade = 'C';
        } else {
            tier1Grade = 'D';
        }

        // Store the best grade for each machine type
        if (!machineGrades[machineKey] || tier1Grade < machineGrades[machineKey]) {
            machineGrades[machineKey] = tier1Grade;
        }
    });

    // Step 2: Count unique machine types and their grades
    const uniqueMachines = Object.keys(machineGrades);
    const grades = Object.values(machineGrades);
    const machineCount = uniqueMachines.length;

    const hasA = grades.includes('A');
    const hasB = grades.includes('B');
    const hasC = grades.includes('C');
    const allC = grades.every(g => g === 'C');

    // Step 3: Apply Tier 2 logic
    if (machineCount >= 3 && hasA) {
        return 'Group A';
    } else if (machineCount >= 2 && hasB) {
        return 'Group B';
    } else if (machineCount === 2 && allC) {
        return 'Group C';
    } else {
        return 'Group D';
    }
}

function calculateSkillScore(operatorId) {
    const opRecords = performanceData.filter(p => p.operatorId === operatorId);
    if (opRecords.length === 0) {
        const op = operators.find(o => o.operatorId === operatorId);
        return op?.skillScore || 0;
    }

    // ... calculation logic from app.js
    let totalEff = 0;
    opRecords.forEach(r => totalEff += r.efficiency || 0);
    const avg = totalEff / opRecords.length;

    if (avg >= 90) return 0.9 + (avg - 90) * 0.01;
    else if (avg >= 80) return 0.7 + (avg - 80) * 0.02;
    else if (avg >= 70) return 0.4 + (avg - 70) * 0.03;
    else if (avg >= 60) return 0.2 + (avg - 60) * 0.02;
    else return avg * 0.0033;
}

function getSkillScoreClass(score) {
    if (score >= 0.67) return 'group-a';
    else if (score >= 0.34) return 'group-b';
    else if (score >= 0.1) return 'group-c';
    else return 'group-d';
}

function populateSewLineSelect(selectId) {
    const select = getElement(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Sew Line</option>';
    Object.keys(supervisorMapping).forEach(line => {
        const option = document.createElement('option');
        option.value = line;
        option.textContent = `${line} (${supervisorMapping[line]})`;
        select.appendChild(option);
    });
}

function updateLineFilters() {
    populateSewLineSelect('lineFilter');
    populateSewLineSelect('newSewLine');
    populateSewLineSelect('editSewLine');
}

function openEditModalForOperator(operatorId) {
    selectedOperatorId = operatorId;
    const op = operators.find(o => o.operatorId === operatorId);
    if (!op) return;

    getElement('editOperatorId').textContent = op.operatorId;
    getElement('editOperatorName').textContent = op.name;

    populateSewLineSelect('editSewLine');
    getElement('editSewLine').value = op.sewLine || '';

    getElement('editSkillLevel').value = calculateMultiSkillGrade(operatorId);

    const score = calculateSkillScore(operatorId);
    getElement('editSkillScore').value = score.toFixed(2);
    getElement('scoreSlider').value = Math.round(score * 100);

    openModal('editCellModal');
}

async function handleAddOperator(e) {
    e.preventDefault();

    const newId = getElement('newOperatorId').value.trim();
    if (operators.some(o => o.operatorId === newId)) {
        showToast('Operator ID already exists', 'error');
        return;
    }

    const data = {
        operatorId: newId,
        name: getElement('newOperatorName').value.trim(),
        sewLine: getElement('newSewLine').value,
        skillLevel: getElement('newSkillLevel').value,
        skillScore: 0
    };

    const success = await addOperator(data);
    if (success) {
        // Set the newly added operator ID for highlighting
        lastAddedOperatorId = newId;
        showToast('Operator added successfully');
        closeModal('addOperatorModal');
        e.target.reset();
    }
}

async function handleEditOperator(e) {
    e.preventDefault();

    if (!selectedOperatorId) return;
    const op = operators.find(o => o.operatorId === selectedOperatorId);
    if (!op) return;

    const updates = {
        sewLine: getElement('editSewLine').value,
        skillLevel: getElement('editSkillLevel').value,
        skillScore: parseFloat(getElement('editSkillScore').value) || 0
    };

    const success = await updateOperator(op.id, updates);
    if (success) {
        showToast('Operator updated successfully');
        closeModal('editCellModal');
    }
}

async function handleDeleteOperator(id, operatorId) {
    const recordCount = performanceData.filter(p => p.operatorId === operatorId).length;
    const confirmMsg = recordCount > 0
        ? `This will also delete ${recordCount} linked performance record(s). Are you sure?`
        : 'Are you sure you want to delete this operator?';

    if (confirm(confirmMsg)) {
        const success = await deleteOperator(id, operatorId);
        if (success) showToast('Operator and linked records deleted');
    }
}

// ==================== EDIT EXISTING DETAILS MODAL FUNCTIONS ====================

/**
 * Open Edit Existing Details Modal
 * If operatorId is provided, pre-select that operator
 */
function openEditExistingDetailsModal(operatorId = null) {
    // Populate operators dropdown
    populateEditExistingOperatorSelect();

    // Populate main machine dropdown
    populateMachineOptions('editExistingMachine');

    // Reset form
    currentEditRecordId = null;
    getElement('editExistingRecordSelect').innerHTML = '<option value="">Select Record</option>';
    getElement('editExistingRecordDetails').style.display = 'none';
    getElement('otherMachinesContainer').innerHTML = '';

    // Update info display
    getElement('editExistingOperatorName').textContent = '-';
    getElement('editExistingOperatorId').textContent = '-';
    getElement('editExistingCurrentGrade').textContent = '-';
    getElement('editExistingRecordCount').textContent = '0';

    // If operatorId provided, pre-select and load records
    if (operatorId) {
        const select = getElement('editExistingOperatorSelect');
        if (select) {
            select.value = operatorId;
            loadOperatorRecords(operatorId);
        }
    }

    // Show modal
    openModal('editExistingDetailsModal');
}

/**
 * Populate operator dropdown in Edit Existing Details modal
 */
function populateEditExistingOperatorSelect() {
    const select = getElement('editExistingOperatorSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Select Operator</option>';

    operators.forEach(op => {
        const option = document.createElement('option');
        option.value = op.operatorId;
        option.textContent = `${op.operatorId} - ${op.name}`;
        select.appendChild(option);
    });
}

/**
 * Load performance records for selected operator
 */
function loadOperatorRecords(operatorId) {
    const recordSelect = getElement('editExistingRecordSelect');
    const detailsDiv = getElement('editExistingRecordDetails');

    if (!recordSelect) return;

    recordSelect.innerHTML = '<option value="">Select Record</option>';
    detailsDiv.style.display = 'none';
    currentEditRecordId = null;

    if (!operatorId) {
        getElement('editExistingOperatorName').textContent = '-';
        getElement('editExistingOperatorId').textContent = '-';
        getElement('editExistingCurrentGrade').textContent = '-';
        getElement('editExistingRecordCount').textContent = '0';
        return;
    }

    const operator = operators.find(op => op.operatorId === operatorId);
    const operatorRecords = performanceData.filter(p => p.operatorId === operatorId);

    // Update info display
    getElement('editExistingOperatorName').textContent = operator?.name || '-';
    getElement('editExistingOperatorId').textContent = operatorId;
    getElement('editExistingCurrentGrade').textContent = calculateMultiSkillGrade(operatorId);
    getElement('editExistingRecordCount').textContent = operatorRecords.length;

    // Populate records dropdown
    operatorRecords.forEach((record, index) => {
        const option = document.createElement('option');
        option.value = record.id;
        const timestamp = record.timestamp || record.date;
        const dateStr = timestamp ? new Date(timestamp).toLocaleDateString() : 'No date';
        option.textContent = `#${index + 1}: ${record.operation || 'Unknown'} - ${record.machine || 'N/A'} (${dateStr})`;
        recordSelect.appendChild(option);
    });
}

/**
 * Load record details into form fields
 */
function loadRecordDetails(recordId) {
    const detailsDiv = getElement('editExistingRecordDetails');

    if (!recordId) {
        detailsDiv.style.display = 'none';
        currentEditRecordId = null;
        return;
    }

    const record = performanceData.find(r => r.id === recordId);
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }

    currentEditRecordId = recordId;

    // Populate form fields
    // Populate form fields
    getElement('editExistingOperation').value = record.operation || '';

    // Ensure machine options are populated before setting value
    // populateMachineOptions('editExistingMachine'); // Already called in open modal, but maybe safe to call again?
    // No, calling it again might reset selection. It should be populated once.
    getElement('editExistingMachine').value = record.machine || record.machineName || '';

    getElement('editExistingStdSMV').value = record.standardSMV || '';
    getElement('editExistingWorkingSMV').value = record.workingSMV || '';
    getElement('editExistingEfficiency').value = record.efficiency || '';
    getElement('editExistingOperationGrade').value = record.operationGrade || '';

    // Handle various CTQ field names
    getElement('editExistingCtq').value = record.criticalToQuality || record.ctq || record.ctqStatus || '';

    getElement('editExistingBottleneck').checked = record.bottleneck || false;

    // Populate timestamp and date
    if (record.timestamp) {
        const timestamp = record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp);
        getElement('editExistingRecordDate').textContent = timestamp.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        getElement('editExistingRecordTime').textContent = timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
    } else {
        getElement('editExistingRecordDate').textContent = record.date || '-';
        getElement('editExistingRecordTime').textContent = '-';
    }

    // Load other machines from this specific record
    loadOtherMachines(record);

    // Load known machines from all operator records
    loadKnownMachines(record.operatorId);

    // Show details section
    detailsDiv.style.display = 'block';
}

/**
 * Load other machines from record
 */
function loadOtherMachines(record) {
    const container = getElement('otherMachinesContainer');
    if (!container) return;

    container.innerHTML = '';

    // Parse otherMachines and otherMachineEfficiencies
    if (record.otherMachines && record.otherMachineEfficiencies) {
        const machines = record.otherMachines.split(', ').map(m => m.trim()).filter(m => m);
        const efficiencies = record.otherMachineEfficiencies;

        machines.forEach(machine => {
            addOtherMachineRow(machine, efficiencies[machine] || 0);
        });
    }
}

/**
 * Load all known machines from all operator's performance records
 * Displays as badges in the Known Machines section
 */
function loadKnownMachines(operatorId) {
    const container = getElement('knownMachinesDisplay');
    if (!container) return;

    // Get all records for this operator
    const operatorRecords = performanceData.filter(r => r.operatorId === operatorId);

    if (operatorRecords.length === 0) {
        container.innerHTML = '<span style="color: #94a3b8; font-size: 0.9rem;">No records found for this operator</span>';
        return;
    }

    // Collect all unique machines with their avg efficiencies
    const machineStats = {};

    operatorRecords.forEach(record => {
        // Primary machine
        if (record.machine) {
            if (!machineStats[record.machine]) {
                machineStats[record.machine] = { count: 0, totalEff: 0 };
            }
            machineStats[record.machine].count++;
            machineStats[record.machine].totalEff += record.efficiency || 0;
        }

        // Other machines
        if (record.otherMachines) {
            const otherList = record.otherMachines.split(', ').map(m => m.trim()).filter(m => m);
            const effMap = record.otherMachineEfficiencies || {};

            otherList.forEach(machine => {
                if (!machineStats[machine]) {
                    machineStats[machine] = { count: 0, totalEff: 0 };
                }
                machineStats[machine].count++;
                machineStats[machine].totalEff += effMap[machine] || 0;
            });
        }
    });

    if (Object.keys(machineStats).length === 0) {
        container.innerHTML = '<span style="color: #94a3b8; font-size: 0.9rem;">No machines recorded for this operator</span>';
        return;
    }

    // Generate badges
    container.innerHTML = Object.entries(machineStats).map(([machine, stats]) => {
        const avgEff = stats.count > 0 ? (stats.totalEff / stats.count).toFixed(1) : 0;
        const effColor = avgEff >= 60 ? '#10b981' : avgEff >= 50 ? '#f59e0b' : '#ef4444';

        return `
            <span style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(99, 102, 241, 0.1);
                border-radius: 20px;
                font-size: 0.85rem;
                color: #4f46e5;
                border: 1px solid rgba(99, 102, 241, 0.2);
            ">
                <i class="fas fa-microchip" style="font-size: 0.75rem;"></i>
                ${machine}
                <span style="color: ${effColor}; font-weight: 600;">${avgEff}%</span>
                <span style="color: #94a3b8; font-size: 0.7rem;">(${stats.count}x)</span>
            </span>
        `;
    }).join('');
}

/**
 * Add a new row for other machine input
 */
function addOtherMachineRow(machine = '', efficiency = '') {
    const container = getElement('otherMachinesContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'other-machine-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';

    row.innerHTML = `
        <select class="other-machine-select" style="flex: 2; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <option value="">Select Machine</option>
            <optgroup label="KANSAI Family">
                <option value="KANSAI">KANSAI</option>
                <option value="FLATSEAMER">FLATSEAMER</option>
                <option value="MULTI_NEEDLE">MULTI NEEDLE</option>
            </optgroup>
            <optgroup label="Single Needle Family">
                <option value="SNLS">SNLS</option>
                <option value="SNCS">SNCS</option>
            </optgroup>
            <optgroup label="Double Needle Family">
                <option value="DNLS">DNLS</option>
            </optgroup>
            <optgroup label="Overlock / Flatlock">
                <option value="OVERLOCK">OVERLOCK</option>
                <option value="FLATLOCK">FLATLOCK</option>
            </optgroup>
            <optgroup label="Special Machines">
                <option value="FOA">FOA</option>
                <option value="BARTACK">BARTACK</option>
                <option value="BUTTON_ATTACH">BUTTON ATTACH</option>
                <option value="BUTTONHOLE">BUTTONHOLE</option>
            </optgroup>
            <option value="Others">Others</option>
        </select>
        <input type="number" class="other-machine-efficiency" min="0" max="200" step="0.1" placeholder="Eff %" 
            style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${efficiency}">
        <button type="button" class="btn-icon btn-icon-danger remove-other-machine" title="Remove" 
            style="width: 32px; height: 32px;">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Set machine value if provided
    if (machine) {
        const select = row.querySelector('.other-machine-select');
        select.value = machine;
    }

    // Add remove event
    row.querySelector('.remove-other-machine').addEventListener('click', () => {
        row.remove();
    });

    container.appendChild(row);
}

/**
 * Get other machines data from form
 */
function getOtherMachinesData() {
    const container = getElement('otherMachinesContainer');
    if (!container) return { otherMachines: '', otherMachineEfficiencies: {} };

    const rows = container.querySelectorAll('.other-machine-row');
    const machines = [];
    const efficiencies = {};

    rows.forEach(row => {
        const machine = row.querySelector('.other-machine-select').value;
        const efficiency = parseFloat(row.querySelector('.other-machine-efficiency').value) || 0;

        if (machine) {
            machines.push(machine);
            efficiencies[machine] = efficiency;
        }
    });

    return {
        otherMachines: machines.join(', '),
        otherMachineEfficiencies: efficiencies
    };
}

/**
 * Save existing details to Firebase
 */
async function saveExistingDetails() {
    if (!currentEditRecordId) {
        showToast('No record selected', 'error');
        return;
    }

    const record = performanceData.find(r => r.id === currentEditRecordId);
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }

    // Gather updated data
    const otherMachinesData = getOtherMachinesData();

    const updates = {
        operation: getElement('editExistingOperation').value || record.operation,
        machine: getElement('editExistingMachine').value || record.machine,
        standardSMV: parseFloat(getElement('editExistingStdSMV').value) || record.standardSMV,
        workingSMV: parseFloat(getElement('editExistingWorkingSMV').value) || record.workingSMV,
        efficiency: parseFloat(getElement('editExistingEfficiency').value) || record.efficiency,
        operationGrade: getElement('editExistingOperationGrade').value || record.operationGrade,
        // Save as standard field names
        ctq: getElement('editExistingCtq').value || record.ctq,
        criticalToQuality: getElement('editExistingCtq').value || record.ctq, // Standardizing
        ctqStatus: getElement('editExistingCtq').value || record.ctqStatus, // Legacy support
        bottleneck: getElement('editExistingBottleneck').checked,
        otherMachines: otherMachinesData.otherMachines,
        otherMachineEfficiencies: otherMachinesData.otherMachineEfficiencies,
        lastModified: new Date().toISOString()
    };

    try {
        const success = await updatePerformanceRecord(currentEditRecordId, updates);
        if (success) {
            showToast('Performance record updated successfully!');
            closeModal('editExistingDetailsModal');
        } else {
            showToast('Failed to update record', 'error');
        }
    } catch (error) {
        console.error('Error saving details:', error);
        showToast('Error saving: ' + error.message, 'error');
    }
}

// ==================== OPERATOR ACTION BUTTON FUNCTIONS ====================

/**
 * View operator performance - navigate to performance page filtered by operator
 * Matches helo reference lines 2542-2580
 */
function viewOperatorPerformance(operatorId) {
    const operator = operators.find(op => op.operatorId === operatorId);
    if (!operator) {
        showToast('Operator not found!', 'error');
        return;
    }

    const operatorRecords = performanceData.filter(record => record.operatorId === operatorId);

    if (operatorRecords.length === 0) {
        showToast(`No performance records found for ${operator.name}. Create one in the Time Study page.`, 'error');
        return;
    }

    // Navigate to performance page with operator filter
    // Store the operatorId to pre-fill search on the performance page
    sessionStorage.setItem('filterOperatorId', operatorId);

    showToast(`Loading ${operatorRecords.length} record(s) for ${operator.name}...`);
    window.location.href = `performance.html?operatorId=${encodeURIComponent(operatorId)}`;
}

/**
 * Start time study for operator - navigate to time-study page with pre-filled data
 * Matches helo reference lines 2268-2306
 */
function startTimeStudyForOperator(operatorId) {
    const operator = operators.find(op => op.operatorId === operatorId);
    if (!operator) {
        showToast('Operator not found!', 'error');
        return;
    }

    // Store operator data in sessionStorage for the time-study page to pick up
    const timeStudyData = {
        operatorId: operatorId,
        operatorName: operator.name,
        sewLine: operator.sewLine || ''
    };

    sessionStorage.setItem('timeStudyOperator', JSON.stringify(timeStudyData));

    showToast(`Time study ready for ${operator.name}. Redirecting...`, 'success');

    // Navigate to time-study page
    window.location.href = `time-study.html?operatorId=${encodeURIComponent(operatorId)}`;
}
