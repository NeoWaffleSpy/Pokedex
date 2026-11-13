import { useCallback, useMemo, useReducer } from 'react';
import { addCustomPokemon } from '../services/customPokemonStorage.js';
import {
	CustomPokemonContext,
	customPokemonReducer,
	initCustomPokemonState,
} from './customPokemonContext.js';

function CustomPokemonProvider({ children }) {
	const [state, dispatch] = useReducer(customPokemonReducer, undefined, initCustomPokemonState);

	// Persist first: if localStorage throws, the state is left untouched and the caller shows the error.
	const addPokemon = useCallback(newPokemon => {
		addCustomPokemon(newPokemon);
		dispatch({ type: 'added', pokemon: newPokemon });
	}, []);

	const value = useMemo(() => ({
		customPokemon: state.pokemon,
		storageError: state.error,
		addPokemon,
	}), [state, addPokemon]);

	return (
		<CustomPokemonContext.Provider value={value}>
			{children}
		</CustomPokemonContext.Provider>
	);
}

export default CustomPokemonProvider;
