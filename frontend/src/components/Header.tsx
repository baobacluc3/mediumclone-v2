import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
          conduit
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          {user ? (
            <>
              <NavLink to="/editor">New Article</NavLink>
              <NavLink to="/settings">Settings</NavLink>
              <NavLink to={`/profile/${user.username}`}>
                {user.username}
              </NavLink>
              <button className="link-button" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
