
export interface Utterance {
  condition: string;
  [key: string]: any; 
}

export interface JsonData {
  utterances: Utterance[];
  trains: any[];
}

export interface Conflict {
  condition: string;
  version1: Utterance;
  version2: Utterance;
}

export interface ComparisonResult {
  file1Only: Utterance[];
  file2Only: Utterance[];
  conflicts: Conflict[];
  identical: Utterance[];
}

export type ResolvedConflicts = Record<string, 'version1' | 'version2'>;

export type InclusionState = Record<string, boolean>;
