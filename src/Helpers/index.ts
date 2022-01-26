import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 20);

export const uuid = () => nanoid();

/**
 *
 * @export
 * @template T
 * @param {T} object
 * @param {string[]} keys
 * @return {*}  {T}
 * ---
 * maps
 * ```
 * ['key_name1', 'key_name2']
 * ```
 * ->
 * ```
 * {
 * ':key_name1': object[key_name1],
 * ':key_name2': object[key_name2]
 * }
 * ```
 */
export function reduceKeyValues<T>(object: T, keys: string[]): T {
	return keys.map(a => `:${a}`).reduce((acc, key) => {
		acc[key] = object[key.replace(":", "") as keyof T];
		return acc;
	}, {} as any);
}

/**
 *
 * @export
 * @param {string[]} keys
 * @return {*}  {{ [key: string]: string }}
 * ---
 * maps
 * ```
 * ['key_name1', 'key_name2']
 * ```
 * ->
 * ```
 * {
 * '#key_name1': 'key_name1',
 * '#key_name2': 'key_name2'
 * }
 * ``` */
export function reduceKeyNames(keys: string[]): { [key: string]: string } {
	return keys.map(a => `#${a}`).reduce((acc, key) => {
		acc[key] = key.replace("#", "");
		return acc;
	}, {} as { [key: string]: string });
}

/**
 *
 * @export
 * @param {string[]} keys
 * @return {*}  {string}
 * ---
 * maps
 * ```
 * ['key_name1', 'key_name2']
 * ```
 * ->
 * ```
 * '#key_name1 = :key_name1 and #key_name2 = :key_name2'
 * ```
 */
export function mapExpression(keys: string[]): string {
	return keys.map(a => `#${a} = :${a}`).join(" and ");
}

export function chunk<T>(array: T[], chunkSize: number): T[][] {
	return array.reduce((acc, item, index) => {
		const chunkIndex = Math.floor(index / chunkSize);

		if (!acc[chunkIndex]) {
			acc[chunkIndex] = [];
		}

		acc[chunkIndex].push(item);

		return acc;
	}, [] as any);
}
