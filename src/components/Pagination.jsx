import { useState } from 'react';

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  onSearchChange,
  searchQuery,
  searchResultCount,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const firstVisiblePage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  const visiblePages = Array.from(
	{ length: Math.min(totalPages, 5) },
	(_, index) => firstVisiblePage + index,
  );

  function handlePageChange(page) {
	if (page >= 0 && page < totalPages && page !== currentPage) {
	  onPageChange(page);
	}
  }

  return (
	<nav className="pagination" aria-label="Pagination du Pokédex">
	  {isSearchOpen ? (
		<div className="pagination-search">
		  <label className="visually-hidden" htmlFor="pokedex-search">Rechercher un Pokémon par nom</label>
		  <input
			autoFocus
			id="pokedex-search"
			type="search"
			value={searchQuery}
			placeholder="Rechercher un Pokémon…"
			onChange={event => onSearchChange(event.target.value)}
		  />
		  <span className="pagination-search-count" aria-live="polite">
			{searchResultCount} résultat{searchResultCount === 1 ? '' : 's'}
		  </span>
		  {totalPages > 1 && (
			<div className="pagination-search-pages">
			  <button
				type="button"
				className="pagination-step"
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 0}
				aria-label="Page de résultats précédente"
			  >
				‹
			  </button>
			  <span>{currentPage + 1}/{totalPages}</span>
			  <button
				type="button"
				className="pagination-step"
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages - 1}
				aria-label="Page de résultats suivante"
			  >
				›
			  </button>
			</div>
		  )}
		  <button
			type="button"
			className="pagination-search-toggle"
			onClick={() => {
			  onSearchChange('');
			  setIsSearchOpen(false);
			}}
			aria-label="Fermer la recherche"
			title="Fermer la recherche"
		  >
			×
		  </button>
		</div>
	  ) : (
		<>
		  {totalPages > 1 && (
			<>
			  <button
				type="button"
				className="pagination-step"
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 0}
			  >
				Précédent
			  </button>
			  {firstVisiblePage > 0 && (
				<>
				  <button type="button" className="pagination-page" onClick={() => handlePageChange(0)} aria-label="Aller à la page 1">
					1
				  </button>
				  {firstVisiblePage > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
				</>
			  )}
			  {visiblePages.map(page => (
				<button
				  type="button"
				  key={page}
				  className="pagination-page"
				  onClick={() => handlePageChange(page)}
				  aria-label={`Page ${page + 1}`}
				  aria-current={page === currentPage ? 'page' : undefined}
				>
				  {page + 1}
				</button>
			  ))}
			  {firstVisiblePage + visiblePages.length < totalPages && (
				<>
				  {firstVisiblePage + visiblePages.length < totalPages - 1 && (
					<span className="pagination-ellipsis" aria-hidden="true">…</span>
				  )}
				  <button
					type="button"
					className="pagination-page"
					onClick={() => handlePageChange(totalPages - 1)}
					aria-label={`Aller à la page ${totalPages}`}
				  >
					{totalPages}
				  </button>
				</>
			  )}
			  <button
				type="button"
				className="pagination-step"
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages - 1}
			  >
				Suivant
			  </button>
			</>
		  )}
		  <button
			type="button"
			className="pagination-search-toggle"
			onClick={() => setIsSearchOpen(true)}
			aria-label="Rechercher un Pokémon"
			title="Rechercher un Pokémon"
		  >
			<svg viewBox="0 0 24 24" aria-hidden="true">
			  <circle cx="10.8" cy="10.8" r="6.3" />
			  <path d="m15.5 15.5 4.2 4.2" />
			</svg>
		  </button>
		</>
	  )}
	</nav>
  );
}

export default Pagination;