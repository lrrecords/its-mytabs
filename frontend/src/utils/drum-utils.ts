/**
 * drum-utils.ts
 * Comprehensive utility functions for drum notation editing
 */

export interface DrumPattern {
  [drumName: string]: boolean[];
}

// General MIDI Drum Map (Channel 10)
export const GM_DRUM_MAP: { [key: string]: number } = {
  kick: 36,
  kickAcoustic: 35,
  snare: 38,
  snareElectric: 40,
  snareSideStick: 37,
  hiHatClosed: 42,
  hiHatPedal: 44,
  hiHatOpen: 46,
  tomHigh: 50,
  tomHighMid: 48,
  tomLowMid: 47,
  tomLow: 45,
  crashCymbal1: 49,
  crashCymbal2: 57,
  rideCymbal1: 51,
  rideBell: 53,
  splashCymbal: 55,
  chinaCymbal: 52,
  tambourine: 54,
  cowbell: 56,
  handClap: 39,
};

// Reverse lookup
export const MIDI_TO_DRUM_NAME: { [key: number]: string } = {};
for (const [name, midi] of Object.entries(GM_DRUM_MAP)) {
  MIDI_TO_DRUM_NAME[midi] = name;
}

export function createEmptyDrumPattern(bars: number = 1, subdivision: number = 16): DrumPattern {
  const pattern: DrumPattern = {};
  const totalSteps = bars * subdivision;
  for (const drumName of Object.keys(GM_DRUM_MAP)) {
    pattern[drumName] = Array(totalSteps).fill(false);
  }
  return pattern;
}

export function gridToAlphaTabBeats(grid: DrumPattern, subdivision: number, alphaTab: any): any[] {
  const beats: any[] = [];
  const drumNames = Object.keys(grid);
  const totalSteps = grid[drumNames[0]]?.length || 0;

  for (let step = 0; step < totalSteps; step++) {
    const beat = new alphaTab.model.Beat();
    switch (subdivision) {
      case 8: beat.duration = alphaTab.model.Duration.Eighth; break;
      case 16: beat.duration = alphaTab.model.Duration.Sixteenth; break;
      default: beat.duration = alphaTab.model.Duration.Sixteenth;
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
    if (!hasNotes) beat.isEmpty = true;
    beats.push(beat);
  }
  return beats;
}

export function alphaTabBeatsToGrid(beats: any[]): DrumPattern {
  const grid: DrumPattern = {};
  for (const drumName of Object.keys(GM_DRUM_MAP)) {
    grid[drumName] = [];
  }
  for (const beat of beats) {
    for (const drumName of Object.keys(GM_DRUM_MAP)) {
      const midiNote = GM_DRUM_MAP[drumName];
      const isActive = beat.notes?.some((note: any) => note.fret === midiNote) || false;
      grid[drumName].push(isActive);
    }
  }
  return grid;
}

export function createRockBeatPattern(): DrumPattern {
  const pattern = createEmptyDrumPattern(1, 16);
  pattern.kick[0] = true;
  pattern.kick[8] = true;
  pattern.snare[4] = true;
  pattern.snare[12] = true;
  for (let i = 0; i < 16; i += 2) {
    pattern.hiHatClosed[i] = true;
  }
  return pattern;
}