import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="pt-28 lg:pt-16">
      <section className="min-h-[50vh] px-4 py-20 sm:px-6 flex items-center">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-sm text-cta mb-4">404</p>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Page not found
          </h1>
          <p className="font-sans text-muted text-lg leading-relaxed mb-8">
            The page you requested does not exist or may have moved.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center bg-cta px-5 py-2.5 font-sans text-sm font-semibold text-bg transition-colors hover:bg-cta/90"
          >
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}
