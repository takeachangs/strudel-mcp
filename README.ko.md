# Strudel MCP 서버

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

**[English](README.md)** | 한국어

[Strudel](https://strudel.cc/)과 연동되는 MCP(Model Context Protocol) 서버입니다. Strudel은 코드로 음악 패턴을 만드는 라이브 코딩 환경입니다. 이 서버를 통해 AI 어시스턴트가 Strudel 패턴을 파싱, 분석, 생성, 변환할 수 있습니다.

## Strudel이란?

[Strudel](https://strudel.cc/)은 [TidalCycles](https://tidalcycles.org/)의 JavaScript 버전으로, 코드를 통해 음악을 만드는 라이브 코딩 환경입니다. 간결한 "미니 표기법"을 사용하여 복잡한 리듬 패턴을 표현할 수 있습니다:

```javascript
s("bd sd [hh hh] cp")  // 킥, 스네어, 하이햇 두 번, 클랩
```

## MCP란?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)은 AI 어시스턴트가 외부 도구 및 서비스와 상호작용할 수 있게 해주는 오픈 프로토콜입니다. 이 서버는 Strudel의 패턴 엔진을 MCP 호환 클라이언트에 노출합니다.

## 기능

- **패턴 분석** - 미니 표기법 파싱, 패턴 이벤트 쿼리, 문법 검증
- **음악 이론** - 스케일, 코드, 보이싱 접근
- **코드 생성** - 스타일별 패턴 생성 (드럼, 베이스, 멜로디, 코드, 앰비언트)
- **패턴 변환** - `fast`, `slow`, `rev`, `jux` 등의 변환 적용
- **레퍼런스** - 사용 가능한 함수, 사운드, 샘플 목록

## 설치

### 사전 요구사항

- Node.js 18 이상
- npm 또는 pnpm

### 설정

```bash
# 저장소 클론
git clone https://github.com/takeachangs/strudel-mcp.git
cd strudel-mcp

# 의존성 설치
npm install

# 프로젝트 빌드
npm run build
```

## 사용법

### Claude Desktop에서 사용

Claude Desktop 설정 파일에 추가하세요:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/절대/경로/strudel-mcp/dist/index.js"]
    }
  }
}
```

그 후 Claude Desktop을 재시작하세요.

### Claude Code에서 사용

```bash
claude mcp add strudel node /절대/경로/strudel-mcp/dist/index.js
```

### MCP Inspector로 테스트

서버를 대화형으로 테스트합니다:

```bash
npm run inspect
```

## 사용 가능한 도구

### 패턴 분석

| 도구 | 설명 | 입력 예시 |
|------|------|----------|
| `strudel_parse_mini` | 미니 표기법을 AST로 파싱 | `{"notation": "bd sd [hh hh] cp"}` |
| `strudel_query_pattern` | 시간 범위 내 이벤트 쿼리 | `{"code": "bd sd", "startCycle": 0, "endCycle": 2}` |
| `strudel_validate_code` | 문법 검증 | `{"code": "bd sd [hh hh]"}` |
| `strudel_explain_pattern` | 사람이 읽을 수 있는 설명 | `{"notation": "bd(3,8)"}` |

### 음악 이론

| 도구 | 설명 | 입력 예시 |
|------|------|----------|
| `strudel_list_scales` | 사용 가능한 스케일 목록 | `{"filter": "minor"}` |
| `strudel_get_scale` | 스케일의 음 가져오기 | `{"scale": "pentatonic minor", "root": "A"}` |
| `strudel_list_chords` | 코드 타입 목록 | `{}` |
| `strudel_get_voicing` | 코드 보이싱 가져오기 | `{"chord": "Cmaj7"}` |

### 코드 생성

| 도구 | 설명 | 입력 예시 |
|------|------|----------|
| `strudel_generate_pattern` | 스타일별 패턴 생성 | `{"style": "drums", "complexity": "medium"}` |
| `strudel_transform_pattern` | 변환 적용 | `{"code": "bd sd", "transformations": ["fast(2)", "rev"]}` |

### 레퍼런스

| 도구 | 설명 | 입력 예시 |
|------|------|----------|
| `strudel_list_functions` | 패턴 함수 목록 | `{"category": "timing"}` |
| `strudel_list_sounds` | 내장 사운드 목록 | `{"category": "drums"}` |

## 예시

### 패턴 파싱

```
사용자: "bd sd [hh hh] cp" 패턴을 파싱해줘

도구: strudel_parse_mini
입력: {"notation": "bd sd [hh hh] cp"}
```

**출력:**
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

### 드럼 패턴 생성

```
사용자: 복잡한 드럼 패턴을 만들어줘

도구: strudel_generate_pattern
입력: {"style": "drums", "complexity": "complex"}
```

**출력:**
```json
{
  "style": "drums",
  "complexity": "complex",
  "code": "s(\"bd(3,8), sd(2,8,1), hh*16?0.3, cp(1,4,2)\")",
  "explanation": "유클리드 패턴을 사용한 복잡한 폴리리듬 드럼"
}
```

### 스케일 음 가져오기

```
사용자: A 마이너 펜타토닉의 음이 뭐야?

도구: strudel_get_scale
입력: {"scale": "pentatonic minor", "root": "A"}
```

**출력:**
```json
{
  "name": "A pentatonic minor",
  "notes": ["A", "C", "D", "E", "G"],
  "usage": "n(\"0 1 2 3 4\").scale(\"A:pentatonic_minor\")"
}
```

## 개발

```bash
# 빌드
npm run build

# 직접 실행
npm start

# 워치 모드 (변경 시 재빌드)
npm run dev

# MCP Inspector로 테스트
npm run inspect
```

## 프로젝트 구조

```
strudel-mcp/
├── src/
│   ├── index.ts        # 모든 도구가 포함된 메인 서버
│   └── types.d.ts      # Strudel용 TypeScript 선언
├── dist/               # 컴파일된 출력
├── package.json
├── tsconfig.json
└── README.md
```

## 의존성

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP SDK
- [@strudel/core](https://www.npmjs.com/package/@strudel/core) - Strudel 패턴 엔진
- [@strudel/mini](https://www.npmjs.com/package/@strudel/mini) - 미니 표기법 파서
- [@strudel/tonal](https://www.npmjs.com/package/@strudel/tonal) - 음악 이론 함수
- [tonal](https://www.npmjs.com/package/tonal) - 음악 이론 라이브러리
- [zod](https://www.npmjs.com/package/zod) - 스키마 검증

## 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해주세요.

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE)를 참조하세요.

## 링크

- [Strudel](https://strudel.cc/) - 라이브 코딩 환경
- [Strudel 문서](https://strudel.cc/learn/getting-started) - Strudel 배우기
- [TidalCycles](https://tidalcycles.org/) - 원본 Haskell 구현
- [MCP 명세](https://modelcontextprotocol.io/) - Model Context Protocol

## 감사의 말

- [Alex McLean](https://slab.org/)과 [Felix Roos](https://froos.cc/) - Strudel 제작자
- [Anthropic](https://anthropic.com/) - MCP 명세
