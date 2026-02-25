/**
 * Bloch Sphere Noise Integration
 * ─────────────────────────────────────────────────────────────────
 * Bridges the noise engine into a Three.js Bloch sphere visualization.
 *
 * Usage:
 * 1. Create a NoiseController in your React component's useRef()
 * 2. Call updateNoisyBloch() in your animation frame loop
 * 3. Use getNoisyBloch() to retrieve the current noisy state
 * 4. Use getMetrics() to read fidelity, purity, etc.
 */

import {
  updateSimulation,
  calculateFidelity,
  calculatePurity,
} from "./noiseEngine.js";

/**
 * NoiseController: Central hub for integrating noise into visualization.
 *
 * Maintains both ideal and noisy states, applies noise in real-time,
 * computes metrics, and provides a clean API for React components.
 */
class NoiseController {
  constructor() {
    // Ideal state (from quantum gates)
    this.idealBloch = { x: 0, y: 0, z: 1 };

    // Current noisy state (affected by noise models)
    this.noisyBloch = { x: 0, y: 0, z: 1 };

    // Noise intensity sliders [0, 1]
    this.noiseSliders = {
      amplitude: 0.0, // T1 relaxation
      phase: 0.0, // T2 dephasing
      depolarizing: 0.0, // White noise
    };

    // Timing & frame data
    this.lastFrameTime = null;
    this.accumulatedEnergy = 0; // For educational metrics

    // Metrics snapshot
    this.metrics = {
      fidelity: 1.0,
      purity: 1.0,
      decohereRate: 0.0,
      magnitude: 1.0,
    };

    // Optional: History for plotting
    this.history = [];
    this.maxHistoryLength = 120; // ~2 seconds at 60 FPS
  }

  /**
   * Set the ideal (noiseless) Bloch vector.
   * Call this after applying quantum gates.
   *
   * @param {Object} bloch - { x, y, z }
   */
  setIdealBloch(bloch) {
    if (!bloch || typeof bloch.x !== "number") {
      console.warn("Invalid Bloch vector:", bloch);
      return;
    }
    this.idealBloch = { x: bloch.x, y: bloch.y, z: bloch.z };
  }

  /**
   * Set noise intensity sliders (0.0 to 1.0).
   *
   * @param {Object} sliders - { amplitude?, phase?, depolarizing? }
   */
  setNoiseIntensity(sliders) {
    if (sliders.amplitude !== undefined) {
      this.noiseSliders.amplitude = Math.max(0, Math.min(1, sliders.amplitude));
    }
    if (sliders.phase !== undefined) {
      this.noiseSliders.phase = Math.max(0, Math.min(1, sliders.phase));
    }
    if (sliders.depolarizing !== undefined) {
      this.noiseSliders.depolarizing = Math.max(
        0,
        Math.min(1, sliders.depolarizing),
      );
    }
  }

  /**
   * Update the noisy Bloch vector (call once per animation frame).
   *
   * @param {DOMHighResTimeStamp} now - Timestamp from requestAnimationFrame()
   */
  updateNoisyBloch(now) {
    // First call: initialize timing
    if (this.lastFrameTime === null) {
      this.lastFrameTime = now;
      return;
    }

    // Calculate delta time in seconds
    const deltaTime = Math.max(0, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    // Early exit if delta is too small (shouldn't happen, but safety)
    if (deltaTime < 1e-6) {
      return;
    }

    // Apply noise engine
    this.noisyBloch = updateSimulation(
      this.noisyBloch,
      deltaTime,
      this.noiseSliders,
    );

    // Calculate metrics
    this.metrics.fidelity = calculateFidelity(this.idealBloch, this.noisyBloch);
    this.metrics.purity = calculatePurity(this.noisyBloch);

    // Magnitude for UI feedback
    const r = Math.sqrt(
      this.noisyBloch.x * this.noisyBloch.x +
        this.noisyBloch.y * this.noisyBloch.y +
        this.noisyBloch.z * this.noisyBloch.z,
    );
    this.metrics.magnitude = r;

    // Decohere rate (how much purity is lost per frame)
    const purityLoss = Math.max(0, 1 - this.metrics.purity);
    this.metrics.decohereRate = purityLoss / 0.5; // Normalized to [0, 1]

    // Record history for plotting
    this._recordHistory();
  }

  /**
   * Record current state for history/plotting.
   * @private
   */
  _recordHistory() {
    this.history.push({
      time: this.history.length,
      fidelity: this.metrics.fidelity,
      purity: this.metrics.purity,
      magnitude: this.metrics.magnitude,
      bloch: { ...this.noisyBloch },
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Get the current noisy Bloch vector.
   *
   * @returns {Object} { x, y, z }
   */
  getNoisyBloch() {
    return { ...this.noisyBloch };
  }

  /**
   * Get ideal (gate-computed, noiseless) Bloch vector.
   *
   * @returns {Object} { x, y, z }
   */
  getIdealBloch() {
    return { ...this.idealBloch };
  }

  /**
   * Get current quantum metrics.
   *
   * @returns {Object} { fidelity, purity, decohereRate, magnitude }
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get noise intensity settings.
   *
   * @returns {Object} { amplitude, phase, depolarizing }
   */
  getNoiseIntensity() {
    return { ...this.noiseSliders };
  }

  /**
   * Reset the noisy state to ideal.
   * Useful for restarting simulation.
   */
  resetNoise() {
    this.noisyBloch = { ...this.idealBloch };
    this.lastFrameTime = null;
    this.history = [];
    this.metrics = {
      fidelity: 1.0,
      purity: 1.0,
      decohereRate: 0.0,
      magnitude: 1.0,
    };
  }

  /**
   * Get quantized color based on fidelity (for UI feedback).
   *
   * @returns {string} Hex color
   */
  getFidelityColor() {
    const f = this.metrics.fidelity;
    if (f > 0.9) return "#00f5ff"; // Cyan: excellent
    if (f > 0.7) return "#50fa7b"; // Green: good
    if (f > 0.5) return "#ffcc44"; // Yellow: degraded
    if (f > 0.3) return "#ff9955"; // Orange: poor
    return "#ff5555"; // Red: very bad
  }

  /**
   * Export history as CSV for analysis.
   *
   * @returns {string} CSV data
   */
  exportHistoryCSV() {
    const header = "time,fidelity,purity,magnitude,x,y,z\n";
    const rows = this.history
      .map(
        (h) =>
          `${h.time},${h.fidelity.toFixed(4)},${h.purity.toFixed(4)},${h.magnitude.toFixed(4)},${h.bloch.x.toFixed(4)},${h.bloch.y.toFixed(4)},${h.bloch.z.toFixed(4)}`,
      )
      .join("\n");
    return header + rows;
  }
}

// ─────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────

export { NoiseController };
