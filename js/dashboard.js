import { subscribeToOperators, subscribeToPerformance } from './data-service.js';
import { showToast, updateRealTimeClock } from './common.js';
import { NavigationSystem, Cursor, initLenis, initAnimations } from './ui-core.js';

let operators = [];
let performanceData = [];
let efficiencyChart = null;
let machineUsageChart = null;
let linePerformanceChart = null;

// DOM Cache
const elements = {};

document.addEventListener('DOMContentLoaded', () => {
    // Cache Elements
    const ids = [
        'dashboardLineFilter', 'periodFilter', 'bottleneckLineSelect',
        'timeStudiesLineSelect', 'skillCardA', 'skillCardB', 'skillCardC', 'skillCardD',
        'closeModal', 'modalOverlay', 'btnStandardSMV', 'btnWorkingSMV',
        'combinedSMVLineSelect', 'combinedSMVStyleSelect', 'dashboardAvgEfficiency',
        'dashboardAvgSMV', 'dashboardAvgWorkingSMV', 'headerActiveLines',
        'dashboardGroupACount', 'dashboardGroupBCount', 'dashboardGroupCCount',
        'dashboardGroupDCount', 'bottleneckList', 'footerTimeStudiesCount',
        'timeStudiesLineSelect', 'skillGroupModal', 'modalGroupName',
        'modalGroupDesc', 'modalOperatorCount', 'operatorListContent',
        'combinedSMVValue', 'combinedSMVLabel'
    ];

    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });

    // Special case for search input which might not have an ID like others
    elements.searchInput = document.querySelector('input[placeholder="Search for operators, machines, or styles..."]');

    // Init UI Core
    new NavigationSystem();
    new Cursor();
    initLenis();
    initAnimations();

    // Init common features
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);

    // Subscribe to data
    subscribeToOperators((data) => {
        operators = data;
        updateOperatorStats();
        updateHeaderStats();
    });

    subscribeToPerformance((data) => {
        performanceData = data;
        updateDashboard();
        updateGarmentSMVSelectors();
        updateHeaderStats();
    });

    // Event Listeners
    elements.dashboardLineFilter?.addEventListener('change', updateDashboard);
    elements.periodFilter?.addEventListener('change', updateDashboard);
    elements.bottleneckLineSelect?.addEventListener('change', updateBottleneckList);

    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', updateDashboard);
    }

    elements.timeStudiesLineSelect?.addEventListener('change', updateTimeStudiesStats);

    ['A', 'B', 'C', 'D'].forEach(group => {
        elements[`skillCard${group}`]?.addEventListener('click', () => showSkillGroupModal(group));
    });

    elements.closeModal?.addEventListener('click', closeSkillGroupModal);
    elements.modalOverlay?.addEventListener('click', closeSkillGroupModal);

    elements.btnStandardSMV?.addEventListener('click', () => toggleSMVMode('standard'));
    elements.btnWorkingSMV?.addEventListener('click', () => toggleSMVMode('working'));

    elements.combinedSMVLineSelect?.addEventListener('change', () => {
        updateStyleOptions(elements.combinedSMVLineSelect.value, elements.combinedSMVStyleSelect);
        updateCombinedSMV();
    });

    elements.combinedSMVStyleSelect?.addEventListener('change', updateCombinedSMV);
});

let currentSMVMode = 'standard';

function getFilteredData() {
    let filtered = [...performanceData];

    // 1. Line Filter
    const lineFilter = elements.dashboardLineFilter?.value;
    if (lineFilter) {
        filtered = filtered.filter(d => d.lineNo === lineFilter);
    }

    // 2. Search Filter
    const term = elements.searchInput?.value.toLowerCase();
    if (term) {
        filtered = filtered.filter(d =>
            (d.operatorName && d.operatorName.toLowerCase().includes(term)) ||
            (d.styleNo && d.styleNo.toLowerCase().includes(term)) ||
            (d.lineNo && d.lineNo.toLowerCase().includes(term)) ||
            (d.machineName && d.machineName.toLowerCase().includes(term))
        );
    }

    // 3. Period Filter
    const period = elements.periodFilter?.value;
    if (period && period !== 'all') {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (period === 'week') {
            start.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            start.setMonth(now.getMonth() - 1);
        }

        filtered = filtered.filter(d => {
            let dDate;
            if (d.timestamp && typeof d.timestamp.toDate === 'function') {
                dDate = d.timestamp.toDate();
            } else if (d.timestamp) {
                dDate = new Date(d.timestamp);
            } else {
                return false;
            }
            return dDate >= start;
        });
    }

    return filtered;
}

