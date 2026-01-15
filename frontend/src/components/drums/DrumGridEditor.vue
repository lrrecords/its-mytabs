<template>
  <div class="drum-grid">
    <div v-for="row in grid" :key="row.id" class="grid-row">
      <div v-for="cell in row.cells" :key="cell.id" class="grid-cell" @click="toggleCell(cell)">
        <div class="cell-content" :class="{ active: cell.active }"></div>
      </div>
    </div>
    <div class="controls">
      <button @click="playPattern">Play</button>
      <button @click="clearBars">Clear</button>
      <button @click="loadPreset('rock')">Load Rock Beat</button>
      <button @click="navigateBars(-1)">Previous Bar</button>
      <button @click="navigateBars(1)">Next Bar</button>
    </div>
  </div>
</template>

<script>
import { createRef } from 'vue';
import AlphaTab from 'alphatab'; // Ensure AlphaTab is installed

export default {
  data() {
    return {
      grid: this.createGrid(),
      currentBar: 0,
    };
  },
  methods: {
    createGrid() {
      // Initialize a simple 4x4 grid for the example
      return Array.from({ length: 4 }, (_, rowId) => ({
        id: rowId,
        cells: Array.from({ length: 4 }, (_, cellId) => ({ id: cellId, active: false }))
      }));
    },
    toggleCell(cell) {
      cell.active = !cell.active;
    },
    playPattern() {
      // Logic to play the pattern using AlphaTab API
      const pattern = this.grid.reduce((acc, row) => acc.concat(row.cells.map(cell => cell.active ? 'X' : '-')), '');
      AlphaTab.render(pattern);
    },
    clearBars() {
      this.grid.forEach(row => row.cells.forEach(cell => cell.active = false));
    },
    navigateBars(direction) {
      this.currentBar += direction;
      // Logic for navigating through bars can be added here
    },
    loadPreset(presetName) {
      if (presetName === 'rock') {
        // Load rock preset pattern; this is an example
        this.grid.forEach((row, rowIndex) => row.cells.forEach((cell, cellIndex) => {
          cell.active = (rowIndex == 1 && cellIndex == 0) || (rowIndex == 2 && cellIndex == 2);
        }));
      }
    },
  },
};
</script>

<style scoped>
.drum-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.grid-row {
  display: flex;
}
.grid-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  margin: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell-content {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  transition: background-color 0.3s;
}
.cell-content.active {
  background-color: #76e3b7;
}
.controls {
  margin-top: 10px;
}
.controls button {
  margin: 0 5px;
}
</style>