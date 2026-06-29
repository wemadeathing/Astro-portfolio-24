import React, { useState, useEffect } from 'react';

export default function LlmsGenerator() {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    sitemapUrl: '',
    docsUrl: '',
    urls: [{ title: 'Home', url: '/' }]
  });

  const [generated, setGenerated] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate content when form changes
  useEffect(() => {
    const content = `# ${formData.title || 'My Website'}

> ${formData.summary || 'A concise summary of what this website offers to AI agents.'}

${formData.docsUrl ? `# Documentation\n\n- [Full Documentation](${formData.docsUrl})\n` : ''}
${formData.sitemapUrl ? `# Sitemap\n\n- [Sitemap XML](${formData.sitemapUrl})\n` : ''}
# Core Pages

${formData.urls.map(u => `- [${u.title || 'Page'}](${u.url})`).join('\n')}
`;
    setGenerated(content);
  }, [formData]);

  const handleAutoFill = async () => {
    if (!urlInput) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-llms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });
      
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to generate');

      const data = json.data;
      setFormData({
        title: data.title || '',
        summary: data.summary || '',
        sitemapUrl: `${urlInput.replace(/\/$/, '')}/sitemap.xml`, // Intelligent guess
        docsUrl: '',
        urls: data.urls || [{ title: 'Home', url: '/' }]
      });
    } catch (e: any) {
      setError(e.message || 'Failed to auto-generate. Try filling manually.');
    } finally {
      setLoading(false);
    }
  };

  const addUrl = () => {
    setFormData(prev => ({
      ...prev,
      urls: [...prev.urls, { title: '', url: '' }]
    }));
  };

  const updateUrl = (index: number, field: 'title' | 'url', value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index][field] = value;
    setFormData(prev => ({ ...prev, urls: newUrls }));
  };

  const removeUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
  };

  const downloadFile = () => {
    const blob = new Blob([generated], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
      {/* Input Column */}
      <div className="space-y-6">
        
        {/* Auto-fill Section */}
        <div className="border-t border-border/80 pt-4">
           <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Start with a URL</div>
           <h3 className="mb-4 text-lg font-semibold text-foreground">AI auto-fill</h3>
           <div className="flex gap-2">
             <input
               type="url"
               value={urlInput}
               onChange={(e) => setUrlInput(e.target.value)}
               placeholder="https://example.com"
               className="flex-1 border border-border/80 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none"
             />
             <button
               onClick={handleAutoFill}
               disabled={loading || !urlInput}
               className="btn-stripe disabled:cursor-not-allowed disabled:opacity-50"
             >
               {loading ? 'Scanning...' : 'Auto-fill'}
             </button>
           </div>
           {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
           <p className="mt-3 text-xs leading-6 text-muted-foreground">Uses AI to scan your homepage and suggest content.</p>
        </div>

        <div className="border-t border-border/80 pt-4">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Site details</div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Describe the site</h3>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Site Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Nasif Salaam Portfolio"
                className="w-full border border-border/80 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Summary for AI</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Briefly explain what your site is about..."
                rows={3}
                className="w-full border border-border/80 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sitemap URL (Optional)</label>
                <input
                  type="text"
                  value={formData.sitemapUrl}
                  onChange={(e) => setFormData({ ...formData, sitemapUrl: e.target.value })}
                  placeholder="/sitemap.xml"
                  className="w-full border border-border/80 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Docs URL (Optional)</label>
                <input
                  type="text"
                  value={formData.docsUrl}
                  onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                  placeholder="/docs"
                  className="w-full border border-border/80 bg-background px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/80 pt-4">
          <div className="mb-4 flex items-center justify-between">
             <div>
               <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Key pages</div>
               <h3 className="mt-2 text-lg font-semibold text-foreground">What should AI see first?</h3>
             </div>
             <button
                onClick={addUrl}
                className="border border-border/80 bg-card/40 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
             >
                + Add Page
             </button>
          </div>
          
          <div className="space-y-3">
            {formData.urls.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={url.title}
                  onChange={(e) => updateUrl(idx, 'title', e.target.value)}
                  placeholder="Page Title"
                  className="flex-1 border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                />
                <input
                  type="text"
                  value={url.url}
                  onChange={(e) => updateUrl(idx, 'url', e.target.value)}
                  placeholder="/path"
                  className="flex-1 border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                />
                <button
                  onClick={() => removeUrl(idx)}
                  className="shrink-0 p-2 text-muted-foreground hover:text-red-400"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Column */}
      <div className="lg:sticky lg:top-32 h-fit">
        <div className="flex h-full flex-col overflow-hidden border-t border-border/80">
          <div className="flex items-center justify-between border-b border-border/80 px-0 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">llms.txt</span>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="border border-border/80 bg-card/40 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
              >
                Copy
              </button>
              <button
                onClick={downloadFile}
                className="border border-primary/30 bg-primary/12 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary/18"
              >
                Download
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-[600px] border-b border-border/80">
             <pre className="whitespace-pre-wrap px-0 py-4 font-mono text-sm text-foreground">{generated}</pre>
          </div>
        </div>

        <div className="mt-8 border-t border-border/80 pt-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">What is this?</div>
          <p className="text-xs leading-6 text-muted-foreground">
            <code>llms.txt</code> is a standard file that tells AI agents (like ChatGPT, Claude) exactly what your website contains in a format <em>they</em> can read easily. It's like a sitemap, but for robots that read text.
          </p>
        </div>
      </div>
    </div>
  );
}