function updateDashboard() {
    const filteredData = getFilteredData();
    updatePerformanceStats(filteredData);
    updateCharts(filteredData);
    updateBottleneckList(filteredData);
    updateOperatorStats();
    updateCombinedSMV();
}

function updateOperatorStats() {
    const lineFilter = elements.dashboardLineFilter;
    const selectedLine = lineFilter?.value;

    // Filter operators if line selected
    let filteredOperators = operators;
    if (selectedLine) {
        filteredOperators = operators.filter(op => op.sewLine === selectedLine);
    }

    if (elements.dashboardTotalOperators) elements.dashboardTotalOperators.textContent = filteredOperators.length;

    const groups = { A: 0, B: 0, C: 0, D: 0 };
    filteredOperators.forEach(op => {
        // Naive skill grouping based on stored level or ID if not present
        // In real app, might calculate based on perf, but let's use what's stored
        let level = op.skillLevel;
        if (!level || !level.includes('Group')) {
            // fallback logic?
            level = 'Group D';
        }

        if (level.includes('A')) groups.A++;
        else if (level.includes('B')) groups.B++;
        else if (level.includes('C')) groups.C++;
        else if (level.includes('D')) groups.D++;
    });

    if (elements.dashboardGroupACount) elements.dashboardGroupACount.textContent = groups.A;
    if (elements.dashboardGroupBCount) elements.dashboardGroupBCount.textContent = groups.B;
    if (elements.dashboardGroupCCount) elements.dashboardGroupCCount.textContent = groups.C;
    if (elements.dashboardGroupDCount) elements.dashboardGroupDCount.textContent = groups.D;

    // Sync with Header Total Ops (Always show total or filtered? User said "populate", total usually means global total)
    // But let's show filtered count if filter is active, or maybe header should stay global?
    // "Total Operators only shows total but not linewise breakdown from dropdowns" implies main card should change.
    // Header usually shows Global.
    const headerTotal = elements.headerTotalOperators;
    if (headerTotal) headerTotal.textContent = operators.length; // Keep global for header

    // Populate Line Filter if empty
    if (lineFilter && lineFilter.options.length <= 1) {
        const lines = [...new Set(operators.map(op => op.sewLine).filter(Boolean))].sort();
        lines.forEach(line => {
            const opt = document.createElement('option');
            opt.value = line;
            opt.textContent = line;
            lineFilter.appendChild(opt);
        });
    }
}

