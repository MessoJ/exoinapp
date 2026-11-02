import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Globe, MapPin, Moon, Sun, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

// --- REUSABLE LOGO COMPONENT (Adaptive with Tighter Split) ---
export const SigLogo = ({ variant = 'light', scale = 1 }) => {
  const isDarkBg = variant === 'dark';

  const fillColor = isDarkBg ? '#FFFFFF' : '#1E3A8A';
  const accentColor = isDarkBg ? '#FFFFFF' : '#F97316';
  const textColor = isDarkBg ? 'text-white' : 'text-[#0F172A]';
  const subTextColor = isDarkBg ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="flex items-center gap-2" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
      <div className="h-6 w-6 relative flex-shrink-0">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
          <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
        </svg>
      </div>
      <div className="inline-flex flex-col justify-between h-5 py-0.5 w-fit">
          <div className="relative leading-none w-fit">
            <h1 
              className={`text-sm font-black tracking-tighter leading-none m-0 ${textColor}`} 
              style={{ 
                  fontFamily: 'sans-serif',
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 73%, 0% 73%, 0% 78%, 100% 78%, 100% 100%, 0% 100%)'
              }}
            >
                EXOIN
            </h1>
          </div>
          <div className="relative h-2 w-full flex items-center justify-end gap-0.5 pr-0">
            <div className={`w-0.5 h-0.5 rounded-full ${isDarkBg ? 'bg-white' : 'bg-orange-500'}`}></div>
            <span className={`text-[3.5px] font-bold tracking-[0.20em] -mr-[0.20em] uppercase leading-none ${subTextColor}`}>AFRICA</span>
          </div>
      </div>
    </div>
  );
};

export const EmailSignatureTemplate = ({ data, darkMode }) => {
    const {
        firstName,
        lastName,
        jobTitle,
        phone,
        email,
        website = "www.exoin.africa",
        avatarUrl
    } = data || {};

    const fullName = `${firstName || 'John'} ${lastName || 'Doe'}`;
    const title = jobTitle || 'Lead Systems Architect';
    const tel = phone || '+254 700 000 000';
    const mail = email || 'john.doe@exoin.africa';

    return (
        <div style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: darkMode ? '#F8FAFC' : '#0F172A',
            maxWidth: '500px',
            padding: '16px',
            background: darkMode ? '#020617' : '#FFFFFF',
            borderRadius: '8px',
            border: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
            display: 'inline-block'
        }}>
            <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        {/* Profile Image Column */}
                        {avatarUrl && (
                            <td style={{ verticalAlign: 'top', paddingRight: '16px' }}>
                                <img 
                                    src={avatarUrl} 
                                    alt={fullName} 
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }} 
                                />
                            </td>
                        )}
                        
                        {/* Info Column */}
                        <td style={{ verticalAlign: 'top', borderLeft: avatarUrl ? '2px solid #F97316' : 'none', paddingLeft: avatarUrl ? '16px' : '0' }}>
                            <div style={{ fontWeight: 800, fontSize: '16px', color: darkMode ? '#FFFFFF' : '#0F172A', textTransform: 'uppercase' }}>
                                {fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#F97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                {title}
                            </div>

                            <table cellPadding="0" cellSpacing="0" style={{ fontSize: '11px', color: darkMode ? '#94A3B8' : '#64748B', lineHeight: '1.4' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ paddingRight: '6px' }}>T:</td>
                                        <td><a href={`tel:${tel}`} style={{ color: 'inherit', textDecoration: 'none' }}>{tel}</a></td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingRight: '6px' }}>E:</td>
                                        <td><a href={`mailto:${mail}`} style={{ color: 'inherit', textDecoration: 'none' }}>{mail}</a></td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingRight: '6px' }}>W:</td>
                                        <td><a href={`https://${website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>{website}</a></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Logo */}
                            <div style={{ marginTop: '12px' }}>
                                <SigLogo variant={darkMode ? 'dark' : 'light'} scale={0.85} />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const ExoinEmailSignatures = () => {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const signatureRef = useRef(null);

    const userData = {
        firstName: user?.firstName || 'Meso',
        lastName: user?.lastName || 'Francis',
        jobTitle: user?.jobTitle || 'Executive Director',
        phone: user?.phone || '+254 739 443 244',
        email: user?.email || 'mesofrancis@outlook.com',
        website: 'www.exoin.africa'
    };

    const handleCopyHtml = () => {
        if (!signatureRef.current) return;
        const html = signatureRef.current.innerHTML;
        navigator.clipboard.writeText(html);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 transition-colors">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Email Signature</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Official Exoin Africa corporate email signature</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button 
                            onClick={handleCopyHtml}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                        >
                            {saved ? <Check size={16} /> : <Save size={16} />}
                            {saved ? 'Copied HTML!' : 'Copy Signature HTML'}
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
                    <div ref={signatureRef}>
                        <EmailSignatureTemplate data={userData} darkMode={darkMode} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExoinEmailSignatures;
