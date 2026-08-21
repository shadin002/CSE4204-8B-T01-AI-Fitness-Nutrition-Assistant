import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="public-nav">
      <Link to="/" className="plain-link" onClick={close}><Logo /></Link>
      <button className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className={open ? 'public-nav-links open' : 'public-nav-links'}>
        <nav>
          <NavLink to="/" onClick={close}>Home</NavLink>
          <a href="/#features" onClick={close}>Features</a>
          <NavLink to="/login" onClick={close}>Login</NavLink>
        </nav>
        <Link className="btn btn-primary nav-register" to="/register" onClick={close}>Register</Link>
      </div>
    </header>
  );
}
