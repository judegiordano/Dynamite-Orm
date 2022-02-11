import { DocumentClient } from "aws-sdk/clients/dynamodb";

import {
	IModel,
	IBatchWriteInput,
	BatchWriteOutput,
	UpdateAttributes,
	FilterResult,
	DeleteItemOutput,
	UpdateReturnValues,
	ScaneResult
} from "../Types";
import { uuid, mapExpression, reduceKeyNames, reduceKeyValues, chunk } from "../Helpers";

/**
 *
 * @export
 * @abstract
 * @class Entity
 * @extends {DynamoDB.DocumentClient}
 * @template IndexOptions
 * @template T
 */
export abstract class Entity<IndexOptions extends string, T extends IModel> extends DocumentClient {

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
	 * @param {string} [endpoint]
	 * @memberof Entity
	 */
	constructor(tableName: string, endpoint?: string) {
		super({ endpoint });
		this.TableName = tableName;
	}

	/**
	 *
	 *
	 * @param {Partial<T>} Key
	 * @param {({
	 * 			select?: [keyof T] | string[]
	 * 		})} [options]
	 * @return {*}  {Promise<T>}
	 * @memberof Entity
	 * ---
	 * find one document by primary key
	 *
	 * if both sort and range keys are defined, both are required
	 */
	public async FindOne(
		Key: Partial<T>,
		options?: {
			select?: [keyof T] | string[]
		}
	): Promise<T> {
		const { Item } = await super.get({
			TableName: this.TableName,
			Key,
			ProjectionExpression: options?.select?.join(", "),
		}).promise();
		return Item as T;
	}

	/**
	 *
	 *
	 * @param {IndexOptions} IndexName
	 * @param {Partial<T>} keyExpression
	 * @param {Partial<T>} [filterExpression={}]
	 * @param {({
	 * 			order?: "ASC" | "DESC",
	 * 			select?: [keyof T] | string[],
	 * 			limit?: number,
	 * 			offsetKey?: Partial<T>
	 * 		})} [options]
	 * @return {*}  {Promise<FilterResult<T>>}
	 * @memberof Entity
	 * ---
	 * filter by a given Global Secondary Index
	 */
	public async Find(
		IndexName: IndexOptions,
		keyExpression: Partial<T>,
		filterExpression: Partial<T> = {},
		options?: {
			order?: "ASC" | "DESC",
			select?: [keyof T] | string[],
			limit?: number,
			offsetKey?: Partial<T>
		}
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
		const { Items, Count, LastEvaluatedKey } = await super.query({
			TableName: this.TableName,
			IndexName,
			KeyConditionExpression: mapExpression(conditionKeys),
			FilterExpression: mapExpression(filterKeys) || "attribute_exists(id)",
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			ExclusiveStartKey: options?.offsetKey,
			ScanIndexForward: options?.order === "ASC",
			ProjectionExpression: options?.select?.join(", "),
			Limit: options?.limit
		}).promise();
		return {
			Items: Items as T[] ?? [],
			Count: Count ?? 0,
			LastEvaluatedKey: LastEvaluatedKey as Partial<T>
		};
	}

	/**
	 *
	 * @param {Partial<T>} Key
	 * @param {Partial<T>} updateExpression
	 * @param {UpdateReturnValues} [ReturnValues="UPDATED_NEW"]
	 * @return {*}  {Promise<UpdateAttributes<T>>}
	 * @memberof Entity
	 * ---
	 * update one document by primary key
	 */
	public async UpdateOne(
		Key: Partial<T>,
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
			Key,
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
	 * ---
	 * insert multiple documents
	 */
	public async InsertMany(document: Partial<T>[]): Promise<BatchWriteOutput[]> {
		const chunks = chunk(document, 25);
		const now = new Date().toISOString();
		const requests = chunks.reduce((acc, chunk) => {
			const values = chunk.reduce((acc, doc) => {
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
			const insert = super.batchWrite({ RequestItems: { [this.TableName]: values } }).promise();
			acc.push(insert);
			return acc;
		}, [] as Promise<BatchWriteOutput>[]);

		return Promise.all(requests);
	}

	/**
	 *
	 * @param {Partial<T>} document
	 * @return {*}  {Promise<T>}
	 * @memberof Entity
	 * ---
	 * insert one document
	 */
	public async Insert(document: Partial<T>): Promise<T> {
		const Item = {
			id: uuid(),
			is_deleted: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...document
		};
		await super.put({
			TableName: this.TableName,
			Item
		}).promise();
		return Item as unknown as T;
	}

	/**
	 *
	 * @param {partial<string>} key
	 * @return {*}  {Promise<UpdateAttributes<T>>}
	 * @memberof Entity
	 */
	public async SoftDelete(key: Partial<T>): Promise<UpdateAttributes<T>> {
		return this.UpdateOne(key, { is_deleted: true } as Partial<IModel> as Partial<T>);
	}

	/**
	 *
	 * @param {Partial<T>} key
	 * @return {*}  {Promise<UpdateAttributes<T>>}
	 * @memberof Entity
	 */
	public async SoftRecover(key: Partial<T>): Promise<UpdateAttributes<T>> {
		return this.UpdateOne(key, { is_deleted: false } as Partial<IModel> as Partial<T>);
	}

	/**
	 *
	 * @param {Partial<T>} key
	 * @return {*}  {Promise<DeleteItemOutput>}
	 * @memberof Entity
	 */
	public async HardDelete(Key: Partial<T>): Promise<DeleteItemOutput> {
		return this.delete({ TableName: this.TableName, Key }).promise();
	}

	public async Scan(
		filterExpression: Partial<T>,
		{
			limit,
			select,
			startKey
		}: {
			limit?: number,
			select?: [keyof T] | string[],
			startKey?: Partial<T>
		}): Promise<ScaneResult<T>> {
		const keys = Object.keys(filterExpression);

		const { Items, Count, LastEvaluatedKey } = await super.scan({
			TableName: this.TableName,
			ExclusiveStartKey: startKey,
			ExpressionAttributeNames: reduceKeyNames(keys),
			ExpressionAttributeValues: reduceKeyValues(filterExpression, keys),
			ProjectionExpression: select?.join(", "),
			FilterExpression: mapExpression(keys),
			Limit: limit
		}).promise();

		return {
			Items: Items as T[] ?? [],
			Count: Count ?? 0,
			LastEvaluatedKey: LastEvaluatedKey as Partial<T> ?? null
		};
	}
}
