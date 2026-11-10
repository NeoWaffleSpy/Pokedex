const CUSTOM_POKEMON_KEY = 'pokedex.customPokemon.v1';

function isCustomPokemon(value) {
	return value
		&& typeof value.id === 'string'
		&& typeof value.name === 'string'
		&& typeof value.height === 'number'
		&& typeof value.weight === 'number'
		&& Array.isArray(value.types)
		&& Array.isArray(value.abilities)
		&& Array.isArray(value.moves)
		&& value.stats
		&& typeof value.stats === 'object';
}

export function readCustomPokemon() {
	const storedValue = localStorage.getItem(CUSTOM_POKEMON_KEY);
	if (storedValue === null) return [];

	let pokemon;
	try { pokemon = JSON.parse(storedValue); }
	catch (error) { throw new Error('Les Pokémon personnalisés enregistrés sont illisibles.', { cause: error }); }

	if (!Array.isArray(pokemon) || !pokemon.every(isCustomPokemon))
		throw new Error('Les Pokémon personnalisés enregistrés ont un format invalide.');

	return pokemon;
}

export function addCustomPokemon(newPokemon) {
	const pokemon = [...readCustomPokemon(), newPokemon];
	localStorage.setItem(CUSTOM_POKEMON_KEY, JSON.stringify(pokemon));
	return pokemon;
}
