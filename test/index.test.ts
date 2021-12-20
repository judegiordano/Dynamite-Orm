/* eslint-disable no-undef */
import { Seed, Drop } from "./__mocks__";

before(async () => {
	await Seed();
});

after(async () => {
	await Drop();
});
