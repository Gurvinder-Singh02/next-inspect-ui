export type AccuracyNode = {
  name: string;
  file: string;
  line?: number;
};

export type AccuracyTarget = {
  id: string;
  label: string;
  nodes?: AccuracyNode[];
};

export type SuiteCaseMeta = {
  id: string;
  title: string;
  group: string;
};

export type CaseSourceExample = {
  label: string;
  file: string;
  code: string;
};

export type SuiteSourceFile = {
  label: string;
  file: string;
  code: string;
  html: string;
};

export type FoundNode = {
  name: string;
  source: string | null;
};