function updatePerformanceStats(data) {
    // If no data passed, use global (initial load) - but actually we should use filtered
    const currentData = data || performanceData;

    if (currentData.length === 0) {
        if (elements.dashboardTotalOperations) elements.dashboardTotalOperations.textContent = '0';
        if (elements.dashboardAvgEfficiency) elements.dashboardAvgEfficiency.textContent = '0%';
        if (elements.dashboardAvgSMV) elements.dashboardAvgSMV.textContent = '0.00';
        return;
    }

    if (elements.dashboardTotalOperations) elements.dashboardTotalOperations.textContent = currentData.length;

    const totalEff = currentData.reduce((sum, r) => sum + (r.efficiency || 0), 0);
    const avgEff = totalEff / currentData.length;
    if (elements.dashboardAvgEfficiency) elements.dashboardAvgEfficiency.textContent = avgEff.toFixed(1) + '%';

    const totalStdSMV = currentData.reduce((sum, r) => sum + (r.standardSMV || 0), 0);
    if (elements.dashboardAvgSMV) elements.dashboardAvgSMV.textContent = (totalStdSMV / currentData.length).toFixed(2);

    // Working SMV Avg
    const totalWorkingSMV = currentData.reduce((sum, r) => sum + (r.workingSMV || 0), 0);
    const avgWorking = totalWorkingSMV / currentData.length;
    const avgWorkingEl = elements.dashboardAvgWorkingSMV;
    if (avgWorkingEl) avgWorkingEl.textContent = avgWorking.toFixed(2);

    // Update Line Filter Options (Only populate on initial load or if empty)
    const lineFilter = elements.dashboardLineFilter;
    const bottleneckFilter = elements.bottleneckLineSelect; // Keep this separate or sync?

    if (lineFilter && lineFilter.options.length <= 1) { // Only populate if just default
        const lines = [...new Set(performanceData.map(d => d.lineNo).filter(Boolean))].sort();
        lines.forEach(line => {
            const opt = document.createElement('option');
            opt.value = line;
            opt.textContent = line;
            lineFilter.appendChild(opt);

            // Also populate bottleneck filter here?
            if (bottleneckFilter) {
                const bOpt = opt.cloneNode(true);
                bottleneckFilter.appendChild(bOpt);
            }
        });
    }
}

function updateCharts(data) {
    const currentData = data || performanceData;
    updateEfficiencyChart(currentData);
    updateLinePerformanceChart(currentData);
    updateMachineUsageChart(currentData);
    updateMachineUsageList(currentData);
}

function updateLinePerformanceChart(data) {
    const ctx = document.getElementById('linePerformanceChart')?.getContext('2d');
    if (!ctx) return;

    const currentData = data || performanceData;
    const selectedLine = elements.dashboardLineFilter?.value;

    let labels = [];
    let dataPoints = [];
    let chartLabel = 'Avg Efficiency (%)';

    if (selectedLine) {
        // Show Operator Efficiency for the selected line
        chartLabel = `Operator Efficiency (${selectedLine})`;
        const opMap = {};
        currentData.forEach(d => {
            if (!d.operatorName) return;
            if (!opMap[d.operatorName]) opMap[d.operatorName] = { sum: 0, count: 0 };
            opMap[d.operatorName].sum += (d.efficiency || 0);
            opMap[d.operatorName].count++;
        });

        labels = Object.keys(opMap).sort();
        dataPoints = labels.map(l => (opMap[l].sum / opMap[l].count));
    } else {
        // Group by Line (Original logic)
        const lineMap = {};
        currentData.forEach(d => {
            if (!d.lineNo) return;
            if (!lineMap[d.lineNo]) lineMap[d.lineNo] = { sum: 0, count: 0 };
            lineMap[d.lineNo].sum += (d.efficiency || 0);
            lineMap[d.lineNo].count++;
        });

        labels = Object.keys(lineMap).sort();
        dataPoints = labels.map(l => (lineMap[l].sum / lineMap[l].count));
    }

    if (linePerformanceChart) linePerformanceChart.destroy();

    linePerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: dataPoints,
                backgroundColor: '#8b5cf6', // Violet
                borderRadius: 4,
                barThickness: selectedLine ? 30 : 20 // Responsive thickness
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: !!selectedLine } // Show legend if operator view? Or keep hidden? 
                // Let's keep display: false for clean look if label is enough
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: selectedLine ? 10 : 12 },
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function updateEfficiencyChart(data) {
    const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
    if (!ctx) return;

    // Use passed data which is already filtered
    const currentData = data || performanceData;
    const selectedLine = elements.dashboardLineFilter?.value; // Still useful for label logic

    let labels = [];
    let dataPoints = [];
    let label = 'Average Efficiency';

    if (selectedLine) {
        // Per Operator in that line
        label = `Operator Efficiency (${selectedLine})`;
        const lineData = performanceData.filter(d => d.lineNo === selectedLine);
        // Group by operator
        const opMap = {};
        lineData.forEach(d => {
            if (!opMap[d.operatorId]) opMap[d.operatorId] = { sum: 0, count: 0, name: d.operatorName };
            opMap[d.operatorId].sum += (d.efficiency || 0);
            opMap[d.operatorId].count++;
        });

        Object.entries(opMap).forEach(([id, stats]) => {
            labels.push(id); // or stats.name
            dataPoints.push(stats.sum / stats.count);
        });

    } else {
        // Per Line
        label = 'Average Efficiency by Line';
        const lineMap = {};
        currentData.forEach(d => {
            if (!d.lineNo) return;
            if (!lineMap[d.lineNo]) lineMap[d.lineNo] = { sum: 0, count: 0 };
            lineMap[d.lineNo].sum += (d.efficiency || 0);
            lineMap[d.lineNo].count++;
        });

        labels = Object.keys(lineMap).sort();
        dataPoints = labels.map(l => lineMap[l].sum / lineMap[l].count);
    }

    if (efficiencyChart) efficiencyChart.destroy();

    // Data processing for Pie Chart (Distribution)
    // Categories: Below 70%, 70-85%, Above 85%
    let below70 = 0, between70_85 = 0, above85 = 0;

    if (currentData.length > 0) {
        currentData.forEach(d => {
            const eff = d.efficiency || 0;
            if (eff < 70) below70++;
            else if (eff < 85) between70_85++;
            else above85++;
        });
    }

    efficiencyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Below 70%', '70-85%', 'Above 85%'],
            datasets: [{
                data: [below70, between70_85, above85],
                backgroundColor: ['#e11d48', '#3b82f6', '#0ea5e9'], // Red, Blue, Light Blue
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#475569', font: { size: 10 }, usePointStyle: true, boxWidth: 8 }
                }
            },
            cutout: '70%'
        }
    });
}

