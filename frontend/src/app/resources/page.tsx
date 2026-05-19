import { palette } from "@/lib/theme/palette";
import Link from "next/link";

const GLOBAL_RESOURCES = [
  {
    country: "Global",
    resources: [
      { name: "Befrienders Worldwide", type: "Crisis/Mental Health", url: "https://www.befrienders.org/", desc: "Worldwide directory of emotional support centers." },
      { name: "World Health Organization (WHO) Mental Health", type: "Information", url: "https://www.who.int/health-topics/mental-health", desc: "Global data, fact sheets, and initiatives." },
    ]
  },
  {
    country: "United States",
    resources: [
      { name: "988 Suicide & Crisis Lifeline", type: "Crisis", url: "https://988lifeline.org/", desc: "Dial 988 for 24/7 free, confidential support for people in distress." },
      { name: "NAMI (National Alliance on Mental Illness)", type: "Support", url: "https://nami.org/", desc: "Education, support groups, and advocacy." },
      { name: "ACSM (American College of Sports Medicine)", type: "Physical Health", url: "https://www.acsm.org/", desc: "Exercise is Medicine initiative and physical wellness resources." },
    ]
  },
  {
    country: "United Kingdom",
    resources: [
      { name: "Samaritans", type: "Crisis", url: "https://www.samaritans.org/", desc: "Call 116 123 for free, 24/7 emotional support." },
      { name: "Mind", type: "Support", url: "https://www.mind.org.uk/", desc: "Information, advice, and local support services." },
      { name: "NHS Every Mind Matters", type: "Information", url: "https://www.nhs.uk/every-mind-matters/", desc: "Expert advice and practical tips for physical and mental wellbeing." },
    ]
  },
  {
    country: "Canada",
    resources: [
      { name: "Crisis Services Canada", type: "Crisis", url: "https://www.crisisservicescanada.ca/", desc: "Call 1-833-456-4566 or text 45645 for suicide prevention." },
      { name: "CMHA (Canadian Mental Health Association)", type: "Support", url: "https://cmha.ca/", desc: "Community-based mental health resources and advocacy." },
    ]
  },
  {
    country: "Australia",
    resources: [
      { name: "Lifeline Australia", type: "Crisis", url: "https://www.lifeline.org.au/", desc: "Call 13 11 14 for 24/7 crisis support and suicide prevention." },
      { name: "Beyond Blue", type: "Support", url: "https://www.beyondblue.org.au/", desc: "Information and support for anxiety, depression, and suicide." },
    ]
  }
];

export default function ResourcesPage() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-clinical-500/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3" />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar p-6 lg:p-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest2 text-clinical-400">Clinical Support</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-ink tracking-tight mb-4">
              Global <span className="text-clinical-400">Resources</span>
            </h1>
            <p className="text-sm text-ink-subtle max-w-2xl leading-relaxed">
              babelForge provides theoretical topological models, not medical advice. If you or someone you know is in crisis, or seeking professional physical and mental health interventions, please use the state, country, and global resources below.
            </p>
          </div>

          <div className="space-y-10">
            {GLOBAL_RESOURCES.map((group) => (
              <section key={group.country} className="clinical-card border-none bg-transparent p-0">
                <h2 className="text-xl font-bold text-ink mb-4 border-b border-line pb-2">{group.country}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.resources.map((res) => (
                    <a 
                      key={res.name} 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex flex-col p-4 border border-line bg-surface-0 hover:bg-surface-50 hover:border-clinical-500/50 transition-all rounded-clinical"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-bold text-ink group-hover:text-clinical-400 transition-colors">{res.name}</h3>
                        <svg className="w-3 h-3 text-ink-muted group-hover:text-clinical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest2 text-ink-muted mb-2 inline-block px-1.5 py-0.5 bg-surface-100 rounded-sm w-max">
                        {res.type}
                      </span>
                      <p className="text-xs text-ink-subtle leading-relaxed flex-grow">
                        {res.desc}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}