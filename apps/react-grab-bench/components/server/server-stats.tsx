import { hashTestId } from "@/lib/hash-test-id";
import { ServerStatCard } from "./server-stat-card";

export const ServerStats = () => {
  const stats = [
    {
      label: "Users",
      value: "12,345",
      testId: hashTestId("server-stat-users"),
    },
    {
      label: "Revenue",
      value: "$89.2K",
      testId: hashTestId("server-stat-revenue"),
    },
    {
      label: "Uptime",
      value: "99.97%",
      testId: hashTestId("server-stat-uptime"),
    },
  ];

  return (
    <div
      data-testid={hashTestId("server-stats")}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginTop: 16,
      }}
    >
      {stats.map((stat) => (
        <ServerStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          data-testid={stat.testId}
        />
      ))}
    </div>
  );
};
