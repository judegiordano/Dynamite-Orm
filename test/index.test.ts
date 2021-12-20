/* eslint-disable no-undef */
import { Seed, Drop, User } from "./__mocks__";
import { assert } from "chai";

before(async () => {
	await Seed();
});

after(async () => {
	await Drop();
});

const mock = [
	{ age: 25, username: "Foo" },
	{ age: 26, username: "Foo" },
	{ age: 34, username: "Bar" },
	{ age: 50, username: "Baz" },
	{ age: 18, username: "FooBar" },
	{ age: 34, username: "FooBaz" },
	{ age: 26, username: "FooBarBaz" },
];

describe("test dynamite-orm base functionality", () => {
	it("should create some users", async () => {
		const { UnprocessedItems } = await User.BatchWrite(mock);
		assert.isEmpty(UnprocessedItems);
	});
	it("should query by username", async () => {
		const { Count } = await User.FilterByGsi("UsernameIndex", { username: "Foo" });
		assert.equal(Count, 2);
	});
	it("should query by username and age", async () => {
		const { Items, Count } = await User.FilterByGsi("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.equal(Count, 1);
		assert.equal(Items[0]?.username, "Foo");
		assert.equal(Items[0]?.age, 25);
	});
});
