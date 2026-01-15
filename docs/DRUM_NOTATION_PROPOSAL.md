# Drum Notation Feature Implementation Proposal

## Overview

This document outlines a phased approach to adding interactive drum notation editing capabilities to its-mytabs, inspired by Groove Scribe's UX patterns while maintaining architectural consistency with AlphaTab.

## Design Philosophy

**Core Principles:**
1. **Native Integration**: Build on AlphaTab's existing drum capabilities
2. **Groove Scribe-Inspired UX**: Borrow proven patterns without code duplication
3. **its-mytabs Consistency**: Match existing UI/UX and component architecture
4. **Progressive Enhancement**: Start simple, add complexity incrementally

## UX Patterns from Groove Scribe

### What We'll Adopt (Conceptually)

1. **Grid-Based Input**
   - Visual grid where rows = drum instruments, columns = time subdivisions
   - Click-to-add/remove notes
   - Immediate visual and audio feedback

2. **Minimal Learning Curve**
   - No music theory required to start
   - Intuitive drum kit layout (visually represents real drums)
   - Instant playback with spacebar

3. **Real-Time Feedback**
   - Changes immediately reflected in notation
   - One-click playback
   - BPM/tempo controls always visible

4. **Focused Scope**
   - Start with 1-4 bar patterns
   - Common time signatures (4/4, 3/4, 6/8)
   - Standard rock/jazz drum kit

### What We'll Adapt for its-mytabs

1. **Integration with Existing Tab View**
   - Drum editor as a modal/panel within current Tab.vue page
   - Seamless switch between view-only and edit modes
   - Maintains sync with audio/YouTube backing tracks

2. **AlphaTab-Native Rendering**
   - Use AlphaTab's notation rendering (not separate canvas)
   - Leverage existing color schemes and display settings
   - Works with all supported file formats

3. **Multi-Track Workflow**
   - Edit drums alongside guitar/bass tracks
   - Consistent track selection UI
   - Shared playback controls

## Implementation Phases

### Phase 1: Drum Track Enhancement (Foundation)
**Goal**: Improve existing drum track display and basic interaction

**Components to Create:**
- `DrumTrackInfo.vue` - Display drum kit information
- `DrumKitDiagram.vue` - Visual drum kit reference

**Features:**
- Detect drum tracks (already working)
- Show drum kit diagram overlay
- Display MIDI note mappings
- Highlight active drums during playback

**Technical Implementation:**
```typescript
// In Tab.vue, when drum track detected
if (track.playbackInfo.program === 0) {
  this.isDrumTrack = true;
  this.showDrumKitDiagram = true;
}

// New data property
isDrumTrack: false,
showDrumKitDiagram: false,
```

**Estimated Effort**: 1-2 weeks
**Risk**: Low (no AlphaTab API manipulation)

---

### Phase 2: Basic Drum Grid Editor
**Goal**: Allow click-to-add drum notes in a simple grid

**Components to Create:**
- `DrumGridEditor.vue` - Main drum editing interface
- `DrumInstrumentRow.vue` - Individual drum instrument grid row
- `DrumNoteCell.vue` - Clickable cell component

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ Drum Grid Editor                     [Close]│
├─────────────────────────────────────────────┤
│ [Bar 1▼] [16th notes▼] [BPM: 120] [▶ Play] │
├─────────────────────────────────────────────┤
│ Crash    │ ○ │   │   │   │ ○ │   │   │   │ │
│ Hi-Hat   │ ○ │ ○ │ ○ │ ○ │ ○ │ ○ │ ○ │ ○ │ │
│ Snare    │   │   │   │   │ ○ │   │   │   │ │
│ Kick     │ ○ │   │   │   │   │   │ ○ │   │ │
├─────────────────────────────────────────────┤
│        [Standard Notation Preview]           │
│        (rendered by AlphaTab)                │
└─────────────────────────────────────────────┘
```

**Key Features:**
- Click cells to add/remove notes
- Standard drum kit (Kick, Snare, Hi-Hat, Toms, Cymbals)
- 4/4 time, 16th note resolution
- Real-time AlphaTab preview below grid
- Playback of edited pattern

**Technical Implementation:**

**DrumGridEditor.vue:**
```vue
<script>
import { defineComponent } from "vue";

