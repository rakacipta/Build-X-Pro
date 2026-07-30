import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  elementId: string;
  filename?: string;
  title?: string;
  landscape?: boolean;
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

    // Handle multi-page documents if content is long
    while (heightLeft > 0) {
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
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      // If popup blocked, fallback to direct print
      window.print();
      return;
    }

    const contentHtml = element ? element.innerHTML : document.body.innerHTML;
    const stylesHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${stylesHtml}
          <style>
            body { background: white !important; padding: 20px !important; color: #0f172a !important; font-family: sans-serif; }
            .print\\:hidden, button, input[type="file"] { display: none !important; }
            .print\\:block { display: block !important; }
            @page { size: A4 portrait; margin: 15mm; }
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
                window.close();
              }, 500);
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
      alert('Gagal membuka dialog cetak. Mohon izinkan popup di browser Anda.');
    }
  }
}
