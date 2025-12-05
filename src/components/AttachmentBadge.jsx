import React, { useState } from 'react';
import { Paperclip, Eye, Download, X, File, Image, FileText } from 'lucide-react';
import { formatFileSize, isImageFile, isPDFFile } from '../utils/dataManager';
import { downloadFile } from '../utils/downloadHelper';

const AttachmentBadge = ({ attachments = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = (attachment) => {
    downloadFile(attachment.data, attachment.name);
  };

  const handlePreview = (attachment) => {
    setPreviewFile(attachment);
  };

  const getFileIcon = (fileType) => {
    if (isImageFile(fileType)) {
      return <Image className="w-4 h-4" />;
    } else if (isPDFFile(fileType)) {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
        title={`${attachments.length} attachment(s)`}
      >
        <Paperclip className="w-3 h-3" />
        {attachments.length}
      </button>

      {/* Attachments List Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Attachments ({attachments.length})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attachments List */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {/* Thumbnail/Icon */}
                    <div className="flex-shrink-0">
                      {isImageFile(attachment.type) ? (
                        <div className="w-16 h-16 rounded overflow-hidden bg-gray-200">
                          <img
                            src={attachment.data}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-primary-100 flex items-center justify-center text-primary-600">
                          {getFileIcon(attachment.type)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                      {attachment.uploadedAt && (
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {(isImageFile(attachment.type) || isPDFFile(attachment.type)) && (
                        <button
                          onClick={() => handlePreview(attachment)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentBadge;

