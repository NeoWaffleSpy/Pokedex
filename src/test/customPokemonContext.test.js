import { describe, expect, it, vi } from 'vitest';
import { customPokemonReducer, initCustomPokemonState } from '../state/customPokemonContext.js';

describe('customPokemonReducer', () => {
	it('adds a Pokémon without mutating the previous state', () => {
		const state = { pokemon: [{ id: 'a' }], error: null };
		const next = customPokemonReducer(state, { type: 'added', pokemon: { id: 'b' } });

		expect(next.pokemon).toEqual([{ id: 'a' }, { id: 'b' }]);
		expect(state.pokemon).toEqual([{ id: 'a' }]);
	});

	it('rejects unknown actions', () => {
		expect(() => customPokemonReducer({ pokemon: [] }, { type: 'nope' })).toThrow('nope');
	});
});

describe('initCustomPokemonState', () => {
	it('starts empty with no error when nothing is stored', () => {
		expect(initCustomPokemonState()).toEqual({ pokemon: [], error: null });
	});

	it('reports an error when the stored data is corrupted', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		localStorage.setItem('pokedex.customPokemon.v1', 'not json');

		const state = initCustomPokemonState();
		expect(state.pokemon).toEqual([]);
		expect(state.error).toMatch('Impossible de lire');
	});
});
