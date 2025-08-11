export const status = ["pending", "active", "inactive"] as const;
export type Status = (typeof status)[number];
