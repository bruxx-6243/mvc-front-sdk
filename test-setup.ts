// Ensure reflect-metadata is loaded before any tsyringe imports
import "reflect-metadata";

/**
 * Verifies that reflect-metadata is properly loaded
 * @throws {Error} If reflect-metadata failed to load
 */
export function verifyReflectMetadata(): void {
  if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
    throw new Error("reflect-metadata failed to load");
  }
}

// Verify it's loaded on module initialization
verifyReflectMetadata();

