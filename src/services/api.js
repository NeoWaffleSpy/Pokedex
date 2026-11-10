import axios from "axios"

const detailCache = new Map();
const POKEMON_KEY = 'pokedex.Pokemon.v2';
const TYPE_KEY = 'pokedex.Type.v2';
const ABILITY_KEY = 'pokedex.Ability.v2';
const MOVE_KEY = 'pokedex.Move.v2';
const LIST_LIMIT = 100000;

const api = axios.create({ baseURL: "https://pokeapi.co/api/v2/", })
export default api

export function fetchPokemon() { return fetchData(POKEMON_KEY, `pokemon?limit=${LIST_LIMIT}`); }
export function fetchTypes() { return fetchData(TYPE_KEY, `type?limit=${LIST_LIMIT}`); }
export function fetchAbilities() { return fetchData(ABILITY_KEY, `ability?limit=${LIST_LIMIT}`); }
export function fetchMoves() { return fetchData(MOVE_KEY, `move?limit=${LIST_LIMIT}`); }

export function fetchTypeDetails(type) { return fetchResourceDetails('type', type); }
export function fetchAbilityDetails(ability) { return fetchResourceDetails('ability', ability); }
export function fetchMoveDetails(move) { return fetchResourceDetails('move', move); }

async function fetchResourceDetails(resourceType, resource) {
	let resourceData = resource;
	if (typeof resourceData === 'string') {
		const fetchList = {
			type: fetchTypes,
			ability: fetchAbilities,
			move: fetchMoves,
		}[resourceType];
		const list = await fetchList();
		resourceData = list.results.find(entry => entry.name === resourceData);
	}

	if (!resourceData?.url || !resourceData.name)
		throw new Error(`Impossible de trouver la ressource ${resourceType} "${resource}".`);

	const key = `pokedex.${resourceType}.${resourceData.name}.details.v1`;
	if (detailCache.has(key)) return detailCache.get(key);

	const request = fetchData(key, resourceData.url)
		.catch(error => {
			detailCache.delete(key);
			throw error;
		});
	detailCache.set(key, request);
	return request;
}

async function fetchData(key, endpoint) {
	let storedValue;
	try { storedValue = localStorage.getItem(key); }
	catch (error) { console.error('Erreur lors de la lecture des données depuis le stockage local : ', error); }

	if (storedValue) {
		try {
			const data = JSON.parse(storedValue);
			if (data && typeof data === 'object') return data;
			console.error(`Les données en cache pour "${endpoint}" ont un format invalide.`);
		} catch (error) { console.error('Erreur lors de la lecture des données depuis le stockage local : ', error); }
	}

	try {
		const response = await api.get(endpoint);
		const data_2 = response.data;
		try { localStorage.setItem(key, JSON.stringify(data_2)); }
		catch (error_2) { console.error('Erreur lors de la sauvegarde des données dans le stockage local : ', error_2); }
		return data_2;
	} catch (error_3) {
		console.error('Erreur lors de la récupération des données depuis l\'API : ', error_3);
		throw error_3;
	}
}