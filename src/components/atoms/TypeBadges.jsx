import { useEffect, useState } from 'react';
import { fetchTypeDetails } from '../../services/api.js';

function findTypeIcon(value) {
	if (!value || typeof value !== 'object') return null;
	if (typeof value.name_icon === 'string') return value.name_icon;

	for (const nestedValue of Object.values(value)) {
		const icon = findTypeIcon(nestedValue);
		if (icon) return icon;
	}

	return null;
}

function TypeBadges({ types }) {
	const typeSignature = types
		.map(type => typeof type === 'string' ? type : type.type.name)
		.join('|');
	const [icons, setIcons] = useState({});

	useEffect(() => {
		let isMounted = true;
		const typeNames = typeSignature ? typeSignature.split('|') : [];

		Promise.all(typeNames.map(async name => {
			try {
				const details = await fetchTypeDetails(name);
				return [name, findTypeIcon(details.sprites)];
			} catch (error) {
				console.error(`Erreur lors du chargement de l’icône du type ${name} : `, error);
				return [name, null];
			}
		})).then(results => {
			if (isMounted) setIcons(Object.fromEntries(results));
		});

		return () => {
			isMounted = false;
		};
	}, [typeSignature]);

	return (
		<ul className="pokemon-card-types" aria-label="Types">
			{typeSignature.split('|').filter(Boolean).map(name => (
				<li key={name} className="pokemon-type-icon" title={name.replaceAll('-', ' ')}>
					{icons[name]
						? <img src={icons[name]} alt={name.replaceAll('-', ' ')} />
						: <span>{name.replaceAll('-', ' ')}</span>}
				</li>
			))}
		</ul>
	);
}

export default TypeBadges;
