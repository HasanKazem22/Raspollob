import React from "react";

interface HomeSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function HomeSection({ title, description, className = "py-16 bg-background", children }: HomeSectionProps) {
  return (
    <section className={className}>
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <h2 className="text-3xl font-serif font-bold tracking-tight text-zinc-900">
            {title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mt-1">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
