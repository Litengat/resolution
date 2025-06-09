// src/data/committees.ts
export interface CommitteeInfo {
  name: string;
  article: "Der" | "Die";
  abbreviation: string;
}

export const committees: Record<string, CommitteeInfo> = {
  SR: { name: "Sicherheitsrat", article: "Der", abbreviation: "SR" },
  GV: { name: "Generalversammlung", article: "Die", abbreviation: "GV" },
  AK: { name: "Abrüstungskommission", article: "Die", abbreviation: "AK" },
  RE: {
    name: "Kommission für Recht und Ethik",
    article: "Die",
    abbreviation: "RE",
  },
  WUT: {
    name: "Kommission für Wissenschaft, Umwelt und Technik",
    article: "Die",
    abbreviation: "WUT",
  },
  WS: {
    name: "Wirtschafts- und Sozialrat",
    article: "Der",
    abbreviation: "WS",
  },
  BG: {
    name: "Sonderkommission für Bildung und Gesundheit",
    article: "Die",
    abbreviation: "BG",
  },
  HSR: {
    name: "Historischer Sicherheitsrat",
    article: "Der",
    abbreviation: "HSR",
  },
};

// Ein Fallback, falls ein ungültiges Kürzel angegeben wird.
export const defaultCommittee: CommitteeInfo = {
  name: "Sicherheitsrat",
  article: "Der",
  abbreviation: "SR",
};
