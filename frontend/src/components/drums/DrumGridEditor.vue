<template>
  <div class="drum-grid">
    <div class="drum-header">
      <h4>Drum Editor - Bar {{ currentBar + 1 }}</h4>
      <button @click="$emit('close')" class="btn btn-sm btn-secondary">Close</button>
    </div>
    <div class="controls">
      <button @click="previousBar" :disabled="currentBar === 0" class="btn btn-sm btn-outline-primary">←</button>
      <button @click="nextBar" :disabled="!hasNextBar" class="btn btn-sm btn-outline-primary">→</button>
      <span class="bar-counter">Bar {{ currentBar + 1 }}</span>
      <button @click="playPattern" v-if="!isPlaying" class="btn btn-sm btn-success">Play</button>
      <button @click="stopPlayback" v-else class="btn btn-sm btn-danger">Stop</button>
      <button @click="clearBar" class="btn btn-sm btn-warning">Clear</button>
      <button @click="loadPattern('rock')" class="btn btn-sm btn-info">Rock Beat</button>
    </div>
    <div class="grid-container">
      <div v-for="drum in displayDrums" :key="drum" class="drum-row">
        <div class="drum-label">{{ drum }}</div>
        <div class="cells">
          <div
            v-for="stepIndex in 16"
            :key="stepIndex"
            :class="getCellClass(drum, stepIndex - 1)"
            @click="toggleNote(drum, stepIndex - 1)"
          >
            <span v-if="grid[drum] && grid[drum][stepIndex - 1]" class="note-dot">●</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as alphaTab from "@coderline/alphatab";
import { defineComponent } from "vue";
import {
  createEmptyDrumPattern,
  createRockBeatPattern,
  alphaTabBeatsToGrid,
  GM_DRUM_MAP
} from "../../utils/drum-utils";

export default defineComponent({
  name: "DrumGridEditor",
  props: {
    api: {
      type: Object,
      required: true
    },
    trackIndex: {
      type: Number,
      required: true
    }
  },
  emits: ["close"],
  data() {
    return {
      currentBar: 0,
      subdivision: 16,
      grid: createEmptyDrumPattern(1, 16),
      isPlaying: false,
      displayDrums: [
        "crashCymbal1",
        "rideCymbal1",
        "hiHatClosed",
        "hiHatOpen",
        "tomHigh",
        "tomLowMid",
        "snare",
        "kick"
      ],
      playbackTimeoutId: null
    };
  },
  computed: {
    hasNextBar() {
      const track = this._getTrack();
      if (!track || !track.staves || track.staves.length === 0) return false;
      const staff = track.staves[0];
      if (!staff.bars || staff.bars.length === 0) return false;
      return this.currentBar < staff.bars.length - 1;
    }
  },
  mounted() {
    this.loadBarIntoGrid();
  },
  methods: {
    _getTrack() {
      if (!this.api || !this.api.score || !this.api.score.tracks) return null;
      return this.api.score.tracks[this.trackIndex];
    },
    loadBarIntoGrid() {
      const track = this._getTrack();
      if (!track || !track.staves || track.staves.length === 0) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        return;
      }
      const staff = track.staves[0];
      if (!staff.bars || staff.bars.length === 0) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        return;
      }
      const bar = staff.bars[this.currentBar];
      if (!bar || !bar.voices || bar.voices.length === 0) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        return;
      }
      const voice = bar.voices[0];
      const beats = voice.beats || [];
      this.grid = alphaTabBeatsToGrid(beats);
    },
    toggleNote(drumName, stepIndex) {
      if (!this.grid[drumName]) {
        this.grid[drumName] = Array(this.subdivision).fill(false);
      }
      this.grid[drumName][stepIndex] = !this.grid[drumName][stepIndex];
      console.log(`Toggled ${drumName} at step ${stepIndex}: ${this.grid[drumName][stepIndex]}`);
    },
    playPattern() {
      if (!this.api || !this.api.player) {
        console.warn("AlphaTab player not available");
        return;
      }
      this.isPlaying = true;
      this.api.player.play();
      this.playbackTimeoutId = setTimeout(() => {
        this.stopPlayback();
      }, 2000);
    },
    stopPlayback() {
      if (this.api && this.api.player) {
        this.api.player.stop();
      }
      this.isPlaying = false;
      if (this.playbackTimeoutId) {
        clearTimeout(this.playbackTimeoutId);
        this.playbackTimeoutId = null;
      }
    },
    clearBar() {
      if (confirm("Clear all notes in this bar?")) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        console.log("Bar cleared");
      }
    },
    loadPattern(patternName) {
      if (patternName === "rock") {
        this.grid = createRockBeatPattern();
        console.log("Loaded rock beat pattern");
      }
    },
    previousBar() {
      if (this.currentBar > 0) {
        this.currentBar--;
        this.loadBarIntoGrid();
      }
    },
    nextBar() {
      if (this.hasNextBar) {
        this.currentBar++;
        this.loadBarIntoGrid();
      }
    },
    getCellClass(drumName, stepIndex) {
      const classes = ["cell"];
      if (this.grid[drumName] && this.grid[drumName][stepIndex]) {
        classes.push("active");
      }
      if (stepIndex % 4 === 0) {
        classes.push("beat-start");
      }
      return classes;
    }
  }
});
</script>

<style scoped>
.drum-grid {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  padding: 1rem;
  background-color: var(--bs-body-bg);
}

.drum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.bar-counter {
  font-weight: bold;
  margin: 0 0.5rem;
}

.grid-container {
  overflow-x: auto;
}

.drum-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.drum-label {
  width: 90px;
  font-weight: bold;
  font-size: 0.875rem;
}

.cells {
  display: flex;
  gap: 2px;
}

.cell {
  width: 32px;
  height: 32px;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: var(--bs-body-bg);
}

.cell:hover {
  background-color: var(--bs-secondary-bg);
}

.cell.beat-start {
  border-left: 2px solid var(--bs-primary);
}

.cell.active {
  background-color: var(--bs-primary);
}

.note-dot {
  color: white;
  font-size: 20px;
}
</style>
