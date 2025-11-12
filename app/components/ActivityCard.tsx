// app/components/ActivityCard.tsx

"use client";

const ActivityIcon = () => (
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
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ActivityCard = () => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <ActivityIcon />
        <h2 className="text-xl font-semibold text-zinc-900">
          Activity
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kolom Blog */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-800">Blog</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Belum ada tulisan. Segera hadir!
          </p>
        </div>
        {/* Kolom Sertifikat */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-800">Sertifikat</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Belum ada sertifikat untuk ditampilkan.
          </p>
        </div>
        {/* Kolom Kontak */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-800">Kontak</h3>
          <p className="text-sm text-zinc-500 mt-1">
            syafiqeil@example.com (Ganti email ini)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;