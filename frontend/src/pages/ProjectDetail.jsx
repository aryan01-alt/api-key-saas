import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newKey, setNewKey] = useState({ name: "", rate_limit: 100, expires_in_days: "" });
  const [showForm, setShowForm] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");

  async function fetchData() {
    try {
      const [keysRes, analyticsRes] = await Promise.all([
        api.get(`/projects/${id}/keys`),
        api.get(`/projects/${id}/analytics`),
      ]);
      setKeys(keysRes.data);
      setAnalytics(analyticsRes.data);
      setProjectName(analyticsRes.data.project);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id]);
  async function createKey(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: newKey.name,
        rate_limit: parseInt(newKey.rate_limit),
        ...(newKey.expires_in_days && { expires_in_days: parseInt(newKey.expires_in_days) }),
      };
      const res = await api.post(`/projects/${id}/keys`, payload);
      setCreatedKey(res.data.raw_key);
      setKeys([...keys, res.data]);
      setNewKey({ name: "", rate_limit: 100, expires_in_days: "" });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId) {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    await api.delete(`/projects/${id}/keys/${keyId}`);
    setKeys(keys.map(k => k.id === keyId ? { ...k, is_active: false } : k));
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
        <div className="flex items-center gap-3">
          <Link to="/" className="text-indigo-600 font-bold">APIKeyManager</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">{projectName}</span>
        </div>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">← Back</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.total_requests}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Allowed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{analytics.allowed_requests}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Blocked</p>
              <p className="text-3xl font-bold text-red-500 mt-1">{analytics.blocked_requests}</p>
            </div>
          </div>
        )}

        {/* API Keys */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + New Key
            </button>
          </div>

          {/* Raw key shown once */}
          {createdKey && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-green-700 mb-1">⚠️ Copy your key now — it won't be shown again!</p>
              <code className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded-lg block break-all">{createdKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey); alert("Copied!"); }}
                className="mt-2 text-xs text-green-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          )}

          {/* Create Key Form */}
          {showForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">New API Key</h3>
              <form onSubmit={createKey} className="space-y-3">
                <input
                  type="text"
                  placeholder="Key name (e.g. prod-key)"
                  value={newKey.name}
                  onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Rate limit (requests per minute)"
                  value={newKey.rate_limit}
                  onChange={e => setNewKey({ ...newKey, rate_limit: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Expires in days (leave blank = never)"
                  value={newKey.expires_in_days}
                  onChange={e => setNewKey({ ...newKey, expires_in_days: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Key"}
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

          {/* Keys List */}
          {keys.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 text-sm">No API keys yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{k.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {k.is_active ? "active" : "revoked"}
                      </span>
                    </div>
                    <code className="text-xs text-gray-500 mt-1 block">{k.key_prefix}••••••••</code>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Limit: {k.rate_limit} req/min</span>
                      <span>Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : "Never"}</span>
                      <span>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</span>
                    </div>
                  </div>
                  {k.is_active && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-500 text-sm px-3 py-1.5 rounded-lg transition"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}