import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';

// Using consistent naming with existing ChatInterface
// But simpler, just for filtering.

interface FloatingAssistantProps {
  // We will dispatch custom events to the window for filtering
}

const suggestions = [
  'Design Systems',
  'AI Tools',
  'Animations',
  'Colors',
  'Typography',
  'Accessibility',
  'Documentation'
];

const FloatingAssistant: FC<FloatingAssistantProps> = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with URL params on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get('q') || '';
    if (q) {
        setQuery(q);
        setIsOpen(true);
    }
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    
    // Dispatch event for Astro page logic to pick up
    const event = new CustomEvent('resource-filter', { detail: { query: val } });
    window.dispatchEvent(event);
    
    // Also update URL (without reload)
    const url = new URL(window.location.href);
    if (!val) {
        url.searchParams.delete('q');
    } else {
        url.searchParams.set('q', val);
    }
    window.history.replaceState({}, '', url.toString());
  };

  const clear = () => {
    handleSearch('');
    setIsOpen(false);
  };

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[600px] px-4 z-40 transition-all duration-500 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-0'}`}>
      <div 
        className={`relative bg-[#131313]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-4 ring-primary/10' : 'hover:border-white/20'}`}
      >
        <div className="flex items-center px-4 h-14 gap-3">
          <div className="text-primary w-5 h-5 flex items-center justify-center">
            {/* Sparkles icon */}
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
             </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            // onBlur={() => !query && setIsOpen(false)} // Optional: auto close? kept open for suggestions
            placeholder="What are you looking for? (e.g. 'vectors' or 'schema')"
            className="flex-1 bg-transparent border-none text-white/90 placeholder:text-white/40 focus:ring-0 text-base h-full"
            autoComplete="off"
          />
          
          {query && (
            <button 
                onClick={clear}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
            </button>
          )}
        </div>

        {/* Suggestions / Chips - Only show when focused or typing */}
         <div className={`px-4 pb-4 transition-all duration-300 ${isOpen ? 'opacity-100 max-h-40 mt-0' : 'opacity-0 max-h-0 overflow-hidden'}`}>
             <div className="h-px bg-white/10 w-full mb-3" />
             <div className="flex flex-wrap gap-2">
                 {suggestions.map((s) => (
                     <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                            query.toLowerCase().includes(s.toLowerCase())
                            ? 'bg-primary/20 border-primary/40 text-primary' 
                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                     >
                        {s}
                     </button>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default FloatingAssistant;
