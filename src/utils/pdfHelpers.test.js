import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addImageToPDF, addSignatureToPDF } from './pdfHelpers';

// Mock jsPDF document object
const createMockDoc = () => ({
  addImage: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  setLineWidth: vi.fn(),
  setDrawColor: vi.fn(),
  line: vi.fn()
});

describe('addImageToPDF - Basic Functionality', () => {
  it('should add valid image data to PDF', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 50, 50);
  });

  it('should add image with default type "logo"', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalled();
  });

  it('should add image with custom type', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50, 'signature');

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalled();
  });

  it('should use correct coordinates', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    addImageToPDF(mockDoc, imageData, 100, 200, 75, 100);

    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 100, 200, 75, 100);
  });

  it('should use correct dimensions', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    addImageToPDF(mockDoc, imageData, 10, 10, 120, 80);

    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 120, 80);
  });
});

describe('addImageToPDF - Edge Cases - Invalid Data', () => {
  it('should return false for null imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, null, 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for undefined imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, undefined, 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for empty string imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, '', 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for non-data-url string', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, 'invalid-image-data', 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for non-string imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, 123, 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for object imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, { image: 'data' }, 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should return false for array imageData', () => {
    const mockDoc = createMockDoc();

    const result = addImageToPDF(mockDoc, ['data:image/png;base64,test'], 10, 10, 50, 50);

    expect(result).toBe(false);
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });
});

describe('addImageToPDF - Edge Cases - Coordinates', () => {
  it('should handle zero coordinates', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 0, 0, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 0, 0, 50, 50);
  });

  it('should handle negative coordinates', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, -10, -10, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', -10, -10, 50, 50);
  });

  it('should handle very large coordinates', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10000, 10000, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10000, 10000, 50, 50);
  });

  it('should handle decimal coordinates', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10.5, 20.75, 50, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10.5, 20.75, 50, 50);
  });
});

describe('addImageToPDF - Edge Cases - Dimensions', () => {
  it('should handle zero width', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 0, 50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 0, 50);
  });

  it('should handle zero height', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 0);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 50, 0);
  });

  it('should handle zero dimensions', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 0, 0);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 0, 0);
  });

  it('should handle negative dimensions', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, -50, -50);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, -50, -50);
  });

  it('should handle very large dimensions', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 10000, 10000);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 10000, 10000);
  });

  it('should handle decimal dimensions', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50.5, 75.25);

    expect(result).toBe(true);
    expect(mockDoc.addImage).toHaveBeenCalledWith(imageData, 'PNG', 10, 10, 50.5, 75.25);
  });
});

describe('addImageToPDF - Edge Cases - Image Formats', () => {
  it('should handle PNG data URL', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
  });

  it('should handle JPEG data URL', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/jpeg;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
  });

  it('should handle JPG data URL', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/jpg;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
  });

  it('should handle GIF data URL', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/gif;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
  });

  it('should handle very long base64 string', () => {
    const mockDoc = createMockDoc();
    const imageData = 'data:image/png;base64,' + 'A'.repeat(10000);

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(true);
  });
});

describe('addImageToPDF - Error Handling', () => {
  it('should return false and not throw when addImage throws error', () => {
    const mockDoc = createMockDoc();
    mockDoc.addImage.mockImplementation(() => {
      throw new Error('Invalid image');
    });
    const imageData = 'data:image/png;base64,test';

    const result = addImageToPDF(mockDoc, imageData, 10, 10, 50, 50);

    expect(result).toBe(false);
  });

  it('should log warning when addImage throws error', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockDoc = createMockDoc();
    mockDoc.addImage.mockImplementation(() => {
      throw new Error('Invalid image');
    });
    const imageData = 'data:image/png;base64,test';

    addImageToPDF(mockDoc, imageData, 10, 10, 50, 50, 'logo');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Could not add logo to PDF:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should use custom type in error message', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockDoc = createMockDoc();
    mockDoc.addImage.mockImplementation(() => {
      throw new Error('Invalid image');
    });
    const imageData = 'data:image/png;base64,test';

    addImageToPDF(mockDoc, imageData, 10, 10, 50, 50, 'signature');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Could not add signature to PDF:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});

describe('addSignatureToPDF - Basic Functionality', () => {
  it('should not add signature when type is "none"', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'none' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('should not add signature when settings is null', () => {
    const mockDoc = createMockDoc();

    addSignatureToPDF(mockDoc, null, 210, 280);

    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('should not add signature when settings is undefined', () => {
    const mockDoc = createMockDoc();

    addSignatureToPDF(mockDoc, undefined, 210, 280);

    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('should add signature label', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 140, 280);
  });

  it('should set font size for label', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(9);
  });

  it('should set text color for label', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setTextColor).toHaveBeenCalledWith(100);
  });

  it('should draw line under signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setLineWidth).toHaveBeenCalledWith(0.5);
    expect(mockDoc.setDrawColor).toHaveBeenCalledWith(150);
    expect(mockDoc.line).toHaveBeenCalledWith(140, 305, 190, 305);
  });
});

