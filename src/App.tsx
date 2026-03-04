import React, { useState, useMemo } from 'react';
import { Search, Download, Copy, ExternalLink, Image as ImageIcon, Loader2, AlertCircle, Check, Square, CheckSquare, Archive, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExtractedImage {
  url: string;
  alt: string;
  type: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, string>>({});

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setImages([]);
    setSelectedUrls(new Set());

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract images');
      }

      setImages(data.images);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (imageUrl: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
    } else {
      newSelected.add(imageUrl);
    }
    setSelectedUrls(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === images.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(images.map(img => img.url)));
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'extracted-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  const downloadZip = async () => {
    if (selectedUrls.size === 0) return;
    
    setZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("extracted-images");
    
    const downloadPromises = Array.from(selectedUrls).map(async (imageUrl: string, index: number) => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'png';
        folder?.file(`image-${index + 1}.${extension}`, blob);
      } catch (err) {
        console.error(`Failed to add image to zip: ${imageUrl}`, err);
      }
    });

    await Promise.all(downloadPromises);
    
    const content = await zip.generateAsync({ type: "blob" });
    const zipUrl = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = "images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(zipUrl);
    setZipping(false);
  };

  const analyzeImage = async (imageUrl: string) => {
    setAnalyzingUrl(imageUrl);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze image');
      setAnalysisResults(prev => ({ ...prev, [imageUrl]: data.description }));
    } catch (err: any) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingUrl(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ImageIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Image Extractor</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Web Utility Tool</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Search Section */}
        <section className="max-w-2xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-zinc-900 mb-4 tracking-tight">
              Extract images from any website
            </h2>
            <p className="text-lg text-zinc-600 mb-8">
              Enter a website URL below to find and download all images instantly. Supports .jpg, .jpeg, .png, .gif, .svg, and .webp.
            </p>

            <form onSubmit={handleExtract} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="block w-full pl-12 pr-32 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-zinc-900 placeholder:text-zinc-400"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <span>Extract</span>
                )}
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Results Section */}
        <section>
          {images.length > 0 && (
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                Found {images.length} images
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {selectedUrls.size === images.length ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                  <span>{selectedUrls.size === images.length ? 'Deselect All' : 'Select All'}</span>
                </button>
                
                <button
                  onClick={downloadZip}
                  disabled={selectedUrls.size === 0 || zipping}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
                >
                  {zipping ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Archive size={18} />
                  )}
                  <span>Download Selected ({selectedUrls.size})</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img, index) => {
              const isSelected = selectedUrls.has(img.url);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => toggleSelect(img.url)}
                  className={cn(
                    "group relative bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer",
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200 hover:border-indigo-200"
                  )}
                >
                  <div className="aspect-square bg-zinc-100 overflow-hidden relative">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        isSelected ? "scale-105" : "group-hover:scale-110"
                      )}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    
                    {/* Selection Overlay */}
                    <div className={cn(
                      "absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isSelected ? "bg-indigo-600 text-white scale-110" : "bg-black/20 text-white/50 opacity-0 group-hover:opacity-100"
                    )}>
                      {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={14} />}
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {img.type}
                    </div>
                  </div>

                  <div className="p-4" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-zinc-400 font-mono truncate mb-3" title={img.url}>
                      {img.url}
                    </p>
                    
                    {analysisResults[img.url] && (
                      <div className="mb-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900 border border-indigo-100 italic">
                        <Sparkles size={12} className="inline mr-1 text-indigo-500" />
                        {analysisResults[img.url]}
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => copyToClipboard(img.url, index)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-zinc-100"
                        title="Copy URL"
                      >
                        {copiedIndex === index ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        <span className="text-[10px] font-medium uppercase">Copy</span>
                      </button>
                      <button
                        onClick={() => downloadImage(img.url, `image-${index}`)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-zinc-100"
                        title="Download"
                      >
                        <Download size={16} />
                        <span className="text-[10px] font-medium uppercase">Save</span>
                      </button>
                      <button
                        onClick={() => analyzeImage(img.url)}
                        disabled={analyzingUrl === img.url}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-zinc-100 disabled:opacity-50"
                        title="Analyze with AI"
                      >
                        {analyzingUrl === img.url ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span className="text-[10px] font-medium uppercase">AI</span>
                      </button>
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-zinc-50 text-zinc-600 hover:text-indigo-600 transition-colors border border-transparent hover:border-zinc-100"
                        title="Open Original"
                      >
                        <ExternalLink size={16} />
                        <span className="text-[10px] font-medium uppercase">Open</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {!loading && images.length === 0 && !error && url && (
            <div className="text-center py-20 bg-white border-2 border-dashed border-zinc-200 rounded-3xl">
              <ImageIcon className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900">No images found</h3>
              <p className="text-zinc-500">Try another URL or check if the website is accessible.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-zinc-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Image Extractor. Built for speed and utility.
          </p>
        </div>
      </footer>
    </div>
  );
}
