import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { Link } from 'react-router-dom';
import TypeBadges from '../atoms/TypeBadges.jsx';

const detailsCache = new Map();

function getPokemonDetails(url) {
  if (!detailsCache.has(url)) {
    const request = api.get(url)
      .then(response => response.data)
      .catch(error => {
        detailsCache.delete(url);
        throw error;
      });
    detailsCache.set(url, request);
  }

  return detailsCache.get(url);
}

function Pokecard({ pokemon }) {
  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState(false);
  const pokemonId = pokemon.isCustom ? pokemon.id : pokemon.url.split('/').filter(Boolean).at(-1);
  const artwork = pokemon.isCustom ? pokemon.image : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

  useEffect(() => {
    if (pokemon.isCustom) return undefined;

    let isMounted = true;

    getPokemonDetails(pokemon.url)
      .then(data => { if (isMounted) setDetails(data); })
      .catch(error => {
        console.error(`Erreur lors de la récupération des détails de ${pokemon.name}: `, error);
        if (isMounted) setDetailsError(true);
      });

    return () => { isMounted = false; };
  }, [pokemon.isCustom, pokemon.name, pokemon.url]);

  const types = pokemon.isCustom ? pokemon.types : details?.types;
  const height = pokemon.isCustom ? pokemon.height : details?.height;
  const weight = pokemon.isCustom ? pokemon.weight : details?.weight;

  return (
	<Link className="pokemon-card-link" to={pokemon.isCustom ? `/custom/${pokemonId}` : `/poke/${pokemonId}`}>
		<article className="pokemon-card">
			<span className="pokemon-card-number">
				{pokemon.isCustom ? 'Custom' : `#${pokemonId.padStart(3, '0')}`}
			</span>
			{artwork
				? <img className="pokemon-card-artwork" src={artwork} alt={pokemon.name} loading="lazy" />
				: <div className="pokemon-card-artwork-placeholder" aria-hidden="true">?</div>}
			<h2>{pokemon.name}</h2>
			{types ? (
				<>
				<TypeBadges types={types} />
				<p className="pokemon-card-measurements">
					Taille {(height / 10).toFixed(1)} m
					<span aria-hidden="true"> · </span>
					Poids {(weight / 10).toFixed(1)} kg
				</p>
				</>
			) : (
				<p className="pokemon-card-details-status" role={detailsError ? 'status' : undefined}>
				{detailsError ? 'Types indisponibles' : 'Chargement des détails…'}
				</p>
			)}
		</article>
	</Link>
  );
}

export default Pokecard;