describe('addSignatureToPDF - Text Signature', () => {
  it('should add text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('John Doe', 140, 295);
  });

  it('should use cursive font for text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFont).toHaveBeenCalledWith('times', 'italic');
  });

  it('should use handwritten font for text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'handwritten' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFont).toHaveBeenCalledWith('times', 'italic');
  });

  it('should use formal font for text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'formal' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFont).toHaveBeenCalledWith('times', 'italic');
  });

  it('should use modern font for text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'modern' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'italic');
  });

  it('should use default font when font is not recognized', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'unknown' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFont).toHaveBeenCalledWith('times', 'italic');
  });

  it('should set font size to 16 for text signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(16);
  });

  it('should not add text signature when text is empty', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: '', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    // Should only call text once for the label, not for the signature
    expect(mockDoc.text).toHaveBeenCalledTimes(1);
  });

  it('should not add text signature when text is null', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: null, font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledTimes(1);
  });

  it('should not add text signature when text is undefined', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: undefined, font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledTimes(1);
  });
});

describe('addSignatureToPDF - Image Signature', () => {
  it('should add image signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = {
      type: 'image',
      image: 'data:image/png;base64,test'
    };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,test',
      'PNG',
      140,
      283,
      50,
      20
    );
  });

  it('should not add image signature when image is null', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'image', image: null };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should not add image signature when image is undefined', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'image', image: undefined };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('should not add image signature when image is empty string', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'image', image: '' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });
});

describe('addSignatureToPDF - Edge Cases - Position', () => {
  it('should calculate position based on page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 200, 280);

    // Label should be at pageWidth - 70 = 130
    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 130, 280);
    // Signature text should be at pageWidth - 70 = 130
    expect(mockDoc.text).toHaveBeenCalledWith('John Doe', 130, 295);
    // Line should be from pageWidth - 70 to pageWidth - 20 = 130 to 180
    expect(mockDoc.line).toHaveBeenCalledWith(130, 305, 180, 305);
  });

  it('should handle very large page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 10000, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 9930, 280);
  });

  it('should handle very small page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 50, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', -20, 280);
  });

  it('should handle zero page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 0, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', -70, 280);
  });

  it('should handle negative page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, -100, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', -170, 280);
  });

  it('should handle decimal page width', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210.5, 280.75);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 140.5, 280.75);
  });

  it('should handle zero y position', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 0);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 140, 0);
    expect(mockDoc.text).toHaveBeenCalledWith('John Doe', 140, 15);
    expect(mockDoc.line).toHaveBeenCalledWith(140, 25, 190, 25);
  });

  it('should handle negative y position', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, -100);

    expect(mockDoc.text).toHaveBeenCalledWith('Authorized Signature:', 140, -100);
  });
});

describe('addSignatureToPDF - Edge Cases - Text Content', () => {
  it('should handle very long signature text', () => {
    const mockDoc = createMockDoc();
    const longText = 'A'.repeat(1000);
    const signatureSettings = { type: 'text', text: longText, font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith(longText, 140, 295);
  });

  it('should handle special characters in signature text', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: "O'Connor & Co.", font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith("O'Connor & Co.", 140, 295);
  });

  it('should handle unicode characters in signature text', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: '田中太郎', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('田中太郎', 140, 295);
  });

  it('should handle emoji in signature text', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'John Doe ✓', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('John Doe ✓', 140, 295);
  });

  it('should handle single character signature', () => {
    const mockDoc = createMockDoc();
    const signatureSettings = { type: 'text', text: 'J', font: 'cursive' };

    addSignatureToPDF(mockDoc, signatureSettings, 210, 280);

    expect(mockDoc.text).toHaveBeenCalledWith('J', 140, 295);
  });
});
