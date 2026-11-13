// Functional tests: render the whole application (router + global state + pages)
// and drive it like a user would. Only the network layer is mocked.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import api, { fetchPokemon, fetchTypeDetails } from '../services/api.js';
import CustomPokemonProvider from '../state/CustomPokemonProvider.jsx';

vi.mock('../services/api.js', () => ({
	default: { get: vi.fn() },
	fetchPokemon: vi.fn(),
	fetchTypeDetails: vi.fn(),
}));

const POKEDEX = {
	results: [
		{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
		{ name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
		{ name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' },
	],
};

function renderApp(path = '/') {
	render(
		<MemoryRouter initialEntries={[path]}>
			<CustomPokemonProvider>
				<App />
			</CustomPokemonProvider>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	vi.mocked(fetchPokemon).mockReset().mockResolvedValue(POKEDEX);
	vi.mocked(fetchTypeDetails).mockReset().mockResolvedValue({ sprites: {} });
	vi.mocked(api.get).mockReset().mockResolvedValue({
		data: { types: [{ type: { name: 'normal' } }], height: 7, weight: 69 },
	});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Pokédex (functional)', () => {
	it('lets a user create a Pokémon and then find it in the Pokédex', async () => {
		const user = userEvent.setup();
		renderApp('/');
		expect(await screen.findByRole('heading', { name: 'bulbasaur' })).toBeInTheDocument();

		await user.click(screen.getByRole('link', { name: 'Ajouter un Pokémon' }));
		await user.type(screen.getByLabelText('Nom'), 'flamby');
		await user.type(screen.getByLabelText(/^Types/), 'fire, flying');
		await user.click(screen.getByRole('button', { name: 'Enregistrer le Pokémon' }));

		// Back on the home page, the new Pokémon is listed next to the API ones.
		expect(await screen.findByRole('heading', { name: 'flamby' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'bulbasaur' })).toBeInTheDocument();
		expect(screen.getByText('Custom')).toBeInTheDocument();
		// ...and it was persisted, so it survives a page reload.
		expect(localStorage.getItem('pokedex.customPokemon.v1')).toContain('flamby');
	});

	it('lets a user search the Pokédex by name', async () => {
		const user = userEvent.setup();
		renderApp('/');
		await screen.findByRole('heading', { name: 'bulbasaur' });

		await user.click(screen.getByRole('button', { name: 'Rechercher un Pokémon' }));
		await user.type(screen.getByLabelText('Rechercher un Pokémon par nom'), 'char');

		expect(await screen.findByText('1 résultat')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'charmander' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'bulbasaur' })).not.toBeInTheDocument();
	});

	it('opens the detail page of a custom Pokémon from its card', async () => {
		const user = userEvent.setup();
		localStorage.setItem('pokedex.customPokemon.v1', JSON.stringify([{
			id: 'abc',
			isCustom: true,
			name: 'flamby',
			image: '',
			height: 12,
			weight: 34,
			types: ['fire'],
			abilities: [],
			moves: [],
			stats: { hp: 50 },
		}]));
		renderApp('/');

		await user.click(await screen.findByRole('link', { name: /flamby/ }));

		expect(await screen.findByRole('heading', { level: 1, name: 'flamby' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Retour au Pokédex/ })).toBeInTheDocument();
	});

	it('tells the user when the Pokédex cannot be loaded', async () => {
		vi.mocked(fetchPokemon).mockRejectedValue(new Error('Network Error'));
		renderApp('/');

		expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger le Pokédex.');
	});
});