function updateMachineUsageChart(data) {
    const ctx = document.getElementById('machinePerformanceChart')?.getContext('2d');
    if (!ctx) return;

    const currentData = data || performanceData;

    const machineCounts = {};
    currentData.forEach(d => {
        const machine = d.machineName || 'Unknown';
        machineCounts[machine] = (machineCounts[machine] || 0) + 1;
    });

    const labels = Object.keys(machineCounts);
    const chartData = Object.values(machineCounts);

    if (machineUsageChart) machineUsageChart.destroy();

    machineUsageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: [
                    '#4cc9f0', '#f72585', '#3a0ca3', '#4361ee', '#7209b7',
                    '#fb8500', '#ffb703', '#8ecae6', '#219ebc', '#023047'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#475569' }
                }
            }
        }
    });
}



function updateMachineUsageList(data) {
    const container = elements.machineUsageList;
    if (!container) return;

    const currentData = data || performanceData;
    const machineCounts = {};
    currentData.forEach(d => {
        const machine = d.machineName || 'Unknown';
        machineCounts[machine] = (machineCounts[machine] || 0) + 1;
    });

    const sortedMachines = Object.entries(machineCounts).sort((a, b) => b[1] - a[1]);

    container.innerHTML = '';

    if (sortedMachines.length === 0) {
        container.innerHTML = '<div class="text-sm text-slate-500 italic p-2">No machine data available</div>';
        return;
    }

    sortedMachines.forEach(([machine, count]) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 bg-[#0f172a] rounded-lg border border-[#334155]';
        div.innerHTML = `
            <span class="text-xs text-slate-300">${machine}</span>
            <span class="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">${count} ops</span>
        `;
        container.appendChild(div);
    });
}



function toggleSMVMode(mode) {
    currentSMVMode = mode;
    const btnStd = elements.btnStandardSMV;
    const btnWork = elements.btnWorkingSMV;
    const label = elements.combinedSMVLabel;

    if (mode === 'standard') {
        btnStd.classList.add('bg-indigo-600', 'text-white');
        btnStd.classList.remove('text-slate-400');
        btnWork.classList.remove('bg-indigo-600', 'text-white');
        btnWork.classList.add('text-slate-400');
        label.textContent = 'STANDARD SMV (MIN)';
    } else {
        btnWork.classList.add('bg-indigo-600', 'text-white');
        btnWork.classList.remove('text-slate-400');
        btnStd.classList.remove('bg-indigo-600', 'text-white');
        btnStd.classList.add('text-slate-400');
        label.textContent = 'WORKING SMV (MIN)';
    }
    updateCombinedSMV();
}

