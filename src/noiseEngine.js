/**
 * Quantum Decoherence & Noise Engine
 * ─────────────────────────────────────────────────────────────────
 * Simulates realistic quantum noise using exponential decay models.
 *
 * Physical Models:
 * 1. Amplitude Damping (T1 Relaxation): Energy loss, decay toward |0⟩
 * 2. Phase Damping (T2 Dephasing): Loss of coherence, collapse to Z-axis
 * 3. Depolarizing Noise: Uniform white noise, uniform shrinking
 *
 * All operations use vanilla JavaScript and work directly with Bloch vectors.
 */

// ─────────────────────────────────────────────────────────────────
// PHYSICAL CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────────────

/**
 * Base decay rates (per second) for each noise model.
 * These represent characteristic relaxation/dephasing times in real hardware.
 *
 * T1 (amplitude damping): ~10-100 µs on superconducting qubits
 * T2 (phase damping): ~1-100 µs on superconducting qubits
 * Depolarizing: Variable, typically slower than T2
 */
const BASE_RATES = {
  amplitudeDamping: 1e6, // 1 µs T1 characteristic time
  phaseDamping: 2e6, // 0.5 µs T2 characteristic time
  depolarizing: 1.5e6, // 0.67 µs depolarizing time
};

// ─────────────────────────────────────────────────────────────────
// NOISE MODEL: AMPLITUDE DAMPING (T1 RELAXATION)
// ─────────────────────────────────────────────────────────────────

/**
 * Amplitude Damping: Energy Relaxation
 *
 * Physics:
 * The qubit spontaneously emits energy and relaxes to the ground state |0⟩.
 * The north pole (0, 0, +1) is the ground state.
 *
 * Mathematical behavior:
 * - x, y components decay exponentially (lose transverse magnetization)
 * - z component decays toward +1 (the qubit falls to the ground state)
 * - The Bloch sphere contracts and drifts upward
 *
 * @param {Object} vector - Current Bloch vector { x, y, z }
 * @param {number} deltaTime - Time step in seconds
 * @param {number} intensity - Noise intensity [0.0, 1.0]
 *
 * @returns {Object} Noisy vector { x, y, z }
 */
function amplitudeDamping(vector, deltaTime, intensity) {
  if (intensity <= 0) return { ...vector };

  // Calculate effective decay rate
  const gamma = BASE_RATES.amplitudeDamping * intensity;
  const decay = Math.exp(-gamma * deltaTime);

  // Transverse components (x, y) decay exponentially
  const x_new = vector.x * decay;
  const y_new = vector.y * decay;

  // Longitudinal component (z) decays and drifts toward +1 (ground state)
  // z_new = decay * z + (1 - decay) * 1
  const z_new = vector.z * decay + (1 - decay);

  return { x: x_new, y: y_new, z: z_new };
}

// ─────────────────────────────────────────────────────────────────
// NOISE MODEL: PHASE DAMPING (T2 DEPHASING)
// ─────────────────────────────────────────────────────────────────

/**
 * Phase Damping: Loss of Coherence
 *
 * Physics:
 * Environmental interactions cause phase randomization without energy loss.
 * The Bloch vector loses its transverse components and aligns with the Z-axis.
 *
 * Mathematical behavior:
 * - x, y components decay exponentially
 * - z component remains unchanged (no energy, just phase)
 * - Creates a mixed state inside the sphere (reduced purity)
 *
 * @param {Object} vector - Current Bloch vector { x, y, z }
 * @param {number} deltaTime - Time step in seconds
 * @param {number} intensity - Noise intensity [0.0, 1.0]
 *
 * @returns {Object} Noisy vector { x, y, z }
 */
