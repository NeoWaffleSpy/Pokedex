import { createContext, useContext } from 'react';
import { readCustomPokemon } from '../services/customPokemonStorage.js';

export const CustomPokemonContext = createContext(null);

// Lazy initial state: localStorage is read once, when the provider mounts.
export function initCustomPokemonState() {
	try {
		return { pokemon: readCustomPokemon(), error: null };
	} catch (error) {
		console.error('Erreur lors de la lecture des Pokémon personnalisés : ', error);
		return { pokemon: [], error: 'Impossible de lire les Pokémon personnalisés enregistrés.' };
	}
}

// Pure function: (current state, action) -> next state. Easy to unit test.
export function customPokemonReducer(state, action) {
	switch (action.type) {
		case 'added':
			return { ...state, pokemon: [...state.pokemon, action.pokemon] };
		default:
			throw new Error(`Action inconnue : ${action.type}`);
	}
}

export function useCustomPokemon() {
	const context = useContext(CustomPokemonContext);
	if (!context)
		throw new Error('useCustomPokemon doit être utilisé dans un <CustomPokemonProvider>.');
	return context;
}
