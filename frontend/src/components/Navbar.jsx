import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ projectName }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-indigo-600 font-bold text-lg">APIKeyManager</Link>
        {projectName && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{projectName}</span>
          </>
        )}
      </div>
      <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 transition">
        Logout
      </button>
    </nav>
  );
}