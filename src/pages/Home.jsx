import Pagination from '../components/molecules/Pagination.jsx';
import Pokecard from '../components/molecules/Pokecard.jsx';
import { fetchPokemon } from '../services/api.js';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useCustomPokemon } from '../state/customPokemonContext.js';

const PAGE_SIZE = 50;

function Home() {
	const [pokedex, setPokedex] = useState([]);
	const { customPokemon, storageError } = useCustomPokemon();
	const [currentPage, setCurrentPage] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const allPokemon = useMemo(() => [...pokedex, ...customPokemon], [pokedex, customPokemon]);
	const searchablePokemon = useMemo(
		() => allPokemon.map(pokemon => ({
			pokemon,
			searchName: pokemon.name.toLowerCase(),
		})),
		[allPokemon],
	);
	const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
	const normalizedSearch = searchQuery.trim().toLowerCase();
	const filteredPokemon = useMemo(
		() => normalizedSearch
			? searchablePokemon
				.filter(entry => entry.searchName.includes(deferredSearch))
				.map(entry => entry.pokemon)
			: allPokemon,
		[allPokemon, deferredSearch, normalizedSearch, searchablePokemon],
	);
	const totalPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
	const visiblePokemon = filteredPokemon.slice(
		currentPage * PAGE_SIZE,
		(currentPage + 1) * PAGE_SIZE,
	);
	const isSearchPending = normalizedSearch !== deferredSearch;

	useEffect(() => {
		fetchPokemon()
			.then(data => {
				if (!Array.isArray(data.results)) {
					throw new Error('La liste reçue depuis le Pokédex est invalide.');
				}
				setPokedex(data.results);
			})
			.catch(requestError => {
				console.error('Erreur lors de la récupération des données: ', requestError);
				setError('Impossible de charger le Pokédex.');
			})
			.finally(() => { setIsLoading(false); });
	}, []);

	return (
		<>
			{isLoading && <p>Chargement du Pokédex…</p>}
			{error && <p role="alert">{error}</p>}
			{storageError && <p role="alert">{storageError}</p>}
			{!isLoading && allPokemon.length > 0 && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
					searchQuery={searchQuery}
					searchResultCount={filteredPokemon.length}
					onSearchChange={query => {
						setSearchQuery(query);
						setCurrentPage(0);
					}}
				/>
			)}
			<div className="pokedex-grid">
				{visiblePokemon.map(pokemon => (
					<Pokecard
						key={pokemon.isCustom ? pokemon.id : pokemon.name}
						pokemon={pokemon}
					/>
				))}
				{isSearchPending && <p>Recherche…</p>}
				{!isSearchPending && !isLoading && visiblePokemon.length === 0 && (
					<p>{normalizedSearch ? 'Aucun Pokémon ne correspond à cette recherche.' : 'Aucun Pokémon trouvé.'}</p>
				)}
			</div>
		</>
	);
}

export default Home;