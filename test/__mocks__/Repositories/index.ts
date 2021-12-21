import { Entity, IModel } from "../../../src";

export interface IUser extends IModel {
	username: string,
	age: number
}

type indexOptions = "UsernameIndex"

class UserEntity extends Entity<indexOptions, IUser> {
	constructor(table: string) {
		super(table, "http://localhost:8000");
	}
}

export const User = new UserEntity("Users");
