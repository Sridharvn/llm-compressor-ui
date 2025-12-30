# LLM Compressor UI - Copilot Instructions

## Project Overview

A React-based playground for the `llm-chat-msg-compressor` library. It allows users to visualize JSON compression and token savings for LLM API optimization.

## Architecture & Data Flow

- **Main Entry**: [src/App.tsx](src/App.tsx) manages the core state (input, output, options, theme).
- **Compression Logic**: Uses `optimize` and `restore` from `llm-chat-msg-compressor`.
- **Token Counting**: Handled in [src/utils/tokenizer.ts](src/utils/tokenizer.ts) using `js-tiktoken` with `cl100k_base` encoding.
- **Dynamic Documentation**: Fetches the latest README and metadata from NPM via [src/utils/npmService.ts](src/utils/npmService.ts) and parses it using [src/utils/contentMapper.ts](src/utils/contentMapper.ts).

## Key Patterns & Conventions

- **Debounced Updates**: Optimization logic in `App.tsx` is debounced (300ms) to prevent UI lag during typing.
- **Persistence**: `input`, `options`, and `theme` are persisted to `localStorage`.
- **Styling**: Tailwind CSS v4. Use utility classes for all styling. Dark mode is handled via the `.dark` class on `document.documentElement`.
- **Icons**: Use `lucide-react` for all icons.
- **Notifications**: Use `react-hot-toast` for user feedback.
- **Markdown Parsing**: [src/utils/contentMapper.ts](src/utils/contentMapper.ts) uses regex to extract sections from the NPM README. When updating this, ensure regex patterns are robust against common markdown variations.

## Development Workflows

- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Deployment**: `npm run deploy` (deploys to GitHub Pages)
- **Linting**: `npm run lint`

## Critical Files

- [src/App.tsx](src/App.tsx): The "brain" of the application.
- [src/hooks/useDocumentation.ts](src/hooks/useDocumentation.ts): Orchestrates the dynamic documentation fetching.
- [src/utils/contentMapper.ts](src/utils/contentMapper.ts): Contains the logic for transforming raw markdown into structured UI data.
- [src/data/fallbackDocs.ts](src/data/fallbackDocs.ts): Static fallback data used when NPM API is unavailable.

## UI/UX Guidelines

- Maintain the 2-pane layout for Input/Output comparison.
- Ensure the "Compression Analysis" progress bar accurately reflects token savings.
- Use the `status-indicator` class for showing if documentation is "Live" or "Fallback".