const alphaTab = await import("@coderline/alphatab");

// GM Drum MIDI Note Map
const DRUM_MAP = {
  crash: 49,
  hiHat: 42,
  snare: 38,
  kick: 36,
  tom1: 50,
  tom2: 47,
  tom3: 45,
  ride: 51,
};

export default defineComponent({
  props: {
    barIndex: {
      type: Number,
      default: 0,
    },
    api: {
      type: Object, // AlphaTabApi instance
      required: true,
    },
  },
  data() {
    return {
      subdivision: 16, // 16th notes
      drumMap: DRUM_MAP,
      grid: {
        crash: Array(16).fill(false),
        hiHat: Array(16).fill(false),
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      },
    };
  },
  methods: {
    toggleNote(drum, stepIndex) {
      this.grid[drum][stepIndex] = !this.grid[drum][stepIndex];
      this.updateAlphaTabScore();
    },

    updateAlphaTabScore() {
      // Get the drum track
      const drumTrack = this.findDrumTrack();
      if (!drumTrack) return;

      const bar = drumTrack.staves[0].bars[this.barIndex];
      const voice = bar.voices[0];

      // Clear existing beats in this bar
      voice.beats = [];

      // Create beats based on grid state
      for (let step = 0; step < this.subdivision; step++) {
        const beat = new alphaTab.model.Beat();
        beat.duration = alphaTab.model.Duration.Sixteenth;

        // Check which drums are active at this step
        let hasNotes = false;
        for (const [drumName, isActive] of Object.entries(this.grid)) {
          if (isActive[step]) {
            const note = new alphaTab.model.Note();
            note.fret = this.drumMap[drumName]; // MIDI note number
            note.string = 0; // Drums use string 0
            beat.notes.push(note);
            hasNotes = true;
          }
        }

        // If no drums active, create a rest
        if (!hasNotes) {
          beat.isEmpty = true;
        }

        voice.beats.push(beat);
      }

      // Re-render the track
      this.api.renderTracks([drumTrack]);
    },

    findDrumTrack() {
      return this.api.score.tracks.find(
        track => track.playbackInfo.program === 0
      );
    },

    playPattern() {
      // Use AlphaTab's player to play just this bar
      this.api.player.playBeat(
        this.findDrumTrack().staves[0].bars[this.barIndex].voices[0].beats[0]
      );
    },
  },
});
</script>

<template>
  <div class="drum-grid-editor">
    <div class="controls">
      <select v-model="barIndex" class="form-select">
        <option v-for="i in 4" :key="i" :value="i-1">Bar {{ i }}</option>
      </select>
      <button @click="playPattern" class="btn btn-primary">
        <font-awesome-icon :icon='["fas", "play"]' /> Play
      </button>
    </div>

    <div class="grid">
      <div v-for="(drumName, key) in drumMap" :key="key" class="drum-row">
        <div class="drum-label">{{ drumName }}</div>
        <div class="cells">
          <div
            v-for="(isActive, stepIndex) in grid[key]"
            :key="stepIndex"
            class="cell"
            :class="{ active: isActive }"
            @click="toggleNote(key, stepIndex)"
          >
            <div v-if="isActive" class="note-dot">●</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drum-grid-editor {
  background: var(--bs-body-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--bs-border-color);
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  select {
    width: 150px;
  }
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drum-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .drum-label {
    width: 80px;
    font-weight: 500;
  }

  .cells {
    display: flex;
    gap: 2px;
    flex: 1;
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
    transition: all 0.2s;

    &:hover {
      background: var(--bs-secondary-bg);
    }

    &.active {
      background: var(--bs-primary);
      border-color: var(--bs-primary);

      .note-dot {
        color: white;
        font-size: 20px;
      }
    }
  }
}
</style>
```

**Integration in Tab.vue:**
```vue
<template>
  <!-- Existing tab view -->
  <div ref="bassTabContainer" class="alphatab-container"></div>

  <!-- New: Drum Editor Toggle -->
  <button
    v-if="isDrumTrack && isLoggedIn"
    @click="showDrumEditor = !showDrumEditor"
    class="btn btn-secondary drum-editor-toggle"
  >
    <font-awesome-icon :icon='["fas", "drum"]' />
    {{ showDrumEditor ? 'Close' : 'Edit Drums' }}
  </button>

  <!-- New: Drum Grid Editor Modal/Panel -->
  <div v-if="showDrumEditor" class="drum-editor-panel">
    <DrumGridEditor :api="api" :barIndex="currentBarIndex" />
  </div>
