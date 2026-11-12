/** Rhymate releases, newest first. Shown on /rhymate/changelog; the first one also on /rhymate. */
export interface Release {
  version: string;
  /** Month of release, or "Coming soon" before it is in the App Store. */
  date: string;
  /** One line that sums the release up. */
  summary: string;
  changes: { title: string; body: string }[];
}

export const releases: Release[] = [
  {
    version: "2.2",
    date: "November 2026",
    summary: "Songwriting first. Rhymes are still one tap away.",
    changes: [
      {
        title: "A home for your songs",
        body: "Rhymate opens where you left off: the song you were writing, a New Song button and your recent songs from every folder.",
      },
      {
        title: "Export as PDF",
        body: "Print or share a clean chord sheet, with chord diagrams or as lyrics only. Paper size follows your region.",
      },
      {
        title: "Your chord shapes",
        body: "Each song remembers the shape you play every chord with, in the editor and in the PDF.",
      },
      {
        title: "Hide the keyboard",
        body: "A button above the keys, or drag the song down, to see the whole page.",
      },
      {
        title: "A fresh coat",
        body: "New icons and illustrations, folders sorted by name, and a first launch that asks whether you came to write songs or find rhymes.",
      },
      {
        title: "Fixed",
        body: "Opening the rhymes for some words no longer freezes the app.",
      },
    ],
  },
  {
    version: "2.1",
    date: "November 2026",
    summary: "Chords move in.",
    changes: [
      {
        title: "Chords in place",
        body: "Add chords right above your lyrics. Tap one to transpose it, change its flavour or see how to play it.",
      },
      {
        title: "Rhymes while you write",
        body: "Rhymes for the word at your cursor appear above the keyboard. Tap one to drop it into your song.",
      },
      {
        title: "Rhymes by syllables",
        body: "Results are grouped by syllable count, with definitions and favourites one tap away.",
      },
      {
        title: "A calmer song list",
        body: "Songs sorted by date with previews, search and swipe actions.",
      },
    ],
  },
  {
    version: "2.0",
    date: "February 2026",
    summary: "From rhyme dictionary to songwriting app.",
    changes: [
      {
        title: "The editor",
        body: "Write whole songs in folders, with a rhyme assistant built into the editor.",
      },
      {
        title: "iCloud sync",
        body: "Songs and favourites sync through your own iCloud across iPhone, iPad and Mac.",
      },
    ],
  },
  {
    version: "1.3",
    date: "June 2025",
    summary: "Room to breathe on iPad and Mac.",
    changes: [
      {
        title: "Split view",
        body: "Search and results side by side on iPad and Mac, with redesigned favourites and accessibility improvements.",
      },
    ],
  },
  {
    version: "1.2",
    date: "June 2025",
    summary: "A faster search.",
    changes: [
      {
        title: "New search",
        body: "Suggestions while you type and a search history you can clear.",
      },
    ],
  },
  {
    version: "1.0",
    date: "2024",
    summary: "Where it started.",
    changes: [
      {
        title: "Rhymes & meanings",
        body: "Rhymes for any word with Wiktionary definitions and favourites, on iPhone, iPad and Mac.",
      },
    ],
  },
];