function updateGarmentSMVSelectors() {
    const lines = [...new Set(performanceData.map(d => d.lineNo).filter(Boolean))].sort();
    const select = elements.combinedSMVLineSelect;
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Select Line</option>';
    lines.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        select.appendChild(opt);
    });
    if (lines.includes(currentVal)) select.value = currentVal;
}

function updateCombinedSMV() {
    const line = elements.combinedSMVLineSelect?.value;
    const style = elements.combinedSMVStyleSelect?.value;
    const display = elements.combinedSMVValue;

    if (!display) return;
    if (!line) {
        display.textContent = '0.00';
        return;
    }

    let filtered = performanceData.filter(d => d.lineNo === line);
    if (style) filtered = filtered.filter(d => d.styleNo === style);

    const field = currentSMVMode === 'standard' ? 'standardSMV' : 'workingSMV';
    const total = filtered.reduce((sum, d) => sum + (d[field] || 0), 0);

    display.textContent = total.toFixed(2);

    // Visual feedback for the value
    display.className = `text-5xl font-black tracking-tight transition-colors duration-300 ${currentSMVMode === 'standard' ? 'text-[#4cc9f0]' : 'text-[#f72585]'
        }`;
}

function updateBottleneckList(data) {
    const container = elements.bottleneckList;
    if (!container) return;

    const currentData = data || performanceData;
    const localLineFilter = elements.bottleneckLineSelect?.value;

    let bottlenecks = currentData.filter(d => d.bottleneck === true);
    if (localLineFilter) bottlenecks = bottlenecks.filter(d => d.lineNo === localLineFilter);

    container.innerHTML = '';

    if (bottlenecks.length === 0) {
        container.innerHTML = '<div class="empty-state">No bottleneck operations identified</div>';
        return;
    }

    bottlenecks.forEach(b => {
        const div = document.createElement('div');
        div.className = 'p-3 mb-2 rounded-lg bg-[#1e293b] border border-slate-700/50 shadow-sm border-l-4 border-l-amber-500';
        div.innerHTML = `
            <div class="font-bold text-sm text-slate-200">${b.operation}</div>
            <div class="text-xs text-slate-400 mt-1 flex justify-between">
                <span>Line: ${b.lineNo}</span>
                <span>Eff: ${b.efficiency?.toFixed(1)}%</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">Operator: ${b.operatorName}</div>
        `;
        container.appendChild(div);
    });
}

