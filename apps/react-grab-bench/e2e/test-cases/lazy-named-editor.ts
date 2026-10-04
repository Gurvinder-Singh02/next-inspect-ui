import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/lazy-named/lazy-editor-source.tsx",
  componentName: "RichEditor",
  description:
    "Named export RichEditor loaded via lazy() with .then() to extract non-default export, inspired by LobeChat MessageContent (https://github.com/lobehub/lobe-chat/blob/main/src/features/Conversation/ChatItem/components/MessageContent/index.tsx)",
  lazyDescription: "the rich text editor",
};

export default testCase;
