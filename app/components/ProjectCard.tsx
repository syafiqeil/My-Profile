// app/components/ProjectCard.tsx

"use client";

import { useState } from 'react';
import { useAnimationStore, Project } from '../lib/SessionProvider'; 
import { ProjectModal } from './ProjectModal';
import { resolveIpfsUrl } from '../lib/utils';

const ProjectIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-zinc-500"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

// --- Komponen Item Proyek (untuk daftar scrollable) ---
const ProjectListItem = ({ project, onClick }: { project: Project, onClick: () => void }) => {
  const mediaUrl = resolveIpfsUrl(project.mediaIpfsUrl) || project.mediaPreview;

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-zinc-50 transition-colors group text-left"
    >
      <div className="w-16 h-10 rounded-md border border-zinc-200 bg-zinc-50 flex-shrink-0 overflow-hidden">
        {mediaUrl ? ( 
          mediaUrl.startsWith('data:image/') || mediaUrl.startsWith('blob:image/') ? (
            <img src={mediaUrl} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <ProjectIcon />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{project.name}</p>
        <p className="text-xs text-zinc-500 truncate">{project.description || "Tidak ada deskripsi"}</p>
      </div>
    </button>
  );
};

// --- Komponen Proyek Unggulan (untuk grid) ---
const FeaturedProjectItem = ({ project, onClick }: { project: Project, onClick: () => void }) => {
  const mediaUrl = resolveIpfsUrl(project.mediaIpfsUrl) || project.mediaPreview;

  return (
    <button 
      onClick={onClick}
      className="rounded-lg border border-zinc-200 overflow-hidden flex flex-col group transition-all hover:shadow-md text-left"
    >
      {/* Media */}
      <div className="w-full h-32 bg-zinc-100 flex items-center justify-center overflow-hidden">
        {mediaUrl ? ( 
          mediaUrl.startsWith('data:image/') || mediaUrl.startsWith('blob:image/') ? (
            <img src={mediaUrl} alt={project.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <video src={mediaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" autoPlay muted loop />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <ProjectIcon />
          </div>
        )}
      </div>
      {/* Konten */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-zinc-800 text-base">{project.name}</h3>
        <p className="text-sm text-zinc-500 mt-1 flex-1">{project.description || "Tidak ada deskripsi"}</p>
        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};


// --- Komponen Komponen Utama ProjectCard ---
const ProjectCard = () => {
  const { profile, isHydrated } = useAnimationStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  if (!isHydrated || !profile) {
    return <StaticProjectCard />;
  }

  const allProjects = profile.projects || [];
  const featuredProjects = allProjects.filter(p => p.isFeatured);
  const otherProjects = allProjects.filter(p => !p.isFeatured);

  return (
    <>
      {/* Render Modal di sini. Ia tersembunyi secara default */}
      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />

      {/* Ini adalah kartu yang sudah ada */}
      <div className="rounded-xl bg-white p-6 shadow-sm md:row-span-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <ProjectIcon />
          <h2 className="text-xl font-semibold text-zinc-900">
            What I built
          </h2>
        </div>

        {allProjects.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-zinc-500">Belum ada proyek. Silakan tambahkan di halaman pengaturan.</p>
          </div>
        )}

        {featuredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-shrink-0">
            {featuredProjects.map(proj => (
              <FeaturedProjectItem 
                key={proj.id} 
                project={proj} 
                onClick={() => setSelectedProject(proj)} 
              />
            ))}
          </div>
        )}

        {otherProjects.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0"> 
            <h3 className="text-sm font-medium text-zinc-600 mb-2 border-t pt-4 flex-shrink-0">
              Proyek Lainnya
            </h3>
            <div className="flex-1 overflow-y-auto max-h-48 pr-2"> 
              <div className="flex flex-col divide-y divide-zinc-100">
                {otherProjects.map(proj => (
                  <ProjectListItem 
                    key={proj.id} 
                    project={proj} 
                    onClick={() => setSelectedProject(proj)} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

// --- Komponen Versi Statis (Fallback) ---
const StaticProjectCard = () => (
  <div className="rounded-xl bg-white p-6 shadow-sm md:row-span-1">
    <div className="flex items-center gap-3 mb-4">
      <ProjectIcon />
      <h2 className="text-xl font-semibold text-zinc-900">
        What I built
      </h2>
    </div>
    <div className="rounded-lg border border-zinc-200 p-4">
      <h3 className="font-semibold text-zinc-800">
        Dasbor Portofolio Saya
      </h3>
      <p className="text-sm text-zinc-500 mt-1">
        Membangun ulang situs pribadi saya dengan tata letak dasbor baru
        menggunakan Next.js dan Tailwind CSS.
      </p>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
          Next.js
        </span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
          Tailwind
        </span>
      </div>
    </div>
  </div>
);

export default ProjectCard;