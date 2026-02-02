<template>
  <div class="drum-grid">
    <div class="drum-header">
      <h3>Drum Grid Editor - Bar {{ currentBar + 1 }}</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <div class="controls">
      <button @click="previousBar" :disabled="currentBar === 0">←</button>
      <button @click="nextBar" :disabled="!hasNextBar">→</button>
      <button @click="playPattern">Play</button>
      <button @click="stopPlayback">Stop</button>
      <button @click="clearBar">Clear</button>
      <button @click="loadPattern('rock')">Rock Beat</button>
    </div>

    <div class="grid-container">
      <div v-for="drumName in displayDrums" :key="drumName" class="drum-row">
        <div class="drum-label">{{ drumName }}</div>
        <div class="cells">
          <div
            v-for="stepIndex in subdivision"
            :key="stepIndex"
            :class="getCellClass(drumName, stepIndex - 1)"
            @click="toggleNote(drumName, stepIndex - 1)"
          >
            <div v-if="grid[drumName] && grid[drumName][stepIndex - 1]" class="note-dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import alphaTab from "@coderline/alphatab";
import {
  createEmptyDrumPattern,
  createRockBeatPattern,
  gridToAlphaTabBeats,
  alphaTabBeatsToGrid,
} from "../../utils/drum-utils";

export default defineComponent({
  props: {
    api: {
      type: Object,
      required: true,
    },
    trackIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["close"],
  data() {
    return {
      currentBar: 0,
      subdivision: 16,
      grid: createEmptyDrumPattern(1, 16),
      isPlaying: false,
      displayDrums: [
        "hiHatClosed",
        "hiHatOpen",
        "crashCymbal1",
        "rideCymbal1",
        "snare",
        "kick",
        "tomHigh",
        "tomLowMid",
        "tomLow",
      ],
      playbackTimeoutId: null,
    };
  },
  computed: {
    hasNextBar() {
      const track = this._getTrack();
      if (!track || !track.staves || !track.staves[0]) return false;
      return this.currentBar < track.staves[0].bars.length - 1;
    },
  },
  mounted() {
    this.loadBarIntoGrid();
  },
  methods: {
    _getTrack() {
      try {
        if (!this.api || !this.api.score || !this.api.score.tracks) return null;
        return this.api.score.tracks[this.trackIndex];
      } catch (error) {
        console.error("Error getting track:", error);
        return null;
      }
    },

    loadBarIntoGrid() {
      try {
        const track = this._getTrack();
        if (!track || !track.staves || !track.staves[0]) {
          console.error("No valid track or staves found");
          return;
        }

        const bar = track.staves[0].bars[this.currentBar];
        if (!bar || !bar.voices || !bar.voices[0]) {
          console.error("No valid bar or voices found");
          this.grid = createEmptyDrumPattern(1, this.subdivision);
          return;
        }

        const beats = bar.voices[0].beats;
        this.grid = alphaTabBeatsToGrid(beats);
      } catch (error) {
        console.error("Error loading bar into grid:", error);
        this.grid = createEmptyDrumPattern(1, this.subdivision);
      }
    },

    toggleNote(drumName, stepIndex) {
      if (!this.grid[drumName]) {
        this.grid[drumName] = Array(this.subdivision).fill(false);
      }
      this.grid[drumName][stepIndex] = !this.grid[drumName][stepIndex];
      this.updateAlphaTabScore();
    },

    updateAlphaTabScore() {
      try {
        const track = this._getTrack();
        if (!track || !track.staves || !track.staves[0]) {
          console.error("Cannot update score - no valid track");
          return;
        }

        const bar = track.staves[0].bars[this.currentBar];
        if (!bar || !bar.voices || !bar.voices[0]) {
          console.error("Cannot update score - no valid bar");
          return;
        }

        const beats = gridToAlphaTabBeats(this.grid, this.subdivision, alphaTab);
        if (!beats || beats.length === 0) {
          console.error("gridToAlphaTabBeats returned empty beats");
          return;
        }

        bar.voices[0].beats = beats;
        this.api.renderTracks([track]);
      } catch (error) {
        console.error("Error updating AlphaTab score:", error);
      }
    },

    playPattern() {
      try {
        this.updateAlphaTabScore();

        if (this.api.player) {
          // Seek to the start of the current bar if possible
          const track = this._getTrack();
          if (track && track.staves && track.staves[0]) {
            const bar = track.staves[0].bars[this.currentBar];
            if (bar) {
              try {
                this.api.tickPosition(bar.start);
              } catch (seekError) {
                console.error("Error seeking to bar start:", seekError);
              }
            }
          }

          this.api.player.play();
          this.isPlaying = true;

          // Auto-stop after 2 seconds
          if (this.playbackTimeoutId) {
            clearTimeout(this.playbackTimeoutId);
          }
          this.playbackTimeoutId = setTimeout(() => {
            this.stopPlayback();
          }, 2000);
        }
      } catch (error) {
        console.error("Error playing pattern:", error);
      }
    },

    stopPlayback() {
      try {
        if (this.api.player) {
          this.api.player.stop();
        }
        this.isPlaying = false;
        if (this.playbackTimeoutId) {
          clearTimeout(this.playbackTimeoutId);
          this.playbackTimeoutId = null;
        }
      } catch (error) {
        console.error("Error stopping playback:", error);
      }
    },

    clearBar() {
      if (confirm("Clear all notes in this bar?")) {
        this.grid = createEmptyDrumPattern(1, this.subdivision);
        this.updateAlphaTabScore();
      }
    },

    loadPattern(patternName) {
      if (patternName === "rock") {
        this.grid = createRockBeatPattern();
        this.updateAlphaTabScore();
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
      if (stepIndex % 4 === 0) {
        classes.push("beat-start");
      }
      if (this.grid[drumName] && this.grid[drumName][stepIndex]) {
        classes.push("active");
      }
      return classes.join(" ");
    },
  },
});
</script>

<style scoped>
.drum-grid {
  background: var(--bs-body-bg, #fff);
  border: 1px solid var(--bs-border-color, #ddd);
  border-radius: 8px;
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.drum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.drum-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--bs-body-color, #333);
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: var(--bs-danger, #dc3545);
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.controls button {
  padding: 6px 12px;
  border: 1px solid var(--bs-border-color, #ddd);
  background: var(--bs-body-bg, #fff);
  color: var(--bs-body-color, #333);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.controls button:hover:not(:disabled) {
  background: var(--bs-secondary-bg, #e9ecef);
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.grid-container {
  overflow-x: auto;
  border: 1px solid var(--bs-border-color, #ddd);
  border-radius: 4px;
  background: var(--bs-body-bg, #fff);
}

.drum-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--bs-border-color, #eee);
}

.drum-row:last-child {
  border-bottom: none;
}

.drum-label {
  width: 90px;
  padding: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  border-right: 1px solid var(--bs-border-color, #ddd);
  background: var(--bs-secondary-bg, #f8f9fa);
  flex-shrink: 0;
}

.cells {
  display: flex;
  flex: 1;
}

.cell {
  width: 32px;
  height: 32px;
  border-right: 1px solid var(--bs-border-color, #eee);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bs-body-bg, #fff);
}

.cell:hover {
  background: var(--bs-secondary-bg, #f8f9fa);
}

.cell.beat-start {
  border-left: 2px solid var(--bs-border-color, #999);
}

.cell.active {
  background: var(--bs-primary-bg-subtle, #cfe2ff);
}

.note-dot {
  width: 12px;
  height: 12px;
  background: var(--bs-primary, #0d6efd);
  border-radius: 50%;
}
</style>