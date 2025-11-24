import { expect, test, describe } from "bun:test";
import { verifyReflectMetadata } from "./test-setup";

describe("test-setup.ts", () => {
  test("should verify reflect-metadata is loaded", () => {
    // This test verifies that reflect-metadata is properly loaded
    expect(() => verifyReflectMetadata()).not.toThrow();
    expect(typeof Reflect).not.toBe("undefined");
    expect(Reflect.getMetadata).toBeDefined();
    expect(typeof Reflect.getMetadata).toBe("function");
  });

  test("should throw error when Reflect is undefined", () => {
    // Save original Reflect
    const originalReflect = globalThis.Reflect;

    try {
      // Temporarily remove Reflect to test error path
      // @ts-expect-error - intentionally removing Reflect for testing
      delete globalThis.Reflect;

      expect(() => verifyReflectMetadata()).toThrow(
        "reflect-metadata failed to load"
      );
    } finally {
      // Restore Reflect
      globalThis.Reflect = originalReflect;
    }
  });

  test("should throw error when Reflect.getMetadata is missing", () => {
    // Save original Reflect and getMetadata
    const originalReflect = globalThis.Reflect;
    const originalGetMetadata = Reflect.getMetadata;

    try {
      // Temporarily remove getMetadata to test error path
      // @ts-expect-error - intentionally removing getMetadata for testing
      delete Reflect.getMetadata;

      expect(() => verifyReflectMetadata()).toThrow(
        "reflect-metadata failed to load"
      );
    } finally {
      // Restore Reflect and getMetadata
      globalThis.Reflect = originalReflect;
      Reflect.getMetadata = originalGetMetadata;
    }
  });
});

