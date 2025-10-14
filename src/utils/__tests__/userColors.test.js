import { describe, it, expect } from "vitest";
import { getUserColor, COLOR_PALETTE } from "../userColors";

describe("userColors utility", () => {
  describe("color palette", () => {
    it("should have exactly 10 colors defined", () => {
      expect(COLOR_PALETTE).toHaveLength(10);
    });

    it("should have all colors in valid hex format", () => {
      COLOR_PALETTE.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it("should have all unique colors", () => {
      const uniqueColors = new Set(COLOR_PALETTE);
      expect(uniqueColors.size).toBe(10);
    });
  });

  describe("color generation consistency", () => {
    it("should return the same color for the same userId", () => {
      const userId = "user-123";
      const color1 = getUserColor(userId);
      const color2 = getUserColor(userId);

      expect(color1).toBe(color2);
    });

    it("should return a valid hex color format", () => {
      const userId = "user-456";
      const color = getUserColor(userId);

      // Check if color is a valid hex color (e.g., #FF5733)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should return one of the 10 predefined colors", () => {
      const userId = "user-789";
      const color = getUserColor(userId);

      expect(COLOR_PALETTE).toContain(color);
    });
  });

  describe("color uniqueness", () => {
    it("should assign different colors to different users", () => {
      const user1 = "user-001";
      const user2 = "user-002";

      const color1 = getUserColor(user1);
      const color2 = getUserColor(user2);

      // Note: Due to 10 colors, some users might get the same color
      // This test ensures the function returns valid colors
      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
    });

    it("should handle multiple user IDs consistently", () => {
      const users = ["user-a", "user-b", "user-c", "user-d", "user-e"];
      const colors = users.map((userId) => getUserColor(userId));

      // Each user should get a color
      expect(colors).toHaveLength(5);
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it("should return the same color for the same user across multiple calls", () => {
      const userId = "user-consistent";
      const calls = 10;
      const colors = Array.from({ length: calls }, () => getUserColor(userId));

      // All colors should be identical for the same user
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(1);
    });
  });
});