</template>

<script>
import DrumGridEditor from "../components/DrumGridEditor.vue";

export default defineComponent({
  components: { DrumGridEditor },
  data() {
    return {
      // ... existing data
      showDrumEditor: false,
      currentBarIndex: 0,
    };
  },
});
</script>
```

**Estimated Effort**: 3-4 weeks
**Risk**: Medium (requires AlphaTab score manipulation)

---

### Phase 3: Advanced Editing Features
**Goal**: Add articulations, copy/paste, pattern library

**New Features:**
- **Articulations**:
  - Accent (>)
  - Ghost note (parenthesized)
  - Open hi-hat vs closed
  - Rimshot/cross-stick

- **Edit Operations**:
  - Copy bar
  - Paste bar
  - Clear bar
  - Undo/Redo (using AlphaTab's state)

- **Pattern Library**:
  - Pre-built common beats (rock, jazz, funk)
  - Save custom patterns
  - Load pattern into bar

**Components to Create:**
- `DrumArticulationSelector.vue`
- `DrumPatternLibrary.vue`

**UI Enhancement:**
```
┌─────────────────────────────────────────────┐
│ [Standard▼] [Copy Bar] [Paste] [Clear]     │
├─────────────────────────────────────────────┤
│ Hi-Hat   │ ○ │ ● │ ○ │ ● │ ... (● = accent)│
│          │ ↑ right-click for articulation   │
├─────────────────────────────────────────────┤
│ Pattern Library: [Basic Rock] [Jazz Swing]  │
└─────────────────────────────────────────────┘
```

**Technical Implementation:**
```typescript
// Add articulation to note
const note = beat.notes.find(n => n.fret === drumMidiNote);
if (articulation === 'accent') {
  beat.dynamics = alphaTab.model.DynamicValue.F; // Forte
}
if (articulation === 'ghost') {
  note.isGhost = true;
}
```

**Estimated Effort**: 2-3 weeks
**Risk**: Low (builds on Phase 2)

---

### Phase 4: Full Composition Tools
**Goal**: Create multi-bar drum compositions from scratch

**Features:**
- Create new drum track in existing tabs
- Add/remove bars
- Time signature changes
- Export drum-only MIDI
- Print drum notation

**Components to Create:**
- `DrumTrackCreator.vue`
- `DrumCompositionView.vue`

**New Route:**
```typescript
// In router.ts
{
  path: "/tab/:id/drums/new",
  component: DrumTrackCreator,
}
```

**Estimated Effort**: 3-4 weeks
**Risk**: Medium (requires creating new Score objects)

---

## Component Architecture

### Component Hierarchy
```
Tab.vue (existing)
├── DrumGridEditor.vue (new)
│   ├── DrumInstrumentRow.vue (new)
│   │   └── DrumNoteCell.vue (new)
│   ├── DrumArticulationSelector.vue (new, Phase 3)
│   └── DrumPatternLibrary.vue (new, Phase 3)
├── DrumKitDiagram.vue (new, Phase 1)
└── DrumTrackInfo.vue (new, Phase 1)
```

### Shared Utilities

**drum-utils.ts** (new file):
```typescript
// General MIDI Drum Map
export const GM_DRUM_MAP = {
  kick: 36,
  kickAccoustic: 35,
  snare: 38,
  snareAccoustic: 40,
  snareElectric: 40,
  snareSideStick: 37,
  tomLow: 45,
  tomLowMid: 47,
  tomHighMid: 48,
  tomHigh: 50,
  hiHatClosed: 42,
  hiHatPedal: 44,
  hiHatOpen: 46,
  rideCymbal: 51,
  rideBell: 53,
  crashCymbal1: 49,
  crashCymbal2: 57,
  splash: 55,
  china: 52,
};

