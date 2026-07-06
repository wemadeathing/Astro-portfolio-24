import React from 'react';

export default function KotaBetaBanner() {
  return (
    <div className="not-prose my-14 border border-border/90 bg-card/15 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Kota Beta
          </div>
          <h3 className="mt-3 max-w-[16ch] text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
            Now in beta testing
          </h3>
          <p className="mt-4 max-w-[46ch] text-sm leading-7 text-muted-foreground">
            Currently being tested and refined with real South African service businesses. The product is live and early access is underway.
          </p>
        </div>
        <div className="lg:flex-shrink-0">
          <a
            href="https://www.getkota.co.za"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-stripe no-underline"
            style={{ textDecoration: 'none' }}
          >
            View landing page
          </a>
        </div>
      </div>
    </div>
  );
}