function showSkillGroupModal(group) {
    const modal = elements.skillGroupModal;
    const nameEl = elements.modalGroupName;
    const descEl = elements.modalGroupDesc;
    const content = elements.operatorListContent;
    const countEl = elements.modalOperatorCount;

    if (!modal || !content) return;

    nameEl.textContent = `Group ${group}`;
    descEl.textContent = `List of Grade ${group} Operators currently active in the system.`;

    // Filter operators
    const filtered = operators.filter(op => {
        let level = op.skillLevel;
        if (!level || !level.includes('Group')) level = 'Group D';
        return level.includes(group);
    });

    content.innerHTML = '';
    if (filtered.length === 0) {
        content.innerHTML = '<div class="text-center py-10 text-slate-500 italic">No operators found in this group.</div>';
    } else {
        filtered.forEach(op => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-[#334155] hover:border-indigo-500/50 transition-colors group';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        ${op.operatorName ? op.operatorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">${op.operatorName || 'Unknown'}</div>
                        <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ID: ${op.operatorId || 'N/A'} • Line: ${op.sewLine || 'Unassigned'}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Grade ${group}</div>
                </div>
            `;
            content.appendChild(div);
        });
    }

    countEl.textContent = `${filtered.length} OPERATORS FOUND`;

    // Show modal
    modal.classList.remove('invisible', 'opacity-0');
    document.body.style.overflow = 'hidden';
}

function closeSkillGroupModal() {
    const modal = elements.skillGroupModal;
    if (!modal) return;
    modal.classList.add('invisible', 'opacity-0');
    document.body.style.overflow = '';
}

function updateHeaderStats() {
    // 1. Active Lines
    const activeLinesSet = new Set();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count lines with operators assigned
    if (operators) {
        operators.forEach(operator => {
            if (operator.sewLine) {
                activeLinesSet.add(operator.sewLine);
            }
        });
    }

    // Count lines with performance data in last 7 days
    if (performanceData) {
        performanceData.forEach(record => {
            if (record.lineNo && record.timestamp) {
                // handle firestore timestamp or date object
                const recordDate = record.timestamp && typeof record.timestamp.toDate === 'function'
                    ? record.timestamp.toDate()
                    : new Date(record.timestamp);

                if (recordDate >= sevenDaysAgo) {
                    activeLinesSet.add(record.lineNo);
                }
            }
        });
    }

    const activeLinesCount = activeLinesSet.size;
    const headerActiveLines = elements.headerActiveLines;
    if (headerActiveLines) headerActiveLines.textContent = activeLinesCount;
    // Also update dashboard card if exists (legacy ID: dashboardActiveLines)
    const dashboardActiveLines = document.getElementById('dashboardActiveLines'); // Not in elements cache, so use getElementById
    if (dashboardActiveLines) dashboardActiveLines.textContent = activeLinesCount;

    // 2. Time Studies (Moved to separate function for filtering)
    updateTimeStudiesStats();

    // 3. Last Sync
    if (performanceData.length > 0) { // Use currentData if available, else performanceData
        const dataToUse = performanceData;
        // ... actually last sync should check GLOBAL data not filtered data
        // So stick to performanceData
        if (performanceData.length > 0) {
            // find max timestamp
            const maxTime = performanceData.reduce((max, r) => {
                const rDate = r.timestamp && typeof r.timestamp.toDate === 'function' ? r.timestamp.toDate() : new Date(r.timestamp);
                return rDate > max ? rDate : max;
            }, new Date(0));

            if (maxTime.getTime() > 0) {
                const timeString = maxTime.toLocaleTimeString();
                const lastSyncEl = elements.lastSyncTime;
                if (lastSyncEl) lastSyncEl.textContent = timeString;
                // Also footer
                const footerSync = elements.lastSync;
                if (footerSync) footerSync.textContent = timeString;
            }
        }
    }
}

function updateTimeStudiesStats() {
    const lineFilter = elements.timeStudiesLineSelect;
    const selectedLine = lineFilter?.value;

    let filteredData = performanceData;
    if (selectedLine) {
        filteredData = performanceData.filter(d => d.lineNo === selectedLine);
    }

    // Count records with cycle times
    let timeStudiesCount = 0;
    if (filteredData) {
        timeStudiesCount = filteredData.filter(record =>
            record.cycleTimes && record.cycleTimes.length > 0
        ).length;
    }

    // Update Footer (which is inside the widget)
    const footerTimeStudies = elements.footerTimeStudiesCount;
    if (footerTimeStudies) footerTimeStudies.textContent = timeStudiesCount;

    // Header Time Studies - Let's keep it global or sync with widget?
    // If user selects line in widget, maybe header should reflect it?
    // But "Time Studies" in header usually implies global system status.
    // Let's decide: Header = Global, Footer = Filtered (if filter used).
    // If filter is empty, they match.

    if (!selectedLine) {
        const headerTimeStudies = elements.headerTimeStudies;
        if (headerTimeStudies) headerTimeStudies.textContent = timeStudiesCount;
    }

    // Populate Filter
    if (lineFilter && lineFilter.options.length <= 1) {
        // Get lines from performance data
        const lines = [...new Set(performanceData.map(d => d.lineNo).filter(Boolean))].sort();
        lines.forEach(line => {
            const opt = document.createElement('option');
            opt.value = line;
            opt.textContent = line;
            lineFilter.appendChild(opt);
        });
    }
}
