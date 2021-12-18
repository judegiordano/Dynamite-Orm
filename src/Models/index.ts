import { Exclude, instanceToPlain } from "class-transformer";

import { IModel } from "../Types";

export abstract class BaseModel implements IModel {

	constructor(data?: Partial<IModel>) {
		Object.assign(this, data);
	}

	public id!: string;

	@Exclude()
	public is_deleted!: boolean;

	@Exclude()
	public created_at!: string;

	@Exclude()
	public updated_at!: string;

	public toJSON() {
		return instanceToPlain(this);
	}
}
