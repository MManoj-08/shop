import type { Metadata } from "next";
import credits from "../../../../data/photo-credits.json";

export const metadata: Metadata = { title: "Photo credits | Kudla Santhe" };

// Some fruit and vegetable photos come from Wikimedia Commons; their licences ask us to name the photographer.
export default function Credits() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-medium text-green-950">Photo credits</h1>
      <p className="mt-3 text-stone-600">
        Some of our fruit and vegetable photos come from Wikimedia Commons and are used under their free licences.
      </p>
      <ul className="mt-8 divide-y divide-green-950/10">
        {Object.entries(credits).map(([slug, c]) => (
          <li key={slug} className="py-4 text-sm">
            <a
              href={c.page}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-green-900 underline underline-offset-4"
            >
              {c.file}
            </a>
            <p className="text-stone-500">
              {c.author} · {c.license}
              {c.license !== "Public domain" && c.license !== "CC0" && " · cropped to a square"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