// Drum kit layout for visual display
export const DRUM_KIT_LAYOUT = {
  cymbals: ['crashCymbal1', 'rideCymbal', 'hiHatClosed'],
  toms: ['tomHigh', 'tomHighMid', 'tomLowMid', 'tomLow'],
  snare: ['snare', 'snareSideStick'],
  kick: ['kick'],
};

// Create empty drum pattern
export function createEmptyDrumPattern(bars: number, subdivision: number) {
  const pattern = {};
  for (const drum of Object.keys(GM_DRUM_MAP)) {
    pattern[drum] = Array(bars * subdivision).fill(false);
  }
  return pattern;
}

// Convert grid pattern to AlphaTab beats
export function gridToAlphaTabBeats(
  grid: DrumPattern,
  subdivision: number,
  alphaTab: any
): alphaTab.model.Beat[] {
  const beats: alphaTab.model.Beat[] = [];

  for (let step = 0; step < subdivision; step++) {
    const beat = new alphaTab.model.Beat();

    // Set duration based on subdivision
    switch (subdivision) {
      case 8:
        beat.duration = alphaTab.model.Duration.Eighth;
        break;
      case 16:
        beat.duration = alphaTab.model.Duration.Sixteenth;
        break;
      default:
        beat.duration = alphaTab.model.Duration.Quarter;
    }

    let hasNotes = false;
    for (const [drumName, steps] of Object.entries(grid)) {
      if (steps[step]) {
        const note = new alphaTab.model.Note();
        note.fret = GM_DRUM_MAP[drumName];
        note.string = 0;
        beat.notes.push(note);
        hasNotes = true;
      }
    }

    if (!hasNotes) {
      beat.isEmpty = true;
    }

    beats.push(beat);
  }

  return beats;
}

// Convert AlphaTab beats to grid pattern
export function alphaTabBeatsToGrid(
  beats: alphaTab.model.Beat[]
): DrumPattern {
  const grid = {};
  
  // Initialize grid
  for (const drum of Object.keys(GM_DRUM_MAP)) {
    grid[drum] = [];
  }

  // Reverse lookup: MIDI note -> drum name
  const noteToName = {};
  for (const [name, midiNote] of Object.entries(GM_DRUM_MAP)) {
    noteToName[midiNote] = name;
  }

  // Fill grid from beats
  for (const beat of beats) {
    for (const drum of Object.keys(GM_DRUM_MAP)) {
      const isActive = beat.notes.some(
        note => note.fret === GM_DRUM_MAP[drum]
      );
      grid[drum].push(isActive);
    }
  }

  return grid;
}
```

---

## Styling & Theming

### Maintain its-mytabs Look-and-Feel

- Use existing Bootstrap 5.3.8 components
- Follow current dark/light theme system
- Use FontAwesome icons (already integrated)
- Match existing color palette

**Example Variables (from existing styles):**
```scss
// Use existing vars.scss
@import "../styles/vars.scss";

