export interface ResolutionMetadata {
  title: string;
  Datum: string;
  Lander: string;
  Ausschuss: string;
  Typ: string;
}

export interface Resolution {
  metadata: ResolutionMetadata;
  content: string;
}
