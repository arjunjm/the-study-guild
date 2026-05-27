import {
  ShieldCheck, Globe, Cloud, Database, Smartphone, Brain,
  Terminal, GitBranch,
  type LucideIcon,
} from 'lucide-react';

export interface TaxonomyItem {
  label: string;
  l2: string;
}

export interface TaxonomyCategory {
  label: string;
  l1: string;
  icon: LucideIcon;
  color: string;       // Tailwind text color for the icon
  bgColor: string;     // Tailwind bg for the icon container
  activeColor: string; // Tailwind active/highlight color
  items: TaxonomyItem[];
}

export const TAXONOMY: TaxonomyCategory[] = [
  {
    label: 'Security',
    l1: 'Security',
    icon: ShieldCheck,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    activeColor: 'text-violet-300 bg-violet-500/15 border-r-2 border-violet-400',
    items: [
      { label: 'Authentication', l2: 'Authentication' },
      { label: 'Authorization',  l2: 'Authorization' },
      { label: 'Network Security', l2: 'Network' },
      { label: 'Cryptography',   l2: 'Cryptography' },
    ],
  },
  {
    label: 'Web Development',
    l1: 'Web Development',
    icon: Globe,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    activeColor: 'text-cyan-300 bg-cyan-500/15 border-r-2 border-cyan-400',
    items: [
      { label: 'Frontend',    l2: 'Frontend' },
      { label: 'Backend',     l2: 'Backend' },
      { label: 'APIs & REST', l2: 'APIs' },
      { label: 'GraphQL',     l2: 'GraphQL' },
    ],
  },
  {
    label: 'Cloud & DevOps',
    l1: 'Cloud',
    icon: Cloud,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    activeColor: 'text-sky-300 bg-sky-500/15 border-r-2 border-sky-400',
    items: [
      { label: 'Azure',      l2: 'Azure' },
      { label: 'AWS',        l2: 'AWS' },
      { label: 'Kubernetes', l2: 'Kubernetes' },
      { label: 'Docker',     l2: 'Docker' },
      { label: 'CI/CD',      l2: 'CI/CD' },
    ],
  },
  {
    label: 'Databases',
    l1: 'Databases',
    icon: Database,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    activeColor: 'text-amber-300 bg-amber-500/15 border-r-2 border-amber-400',
    items: [
      { label: 'SQL',            l2: 'SQL' },
      { label: 'NoSQL',          l2: 'NoSQL' },
      { label: 'Data Modeling',  l2: 'Data Modeling' },
      { label: 'Performance',    l2: 'Performance' },
    ],
  },
  {
    label: 'Mobile',
    l1: 'Mobile',
    icon: Smartphone,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    activeColor: 'text-emerald-300 bg-emerald-500/15 border-r-2 border-emerald-400',
    items: [
      { label: 'iOS',          l2: 'iOS' },
      { label: 'Android',      l2: 'Android' },
      { label: 'React Native', l2: 'React Native' },
      { label: 'Flutter',      l2: 'Flutter' },
    ],
  },
  {
    label: 'AI & Machine Learning',
    l1: 'AI & ML',
    icon: Brain,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    activeColor: 'text-pink-300 bg-pink-500/15 border-r-2 border-pink-400',
    items: [
      { label: 'Machine Learning', l2: 'Machine Learning' },
      { label: 'LLMs & Prompting', l2: 'LLMs' },
      { label: 'Computer Vision',  l2: 'Computer Vision' },
      { label: 'Data Science',     l2: 'Data Science' },
    ],
  },
  {
    label: 'Systems & DevTools',
    l1: 'Systems',
    icon: Terminal,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    activeColor: 'text-orange-300 bg-orange-500/15 border-r-2 border-orange-400',
    items: [
      { label: 'Linux & Shell',  l2: 'Linux' },
      { label: 'Networking',     l2: 'Networking' },
      { label: 'Performance',    l2: 'Performance' },
      { label: 'Architecture',   l2: 'Architecture' },
    ],
  },
  {
    label: 'Software Engineering',
    l1: 'Engineering',
    icon: GitBranch,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    activeColor: 'text-teal-300 bg-teal-500/15 border-r-2 border-teal-400',
    items: [
      { label: 'Design Patterns', l2: 'Design Patterns' },
      { label: 'Testing',         l2: 'Testing' },
      { label: 'Git & Version Control', l2: 'Git' },
      { label: 'Code Quality',    l2: 'Code Quality' },
      { label: 'Python',          l2: 'Python' },
    ],
  },
];
