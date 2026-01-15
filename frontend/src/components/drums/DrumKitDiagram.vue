<script>
import { defineComponent } from "vue";

// General MIDI Drum Map with visual positions
const DRUM_KIT_VISUAL = {
  // Cymbals (top row)
  crashLeft: { midi: 49, x: 15, y: 10, label: "Crash L", color: "#FFD700" },
  ride: { midi: 51, x: 75, y: 10, label: "Ride", color: "#FFD700" },
  crashRight: { midi: 57, x: 85, y: 10, label: "Crash R", color: "#FFD700" },
  
  // Hi-Hat (left side)
  hiHat: { midi: 42, x: 10, y: 40, label: "Hi-Hat", color: "#C0C0C0" },
  
  // Toms (middle top)
  tomHigh: { midi: 50, x: 35, y: 25, label: "Tom 1", color: "#8B4513" },
  tomMid: { midi: 47, x: 50, y: 30, label: "Tom 2", color: "#8B4513" },
  tomLow: { midi: 45, x: 70, y: 45, label: "Tom 3", color: "#8B4513" },
  
  // Snare (center)
  snare: { midi: 38, x: 30, y: 55, label: "Snare", color: "#A9A9A9" },
  
  // Kick (bottom center)
  kick: { midi: 36, x: 50, y: 75, label: "Kick", color: "#2F4F4F" },
};

export default defineComponent({
  props: {
    activeDrums: {
      type: Array,
      default: () => [],
    },
    showLabels: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      drumKit: DRUM_KIT_VISUAL,
    };
  },
  methods: {
    isDrumActive(midiNote) {
      return this.activeDrums.includes(midiNote);
    },
  },
});
</script>

<template>
  <div class="drum-kit-diagram">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Drum pieces -->
      <g v-for="(drum, name) in drumKit" :key="name">
        <!-- Drum circle -->
        <circle
          :cx="drum.x"
          :cy="drum.y"
          :r="name === 'kick' ? 8 : name.startsWith('tom') ? 6 : 5"
          :fill="isDrumActive(drum.midi) ? drum.color : 'transparent'"
          :stroke="drum.color"
          :stroke-width="isDrumActive(drum.midi) ? 2 : 1"
          :class="{ 'active-drum': isDrumActive(drum.midi) }"
        />
        
        <!-- Label -->
        <text
          v-if="showLabels"
          :x="drum.x"
          :y="drum.y + (name === 'kick' ? 12 : name.startsWith('tom') ? 10 : 9)"
          text-anchor="middle"
          class="drum-label"
          :class="{ 'active-label': isDrumActive(drum.midi) }"
        >
          {{ drum.label }}
        </text>
      </g>
      
      <!-- Decorative stands/hardware -->
      <line x1="10" y1="40" x2="10" y2="90" stroke="#888" stroke-width="0.5" />
      <line x1="75" y1="10" x2="75" y2="90" stroke="#888" stroke-width="0.5" />
      <line x1="30" y1="55" x2="30" y2="80" stroke="#888" stroke-width="0.5" />
    </svg>
    
    <div v-if="activeDrums.length > 0" class="active-info">
      <small>{{ activeDrums.length }} drum{{ activeDrums.length !== 1 ? 's' : '' }} playing</small>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drum-kit-diagram {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  
  svg {
    width: 100%;
    height: auto;
  }
  
  .drum-label {
    font-size: 3px;
    fill: var(--bs-body-color);
    opacity: 0.7;
    transition: all 0.2s;
    
    &.active-label {
      opacity: 1;
      font-weight: bold;
    }
  }
  
  circle {
    transition: all 0.3s;
    cursor: pointer;
    
    &.active-drum {
      filter: drop-shadow(0 0 3px currentColor);
      animation: pulse 0.5s ease-in-out;
    }
  }
  
  .active-info {
    text-align: center;
    margin-top: 10px;
    color: var(--bs-secondary);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.mobile {
  .drum-kit-diagram {
    max-width: 300px;
    padding: 10px;
  }
}
</style>
