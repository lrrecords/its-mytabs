<template>
  <div class="drum-track-info">
    <h1>Drum Track Information</h1>
    <ul>
      <li v-for="drum in drums" :key="drum.name">
        <strong>{{ drum.name }}</strong> (MIDI Note: {{ drum.midiNote }}) - Category: {{ drum.category }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'DrumTrackInfo',
  data() {
    return {
      drums: [
        { name: 'Kick', midiNote: 36, category: 'Bass Drum' },
        { name: 'Snare', midiNote: 38, category: 'Snare Drum' },
        { name: 'Hi-Hat', midiNote: 42, category: 'Cymbal' },
        { name: 'Tom', midiNote: 50, category: 'Tom' },
        { name: 'Floor Tom', midiNote: 43, category: 'Tom' },
        { name: 'Crash', midiNote: 49, category: 'Cymbal' },
        { name: 'Ride', midiNote: 51, category: 'Cymbal' }
      ]
    };
  }
};
</script>

<style scoped>
.drum-track-info {
  font-family: Arial, sans-serif;
}
</style>