import { AWSError } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import type { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

/**
 *
 * @export
 * @interface IModel
 */
export interface IModel {
	id: string;
	is_deleted: Boolean;
	created_at: string;
	updated_at: string;
}

/**
 *
 * `string`
 *
 * ---
 *
 * a pseudo reference to anmother document
 *
 * essentially a reminder to use the referenced document id
 */
export type Ref<T extends IModel> = T["id"]

export interface IBatchWriteInput<T extends IModel> {
	PutRequest: {
		Item: Partial<T>
	}
}

export type UpdateAttributes<T> = { Attributes: Partial<T> }
export type FilterResult<T> = { Items: T[], Count: number, LastEvaluatedKey: Partial<T> }
export type ScaneResult<T> = { Items: T[], Count: number, LastEvaluatedKey: Partial<T> }
export type BatchWriteOutput = PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>
export type PutItemOutput = {
	id: string
	response: PromiseResult<DocumentClient.PutItemOutput, AWSError>
}
export type DeleteItemOutput = PromiseResult<DocumentClient.DeleteItemOutput, AWSError>
export type UpdateReturnValues = "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW"
