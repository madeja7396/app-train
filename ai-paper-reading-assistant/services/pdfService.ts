import type { PDFDocumentProxy, PDFPageProxy, RenderParameters } from 'pdfjs-dist/types/src/display/api';
declare const pdfjsLib: any;

export const extractTextFromPdf = async (file: File): Promise<{ pdf: PDFDocumentProxy, text: string, numPages: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
    fullText += pageText + '\n';
  }

  return { pdf, text: fullText, numPages };
};

export const renderPdfPage = async (
  pdfDocument: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  textLayer: HTMLDivElement,
  containerWidth: number
): Promise<void> => {
  const page = await pdfDocument.getPage(pageNumber);
  
  const viewport = page.getViewport({ scale: 1.5 });
  const scale = containerWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale: scale });

  canvas.height = scaledViewport.height;
  canvas.width = scaledViewport.width;
  
  textLayer.style.width = `${scaledViewport.width}px`;
  textLayer.style.height = `${scaledViewport.height}px`;
  
  // Set the CSS variable for scaling the text layer. This is required by pdf.js.
  textLayer.style.setProperty('--scale-factor', String(scaledViewport.scale));

  const renderContext: RenderParameters = {
    canvasContext: canvas.getContext('2d')!,
    viewport: scaledViewport,
  };
  
  await page.render(renderContext).promise;

  const textContent = await page.getTextContent();
  
  // The pdfjs object is not a module, so we access its renderTextLayer from the global scope
  // @ts-ignore
  await pdfjsLib.renderTextLayer({
    textContentSource: textContent,
    container: textLayer,
    viewport: scaledViewport,
    textDivs: []
  }).promise;
};