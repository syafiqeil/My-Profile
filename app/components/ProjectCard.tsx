// app/components/ProjectCard.tsx

"use client";

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

const ProjectCard = () => {
  return (
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
};

export default ProjectCard;