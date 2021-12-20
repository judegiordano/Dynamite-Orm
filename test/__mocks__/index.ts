import aws from "aws-sdk";

aws.config.update({
	region: "local-region",
	accessKeyId: "test-key",
	secretAccessKey: "test-secret"
});

export const dynamo = new aws.DynamoDB({
	endpoint: "http://localhost:8000",
});

export const document = new aws.DynamoDB.DocumentClient({ endpoint: "http://localhost:8000" });

export async function Seed() {
	const { TableDescription } = await dynamo.createTable({
		TableName: "Users",
		KeySchema: [
			{ AttributeName: "id", KeyType: "HASH" },
			{ AttributeName: "created_at", KeyType: "RANGE" }
		],
		AttributeDefinitions: [
			{ AttributeName: "id", AttributeType: "S" },
			{ AttributeName: "created_at", AttributeType: "S" },
			{ AttributeName: "username", AttributeType: "S" }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "UsernameIndex",
				KeySchema: [
					{ AttributeName: "username", KeyType: "HASH" },
					{ AttributeName: "created_at", KeyType: "RANGE" }
				],
				Projection: {
					ProjectionType: "ALL"
				},
				ProvisionedThroughput: {
					ReadCapacityUnits: 1,
					WriteCapacityUnits: 1
				}
			}
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 1,
			WriteCapacityUnits: 1
		}
	}).promise();
	console.log("tables created:", TableDescription?.TableName);
}

export async function Drop() {
	const { TableNames } = await dynamo.listTables().promise();
	if (!TableNames) return;
	console.log("dropping tables:", TableNames);
	const drop = TableNames.reduce((acc, name) => {
		acc.push(dynamo.deleteTable({ TableName: name }).promise());
		return acc;
	}, [] as Promise<any>[]);
	await Promise.all(drop);
}
