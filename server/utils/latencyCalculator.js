/**
 * Latency calculation and signal strength utilities.
 */

/**
 * Maps latency (ms) to a signal strength label.
 * @param {number} latencyMs
 * @returns {'STRONG'|'MEDIUM'|'WEAK'}
 */
function getSignalStrength(latencyMs) {
    if (latencyMs <= 50) return 'STRONG';
    if (latencyMs <= 150) return 'MEDIUM';
    return 'WEAK';
}

module.exports = { getSignalStrength };
