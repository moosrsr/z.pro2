import React, { useState, useEffect } from 'react';
import { 
  Upload, Zap, Cpu, Layers, ShieldCheck, 
  Activity, Terminal, Wand2, Download, Image as ImageIcon 
} from 'lucide-react';

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation for the AI Engine processing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      startAIEngine();
    }
  };

  const startAIEngine = () => {
    setIsProcessing(true);
    setProgress(0);
    setLogs(['[SYSTEM] Initializing Vector-Z Hybrid Engine...']);
    
    const steps = [
      '[AI] Loading @xenova/transformers...',
      '[VISION] Starting Mediapipe Edge Detection...',
      '[CORE] Analyzing pixels with OpenCV (WASM)...',
      '[PROCESS] Removing Background (Sharp & Jimp)...',
      '[RENDER] Tracing SVG Paths...',
      '[OPTIMIZE] Cleaning nodes with SVGO...',
      '[SUCCESS] Vectorization Complete!'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        if (prev % 15 === 0 && stepIndex < steps.length) {
          setLogs(prevLogs => [...prevLogs, steps[stepIndex]]);
          stepIndex++;
        }
        return prev + 5;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-cyan-900/50 bg-black/40 backdrop-blur-xl p-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              Vector-Z <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Ultimate</span>
            </h1>
            <p className="text-[10px] text-cyan-500/70 tracking-widest font-mono">HYBRID AI ARCHITECTURE v3.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-cyan-950/30 border border-cyan-800/50 px-3 py-1.5 rounded-full text-cyan-400">
            <Activity className="w-3 h-3 animate-pulse" /> SYSTEM ONLINE
          </div>
          <div className="text-xs font-bold tracking-widest border border-white/10 px-4 py-2 rounded-lg bg-white/5 uppercase text-gray-300">
            Engineered by <span className="text-white">ZIKO "THE FUTURE" ENG</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-3 gap-8 pt-8">
        
        {/* Left Panel: Upload & Preview (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-left mb-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              TRANSFORM PIXELS INTO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic">PURE MATHEMATICS</span>
            </h2>
            <p className="text-gray-400 max-w-xl text-lg">
              منصة الجيل القادم لتحويل الصور إلى فيكتور عالي الجودة. مدعومة بـ 15 محرك ذكاء اصطناعي لضمان دقة لا مثيل لها.
            </p>
          </div>

          {/* Magic Dropzone */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className={`relative h-96 bg-black/60 backdrop-blur-sm border-2 ${isProcessing ? 'border-cyan-500' : 'border-white/10 border-dashed'} rounded-[2rem] flex flex-col items-center justify-center overflow-hidden transition-all`}>
              
              {!preview ? (
                <>
                  <Upload className="w-16 h-16 text-cyan-500 mb-4 group-hover:-translate-y-2 transition-transform duration-300" />
                  <p className="text-xl font-bold text-gray-200">اسحب الصورة أو اضغط للرفع</p>
                  <p className="text-sm text-gray-500 mt-2 font-mono">PNG, JPG, WEBP (MAX 20MB)</p>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </>
              ) : (
                <div className="absolute inset-0 p-4 flex items-center justify-center bg-black/80">
                  <img src={preview} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl border border-white/10" />
                  
                  {/* Scanning Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-1 bg-cyan-500/50 shadow-[0_0_20px_#06b6d4] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="bg-black/50 border border-cyan-900/50 p-4 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between text-xs font-mono text-cyan-400 mb-2">
                <span>AI PROCESSING CORE</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: AI Status & Tools */}
        <div className="space-y-6">
          {/* Active Libraries Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Cpu className="w-5 h-5 text-cyan-400" /> NEURAL NETWORK
            </h3>
            
            <div className="space-y-4">
              {[
                { name: 'Transformers.js', status: 'ACTIVE', color: 'text-green-400', dot: 'bg-green-400' },
                { name: 'Mediapipe Vision', status: 'ACTIVE', color: 'text-green-400', dot: 'bg-green-400' },
                { name: 'OpenCV WASM', status: 'READY', color: 'text-cyan-400', dot: 'bg-cyan-400' },
                { name: 'Sharp Processing', status: 'READY', color: 'text-cyan-400', dot: 'bg-cyan-400' },
                { name: 'Tesseract OCR', status: 'STANDBY', color: 'text-gray-500', dot: 'bg-gray-500' }
              ].map((lib, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-sm font-mono text-gray-300">{lib.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] tracking-wider ${lib.color}`}>{lib.status}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${lib.dot} ${lib.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-black/80 border border-white/10 rounded-[2rem] p-6 font-mono text-xs text-green-400 h-64 overflow-y-auto relative shadow-inner">
            <div className="flex items-center gap-2 text-gray-500 mb-4 sticky top-0 bg-black/80 py-1">
              <Terminal className="w-4 h-4" /> SYSTEM_LOGS
            </div>
            {logs.length === 0 ? (
              <div className="text-gray-600">Waiting for input...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-2 animate-pulse">{log}</div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 border-t border-white/5 mt-12 py-6 text-center">
        <p className="text-gray-500 text-xs tracking-widest uppercase font-mono">
          POWERED BY <span className="text-cyan-500 font-bold">GIGA LAUGH CORP</span> © 2026
        </p>
      </footer>

      {/* Custom CSS for Scanning Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800%); }
        }
      `}} />
    </div>
  );
}
