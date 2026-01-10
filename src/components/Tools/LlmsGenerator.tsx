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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Column */}
      <div className="space-y-6">
        
        {/* Auto-fill Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
           <h3 className="text-lg font-semibold text-white/90 mb-4">Start with a URL (AI Auto-fill)</h3>
           <div className="flex gap-2">
             <input
               type="url"
               value={urlInput}
               onChange={(e) => setUrlInput(e.target.value)}
               placeholder="https://example.com"
               className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:border-primary/50 focus:outline-none"
             />
             <button
               onClick={handleAutoFill}
               disabled={loading || !urlInput}
               className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               {loading ? 'Scanning...' : 'Auto-fill'}
             </button>
           </div>
           {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
           <p className="mt-2 text-xs text-white/40">Uses AI to scan your homepage and suggest content.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-semibold text-white/90 mb-4">Site Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Site Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Nasif Salaam Portfolio"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Summary for AI</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Briefly explain what your site is about..."
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:border-primary/50 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Sitemap URL (Optional)</label>
                <input
                  type="text"
                  value={formData.sitemapUrl}
                  onChange={(e) => setFormData({ ...formData, sitemapUrl: e.target.value })}
                  placeholder="/sitemap.xml"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Docs URL (Optional)</label>
                <input
                  type="text"
                  value={formData.docsUrl}
                  onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                  placeholder="/docs"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white/90">Key Pages</h3>
             <button
                onClick={addUrl}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2 py-1 text-white/80 transition-colors"
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
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:border-primary/50 focus:outline-none"
                />
                <input
                  type="text"
                  value={url.url}
                  onChange={(e) => updateUrl(idx, 'url', e.target.value)}
                  placeholder="/path"
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:border-primary/50 focus:outline-none"
                />
                <button
                  onClick={() => removeUrl(idx)}
                  className="shrink-0 text-white/30 hover:text-red-400 p-2"
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
        <div className="rounded-2xl border border-white/10 bg-[#070910] overflow-hidden flex flex-col h-full shadow-2xl">
          <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">llms.txt</span>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1 text-white/80 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={downloadFile}
                className="text-xs bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary-foreground rounded px-2 py-1 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
          <div className="p-0 overflow-auto max-h-[600px]">
             <pre className="p-4 text-sm font-mono text-white/80 whitespace-pre-wrap">{generated}</pre>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
          <h4 className="text-sm font-semibold text-blue-200 mb-1">What is this?</h4>
          <p className="text-xs text-blue-200/70 leading-relaxed">
            <code>llms.txt</code> is a standard file that tells AI agents (like ChatGPT, Claude) exactly what your website contains in a format <em>they</em> can read easily. It's like a sitemap, but for robots that read text.
          </p>
        </div>
      </div>
    </div>
  );
}
