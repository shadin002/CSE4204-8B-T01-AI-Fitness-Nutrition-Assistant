import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Navbar() {
  return (
    <header className="public-nav">
      <Link to="/" className="plain-link">
        <Logo />
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        <a href="/#features">Features</a>
        <NavLink to="/login">Login</NavLink>
      </nav>
      <Link className="btn btn-primary nav-register" to="/register">
        Register
      </Link>
    </header>
  );
}
