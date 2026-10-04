import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/dynamic-import/panels/notifications-panel.tsx",
  componentName: "NotificationsPanel",
  description:
    "Notification settings panel loaded via dynamic import map pattern inspired by Cal.com EventTypeWebWrapper (https://github.com/calcom/cal.com/blob/main/apps/web/modules/event-types/components/EventTypeWebWrapper.tsx)",
  lazyDescription: "the notification settings panel",
};

export default testCase;
