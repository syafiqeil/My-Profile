// app/components/ProjectModal.tsx

"use client";

import React from 'react';
import { Project } from '../lib/SessionProvider'; 

// Ikon X untuk menutup
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Ikon Link Eksternal
const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
  if (!project) return null;

  const isVideo = project.mediaPreview && (project.mediaPreview.startsWith('blob:video/') || project.mediaPreview.startsWith('data:video/'));

  return (
    // Lapisan Latar Belakang (Backdrop)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      {/* Konten Modal */}
      <div
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat diklik di dalam
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-zinc-500 hover:text-zinc-900 bg-white/50 rounded-full p-1"
          aria-label="Tutup"
        >
          <XIcon />
        </button>

        {/* Konten Media (Foto/Video) */}
        <div className="w-full h-64 md:h-96 bg-zinc-100">
          {project.mediaPreview ? (
            isVideo ? (
              <video
                src={project.mediaPreview}
                className="w-full h-full object-contain"
                autoPlay
                controls
                loop
                muted
              />
            ) : (
              <img
                src={project.mediaPreview}
                alt={project.name}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              (Tidak ada media)
            </div>
          )}
        </div>

        {/* Konten Teks */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-zinc-900">{project.name}</h2>
          
          {/* Tampilkan link jika ada */}
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-800"
            >
              Kunjungi Tautan <ExternalLinkIcon />
            </a>
          )}
          
          {/* Tampilkan deskripsi lengkap */}
          <p className="text-base text-zinc-600 mt-4 whitespace-pre-wrap">
            {project.description || "Tidak ada deskripsi."}
          </p>

          {/* Tampilkan tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* CSS untuk animasi fade-in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};