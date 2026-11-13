import { useEffect, useState } from 'react';
import { fetchAbilityDetails } from '../../services/api.js';

function getDescription(ability) {
	const englishEffect = ability.effect_entries?.find(entry => entry.language.name === 'en');
	return englishEffect?.short_effect || englishEffect?.effect || null;
}

function AbilityCards({ abilities }) {
	const abilitySignature = JSON.stringify(abilities.map(entry => (
		typeof entry === 'string'
			? { name: entry, isHidden: false }
			: { name: entry.ability.name, isHidden: entry.is_hidden }
	)));
	const [descriptions, setDescriptions] = useState({});

	useEffect(() => {
		let isMounted = true;
		const entries = JSON.parse(abilitySignature);

		Promise.all(entries.map(async entry => {
			try {
				const details = await fetchAbilityDetails(entry.name);
				return [entry.name, getDescription(details)];
			} catch (error) {
				console.error(`Erreur lors du chargement de la capacité ${entry.name} : `, error);
				return [entry.name, null];
			}
		})).then(results => {
			if (isMounted) setDescriptions(Object.fromEntries(results));
		});

		return () => {
			isMounted = false;
		};
	}, [abilitySignature]);

	if (abilities.length === 0) return <p>Aucune capacité renseignée.</p>;

	return (
		<div className="pokemon-ability-cards">
			{JSON.parse(abilitySignature).map(({ name, isHidden }) => (
				<article className="pokemon-ability-card" key={name}>
					<h3>{name.replaceAll('-', ' ')}</h3>
					{isHidden && (
						<span className="pokemon-ability-hidden" title="This Pokémon can have this as a hidden ability">
							Hidden ability
						</span>
					)}
					<p>{descriptions[name] || 'Description unavailable for this ability.'}</p>
				</article>
			))}
		</div>
	);
}

export default AbilityCards;
