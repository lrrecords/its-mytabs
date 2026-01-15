<script>
import { defineComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// General MIDI Drum Map with descriptions
const DRUM_INFO = {
  // Kick Drums
  36: { name: "Bass Drum 1", category: "Kick", shortName: "Kick" },
  35: { name: "Bass Drum 2 (Acoustic)", category: "Kick", shortName: "Kick 2" },
  
  // Snare Drums
  38: { name: "Snare Drum 1", category: "Snare", shortName: "Snare" },
  40: { name: "Snare Drum 2 (Electric)", category: "Snare", shortName: "Snare E" },
  37: { name: "Side Stick", category: "Snare", shortName: "Stick" },
  
  // Hi-Hat
  42: { name: "Closed Hi-Hat", category: "Hi-Hat", shortName: "HH Closed" },
  44: { name: "Pedal Hi-Hat", category: "Hi-Hat", shortName: "HH Pedal" },
  46: { name: "Open Hi-Hat", category: "Hi-Hat", shortName: "HH Open" },
  
  // Toms
  50: { name: "High Tom", category: "Toms", shortName: "Tom 1" },
  48: { name: "High-Mid Tom", category: "Toms", shortName: "Tom 2" },
  47: { name: "Low-Mid Tom", category: "Toms", shortName: "Tom 3" },
  45: { name: "Low Tom", category: "Toms", shortName: "Tom 4" },
  43: { name: "High Floor Tom", category: "Toms", shortName: "Floor 1" },
  41: { name: "Low Floor Tom", category: "Toms", shortName: "Floor 2" },
  
  // Cymbals
  49: { name: "Crash Cymbal 1", category: "Cymbals", shortName: "Crash 1" },
  57: { name: "Crash Cymbal 2", category: "Cymbals", shortName: "Crash 2" },
  51: { name: "Ride Cymbal 1", category: "Cymbals", shortName: "Ride" },
  59: { name: "Ride Cymbal 2", category: "Cymbals", shortName: "Ride 2" },
  53: { name: "Ride Bell", category: "Cymbals", shortName: "Bell" },
  55: { name: "Splash Cymbal", category: "Cymbals", shortName: "Splash" },
  52: { name: "Chinese Cymbal", category: "Cymbals", shortName: "China" },
  
  // Percussion
  54: { name: "Tambourine", category: "Percussion", shortName: "Tamb" },
  56: { name: "Cowbell", category: "Percussion", shortName: "Cowbell" },
  39: { name: "Hand Clap", category: "Percussion", shortName: "Clap" },
};

export default defineComponent({
  components: { FontAwesomeIcon },
  props: {
    trackName: {
      type: String,
      default: "Drums",
    },
    midiProgram: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      drumInfo: DRUM_INFO,
      showAllDrums: false,
    };
  },
  computed: {
    categories() {
      const cats = {};
      for (const [midi, info] of Object.entries(this.drumInfo)) {
        if (!cats[info.category]) {
          cats[info.category] = [];
        }
        cats[info.category].push({ midi: parseInt(midi), ...info });
      }
      return cats;
    },
    essentialDrums() {
      return [36, 38, 42, 46, 49, 51, 50, 47, 45];
    },
    displayDrums() {
      if (this.showAllDrums) {
        return Object.keys(this.drumInfo).map(m => parseInt(m));
      }
      return this.essentialDrums;
    },
  },
});
</script>

<template>
  <div class="drum-track-info">
    <div class="info-header">
      <div class="track-badge">
        <font-awesome-icon :icon='["fas", "drum"]' />
        <strong>{{ trackName }}</strong>
        <span class="midi-info">MIDI Program {{ midiProgram }}</span>
      </div>
    </div>
    
    <div class="drum-legend">
      <div class="legend-header">
        <h6>Drum Kit Mapping</h6>
        <button 
          @click="showAllDrums = !showAllDrums" 
          class="btn btn-sm btn-outline-secondary"
        >
          {{ showAllDrums ? 'Show Essential' : 'Show All' }}
        </button>
      </div>
      
      <div class="drum-categories">
        <div v-for="(drums, category) in categories" :key="category" class="category">
          <div class="category-name">{{ category }}</div>
          <div class="drum-list">
            <div 
              v-for="drum in drums" 
              :key="drum.midi"
              v-show="displayDrums.includes(drum.midi)"
              class="drum-item"
            >
              <span class="midi-note">{{ drum.midi }}</span>
              <span class="drum-name">{{ drum.shortName }}</span>
              <span class="full-name">{{ drum.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="info-tip">
      <font-awesome-icon :icon='["fas", "lightbulb"]' />
      <span>
        This track uses General MIDI drum mapping. Each MIDI note corresponds to a specific drum sound.
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../styles/vars.scss";

.drum-track-info {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  
  .info-header {
    margin-bottom: 20px;
    
    .track-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 15px;
      background: var(--bs-primary);
      color: white;
      border-radius: 6px;
      font-size: 16px;
      
      svg {
        font-size: 20px;
      }
      
      .midi-info {
        margin-left: auto;
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
  
  .drum-legend {
    .legend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      h6 {
        margin: 0;
      }
    }
    
    .drum-categories {
      display: grid;
      gap: 15px;
      
      .category {
        .category-name {
          font-weight: 600;
          color: var(--bs-primary);
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .drum-list {
          display: grid;
          gap: 5px;
          
          .drum-item {
            display: grid;
            grid-template-columns: 40px 80px 1fr;
            gap: 10px;
            padding: 8px 12px;
            background: var(--bs-secondary-bg);
            border-radius: 4px;
            font-size: 13px;
            
            .midi-note {
              font-weight: 700;
              color: var(--bs-primary);
              font-family: monospace;
            }
            
            .drum-name {
              font-weight: 600;
            }
            
            .full-name {
              color: var(--bs-secondary);
              font-size: 12px;
            }
          }
        }
      }
    }
  }
  
  .info-tip {
    margin-top: 20px;
    padding: 12px;
    background: var(--bs-info-bg-subtle);
    border-left: 3px solid var(--bs-info);
    border-radius: 4px;
    display: flex;
    gap: 10px;
    font-size: 13px;
    
    svg {
      flex-shrink: 0;
    }
  }
}
</style>
