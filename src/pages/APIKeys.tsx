import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Clipboard,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const API_URL = "http://127.0.0.1:8000";


type APIKey = {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  revoked_at: string | null;
};


export default function APIKeys() {
  const { token } = useAuth();

  const [apiKeys, setApiKeys] =
    useState<APIKey[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [keyName, setKeyName] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [newKey, setNewKey] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [revokingId, setRevokingId] =
    useState<number | null>(null);


  // --------------------------------------------------
  // Load API keys
  // --------------------------------------------------

  const loadAPIKeys = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/api-keys/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load API keys: ${response.status}`
        );
      }

      const data: APIKey[] =
        await response.json();

      setApiKeys(data);
    } catch (requestError) {
      console.error(
        "Failed to load API keys:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load API keys."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadAPIKeys();
  }, [token]);


  // --------------------------------------------------
  // Create API key
  // --------------------------------------------------

  const createAPIKey = async () => {
    if (!token) {
      return;
    }

    const trimmedName = keyName.trim();

    if (!trimmedName) {
      setError("Please enter a name for the API key.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setCopied(false);

      const response = await fetch(
        `${API_URL}/api/api-keys/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create API key."
        );
      }

      setNewKey(data.key);

      setKeyName("");

      setShowCreateModal(false);

      await loadAPIKeys();
    } catch (requestError) {
      console.error(
        "Failed to create API key:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create API key."
      );
    } finally {
      setCreating(false);
    }
  };


  // --------------------------------------------------
  // Revoke API key
  // --------------------------------------------------

  const revokeAPIKey = async (
    apiKeyId: number
  ) => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevokingId(apiKeyId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/api-keys/${apiKeyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to revoke API key."
        );
      }

      await loadAPIKeys();
    } catch (requestError) {
      console.error(
        "Failed to revoke API key:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not revoke API key."
      );
    } finally {
      setRevokingId(null);
    }
  };


  // --------------------------------------------------
  // Copy API key
  // --------------------------------------------------

  const copyAPIKey = async () => {
    if (!newKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        newKey
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error(
        "Failed to copy API key:",
        copyError
      );
    }
  };


  // --------------------------------------------------
  // Close newly-created key
  // --------------------------------------------------

  const closeNewKey = () => {
    setNewKey("");
    setCopied(false);
  };


  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <KeyRound size={21} />
            </div>

            <div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                API Keys
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage keys for accessing NexaAI APIs.
              </p>

            </div>

          </div>

        </div>


        <div className="flex gap-2">

          <button
            type="button"
            onClick={() => void loadAPIKeys()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>


          <button
            type="button"
            onClick={() => {
              setError("");
              setKeyName("");
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />

            Create Key
          </button>

        </div>

      </div>


      {/* Error */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* Newly created key */}

      {newKey && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={20} />
            </div>


            <div className="min-w-0 flex-1">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="font-semibold text-emerald-950">
                    API key created successfully
                  </h2>

                  <p className="mt-1 text-sm text-emerald-800">
                    Copy this key now. For security, the complete key will not be shown again.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={closeNewKey}
                  className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
                >
                  <X size={18} />
                </button>

              </div>


              <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                <div className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3">

                  <code className="block break-all text-sm text-slate-800">
                    {newKey}
                  </code>

                </div>


                <button
                  type="button"
                  onClick={() => void copyAPIKey()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Clipboard size={16} />
                      Copy
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>

        </section>
      )}


      {/* Security notice */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck size={19} />
          </div>

          <div>

            <h2 className="font-semibold text-slate-950">
              Keep your API keys secure
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Never share your API keys publicly or commit them to GitHub.
              Store them securely in environment variables or a secret manager.
            </p>

          </div>

        </div>

      </section>


      {/* API keys */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="font-semibold text-slate-950">
            Your API Keys
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the keys associated with your NexaAI account.
          </p>

        </div>


        {loading ? (

          <div className="flex items-center justify-center px-6 py-16">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

              <p className="mt-3 text-sm text-slate-500">
                Loading API keys...
              </p>

            </div>

          </div>

        ) : apiKeys.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <KeyRound size={24} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-950">
              No API keys yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create an API key to start integrating NexaAI with your applications.
            </p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setKeyName("");
                setShowCreateModal(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Create your first key
            </button>

          </div>

        ) : (

          <div className="divide-y divide-slate-200">

            {apiKeys.map((apiKey) => {

              const isRevoked =
                apiKey.revoked_at !== null;

              return (
                <div
                  key={apiKey.id}
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >

                  <div className="flex min-w-0 items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <KeyRound size={18} />
                    </div>


                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-semibold text-slate-950">
                          {apiKey.name}
                        </h3>


                        <span
                          className={
                            isRevoked
                              ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                              : "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          }
                        >
                          {isRevoked
                            ? "Revoked"
                            : "Active"}
                        </span>

                      </div>


                      <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">

                        <code className="text-slate-600">
                          {apiKey.key_prefix}...
                        </code>

                        <span className="hidden text-slate-300 sm:block">
                          •
                        </span>

                        <span className="text-slate-400">
                          Created{" "}
                          {new Date(
                            apiKey.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>

                      </div>

                    </div>

                  </div>


                  {!isRevoked && (
                    <button
                      type="button"
                      onClick={() =>
                        void revokeAPIKey(
                          apiKey.id
                        )
                      }
                      disabled={
                        revokingId === apiKey.id
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />

                      {revokingId === apiKey.id
                        ? "Revoking..."
                        : "Revoke"}
                    </button>
                  )}

                </div>
              );
            })}

          </div>

        )}

      </section>


      {/* Create modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="font-semibold text-slate-950">
                  Create API Key
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Give your key a recognizable name.
                </p>

              </div>


              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

            </div>


            <div className="p-6">

              <label
                htmlFor="api-key-name"
                className="text-sm font-semibold text-slate-700"
              >
                Key name
              </label>

              <input
                id="api-key-name"
                type="text"
                value={keyName}
                onChange={(event) =>
                  setKeyName(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void createAPIKey();
                  }
                }}
                placeholder="e.g. My Development Key"
                maxLength={100}
                autoFocus
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Use a name that tells you where this key is being used.
              </p>


              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={() => void createAPIKey()}
                  disabled={
                    creating ||
                    !keyName.trim()
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {creating ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />

                      Create Key
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}