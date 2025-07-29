"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects/allproject");
        setProjects(res.data.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-brpx-4 py-8 sm:px-6 lg:px-16">
      {loading && (
        <p className="text-center text-gray-500 text-lg">Loading projects...</p>
      )}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="text-center text-gray-500 text-lg">
          No projects available.
        </p>
      )}

      {/* <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <Link
            key={project._id}
            href={`/projects/${project._id}`}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-blue-400"
          >
            <div>
              <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                {project.name}
              </h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
            </div>
            <div className="mt-auto">
              <p className="text-sm text-gray-400">
                Created by:{" "}
                <span className="font-medium">
                  {project.createdBy?.name || "Unknown"}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div> */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <Link
           key={project._id}
            href={`/projects/${project._id}`}
            className="relative bg-white block p-6 border border-gray-100 rounded-lg ml-2.5max-w-sm"
          >
            <span className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-purple-950 via-purple-400 to-purple-950"></span>

            <div className="my-4">
              <h2 className="text-black text-2xl font-bold pb-2 capitalize">{project.name}</h2>
              <p className="text-black-300 py-1">
               {project.description}
              </p>
               <p className="text-black-300 py-1 mt-3 text-sm">
               Created Date: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

          </Link>
        ))}
      </div>
    </div>
  );
}
