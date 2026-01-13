import type { Group } from "@/types/database";

export const mockGroups: Group[] = [
  {
    id: "group-1",
    user_id: "user-1",
    name: "Tech",
    color: "#3b82f6",
    sort_order: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "group-2",
    user_id: "user-1",
    name: "Social",
    color: "#ec4899",
    sort_order: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "group-3",
    user_id: "user-1",
    name: "Work",
    color: "#22c55e",
    sort_order: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: `group-${Date.now()}`,
  user_id: "user-1",
  name: "Test Group",
  color: "#3b82f6",
  sort_order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
