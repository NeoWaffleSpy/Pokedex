import { describe, expect, it } from 'vitest';
import { addCustomPokemon, readCustomPokemon } from '../services/customPokemonStorage.js';

const STORAGE_KEY = 'pokedex.customPokemon.v1';

const pikachuBis = {
	id: 'custom-1',
	name: 'pikachu-bis',
	height: 4,
	weight: 60,
	types: ['electric'],
	abilities: ['static'],
	moves: ['thunderbolt'],
	stats: { hp: 35 },
};

describe('readCustomPokemon', () => {
	it('returns an empty list when nothing is stored', () => {
		expect(readCustomPokemon()).toEqual([]);
	});

	it('returns the stored Pokémon', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([pikachuBis]));
		expect(readCustomPokemon()).toEqual([pikachuBis]);
	});

	it('throws when the stored value is not valid JSON', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');
		expect(() => readCustomPokemon()).toThrow('illisibles');
	});

	it('throws when a stored Pokémon has the wrong shape', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...pikachuBis, height: '4' }]));
		expect(() => readCustomPokemon()).toThrow('format invalide');
	});
});

describe('addCustomPokemon', () => {
	it('appends the Pokémon and persists the list', () => {
		const second = { ...pikachuBis, id: 'custom-2', name: 'raichu-bis' };

		addCustomPokemon(pikachuBis);
		const result = addCustomPokemon(second);

		expect(result).toEqual([pikachuBis, second]);
		expect(readCustomPokemon()).toEqual([pikachuBis, second]);
	});
});
