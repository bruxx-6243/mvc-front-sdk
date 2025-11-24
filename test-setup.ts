// Ensure reflect-metadata is loaded before any tsyringe imports
import "reflect-metadata";

// Verify it's loaded
if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
  throw new Error("reflect-metadata failed to load");
}

