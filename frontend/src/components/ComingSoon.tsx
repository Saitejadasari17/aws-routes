"use client";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="aws-panel">
        <div className="aws-panel-body text-center py-16">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-xl font-bold text-[#16191f] mb-2">Coming Soon</h2>
          <p className="text-sm text-[#545b64] max-w-md mx-auto">
            {description ||
              `The ${title} feature is not yet available. This section is a placeholder for future development.`}
          </p>
        </div>
      </div>
    </div>
  );
}