function phaseDamping(vector, deltaTime, intensity) {
  if (intensity <= 0) return { ...vector };

  // Calculate effective decay rate
  const gamma = BASE_RATES.phaseDamping * intensity;
  const decay = Math.exp(-gamma * deltaTime);

  // Transverse components collapse toward zero
  const x_new = vector.x * decay;
  const y_new = vector.y * decay;

  // Longitudinal component unchanged (no energy loss)
  const z_new = vector.z;

  return { x: x_new, y: y_new, z: z_new };
}

// ─────────────────────────────────────────────────────────────────
// NOISE MODEL: DEPOLARIZING NOISE
// ─────────────────────────────────────────────────────────────────

/**
 * Depolarizing Noise: Uniform White Noise
 *
 * Physics:
 * Uniform white noise from the environment causes the qubit to dephase
 * uniformly in all directions, moving toward a maximally mixed state.
 *
 * Mathematical behavior:
 * - All components (x, y, z) decay exponentially
 * - Uniform shrinking toward the origin (0, 0, 0)
 * - Represents a completely mixed/random state when fully decayed
 *
 * @param {Object} vector - Current Bloch vector { x, y, z }
 * @param {number} deltaTime - Time step in seconds
 * @param {number} intensity - Noise intensity [0.0, 1.0]
 *
 * @returns {Object} Noisy vector { x, y, z }
 */
function depolarizingNoise(vector, deltaTime, intensity) {
  if (intensity <= 0) return { ...vector };

  // Calculate effective decay rate
  const gamma = BASE_RATES.depolarizing * intensity;
  const decay = Math.exp(-gamma * deltaTime);

  // All components decay uniformly toward origin
  const x_new = vector.x * decay;
  const y_new = vector.y * decay;
  const z_new = vector.z * decay;

  return { x: x_new, y: y_new, z: z_new };
}

// ─────────────────────────────────────────────────────────────────
// BOUNDED BLOCH VECTOR ENFORCEMENT
// ─────────────────────────────────────────────────────────────────

/**
 * Ensure the Bloch vector stays within the unit sphere (r ≤ 1).
 * This is a safety check to maintain physical validity.
 *
 * In practice, legitimate noise models should not violate this, but
 * numerical precision issues could cause small violations.
 *
 * @param {Object} vector - Bloch vector { x, y, z }
 * @returns {Object} Bounded vector
 */
function boundBlochVector(vector) {
  const r = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z,
  );

  if (r <= 1.0 + 1e-10) {
    // Already inside (within numerical precision)
    return { ...vector };
  }

  // Normalize to sphere surface (shouldn't happen with correct noise models)
  const scale = 1.0 / r;
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    z: vector.z * scale,
  };
}

// ─────────────────────────────────────────────────────────────────
// MASTER SIMULATION FUNCTION
// ─────────────────────────────────────────────────────────────────

/**
 * Apply all active noise models to the current Bloch vector.
 *
 * Noise models are applied sequentially in order:
 * 1. Amplitude Damping (T1) - moves toward ground state
 * 2. Phase Damping (T2) - collapses transverse components
 * 3. Depolarizing Noise - uniform shrinking
 *
 * This order reflects the typical physical hierarchy: energy loss first,
 * then phase decoherence, then background noise.
 *
 * @param {Object} vector - Current ideal Bloch vector { x, y, z }
 * @param {number} deltaTime - Time step in seconds (typically 1/60 for 60 FPS)
 * @param {Object} sliders - Noise intensity controls:
 *   {
 *     amplitude: [0.0, 1.0],    // T1 relaxation strength
 *     phase: [0.0, 1.0],        // T2 dephasing strength
 *     depolarizing: [0.0, 1.0]  // Depolarizing noise strength
 *   }
 *
 * @returns {Object} Noisy Bloch vector { x, y, z }
 */
