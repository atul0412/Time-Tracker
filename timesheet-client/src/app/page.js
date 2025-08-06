"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { formatDateToReadable } from "../lib/dateFormate";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); // Get loading
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      let res;

      if (user?.role === "admin") {
        res = await api.get("/projects/allproject");
        setProjects(res.data.data || []);
      } else if (user?.role === "user") {
        res = await api.get(`/assignProject/user/${user.id}`);
        const assigned = res.data.data || [];
        const userProjects = assigned.map((item) => item.project);
        setProjects(userProjects);
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
}, [authLoading, user]);

useEffect(() => {
  if (!authLoading && user) {
    fetchProjects();
  }
}, [authLoading, user]);


 return (
  <div className="bg-gradient-to-br px-4 py-8 sm:px-6 lg:px-16">
    {(loading || authLoading) && (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )}
    {error && <p className="text-center text-red-600 text-lg">{error}</p>}
    {!loading && !error && projects.length === 0 && (
      <p className="text-center text-gray-500 text-lg">
        No projects available.
      </p>
    )}

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <Link
          key={project._id}
          href={`/projects/${project._id}`}
          className="relative bg-white block p-6 border border-gray-100 rounded-lg ml-2.5 max-w-sm"
        >
          <span className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-purple-950 via-purple-400 to-purple-950"></span>

          <div className="my-4">
            <h2 className="text-black text-2xl font-bold pb-2 capitalize">
              {project.name}
            </h2>
            <p className="text-black-300 py-1">{project.description}</p>
            <p className="text-black-300 py-1 mt-3 font-semibold text-sm">
              Created Date:{" "}
              {project.createdAt
                ? formatDateToReadable(project.createdAt)
                : "N/A"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

}
