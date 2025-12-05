// PDF Helper Functions
export const addImageToPDF = (doc, imageData, x, y, width, height, type = 'logo') => {
  if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
    try {
      doc.addImage(imageData, 'PNG', x, y, width, height);
      return true;
    } catch (e) {
      console.warn(`Could not add ${type} to PDF:`, e);
      return false;
    }
  }
  return false;
};

export const addSignatureToPDF = (doc, signatureSettings, pageWidth, yPosition) => {
  if (!signatureSettings || signatureSettings.type === 'none') return;

  // Add signature label
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text('Authorized Signature:', pageWidth - 70, yPosition);

  if (signatureSettings.type === 'image') {
    addImageToPDF(doc, signatureSettings.image, pageWidth - 70, yPosition + 3, 50, 20, 'signature');
  } else if (signatureSettings.type === 'text' && signatureSettings.text) {
    // Add text signature
    doc.setTextColor(0);
    const fontMap = {
      cursive: 'times',
      handwritten: 'times',
      formal: 'times',
      modern: 'helvetica'
    };
    doc.setFont(fontMap[signatureSettings.font] || 'times', 'italic');
    doc.setFontSize(16);
    doc.text(signatureSettings.text, pageWidth - 70, yPosition + 15);
  }

  // Add line under signature
  doc.setLineWidth(0.5);
  doc.setDrawColor(150);
  doc.line(pageWidth - 70, yPosition + 25, pageWidth - 20, yPosition + 25);
};