# Strudel MCP Server

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

An MCP (Model Context Protocol) server that enables LLMs to work with [Strudel](https://strudel.cc/) - a live coding environment for music patterns. This server allows AI assistants to parse, analyze, generate, and transform Strudel patterns.

## What is Strudel?

[Strudel](https://strudel.cc/) is a JavaScript port of [TidalCycles](https://tidalcycles.org/), a live coding environment for creating music through code. It uses a concise "mini notation" to express complex rhythmic patterns:

```javascript
s("bd sd [hh hh] cp")  // kick, snare, two hi-hats, clap
```

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that enables AI assistants to interact with external tools and services. This server exposes Strudel's pattern engine to any MCP-compatible client.

## Features

- **Pattern Analysis** - Parse mini notation, query pattern events, validate syntax
- **Music Theory** - Access scales, chords, and voicings
- **Code Generation** - Generate patterns by style (drums, bass, melody, chords, ambient)
- **Pattern Transformation** - Apply transformations like `fast`, `slow`, `rev`, `jux`
- **Reference** - List available functions, sounds, and samples

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/strudel-mcp.git
cd strudel-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/absolute/path/to/strudel-mcp/dist/index.js"]
    }
  }
}
```

Then restart Claude Desktop.

### With Claude Code

```bash
claude mcp add strudel node /absolute/path/to/strudel-mcp/dist/index.js
```

### With MCP Inspector

Test the server interactively:

```bash
npm run inspect
```

## Available Tools

### Pattern Analysis

| Tool | Description | Example Input |
|------|-------------|---------------|
| `strudel_parse_mini` | Parse mini notation to AST | `{"notation": "bd sd [hh hh] cp"}` |
| `strudel_query_pattern` | Query events in time range | `{"code": "bd sd", "startCycle": 0, "endCycle": 2}` |
| `strudel_validate_code` | Validate syntax | `{"code": "bd sd [hh hh]"}` |
| `strudel_explain_pattern` | Human-readable explanation | `{"notation": "bd(3,8)"}` |

### Music Theory

| Tool | Description | Example Input |
|------|-------------|---------------|
| `strudel_list_scales` | List available scales | `{"filter": "minor"}` |
| `strudel_get_scale` | Get notes in a scale | `{"scale": "pentatonic minor", "root": "A"}` |
| `strudel_list_chords` | List chord types | `{}` |
| `strudel_get_voicing` | Get chord voicing | `{"chord": "Cmaj7"}` |

### Code Generation

| Tool | Description | Example Input |
|------|-------------|---------------|
| `strudel_generate_pattern` | Generate pattern by style | `{"style": "drums", "complexity": "medium"}` |
| `strudel_transform_pattern` | Apply transformations | `{"code": "bd sd", "transformations": ["fast(2)", "rev"]}` |

### Reference

| Tool | Description | Example Input |
|------|-------------|---------------|
| `strudel_list_functions` | List pattern functions | `{"category": "timing"}` |
| `strudel_list_sounds` | List built-in sounds | `{"category": "drums"}` |

## Examples

### Parse a Pattern

```
User: Parse the pattern "bd sd [hh hh] cp"

Tool: strudel_parse_mini
Input: {"notation": "bd sd [hh hh] cp"}
```

**Output:**
```json
{
  "notation": "bd sd [hh hh] cp",
  "eventCount": 5,
  "events": [
    {"value": "bd", "whole": "0 -> 0.25"},
    {"value": "sd", "whole": "0.25 -> 0.5"},
    {"value": "hh", "whole": "0.5 -> 0.625"},
    {"value": "hh", "whole": "0.625 -> 0.75"},
    {"value": "cp", "whole": "0.75 -> 1"}
  ]
}
```

### Generate a Drum Pattern

```
User: Generate a complex drum pattern

Tool: strudel_generate_pattern
Input: {"style": "drums", "complexity": "complex"}
```

**Output:**
```json
{
  "style": "drums",
  "complexity": "complex",
  "code": "s(\"bd(3,8), sd(2,8,1), hh*16?0.3, cp(1,4,2)\")",
  "explanation": "Complex polyrhythmic drums using Euclidean patterns"
}
```

### Get Scale Notes

```
User: What notes are in A minor pentatonic?

Tool: strudel_get_scale
Input: {"scale": "pentatonic minor", "root": "A"}
```

**Output:**
```json
{
  "name": "A pentatonic minor",
  "notes": ["A", "C", "D", "E", "G"],
  "usage": "n(\"0 1 2 3 4\").scale(\"A:pentatonic_minor\")"
}
```

## Development

```bash
# Build
npm run build

# Run directly
npm start

# Watch mode (rebuild on changes)
npm run dev

# Test with MCP Inspector
npm run inspect
```

## Project Structure

```
strudel-mcp/
├── src/
│   ├── index.ts        # Main server with all tools
│   └── types.d.ts      # TypeScript declarations for Strudel
├── dist/               # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP SDK
- [@strudel/core](https://www.npmjs.com/package/@strudel/core) - Strudel pattern engine
- [@strudel/mini](https://www.npmjs.com/package/@strudel/mini) - Mini notation parser
- [@strudel/tonal](https://www.npmjs.com/package/@strudel/tonal) - Music theory functions
- [tonal](https://www.npmjs.com/package/tonal) - Music theory library
- [zod](https://www.npmjs.com/package/zod) - Schema validation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Strudel](https://strudel.cc/) - Live coding environment
- [Strudel Documentation](https://strudel.cc/learn/getting-started) - Learn Strudel
- [TidalCycles](https://tidalcycles.org/) - Original Haskell implementation
- [MCP Specification](https://modelcontextprotocol.io/) - Model Context Protocol

## Acknowledgments

- [Alex McLean](https://slab.org/) and [Felix Roos](https://froos.cc/) - Strudel creators
- [Anthropic](https://anthropic.com/) - MCP specification
