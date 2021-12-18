import { DynamoDB } from "aws-sdk";

import {
	IModel,
	IBatchWriteInput,
	BatchWriteOutput,
	UpdateAttributes,
	FilterResult,
	DeleteItemOutput,
	UpdateReturnValues
} from "../Types";
import { uuid, mapExpression, reduceKeyNames, reduceKeyValues } from "../Helpers";

/**
 *
 * @export
 * @abstract
 * @class Entity
 * @extends {DynamoDB.DocumentClient}
 * @template IndexOptions
 * @template T
 */
export abstract class Entity<IndexOptions extends string, T extends IModel> extends DynamoDB.DocumentClient {

	/**
	 *
	 * @protected
	 * @type {string}
	 * @memberof Entity
	 */
	protected readonly TableName: string;

	/**
	 * Creates an instance of Entity.
	 * @param {string} tableName
	 * @memberof Entity
	 */
	constructor(tableName: string) {
		super();
		this.TableName = tableName;
	}

	/**
	 *
	 * @param {string} id
	 * @return {*}  {Promise<T>}
	 * @memberof Entity
	 */
	public async FindById(id: string): Promise<T> {
		const { Items } = await super.query({
			TableName: this.TableName,
			KeyConditionExpression: "#id = :id",
			ExpressionAttributeNames: { "#id": "id" },
			ExpressionAttributeValues: { ":id": id },
			Limit: 1
		}).promise();
		if (!Items) throw new Error("no item found");
		return Items[0] as T;
	}

	/**
	 *
	 * @param {IndexOptions} IndexName
	 * @param {Partial<T>} keyConditionExpression
	 * @param {({ order?: "ASC" | "DESC", limit?: number })} [options]
	 * @return {*}  {Promise<FilterResult<T>>}
	 * @memberof Entity
	 */
	public async FilterByGsi(
		IndexName: IndexOptions,
		keyExpression: Partial<T>,
		filterExpression: Partial<T> = {},
		options?: { order?: "ASC" | "DESC", limit?: number }
	): Promise<FilterResult<T>> {
		const conditionKeys = Object.keys(keyExpression);
		const filterKeys = Object.keys(filterExpression);
		const ExpressionAttributeNames = {
			...reduceKeyNames(conditionKeys),
			...reduceKeyNames(filterKeys)
		};
		const ExpressionAttributeValues = {
			...reduceKeyValues(keyExpression, conditionKeys),
			...reduceKeyValues(filterExpression, filterKeys)
		};
		const { Items, Count } = await super.query({
			TableName: this.TableName,
			IndexName,
			KeyConditionExpression: mapExpression(conditionKeys),
			FilterExpression: mapExpression(filterKeys),
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			ScanIndexForward: options?.order === "ASC",
			Limit: options?.limit
		}).promise();
		if (!Items || !Count || Count == 0) throw new Error("no items found");
		return {
			Items: Items as T[],
			Count
		};
	}

	/**
	 *
	 * @param {string} pk
	 * @param {Partial<T>} updateExpression
	 * @param {("NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW")} [ReturnValues="UPDATED_NEW"]
	 * @return {*}
	 * @memberof Entity
	 */
	public async UpdateById(
		id: string,
		updateExpression: Partial<T>,
		ReturnValues: UpdateReturnValues = "UPDATED_NEW"
	): Promise<UpdateAttributes<T>> {
		const keys = Object.keys(updateExpression);
		const join = keys.map(a => `${a} = :${a}`).join(", ");
		const UpdateExpression = `set ${join}, updated_at = :updated_at`;
		const ExpressionAttributeValues = {
			...reduceKeyValues(updateExpression, keys),
			":updated_at": new Date().toISOString(),
		};
		const { Attributes } = await super.update({
			TableName: this.TableName,
			Key: { id },
			UpdateExpression,
			ExpressionAttributeValues,
			ReturnValues
		}).promise();
		if (!Attributes) throw new Error("no item updated");
		return {
			Attributes: Attributes as Partial<T>
		};
	}

	/**
	 *
	 * @param {Partial<T>[]} document
	 * @return {*}  {Promise<BatchWriteOutput>}
	 * @memberof Entity
	 */
	public async BatchWrite(document: Partial<T>[]): Promise<BatchWriteOutput> {
		const now = new Date().toISOString();
		const values = document.reduce((acc, doc) => {
			acc.push({
				PutRequest: {
					Item: {
						id: uuid(),
						is_deleted: false,
						created_at: now,
						updated_at: now,
						...doc
					}
				}
			});
			return acc;
		}, [] as IBatchWriteInput<T>[]);
		return super.batchWrite({ RequestItems: { [this.TableName]: values } }).promise();
	}

	/**
	 *
	 * @param {Partial<T>} document
	 * @return {*}  {Promise<PutItemOutput>}
	 * @memberof Entity
	 */
	public async PutItem(document: Partial<T>): Promise<T> {
		const { Attributes } = await super.put({
			TableName: this.TableName,
			Item: {
				id: uuid(),
				is_deleted: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				...document
			}
		}).promise();
		return Attributes as T;
	}

	/**
	 *
	 * @param {string} id
	 * @return {*}  {Promise<UpdateAttributes<T>>}
	 * @memberof Entity
	 */
	public async SoftDelete(id: string): Promise<UpdateAttributes<T>> {
		return this.UpdateById(id, { is_deleted: true } as Partial<IModel> as Partial<T>);
	}

	/**
	 *
	 * @param {string} id
	 * @return {*}  {Promise<UpdateAttributes<T>>}
	 * @memberof Entity
	 */
	public async SoftRecover(id: string): Promise<UpdateAttributes<T>> {
		return this.UpdateById(id, { is_deleted: false } as Partial<IModel> as Partial<T>);
	}

	/**
	 *
	 * @param {string} id
	 * @return {*}  {Promise<DeleteItemOutput>}
	 * @memberof Entity
	 */
	public async HardDelete(id: string): Promise<DeleteItemOutput> {
		return this.delete({ TableName: this.TableName, Key: { id } }).promise();
	}
}
