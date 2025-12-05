import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Upload, X, Check, AlertCircle, PenTool } from 'lucide-react';

const SignatureSettings = () => {
  const { data, updateSignatureSettings } = useData();
  const signatureSettings = data.settings?.signatureSettings || { type: 'none' };
  const fileInputRef = useRef(null);

  const [signatureType, setSignatureType] = useState(signatureSettings.type || 'none');
  const [signatureImage, setSignatureImage] = useState(signatureSettings.image || '');
  const [signatureText, setSignatureText] = useState(signatureSettings.text || '');
  const [signatureFont, setSignatureFont] = useState(signatureSettings.font || 'cursive');
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const signatureFonts = [
    { id: 'cursive', name: 'Cursive', style: { fontFamily: "'Dancing Script', cursive", fontSize: '32px' } },
    { id: 'handwritten', name: 'Handwritten', style: { fontFamily: "'Caveat', cursive", fontSize: '36px' } },
    { id: 'formal', name: 'Formal', style: { fontFamily: "'Playfair Display', serif", fontSize: '28px', fontStyle: 'italic' } },
    { id: 'modern', name: 'Modern', style: { fontFamily: "'Montserrat', sans-serif", fontSize: '24px', fontWeight: '600' } }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (500KB)
    if (file.size > 500 * 1024) {
      setError('Image size must be less than 500KB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignatureImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSignatureImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const settings = {
      type: signatureType,
      image: signatureType === 'image' ? signatureImage : '',
      text: signatureType === 'text' ? signatureText : '',
      font: signatureType === 'text' ? signatureFont : ''
    };

    updateSignatureSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-primary-600" />
          Digital Signature
        </h3>
        <p className="text-sm text-gray-600">Add your signature to invoices for a professional touch</p>
      </div>

      {saveSuccess && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-success-600" />
          <p className="text-success-800 font-medium">Signature settings saved successfully!</p>
        </div>
      )}

      {/* Signature Type Selection */}
      <div className="space-y-3">
        <label className="label">Signature Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setSignatureType('none')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              signatureType === 'none'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                signatureType === 'none'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {signatureType === 'none' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">No Signature</h4>
                <p className="text-xs text-gray-600">Don't include signature</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSignatureType('image')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              signatureType === 'image'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                signatureType === 'image'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {signatureType === 'image' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Upload Image</h4>
                <p className="text-xs text-gray-600">Use signature image</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSignatureType('text')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              signatureType === 'text'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                signatureType === 'text'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {signatureType === 'text' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Text Signature</h4>
                <p className="text-xs text-gray-600">Use styled text</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      {signatureType === 'image' && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Upload Signature Image</h4>
          
          {signatureImage ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-64 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-4">
                  <img src={signatureImage} alt="Signature" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Current signature</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary text-sm"
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="btn btn-secondary text-sm flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">Click to upload signature image</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG or WebP (Max 500KB)</p>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />

          {error && (
            <p className="text-sm text-danger-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>
      )}

      {/* Text Signature Section */}
      {signatureType === 'text' && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Text-Based Signature</h4>
          
          <div className="space-y-4">
            <div>
              <label className="label">Your Name</label>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                className="input"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="label">Signature Style</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signatureFonts.map((font) => (
                  <div
                    key={font.id}
                    onClick={() => setSignatureFont(font.id)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      signatureFont === font.id
                        ? 'border-primary-500 bg-white'
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">{font.name}</span>
                      {signatureFont === font.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="text-center py-4 bg-gray-50 rounded">
                      <span style={font.style}>{signatureText || 'Your Name'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {signatureText && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Preview:</p>
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <span style={signatureFonts.find(f => f.id === signatureFont)?.style}>
                    {signatureText}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary px-8"
        >
          Save Signature Settings
        </button>
      </div>
    </div>
  );
};

export default SignatureSettings;

