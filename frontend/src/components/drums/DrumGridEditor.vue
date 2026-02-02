<template>
  <div class="drum-grid">
    <div class="drum-header">
      <h4>Drum Pattern Editor</h4>
      <button @click="$emit('close')" class="btn btn-sm btn-secondary">Close</button>
    </div>
    <div class="controls">
      <button @click="previousBar" class="btn btn-sm" :disabled="currentBar === 0">←</button>
      <span>Bar {{ currentBar + 1 }}</span>
      <button @click="nextBar" class="btn btn-sm" :disabled="!hasNextBar">→</button>
      <button @click="playPattern" class="btn btn-sm btn-primary" :disabled="isPlaying">Play</button>
      <button @click="stopPlayback" class="btn btn-sm btn-dark" :disabled="!isPlaying">Stop</button>
      <button @click="clearBar" class="btn btn-sm btn-warning">Clear</button>
      <button @click="loadPattern('rock')" class="btn btn-sm btn-info">Rock Beat</button>
    </div>
    <div class="grid-container">
      <div v-for="drum in displayDrums" :key="drum.name" class="drum-row">
        <div class="drum-label">{{ drum.label }}</div>
        <div class="cells">
          <div
            v-for="(isActive, stepIndex) in grid[drum.name]"
            :key="stepIndex"
            :class="getCellClass(drum.name, stepIndex)"
            @click="toggleNote(drum.name, stepIndex)"
          >
            <div v-if="isActive" class="note-dot">●</div>
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
    api: { type: Object, required: true },
    trackIndex: { type: Number, required: true }
  },
  emits: ["close"],
  data() {
    return {
      currentBar: 0,
      subdivision: 16,
      grid: createEmptyDrumPattern(1, 16),
      isPlaying: false,
      displayDrums: [
        { name: "crashCymbal1", label: "Crash" },
        { name: "rideCymbal1", label: "Ride" },
        { name: "hiHatClosed", label: "HH Closed" },
        { name: "hiHatOpen", label: "HH Open" },
        { name: "tomHigh", label: "Tom 1" },
        { name: "tomLowMid", label: "Tom 2" },
        { name: "snare", label: "Snare" },
        { name: "kick", label: "Kick" }
      ],
      playbackTimeoutId: null
    };
  },
  computed: {
    hasNextBar() {
      const track = this._getTrack();
      if (!track) return false;
      return this.currentBar < (track.staves?.[0]?.bars?.length || 0) - 1;
    }
  },
  mounted() {
    this.loadBarIntoGrid();
  },
  methods: {
    _getTrack() {
      try {
        return this.api.score.tracks[this.trackIndex];
      } catch (e) {
        return null;
      }
    },
    loadBarIntoGrid() {
      const track = this._getTrack();
      if (!track) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        return;
      }
      const bar = track.staves?.[0]?.bars?.[this.currentBar];
      if (!bar || !bar.voices || !bar.voices[0]) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        return;
      }
      try {
        const beats = bar.voices[0].beats || [];
        this.grid = alphaTabBeatsToGrid(beats);
      } catch (err) {
        console.warn("Failed to load bar into grid:", err);
        this.grid = createEmptyDrumPattern(1, this.subdivision);
      }
    },
    toggleNote(drumName, stepIndex) {
      if (!this.grid[drumName]) {
        this.grid[drumName] = Array(this.subdivision).fill(false);
      }
      this.grid[drumName][stepIndex] = !this.grid[drumName][stepIndex];
      console.log("Grid updated - cell toggled:", drumName, stepIndex);
    },
    playPattern() {
      console.log("Playing pattern:", this.grid);
      try {
        const player = this.api.player;
        if (!player) {
          console.warn("AlphaTab player not available");
          return;
        }
        player.play();
        this.isPlaying = true;
        const approxBarMs = 2000;
        if (this.playbackTimeoutId) clearTimeout(this.playbackTimeoutId);
        this.playbackTimeoutId = setTimeout(() => {
          this.stopPlayback();
        }, approxBarMs);
      } catch (err) {
        console.error("playPattern error:", err);
      }
    },
    stopPlayback() {
      try {
        if (this.api && this.api.player && typeof this.api.player.stop === "function") {
          this.api.player.stop();
        }
      } catch (e) {
        console.warn("stopPlayback error:", e);
      }
      this.isPlaying = false;
      if (this.playbackTimeoutId) {
        clearTimeout(this.playbackTimeoutId);
        this.playbackTimeoutId = null;
      }
    },
    clearBar() {
      if (!confirm("Clear all notes in this bar?")) return;
      for (const drumName of Object.keys(this.grid)) {
        this.grid[drumName].fill(false);
      }
      console.log("Bar cleared");
    },
    loadPattern(patternName) {
      if (patternName === "rock") {
        this.grid = createRockBeatPattern();
        console.log("Rock beat pattern loaded");
      }
    },
    previousBar() {
      if (this.currentBar > 0) {
        this.currentBar--;
        this.loadBarIntoGrid();
      }
    },
    nextBar() {
      const track = this._getTrack();
      if (!track) return;
      const totalBars = track.staves?.[0]?.bars?.length || 0;
      if (this.currentBar < totalBars - 1) {
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
      return classes.join(" ");
    }
  }
});
</script>

<style scoped>
.drum-grid {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}
.drum-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}
.grid-container {
  overflow-x: auto;
}
.drum-row {
  display: flex;
  margin-bottom: 4px;
  align-items: center;
}
.drum-label {
  width: 90px;
  font-weight: 600;
  font-size: 13px;
}
.cells {
  display: flex;
  gap: 2px;
}
.cell {
  width: 32px;
  height: 32px;
  border: 1px solid var(--bs-border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--bs-body-bg);
}
.cell:hover {
  background: var(--bs-secondary-bg);
}
.cell.beat-start {
  border-left-width: 2px;
  border-left-color: var(--bs-primary);
}
.cell.active {
  background: var(--bs-primary);
  color: white;
}
.note-dot {
  color: white;
  font-size: 20px;
}
</style>
