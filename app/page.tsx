// app/page.tsx

"use client"; 

import ProfileCard from "./components/ProfileCard";
import ProjectCard from "./components/ProjectCard";
import ActivityCard from "./components/ActivityCard";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8">
      <div className="grid h-full flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-rows-2">
        <ProfileCard />
        <ProjectCard />
        <ActivityCard />
      </div>
    </main>
  );
}