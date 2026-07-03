import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "./Avatar";
import { PenIcon } from "./Icons";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">c</span>
          conduit
        </Link>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          {user ? (
            <>
              <NavLink to="/settings" className="nav-link">
                Settings
              </NavLink>
              <button className="link-button" onClick={handleLogout}>
                Sign out
              </button>
              <NavLink to={`/profile/${user.username}`} className="nav-user">
                <Avatar username={user.username} image={user.image} size="sm" />
                {user.username}
              </NavLink>
              <Link to="/editor" className="btn btn-primary btn-sm nav-cta">
                <PenIcon />
                Write
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Sign in
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm nav-cta">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
