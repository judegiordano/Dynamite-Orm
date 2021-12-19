import { assert } from 'chai'

before(async () => {
	describe("wip", () => {
		it("should run generic test", async () => {
			const value = 1 + 1
			assert.equal(value, 2)
		});
	});
})