drum-grid-editor {
  background: var(--bs-body-bg);
  border: 1px solid $color1-dark; // Existing variable  
  
  [data-bs-theme="light"] & {
    border-color: $color1-light;
  }
}
```

---

## User Flow Examples

### Flow 1: View Drum Track (Phase 1)
1. User opens tab with drum track
2. System detects MIDI program 0
3. Drum kit diagram appears as overlay
4. User can see which drums are being played during playback
5. Diagram highlights active drums in real-time

### Flow 2: Edit Existing Drum Pattern (Phase 2)
1. User clicks "Edit Drums" button
2. Drum grid editor panel slides in
3. Current bar's drum pattern loads into grid
4. User clicks cells to add/remove notes
5. Changes immediately appear in AlphaTab notation below
6. User presses spacebar to hear pattern
7. User clicks "Save" to commit changes
8. AlphaTab re-renders the updated score

### Flow 3: Create Drum Track from Scratch (Phase 4)
1. User opens guitar tab (no drums)
2. User clicks "Add Drum Track"
3. Modal appears: "Create New Drum Track"
4. User selects time signature, tempo, number of bars
5. Empty drum grid appears
6. User builds pattern using grid
7. User saves, new drum track added to tab
8. Both guitar and drums play together

---

## Technical Considerations

### AlphaTab API Usage

**Critical Methods:**
```typescript
// Score manipulation
api.score.tracks[trackIndex]
api.score.tracks[trackIndex].staves[0].bars[barIndex]

// Beat/Note creation
const beat = new alphaTab.model.Beat();
const note = new alphaTab.model.Note();
note.fret = 38; // Snare drum (GM)
note.string = 0; // Drums use string 0
beat.notes.push(note);

// Re-render after changes
api.renderTracks([track]);
ap.updateSettings();

// Playback
api.playBeat(beat);
ap.playPause();
```

**State Management:**
- Store drum grid state in Vue component
- Sync with AlphaTab Score object on changes
- Use AlphaTab as single source of truth for rendering

### Performance Optimization

**Potential Bottlenecks:**
1. **Re-rendering entire score on each note change**
   - Solution: Debounce grid updates (200ms)
   - Only re-render drum track, not entire score

2. **Large drum scores (100+ bars)**
   - Solution: Paginate grid view (show 4 bars at a time)
   - Lazy-load bars as user scrolls

**Example Debounce:**
```typescript
import { ActionBuffer } from "../app.js"; // Existing utility

const updateBuffer = new ActionBuffer(200);

methods: {
  toggleNote(drum, step) {
    this.grid[drum][step] = !this.grid[drum][step];
    updateBuffer.run(() => {
      this.updateAlphaTabScore();
    });
  },
}
```

### Browser Compatibility

- **Target**: Same as current its-mytabs (Chrome, Firefox, Safari, Edge)
- **Mobile**: Touch-optimized grid (larger cells on mobile)
- **Responsive**: Adjust grid columns on smaller screens

---

## Data Persistence

### Saving Edited Drums

**Option 1: Save to Guitar Pro format** (recommended for Phase 2+)
```typescript
// AlphaTab can export to GP format
const gpData = alphaTab.exporter.Gp7Exporter.export(api.score);
// Upload to backend, replace tab file
```

**Option 2: Store as alphaTex** (lightweight, Phase 1-2)
```typescript
// Generate alphaTex for drum track
const alphaTex = generateAlphaTexFromGrid(grid);
// Store in database alongside tab
```

**Database Schema Addition:**
```typescript
// In backend/zod.ts
const TabInfoSchema = z.object({
  // ... existing fields
  drumAlphaTex: z.string().optional(), // For edited drums
});
```

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// drum-utils.test.ts
import { describe, it, expect } from 'vitest';
import { gridToAlphaTabBeats, GM_DRUM_MAP } from './drum-utils';

describe('gridToAlphaTabBeats', () => {
  it('converts grid pattern to AlphaTab beats', () => {
    const grid = {
      kick: [true, false, false, false],
      snare: [false, false, true, false],
    };
    const beats = gridToAlphaTabBeats(grid, 4, alphaTab);
    expect(beats.length).toBe(4);
    expect(beats[0].notes[0].fret).toBe(GM_DRUM_MAP.kick);
  });
});
```

### Integration Tests
- Test drum grid editor in isolation
- Mock AlphaTab API
- Verify grid state updates

### E2E Tests (Playwright)
- Load tab with drums
- Open drum editor
- Add notes to grid
- Verify AlphaTab renders correctly
- Save and reload tab
- Verify persistence

---

## Documentation

### User Documentation
- **Quick Start Guide**: "How to Edit Drums in 5 Minutes"
- **Drum Notation Basics**: Explain standard notation
- **Video Tutorials**: Screen recordings of common tasks

