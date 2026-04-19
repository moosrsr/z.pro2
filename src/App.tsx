import { useState, useRef, useCallback } from 'react';
import useVectorizer from './hooks/useVectorizer'; // تأكد إن مسار الملف ده صح عندك

export default function App() {
  const { vectorize, isReady } = useVectorizer();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة لتحويل الصورة لـ ImageData عشان الـ Worker يفهمها
  const fileToImageData = async (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // عرض الصورة للمستخدم
    const reader = new FileReader();
    reader.onload = (e) => setImageSrc(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setIsProcessing(true);
      setProgress(0);
      setSvgOutput(null);

      // 1. تحويل الملف لبيانات
      const imageData = await fileToImageData(file);

      // 2. إرسال البيانات للمحرك الجبار اللي عملناه
      const result = await vectorize(
        imageData,
        { engine: 'hybrid', maxNodes: 5000 },
        (p) => setProgress(Math.round(p))
      );

      // 3. استلام الفيكتور
      if (result && result.svg) {
        setSvgOutput(result.svg);
      }
    } catch (error) {
      console.error('Vectorization Error:', error);
      alert('حصل خطأ أثناء تحويل الصورة. راجع الـ Console.');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vector-z-pro-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 bg-grid-pattern relative overflow-hidden flex flex-col items-center">
      {/* Glow Effects in Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header & Logo */}
      <header className="w-full max-w-6xl p-6 flex justify-between items-center z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Awesome Inline SVG Logo */}
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L80 20 L30 80 L80 80" stroke="#22d3ee" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="20" r="6" fill="#0ea5e9"/>
            <circle cx="80" cy="80" r="6" fill="#0ea5e9"/>
          </svg>
          <h1 className="text-3xl font-['Orbitron'] font-bold text-white tracking-wider">
            VECTOR-<span className="text-cyan-400 neon-text">Z</span> PRO <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/50 align-top">ULTIMATE</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-orange-500 animate-pulse'}`}></div>
          <span className="text-sm text-gray-400 font-medium">
            {isReady ? 'HYBRID ENGINE: ONLINE' : 'BOOTING WORKER...'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl p-6 flex flex-col items-center justify-center z-10 gap-8">
        
        {!imageSrc && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl h-80 border-2 border-dashed border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-900/10 transition-all duration-300 group"
          >
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-200">DROP IMAGE TO VECTORIZE</h2>
            <p className="text-gray-500 mt-2 text-sm">SUPPORTS PNG, JPG, WEBP</p>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Processing State */}
        {isProcessing && (
          <div className="w-full max-w-md">
            <div className="flex justify-between text-cyan-400 mb-2 font-['Orbitron']">
              <span>PROCESSING AI LAYERS...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 neon-glow transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {imageSrc && !isProcessing && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
              <h3 className="text-cyan-500 font-bold mb-4 font-['Orbitron']">ORIGINAL RASTER</h3>
              <div className="bg-black/50 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center min-h-[300px]">
                <img src={imageSrc} alt="Original" className="max-w-full max-h-[400px] object-contain" />
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm flex flex-col">
              <h3 className="text-cyan-500 font-bold mb-4 font-['Orbitron'] flex justify-between">
                <span>VECTOR-Z OUTPUT</span>
                <span className="text-xs text-gray-500">.SVG FORMAT</span>
              </h3>
              <div className="bg-black/50 rounded-lg overflow-hidden border border-gray-800 flex-1 flex items-center justify-center min-h-[300px] p-4 relative pattern-checkerboard">
                {svgOutput ? (
                  <div 
                    className="max-w-full max-h-[400px] w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svgOutput }} 
                  />
                ) : (
                  <span className="text-gray-600 animate-pulse">AWAITING ENGINE...</span>
                )}
              </div>
              
              {svgOutput && (
                <button 
                  onClick={handleDownload}
                  className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all uppercase tracking-wider font-['Orbitron'] flex justify-center items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  DOWNLOAD ULTRA VECTOR
                </button>
              )}
            </div>
          </div>
        )}
        
        {imageSrc && !isProcessing && (
           <button 
             onClick={() => { setImageSrc(null); setSvgOutput(null); }}
             className="text-gray-500 hover:text-cyan-400 underline text-sm transition-colors"
           >
             UPLOAD ANOTHER IMAGE
           </button>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center z-10 border-t border-gray-800/50 backdrop-blur-sm mt-auto">
        <p className="text-gray-500 text-sm font-['Orbitron'] tracking-widest">
          ENGINEERED BY <span className="text-cyan-400 font-bold neon-text">ZIKO "THE FUTURE" ENG</span>
        </p>
      </footer>
    </div>
  );
}
