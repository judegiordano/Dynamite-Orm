/* eslint-disable no-undef */
import { assert } from "chai";
import { Seed, Drop } from "./__mocks__";

before(async () => {
	await Seed();
});

after(async () => {
	await Drop();
});

describe("dynamo read", () => {
	it("should run generic test", async () => {
		const value = 1 + 1;
		assert.equal(value, 2);
	});
});
