"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { formatDateToReadable } from "../lib/dateFormate";
import {
  FolderOpen,
  Calendar,
  User,
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      let res;

      if (user?.role === "admin" || user?.role === "project_manager") {
        res = await api.get("/projects/allproject");
        console.log("Admin projects:", res.data.data);
        setProjects(res.data.data || []);
      } else if (user?.role === "user") {
        res = await api.get(`/assignProject/user/${user.id}`);
        // const assigned = res.data.data || [];
        // const userProjects = assigned.map((item) => item.project);
        setProjects(res.data.data || []);
      } else {
        throw new Error("Invalid user data");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects();
    }
  }, [authLoading, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FolderOpen className="w-8 h-8 text-purple-700" />
                </div>
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === "admin"
                  ? "Manage all projects and view comprehensive reports"
                  : "Access your assigned projects and track your progress"}
              </p>
            </div>

            {/* User Info Card */}
            {user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                      {projects.length > 0 && (
                        <span className="text-gray-500 text-sm">
                          {projects.length}{" "}
                          {projects.length === 1 ? "project" : "projects"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {/* Loading State */}
          {(loading || authLoading) && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-center text-gray-600 text-lg">
                Loading your projects...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-800 font-semibold text-lg">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Projects Available
              </h3>
              <p className="text-gray-600 mb-6">
                {user?.role === "admin"
                  ? "Start by creating your first project to begin managing timesheets."
                  : "No projects have been assigned to you yet. Contact your administrator."}
              </p>
              {user?.role === "admin" && (
                <Link
                  href="/projects/create"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Link>
              )}
            </div>
          )}

          {/* Projects Grid */}
          {!loading && !error && projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.role === "admin"
                    ? "All Projects"
                    : "Your Assigned Projects"}
                </h2>
                <span className="text-gray-500 text-sm">
                  {projects.length}{" "}
                  {projects.length === 1 ? "project" : "projects"} found
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((data) => (
                  // console.log("Project data:", data),
                  <Link
                    key={data._id}
                    href={`/projects/${data.project?._id}`}
                    className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {/* Top accent */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-t-xl"></div>

                    {/* Project Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                        <FolderOpen className="w-5 h-5 text-purple-700" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Project Content */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 capitalize">
                        {data.project?.name}
                      </h3>

                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {data.project?.description ||
                          "No description available"}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">
                          Created{" "}
                          {data.project?.createdAt
                            ? formatDateToReadable(data.project?.createdAt)
                            : "N/A"}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                        <span className="text-xs text-purple-600 font-medium group-hover:text-purple-700">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
