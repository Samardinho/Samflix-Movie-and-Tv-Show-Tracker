import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserEntries } from "../hooks/useUserEntries";
import { useState, useRef } from "react";
import { Loader } from "../components/common/Loader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

export function ProfilePage() {
  const { user, profile, logout, uploadProfilePicture, deleteProfilePicture } = useAuth();
  const { entries } = useUserEntries();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) {
    return null;
  }

  const createdAt = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "Unknown";

  const statusCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      await uploadProfilePicture(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeletePicture = async () => {
    setError("");
    setUploading(true);

    try {
      await deleteProfilePicture();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
          Profile
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 md:p-12 space-y-10 border border-gray-100 dark:border-gray-700">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-6 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt="Profile"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-blue-200 dark:border-blue-800 shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-blue-200 dark:border-blue-800 shadow-xl">
                <span className="text-5xl md:text-6xl font-bold text-white">
                  {profile.email?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-block">
                {uploading ? "Uploading..." : profile.profilePictureUrl ? "Change Picture" : "Upload Picture"}
              </span>
            </label>
            {profile.profilePictureUrl && (
              <button
                onClick={handleDeletePicture}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Picture
              </button>
            )}
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-md">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Upload a profile picture (JPG, PNG, or GIF, max 5MB)
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Email</h2>
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{profile.email ?? "N/A"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Member Since
            </h2>
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{createdAt}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wide">
            Watchlist Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/watchlist?status=plan"
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                {statusCounts.plan || 0}
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plan to Watch</div>
            </Link>
            <Link
              to="/watchlist?status=watching"
              className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                {statusCounts.watching || 0}
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Watching</div>
            </Link>
            <Link
              to="/watchlist?status=completed"
              className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                {statusCounts.completed || 0}
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completed</div>
            </Link>
            <Link
              to="/watchlist?status=dropped"
              className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2">
                {statusCounts.dropped || 0}
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dropped</div>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              Total: {entries.length} item{entries.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Logout
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeletePicture}
        title="Delete Profile Picture"
        message="Are you sure you want to delete your profile picture?"
        confirmText="Yes"
        cancelText="No"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Log Out"
        message="Are you sure you would like to log out?"
        confirmText="Yes"
        cancelText="No"
        confirmVariant="primary"
      />
    </div>
  );
}
