import { useState } from 'react';
import { Radio, Network, Smartphone, Volume2, Shield } from 'lucide-react';

interface SettingsProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const Settings = ({ showToast }: SettingsProps) => {
  const [vpnToggle, setVpnToggle] = useState(false);
  const [scriptToggle, setScriptToggle] = useState(false);
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [audioQuality, setAudioQuality] = useState('high');

  // Risk Score calculation
  let riskScore = "Green";
  let riskMessage = "Safe & Secure";
  let riskColor = "text-accent-success bg-accent-success/10 border-accent-success/20";
  let glowColorClass = "glow-green";

  if (scriptToggle) {
    riskScore = "Red (Critical)";
    riskMessage = "Automated Script / Bot Detected!";
    riskColor = "text-accent-danger bg-accent-danger/10 border-accent-danger/20";
    glowColorClass = "glow-danger shadow-[0_0_30px_rgba(255,77,109,0.15)]";
  } else if (vpnToggle) {
    riskScore = "Yellow (Warning)";
    riskMessage = "VPN/Proxy Active - Withdrawal Block Risk";
    riskColor = "text-accent-warning bg-accent-warning/10 border-accent-warning/20";
    glowColorClass = "glow-warning shadow-[0_0_30px_rgba(255,200,87,0.15)]";
  }

  const handleVpnToggle = (val: boolean) => {
    setVpnToggle(val);
    if (val) {
      showToast("VPN/Proxy signature detected. Withdrawal threshold elevated.", "warning");
    } else {
      showToast("Proxy check: Signature normal.", "success");
    }
  };

  const handleScriptToggle = (val: boolean) => {
    setScriptToggle(val);
    if (val) {
      showToast("Honeypot alert: Automation trigger activated. Account flags raised.", "error");
    } else {
      showToast("Automation check: Restored to standard node parameters.", "info");
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Security</h1>
        <p className="text-xs text-slate-400 mt-1">Configure node audio parameters and verify security credentials.</p>
      </div>

      {/* Security Center Shield Card */}
      <div className={`glass-panel p-5 rounded-[24px] border-white/6 flex items-center justify-between relative overflow-hidden transition-all duration-500 ${glowColorClass}`}>
        <div className="flex-1 pr-3">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Node Security Analyzer</span>
          <h2 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
            Anti-Sybil Credentials
          </h2>
          <p className="text-[10px] text-slate-400 leading-normal mb-3">
            Status: <span className="font-semibold text-white">{riskMessage}</span>
          </p>
          
          {/* Risk Level Badge */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold w-fit flex items-center gap-1.5 transition-all ${riskColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
            <span>Risk Score: {riskScore}</span>
          </div>
        </div>

        {/* Shield SVG Illustration */}
        <div className="w-20 h-20 relative shrink-0 flex items-center justify-center">
          <svg width="68" height="68" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#B388FF" />
              </linearGradient>
            </defs>
            <path
              d="M50 15 C65 15, 80 20, 80 35 C80 60, 50 85, 50 85 C50 85, 20 60, 20 35 C20 20, 35 15, 50 15 Z"
              fill="url(#shieldGrad)"
              stroke="url(#glowBorder)"
              strokeWidth="2.5"
            />
            {/* Center Lock or Checkmark */}
            {riskScore.includes("Green") ? (
              <path d="M40 50 L47 57 L62 42" fill="none" stroke="#00FF88" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            ) : riskScore.includes("Yellow") ? (
              <path d="M50 35 L50 55 M50 65 L50 67" fill="none" stroke="#FFC857" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <path d="M38 38 L62 62 M62 38 L38 62" fill="none" stroke="#FF4D6D" strokeWidth="4" strokeLinecap="round" />
            )}
          </svg>
        </div>
      </div>

      {/* Interactive Anti-Cheat Testing switches */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Simulate Network Threat Flags</span>
        
        {/* Toggle 1: VPN */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Network size={14} className="text-slate-400" />
              VPN / Proxy Routing
            </span>
            <span className="text-[10px] text-slate-500">Inject artificial proxy routing metadata</span>
          </div>
          <button 
            onClick={() => handleVpnToggle(!vpnToggle)}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${vpnToggle ? 'bg-accent-warning' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${vpnToggle ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="w-full h-[1px] bg-white/5"></div>

        {/* Toggle 2: Automation script check */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Smartphone size={14} className="text-slate-400" />
              Bot Script Honeypot
            </span>
            <span className="text-[10px] text-slate-500">Simulate automation clicker tool injection</span>
          </div>
          <button 
            onClick={() => handleScriptToggle(!scriptToggle)}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${scriptToggle ? 'bg-accent-danger' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${scriptToggle ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Elite Music / App Settings */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">App Customizations</span>

        {/* Audio Quality Select */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Radio size={14} className="text-slate-400" />
              Audio Quality
            </span>
            <span className="text-[10px] text-slate-500">Spatial soundtrack output bitrate</span>
          </div>
          <select 
            value={audioQuality}
            onChange={(e) => {
              setAudioQuality(e.target.value);
              showToast(`Audio quality configured to: ${e.target.value.toUpperCase()}`, "info");
            }}
            className="bg-[#12182D] border border-white/8 text-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none cursor-pointer"
          >
            <option value="high">320kbps (High)</option>
            <option value="medium">192kbps (Standard)</option>
            <option value="spatial">Spatial (Dolby)</option>
          </select>
        </div>

        <div className="w-full h-[1px] bg-white/5"></div>

        {/* Spatial Audio Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 size={14} className="text-slate-400" />
              Spatial Audio Surround
            </span>
            <span className="text-[10px] text-slate-500">Virtual 3D ambient listening fields</span>
          </div>
          <button 
            onClick={() => {
              setSpatialAudio(!spatialAudio);
              showToast(spatialAudio ? "Spatial audio disabled" : "Spatial audio surround enabled", "info");
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${spatialAudio ? 'bg-accent-cyan' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${spatialAudio ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="w-full h-[1px] bg-white/5"></div>

        {/* Download Over WiFi only */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield size={14} className="text-slate-400" />
              Download Over Wi-Fi Only
            </span>
            <span className="text-[10px] text-slate-500">Save mobile data bandwidth</span>
          </div>
          <button 
            onClick={() => setWifiOnly(!wifiOnly)}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${wifiOnly ? 'bg-accent-cyan' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${wifiOnly ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>


    </div>
  );
};

