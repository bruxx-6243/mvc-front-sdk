#!/usr/bin/env bun
/**
 * Test script to verify local package exports
 * Run this from the consuming project after installing the tarball
 */

// Test importing from the local package
import { BaseController } from "mvc-front-sdk";

console.log("✅ BaseController imported successfully!");
console.log("BaseController type:", typeof BaseController);
console.log("BaseController name:", BaseController.name);

// Test extending the class
class TestController extends BaseController {
  constructor() {
    super("https://api.example.com");
  }

  async testMethod() {
    return this.getApiUrl("/test");
  }
}

const controller = new TestController();
console.log("✅ TestController created successfully!");
console.log("Controller instance:", controller);
console.log("API URL:", controller.testMethod());

console.log("\n✅ All tests passed! The package is working correctly.");

