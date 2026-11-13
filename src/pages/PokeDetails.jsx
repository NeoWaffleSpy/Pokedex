import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useCustomPokemon } from '../state/customPokemonContext.js';
import AbilityCards from '../components/organisms/AbilityCards.jsx';
import MoveCards from '../components/organisms/MoveCards.jsx';
import TypeBadges from '../components/atoms/TypeBadges.jsx';

const MAX_BASE_STAT = 255;

function formatName(name) {
	return name.replaceAll('-', ' ');
}

function getCustomError(storageError, savedPokemon) {
	if (storageError) return 'Impossible de lire ce Pokémon personnalisé.';
	if (!savedPokemon) return 'Pokémon personnalisé introuvable.';
	return null;
}

function PokeDetails({ custom = false }) {
	const { id } = useParams();
	const { customPokemon, storageError } = useCustomPokemon();
	// Last API response, tagged with the id it belongs to: { id, pokemon, error }.
	const [apiResult, setApiResult] = useState(null);

	// Custom Pokémon are already in the global store: derive them during render, no effect needed.
	const savedPokemon = custom ? customPokemon.find(entry => entry.id === id) : null;

	useEffect(() => {
		if (custom) return undefined;

		let isMounted = true;

		api.get(`pokemon/${id}`)
			.then(response => {
				if (isMounted) setApiResult({ id, pokemon: response.data, error: null });
			})
			.catch(requestError => {
				console.error('Erreur lors de la récupération des détails du Pokémon: ', requestError);
				if (isMounted) setApiResult({ id, pokemon: null, error: 'Impossible de charger les détails de ce Pokémon.' });
			});

		return () => {
			isMounted = false;
		};
	}, [custom, id]);

	// Still loading while the stored result is missing or belongs to a previous id.
	const isLoading = !custom && apiResult?.id !== id;
	const pokemon = custom ? savedPokemon : apiResult?.pokemon;
	const error = custom ? getCustomError(storageError, savedPokemon) : apiResult?.error;

	if (isLoading) {
		return <p className="pokemon-details-message">Chargement des détails…</p>;
	}

	if (error || !pokemon) {
		return (
			<section className="pokemon-details-message" role="alert">
				<p>{error || 'Pokémon introuvable.'}</p>
				<Link to="/">Retour au Pokédex</Link>
			</section>
		);
	}

	if (custom) {
		const stats = Object.entries(pokemon.stats);

		return (
			<div className="pokemon-details">
				<Link className="pokemon-details-back" to="/">← Retour au Pokédex</Link>
				<header className="pokemon-details-hero">
					{pokemon.image
						? <img src={pokemon.image} alt={pokemon.name} />
						: <div className="pokemon-details-artwork-placeholder" aria-hidden="true">?</div>}
					<div>
						<p className="pokemon-details-number">Pokémon personnalisé</p>
						<h1>{formatName(pokemon.name)}</h1>
						<TypeBadges types={pokemon.types} />
					</div>
				</header>
				<div className="pokemon-details-sections">
					<section className="pokemon-details-section pokemon-details-section--profile">
						<h2>Physical profile</h2>
						<dl className="pokemon-details-facts">
							<div><dt>Height</dt><dd>{(pokemon.height / 10).toFixed(1)} m</dd></div>
							<div><dt>Weight</dt><dd>{(pokemon.weight / 10).toFixed(1)} kg</dd></div>
						</dl>
					</section>
					<section className="pokemon-details-section pokemon-details-section--stats">
						<h2>Base stats</h2>
						<div className="pokemon-details-stats">
							{stats.map(([name, value]) => (
								<div className="pokemon-stat" key={name}>
									<span className="pokemon-stat-name">{formatName(name)}</span>
									<span className="pokemon-stat-value">{value}</span>
									<div className="pokemon-stat-track" role="progressbar" aria-label={formatName(name)} aria-valuemin="0" aria-valuemax={MAX_BASE_STAT} aria-valuenow={value}>
										<span style={{ width: `${Math.min(value / MAX_BASE_STAT * 100, 100)}%` }} />
									</div>
								</div>
							))}
						</div>
					</section>
					<section className="pokemon-details-section pokemon-details-section--wide">
						<h2>Abilities</h2>
						<AbilityCards abilities={pokemon.abilities} />
					</section>
					<section className="pokemon-details-section pokemon-details-section--wide pokemon-details-moves">
						<h2>Moves <span>({pokemon.moves.length} total)</span></h2>
						<MoveCards moves={pokemon.moves} />
					</section>
				</div>
			</div>
		);
	}

	const artwork = pokemon.sprites.other?.['official-artwork']?.front_default
		|| pokemon.sprites.front_default;
	return (
		<div className="pokemon-details">
			<Link className="pokemon-details-back" to="/">← Retour au Pokédex</Link>

			<header className="pokemon-details-hero">
				{artwork && <img src={artwork} alt={pokemon.name} />}
				<div>
					<p className="pokemon-details-number">N° {String(pokemon.id).padStart(3, '0')}</p>
					<h1>{formatName(pokemon.name)}</h1>
					<TypeBadges types={pokemon.types} />
					<p className="pokemon-details-experience">
						{pokemon.base_experience ?? '—'} <span>base experience</span>
					</p>
				</div>
			</header>

			<div className="pokemon-details-sections">
				<section className="pokemon-details-section pokemon-details-section--profile">
					<h2>Physical profile</h2>
					<dl className="pokemon-details-facts">
						<div>
							<dt>Height</dt>
							<dd>{(pokemon.height / 10).toFixed(1)} m</dd>
						</div>
						<div>
							<dt>Weight</dt>
							<dd>{(pokemon.weight / 10).toFixed(1)} kg</dd>
						</div>
						<div>
							<dt>Forms</dt>
							<dd>{pokemon.forms.map(({ name }) => formatName(name)).join(', ')}</dd>
						</div>
					</dl>
				</section>

				<section className="pokemon-details-section pokemon-details-section--stats">
					<h2>Base stats</h2>
					<div className="pokemon-details-stats">
						{pokemon.stats.map(({ base_stat, stat }) => (
							<div className="pokemon-stat" key={stat.name}>
								<span className="pokemon-stat-name">{formatName(stat.name)}</span>
								<span className="pokemon-stat-value">{base_stat}</span>
								<div
									className="pokemon-stat-track"
									role="progressbar"
									aria-label={formatName(stat.name)}
									aria-valuemin="0"
									aria-valuemax={MAX_BASE_STAT}
									aria-valuenow={base_stat}
								>
									<span style={{ width: `${Math.min(base_stat / MAX_BASE_STAT * 100, 100)}%` }} />
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="pokemon-details-section pokemon-details-section--wide">
					<h2>Abilities</h2>
					<AbilityCards abilities={pokemon.abilities} />
				</section>

				<section className="pokemon-details-section pokemon-details-section--wide pokemon-details-moves">
					<h2>Moves <span>({pokemon.moves.length} total)</span></h2>
					<MoveCards moves={pokemon.moves} />
				</section>
			</div>
		</div>
	);
}

export default PokeDetails;
