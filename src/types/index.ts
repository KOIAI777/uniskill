export type Category =
  | "formatting"
  | "reference"
  | "email"
  | "exam"
  | "presentation"
  | "research";

export interface Skill {
  slug: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: Category | Category[];
  schools: string[];
  tags: string[];
  installCommand: string;
  downloadPath: string;
  githubUrl: string;
  version: string;
  downloads: number;
  featured: boolean;
  createdAt: string;
  preview: {
    screenshots: string[];
    exampleInput: string;
    exampleOutput: string;
  };
}

export interface School {
  slug: string;
  name: string;
  nameZh: string;
  country: string;
  skillCount: number;
}

export interface CategoryInfo {
  slug: Category;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
}
