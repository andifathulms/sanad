import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="space-y-4 text-center">
        <p className="arabic mx-auto text-5xl text-amber-node">سَنَد</p>
        <h1 className="font-crimson text-4xl font-bold">The Scholar&apos;s Map of the Sunnah</h1>
        <p className="mx-auto max-w-2xl text-ivory/70">
          Read the Hadith corpus in Arabic, English, and Indonesian — then trace every
          isnad, weigh narrator reliability, and uncover textual patterns across the
          Kutub al-Sittah and beyond.
        </p>
        <Link
          href="/reader"
          className="inline-block rounded-lg bg-indigo-scholar px-6 py-3 font-medium hover:bg-indigo-scholar/80"
        >
          Open the Reader
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Isnad Visualizer", "Every chain rendered as a living graph — Prophet ﷺ to collector."],
          ["Rijal Encyclopedia", "Narrator reliability, generation, and teacher/student links."],
          ["Matn Analysis", "Word frequency, parallels, and grade distribution per book."],
        ].map(([title, body]) => (
          <div key={title} className="surface p-5">
            <h3 className="font-crimson text-xl text-amber-node">{title}</h3>
            <p className="mt-2 text-sm text-ivory/70">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
