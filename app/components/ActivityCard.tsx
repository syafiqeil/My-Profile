// app/components/ActivityCard.tsx

"use client";

import { useAnimationStore, ActivityItem } from '../lib/SessionProvider';

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 16.5v-11A2.5 2.5 0 0 1 6.5 3H20v11H6.5A2.5 2.5 0 0 1 4 11.5v0Z" /></svg>
);
const AwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88" /></svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-zinc-600"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
);

// Komponen helper untuk item daftar
const ActivityLinkItem = ({ item }: { item: ActivityItem }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center justify-between p-2 rounded-md hover:bg-zinc-50"
  >
    <span className="text-sm text-zinc-700 truncate">{item.title}</span>
    <ExternalLinkIcon />
  </a>
);

const ActivityCard = () => {
  const { profile, isHydrated } = useAnimationStore();

  // Ambil data aktivitas dari state global
  const activity = profile?.activity;
  const hasBlog = activity && activity.blogPosts.length > 0;
  const hasCerts = activity && activity.certificates.length > 0;
  const hasContact = activity && activity.contactEmail;

  // Tampilkan versi statis jika data belum siap
  if (!isHydrated || !profile) {
    return <StaticActivityCard />;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <ActivityIcon />
        <h2 className="text-xl font-semibold text-zinc-900">
          Activity
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* --- Kolom Blog Dinamis --- */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookIcon />
            <h3 className="font-semibold text-zinc-800">Blog</h3>
          </div>
          {hasBlog ? (
            <div className="flex flex-col gap-1">
              {activity.blogPosts.slice(0, 3).map(post => ( // Tampilkan 3 teratas
                <ActivityLinkItem key={post.id} item={post} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 mt-1">
              No posts yet.
            </p>
          )}
        </div>
        
        {/* --- Kolom Sertifikat Dinamis --- */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AwardIcon />
            <h3 className="font-semibold text-zinc-800">Certificates</h3>
          </div>
          {hasCerts ? (
            <div className="flex flex-col gap-1">
              {activity.certificates.slice(0, 3).map(cert => ( // Tampilkan 3 teratas
                <ActivityLinkItem key={cert.id} item={cert} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 mt-1">
              No certificates to display yet.
            </p>
          )}
        </div>

        {/* --- Kolom Kontak Dinamis --- */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MailIcon />
            <h3 className="font-semibold text-zinc-800">Contact</h3>
          </div>
          {hasContact ? (
            <a 
              href={`mailto:${activity.contactEmail}`}
              className="group flex items-center justify-between p-2 rounded-md hover:bg-zinc-50"
            >
              <span className="text-sm text-zinc-700 truncate">{activity.contactEmail}</span>
              <ExternalLinkIcon />
            </a>
          ) : (
            <p className="text-sm text-zinc-500 mt-1">
              Contact not set yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Fallback statis
const StaticActivityCard = () => (
  <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
    <div className="flex items-center gap-3 mb-4">
      <ActivityIcon />
      <h2 className="text-xl font-semibold text-zinc-900">
        Activity
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-800">Blog</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Please connect and log in to view or update your profile.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-800">Certificates</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Please connect and log in to view or update your profile.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-800">Contact</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Please connect and log in to view or update your profile.
        </p>
      </div>
    </div>
  </div>
);

export default ActivityCard;