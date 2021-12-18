import path from "path";
import type { Config } from "@jest/types";

const tsConfigPath = "./test/tsconfig.json";

export default async (): Promise<Config.InitialOptions> => {
	return {
		verbose: true,
		preset: "ts-jest",
		testEnvironment: "node",
		testEnvironmentOptions: {},

		// Specify the paths to look for modules in,
		// this corresponds to the test/tsconfig.json baseUrl
		moduleDirectories: ["node_modules", "src"],

		globals: {
			"ts-jest": {
				tsconfig: tsConfigPath
			},
		},

		// A list of paths to directories that Jest should use to search for files in
		roots: [
			"test"
		],

		// Map module names so that path aliases work correctly
		moduleNameMapper: {
			"^@/(.*)$": path.resolve(__dirname, "./src/$1"),
			"^@@/(.*)$": path.resolve(__dirname, "./test/$1"),
		}
	};
};
