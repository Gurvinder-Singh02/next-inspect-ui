"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SuiteSourceFile } from "@/components/accuracy/types";

export type SuiteCaseStatus = "idle" | "pass" | "fail";

type SuiteCaseState = {
  status: SuiteCaseStatus;
  detail?: string;
};

type SuiteRunner = () => Promise<void>;

type SuiteContextValue = {
  projectRoot: string;
  sourcesByCase: Record<string, SuiteSourceFile[]>;
  states: Record<string, SuiteCaseState>;
  setCaseState: (id: string, state: SuiteCaseState) => void;
  reset: () => void;
  registerRunner: (id: string, run: SuiteRunner) => void;
  unregisterRunner: (id: string) => void;
  runSuite: (ids: string[], options?: { delayMs?: number; scroll?: boolean }) => Promise<void>;
  isRunningSuite: boolean;
  suiteProgress: { current: number; total: number; id: string | null } | null;
  /** Groups toggled off with the eye control. */
  hiddenGroups: ReadonlySet<string>;
  /** When set, only this group is shown (Only button). */
  onlyGroup: string | null;
  isGroupVisible: (group: string) => boolean;
  toggleGroupVisible: (group: string) => void;
  showOnlyGroup: (group: string) => void;
  showAllGroups: () => void;
};

const SuiteContext = createContext<SuiteContextValue | null>(null);

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const SuiteProvider = ({
  projectRoot,
  sourcesByCase = {},
  children,
}: {
  projectRoot: string;
  sourcesByCase?: Record<string, SuiteSourceFile[]>;
  children: ReactNode;
}) => {
  const [states, setStates] = useState<Record<string, SuiteCaseState>>({});
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [suiteProgress, setSuiteProgress] = useState<{
    current: number;
    total: number;
    id: string | null;
  } | null>(null);
  const [hiddenGroups, setHiddenGroups] = useState<ReadonlySet<string>>(() => new Set());
  const [onlyGroup, setOnlyGroup] = useState<string | null>(null);
  const runnersRef = useRef(new Map<string, SuiteRunner>());

  useEffect(() => {
    const readGroup = () =>
      setOnlyGroup(new URLSearchParams(window.location.search).get("group") || null);
    readGroup();
    window.addEventListener("popstate", readGroup);
    return () => window.removeEventListener("popstate", readGroup);
  }, []);

  const writeGroupParam = useCallback((group: string | null) => {
    const url = new URL(window.location.href);
    if (group) url.searchParams.set("group", group);
    else url.searchParams.delete("group");
    window.history.replaceState(window.history.state, "", url);
    setOnlyGroup(group);
  }, []);

  // Keep local eye-hides cleared when deep-linking into Only mode.
  useEffect(() => {
    if (onlyGroup) setHiddenGroups(new Set());
  }, [onlyGroup]);

  const isGroupVisible = useCallback(
    (group: string) => {
      if (onlyGroup) return group === onlyGroup;
      return !hiddenGroups.has(group);
    },
    [hiddenGroups, onlyGroup],
  );

  const toggleGroupVisible = useCallback(
    (group: string) => {
      if (onlyGroup) writeGroupParam(null);
      setHiddenGroups((prev) => {
        const next = new Set(prev);
        if (next.has(group)) next.delete(group);
        else next.add(group);
        return next;
      });
    },
    [onlyGroup, writeGroupParam],
  );

  const showOnlyGroup = useCallback(
    (group: string) => {
      setHiddenGroups(new Set());
      writeGroupParam(group);
    },
    [writeGroupParam],
  );

  const showAllGroups = useCallback(() => {
    setHiddenGroups(new Set());
    writeGroupParam(null);
  }, [writeGroupParam]);

  const setCaseState = useCallback((id: string, state: SuiteCaseState) => {
    setStates((prev) => {
      const current = prev[id];
      if (current?.status === state.status && current?.detail === state.detail) {
        return prev;
      }
      return { ...prev, [id]: state };
    });
  }, []);

  const reset = useCallback(() => setStates({}), []);

  const registerRunner = useCallback((id: string, run: SuiteRunner) => {
    runnersRef.current.set(id, run);
  }, []);

  const unregisterRunner = useCallback((id: string) => {
    runnersRef.current.delete(id);
  }, []);

  const runSuite = useCallback(
    async (ids: string[], options?: { delayMs?: number; scroll?: boolean }) => {
      if (isRunningSuite) return;
      const delayMs = options?.delayMs ?? 0;
      const scroll = options?.scroll ?? false;

      setIsRunningSuite(true);
      setSuiteProgress({ current: 0, total: ids.length, id: null });

      try {
        for (let index = 0; index < ids.length; index += 1) {
          const id = ids[index]!;
          setSuiteProgress({ current: index + 1, total: ids.length, id });

          if (scroll) {
            document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" });
            await wait(280);
          }

          const run = runnersRef.current.get(id);
          if (run) await run();

          if (delayMs > 0 && index < ids.length - 1) await wait(delayMs);
        }
      } finally {
        setIsRunningSuite(false);
        setSuiteProgress(null);
      }
    },
    [isRunningSuite],
  );

  const value = useMemo(
    () => ({
      projectRoot,
      sourcesByCase,
      states,
      setCaseState,
      reset,
      registerRunner,
      unregisterRunner,
      runSuite,
      isRunningSuite,
      suiteProgress,
      hiddenGroups,
      onlyGroup,
      isGroupVisible,
      toggleGroupVisible,
      showOnlyGroup,
      showAllGroups,
    }),
    [
      projectRoot,
      sourcesByCase,
      states,
      setCaseState,
      reset,
      registerRunner,
      unregisterRunner,
      runSuite,
      isRunningSuite,
      suiteProgress,
      hiddenGroups,
      onlyGroup,
      isGroupVisible,
      toggleGroupVisible,
      showOnlyGroup,
      showAllGroups,
    ],
  );

  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};

export const useSuite = () => {
  const ctx = useContext(SuiteContext);
  if (!ctx) throw new Error("useSuite must be used within SuiteProvider");
  return ctx;
};
