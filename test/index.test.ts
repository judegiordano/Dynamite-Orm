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
	it("should insert some items", async () => {
		const { UnprocessedItems } = await User.BatchWrite(mock);
		assert.isEmpty(UnprocessedItems);
	});
	it("should query by username", async () => {
		const { Items, Count } = await User.FilterByGsi("UsernameIndex", { username: "Foo" });
		assert.equal(Count, 2);
		Items.every(user => assert.equal(user.username, "Foo"));
	});
	it("should query by username and age", async () => {
		const { Items, Count } = await User.FilterByGsi("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.equal(Count, 1);
		assert.equal(Items[0]?.username, "Foo");
		assert.equal(Items[0]?.age, 25);
	});
	it("should soft delete an item", async () => {
		const { Items } = await User.FilterByGsi("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.exists(Items[0]?.id);
		const { Attributes } = await User.SoftDelete({ id: Items[0]?.id!, created_at: Items[0]?.created_at });
		assert.isTrue(Attributes.is_deleted);
	});
	it("should soft recover an item", async () => {
		const { Items } = await User.FilterByGsi("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.exists(Items[0]?.id);
		const { Attributes } = await User.SoftRecover({ id: Items[0]?.id!, created_at: Items[0]?.created_at });
		assert.isFalse(Attributes.is_deleted);
	});
	it("should update an item", async () => {
		const { Items } = await User.FilterByGsi("UsernameIndex", { username: "Foo" }, { age: 25 });
		const { Attributes } = await User.UpdateByPrimaryKey({
			id: Items[0]?.id!,
			created_at: Items[0]?.created_at
		}, {
			username: "NewUsername",
			age: 26
		});
		assert.equal(Attributes.username, "NewUsername");
		assert.equal(Attributes.age, 26);
	});
	it("should find an item by primary partition", async () => {
		const { Items } = await User.FilterByGsi("UsernameIndex", { username: "NewUsername" }, { age: 26 });
		const { id, created_at } = await User.FilterByPrimaryKey({
			id: Items[0]?.id!,
			created_at: Items[0]?.created_at
		});
		assert.equal(id, Items[0]?.id);
		assert.equal(created_at, Items[0]?.created_at);
	});
});
