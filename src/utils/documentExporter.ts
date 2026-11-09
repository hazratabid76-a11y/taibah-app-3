import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export interface PdfExportOptions {
  filename: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'cr80' | [number, number];
  scale?: number;
}

/**
 * Robust image capture using html-to-image to completely avoid
 * html2canvas "unsupported color function oklch" errors caused by Tailwind CSS v4.
 */
async function captureElementToPng(element: HTMLElement, scale: number = 3.5): Promise<string> {
  // First attempt: full fidelity with cache-busting
  try {
    return await toPng(element, {
      pixelRatio: scale,
      cacheBust: true,
      backgroundColor: '#ffffff',
      quality: 1.0,
      filter: (node) => {
        // Exclude UI controls, buttons, or elements marked as no-print
        if ((node as HTMLElement)?.classList?.contains?.('no-print')) {
          return false;
        }
        return true;
      },
    });
  } catch (err) {
    console.warn('Initial html-to-image render failed, attempting font-safe fallback:', err);
    // Second attempt: skip external font fetching in case of CORS or offline issues
    return await toPng(element, {
      pixelRatio: scale,
      skipFonts: true,
      backgroundColor: '#ffffff',
      quality: 1.0,
      filter: (node) => {
        if ((node as HTMLElement)?.classList?.contains?.('no-print')) {
          return false;
        }
        return true;
      },
    });
  }
}

/**
 * Universal, rock-solid PDF Exporter for both Windows Electron Desktop and Web.
 * Completely immune to modern CSS oklch/oklab color parsing bugs.
 */
export async function exportElementToPdf(
  elements: HTMLElement | HTMLElement[],
  options: PdfExportOptions
): Promise<{ success: boolean; error?: string }> {
  const elList = Array.isArray(elements) ? elements : [elements];
  if (elList.length === 0) {
    return { success: false, error: 'No printable document elements found to export.' };
  }

  const orientation = options.orientation || 'portrait';
  const formatOption = options.format || 'a4';
  const scale = options.scale || (formatOption === 'cr80' ? 4 : 3);

  try {
    // Calculate page dimensions in mm
    let pdfFormat: 'a4' | [number, number];
    let pdfWidth: number;
    let pdfHeight: number;

    if (formatOption === 'cr80') {
      // Standard CR80 ID Card dimensions: 85.60mm × 53.98mm
      const cr80W = 85.6;
      const cr80H = 54.0;
      if (orientation === 'landscape') {
        pdfWidth = cr80W;
        pdfHeight = cr80H;
        pdfFormat = [cr80W, cr80H];
      } else {
        pdfWidth = cr80H;
        pdfHeight = cr80W;
        pdfFormat = [cr80H, cr80W];
      }
    } else if (Array.isArray(formatOption)) {
      pdfWidth = formatOption[0];
      pdfHeight = formatOption[1];
      pdfFormat = formatOption;
    } else {
      // Default to A4: 210mm × 297mm
      pdfFormat = 'a4';
      if (orientation === 'portrait') {
        pdfWidth = 210;
        pdfHeight = 297;
      } else {
        pdfWidth = 297;
        pdfHeight = 210;
      }
    }

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pdfFormat,
      compress: true,
    });

    for (let i = 0; i < elList.length; i++) {
      const el = elList[i];
      if (!el) continue;

      const pngDataUrl = await captureElementToPng(el, scale);

      if (i > 0) {
        pdf.addPage(pdfFormat, orientation);
      }

      pdf.addImage(pngDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const safeFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;

    // 1. Electron Desktop Native Save Support
    if (typeof window !== 'undefined' && (window as any).electronAPI?.showSaveDialog) {
      try {
        const saveResult = await (window as any).electronAPI.showSaveDialog({
          title: 'Save PDF Document',
          defaultPath: safeFilename,
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
        });

        if (saveResult.canceled || !saveResult.filePath) {
          return { success: false, error: 'Save was cancelled.' };
        }

        const pdfArrayBuffer = pdf.output('arraybuffer');
        if ((window as any).electronAPI.saveBinaryFile) {
          await (window as any).electronAPI.saveBinaryFile(saveResult.filePath, pdfArrayBuffer);
          return { success: true };
        }
      } catch (electronErr) {
        console.warn('Native Electron save encountered an issue, falling back to browser download:', electronErr);
      }
    }

    // 2. Web Browser Direct Blob Download
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return { success: true };
  } catch (err: any) {
    console.error('PDF export process error:', err);
    return { success: false, error: err.message || 'Failed to render and save PDF document.' };
  }
}

/**
 * Universal PNG Image Exporter
 */
export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  scale: number = 3.5
): Promise<{ success: boolean; error?: string }> {
  try {
    const pngDataUrl = await captureElementToPng(element, scale);
    const safeFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err: any) {
    console.error('PNG export error:', err);
    return { success: false, error: err.message || 'Failed to generate PNG image.' };
  }
}

/**
 * Isolated Document Print Engine: Prints only the target document
 * without sidebar, header, or dashboard controls leaking onto the page.
 */
export function printIsolatedDocument(
  element: HTMLElement,
  options?: { orientation?: 'portrait' | 'landscape'; size?: string }
): void {
  let printIframe = document.getElementById('taibah-print-iframe') as HTMLIFrameElement | null;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'taibah-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Copy all active document stylesheets
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((style) => style.outerHTML)
    .join('\n');

  const orientation = options?.orientation || 'portrait';
  const size = options?.size || 'A4';

  iframeDoc.open();
  iframeDoc.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print Document - TAIBAH International School and College</title>
        ${styles}
        <style>
          @page {
            size: ${size} ${orientation};
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    printIframe?.contentWindow?.focus();
    printIframe?.contentWindow?.print();
  }, 400);
}
