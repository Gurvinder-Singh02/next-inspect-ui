"use client";
import React, { useState } from "react";
import styles from "./module-switch.module.css";

export const ModuleSwitch = ({
  label,
  defaultChecked = false,
  "data-testid": testId,
}: {
  label?: string;
  defaultChecked?: boolean;
  "data-testid"?: string;
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  return (
    <label className={styles.wrapper} data-testid={testId}>
      <button
        role="switch"
        aria-checked={isChecked}
        onClick={() => setIsChecked((previous) => !previous)}
        className={isChecked ? styles.trackActive : styles.track}
      >
        <span className={isChecked ? styles.thumbActive : styles.thumb} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
};
