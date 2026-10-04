import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/lazy-named/lazy-calendar-source.tsx",
  componentName: "EventCalendar",
  description:
    "Named export EventCalendar loaded via lazy() with .then() to extract non-default export, inspired by LobeChat MessageContent (https://github.com/lobehub/lobe-chat/blob/main/src/features/Conversation/ChatItem/components/MessageContent/index.tsx)",
  lazyDescription: "the event calendar",
};

export default testCase;
