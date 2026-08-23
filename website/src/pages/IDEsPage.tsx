import IDEStrip from '../components/IDEStrip';
import TmuxSection from '../components/TmuxSection';

export default function IDEsPage() {
  return (
    <div className="pt-28 lg:pt-16">
      <section className="border-b border-surface-light bg-surface/20 px-4 pt-12 pb-8 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-4 font-mono text-4xl font-bold text-foreground sm:text-5xl">
            Supported coding environments
          </h1>
          <p className="max-w-2xl font-sans text-lg leading-relaxed text-muted">
            Install Arcwright once, then use it with your preferred AI coding environment.
          </p>
        </div>
      </section>
      <IDEStrip />
      <TmuxSection />
    </div>
  );
}
