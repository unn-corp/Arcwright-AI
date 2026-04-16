import { useState } from 'react';
import {
  skills,
  SKILL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type SkillCategory,
} from '../data/skills';

export default function SkillsPage() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all' ? skills : skills.filter(s => s.category === activeCategory);

  const categoryCounts: Record<string, number> = { all: skills.length };
  for (const cat of SKILL_CATEGORIES) {
    categoryCounts[cat] = skills.filter(s => s.category === cat).length;
  }

  return (
    <div className="pt-16">
      {/* Page header */}
      <section className="px-4 sm:px-6 pt-12 pb-8 border-b border-surface-light bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-cta text-sm">_arcwright</span>
            <span className="font-mono text-muted/40 text-sm">→</span>
            <span className="font-mono text-muted text-sm">skills library</span>
          </div>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Skill Library
          </h1>
          <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
            {skills.length} focused context modules — installed alongside agents and workflow tracks.
            Specialists invoke them automatically when the task domain matches.
          </p>
        </div>
      </section>

      <section className="pt-8 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`font-mono text-xs px-3 py-1.5 border transition-all duration-200 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-cta/15 border-cta/40 text-cta'
                  : 'border-surface-light text-muted hover:text-foreground hover:border-muted/40'
              }`}
            >
              All
              <span className="ml-1.5 opacity-60">{categoryCounts.all}</span>
            </button>
            {SKILL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-mono text-xs px-3 py-1.5 border transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'border-opacity-60'
                    : 'border-surface-light text-muted hover:text-foreground hover:border-muted/40'
                }`}
                style={
                  activeCategory === cat
                    ? {
                        borderColor: CATEGORY_COLORS[cat],
                        backgroundColor: `${CATEGORY_COLORS[cat]}15`,
                        color: CATEGORY_COLORS[cat],
                      }
                    : undefined
                }
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-1.5 opacity-60">{categoryCounts[cat]}</span>
              </button>
            ))}
          </div>

          {/* Skills grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(skill => {
              const color = CATEGORY_COLORS[skill.category];
              return (
                <div
                  key={skill.slug}
                  className="bg-surface border border-surface-light p-4 hover:bg-surface/80 transition-all duration-200 group"
                  style={
                    {
                      '--hover-border': color,
                    } as React.CSSProperties
                  }
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = color;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '';
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <code className="font-mono text-xs text-foreground font-semibold leading-tight break-all">
                      {skill.slug}
                    </code>
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap"
                      style={{
                        color,
                        backgroundColor: `${color}15`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {CATEGORY_LABELS[skill.category]}
                    </span>
                  </div>
                  <div className="font-sans text-sm font-medium text-foreground/80 mb-1.5">
                    {skill.name}
                  </div>
                  <p className="font-sans text-xs text-muted leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted font-mono text-sm">
              No skills in this category.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
