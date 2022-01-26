import { instanceToPlain } from "class-transformer";

import { IModel } from "../Types";

export abstract class BaseModel implements IModel {

	constructor(data?: Partial<IModel>) {
		Object.assign(this, data);
	}

	public id!: string;

	public is_deleted!: boolean;

	public created_at!: string;

	public updated_at!: string;

	public toJSON() {
		return instanceToPlain(this);
	}
}
