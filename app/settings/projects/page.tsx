// app/settings/projects/page.tsx

"use client";

import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAnimationStore, Project } from '@/app/lib/useAnimationStore';
import { resolveIpfsUrl } from '@/app/lib/utils';

interface Project {
  id: string; 
  name: string;
  description: string;
  mediaPreview: string | null; 
  tags: string[];
  isFeatured: boolean; 
  // Nanti kita akan tambahkan:
  // mediaIpfsUrl: string | null;
  // projectUrl: string | null;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export default function ProjectsSettingsPage() {
  const { profile, saveProfile, isHydrated } = useAnimationStore();
  const projects = profile?.projects || [];
  
  const setProjects = (newProjects: Project[] | ((prev: Project[]) => Project[])) => {
    let finalProjects: Project[];
    if (typeof newProjects === 'function') {
      finalProjects = newProjects(projects);
    } else {
      finalProjects = newProjects;
    }
    // Ganti saveProfile dengan updateGlobalState (nama baru di langkah berikutnya)
    // Untuk saat ini, kita anggap saveProfile hanya update state
    saveProfile({ projects: finalProjects });
  };
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ketika komponen di-unmount atau mediaPreview berubah,
    // kita hapus URL 'blob:' yang lama dari memori browser
    return () => {
      if (mediaPreview && mediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  // Pisahkan proyek unggulan dan proyek lainnya
  const featuredProjects = projects.filter(p => p.isFeatured);
  const otherProjects = projects.filter(p => !p.isFeatured);

  // Handlers untuk Form 
  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }

    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaPreview(URL.createObjectURL(file));
        setMediaFile(file); 
      } else {
        alert("Silakan pilih file gambar atau video.");
      }
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setTags([]);
    setCurrentTag('');
    setProjectUrl('');
    setMediaFile(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleSaveProject = (e: FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Nama proyek tidak boleh kosong.");

    // Ambil file mentah dari proyek yang sedang diedit (jika ada)
    const existingProject = editingId ? projects.find(p => p.id === editingId) : null;
    
    const newProject: Project = {
      id: editingId || `proj_${Date.now()}`,
      name,
      description,
      mediaPreview,
      tags,
      projectUrl,
      isFeatured: existingProject?.isFeatured || false,
      pendingMediaFile: mediaFile || existingProject?.pendingMediaFile || null,
      mediaIpfsUrl: existingProject?.mediaIpfsUrl || null 
    };
    
    if (mediaFile) newProject.mediaIpfsUrl = null;

    if (editingId) {
      setProjects(projects.map(p => (p.id === editingId ? newProject : p)));
    } else {
      setProjects([...projects, newProject]);
    }
    
    resetForm();
    alert("Proyek disimpan (secara lokal).");
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description);
    setMediaPreview(resolveIpfsUrl(project.mediaIpfsUrl) || project.mediaPreview);
    setTags(project.tags);
    setProjectUrl(project.projectUrl || '');
    setMediaFile(project.pendingMediaFile || null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus proyek ini?")) {
      setProjects(projects.filter(p => p.id !== id));
      // TODO: Panggil fungsi saveDashboard() global di sini nanti
    }
  };

  const handleToggleFeatured = (id: string) => {
    const project = projects.find(p => p.id === id)!;
    
    // Batasi 3 proyek unggulan
    if (!project.isFeatured && featuredProjects.length >= 3) {
      alert("Anda hanya dapat memiliki 3 proyek unggulan.");
      return;
    }
    
    setProjects(projects.map(p => 
      p.id === id ? { ...p, isFeatured: !p.isFeatured } : p
    ));
    // TODO: Panggil fungsi saveDashboard() global di sini nanti
  };

  // 4. Tambahkan Pengecekan 'isHydrated'
  if (!isHydrated) {
    return <div className="text-zinc-500">Memuat data proyek...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* --- Bagian 1: Form Proyek --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          {editingId ? "Edit Proyek" : "Tambah Proyek Baru"}
        </h2>
        <form onSubmit={handleSaveProject} className="flex flex-col gap-4 p-4 rounded-lg border border-zinc-200">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nama Proyek</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama proyek Anda"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat proyek..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Foto/Video Proyek</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-24 h-16 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden">
                {mediaPreview ? (
                  mediaPreview.startsWith('data:image/') || mediaPreview.startsWith('blob:image/') ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaPreview} className="w-full h-full object-cover" autoPlay muted loop />
                  )
                ) : (
                  <span className="text-xs text-zinc-400">Preview</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
              >
                Upload Media
              </button>
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaChange}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Link Proyek (Situs/YouTube)</label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://github.com/anda atau https://youtube.com/..."
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Tags</label>
            <div className="flex flex-wrap items-center gap-2 mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-sky-600 hover:text-sky-800">
                    <XIcon />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Ketik tag lalu 'Enter'"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {editingId ? "Simpan Perubahan" : "Simpan Proyek"}
            </button>
          </div>
        </form>
      </section>

      {/* --- Bagian 2: Daftar Proyek --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Proyek Unggulan (Maks. 3)
        </h2>
        <div className="flex flex-col gap-3">
          {featuredProjects.length > 0 ? (
            featuredProjects.map(proj => (
              <ProjectListItem 
                key={proj.id} 
                project={proj} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onToggleFeatured={handleToggleFeatured} 
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Belum ada proyek unggulan. Klik ikon bintang pada proyek di bawah.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Proyek Lainnya
        </h2>
        <div className="flex flex-col gap-3">
          {otherProjects.length > 0 ? (
            otherProjects.map(proj => (
              <ProjectListItem 
                key={proj.id} 
                project={proj} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onToggleFeatured={handleToggleFeatured} 
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Belum ada proyek yang ditambahkan.</p>
          )}
        </div>
      </section>
    </div>
  );
}

// --- Komponen Item Proyek (untuk daftar) ---
const ProjectListItem = ({ 
  project, 
  onEdit, 
  onDelete, 
  onToggleFeatured 
} : { 
  project: Project,
  onEdit: (project: Project) => void,
  onDelete: (id: string) => void,
  onToggleFeatured: (id: string) => void
}) => {
  return (
    <div className="flex items-center gap-3 w-full rounded-lg border border-zinc-200 p-3">
      <div className="w-16 h-10 rounded-md border border-zinc-200 bg-zinc-50 flex-shrink-0 overflow-hidden">
        {project.mediaPreview ? (
          project.mediaPreview.startsWith('data:image/') || project.mediaPreview.startsWith('blob:image/') ? (
            <img src={project.mediaPreview} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <video src={project.mediaPreview} className="w-full h-full object-cover" autoPlay muted loop />
          )
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{project.name}</p>
        <p className="text-xs text-zinc-500 truncate">{project.description || "Tidak ada deskripsi"}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-3">
        {project.tags.slice(0, 2).map(tag => (
          <span key={tag} className="hidden md:inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
            {tag}
          </span>
        ))}
        <button
          onClick={() => onToggleFeatured(project.id)}
          className={`text-zinc-400 hover:text-yellow-500 ${project.isFeatured ? 'text-yellow-500' : ''}`}
          title={project.isFeatured ? "Batal Unggulkan" : "Jadikan Unggulan"}
        >
          <StarIcon filled={project.isFeatured} />
        </button>
        <button onClick={() => onEdit(project)} className="text-zinc-500 hover:text-zinc-900" title="Edit">
          <EditIcon />
        </button>
        <button onClick={() => onDelete(project.id)} className="text-zinc-500 hover:text-red-600" title="Hapus">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};