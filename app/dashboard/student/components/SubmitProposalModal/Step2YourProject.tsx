'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface Step2Data {
  projectTitle: string;
  projectCategory: string;
  shortDescription: string;
  expectedDeliverables: string;
  techStack: string[];
  projectStage: string;
  githubRepoUrl: string;
}

interface Step2Props {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
}

const label = 'block text-xs font-medium text-slate-400 mb-1.5';
const input =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition';
const select =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition appearance-none';
const textarea =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition resize-none';

const categories = [
  'Blockchain/Web3',
  'AI/ML',
  'Open Source',
  'Research',
  'Social Impact',
  'EdTech',
  'HealthTech',
  'Other',
];

const stages = ['Idea', 'Prototype', 'MVP', 'In Development', 'Completed'];

export default function Step2YourProject({ data, onChange }: Step2Props) {
  const [tagInput, setTagInput] = useState('');

  const set = (field: keyof Step2Data, val: string | string[]) =>
    onChange({ ...data, [field]: val });

  const addTag = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !data.techStack.includes(t));
    if (tags.length > 0) {
      set('techStack', [...data.techStack, ...tags]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    set(
      'techStack',
      data.techStack.filter((t) => t !== tag),
    );

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Project Title *</label>
        <input
          className={input}
          placeholder="e.g. Decentralized Grant Tracker"
          value={data.projectTitle}
          onChange={(e) => set('projectTitle', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Project Category *</label>
          <select className={select} value={data.projectCategory} onChange={(e) => set('projectCategory', e.target.value)}>
            <option value="">Select...</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Project Stage</label>
          <select className={select} value={data.projectStage} onChange={(e) => set('projectStage', e.target.value)}>
            <option value="">Select...</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Short Description *</label>
        <textarea
          className={textarea}
          rows={3}
          placeholder="Describe your project in 2-3 sentences..."
          value={data.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
        />
      </div>

      <div>
        <label className={label}>Expected Deliverables *</label>
        <textarea
          className={textarea}
          rows={4}
          placeholder="List the key deliverables for this project..."
          value={data.expectedDeliverables}
          onChange={(e) => set('expectedDeliverables', e.target.value)}
        />
      </div>

      {/* Tech stack tags */}
      <div>
        <label className={label}>Tech Stack</label>
        <div className="flex items-center gap-2">
          <input
            className={input}
            placeholder="Type and press Enter or comma-separate"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
          />
        </div>
        {data.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.techStack.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-2.5 py-1 text-xs text-purple-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-purple-400 hover:text-white transition"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={label}>GitHub Repo URL</label>
        <input
          className={input}
          placeholder="https://github.com/username/repo"
          value={data.githubRepoUrl}
          onChange={(e) => set('githubRepoUrl', e.target.value)}
        />
      </div>
    </div>
  );
}

export type { Step2Data };
