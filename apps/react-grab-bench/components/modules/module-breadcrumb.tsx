"use client";
import React from "react";
import styles from "./module-breadcrumb.module.css";

export const ModuleBreadcrumb = ({
  items,
  "data-testid": testId,
}: {
  items: Array<{ label: string; href?: string }>;
  "data-testid"?: string;
}) => {
  return (
    <nav aria-label="Breadcrumb" data-testid={testId}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className={styles.item}>
              {isLast ? (
                <span className={styles.current}>{item.label}</span>
              ) : (
                <>
                  <a href={item.href || "#"} className={styles.link}>
                    {item.label}
                  </a>
                  <span className={styles.separator}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
