import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { fetchPokemon, fetchTypeDetails } from './api.js';

const POKEMON_KEY = 'pokedex.Pokemon.v2';

beforeEach(() => {
	// The service logs errors on purpose; keep the test output readable.
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('fetchPokemon', () => {
	it('calls the API and caches the response in localStorage', async () => {
		const data = { results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }] };
		const get = vi.spyOn(api, 'get').mockResolvedValue({ data });

		await expect(fetchPokemon()).resolves.toEqual(data);
		expect(get).toHaveBeenCalledWith('pokemon?limit=100000');
		expect(JSON.parse(localStorage.getItem(POKEMON_KEY))).toEqual(data);
	});

	it('uses the cached value instead of calling the API', async () => {
		const cached = { results: [{ name: 'cached-mon' }] };
		localStorage.setItem(POKEMON_KEY, JSON.stringify(cached));
		const get = vi.spyOn(api, 'get');

		await expect(fetchPokemon()).resolves.toEqual(cached);
		expect(get).not.toHaveBeenCalled();
	});

	it('ignores a corrupted cache and refetches', async () => {
		localStorage.setItem(POKEMON_KEY, '{broken');
		const data = { results: [] };
		const get = vi.spyOn(api, 'get').mockResolvedValue({ data });

		await expect(fetchPokemon()).resolves.toEqual(data);
		expect(get).toHaveBeenCalledOnce();
	});

	it('rethrows API errors', async () => {
		vi.spyOn(api, 'get').mockRejectedValue(new Error('Network Error'));
		await expect(fetchPokemon()).rejects.toThrow('Network Error');
	});
});

describe('fetchTypeDetails', () => {
	it('looks the type up by name, then fetches its details URL', async () => {
		const typeUrl = 'https://pokeapi.co/api/v2/type/10/';
		const details = { name: 'fire', id: 10 };
		const get = vi.spyOn(api, 'get').mockImplementation(async endpoint => {
			if (endpoint.startsWith('type?')) return { data: { results: [{ name: 'fire', url: typeUrl }] } };
			if (endpoint === typeUrl) return { data: details };
			throw new Error(`Unexpected endpoint ${endpoint}`);
		});

		await expect(fetchTypeDetails('fire')).resolves.toEqual(details);
		expect(get).toHaveBeenCalledWith(typeUrl);
	});

	it('throws when the type does not exist', async () => {
		vi.spyOn(api, 'get').mockResolvedValue({ data: { results: [] } });
		await expect(fetchTypeDetails('not-a-type')).rejects.toThrow('not-a-type');
	});
});
