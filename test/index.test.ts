/* eslint-disable no-undef */
import { assert } from "chai";
import { Seed, Drop, User, IUser, mockData } from "./__mocks__";

before(async () => {
	await Seed();
});

after(async () => {
	await Drop();
});

describe("test dynamite-orm base functionality", () => {

	let lastKey: Partial<IUser>;

	it("should insert multiple items", async () => {
		const items = await User.InsertMany(mockData);
		items.every(({ UnprocessedItems }) => assert.isEmpty(UnprocessedItems));
	});

	it("should query by username", async () => {
		const { Items, Count } = await User.Find("UsernameIndex", { username: "Foo" });
		assert.equal(Count, 2);
		Items.every(user => assert.equal(user.username, "Foo"));
	});

	it("should query by username", async () => {
		const { Items, Count } = await User.Find("UsernameIndex", { username: "Foo" });
		assert.equal(Count, 2);
		Items.every(user => assert.equal(user.username, "Foo"));
	});

	it("should paginate results", async () => {
		const { Items, Count, LastEvaluatedKey } = await User.Find("UsernameIndex", {
			username: "Duplicate"
		}, {}, { limit: 200 });
		assert.equal(Count, 200);
		Items.every(user => assert.equal(user.username, "Duplicate"));
		lastKey = LastEvaluatedKey;
	});

	it("should get next page results", async () => {
		const { Items, Count } = await User.Find("UsernameIndex", {
			username: "Duplicate"
		}, {}, { limit: 200, offsetKey: lastKey });
		assert.equal(Count, 200);
		Items.every(user => assert.equal(user.username, "Duplicate"));
	});

	it("should query by username and age", async () => {
		const { Items, Count } = await User.Find("UsernameIndex", {
			username: "Foo"
		}, {
			age: 25
		});
		assert.equal(Count, 1);
		assert.equal(Items[0]?.username, "Foo");
		assert.equal(Items[0]?.age, 25);
	});

	it("should soft delete an item", async () => {
		const { Items } = await User.Find("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.exists(Items[0]?.id);
		const { Attributes } = await User.SoftDelete({ id: Items[0]?.id!, created_at: Items[0]?.created_at });
		assert.isTrue(Attributes.is_deleted);
	});

	it("should soft recover an item", async () => {
		const { Items } = await User.Find("UsernameIndex", { username: "Foo" }, { age: 25 });
		assert.exists(Items[0]?.id);
		const { Attributes } = await User.SoftRecover({ id: Items[0]?.id!, created_at: Items[0]?.created_at });
		assert.isFalse(Attributes.is_deleted);
	});

	it("should update an item", async () => {
		const { Items } = await User.Find("UsernameIndex", { username: "Foo" }, { age: 25 });
		const { Attributes } = await User.UpdateOne({
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
		const { Items } = await User.Find("UsernameIndex", { username: "NewUsername" }, { age: 26 });
		const { id, created_at } = await User.FindOne({
			id: Items[0]?.id!,
			created_at: Items[0]?.created_at
		});
		assert.equal(id, Items[0]?.id);
		assert.equal(created_at, Items[0]?.created_at);
	});

	it("should insert one item and return values", async () => {
		const item = await User.Insert({ age: 26, username: "SomeUniqueName" });
		const { Items } = await User.Find("UsernameIndex", { username: "SomeUniqueName" });
		assert.deepEqual(Items[0], item);
	});

	it("should scan items", async () => {
		const scan1 = await User.Scan({ is_deleted: false }, { limit: 20 });
		assert.equal(scan1.Count, 20);
		assert.equal(scan1.Items.length, 20);
		assert.exists(scan1.Items);
		assert.exists(scan1.LastEvaluatedKey);
		const scan2 = await User.Scan({ is_deleted: false }, { limit: 20, startKey: scan1.LastEvaluatedKey });
		assert.equal(scan2.Count, 20);
		assert.equal(scan2.Items.length, 20);
		assert.exists(scan2.Items);
		assert.exists(scan2.LastEvaluatedKey);
	});

	it("should ensure each unique id exists once", async () => {
		const { Items, Count } = await User.Scan({ is_deleted: false }, {});
		const ids = Items.reduce((acc: string[], { id }) => {
			acc.push(id);
			return acc;
		}, []);
		assert.equal(Count, ids.length);
		ids.every((id) => {
			const found = ids.filter(i => i === id);
			assert.equal(found.length, 1);
		});
	});
});
