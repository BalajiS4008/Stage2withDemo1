import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, Download, Eye } from 'lucide-react';
import { validateFile, formatFileSize, isImageFile, isPDFFile, fileToBase64 } from '../utils/dataManager';
import { downloadFile } from '../utils/downloadHelper';

const FileUpload = ({ attachments = [], onAttachmentsChange, maxFiles = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setError('');

    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const newAttachments = [];

      for (const file of files) {
        const validation = validateFile(file);
        
        if (!validation.valid) {
          setError(validation.error);
          continue;
        }

        const base64 = await fileToBase64(file);
        
        newAttachments.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          uploadedAt: new Date().toISOString()
        });
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
    } catch (err) {
      setError('Error uploading file: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (fileId) => {
    onAttachmentsChange(attachments.filter(f => f.id !== fileId));
  };

  const handleDownload = (attachment) => {
    downloadFile(attachment.data, attachment.name);
  };

  const handlePreview = (attachment) => {
    setPreviewFile(attachment);
  };

  const getFileIcon = (fileType) => {
    if (isImageFile(fileType)) {
      return <Image className="w-5 h-5" />;
    } else if (isPDFFile(fileType)) {
      return <FileText className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <label className="label">Attachments (Optional)</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= maxFiles}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
          <span className="text-sm text-gray-500">
            {attachments.length}/{maxFiles} files
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported: Images, PDF, Word, Excel, Text (Max 5MB per file)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Attached Files:</p>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* File Icon/Thumbnail */}
                <div className="flex-shrink-0">
                  {isImageFile(attachment.type) ? (
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-200">
                      <img
                        src={attachment.data}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-primary-100 flex items-center justify-center text-primary-600">
                      {getFileIcon(attachment.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {(isImageFile(attachment.type) || isPDFFile(attachment.type)) && (
                    <button
                      type="button"
                      onClick={() => handlePreview(attachment)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(attachment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(attachment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 truncate">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {isImageFile(previewFile.type) ? (
                <img
                  src={previewFile.data}
                  alt={previewFile.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : isPDFFile(previewFile.type) ? (
                <iframe
                  src={previewFile.data}
                  className="w-full h-[70vh] border-0"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(previewFile)}
                    className="btn btn-primary mt-4 inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {formatFileSize(previewFile.size)}
              </span>
              <button
                onClick={() => handleDownload(previewFile)}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

