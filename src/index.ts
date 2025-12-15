#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import Strudel packages
import * as strudelCore from "@strudel/core";
import { mini, mini2ast, getLeafLocations } from "@strudel/mini";
import * as strudelTonal from "@strudel/tonal";

// Create server
const server = new McpServer({
  name: "strudel-mcp",
  version: "1.0.0",
});

// ============================================
// Pattern Analysis Tools
// ============================================

// Tool: Parse mini notation
server.tool(
  "strudel_parse_mini",
  "Parse a Strudel mini notation string and return its structure (AST, leaf nodes, event count)",
  {
    notation: z.string().describe("The mini notation string to parse (e.g., 'bd sd [hh hh] cp')"),
  },
  async ({ notation }) => {
    try {
      // Parse to AST
      const code = `"${notation}"`;
      const ast = mini2ast(code);

      // Get leaf nodes (the actual values in the pattern)
      const leaves = getLeafLocations(code);

      // Create pattern and query first cycle to count events
      const pattern = mini(notation);
      const events = pattern.firstCycle();

      const result = {
        notation,
        ast,
        leafCount: leaves.length,
        leaves: leaves.map((l: any) => ({
          value: l.value,
          start: l.start,
          end: l.end,
        })),
        eventCount: events.length,
        events: events.map((hap: any) => ({
          value: hap.value,
          whole: hap.whole ? `${hap.whole.begin} -> ${hap.whole.end}` : null,
          part: `${hap.part.begin} -> ${hap.part.end}`,
        })),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Parse error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Query pattern for events
server.tool(
  "strudel_query_pattern",
  "Query a Strudel pattern for events in a time range (cycles). Returns Hap events with timing and values.",
  {
    code: z.string().describe("Strudel mini notation or pattern code"),
    startCycle: z.number().default(0).describe("Start cycle (default: 0)"),
    endCycle: z.number().default(1).describe("End cycle (default: 1)"),
  },
  async ({ code, startCycle, endCycle }) => {
    try {
      // Create pattern from mini notation
      const pattern = mini(code);

      // Query events in the time range
      const events = pattern.queryArc(startCycle, endCycle);

      const result = {
        code,
        timeRange: { start: startCycle, end: endCycle },
        eventCount: events.length,
        events: events.map((hap: any) => ({
          value: hap.value,
          whole: hap.whole ? {
            begin: hap.whole.begin.toString(),
            end: hap.whole.end.toString(),
          } : null,
          part: {
            begin: hap.part.begin.toString(),
            end: hap.part.end.toString(),
          },
          hasOnset: hap.hasOnset(),
        })),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Query error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Validate code
server.tool(
  "strudel_validate_code",
  "Validate Strudel mini notation syntax. Returns whether the code is valid and any error messages.",
  {
    code: z.string().describe("The Strudel code to validate"),
  },
  async ({ code }) => {
    try {
      // Try to parse the code
      const wrappedCode = `"${code}"`;
      mini2ast(wrappedCode);

      // If we get here, it's valid
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: true,
              code,
              message: "Syntax is valid",
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: false,
              code,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Explain pattern
server.tool(
  "strudel_explain_pattern",
  "Explain what a Strudel mini notation pattern does in human-readable terms with rhythm visualization.",
  {
    notation: z.string().describe("The mini notation to explain"),
  },
  async ({ notation }) => {
    try {
      const pattern = mini(notation);
      const events = pattern.firstCycle();

      // Create a simple text visualization
      const visualization = events.map((hap: any) => {
        const start = hap.part.begin.valueOf();
        const end = hap.part.end.valueOf();
        const duration = end - start;
        return `  ${start.toFixed(3)} -> ${end.toFixed(3)}: "${hap.value}" (duration: ${duration.toFixed(3)} cycles)`;
      }).join("\n");

      // Build explanation
      let explanation = `Pattern: "${notation}"\n\n`;
      explanation += `Events per cycle: ${events.length}\n\n`;
      explanation += `Timeline (first cycle):\n${visualization}\n\n`;

      // Detect patterns
      const uniqueValues = [...new Set(events.map((h: any) => h.value))];
      explanation += `Unique sounds/notes: ${uniqueValues.join(", ")}\n`;

      return {
        content: [
          {
            type: "text",
            text: explanation,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error explaining pattern: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================
// Music Theory Tools
// ============================================

// Available scales from tonal.js
const SCALES = [
  "major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian",
  "harmonic minor", "melodic minor", "pentatonic major", "pentatonic minor",
  "blues", "chromatic", "whole tone", "diminished", "bebop", "arabic",
  "hungarian minor", "neapolitan major", "neapolitan minor", "persian",
  "spanish", "gypsy", "double harmonic", "enigmatic", "flamenco",
  "hindu", "hirajoshi", "iwato", "kumoi", "pelog", "prometheus",
  "ritusen", "scriabin", "whole half", "yo"
];

// Tool: List scales
server.tool(
  "strudel_list_scales",
  "List all available musical scales in Strudel.",
  {
    filter: z.string().optional().describe("Optional filter to search scale names"),
  },
  async ({ filter }) => {
    let scales = SCALES;
    if (filter) {
      scales = scales.filter(s => s.toLowerCase().includes(filter.toLowerCase()));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: scales.length,
            scales,
            usage: 'Use with .scale() like: n("0 1 2 3").scale("C:major")',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get scale notes
server.tool(
  "strudel_get_scale",
  "Get the notes in a specific musical scale.",
  {
    scale: z.string().describe("Scale name (e.g., 'major', 'minor', 'pentatonic')"),
    root: z.string().default("C").describe("Root note (default: C)"),
    octave: z.number().default(4).describe("Octave number (default: 4)"),
  },
  async ({ scale, root, octave }) => {
    try {
      // Use Tonal.js to get scale notes
      const { Scale } = await import("tonal");
      const scaleName = `${root}${octave} ${scale}`;
      const scaleNotes = Scale.get(scaleName);

      if (!scaleNotes.notes || scaleNotes.notes.length === 0) {
        // Try without octave
        const basicScale = Scale.get(`${root} ${scale}`);
        if (!basicScale.notes || basicScale.notes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Scale "${scale}" not found. Try: major, minor, dorian, pentatonic, blues, etc.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                name: `${root} ${scale}`,
                notes: basicScale.notes,
                intervals: basicScale.intervals,
                usage: `n("0 1 2 3 4 5 6 7").scale("${root}:${scale.replace(/ /g, "_")}")`,
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: scaleName,
              notes: scaleNotes.notes,
              intervals: scaleNotes.intervals,
              usage: `n("0 1 2 3 4 5 6 7").scale("${root}${octave}:${scale.replace(/ /g, "_")}")`,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting scale: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Chord types
const CHORD_TYPES = [
  "maj", "min", "dim", "aug", "sus2", "sus4",
  "7", "maj7", "min7", "dim7", "aug7", "m7b5",
  "9", "maj9", "min9", "11", "13",
  "6", "min6", "add9", "madd9"
];

// Tool: List chords
server.tool(
  "strudel_list_chords",
  "List available chord types in Strudel.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: CHORD_TYPES.length,
            chordTypes: CHORD_TYPES,
            examples: [
              "C - C major triad",
              "Cm or Cmin - C minor",
              "C7 - C dominant 7th",
              "Cmaj7 - C major 7th",
              "Cm7 - C minor 7th",
              "Cdim - C diminished",
              "Caug - C augmented",
            ],
            usage: 'chord("<C Am F G>").voicing()',
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get voicing
server.tool(
  "strudel_get_voicing",
  "Get the notes in a chord voicing.",
  {
    chord: z.string().describe("Chord symbol (e.g., 'Cmaj7', 'Am', 'G7')"),
    dict: z.string().default("lefthand").describe("Voicing dictionary: lefthand, triads, or guidetones"),
  },
  async ({ chord, dict }) => {
    try {
      const { Chord } = await import("tonal");
      const chordInfo = Chord.get(chord);

      if (!chordInfo.notes || chordInfo.notes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Chord "${chord}" not found. Try: C, Am, G7, Fmaj7, Dm7, etc.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              chord,
              name: chordInfo.name,
              notes: chordInfo.notes,
              intervals: chordInfo.intervals,
              quality: chordInfo.quality,
              usage: `chord("${chord}").voicing().dict("${dict}")`,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting voicing: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================
// Code Generation Tools
// ============================================

// Tool: Generate pattern
server.tool(
  "strudel_generate_pattern",
  "Generate a Strudel pattern based on style parameters.",
  {
    style: z.enum(["drums", "bass", "melody", "chords", "ambient"]).describe("Pattern style"),
    complexity: z.enum(["simple", "medium", "complex"]).default("medium").describe("Pattern complexity"),
    scale: z.string().default("C:minor").describe("Scale to use (e.g., 'C:minor', 'G:major')"),
  },
  async ({ style, complexity, scale }) => {
    let code = "";
    let explanation = "";

    const [root] = scale.split(":");

    switch (style) {
      case "drums":
        if (complexity === "simple") {
          code = `s("bd sd bd sd")`;
          explanation = "Simple 4-on-the-floor kick/snare pattern";
        } else if (complexity === "medium") {
          code = `s("bd*2, ~ sd, hh*8")`;
          explanation = "Layered drums: kick, snare on 2 and 4, hi-hats";
        } else {
          code = `s("bd(3,8), sd(2,8,1), hh*16?0.3, cp(1,4,2)")`;
          explanation = "Complex polyrhythmic drums using Euclidean patterns";
        }
        break;

      case "bass":
        if (complexity === "simple") {
          code = `note("${root.toLowerCase()}2 ${root.toLowerCase()}2 ${root.toLowerCase()}3 ${root.toLowerCase()}2").s("sawtooth").lpf(400)`;
          explanation = `Simple bass line in ${root}`;
        } else if (complexity === "medium") {
          code = `n("0 0 [3 5] 0").scale("${scale}").note().s("sawtooth").lpf(800).decay(0.2)`;
          explanation = `Bass line using scale degrees in ${scale}`;
        } else {
          code = `n("<0 3 5 7>(3,8)").scale("${scale}").note()
  .s("sawtooth").lpf(sine.range(200,1000).slow(8))
  .decay(0.1).sustain(0).release(0.1)`;
          explanation = `Syncopated bass with filter modulation in ${scale}`;
        }
        break;

      case "melody":
        if (complexity === "simple") {
          code = `n("0 2 4 5").scale("${scale}").note()`;
          explanation = `Simple ascending melody in ${scale}`;
        } else if (complexity === "medium") {
          code = `n("<0 2 4 7 5 4 2 0>").scale("${scale}").note()
  .s("triangle").delay(0.3).room(0.5)`;
          explanation = `8-note melody with delay and reverb in ${scale}`;
        } else {
          code = `n("[0 2] [4 <5 7>] [4 2] [0 <-2 -3>]").scale("${scale}").note()
  .s("triangle").attack(0.01).decay(0.2).sustain(0.5)
  .delay(0.25).delayfeedback(0.4).room(0.3)`;
          explanation = `Complex melodic pattern with variations in ${scale}`;
        }
        break;

      case "chords":
        if (complexity === "simple") {
          code = `chord("<${root}m ${root}m>").voicing()`;
          explanation = `Simple sustained chord in ${root} minor`;
        } else if (complexity === "medium") {
          code = `chord("<${root}m7 ${root}m7 Fmaj7 G7>").voicing().s("sawtooth").lpf(2000).room(0.5)`;
          explanation = `4-chord progression with voicings`;
        } else {
          code = `chord("<${root}m9 Dm7 Fmaj7 G7sus4>*2").voicing()
  .struct("[~ x]*4").s("sawtooth")
  .attack(0.01).decay(0.3).sustain(0.6)
  .lpf(1500).room(0.4)`;
          explanation = `Rich chord voicings with rhythmic structure`;
        }
        break;

      case "ambient":
        if (complexity === "simple") {
          code = `note("${root.toLowerCase()}3").s("sine").room(0.9).roomsize(4)`;
          explanation = "Simple ambient drone";
        } else if (complexity === "medium") {
          code = `n("<0 4 7 11>").scale("${scale}").note()
  .s("sine").attack(1).release(2).room(0.8).roomsize(8).slow(4)`;
          explanation = `Slow ambient pad in ${scale}`;
        } else {
          code = `n("<[0,4,7] [2,5,9] [4,7,11] [0,4,7]>").scale("${scale}").note()
  .s("sine").attack(2).decay(1).sustain(0.8).release(4)
  .room(0.9).roomsize(10).lpf(sine.range(500,2000).slow(16))
  .slow(8)`;
          explanation = `Evolving ambient soundscape with filter movement`;
        }
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            style,
            complexity,
            scale,
            code,
            explanation,
            tryIt: `Paste this code at https://strudel.cc/ to hear it`,
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Transform pattern
server.tool(
  "strudel_transform_pattern",
  "Apply transformations to an existing Strudel pattern.",
  {
    code: z.string().describe("The Strudel pattern code to transform"),
    transformations: z.array(z.string()).describe("List of transformations to apply (e.g., 'fast(2)', 'rev', 'jux(rev)')"),
  },
  async ({ code, transformations }) => {
    // Build the transformed code
    let transformedCode = code;
    const appliedTransforms: string[] = [];

    for (const transform of transformations) {
      // Check if it's a method call or just a function name
      if (transform.includes("(")) {
        transformedCode = `${transformedCode}.${transform}`;
      } else {
        transformedCode = `${transformedCode}.${transform}()`;
      }
      appliedTransforms.push(transform);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            original: code,
            transformations: appliedTransforms,
            transformed: transformedCode,
            explanation: `Applied ${appliedTransforms.length} transformation(s) to the pattern`,
          }, null, 2),
        },
      ],
    };
  }
);

// ============================================
// Reference Tools
// ============================================

// Pattern functions reference
const PATTERN_FUNCTIONS = {
  timing: [
    { name: "fast", desc: "Speed up pattern", example: '.fast(2)' },
    { name: "slow", desc: "Slow down pattern", example: '.slow(2)' },
    { name: "early", desc: "Shift pattern earlier", example: '.early(0.25)' },
    { name: "late", desc: "Shift pattern later", example: '.late(0.25)' },
  ],
  structure: [
    { name: "rev", desc: "Reverse pattern", example: '.rev()' },
    { name: "palindrome", desc: "Play forward then backward", example: '.palindrome()' },
    { name: "iter", desc: "Shift pattern each cycle", example: '.iter(4)' },
    { name: "chunk", desc: "Apply function to chunks", example: '.chunk(4, rev)' },
  ],
  combination: [
    { name: "stack", desc: "Layer patterns", example: 'stack(pat1, pat2)' },
    { name: "cat", desc: "Concatenate patterns", example: 'cat(pat1, pat2)' },
    { name: "layer", desc: "Apply multiple functions", example: '.layer(fast(2), rev)' },
  ],
  randomness: [
    { name: "degrade", desc: "Randomly drop events", example: '.degrade()' },
    { name: "degradeBy", desc: "Drop events with probability", example: '.degradeBy(0.5)' },
    { name: "sometimes", desc: "Apply function randomly", example: '.sometimes(fast(2))' },
    { name: "often", desc: "Apply function often", example: '.often(rev)' },
  ],
  stereo: [
    { name: "jux", desc: "Apply to one channel", example: '.jux(rev)' },
    { name: "juxBy", desc: "Partial stereo separation", example: '.juxBy(0.5, rev)' },
    { name: "pan", desc: "Stereo panning", example: '.pan(sine)' },
  ],
};

// Tool: List functions
server.tool(
  "strudel_list_functions",
  "List available Strudel pattern transformation functions.",
  {
    category: z.string().optional().describe("Filter by category: timing, structure, combination, randomness, stereo"),
  },
  async ({ category }) => {
    let functions: Record<string, any> = PATTERN_FUNCTIONS;

    if (category && category in PATTERN_FUNCTIONS) {
      functions = { [category]: PATTERN_FUNCTIONS[category as keyof typeof PATTERN_FUNCTIONS] };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            categories: Object.keys(PATTERN_FUNCTIONS),
            functions,
          }, null, 2),
        },
      ],
    };
  }
);

// Built-in sounds
const SOUNDS = {
  drums: ["bd", "sd", "hh", "oh", "cp", "mt", "ht", "lt", "rim", "cb", "cy"],
  synths: ["sine", "triangle", "square", "sawtooth", "white", "pink", "brown"],
  samples: ["piano", "gm_acoustic_grand_piano", "gm_electric_guitar_jazz", "gm_acoustic_bass"],
};

// Tool: List sounds
server.tool(
  "strudel_list_sounds",
  "List built-in sounds and samples in Strudel.",
  {
    category: z.string().optional().describe("Filter by category: drums, synths, samples"),
  },
  async ({ category }) => {
    let sounds: Record<string, any> = SOUNDS;

    if (category && category in SOUNDS) {
      sounds = { [category]: SOUNDS[category as keyof typeof SOUNDS] };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            categories: Object.keys(SOUNDS),
            sounds,
            usage: 's("bd sd hh cp") or .s("sawtooth")',
            note: "Many more samples available at strudel.cc",
          }, null, 2),
        },
      ],
    };
  }
);

// ============================================
// Start Server
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Strudel MCP Server running on stdio");
}

main().catch(console.error);
