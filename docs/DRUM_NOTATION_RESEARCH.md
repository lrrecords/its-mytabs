# AlphaTab Drum Notation Research

## Executive Summary

This document provides a comprehensive analysis of AlphaTab's drum notation capabilities and outlines how they can be leveraged to add drum editing and playback features to its-mytabs.

## Current State Analysis

### What its-mytabs Already Has

Based on code analysis, its-mytabs currently supports drums in a **read-only** capacity:

1. **Drum Track Detection**: The system already detects drum tracks (MIDI program 0)
   - See `backend/common.ts`: `0: "Drums"`
   - See `frontend/src/pages/Tab.vue` (lines 553-556): Automatically switches to ScoreTab view for drum tracks

2. **Drum Playback**: Full MIDI synthesis support via SoundFont2
   - Uses SONiVOX EAS soundfont (`/soundfont/sonivox.sf2`)
   - Supports muting/soloing drum tracks
   - Volume control per track

3. **Visual Rendering**: AlphaTab already renders drum notation from imported files
   - Supports Guitar Pro (.gp, .gp3, .gp4, .gp5, .gpx)
   - Supports MusicXML
   - Supports Capella (.capx)

4. **Multi-Track Support**: Can display and play drum tracks alongside guitar/bass
   - Track switching functionality exists
   - Sync with audio/YouTube backing tracks

### What's Missing: Interactive Editing

Currently, users **cannot**:
- Create new drum patterns from scratch
- Edit existing drum notation
- Add/remove drum notes
- Change drum articulations (accents, ghost notes, etc.)
- Create drum-only compositions

## AlphaTab Drum Notation API Capabilities

### 1. Format Support
AlphaTab can load drum parts from:
- Guitar Pro 3-8
- MusicXML (experimental)
- Capella
- **alphaTex** scripting language (this is key for programmatic creation!)

### 2. Visual Rendering Features

**Supported Drum Notation Elements:**
- Standard percussion staff (5-line staff with specific drum positions)
- All standard drum set sounds:
  - Kick/Bass Drum
  - Snare (center, rim, cross-stick)
  - Hi-Hat (closed, open, pedal)
  - Toms (high, mid, low, floor)
  - Cymbals (crash, ride, china, splash)
  - Percussion (cowbell, tambourine, etc.)

**Articulations:**
- Accents (>, ^)
- Ghost notes (parenthesized noteheads)
- Dead notes (X noteheads)
- Double strokes
- Flams and drags
- Rolls

**Rhythm Notation:**
- All standard note values (whole notes through 128th notes)
- Tuplets (triplets, quintuplets, etc.)
- Ties and dots
- Repeats and alternate endings
- Time signature changes

### 3. Playback & Synthesis

**MIDI Implementation:**
- Uses General MIDI (GM) standard
- Channel 10 reserved for percussion
- Each MIDI note number = specific drum sound:
  ```
  36: Kick/Bass Drum
  38: Snare
  42: Closed Hi-Hat
  46: Open Hi-Hat
  49: Crash Cymbal 1
  51: Ride Cymbal 1
  ... (full GM drum map supported)
  ```

**SoundFont2 Integration:**
- Can swap soundfonts for different drum kits
- Supports articulation-specific samples
- Volume/pan per drum instrument

### 4. Interactive API

**Critical API Methods for Editing:**

```typescript
// Score/Track Access
api.score.tracks[trackIndex]
track.staves[0].bars[barIndex]
bar.voices[0].beats[beatIndex]
beat.notes[noteIndex]

// Note Manipulation
note.fret = midiNoteNumber; // Which drum (e.g., 38 = snare)
note.string = 0; // Drums use string 0
note.isDead = true/false; // Dead note articulation
note.isGhost = true/false; // Ghost note

// Beat Manipulation
beat.duration = Duration.Quarter; // Note duration
beat.dot = 1; // Dotted note
beat.tupletNumerator = 3; // Triplet
beat.tupletDenominator = 2;

// Dynamics
beat.dynamics = DynamicValue.MP; // Volume/accent
beat.isAccented = true;

// Rendering
api.renderTracks([track]); // Re-render after changes
api.updateSettings(); // Apply setting changes
```

