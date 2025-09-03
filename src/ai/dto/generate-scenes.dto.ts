export type GenerateScenesOptions = {
  numScenes?: number; // min 3, max 8
  tone?: 'exciting' | 'educational' | 'funny' | 'dramatic' | 'professional';
  platform?: 'reels' | 'tiktok' | 'shorts';
  maxLinesPerScene?: number; // default 3
  includeCTA?: boolean; // default true
  language?: string; // default 'en'
  hooksOnly?: boolean; // default false
  title?: string; // optional theme/title
  keywords?: string[]; // optional keywords to include
  safeMode?: boolean; // default true
};

export type GenerateScenesRequest = {
  url: string;
} & GenerateScenesOptions;

// For GET query params (values may arrive as strings); the controller should coerce.
export type GenerateScenesQuery = {
  url: string;
} & Partial<{
  numScenes: number | string;
  tone: GenerateScenesOptions['tone'] | string;
  platform: GenerateScenesOptions['platform'] | string;
  maxLinesPerScene: number | string;
  includeCTA: boolean | string;
  language: string;
  hooksOnly: boolean | string;
  title: string;
  keywords: string | string[]; // comma-separated or repeated param
  safeMode: boolean | string;
}>;

export type SceneItem = { name: string; content: string };
export type GenerateScenesResponse = { scenes: SceneItem[] };
