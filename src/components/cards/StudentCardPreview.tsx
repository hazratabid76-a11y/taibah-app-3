import React from 'react';
import {
  CardCustomDesign,
  PrincipalProfile,
  SchoolProfile,
} from '../../types';

export interface StudentCardPreviewProps {
  studentName: string;
  className: string;
  fatherName: string;
  dateOfBirth: string;
  studentPhone: string;
  parentPhone: string;
  studentNumber: string;
  admissionNumber?: string;
  academicYear: string;
  section?: string;
  address?: string;
  emergencyContact?: string;
  validUntil?: string;
  photoUrl: string;
  photoZoom?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  design: CardCustomDesign;
  side: 'front' | 'back';
  schoolProfile: SchoolProfile;
  principalProfile: PrincipalProfile;
  qrCodeUrl?: string;
  isPrintMode?: boolean;
  // Canva Editor Selection Props
  isEditable?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  scaleRatio?: number; // e.g. 1.0, 1.25, 1.5 for Canva zoom
}

export const StudentCardPreview: React.FC<StudentCardPreviewProps> = ({
  studentName,
  className,
  fatherName,
  dateOfBirth,
  studentPhone,
  parentPhone,
  studentNumber,
  admissionNumber,
  academicYear,
  section,
  address,
  emergencyContact,
  validUntil = '31 Mar 2027',
  photoUrl,
  photoZoom = 1.0,
  photoOffsetX = 0,
  photoOffsetY = 0,
  design,
  side,
  schoolProfile,
  principalProfile,
  qrCodeUrl,
  isPrintMode = false,
  isEditable = false,
  selectedElementId = null,
  onSelectElement,
  scaleRatio = 1.0,
}) => {
  const isLandscape = design.orientation === 'landscape';
  const template = design.template || 'royal-blue';
  const logoUrl = design.customLogoUrl || schoolProfile.logoUrl;

  const schoolName = design.customSchoolName || schoolProfile.name;
  const schoolLocation = design.customSchoolLocation || schoolProfile.location;

  // Template theme presets
  const getThemeColors = () => {
    switch (template) {
      case 'navy-gold':
        return {
          primary: '#0a1128',
          secondary: '#d97706',
          accent: '#f59e0b',
          bg: '#0a1128',
          cardBg: '#0b1329',
          text: '#f8fafc',
          textMuted: '#cbd5e1',
          border: '#d97706',
          badgeBg: '#d97706',
          badgeText: '#0a1128',
        };
      case 'modern-white-blue':
        return {
          primary: design.primaryColor || '#0284c7',
          secondary: '#0d9488',
          accent: '#06b6d4',
          bg: '#ffffff',
          cardBg: '#f8fafc',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#e2e8f0',
          badgeBg: '#0284c7',
          badgeText: '#ffffff',
        };
      case 'classic-identity':
        return {
          primary: '#1e3a8a',
          secondary: '#881337',
          accent: '#b45309',
          bg: '#ffffff',
          cardBg: '#fefce8',
          text: '#1e293b',
          textMuted: '#64748b',
          border: '#b45309',
          badgeBg: '#1e3a8a',
          badgeText: '#ffffff',
        };
      case 'modern-gradient':
        return {
          primary: '#2563eb',
          secondary: '#7c3aed',
          accent: '#06b6d4',
          bg: '#ffffff',
          cardBg: '#f8fafc',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#cbd5e1',
          badgeBg: '#2563eb',
          badgeText: '#ffffff',
        };
      case 'minimal-professional':
        return {
          primary: '#1e293b',
          secondary: '#475569',
          accent: '#0284c7',
          bg: '#ffffff',
          cardBg: '#ffffff',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#e2e8f0',
          badgeBg: '#1e293b',
          badgeText: '#ffffff',
        };
      case 'academic-crest':
        return {
          primary: '#15803d',
          secondary: '#b45309',
          accent: '#ca8a04',
          bg: '#ffffff',
          cardBg: '#f0fdf4',
          text: '#0f172a',
          textMuted: '#475569',
          border: '#15803d',
          badgeBg: '#15803d',
          badgeText: '#ffffff',
        };
      case 'premium-college':
        return {
          primary: '#4338ca',
          secondary: '#0284c7',
          accent: '#f59e0b',
          bg: '#ffffff',
          cardBg: '#eef2ff',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#cbd5e1',
          badgeBg: '#4338ca',
          badgeText: '#ffffff',
        };
      case 'royal-blue':
      default:
        return {
          primary: design.primaryColor || '#1d4ed8',
          secondary: design.secondaryColor || '#059669',
          accent: '#f59e0b',
          bg: '#ffffff',
          cardBg: '#f0f7ff',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#cbd5e1',
          badgeBg: '#1d4ed8',
          badgeText: '#ffffff',
        };
    }
  };

  const theme = getThemeColors();
  const primary = theme.primary;
  const isDarkCard = template === 'navy-gold';

  // Physical CR80 Dimensions:
  // Landscape: 85.60 × 53.98 mm (Ratio 1.5858: 340px × 214px)
  // Portrait: 53.98 × 85.60 mm (Ratio 0.6306: 220px × 348px)
  const cardWidth = isLandscape ? 340 : 220;
  const cardHeight = isLandscape ? 214 : 348;

  const cardStyle: React.CSSProperties = isPrintMode
    ? {
        width: isLandscape ? '85.60mm' : '53.98mm',
        height: isLandscape ? '53.98mm' : '85.60mm',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${design.borderRadius || 6}px`,
        backgroundColor: isDarkCard ? '#0a1128' : (design.backgroundColor || '#ffffff'),
        color: isDarkCard ? '#f8fafc' : (design.textColor || '#0f172a'),
        fontFamily: design.fontFamily || 'Plus Jakarta Sans',
        border:
          isDarkCard
            ? '1.5px solid #d97706'
            : design.borderStyle && design.borderStyle !== 'none'
            ? `1.5px ${design.borderStyle} ${design.borderColor || '#cbd5e1'}`
            : '1px solid #cbd5e1',
      }
    : {
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${design.borderRadius || 8}px`,
        backgroundColor: isDarkCard ? '#0a1128' : (design.backgroundColor || '#ffffff'),
        color: isDarkCard ? '#f8fafc' : (design.textColor || '#0f172a'),
        fontFamily: design.fontFamily || 'Plus Jakarta Sans',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        border:
          isDarkCard
            ? '2px solid #d97706'
            : design.borderStyle && design.borderStyle !== 'none'
            ? `2px ${design.borderStyle} ${design.borderColor || '#cbd5e1'}`
            : '1px solid #cbd5e1',
        transform: scaleRatio !== 1.0 ? `scale(${scaleRatio})` : undefined,
        transformOrigin: 'top center',
      };

  // Background image layer
  const bgImage = side === 'front' ? design.frontBgImage : design.backBgImage;
  const bgOpacity = side === 'front' ? design.frontBgOpacity ?? 0.18 : design.backBgOpacity ?? 0.22;
  const bgFit = side === 'front' ? design.frontBgFit || 'cover' : design.backBgFit || 'cover';

  // Helper to wrap selectable elements in Canva editor mode
  const wrapSelectable = (
    elementId: string,
    children: React.ReactNode,
    className: string = '',
    style?: React.CSSProperties
  ) => {
    if (!isEditable) {
      return (
        <div className={className} style={style}>
          {children}
        </div>
      );
    }

    const isSelected = selectedElementId === elementId;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.(elementId);
        }}
        className={`${className} cursor-pointer transition-all duration-150 relative ${
          isSelected
            ? 'ring-2 ring-blue-500 ring-offset-1 rounded-sm bg-blue-50/20 z-30'
            : 'hover:outline-1 hover:outline-dashed hover:outline-blue-400/80 rounded-sm'
        }`}
        style={style}
        title={isEditable ? `Click to edit ${elementId}` : undefined}
      >
        {children}
        {isSelected && (
          <span className="absolute -top-3.5 left-0 text-[7px] font-bold text-white bg-blue-600 px-1 py-0.2 rounded-t shadow-xs tracking-wider uppercase pointer-events-none z-40">
            {elementId.replace(/-/g, ' ')}
          </span>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // BACK SIDE RENDERER
  // -------------------------------------------------------------
  if (side === 'back') {
    return (
      <div
        style={cardStyle}
        onClick={() => isEditable && onSelectElement?.('card-bg')}
        className={`select-none flex flex-col justify-between p-2.5 ${
          isDarkCard ? 'bg-[#0a1128] text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Background Image Layer */}
        {bgImage && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: bgFit === 'center' ? 'auto' : bgFit,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: bgOpacity,
            }}
          />
        )}

        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          {/* Header */}
          {wrapSelectable(
            'back-header',
            <div
              className={`pb-1 mb-1 border-b flex items-center justify-between ${
                isDarkCard ? 'border-amber-600' : ''
              }`}
              style={{ borderColor: isDarkCard ? '#d97706' : primary }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {design.showBackLogo && logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain shrink-0 rounded-full bg-white p-0.5" />
                )}
                <div className="leading-tight overflow-hidden">
                  <div
                    className="font-bold text-[8.5px] uppercase tracking-wide truncate max-w-[190px]"
                    style={{ color: isDarkCard ? '#fbbf24' : primary }}
                  >
                    {schoolName}
                  </div>
                  <div className={`text-[6.5px] font-medium truncate ${isDarkCard ? 'text-amber-200/80' : 'text-slate-500'}`}>
                    {schoolLocation}
                  </div>
                </div>
              </div>
              <div
                className="text-[7.5px] font-bold uppercase px-1.5 py-0.5 rounded text-white shrink-0"
                style={{ backgroundColor: isDarkCard ? '#d97706' : primary }}
              >
                Official ID
              </div>
            </div>
          )}

          {/* Middle Body */}
          {isLandscape ? (
            // Landscape Back Body: 2 Columns
            <div className="flex-1 flex gap-2 overflow-hidden my-0.5">
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {design.showBackRules &&
                  wrapSelectable(
                    'back-rules',
                    <div
                      style={{
                        transform: `translate(${design.credentialsOffsetX || 0}px, ${design.credentialsOffsetY || 0}px)`,
                      }}
                    >
                      <div
                        className="font-bold uppercase mb-0.5 truncate"
                        style={{
                          fontSize: `${design.backTitleFontSize || 7.5}px`,
                          color: design.backTitleColor || (isDarkCard ? '#fbbf24' : '#0f172a'),
                          fontFamily: design.backTitleFontFamily || 'inherit',
                          textAlign: design.backTitleAlign || 'left',
                        }}
                      >
                        {design.backTitle || 'Instructions & Terms'}
                      </div>
                      <p
                        className="leading-[1.3] whitespace-pre-line line-clamp-4"
                        style={{
                          fontSize: `${design.instructionsFontSize || 6.8}px`,
                          color: design.instructionsColor || (isDarkCard ? '#cbd5e1' : '#334155'),
                          fontFamily: design.instructionsFontFamily || 'inherit',
                          textAlign: design.instructionsAlign || 'left',
                        }}
                      >
                        {design.instructions ||
                          '1. Card must be presented upon request during school hours.\n2. Non-transferable.\n3. Found cards must be returned to administration.'}
                      </p>
                    </div>
                  )}

                {/* Dynamic Custom Text Elements on Back Side */}
                {design.backCustomElements && design.backCustomElements.length > 0 && (
                  <div className="space-y-0.5 py-0.5">
                    {design.backCustomElements.map((elem) =>
                      wrapSelectable(
                        `back-elem-${elem.id}`,
                        <div
                          key={elem.id}
                          style={{
                            fontSize: `${elem.fontSize || 7}px`,
                            color: elem.color || (isDarkCard ? '#ffffff' : '#0f172a'),
                            fontFamily: elem.fontFamily || 'inherit',
                            textAlign: elem.align || 'left',
                            transform: `translate(${elem.offsetX || 0}px, ${elem.offsetY || 0}px)`,
                          }}
                          className="leading-tight py-0.5 truncate"
                        >
                          {elem.label && <span className="font-bold mr-1">{elem.label}:</span>}
                          <span>{elem.text || elem.content}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className={`space-y-0.5 pt-1 border-t text-[6.8px] ${isDarkCard ? 'border-slate-800' : 'border-slate-100'}`}>
                  {design.showBackEmergency && (
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${isDarkCard ? 'text-amber-400' : 'text-slate-800'}`}>Emergency:</span>
                      <span className="text-rose-500 font-bold">{emergencyContact || design.emergencyContactText}</span>
                    </div>
                  )}
                  {design.showBackParentContact && parentPhone && (
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${isDarkCard ? 'text-slate-300' : 'text-slate-800'}`}>Parent Phone:</span>
                      <span className={isDarkCard ? 'text-slate-200' : 'text-slate-800'}>{parentPhone}</span>
                    </div>
                  )}
                  {design.showBackAddress && address && (
                    <div className="flex items-start gap-1">
                      <span className={`font-bold shrink-0 ${isDarkCard ? 'text-slate-300' : 'text-slate-800'}`}>Address:</span>
                      <span className={`truncate ${isDarkCard ? 'text-slate-300' : 'text-slate-600'}`}>{address}</span>
                    </div>
                  )}
                  {design.additionalCustomText && (
                    <div className={`text-[6px] italic pt-0.5 ${isDarkCard ? 'text-amber-300/80' : 'text-slate-500'}`}>
                      {design.additionalCustomText}
                    </div>
                  )}
                </div>
              </div>

              {/* Scannable / Uploaded QR Code */}
              {design.showBackQrCode && (design.qrPlacementSide === 'back' || design.qrPlacementSide === 'both' || !design.qrPlacementSide) &&
                wrapSelectable(
                  'back-qr',
                  <div
                    style={{
                      transform: `translate(${design.qrOffsetX || 0}px, ${design.qrOffsetY || 0}px)`,
                    }}
                    className={`flex flex-col items-center justify-center shrink-0 p-1 rounded border ${
                      isDarkCard ? 'bg-[#0f172a] border-amber-600/40 text-amber-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {(design.uploadedQrCodeUrl || qrCodeUrl) ? (
                      <img
                        src={design.uploadedQrCodeUrl || qrCodeUrl}
                        alt="Scannable QR Code"
                        style={{
                          width: `${design.qrSize || 48}px`,
                          height: `${design.qrSize || 48}px`,
                        }}
                        className="object-contain rounded bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div
                        style={{
                          width: `${design.qrSize || 48}px`,
                          height: `${design.qrSize || 48}px`,
                        }}
                        className="bg-slate-200 rounded flex items-center justify-center text-[6px] text-slate-500 shrink-0"
                      >
                        QR Code
                      </div>
                    )}
                    <span className="text-[5.5px] font-bold mt-0.5 text-center leading-none">
                      Scan to Verify
                    </span>
                  </div>
                )}
            </div>
          ) : (
            // Portrait Back Body: Vertically Stacked with NO CLIPPING
            <div className="flex-1 flex flex-col justify-between my-0.5 space-y-1 overflow-hidden">
              {design.showBackRules &&
                wrapSelectable(
                  'back-rules',
                  <div>
                    <div
                      className="font-bold uppercase mb-0.5 truncate"
                      style={{
                        fontSize: `${design.backTitleFontSize || 7.5}px`,
                        color: design.backTitleColor || (isDarkCard ? '#fbbf24' : '#0f172a'),
                        fontFamily: design.backTitleFontFamily || 'inherit',
                        textAlign: design.backTitleAlign || 'left',
                      }}
                    >
                      {design.backTitle || 'Card Rules & Policy'}
                    </div>
                    <p
                      className="leading-[1.3] whitespace-pre-line line-clamp-4"
                      style={{
                        fontSize: `${design.instructionsFontSize || 6.8}px`,
                        color: design.instructionsColor || (isDarkCard ? '#cbd5e1' : '#334155'),
                        fontFamily: design.instructionsFontFamily || 'inherit',
                        textAlign: design.instructionsAlign || 'left',
                      }}
                    >
                      {design.instructions}
                    </p>
                  </div>
                )}

              {/* Dynamic Custom Text Elements on Back Side (Portrait) */}
              {design.backCustomElements && design.backCustomElements.length > 0 && (
                <div className="space-y-0.5 py-0.5">
                  {design.backCustomElements.map((elem) =>
                    wrapSelectable(
                      `back-elem-${elem.id}`,
                      <div
                        key={elem.id}
                        style={{
                          fontSize: `${elem.fontSize || 7}px`,
                          color: elem.color || (isDarkCard ? '#ffffff' : '#0f172a'),
                          fontFamily: elem.fontFamily || 'inherit',
                          textAlign: elem.align || 'left',
                          transform: `translate(${elem.offsetX || 0}px, ${elem.offsetY || 0}px)`,
                        }}
                        className="leading-tight py-0.5 truncate"
                      >
                        {elem.label && <span className="font-bold mr-1">{elem.label}:</span>}
                        <span>{elem.text || elem.content}</span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Scannable QR Code in Center */}
              {design.showBackQrCode && (design.qrPlacementSide === 'back' || design.qrPlacementSide === 'both' || !design.qrPlacementSide) &&
                wrapSelectable(
                  'back-qr',
                  <div
                    style={{
                      transform: `translate(${design.qrOffsetX || 0}px, ${design.qrOffsetY || 0}px)`,
                    }}
                    className={`flex items-center justify-center gap-2 p-1 rounded border ${
                      isDarkCard ? 'bg-[#0f172a] border-amber-600/40' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {(design.uploadedQrCodeUrl || qrCodeUrl) ? (
                      <img
                        src={design.uploadedQrCodeUrl || qrCodeUrl}
                        alt="QR Code"
                        style={{
                          width: `${design.qrSize || 44}px`,
                          height: `${design.qrSize || 44}px`,
                        }}
                        className="object-contain rounded bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div
                        style={{
                          width: `${design.qrSize || 44}px`,
                          height: `${design.qrSize || 44}px`,
                        }}
                        className="bg-slate-200 rounded flex items-center justify-center text-[6px] text-slate-500 shrink-0"
                      >
                        QR Code
                      </div>
                    )}
                    <div className="text-[6.5px] leading-tight flex-1">
                      <div className={`font-bold ${isDarkCard ? 'text-amber-300' : 'text-slate-900'}`}>Instant Verification</div>
                      <div className={isDarkCard ? 'text-slate-400' : 'text-slate-500'}>Scan via any smartphone to verify credentials</div>
                    </div>
                  </div>
                )}

              <div className={`space-y-0.5 text-[6.8px] pt-1 border-t ${isDarkCard ? 'border-slate-800' : 'border-slate-100'}`}>
                {design.showBackEmergency && (
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkCard ? 'text-amber-400' : 'text-slate-700'}`}>Emergency:</span>
                    <span className="text-rose-500 font-bold">{emergencyContact || design.emergencyContactText}</span>
                  </div>
                )}
                {design.showBackParentContact && parentPhone && (
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkCard ? 'text-slate-300' : 'text-slate-700'}`}>Parent/Guardian:</span>
                    <span className={isDarkCard ? 'text-slate-200' : 'text-slate-800 font-medium'}>{parentPhone}</span>
                  </div>
                )}
                {design.showBackAddress && address && (
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkCard ? 'text-slate-300' : 'text-slate-700'}`}>Address:</span>
                    <span className={`truncate max-w-[130px] ${isDarkCard ? 'text-slate-300' : 'text-slate-600'}`}>{address}</span>
                  </div>
                )}
                {design.additionalCustomText && (
                  <div className={`text-[6px] italic pt-0.5 ${isDarkCard ? 'text-amber-300/80' : 'text-slate-500'}`}>
                    {design.additionalCustomText}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {wrapSelectable(
            'back-footer',
            <div className={`pt-1 mt-0.5 border-t flex items-center justify-between text-[6.5px] ${
              isDarkCard ? 'border-amber-600/40 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <div className="truncate max-w-[140px]">
                {design.schoolContactText || schoolProfile.address}
              </div>

              {design.showBackSignature && (
                <div className="flex flex-col items-center shrink-0">
                  {principalProfile.signatureUrl ? (
                    <img
                      src={principalProfile.signatureUrl}
                      alt="Signature"
                      className="h-3.5 object-contain"
                    />
                  ) : (
                    <div className={`w-12 border-b mb-0.5 ${isDarkCard ? 'border-amber-500' : 'border-slate-400'}`} />
                  )}
                  <span className={`text-[5.5px] font-bold ${isDarkCard ? 'text-amber-300' : 'text-slate-700'}`}>Principal Signature</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FRONT SIDE RENDERER: 8 DISTINCT TEMPLATES IN BOTH ORIENTATIONS
  // -------------------------------------------------------------

  // Student Photo Element Helper
  const photoW = design.photoWidth || (isLandscape ? 72 : 68);
  const photoH = design.photoHeight || (isLandscape ? 88 : 84);
  const photoRadius = design.photoBorderRadius ?? (template === 'minimal-professional' ? 2 : 6);

  const renderPhotoElement = () => {
    const borderColor = isDarkCard
      ? '#d97706'
      : template === 'classic-identity'
      ? '#b45309'
      : template === 'academic-crest'
      ? '#15803d'
      : design.photoBorderColor || primary;

    return wrapSelectable(
      'student-photo',
      <div
        style={{
          width: `${photoW}px`,
          height: `${photoH}px`,
          borderRadius: `${photoRadius}px`,
          border: `1.5px solid ${borderColor}`,
        }}
        className="bg-slate-100 relative overflow-hidden shrink-0 flex items-center justify-center shadow-2xs"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={studentName}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${photoZoom}) translate(${photoOffsetX}px, ${photoOffsetY}px)`,
              transformOrigin: 'center center',
            }}
          />
        ) : (
          <div className="text-center p-1 text-slate-400 flex flex-col items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[6.5px] font-bold leading-none mt-0.5">Photo</span>
          </div>
        )}
      </div>
    );
  };

  // Helper for student info rows
  const renderInfoRow = (label: string, value: string, highlight?: boolean) => {
    if (!value) return null;
    return (
      <div className="flex items-center text-[7.5px] leading-tight">
        <span className={`w-16 shrink-0 font-medium ${isDarkCard ? 'text-amber-200/70' : 'text-slate-500'}`}>
          {label}:
        </span>
        <span
          className={`font-bold truncate ${
            isDarkCard
              ? highlight
                ? 'text-amber-300'
                : 'text-slate-100'
              : highlight
              ? 'text-blue-700'
              : 'text-slate-900'
          }`}
        >
          {value}
        </span>
      </div>
    );
  };

  // =========================================================================
  // PORTRAIT MODE (VERTICAL CR80: 53.98 × 85.60 mm) - 100% UNCLIPPED LAYOUT
  // =========================================================================
  if (!isLandscape) {
    return (
      <div
        style={cardStyle}
        onClick={() => isEditable && onSelectElement?.('card-bg')}
        className={`select-none flex flex-col justify-between overflow-hidden ${
          isDarkCard ? 'bg-[#0a1128] text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Background Image Layer */}
        {bgImage && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: bgFit === 'center' ? 'auto' : bgFit,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: bgOpacity,
            }}
          />
        )}

        {/* 1. Header Block (Distinct Per Template) */}
        {wrapSelectable(
          'school-header',
          <div
            className="relative z-10 px-2 py-1.5 flex flex-col items-center justify-center text-center shadow-xs"
            style={{
              background:
                template === 'modern-gradient'
                  ? 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #06b6d4 100%)'
                  : template === 'navy-gold'
                  ? '#060a17'
                  : template === 'academic-crest'
                  ? '#15803d'
                  : template === 'classic-identity'
                  ? '#1e3a8a'
                  : template === 'minimal-professional'
                  ? '#0f172a'
                  : template === 'premium-college'
                  ? '#4338ca'
                  : primary,
              color: '#ffffff',
              transform: design.headerOffsetY ? `translateY(${design.headerOffsetY}px)` : undefined,
              borderBottom:
                template === 'navy-gold'
                  ? '2px solid #d97706'
                  : template === 'classic-identity'
                  ? '2px solid #b45309'
                  : template === 'academic-crest'
                  ? '2px solid #ca8a04'
                  : undefined,
            }}
          >
            <div className="flex items-center justify-center gap-1.5 w-full">
              {design.showLogo && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ width: `${design.logoSize || 22}px`, height: `${design.logoSize || 22}px` }}
                  className="object-contain bg-white rounded-full p-0.5 shadow-xs shrink-0"
                />
              )}
              <div className="leading-tight flex-1">
                {design.showSchoolName && (
                  <div
                    style={{ fontSize: `${design.schoolNameFontSize || 8.5}px` }}
                    className={`font-extrabold uppercase tracking-tight line-clamp-2 ${
                      template === 'navy-gold' ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    {schoolName}
                  </div>
                )}
                {design.showLocation && (
                  <div className={`text-[6.5px] font-semibold ${
                    template === 'navy-gold' ? 'text-amber-200/80' : 'text-blue-100'
                  }`}>
                    {schoolLocation}
                  </div>
                )}
              </div>
            </div>

            {/* Card Title Ribbon */}
            <div
              className={`mt-1 w-full py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                template === 'navy-gold'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : template === 'classic-identity'
                  ? 'bg-red-950/60 text-amber-200'
                  : template === 'academic-crest'
                  ? 'bg-emerald-950/60 text-amber-300'
                  : 'bg-blue-950/40 text-amber-300'
              }`}
            >
              {design.cardTitle || 'STUDENT IDENTITY CARD'}
            </div>
          </div>
        )}

        {/* 2. Middle Content Area: Vertically Stacked with Perfect Spacing */}
        <div className="relative z-10 flex-1 px-2.5 py-1.5 flex flex-col items-center justify-between overflow-hidden">
          {/* Centered Student Photo */}
          {design.showPhoto && (
            <div
              className="my-0.5 flex justify-center w-full"
              style={{
                transform: `translate(${design.photoBlockOffsetX || 0}px, ${design.photoBlockOffsetY || 0}px)`,
              }}
            >
              {renderPhotoElement()}
            </div>
          )}

          {/* Student Name & Class Badge */}
          {wrapSelectable(
            'student-name-block',
            <div
              className="w-full text-center my-0.5"
              style={{
                transform: `translate(${design.nameBlockOffsetX || 0}px, ${design.nameBlockOffsetY || 0}px)`,
              }}
            >
              {design.showStudentName && (
                <div
                  style={{ fontSize: `${design.studentNameFontSize || 11}px` }}
                  className={`font-black uppercase leading-tight truncate px-1 ${
                    template === 'navy-gold'
                      ? 'text-amber-300'
                      : template === 'minimal-professional'
                      ? 'text-slate-900 tracking-wide'
                      : 'text-slate-900'
                  }`}
                >
                  {studentName || 'Student Name'}
                </div>
              )}
              {design.showClass && (
                <div className="mt-0.5">
                  <span
                    className={`inline-block text-[7.5px] font-bold px-2 py-0.2 rounded-full shadow-2xs ${
                      template === 'navy-gold'
                        ? 'bg-amber-600 text-white'
                        : template === 'academic-crest'
                        ? 'bg-emerald-700 text-white'
                        : template === 'minimal-professional'
                        ? 'bg-slate-800 text-white'
                        : 'text-white'
                    }`}
                    style={{ backgroundColor: isDarkCard ? '#d97706' : primary }}
                  >
                    Class: {className} {section ? `(${section})` : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Credentials Table (Auto-spaced, fits perfectly in 200px width) */}
          {wrapSelectable(
            'credentials-block',
            <div
              className={`w-full rounded border px-2 py-1 space-y-0.5 text-[7px] ${
                isDarkCard
                  ? 'bg-[#0f172a] border-amber-600/30'
                  : template === 'minimal-professional'
                  ? 'bg-white border-slate-200'
                  : template === 'academic-crest'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50/90 border-slate-200/80'
              }`}
              style={{
                transform: `translate(${design.credentialsOffsetX || 0}px, ${design.credentialsOffsetY || 0}px)`,
              }}
            >
              {design.showFatherName && renderInfoRow("Father", fatherName)}
              {admissionNumber && renderInfoRow('Adm No', admissionNumber)}
              {design.showStudentNumber && renderInfoRow('Student ID', studentNumber, true)}
              {design.showDob && renderInfoRow('D.O.B', dateOfBirth)}
              {design.showStudentPhone && studentPhone && renderInfoRow('Contact', studentPhone)}
              {design.showAcademicYear && renderInfoRow('Session', academicYear)}
            </div>
          )}
        </div>

        {/* 3. Footer Bar */}
        {wrapSelectable(
          'footer-block',
          <div
            className={`relative z-10 px-2.5 py-1 border-t flex items-center justify-between text-[6.5px] ${
              isDarkCard
                ? 'bg-[#060a17] border-amber-600/40 text-amber-200/80'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            style={{
              transform: design.footerOffsetY ? `translateY(${design.footerOffsetY}px)` : undefined,
            }}
          >
            <div className="font-medium">
              {design.showValidityDate && <span>Valid: {validUntil}</span>}
            </div>

            {design.showSignature && (
              <div className="flex flex-col items-center">
                {principalProfile.signatureUrl ? (
                  <img
                    src={principalProfile.signatureUrl}
                    alt="Signature"
                    className="h-3.5 object-contain"
                  />
                ) : (
                  <div className={`w-12 border-b mb-0.5 ${isDarkCard ? 'border-amber-500' : 'border-slate-400'}`} />
                )}
                <span className={`text-[5.5px] font-bold ${isDarkCard ? 'text-amber-300' : 'text-slate-700'}`}>Principal</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // LANDSCAPE MODE (HORIZONTAL CR80: 85.60 × 53.98 mm) - CLEAN UNCLIPPED
  // =========================================================================

  // Template 8: Premium College Asymmetric Split Layout
  if (template === 'premium-college') {
    return (
      <div
        style={cardStyle}
        onClick={() => isEditable && onSelectElement?.('card-bg')}
        className="select-none flex overflow-hidden bg-white"
      >
        {/* Left 35% Deep Indigo Panel */}
        <div className="w-[105px] bg-indigo-900 text-white flex flex-col justify-between items-center p-2 text-center shrink-0">
          <div className="flex flex-col items-center">
            {design.showLogo && logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded-full bg-white p-0.5 shadow-xs mb-1" />
            )}
            <div className="text-[7.5px] font-black uppercase leading-tight line-clamp-2 text-indigo-100">
              {schoolName}
            </div>
          </div>

          {design.showPhoto && (
            <div className="my-1">
              {renderPhotoElement()}
            </div>
          )}

          <div className="bg-amber-400 text-indigo-950 font-black text-[7px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            {studentNumber ? `NO. ${studentNumber}` : 'STUDENT'}
          </div>
        </div>

        {/* Right 65% White Content Panel */}
        <div className="flex-1 flex flex-col justify-between p-2.5 overflow-hidden">
          <div className="border-b border-indigo-100 pb-1">
            <div className="text-[7px] font-black uppercase text-indigo-700 tracking-wider">
              {design.cardTitle || 'STUDENT IDENTITY CARD'}
            </div>
            {design.showStudentName && (
              <div
                style={{ fontSize: `${design.studentNameFontSize || 11.5}px` }}
                className="font-black text-slate-900 uppercase truncate"
              >
                {studentName || 'Student Name'}
              </div>
            )}
            {design.showClass && (
              <span className="inline-block bg-indigo-700 text-white text-[7px] font-bold px-1.5 py-0.2 rounded mt-0.5">
                Class: {className} {section ? `(${section})` : ''}
              </span>
            )}
          </div>

          <div className="space-y-0.5 py-1">
            {design.showFatherName && renderInfoRow("Father", fatherName)}
            {design.showDob && renderInfoRow('D.O.B', dateOfBirth)}
            {design.showStudentPhone && studentPhone && renderInfoRow('Phone', studentPhone)}
            {design.showAcademicYear && renderInfoRow('Session', academicYear)}
          </div>

          <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[6.5px]">
            <span className="text-slate-500 font-medium">Valid: {validUntil}</span>
            {design.showSignature && (
              <div className="flex flex-col items-center">
                {principalProfile.signatureUrl ? (
                  <img src={principalProfile.signatureUrl} alt="Sign" className="h-3 object-contain" />
                ) : (
                  <div className="w-12 border-b border-slate-400 mb-0.5" />
                )}
                <span className="text-[5.5px] font-bold text-slate-700">Principal</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Template 3: Navy & Gold Executive Landscape
  if (template === 'navy-gold') {
    return (
      <div
        style={cardStyle}
        onClick={() => isEditable && onSelectElement?.('card-bg')}
        className="select-none flex flex-col justify-between overflow-hidden bg-[#0a1128] text-white"
      >
        {/* Top Header Banner */}
        {wrapSelectable(
          'school-header',
          <div
            className="relative z-10 px-3 py-1.5 bg-[#060a17] border-b-2 border-amber-600 text-white flex items-center justify-between"
            style={{
              transform: design.headerOffsetY ? `translateY(${design.headerOffsetY}px)` : undefined,
            }}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              {design.showLogo && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ width: `${design.logoSize || 24}px`, height: `${design.logoSize || 24}px` }}
                  className="object-contain bg-white rounded-full p-0.5 shadow-xs shrink-0"
                />
              )}
              <div className="leading-tight overflow-hidden">
                {design.showSchoolName && (
                  <div
                    style={{ fontSize: `${design.schoolNameFontSize || 9.5}px` }}
                    className="font-extrabold uppercase tracking-wide text-amber-300 truncate max-w-[210px]"
                  >
                    {schoolName}
                  </div>
                )}
                {design.showLocation && (
                  <div className="text-[6.5px] text-amber-200/80 font-medium truncate">{schoolLocation}</div>
                )}
              </div>
            </div>
            <div className="text-[7.5px] font-black uppercase tracking-wider text-[#0a1128] bg-amber-400 px-1.5 py-0.5 rounded shrink-0">
              {design.cardTitle || 'STUDENT CARD'}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 px-3 py-1.5 flex items-center gap-3 overflow-hidden">
          {design.showPhoto && (
            <div
              style={{
                transform: `translate(${design.photoBlockOffsetX || 0}px, ${design.photoBlockOffsetY || 0}px)`,
              }}
            >
              {renderPhotoElement()}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center space-y-1 overflow-hidden">
            {wrapSelectable(
              'student-name-block',
              <div
                className="border-b border-amber-600/40 pb-0.5"
                style={{
                  transform: `translate(${design.nameBlockOffsetX || 0}px, ${design.nameBlockOffsetY || 0}px)`,
                }}
              >
                {design.showStudentName && (
                  <div
                    style={{ fontSize: `${design.studentNameFontSize || 11.5}px` }}
                    className="font-black text-amber-300 uppercase truncate"
                  >
                    {studentName || 'Student Name'}
                  </div>
                )}
                {design.showClass && (
                  <span className="inline-block text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-amber-600 text-white mt-0.5">
                    Class: {className} {section ? `(${section})` : ''}
                  </span>
                )}
              </div>
            )}

            {wrapSelectable(
              'credentials-block',
              <div
                className="space-y-0.5 text-slate-100"
                style={{
                  transform: `translate(${design.credentialsOffsetX || 0}px, ${design.credentialsOffsetY || 0}px)`,
                }}
              >
                {design.showFatherName && renderInfoRow("Father's Name", fatherName)}
                {design.showStudentNumber && renderInfoRow('Roll / Reg No', studentNumber, true)}
                {design.showDob && renderInfoRow('Date of Birth', dateOfBirth)}
                {design.showStudentPhone && studentPhone && renderInfoRow('Contact', studentPhone)}
                {design.showAcademicYear && renderInfoRow('Session', academicYear)}
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        {wrapSelectable(
          'footer-block',
          <div
            className="relative z-10 px-3 py-1 bg-[#060a17] border-t border-amber-600/40 flex items-center justify-between text-[7px]"
            style={{
              transform: design.footerOffsetY ? `translateY(${design.footerOffsetY}px)` : undefined,
            }}
          >
            <div className="text-amber-200/80 font-medium">
              {design.showValidityDate && <span>Valid: {validUntil}</span>}
            </div>

            {design.showSignature && (
              <div className="flex flex-col items-center">
                {principalProfile.signatureUrl ? (
                  <img
                    src={principalProfile.signatureUrl}
                    alt="Principal Signature"
                    className="h-3.5 object-contain"
                  />
                ) : (
                  <div className="w-14 border-b border-amber-500 mb-0.5" />
                )}
                <span className="text-[6px] font-bold text-amber-300">Principal</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standard Templates (Royal Blue, Modern White & Blue, Classic Identity, Modern Gradient, Minimal, Academic Crest)
  const headerBg =
    template === 'modern-gradient'
      ? 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #06b6d4 100%)'
      : template === 'academic-crest'
      ? '#15803d'
      : template === 'classic-identity'
      ? '#1e3a8a'
      : template === 'minimal-professional'
      ? '#0f172a'
      : primary;

  const ribbonBorderColor =
    template === 'academic-crest'
      ? '#ca8a04'
      : template === 'classic-identity'
      ? '#b45309'
      : '#f59e0b';

  return (
    <div
      style={cardStyle}
      onClick={() => isEditable && onSelectElement?.('card-bg')}
      className="select-none flex flex-col justify-between overflow-hidden bg-white"
    >
      {/* Background Image Layer */}
      {bgImage && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: bgFit === 'center' ? 'auto' : bgFit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Top Header Banner */}
      {wrapSelectable(
        'school-header',
        <div
          className="relative z-10 px-3 py-1.5 text-white flex items-center justify-between"
          style={{
            background: headerBg,
            transform: design.headerOffsetY ? `translateY(${design.headerOffsetY}px)` : undefined,
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {design.showLogo && logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: `${design.logoSize || 24}px`, height: `${design.logoSize || 24}px` }}
                className="object-contain bg-white rounded-full p-0.5 shadow-xs shrink-0"
              />
            )}
            <div className="leading-tight overflow-hidden">
              {design.showSchoolName && (
                <div
                  style={{ fontSize: `${design.schoolNameFontSize || 9.5}px` }}
                  className="font-extrabold uppercase tracking-wide drop-shadow-xs truncate max-w-[210px]"
                >
                  {schoolName}
                </div>
              )}
              {design.showLocation && (
                <div className="text-[6.5px] text-blue-100 font-medium truncate">{schoolLocation}</div>
              )}
            </div>
          </div>
          <div className="text-[7.5px] font-black uppercase tracking-wider text-amber-300 bg-black/20 px-1.5 py-0.5 rounded shrink-0">
            {design.cardTitle || 'STUDENT CARD'}
          </div>
        </div>
      )}

      {/* Accent Separator Line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: ribbonBorderColor }} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 px-3 py-1.5 flex items-center gap-3 overflow-hidden">
        {design.showPhoto && (
          <div
            style={{
              transform: `translate(${design.photoBlockOffsetX || 0}px, ${design.photoBlockOffsetY || 0}px)`,
            }}
          >
            {renderPhotoElement()}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center space-y-1 overflow-hidden">
          {wrapSelectable(
            'student-name-block',
            <div
              className="border-b border-slate-200 pb-0.5"
              style={{
                transform: `translate(${design.nameBlockOffsetX || 0}px, ${design.nameBlockOffsetY || 0}px)`,
              }}
            >
              {design.showStudentName && (
                <div
                  style={{ fontSize: `${design.studentNameFontSize || 11.5}px` }}
                  className="font-black text-slate-900 uppercase truncate"
                >
                  {studentName || 'Student Name'}
                </div>
              )}
              {design.showClass && (
                <span
                  className="inline-block text-[7.5px] font-bold px-1.5 py-0.2 rounded text-white mt-0.5 shadow-2xs"
                  style={{ backgroundColor: primary }}
                >
                  Class: {className} {section ? `(${section})` : ''}
                </span>
              )}
            </div>
          )}

          {wrapSelectable(
            'credentials-block',
            <div
              className="space-y-0.5"
              style={{
                transform: `translate(${design.credentialsOffsetX || 0}px, ${design.credentialsOffsetY || 0}px)`,
              }}
            >
              {design.showFatherName && renderInfoRow("Father's Name", fatherName)}
              {design.showStudentNumber && renderInfoRow('Roll / Reg No', studentNumber, true)}
              {design.showDob && renderInfoRow('Date of Birth', dateOfBirth)}
              {design.showStudentPhone && studentPhone && renderInfoRow('Contact', studentPhone)}
              {design.showAcademicYear && renderInfoRow('Session', academicYear)}
            </div>
          )}
        </div>
      </div>

      {/* Footer Bar */}
      {wrapSelectable(
        'footer-block',
        <div
          className="relative z-10 px-3 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[7px]"
          style={{
            transform: design.footerOffsetY ? `translateY(${design.footerOffsetY}px)` : undefined,
          }}
        >
          <div className="text-slate-500 font-medium">
            {design.showValidityDate && <span>Valid: {validUntil}</span>}
          </div>

          {design.showSignature && (
            <div className="flex flex-col items-center">
              {principalProfile.signatureUrl ? (
                <img
                  src={principalProfile.signatureUrl}
                  alt="Principal Signature"
                  className="h-3.5 object-contain"
                />
              ) : (
                <div className="w-14 border-b border-slate-400 mb-0.5" />
              )}
              <span className="text-[6px] font-bold text-slate-700">Principal</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
