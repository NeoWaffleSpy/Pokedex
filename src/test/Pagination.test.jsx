import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Pagination from '../components/molecules/Pagination.jsx';

function renderPagination(props = {}) {
	const handlers = { onPageChange: vi.fn(), onSearchChange: vi.fn() };
	render(
		<Pagination
			currentPage={0}
			totalPages={10}
			searchQuery=""
			searchResultCount={0}
			{...handlers}
			{...props}
		/>,
	);
	return handlers;
}

describe('Pagination', () => {
	it('shows a window of 5 pages plus a shortcut to the last one', () => {
		renderPagination();

		for (const page of [1, 2, 3, 4, 5])
			expect(screen.getByRole('button', { name: `Page ${page}` })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Aller à la page 10' })).toBeInTheDocument();
	});

	it('marks the current page', () => {
		renderPagination({ currentPage: 3 });
		expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');
	});

	it('disables "Précédent" on the first page and goes forward with "Suivant"', async () => {
		const { onPageChange } = renderPagination();

		expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
		await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
		expect(onPageChange).toHaveBeenCalledWith(1);
	});

	it('does nothing when clicking the page already shown', async () => {
		const { onPageChange } = renderPagination({ currentPage: 2 });
		await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('hides page buttons when there is a single page', () => {
		renderPagination({ totalPages: 1 });
		expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument();
	});

	it('opens the search field and reports what the user types', async () => {
		const { onSearchChange } = renderPagination({ searchResultCount: 1 });

		await userEvent.click(screen.getByRole('button', { name: 'Rechercher un Pokémon' }));
		await userEvent.type(screen.getByLabelText('Rechercher un Pokémon par nom'), 'p');

		expect(onSearchChange).toHaveBeenCalledWith('p');
		expect(screen.getByText('1 résultat')).toBeInTheDocument();
	});

	it('clears the search when it is closed', async () => {
		const { onSearchChange } = renderPagination();

		await userEvent.click(screen.getByRole('button', { name: 'Rechercher un Pokémon' }));
		await userEvent.click(screen.getByRole('button', { name: 'Fermer la recherche' }));

		expect(onSearchChange).toHaveBeenCalledWith('');
		expect(screen.queryByLabelText('Rechercher un Pokémon par nom')).not.toBeInTheDocument();
	});
});
