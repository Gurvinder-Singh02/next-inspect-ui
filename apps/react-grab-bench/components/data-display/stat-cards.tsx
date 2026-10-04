"use client";

export const RevenueStatCard = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
      Revenue
    </div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>$12,345</div>
  </div>
);

export const OrderStatCard = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Orders</div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>847</div>
  </div>
);

export const ChurnStatCard = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
      Churn Rate
    </div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>2.4%</div>
  </div>
);

export const RetentionStatCard = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
      Retention
    </div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>97.6%</div>
  </div>
);

export const MrrStatCard = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>MRR</div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>$48,200</div>
  </div>
);
