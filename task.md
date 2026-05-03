# AI Assistant v2.0 Task Tracking

- [x] 1. Install Dependencies
  - [x] Run `npm install ai @ai-sdk/openai`
- [x] 2. Update Chat State & Reset Logic
  - [x] Modify `src/lib/stores/ai-chat-store.ts` to clear messages when closed.
- [x] 3. Refactor API Route for Streaming & Tools
  - [x] Modify `src/app/api/ai/chat/route.ts` to use Vercel AI SDK.
  - [x] Implement `get_portfolio_news` tool.
  - [x] Implement `search_general_news` tool.
  - [x] Implement `get_news_context` tool.
- [x] 4. Update Frontend UI for Streaming
  - [x] Refactor `src/components/assistant/full-screen-chat.tsx` to use Vercel AI SDK logic.
  - [x] Create `AnalyzedNewsCard` component.
  - [x] Parse and render tool invocations safely.
- [x] 5. Verification
  - [x] Verify chat reset behavior.
  - [x] Verify live text streaming.
  - [x] Test `get_portfolio_news` invocation. and UI rendering.
