import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
async function fetchData() {
    try {
      const [projRes, notifRes] = await Promise.all([
        api.get("/projects"),
        api.get("/notifications"),
      ]);
      setProjects(projRes.data);
      setNotifications(notifRes.data.filter(n => !n.is_read));
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function createProject(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post("/projects", newProject);
      setProjects([...projects, res.data]);
      setNewProject({ name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    setProjects(projects.filter(p => p.id !== id));
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-indigo-600">APIKeyManager</h1>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {notifications.length} alerts
            </span>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm">
                ⚠️ {n.message}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + New Project
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">New Project</h3>
            <form onSubmit={createProject} className="space-y-3">
              <input
                type="text"
                placeholder="Project name"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-sm">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex justify-between items-center hover:border-indigo-300 transition"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{p.description || "No description"}</p>
                  <p className="text-xs text-gray-400 mt-1">Created {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${p.id}`}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm px-3 py-1.5 rounded-lg transition"
                  >
                    Manage →
                  </Link>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-500 text-sm px-3 py-1.5 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}