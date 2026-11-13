import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { fetchTypeDetails } from '../services/api.js';
import Pokecard from '../components/molecules/Pokecard.jsx';

// Replace the real API module so no test ever hits the network.
vi.mock('../services/api.js', () => ({
	default: { get: vi.fn() },
	fetchTypeDetails: vi.fn(),
}));

function renderCard(pokemon) {
	render(<MemoryRouter><Pokecard pokemon={pokemon} /></MemoryRouter>);
}

beforeEach(() => {
	vi.mocked(api.get).mockReset();
	vi.mocked(fetchTypeDetails).mockReset().mockResolvedValue({ sprites: {} });
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Pokecard', () => {
	it('renders a custom Pokémon without calling the API', async () => {
		renderCard({
			isCustom: true,
			id: 'abc',
			name: 'flamby',
			image: 'data:image/png;base64,xyz',
			types: ['fire'],
			height: 12,
			weight: 34,
		});

		expect(screen.getByText('Custom')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'flamby' })).toBeInTheDocument();
		expect(screen.getByText(/Taille 1\.2 m/)).toBeInTheDocument();
		expect(screen.getByText(/Poids 3\.4 kg/)).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute('href', '/custom/abc');
		expect(await screen.findByText('fire')).toBeInTheDocument();
		expect(api.get).not.toHaveBeenCalled();
	});

	it('loads details for an API Pokémon and shows its number', async () => {
		vi.mocked(api.get).mockResolvedValue({
			data: { types: [{ type: { name: 'electric' } }], height: 4, weight: 60 },
		});

		renderCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' });

		expect(screen.getByText('#025')).toBeInTheDocument();
		expect(screen.getByText('Chargement des détails…')).toBeInTheDocument();
		expect(await screen.findByText(/Taille 0\.4 m/)).toBeInTheDocument();
		expect(screen.getByText(/Poids 6\.0 kg/)).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute('href', '/poke/25');
	});

	it('shows a fallback message when the details request fails', async () => {
		vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

		renderCard({ name: 'mew', url: 'https://pokeapi.co/api/v2/pokemon/151/' });

		expect(await screen.findByText('Types indisponibles')).toBeInTheDocument();
	});
});