**Event Listeners:**
```typescript
// Click detection
api.beatMouseDown.on((beat) => {
  // User clicked a beat - could open edit dialog
});

// Playback tracking
api.playerPositionChanged.on((position) => {
  // Sync visual feedback
});
```

### 5. alphaTex: Programmatic Drum Creation

AlphaTab's **alphaTex** format allows creating drum notation via simple text syntax:

```
\track "Drums" midi=0 midi-channel=10
\staff{score} \tuning none \clef percussion

// Bar 1: Basic rock beat
1.1.8 6.4{d} 6.4 6.4{d} 6.4 6.4{d} 6.4 6.4{d} |

// Note format: fret.string.duration
// Fret = MIDI note (mapped to drum)
// String = 0 for drums
// Duration = 1(whole), 2(half), 4(quarter), 8(eighth), 16(16th), etc.
// {d} = dynamic (ghost note, accent, etc.)
```

**This is powerful because:**
- Can generate drum patterns programmatically
- Easy to implement a visual drum grid editor that outputs alphaTex
- Can parse user input and convert to notation

## Current Code Integration Points

### Where Drum Logic Already Exists

1. **Tab.vue (frontend/src/pages/Tab.vue)**
   - Lines 553-556: Drum detection and auto-switching to ScoreTab view
   - Lines 527-560: Track enumeration (includes drums)
   - Lines 1089-1122: Track mute/solo/volume controls

2. **common.ts (backend/common.ts)**
   - Line 29: MIDI program 0 = "Drums"
   - Lines 116-119: Taiko Drum, Melodic Tom, Synth Drum definitions

3. **app.ts (frontend/src/app.ts)**
   - Line 33: `getInstrumentName()` function - already handles drum tracks

### AlphaTab API Already Integrated

Current usage in Tab.vue:
```typescript
// Already importing AlphaTab
const alphaTab = await import("@coderline/alphatab");

// Already creating API instance
this.api = new alphaTab.AlphaTabApi(container, settings);

// Already accessing score data
this.api.scoreLoaded.on((score) => {
  score.tracks.forEach((track) => {
    // Can access drum tracks here
  });
});
```

## Technical Feasibility Assessment

### ✅ Highly Feasible (Leverage Existing)

1. **Display drum tracks** - Already working
2. **Playback drum tracks** - Already working
3. **Sync drums with backing tracks** - Already working
4. **Mute/solo drums** - Already working

### ⚠️ Medium Complexity (New UI, Existing API)

1. **Visual drum grid editor** - New UI component, but AlphaTab API supports it
2. **Click-to-add notes** - Use AlphaTab's beat detection + programmatic note creation
3. **Drum palette selection** - UI component + MIDI note mapping

### 🔧 Higher Complexity (New Features)

1. **Real-time editing** - Modify score object and re-render
2. **Pattern library** - Store common beats (can use alphaTex strings)
3. **Drum-specific view** - Alternative to standard notation

## Performance Considerations

### Current Architecture Strengths

- **Vue 3 + TypeScript**: Reactive UI will handle dynamic drum editing well
- **AlphaTab's HTML5 rendering**: Can handle re-renders efficiently
- **MIDI playback**: Low latency, already optimized

### Potential Bottlenecks

1. **Re-rendering entire score on each edit**
   - Solution: Use `api.renderTracks()` to only re-render drum track  

2. **Large drum scores**
   - AlphaTab handles this well (tested with full band scores)
   
3. **Real-time audio preview**
   - Current MIDI synthesizer can handle note-by-note playback

## Integration Strategy

### Recommended Approach: Incremental Enhancement

**Phase 1: Read-Only Enhancements**
- Add drum-specific information panel
- Better visual indicators for drum tracks
- Drum kit diagram overlay

**Phase 2: Basic Editing**
- Add drum note via click
- Delete drum note
- Change note duration
- Simple articulations (accent, ghost note)

**Phase 3: Advanced Editing**
- Drag-and-drop note editing
- Pattern library (common beats)
- Copy/paste bars
- Quantization

**Phase 4: Composition Tools**
- Create new drum tracks from scratch
- Multiple drum tracks
- Drum notation templates
- Export drum-only MIDI

