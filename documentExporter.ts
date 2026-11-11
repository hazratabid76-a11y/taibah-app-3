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
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Save binary data. In the Windows desktop app a native "Save As" window is used,
 * in the browser a normal download is started.
 */
export async function saveBinaryFile(
  filename: string,
  data: ArrayBuffer | Uint8Array,
  filterName: string,
  extension: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
  if (api?.showSaveDialog && api?.saveBinaryFile) {
    const saveResult = await api.showSaveDialog({
      title: `Save ${filterName}`,
      defaultPath: filename,
      filters: [{ name: filterName, extensions: [extension] }],
    });
    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, error: 'Save was cancelled.' };
    }
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const written = await api.saveBinaryFile(saveResult.filePath, bytes);
    if (written && written.success === false) {
      return { success: false, error: written.error || 'Could not write the file.' };
    }
    return { success: true };
  }

  const blob = new Blob([data as BlobPart], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  return { success: true };
}

async function captureElementToPng(element: HTMLElement, scale: number = 3.5): Promise<string> {
  // First attempt: full fidelity with cache-busting
  try {
    return await toPng(element, {
      pixelRatio: scale,
      cacheBust: false,
      imagePlaceholder: TRANSPARENT_PIXEL,
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
      imagePlaceholder: TRANSPARENT_PIXEL,
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

    const pdfBytes = pdf.output('arraybuffer');
    return await saveBinaryFile(safeFilename, pdfBytes, 'PDF Document', 'pdf', 'application/pdf');
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

    const base64 = pngDataUrl.split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return await saveBinaryFile(safeFilename, bytes, 'PNG Image', 'png', 'image/png');
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
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
  if (api?.printPage) {
    printWithElectron(element, options, api);
    return;
  }

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


/**
 * Desktop (Electron) printing: shows only the document and opens the Windows print window.
 */
async function printWithElectron(
  element: HTMLElement,
  options: { orientation?: 'portrait' | 'landscape'; size?: string } | undefined,
  api: any
): Promise<void> {
  const orientation = options?.orientation || 'portrait';
  const size = options?.size || 'A4';

  const root = document.createElement('div');
  root.id = 'taibah-print-root';
  root.innerHTML = element.outerHTML;

  const style = document.createElement('style');
  style.id = 'taibah-print-style';
  style.textContent = `
    #taibah-print-root { display: none; }
    @media print {
      @page { size: ${size} ${orientation}; margin: 6mm; }
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
      body > *:not(#taibah-print-root) { display: none !important; }
      #taibah-print-root { display: block !important; }
      #taibah-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break-after { page-break-after: always; break-after: page; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(root);

  try {
    // give images a moment to paint
    await new Promise((resolve) => setTimeout(resolve, 300));
    await api.printPage({ landscape: orientation === 'landscape' });
  } catch (err) {
    console.error('Print failed:', err);
  } finally {
    root.remove();
    style.remove();
  }
}
