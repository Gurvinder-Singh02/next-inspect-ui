import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath:
    "components/features/billing/invoices/lines/discounts/amounts/invoice-line-discount.tsx",
  componentName: "InvoiceLineDiscount",
  description:
    "InvoiceLineDiscount nested 8 levels deep in a billing directory chain (inspired by Cal.com platform https://github.com/calcom/cal.com/blob/main/packages/platform/types/bookings/2024-08-13/outputs/get-booking.output.ts)",
  lazyDescription: "the deeply nested invoice line discount",
};

export default testCase;
