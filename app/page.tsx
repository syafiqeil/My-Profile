import Image from "next/image";

export default function Home() {
  return (
    <div className="flex w-full justify-center bg-neutral-50 font-sans">
      <main className="max-w-4xl flex flex-col items-center gap-y-24 py-32 px-16">
        <Image
          className=""
          src="/profilgue.png"
          alt="profile gue"
          width={100}
          height={100}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-zinc-800">
            Syafiq Nabil Assirhindi
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-500">
            There is a guy once asked me, why your bio said "Building anything i think i can"
            Like how'd you know to build "anything"? I said, i don't know, i just do the thing.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            My Github
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            About-Me.md
          </a>
        </div>
      </main>
    </div>
  );
}