function updateSimulation(vector, deltaTime, sliders) {
  if (!vector || deltaTime <= 0) {
    return { ...vector };
  }

  // Default slider values if not provided
  const s = sliders || { amplitude: 0, phase: 0, depolarizing: 0 };

  // Start with the ideal vector
  let noisy = { ...vector };

  // Apply noise models sequentially
  if (s.amplitude > 0) {
    noisy = amplitudeDamping(noisy, deltaTime, s.amplitude);
  }

  if (s.phase > 0) {
    noisy = phaseDamping(noisy, deltaTime, s.phase);
  }

  if (s.depolarizing > 0) {
    noisy = depolarizingNoise(noisy, deltaTime, s.depolarizing);
  }

  // Safety: ensure bounded result
  noisy = boundBlochVector(noisy);

  return noisy;
}

// ─────────────────────────────────────────────────────────────────
// FIDELITY CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate quantum state fidelity between noisy and ideal states.
 *
 * For pure single-qubit states, fidelity is:
 * F = (1 + |⟨ψ_ideal|ψ_noisy⟩|) / 2
 *
 * In Bloch sphere representation:
 * F = (1 + r_ideal · r_noisy) / 2
 *
 * Where:
 * - r_ideal: Ideal Bloch vector (typically on surface, |r| ≈ 1)
 * - r_noisy: Actual Bloch vector after noise
 *
 * Fidelity ranges [0, 1]:
 * - F = 1.0: Perfect state (no noise)
 * - F = 0.5: Maximally mixed state (loss of all information)
 * - F = 0.0: Orthogonal to ideal (very rare)
 *
 * @param {Object} idealVector - Ideal Bloch vector { x, y, z }
 * @param {Object} noisyVector - Noisy Bloch vector { x, y, z }
 *
 * @returns {number} Fidelity [0.0, 1.0]
 */
function calculateFidelity(idealVector, noisyVector) {
  if (!idealVector || !noisyVector) return 1.0;

  // Dot product: r_ideal · r_noisy
  const dotProduct =
    idealVector.x * noisyVector.x +
    idealVector.y * noisyVector.y +
    idealVector.z * noisyVector.z;

  // Fidelity formula
  const fidelity = (1 + dotProduct) / 2;

  // Clamp to [0, 1] for numerical stability
  return Math.max(0, Math.min(1, fidelity));
}

// ─────────────────────────────────────────────────────────────────
// PURITY CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate quantum state purity (degree of coherence).
 *
 * For a qubit represented as a Bloch vector:
 * Purity P = (1 + |r|²) / 2
 *
 * Where |r| is the magnitude of the Bloch vector.
 *
 * Purity ranges [0.5, 1.0]:
 * - P = 1.0: Pure state (on sphere surface, |r| = 1)
 * - P = 0.5: Maximally mixed state (at origin, |r| = 0)
 *
 * @param {Object} vector - Bloch vector { x, y, z }
 *
 * @returns {number} Purity [0.5, 1.0]
 */
function calculatePurity(vector) {
  if (!vector) return 1.0;

  const r_squared =
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
  const purity = (1 + r_squared) / 2;

  return Math.max(0.5, Math.min(1, purity));
}

// ─────────────────────────────────────────────────────────────────
// UTILITY: COMBINE VECTORS
// ─────────────────────────────────────────────────────────────────

/**
 * Linearly interpolate between two Bloch vectors.
 * Useful for smooth transitions or visualization.
 *
 * @param {Object} v1 - First Bloch vector
 * @param {Object} v2 - Second Bloch vector
 * @param {number} t - Interpolation factor [0, 1]
 *
 * @returns {Object} Interpolated vector
 */
function interpolateBloch(v1, v2, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: v1.x + (v2.x - v1.x) * clampedT,
    y: v1.y + (v2.y - v1.y) * clampedT,
    z: v1.z + (v2.z - v1.z) * clampedT,
  };
}

// ─────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────

export {
  amplitudeDamping,
  phaseDamping,
  depolarizingNoise,
  updateSimulation,
  calculateFidelity,
  calculatePurity,
  boundBlochVector,
  interpolateBloch,
  BASE_RATES,
};
