import './App.css'
import Home from './pages/Home.jsx';
import PokeDetails from './pages/PokeDetails.jsx';
import AddPoke from './pages/AddPoke.jsx';
import { NavLink, Route, Routes } from 'react-router-dom';

function App() {
	return (
		<>
			<header className="site-header">
				<nav className="site-nav" aria-label="Navigation principale">
					<NavLink to="/" end className={({ isActive }) => isActive ? 'site-nav-link active' : 'site-nav-link'}>
						Accueil
					</NavLink>
					<NavLink to="/add-pokemon" className={({ isActive }) => isActive ? 'site-nav-link active' : 'site-nav-link'}>
						Ajouter un Pokémon
					</NavLink>
				</nav>
			</header>
			<main>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/poke/:id" element={<PokeDetails />} />
					<Route path="/custom/:id" element={<PokeDetails custom />} />
					<Route path="/add-pokemon" element={<AddPoke />} />
				</Routes>
			</main>
		</>
	);
}

export default App
