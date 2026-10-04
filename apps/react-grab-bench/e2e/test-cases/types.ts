interface TestCaseDefinition {
  filePath: string;
  componentName: string;
  description: string;
  lazyDescription: string;
}

interface TestEntry extends TestCaseDefinition {
  id: number;
  testId: string;
}

export type { TestCaseDefinition, TestEntry };
