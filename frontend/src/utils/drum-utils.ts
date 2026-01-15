// drum-utils.ts

// General MIDI drum mapping
const GM_DRUM_MAPPING: { [key: number]: string } = {
    35: 'Acoustic Bass Drum',
    38: 'Acoustic Snare',
    42: 'Closed Hi-hat',
    46: 'Open Hi-hat',
    49: 'Crash Cymbal 1',
    51: 'Ride Cymbal 1',
};

// Drum kit layout definitions
const DRUM_KIT_LAYOUT = {
    kick: 35,
    snare: 38,
    hiHatClosed: 42,
    hiHatOpen: 46,
    crash: 49,
    ride: 51,
};

// Function to create empty drum patterns
function createEmptyPattern(beats: number): number[] {
    return new Array(beats).fill(0);
}

// Function to convert grid patterns to AlphaTab beats
function gridToAlphaTab(gridPattern: number[]): string {
    return gridPattern.map((beat, index) => beat ? 'X' : '-').join('');
}

// Function to convert AlphaTab beats back to grid patterns
function alphaTabToGrid(alphaTab: string): number[] {
    return [...alphaTab].map(beat => beat === 'X' ? 1 : 0);
}

export {
    GM_DRUM_MAPPING,
    DRUM_KIT_LAYOUT,
    createEmptyPattern,
    gridToAlphaTab,
    alphaTabToGrid,
};