## Comparison: Groove Scribe Integration vs. AlphaTab Extension

### Groove Scribe Characteristics
- **Technology**: HTML5 Canvas, JavaScript
- **Format**: Custom JSON structure for drum patterns
- **Focus**: Drum-specific grid editor
- **Strengths**: 
  - Excellent drum-focused UX
  - Visual grid interface
  - Pattern-based editing

### Integration Options Analysis

#### Option A: Merge Groove Scribe
**Pros:**
- Proven drum editing UI
- Already handles drum notation paradigm

**Cons:**
- **Different data models**: Groove Scribe uses custom JSON, its-mytabs uses AlphaTab's Score model
- **Dual rendering engines**: Would need to maintain both Canvas-based (Groove Scribe) and AlphaTab rendering
- **Format conversion complexity**: Constant translation between formats
- **Maintenance burden**: Two codebases to maintain
- **UI inconsistency**: Different look-and-feel from current its-mytabs
- **Licensing**: Need to verify compatibility

#### Option B: Build AlphaTab-Native Drum Editor
**Pros:**
- **Single data model**: Everything uses AlphaTab Score objects
- **Consistent rendering**: One rendering engine
- **Tight integration**: Native access to all AlphaTab features
- **Consistent UX**: Matches current its-mytabs look-and-feel
- **Simpler architecture**: No format translation layer
- **Better performance**: Direct API manipulation

**Cons:**
- **Development time**: Building UI from scratch
- **Learning curve**: Understanding AlphaTab's drum notation model

### Recommendation: **Option B** (AlphaTab-Native)

**Rationale:**
1. **Architectural coherence**: its-mytabs is built on AlphaTab - extending it is natural
2. **AlphaTab already has drum capabilities**: We'd be exposing, not creating
3. **Can reference Groove Scribe UX**: Use its UI patterns without merging codebases
4. **Future-proof**: Any AlphaTab improvements automatically benefit drum editing
5. **Maintainability**: Single codebase, single data model

**Implementation Path:**
- Study Groove Scribe's UX patterns
- Design drum editor UI inspired by (but not copying) Groove Scribe
- Use AlphaTab's API for all data manipulation
- Create Vue components that feel native to its-mytabs

## Browser/Device Compatibility

### AlphaTab Support Matrix
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Drum Editing Considerations
- **Touch support**: Grid-based editing works well on tablets
- **Mobile UX**: May need simplified interface for phones
- **Performance**: AlphaTab's HTML5 engine performs well on modern devices

## Security & Data Integrity

### File Format Security
- AlphaTab's import is well-tested
- Guitar Pro and MusicXML formats are industry-standard

### User-Generated Content
- Drum patterns are just MIDI data - safe
- No code execution risk
- Server-side validation possible for uploaded drum scores

## Conclusion

Adding interactive drum notation editing to its-mytabs is **highly feasible** and **architecturally sound**:

1. ✅ **AlphaTab already supports drum notation** - We're exposing, not building from scratch
2. ✅ **Current codebase already handles drums** - Detection, playback, display working
3. ✅ **API is comprehensive** - Beat/note manipulation methods exist
4. ✅ **alphaTex provides escape hatch** - Can always generate programmatically
5. ✅ **Performance is acceptable** - HTML5 rendering handles real-time editing

**Building a native AlphaTab drum editor is preferred over merging Groove Scribe** because it maintains architectural consistency, reduces complexity, and leverages the existing foundation.

## Next Steps

See `docs/DRUM_NOTATION_PROPOSAL.md` for detailed implementation plan.

## References

- [AlphaTab Documentation](https://alphatab.net/docs/)
- [AlphaTab API Reference](https://alphatab.net/docs/reference/api/)
- [AlphaTab Drum Discussion](https://github.com/CoderLine/alphaTab/discussions/1602)
- [General MIDI Drum Map](https://en.wikipedia.org/wiki/General_MIDI#Percussion)
- [alphaTex Format Documentation](https://alphatab.net/docs/alphatex/)
- [Groove Scribe Repository](https://github.com/montulli/GrooveScribe)

---

**Document Version**: 1.0  
**Date**: 2026-01-15  
**Author**: Research for its-mytabs drum notation enhancement