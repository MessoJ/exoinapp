import React from 'react';
import { Phone, Mail, Globe, MapPin, QrCode, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// --- SHARED LOGO COMPONENT (Fixed for html2canvas compatibility) ---
export const CardLogo = ({ variant = 'dark', scale = 1, iconOnly = false, forExport = false }) => {
  // Check for monochrome
  const isMonochrome = variant === 'monochrome';
  
  // Colors - using explicit hex values for html2canvas compatibility
  const fillColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#1E3A8A';
  const accentColor = isMonochrome ? '#FFFFFF' : '#F97316';
  const textColor = (variant === 'dark' || isMonochrome) ? '#FFFFFF' : '#0f172a';
  const subTextColor = (variant === 'dark' || isMonochrome) ? '#94a3b8' : '#64748b';
  
  // Container size based on scale
  const iconSize = 40 * scale;
  const fontSize = 24 * scale;
  const smallFontSize = 6 * scale;
  const gap = 10 * scale;
  const dotSize = 5 * scale;
  
  // SEPARATE CONFIGURATION FOR PREVIEW AND EXPORT
  // This ensures we can tune them independently to match visually
  
  // Preview: 75% looks balanced on screen
  const cutLineTopPreview = fontSize * 0.75;
  
  // Export: Needs to be lower (higher %) because of the text shift/rendering differences
  const cutLineTopExport = fontSize * 0.88; 

  const cutLineTop = forExport ? cutLineTopExport : cutLineTopPreview;
  
  // Reduced cut height for a thinner, more subtle cut
  const cutLineHeight = 1.2 * scale;

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
          {/* EXOIN text with cut line */}
          <div style={{ position: 'relative', lineHeight: 1 }}>
            
            {/* PREVIEW MODE: Use clip-path for perfect rendering */}
            {!forExport ? (
              <>
                {/* Top Part */}
                <span style={{ 
                  fontSize: `${fontSize}px`, 
                  fontWeight: 900, 
                  letterSpacing: '-0.02em', 
                  color: textColor,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  lineHeight: 1,
                  display: 'block',
                  clipPath: `polygon(0 0, 100% 0, 100% ${cutLineTop}px, 0 ${cutLineTop}px)`
                }}>
                  EXOIN
                </span>
                {/* Bottom Part */}
                <span style={{ 
                  fontSize: `${fontSize}px`, 
                  fontWeight: 900, 
                  letterSpacing: '-0.02em', 
                  color: textColor,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  lineHeight: 1,
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  clipPath: `polygon(0 ${cutLineTop + cutLineHeight}px, 100% ${cutLineTop + cutLineHeight}px, 100% 100%, 0 100%)`
                }}>
                  EXOIN
                </span>
              </>
            ) : (
              /* EXPORT MODE: Use solid line overlay (most robust for html2canvas layout) */
              <>
                 <span style={{ 
                   fontSize: `${fontSize}px`, 
                   fontWeight: 900, 
                   letterSpacing: '-0.02em', 
                   color: textColor,
                   fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                   lineHeight: 0.8, // Very tight line height to pull text up
                   display: 'block',
                   whiteSpace: 'nowrap',
                   marginTop: `-${4 * scale}px`, // Pull EXOIN up significantly
                   marginBottom: `${10 * scale}px`, // Large margin to force separation from dot
                 }}>
                   EXOIN
                 </span>

                 {/* Cut Line Overlay */}
                 <div style={{
                   position: 'absolute',
                   top: `${cutLineTop}px`, 
                   left: '-5%', 
                   width: '110%',
                   height: `${cutLineHeight}px`,
                   backgroundColor: '#000000', 
                   zIndex: 10
                 }}></div>
              </>
            )}
          </div>
          
          {/* AFRICA subtitle with dot */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            gap: `${3 * scale}px`,
            marginTop: forExport ? 0 : `${2 * scale}px`
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
    <div className="flex flex-col xl:flex-row gap-16 items-center animate-in fade-in zoom-in duration-500">
      
      {/* FRONT: The "Black Mirror" Look */}
      <div className="relative w-[450px] h-[270px] rounded-2xl overflow-hidden border border-slate-800 bg-black group" id="card-front" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
         
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
              backgroundColor: 'rgba(0,0,0,0.4)', 
              backdropFilter: 'blur(12px)',
              borderRadius: '9999px', 
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <CardLogo variant="dark" scale={1.5} forExport={forExport} />
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
      <div className="relative w-[450px] h-[270px] rounded-2xl shadow-2xl overflow-hidden bg-white flex" id="card-back">
         
         {/* Left: Dark Data Spine */}
         <div className="w-1/3 bg-[#0F172A] relative flex flex-col items-center justify-between border-r-4 border-orange-500 py-8">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="flex flex-col items-center">
                {/* Beautiful QR Code with Logo */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-white to-slate-100 p-2.5 rounded-xl shadow-lg border border-white/20 mb-4">
                    {showQRCode ? (
                      <div className="relative">
                        <QRCodeSVG 
                          value={vCardData}
                          size={72}
                          level="H"
                          bgColor="transparent"
                          fgColor="#0F172A"
                          includeMargin={false}
                        />
                        {/* Monochrome white logo overlay in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                            <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4">
                              <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="#0F172A" />
                              <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="#0F172A" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <QrCode size={72} className="text-[#0F172A]" />
                    )}
                  </div>
                  {/* Decorative corner accents */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-orange-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-orange-500 rounded-br-lg"></div>
                </div>
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest text-center">Scan to<br/>Save Contact</span>
            </div>

            {/* UPDATED: Monochrome Icon Alone (No Opacity for Pure White) */}
            <div className="">
                <CardLogo variant="monochrome" iconOnly={true} scale={0.8} forExport={forExport} />
            </div>
         </div>

         {/* Right: Clean Info Area */}
         <div className="w-2/3 p-8 flex flex-col justify-center relative">

            <div className="mb-6">
               <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">{fullName}</h3>
               <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold uppercase rounded">Verified</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{jobTitle}</span>
               </div>
            </div>

            <div className="space-y-2">
               <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                     <Smartphone size={12} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{phone}</span>
               </div>
               <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                     <Mail size={12} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{email}</span>
               </div>
               <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                     <Globe size={12} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{website}</span>
               </div>
               {address && (
                 <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                       <MapPin size={12} />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{address}</span>
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
