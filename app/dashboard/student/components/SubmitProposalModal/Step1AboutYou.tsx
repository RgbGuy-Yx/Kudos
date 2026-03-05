'use client';

interface Step1Data {
  fullName: string;
  email: string;
  university: string;
  degreeProgram: string;
  yearOfStudy: string;
  currentSemester: string;
  graduationYear: string;
  githubProfile: string;
  linkedinUrl: string;
}

interface Step1Props {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
}

const label = 'block text-xs font-medium text-slate-400 mb-1.5';
const input =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition';
const select =
  'w-full rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition appearance-none';

export default function Step1AboutYou({ data, onChange }: Step1Props) {
  const set = (field: keyof Step1Data, val: string) =>
    onChange({ ...data, [field]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Full Name *</label>
          <input
            className={input}
            placeholder="e.g. Himani Patel"
            value={data.fullName}
            onChange={(e) => set('fullName', e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Email Address *</label>
          <input
            type="email"
            className={input}
            placeholder="you@university.edu"
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={label}>University / Institution *</label>
        <input
          className={input}
          placeholder="e.g. MIT, Stanford, IIT Delhi"
          value={data.university}
          onChange={(e) => set('university', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Degree Program *</label>
          <select className={select} value={data.degreeProgram} onChange={(e) => set('degreeProgram', e.target.value)}>
            <option value="">Select...</option>
            {['BSc', 'BA', 'BEng', 'MSc', 'MA', 'MBA', 'PhD', 'Diploma', 'Other'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Current Year of Study *</label>
          <select className={select} value={data.yearOfStudy} onChange={(e) => set('yearOfStudy', e.target.value)}>
            <option value="">Select...</option>
            {['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5+'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Current Semester</label>
          <select className={select} value={data.currentSemester} onChange={(e) => set('currentSemester', e.target.value)}>
            <option value="">Select...</option>
            {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Expected Graduation Year</label>
          <select className={select} value={data.graduationYear} onChange={(e) => set('graduationYear', e.target.value)}>
            <option value="">Select...</option>
            {Array.from({ length: 6 }, (_, i) => String(2025 + i)).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>GitHub Profile</label>
          <input
            className={input}
            placeholder="https://github.com/username"
            value={data.githubProfile}
            onChange={(e) => set('githubProfile', e.target.value)}
          />
        </div>
        <div>
          <label className={label}>LinkedIn URL</label>
          <input
            className={input}
            placeholder="https://linkedin.com/in/username"
            value={data.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export type { Step1Data };
