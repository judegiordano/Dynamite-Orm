# Dynamite-Orm 🧨
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](./LICENSE)

---
## Usage
```ts
// UserModel.ts
import { BaseModel, IModelBase } from "dynamite-orm";

export interface IUser extends IModelBase {
	username: string;
	age: number;
	user_email: string;
}

export class UserModel extends BaseModel implements IUser {

	constructor(data?: Partial<IUser>) {
		super();
		Object.assign(this, data);
	}

	public username!: string;
	public age!: number;
	public user_email!: string;
}
```

```ts
// UserEntity.ts
import { Entity } from "dynamite-orm";

import { IUser } from "./UserModel.ts";

// just a reflection of your dynamodb GSI definitions
type IndexOptions = "UsernameIndex" | "UserEmailIndex";

class UserEntity extends Entity<IndexOptions, IUser> {

	constructor(tableName: string) {
		super(tableName);
	}
}

export const User = new UserEntity("UserTableName");
```
---
## Inserting Document
```ts
import { User } from "./UserEntity";
import { UserModel } from "./UserModel";

(async () => {
	const { Attributes } = await User.Insert({ username: "FooBar", age: 18, user_email: "foo@bar.com" });
	const user = new UserModel(Attributes);
	console.log(user.toJSON());
})()
```
```ts
// the last 3 properties are always present on the document, but
// are stripped out of the JSON once the Attributes are
// constructed into you model class.
// this is done useing class-transformer's @exclude() decorator
{
	id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33",
	username: "FooBar",
	age: 18,
	user_email: "foo@bar.com",
	// is_deleted: false,
	// created_at: "2021-12-18T20:42:49.449Z",
	// updated_at: "2021-12-18T20:42:49.449Z"
}
```
---
## Reading Document By Primary Key
```ts
import { User } from "./UserEntity";

(async () => {
	const item = await User.FindOne({
		id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33"
	});
	console.log(item);
})()
```
```ts
{
	id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33",
	username: "FooBar",
	age: 18,
	user_email: "foo@bar.com",
	is_deleted: false,
	created_at: "2021-12-18T20:42:49.449Z",
	updated_at: "2021-12-18T20:42:49.449Z"
}
```
---
## Reading / Filtering Document By Global Secondary Index
```ts
import { User } from "./UserEntity";

(async () => {
	const { Items, Count } = await User.Find("UsernameIndex", {
		// Key Condition
		username: "FooBar"
	}, {
		// Filter Expression
		age: 18
	}, { order: "DESC", limit: 1 });
	console.log(Count, Items);
})()
```
```ts
// Count
	1,
// Items Array
[
	{
		id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33",
		username: "FooBar",
		age: 18,
		user_email: "foo@bar.com",
		is_deleted: false,
		created_at: "2021-12-18T20:42:49.449Z",
		updated_at: "2021-12-18T20:42:49.449Z"
	}
]
```
___
## Soft Delete / Recover
```ts
import { User } from "./UserEntity";

(async () => {
	const { Attributes } = await User.SoftDelete("98c79a5a-dbc4-4711-9ade-d6c2d6623f33");
	console.log(Attributes);
})()
```
```ts
// this will not actually remove the document
{
	is_deleted: true,
	updated_at: "2021-12-18T21:01:55.102Z"
}
```
## Recover
```ts
import { User } from "./UserEntity";

(async () => {
	const { Attributes } = await User.SoftRecover("98c79a5a-dbc4-4711-9ade-d6c2d6623f33");
	console.log(Attributes);
})()
```
```ts
// this will not actually remove the document
{
	is_deleted: false,
	updated_at: "2021-12-18T21:01:55.102Z"
}
```
---
## Hard Delete
```ts
import { User } from "./UserEntity";

(async () => {
	const { Attributes } = await User.HardDelete("98c79a5a-dbc4-4711-9ade-d6c2d6623f33");
	console.log(Attributes);
})()
```
```ts
// this will remove the document from the database, regardless of is_deleted
{
	id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33",
	username: "FooBar",
	age: 18,
	user_email: "foo@bar.com",
	is_deleted: false,
	created_at: "2021-12-18T20:42:49.449Z",
	updated_at: "2021-12-18T20:42:49.449Z"
}
```
---
## Update Item
```ts
import { User } from "./UserEntity";

(async () => {
	const { Attributes } = await User.UpdateOne({
		id: "98c79a5a-dbc4-4711-9ade-d6c2d6623f33"
	}, {
		age: 19,
		username: "BarBas"
	}, "UPDATED_NEW");
	console.log(Attributes);
})()
```
```ts
{
	age: 19,
	username: "BarBas",
	updated_at: "2021-12-18T21:01:55.102Z"
}
```
