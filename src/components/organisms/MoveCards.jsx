import { useEffect, useState } from 'react';
import { fetchMoveDetails } from '../../services/api.js';
import TypeBadges from '../atoms/TypeBadges.jsx';

const DISPLAYED_MOVES = 20;

function getEnglishEffect(move) {
	const entry = move.effect_entries?.find(effect => effect.language.name === 'en');
	const description = entry?.short_effect || entry?.effect || null;
	return description?.replaceAll('{{effect_chance}}', move.effect_chance ?? 'a');
}

function getLearningMethods(moveEntry) {
	const details = moveEntry.version_group_details ?? [];
	const labels = details.map(({ level_learned_at, move_learn_method, version_group }) => {
		const method = move_learn_method.name.replaceAll('-', ' ');
		const version = version_group.name.replaceAll('-', ' ');
		const learning = move_learn_method.name === 'level-up'
			? `Level ${level_learned_at || '—'}`
			: method;
		return `${learning} · ${version}`;
	});

	return [...new Set(labels)];
}

function getTargetCategory(targetName) {
	if (['user', 'users-field', 'user-and-allies'].includes(targetName)) {
		return 'User';
	}

	if (['all-opponents', 'all-other-pokemon', 'all-pokemon', 'entire-field', 'opponents-field'].includes(targetName)) {
		return 'All';
	}

	return 'Target';
}

function MoveCards({ moves }) {
	const moveEntries = moves.slice(0, DISPLAYED_MOVES).map(entry => (
		typeof entry === 'string'
			? { name: entry, learningMethods: [] }
			: { name: entry.move.name, learningMethods: getLearningMethods(entry) }
	));
	const moveSignature = JSON.stringify(moveEntries);
	const [detailsByName, setDetailsByName] = useState({});

	useEffect(() => {
		let isMounted = true;
		const entries = JSON.parse(moveSignature);

		Promise.all(entries.map(async ({ name }) => {
			try {
				const details = await fetchMoveDetails(name);
				return [name, details];
			} catch (error) {
				console.error(`Erreur lors du chargement de l’attaque ${name} : `, error);
				return [name, null];
			}
		})).then(results => {
			if (isMounted) setDetailsByName(Object.fromEntries(results));
		});

		return () => {
			isMounted = false;
		};
	}, [moveSignature]);

	if (moves.length === 0) return <p>Aucune attaque renseignée.</p>;

	return (
		<>
			<div className="pokemon-move-cards">
				{moveEntries.map(({ name, learningMethods }) => {
					const move = detailsByName[name];
					const effect = move && getEnglishEffect(move);

					return (
						<details className="pokemon-move-card" key={name}>
							<summary className="pokemon-move-summary">
								<div className="pokemon-move-heading">
									<h3>{name.replaceAll('-', ' ')}</h3>
								</div>
								{move?.type ? <TypeBadges types={[{ type: move.type }]} /> : <span className="pokemon-move-type-placeholder">Type</span>}
								{move ? (
									<div className="pokemon-move-facts">
										<span className="pokemon-move-fact"><span>Class</span><strong>{move.damage_class.name.replaceAll('-', ' ')}</strong></span>
										<span className="pokemon-move-fact"><span>Power</span><strong>{move.power ?? '—'}</strong></span>
										<span className="pokemon-move-fact"><span>Accuracy</span><strong>{move.accuracy == null ? '—' : `${move.accuracy}%`}</strong></span>
										<span className="pokemon-move-fact"><span>PP</span><strong>{move.pp ?? '—'}</strong></span>
										<span className="pokemon-move-fact"><span>Priority</span><strong>{move.priority}</strong></span>
										<span className="pokemon-move-fact"><span>Target</span><strong>{getTargetCategory(move.target.name)}</strong></span>
									</div>
								) : (
									<span className="pokemon-move-loading">
										{Object.hasOwn(detailsByName, name) ? 'Details unavailable' : 'Loading move data…'}
									</span>
								)}
							</summary>
							<div className="pokemon-move-content">
								{move ? (
									<>
										<p>{effect || 'No effect description available.'}</p>
										{learningMethods.length > 0 && (
											<details className="pokemon-move-learning">
												<summary>How to obtain ({learningMethods.length} methods)</summary>
												<ul>
													{learningMethods.map(method => <li key={method}>{method}</li>)}
												</ul>
											</details>
										)}
									</>
								) : (
									<p>
										{Object.hasOwn(detailsByName, name)
											? 'Move description unavailable.'
											: 'Move description will appear when the details finish loading.'}
									</p>
								)}
							</div>
						</details>
					);
				})}
			</div>
			{moves.length > DISPLAYED_MOVES && (
				<p className="pokemon-details-section-note">
					Showing {DISPLAYED_MOVES} of {moves.length} moves.
				</p>
			)}
		</>
	);
}

export default MoveCards;
