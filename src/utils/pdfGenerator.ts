import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  elementId: string;
  filename?: string;
  title?: string;
  landscape?: boolean;
}

/**
 * Converts CSS strings containing modern 'oklch(...)', 'oklab(...)', 'color(...)', 'lab(...)', 'hwb(...)'
 * into standard rgb(...) or rgba(...) format using canvas getImageData.
 * This prevents html2canvas from throwing unsupported color function errors.
 */
function convertOklchColors(cssText: string): string {
  if (!cssText) return cssText;

  const colorRegex = /(?:oklch|oklab|color|lab|hwb)\([^)]+\)/gi;

  if (!colorRegex.test(cssText)) return cssText;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  return cssText.replace(colorRegex, (match) => {
    if (!ctx) return '#64748b';
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillStyle = match;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const a = data[3];

      if (a === 255) {
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        const alpha = +(a / 255).toFixed(3);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    } catch {
      return '#64748b';
    }
  });
}

/**
 * Ensures all <img> elements inside a parent element are pre-loaded
 * and converts raw SVG / UTF-8 SVG Data URIs to base64 Data URIs
 * so html2canvas can render them reliably without failing or corrupting.
 */
export async function prepareImagesForCanvas(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  const promises = images.map((img) => {
    return new Promise<void>((resolve) => {
      // 1. Convert raw/utf8 SVG Data URIs to Base64
      if (img.src && img.src.includes('data:image/svg+xml') && !img.src.includes('base64')) {
        try {
          const parts = img.src.split(',');
          if (parts.length > 1) {
            const rawSvg = decodeURIComponent(parts.slice(1).join(','));
            const base64Svg = btoa(unescape(encodeURIComponent(rawSvg)));
            img.src = `data:image/svg+xml;base64,${base64Svg}`;
          }
        } catch (e) {
          console.warn('[PDF Export] Failed to encode SVG image to base64:', e);
        }
      }

      // 2. Wait for image to be fully loaded
      if (img.complete && img.naturalWidth !== 0) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  });

  await Promise.all(promises);
}

/**
 * Generates and downloads a clean A4 PDF file from a DOM element ID.
 * Falls back to opening a clean popup print window if canvas generation is restricted.
 */
export async function generatePdfFromElement({
  elementId,
  filename = 'Laporan_Build_X_Pro.pdf',
  title = 'Laporan Resmi Build X Pro',
  landscape = false,
}: PdfExportOptions): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[PDF Export] Element with ID #${elementId} not found. Fallback to window print.`);
    triggerPrintFallback(title);
    return false;
  }

  // Temporarily apply print styles or classes for rendering
  const originalStyle = element.getAttribute('style') || '';
  
  try {
    // Ensure all images (logos, signatures, etc.) are converted to base64 and loaded
    await prepareImagesForCanvas(element);

    // Scroll to top of element to capture full height
    window.scrollTo(0, 0);

    // Capture using html2canvas with scale 2 for crisp vector text & images
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth || 1200,
      ignoreElements: (node) => {
        // Exclude elements marked with print:hidden or action buttons
        if (node instanceof HTMLElement) {
          if (node.classList.contains('print:hidden') || node.classList.contains('no-pdf')) {
            return true;
          }
        }
        return false;
      },
      onclone: (clonedDoc) => {
        // Unhide print-only elements and normalize cloned printable element for pristine A4 export
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement instanceof HTMLElement) {
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.borderRadius = '0';
          clonedElement.style.width = '794px'; // Standard A4 pixel width at 96 DPI
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minHeight = 'auto'; // Prevent trailing blank page caused by min-h-[297mm]
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.height = 'auto';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.backgroundColor = '#ffffff';
        }

        // 0. Ensure print-only elements (e.g. PrintHeader with 'hidden print:block') are unhidden in clonedDoc for PDF export
        const printOnlyElements = clonedDoc.querySelectorAll('[class*="print:block"], [class*="print:flex"], [class*="print:grid"]');
        printOnlyElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.classList.remove('hidden');
            if (el.className.includes('print:flex')) {
              el.style.display = 'flex';
            } else if (el.className.includes('print:grid')) {
              el.style.display = 'grid';
            } else {
              el.style.display = 'block';
            }
          }
        });

        // 1. Process all <style> elements in clonedDoc
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent && /oklch|oklab|color\(|lab\(|hwb\(/i.test(styleEl.textContent)) {
            styleEl.textContent = convertOklchColors(styleEl.textContent);
          }
        });

        // 2. Process all inline style attributes in clonedDoc
        const styledElements = clonedDoc.querySelectorAll('[style]');
        styledElements.forEach((node) => {
          if (node instanceof HTMLElement && node.style && node.style.cssText && /oklch|oklab|color\(|lab\(|hwb\(/i.test(node.style.cssText)) {
            node.style.cssText = convertOklchColors(node.style.cssText);
          }
        });

        // 3. Extract and convert rules from main document styleSheets
        try {
          let extraCss = '';
          Array.from(document.styleSheets).forEach((sheet) => {
            try {
              const rules = sheet.cssRules || sheet.rules;
              if (rules) {
                for (let i = 0; i < rules.length; i++) {
                  const ruleText = rules[i].cssText;
                  if (ruleText && /oklch|oklab|color\(|lab\(|hwb\(/i.test(ruleText)) {
                    extraCss += convertOklchColors(ruleText) + '\n';
                  }
                }
              }
            } catch {
              // Ignore cross-origin stylesheets
            }
          });

          if (extraCss) {
            const newStyle = clonedDoc.createElement('style');
            newStyle.setAttribute('type', 'text/css');
            newStyle.textContent = extraCss;
            clonedDoc.head.appendChild(newStyle);
          }
        } catch (err) {
          console.warn('[PDF Export] Error processing styleSheets in onclone:', err);
        }

        // 4. Traverse all elements in clonedDoc to convert any computed colors containing oklch
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            try {
              const computed = window.getComputedStyle(el);
              if (computed.backgroundColor && /oklch|oklab|color\(|lab\(|hwb\(/i.test(computed.backgroundColor)) {
                el.style.backgroundColor = convertOklchColors(computed.backgroundColor);
              }
              if (computed.color && /oklch|oklab|color\(|lab\(|hwb\(/i.test(computed.color)) {
                el.style.color = convertOklchColors(computed.color);
              }
              if (computed.borderColor && /oklch|oklab|color\(|lab\(|hwb\(/i.test(computed.borderColor)) {
                el.style.borderColor = convertOklchColors(computed.borderColor);
              }
            } catch {
              // Ignore computed style errors
            }
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const orientation = landscape ? 'landscape' : 'portrait';
    const pdf = new jsPDF(orientation, 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - 20; // 10mm margins on left & right
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // top margin 10mm

    // Add first page
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20;

    // Handle multi-page documents if remaining content height exceeds 5mm tolerance
    while (heightLeft > 5) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
    }

    // Save and download the PDF file
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error('[PDF Export] Failed to generate PDF with html2canvas:', error);
    // Fallback if iframe/canvas permissions fail
    triggerPrintFallback(title, element);
    return false;
  } finally {
    element.setAttribute('style', originalStyle);
  }
}

/**
 * Fallback mechanism: Opens a standalone popup window with styled content
 * to bypass iframe sandbox restriction on window.print().
 */
export function triggerPrintFallback(title: string, element?: HTMLElement | null) {
  try {
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) {
      // If popup blocked, fallback to direct print
      window.print();
      return;
    }

    const contentHtml = element ? element.outerHTML : document.body.innerHTML;
    const stylesHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { background: #ffffff !important; color: #0f172a !important; margin: 0; padding: 20px; font-family: sans-serif; }
            .print\\:hidden, button, input[type="file"], select { display: none !important; }
            .print\\:block { display: block !important; }
            #quotation-printable-document, #printable-letter-area, #printable-form-area, #printable-blank-form, #printable-submissions-recap, .print-container {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error('[Print Fallback] Error opening print window:', err);
    try {
      window.print();
    } catch (e) {
      alert('Gagal membuka dialog cetak browser. Mohon periksa izin popup pada browser Anda.');
    }
  }
}
