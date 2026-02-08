import { db, collection, onSnapshot, query, orderBy, where, doc, updateDoc, serverTimestamp, setDoc, deleteDoc, getDocs } from './firebase-config.js';
import { showToast, GENERAL_ALLOWANCE } from './common.js?v=1.0.1';

let operatorsUnsubscribe = null;
let performanceUnsubscribe = null;

// Cache to avoid re-fetching if not needed
let operatorsCache = [];
let performanceCache = [];

export function subscribeToOperators(callback) {
    if (operatorsUnsubscribe) {
        // Already subscribed, return cache immediately then continue listening
        if (operatorsCache.length > 0) callback(operatorsCache);
        return;
    }

    const q = query(collection(db, 'operators'), orderBy('operatorId'));

    operatorsUnsubscribe = onSnapshot(q, (snapshot) => {
        const operators = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            operators.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                lastUpdated: data.lastUpdated?.toDate() || new Date()
            });
        });
        operatorsCache = operators;
        callback(operators);
    }, (error) => {
        console.error("Error fetching operators:", error);
        showToast("Error loading operators", "error");
    });
}

export function subscribeToPerformance(callback) {
    if (performanceUnsubscribe) {
        if (performanceCache.length > 0) callback(performanceCache);
        return;
    }

    const q = query(collection(db, 'performance'), orderBy('timestamp', 'desc'));

    performanceUnsubscribe = onSnapshot(q, (snapshot) => {
        const performanceData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            performanceData.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(),
                lastUpdated: data.lastUpdated?.toDate() || new Date(),
                allowance: GENERAL_ALLOWANCE
            });
        });
        performanceCache = performanceData;
        callback(performanceData);
    }, (error) => {
        console.error("Error fetching performance data:", error);
        showToast("Error loading performance data", "error");
    });
}

// CRUD Operations
export async function addOperator(operatorData) {
    try {
        const docRef = doc(collection(db, 'operators'));
        await setDoc(docRef, {
            ...operatorData,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            skillScore: 0
        });
        return true;
    } catch (error) {
        console.error("Error adding operator:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function updateOperator(id, data) {
    try {
        const docRef = doc(db, 'operators', id);
        await updateDoc(docRef, {
            ...data,
            lastUpdated: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating operator:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function deleteOperator(id, operatorId) {
    try {
        // Cascading Deletion: First delete all performance records for this operator
        if (operatorId) {
            const performanceQuery = query(
                collection(db, 'performance'),
                where('operatorId', '==', operatorId)
            );
            const performanceSnapshot = await getDocs(performanceQuery);
            const deletePromises = [];
            performanceSnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, 'performance', docSnapshot.id)));
            });
            await Promise.all(deletePromises);
            console.log(`Cascading delete: Removed ${deletePromises.length} performance records for operator ${operatorId}`);
        }

        // Now delete the operator
        await deleteDoc(doc(db, 'operators', id));
        return true;
    } catch (error) {
        console.error("Error deleting operator:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function addPerformanceRecord(record) {
    try {
        const docRef = doc(collection(db, 'performance'));
        await setDoc(docRef, {
            ...record,
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error adding performance record:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function updatePerformanceRecord(id, updates) {
    try {
        const docRef = doc(db, 'performance', id);
        updates.lastUpdated = serverTimestamp();
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating performance record:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function deletePerformanceRecord(id) {
    try {
        await deleteDoc(doc(db, 'performance', id));
        return true;
    } catch (error) {
        console.error("Error deleting performance record:", error);
        showToast(error.message, "error");
        return false;
    }
}

export async function getLastPerformanceRecord(operatorId) {
    try {
        const q = query(
            collection(db, 'performance'),
            where('operatorId', '==', operatorId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const records = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });

        // Sort in memory to avoid index issues with compound queries
        records.sort((a, b) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
            return tB - tA;
        });

        return records[0];
    } catch (error) {
        console.error("Error getting last record:", error);
        return null;
    }
}
