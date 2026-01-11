export interface PastedRange {
  start: number;
  end: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string;
  updatedAt: number;
  hasCustomTitle?: boolean;
  pastedRanges?: PastedRange[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  focusMode: boolean;
  typewriterMode: boolean; // Keeps cursor centered vertically while typing
  styleCheck: boolean;
  showPreview: boolean;
  showSidebar: boolean;
  highlightPastedText: boolean;
}