### Developer Documentation
- **Component API**: Props, events, methods for each component
- **AlphaTab Integration**: How drum editor interacts with AlphaTab
- **Extending**: How to add new drum instruments or articulations

---

## Accessibility

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Arrow keys to navigate grid, Space to toggle
- **Screen Reader Support**: ARIA labels on drum cells
- **High Contrast Mode**: Ensure grid visible in all themes
- **Touch Targets**: Minimum 44x44px on mobile

**Example ARIA:**
```vue
<div
  role="button"
  :aria-label="
    \
     \
     
    `\${drumName} at beat \${stepIndex + 1}, \${isActive ? 'active' : 'inactive'}`
  "
  :aria-pressed="isActive"
  tabindex="0"
  @click="toggleNote(drumName, stepIndex)"
  @keydown.space.prevent="toggleNote(drumName, stepIndex)"
>
  <div v-if="isActive" class="note-dot">●</div>
</div>
```

---

## Deployment Strategy

### Feature Flags (Optional)
```typescript
// In backend/config.ts
export const FEATURE_FLAGS = {
  drumEditor: process.env.ENABLE_DRUM_EDITOR === 'true',
};

// In Tab.vue
computed: {
  showDrumEditorButton() {
    return this.isDrumTrack && this.isLoggedIn && FEATURE_FLAGS.drumEditor;
  },
}
```

### Rollout Plan
1. **Alpha**: Deploy Phase 1 to production (read-only enhancements)
2. **Beta**: Enable Phase 2 for logged-in users only
3. **General Availability**: Phase 2 for all users after testing
4. **Incremental**: Phases 3-4 as separate releases

---

## Success Metrics

### User Engagement
- % of users who open drum editor
- Average editing session duration
- Number of drum patterns created/modified per week

### Technical Performance
- Grid render time (target: <100ms)
- AlphaTab re-render time (target: <200ms)
- Memory usage with drum editor open (target: <50MB increase)

### Quality Metrics
- Bug reports per release
- User satisfaction surveys
- Feature adoption rate

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AlphaTab API changes breaking integration | High | Low | Pin AlphaTab version, test before upgrading |
| Performance issues with large scores | Medium | Medium | Implement pagination and debouncing |
| Complexity overwhelming users | Medium | Low | Phased rollout, excellent documentation |
| Data corruption during editing | High | Low | Implement undo/redo, auto-save drafts |

---

## Future Enhancements (Beyond Phase 4)

### Advanced Features
1. **Multi-Track Drums**
   - Separate tracks for hi-hat, kick, snare (like modern DAWs)
   - Individual volume/pan per drum instrument

2. **Groove Quantization**
   - Snap notes to grid
   - "Humanize" function (slight timing variations)

3. **MIDI Controller Input**
   - Record from electronic drum kit
   - Real-time input while playback

4. **AI-Assisted Composition**
   - Suggest complementary patterns
   - Auto-generate fills based on style

5. **Collaboration**
   - Share drum patterns with other users
   - Pattern marketplace/library

6. **Advanced Notation**
   - Polyrhythms
   - Odd time signatures (7/8, 5/4)
   - Drum rudiments (paradiddles, flams, drags)

---

## Conclusion

This proposal outlines a pragmatic, incremental approach to adding drum notation editing to its-mytabs:

✅ **Architecturally Sound**: Builds on AlphaTab, no dual rendering engines  
✅ **UX-Focused**: Borrows proven patterns from Groove Scribe  
✅ **Low Risk**: Phased approach allows testing and iteration  
✅ **Maintainable**: Single codebase, consistent with its-mytabs architecture  

**Next Steps:**
1. Review and approve this proposal
2. Set up development branch (`feature/drum-editor`)
3. Begin Phase 1 implementation
4. Create tracking issues for each component
5. Establish regular demo/review schedule

---

**Document Version**: 1.0  
**Date**: 2026-01-15  
**Author**: its-mytabs Drum Notation Feature Team  
**Status**: Proposed
