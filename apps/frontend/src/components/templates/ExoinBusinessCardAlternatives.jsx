import React from 'react';
import { Phone, Mail, Globe, MapPin, QrCode, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// --- SHARED LOGO COMPONENT (Consistent rendering for preview and export) ---
export const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false, forExport = false, bgColor = null }) => {
  // Check for monochrome
  const isMonochrome = variant === 'monochrome';
  
  // Colors - using explicit hex values for html2canvas compatibility
  const fillColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#1E3A8A';
  const accentColor = isMonochrome ? '#FFFFFF' : '#F97316';
  const textColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#0f172a';
  const subTextColor = (variant === 'dark' || isMonochrome) ? '#94a3b8' : '#64748b';
  // Background for cut line - use provided bgColor or default based on variant
  const cutLineColor = bgColor || ((variant === 'dark' || isMonochrome) ? '#0a0a0a' : '#FFFFFF');
  
  // Container size based on scale
  const iconSize = 40 * scale;
  const fontSize = 24 * scale;
  const smallFontSize = 6 * scale;
  const gap = 10 * scale;
  const dotSize = 5 * scale;
  
  // Cut line dimensions - thin line at ~70% from top of text
  const cutLineHeight = 1.5 * scale;
  
  // SVG text dimensions for "EXOIN"
  const textWidth = 85 * scale;
  const textHeight = fontSize;
  const cutLineY = fontSize * 0.68; // 68% from top = where the cut line should be (matching the image)

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: iconOnly ? 0 : `${gap}px`,
    }}>
      {/* Icon */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        width={iconSize} 
        height={iconSize}
        style={{ flexShrink: 0, display: 'block' }}
      >
        <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill={fillColor} />
        <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill={accentColor} />
      </svg>
      
      {!iconOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* EXOIN text with cut line - Using SVG for pixel-perfect consistency */}
          <svg 
            width={textWidth} 
            height={textHeight} 
            viewBox={`0 0 ${textWidth} ${textHeight}`}
            style={{ display: 'block', overflow: 'visible' }}
          >
            {/* EXOIN text - white/monochrome */}
            <text
              x="0"
              y={fontSize * 0.76}
              fill={textColor}
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              EXOIN
            </text>
            {/* Cut line - thin horizontal line cutting through letters */}
            <rect
              x="0"
              y={cutLineY}
              width={textWidth}
              height={cutLineHeight}
              fill={cutLineColor}
            />
          </svg>
          
          {/* AFRICA subtitle with dot */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            gap: `${3 * scale}px`,
            marginTop: `${2 * scale}px`
          }}>
            <div style={{ 
              width: `${dotSize}px`, 
              height: `${dotSize}px`, 
              borderRadius: '50%', 
              backgroundColor: '#F97316'
            }} />
            <span style={{ 
              fontSize: `${smallFontSize}px`, 
              fontWeight: 600, 
              letterSpacing: '0.25em', 
              textTransform: 'uppercase', 
              color: subTextColor 
            }}>AFRICA</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const BusinessCardTemplate = ({ data = {}, showQRCode = true, forExport = false }) => {
  const { 
    fullName = "John Doe", 
    jobTitle = "Chief of Operations", 
    phone = "+254 700 000 000", 
    email = "john@exoin.africa", 
    website = "exoin.africa",
    address = "Nairobi, Kenya"
  } = data;

  // Parse full name into first and last name for vCard N field
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Generate vCard data for QR code
  // N field format: LastName;FirstName;MiddleName;Prefix;Suffix
  const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${fullName}
TITLE:${jobTitle}
TEL:${phone}
EMAIL:${email}
URL:https://${website}
ADR:;;${address};;;
ORG:Exoin Africa
END:VCARD`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', alignItems: 'center' }}>
      
      {/* FRONT: The "Black Mirror" Look */}
      <div id="card-front" style={{ 
        position: 'relative', 
        width: '450px', 
        height: '270px', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid #1E293B', 
        backgroundColor: '#000000',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)' 
      }}>
         
         {/* Ambient Tech Glow */}
         <div style={{
           position: 'absolute',
           top: '-135px',
           left: '-90px',
           width: '675px',
           height: '405px',
           background: 'linear-gradient(to bottom right, rgba(30, 58, 138, 0.2), transparent, rgba(194, 65, 12, 0.2))',
           opacity: 0.5
         }}></div>
         
         {/* The "Circuit" Grid */}
         <div style={{
           position: 'absolute',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           opacity: 0.2,
           backgroundImage: 'linear-gradient(#1E3A8A 1px, transparent 1px), linear-gradient(90deg, #1E3A8A 1px, transparent 1px)',
           backgroundSize: '40px 40px'
         }}></div>

         {/* Center Focus */}
         <div style={{
           position: 'absolute',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 10
         }}>
            <div style={{ 
              padding: '32px', 
              backgroundColor: '#0a0a0a', 
              borderRadius: '9999px', 
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <CardLogo variant="dark" scale={1.5} forExport={forExport} bgColor="#0a0a0a" />
            </div>
         </div>

         {/* Holographic Edge */}
         <div style={{
           position: 'absolute',
           bottom: 0,
           left: 0,
           width: '100%',
           height: '4px',
           background: 'linear-gradient(to right, #3b82f6, #ffffff, #f97316)',
           opacity: 0.5
         }}></div>
      </div>

      {/* BACK: The "Data Key" Layout */}
      <div id="card-back" style={{ 
        position: 'relative', 
        width: '450px', 
        height: '270px', 
        borderRadius: '16px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
        overflow: 'hidden', 
        backgroundColor: '#FFFFFF', 
        display: 'flex' 
      }}>
         
         {/* Left: Dark Data Spine */}
         <div style={{ 
           width: '33.333333%', 
           position: 'relative', 
           display: 'flex', 
           flexDirection: 'column', 
           alignItems: 'center', 
           justifyContent: 'space-between', 
           paddingTop: '32px', 
           paddingBottom: '32px',
           backgroundColor: '#0F172A', 
           borderRight: '4px solid #F97316' 
         }}>
            {/* Subtle pattern - CSS only, no external URL */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.1,
              backgroundImage: 'linear-gradient(45deg, #1E3A8A 25%, transparent 25%), linear-gradient(-45deg, #1E3A8A 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1E3A8A 75%), linear-gradient(-45deg, transparent 75%, #1E3A8A 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Beautiful QR Code with Logo */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    background: 'linear-gradient(to bottom right, #FFFFFF, #F1F5F9)', 
                    padding: '8px', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    marginBottom: '12px'
                  }}>
                    {showQRCode ? (
                      <div style={{ position: 'relative' }}>
                        <QRCodeSVG 
                          value={vCardData}
                          size={100}
                          level="M"
                          bgColor="transparent"
                          fgColor="#0F172A"
                          includeMargin={false}
                        />
                        {/* Monochrome white logo overlay in center */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '24px', height: '24px', backgroundColor: '#FFFFFF', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 100 100" fill="none" style={{ width: '20px', height: '20px' }}>
                              <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="#0F172A" />
                              <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="#0F172A" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <QrCode size={100} className="text-[#0F172A]" />
                    )}
                  </div>
                  {/* Decorative corner accents */}
                  <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '12px', height: '12px', borderTop: '2px solid #F97316', borderLeft: '2px solid #F97316', borderTopLeftRadius: '8px' }}></div>
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px', borderTop: '2px solid #3B82F6', borderRight: '2px solid #3B82F6', borderTopRightRadius: '8px' }}></div>
                  <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '12px', height: '12px', borderBottom: '2px solid #3B82F6', borderLeft: '2px solid #3B82F6', borderBottomLeftRadius: '8px' }}></div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '12px', height: '12px', borderBottom: '2px solid #F97316', borderRight: '2px solid #F97316', borderBottomRightRadius: '8px' }}></div>
                </div>
                <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', display: 'block' }}>Scan to<br/>Save Contact</span>
            </div>

            {/* UPDATED: Monochrome Icon Alone (No Opacity for Pure White) */}
            <div>
                <CardLogo variant="monochrome" iconOnly={true} scale={0.8} forExport={forExport} bgColor="#0F172A" />
            </div>
         </div>

         {/* Right: Clean Info Area */}
         <div style={{ width: '66.666667%', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>

            <div style={{ marginBottom: '24px' }}>
               <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', lineHeight: 1, marginBottom: '12px' }}>{fullName}</h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Verified badge as SVG for consistent export */}
                  <svg width="52" height="16" viewBox="0 0 52 16" style={{ display: 'block', flexShrink: 0 }}>
                    <rect x="0" y="0" width="52" height="16" rx="3" fill="#F97316" />
                    <text 
                      x="26" 
                      y="11.5" 
                      fill="#FFFFFF" 
                      textAnchor="middle"
                      style={{ 
                        fontSize: '8px', 
                        fontWeight: 700, 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}
                    >
                      VERIFIED
                    </text>
                  </svg>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{jobTitle}</span>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                     <Smartphone size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{phone}</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                     <Mail size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{email}</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                     <Globe size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{website}</span>
               </div>
               {address && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                       <MapPin size={12} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{address}</span>
                 </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
};

const ExoinBusinessCardAlternatives = () => {
  // Option B is the chosen direction

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center py-12 px-4">
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Your Identity</h2>
        <p className="text-slate-500 text-sm">Comparing two premium design directions</p>
      </div>

      <BusinessCardTemplate />

      {/* Material Notes */}
      <div className="mt-16 max-w-2xl text-center border-t border-slate-200 pt-8">
         <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Designer's Note</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Option B uses a 'Dark Glass' aesthetic with a high-contrast vertical split. It feels like a piece of software hardware. Best for tech investors, innovators, and modern brands.
         </p>
      </div>

    </div>
  );
};

export default ExoinBusinessCardAlternatives;
