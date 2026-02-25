# 🧪 Quantum Fragility Lab – Interactive 3D Quantum Simulator & Game

Quantum Fragility Lab is an interactive web-based quantum visualization platform that helps users understand how quantum states behave, evolve, and degrade in real-world environments.

Instead of heavy equations, the system uses visual simulation with Bloch spheres, circuits, and noise effects to demonstrate quantum fragility intuitively.

The platform also includes a game mode where users solve qubit manipulation challenges by applying correct quantum gates.

---

# 🚀 Features

## 🧿 3D Bloch Sphere Visualization

* Real-time Bloch sphere for each qubit
* Vector tilts according to applied gates
* Smooth animated transitions
* Shows quantum state direction and purity

---

## 🔗 Quantum Circuit Builder

* Click gates to add to circuit timeline
* Supports single-qubit and two-qubit gates
* Gate playback animation step-by-step
* Undo and remove gates interactively

Supported gates:

* X, Y, Z
* H (Hadamard)
* S, T phase gates
* Rotation gates Rx, Ry, Rz
* CNOT, CZ, SWAP

---

## 🌡️ Noise & Temperature Simulation

Simulates real-world quantum fragility.

Controls:

* Temperature slider
* Extra depolarizing noise
* Fidelity display

Effect:

* Bloch vector shrinks inward
* Purity decreases
* Decoherence visualized

---

## 📊 Measurement & Statistics

* Run multiple measurement shots
* Probability histogram of outcomes
* Correlation indicator
* State vector display

Shows:
|ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩

---

# 🎮 NEW: Quantum Game Mode – “Qubit Flip”

The simulator now includes an interactive challenge game to learn quantum gates through puzzles.

## Game Concept

Each level gives a target qubit state.
The player must apply correct quantum gates to reach that state.

Example tasks:

* Flip qubit from |0⟩ → |1⟩
* Create superposition
* Entangle qubits
* Match Bloch vector direction

## Game Features

* Levels with increasing difficulty
* Score and progress tracking
* Visual feedback of correctness
* Bloch sphere updates after each move
* Educational hints

Goal:
Learn quantum operations through interaction instead of theory.

---

# 🧠 How It Works (Concept)

1. Qubit state stored as quantum state vector
2. Gates apply matrix transformations
3. Bloch vector computed from density matrix
4. Noise model reduces coherence
5. 3D arrow updates direction & length
6. Circuit playback animates evolution

So users can visually see:

gate → state change → decoherence → measurement

---

# 🏗️ Tech Stack

Frontend:

* React.js
* Three.js
* Canvas API
* Recharts

Quantum Engine:

* Custom state-vector simulator
* Gate matrices
* Noise model

Rendering:

* 3D Bloch spheres
* Vector animation
* Circuit wire diagram

---

# 🎯 Purpose

Quantum computing is fragile in reality.
Most tools show ideal behavior.

This platform demonstrates:

* Decoherence
* Noise impact
* State degradation
* Measurement uncertainty

in a visual and interactive way.

---

# 👨‍🎓 Educational Value

Helps learners understand:

* Bloch sphere representation
* Quantum gates
* Superposition
* Entanglement
* Decoherence
* Measurement collapse

without equations.

---

# 🌍 Relevance to Real Quantum Systems

Real quantum hardware suffers from:

* Temperature noise
* Environmental interaction
* State decay

The simulator models these effects visually, helping users understand why quantum computers are difficult to build.

---

# 🎮 Why Game Mode Matters

Learning quantum mechanics is abstract.

Game mode provides:

* Hands-on experimentation
* Goal-based learning
* Intuitive understanding
* Engagement & retention

It turns quantum physics into an interactive puzzle experience.

---

# 🧪 Example Use Cases

* Quantum education
* Classroom demonstrations
* Hackathon showcase
* Research visualization
* Interactive tutorials

---

# 🏁 Conclusion

Quantum Fragility Lab combines:

3D visualization
Circuit simulation
Noise modeling
Interactive gameplay

to create a complete intuitive quantum learning platform.

It demonstrates not just how quantum systems work —
but why they fail in reality.
