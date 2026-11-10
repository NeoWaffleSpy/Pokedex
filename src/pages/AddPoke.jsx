import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addCustomPokemon } from '../services/customPokemonStorage.js';

function AddPoke() {
	const navigate = useNavigate();
	const [error, setError] = useState('');

	function handleSubmit(event) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const name = formData.get('name').trim();

		const newPokemon = {
			id: crypto.randomUUID(),
			isCustom: true,
			name,
			image: formData.get('image').trim(),
			height: Math.round(Number(formData.get('height')) * 10),
			weight: Math.round(Number(formData.get('weight')) * 10),
			types: formData.get('types').split(',').map(type => type.trim()).filter(Boolean),
			abilities: formData.get('abilities').split(',').map(ability => ability.trim()).filter(Boolean),
			moves: formData.get('moves').split(',').map(move => move.trim()).filter(Boolean),
			stats: {
				hp: Number(formData.get('hp')),
				attack: Number(formData.get('attack')),
				defense: Number(formData.get('defense')),
				'special-attack': Number(formData.get('specialAttack')),
				'special-defense': Number(formData.get('specialDefense')),
				speed: Number(formData.get('speed')),
			},
		};

		try {
			addCustomPokemon(newPokemon);
			navigate('/');
		} catch (storageError) {
			console.error('Erreur lors de l’enregistrement du Pokémon personnalisé : ', storageError);
			setError('Impossible d’enregistrer le Pokémon. Vérifiez que le stockage du navigateur est disponible.');
		}
	}

	return (
		<section className="add-pokemon-page">
			<Link className="pokemon-details-back" to="/">← Retour au Pokédex</Link>
			<h1>Ajouter un Pokémon personnalisé</h1>
			<p>Ce Pokémon sera enregistré dans le stockage local de ce navigateur.</p>
			<form className="add-pokemon-form" onSubmit={handleSubmit}>
				<label>
					Nom
					<input name="name" type="text" maxLength="40" required />
				</label>
				<label>
					URL de l’image (facultatif)
					<input name="image" type="url" placeholder="https://…" />
				</label>
				<div className="add-pokemon-form-row">
					<label>
						Taille (m)
						<input name="height" type="number" min="0.1" max="100" step="0.1" defaultValue="1" required />
					</label>
					<label>
						Poids (kg)
						<input name="weight" type="number" min="0.1" max="10000" step="0.1" defaultValue="10" required />
					</label>
				</div>
				<label>
					Types (séparés par des virgules)
					<input name="types" type="text" placeholder="fire, flying" />
				</label>
				<label>
					Capacités (séparées par des virgules)
					<input name="abilities" type="text" placeholder="intimidate, sturdy" />
				</label>
				<div className="add-pokemon-stats">
					<h2>Statistiques de base</h2>
					{[
						['hp', 'PV'],
						['attack', 'Attaque'],
						['defense', 'Défense'],
						['specialAttack', 'Attaque spéciale'],
						['specialDefense', 'Défense spéciale'],
						['speed', 'Vitesse'],
					].map(([field, label]) => (
						<label key={field}>
							{label}
							<input name={field} type="number" min="0" max="255" defaultValue="50" required />
						</label>
					))}
				</div>
				<label>
					Attaques (séparées par des virgules)
					<textarea name="moves" rows="3" placeholder="charge, rugissement" />
				</label>
				{error && <p className="add-pokemon-error" role="alert">{error}</p>}
				<button type="submit">Enregistrer le Pokémon</button>
			</form>
		</section>
	);
}

export default AddPoke;
