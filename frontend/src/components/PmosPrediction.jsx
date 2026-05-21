// components/PmosPrediction.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pcosAPI } from '../services/api';
import './PmosPrediction.css';

const MAX_FILES = 10;
const MAX_SIZE_MB = 10;
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const PmosPrediction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const processFiles = (incoming) => {
    const files = Array.from(incoming);

    const invalid = files.find((f) => !VALID_TYPES.includes(f.type));
    if (invalid) {
      alert(`"${invalid.name}" is not a supported type. Please upload JPEG, PNG, or WebP files.`);
      return;
    }

    // Merge with existing selection, deduplicate by name+size
    const merged = [...selectedFiles, ...files].reduce((acc, f) => {
      const key = `${f.name}-${f.size}`;
      if (!acc.map.has(key)) {
        acc.map.set(key, true);
        acc.list.push(f);
      }
      return acc;
    }, { map: new Map(), list: [] }).list;

    if (merged.length > MAX_FILES) {
      alert(`You can upload up to ${MAX_FILES} images at once. ${merged.length - MAX_FILES} file(s) were skipped.`);
      merged.splice(MAX_FILES);
    }

    const tooBig = merged.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      alert(`"${tooBig.name}" exceeds ${MAX_SIZE_MB}MB. Please compress it and try again.`);
      return;
    }

    setSelectedFiles(merged);

    Promise.all(
      merged.map(
        (file) =>
          new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(file);
          })
      )
    ).then(setPreviews);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length) processFiles(e.target.files);
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      alert('Please select at least one image file first');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) { clearInterval(interval); return 85; }
        return prev + 8;
      });
    }, 300);

    try {
      const response = await pcosAPI.uploadImages(selectedFiles);
      clearInterval(interval);
      setUploadProgress(100);
      setPrediction(response.data);
    } catch (error) {
      clearInterval(interval);
      console.error('Error making prediction:', error);
      if (error.response?.status === 401) {
        alert('🔐 Your session has expired. Please log in again.');
        navigate('/login');
      } else if (error.response?.status === 415) {
        alert('⚠️ Unsupported file type. Please upload JPEG, PNG or WebP.');
      } else {
        alert(error.response?.data?.detail || 'Error processing image. Please try again.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleNewUpload = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setPrediction(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pmos-prediction-container">
      <div className="prediction-header">
        <div className="header-badge">
          <i className="fas fa-heartbeat"></i>
          <span>PMOS · understand &amp; thrive</span>
        </div>
        <h1>PMOS AI Prediction</h1>
        <p>Upload your hormonal lab report images for AI-powered clinical analysis</p>
      </div>

      {!prediction ? (
        <div className="upload-section">
          {/* Drop zone — clicking opens file picker to ADD more */}
          <div
            className={`upload-area ${selectedFiles.length > 0 ? 'has-files' : ''}`}
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              style={{ display: 'none' }}
            />

            {selectedFiles.length === 0 ? (
              <div className="upload-placeholder">
                <i className="fas fa-cloud-upload-alt"></i>
                <h3>Click or drag &amp; drop to upload</h3>
                <p>JPEG, PNG, WebP · Up to {MAX_FILES} images · Max {MAX_SIZE_MB}MB each</p>
              </div>
            ) : (
              <div className="upload-placeholder add-more-hint">
                <i className="fas fa-plus-circle"></i>
                <p>Click or drop to add more images ({selectedFiles.length}/{MAX_FILES})</p>
              </div>
            )}
          </div>

          {/* Preview grid — rendered outside the drop zone so remove buttons work */}
          {previews.length > 0 && (
            <div className="image-previews-grid">
              {previews.map((src, i) => (
                <div key={i} className="preview-thumb">
                  <img src={src} alt={`Preview ${i + 1}`} />
                  <button
                    className="remove-btn"
                    onClick={(e) => removeFile(i, e)}
                    title="Remove image"
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <span className="thumb-label">{selectedFiles[i]?.name?.slice(0, 18)}{selectedFiles[i]?.name?.length > 18 ? '…' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && !loading && (
            <div className="upload-info">
              <div className="file-details">
                <i className="fas fa-file-image"></i>
                <span><strong>{selectedFiles.length}</strong> image{selectedFiles.length > 1 ? 's' : ''} ready</span>
                <span className="file-size">
                  ({(selectedFiles.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(2)} MB total)
                </span>
              </div>
              <button onClick={handleUpload} className="btn-upload">
                <i className="fas fa-flask"></i> Analyze {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
              </button>
            </div>
          )}

          {loading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p>Processing {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}… {uploadProgress}%</p>
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <span>AI is analyzing your hormonal data</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="prediction-results">
          <div className="results-header">
            <i className="fas fa-clipboard-check"></i>
            <h2>Clinical Analysis Results</h2>
            <div className={`prediction-badge ${(prediction.diagnosis || '').toLowerCase().replace(/\s+/g, '-')}`}>
              {prediction.diagnosis || 'Analyzed'}
            </div>
          </div>

          {prediction.message && (
            <div className="result-message-banner">
              <i className="fas fa-info-circle"></i>
              <p>{prediction.message}</p>
            </div>
          )}

          <div className="result-meta">
            <div className="meta-item">
              <span className="meta-label">Assessment ID</span>
              <span className="meta-value">#{prediction.id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">
                {prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Diagnosis</span>
              <span className="meta-value diagnosis-value">{prediction.diagnosis || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Images Analyzed</span>
              <span className="meta-value">{selectedFiles.length}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/dashboard')} className="btn-save">
              <i className="fas fa-chart-pie"></i> View My Dashboard
            </button>
            <button onClick={handleNewUpload} className="btn-new">
              <i className="fas fa-upload"></i> Analyze Another Image
            </button>
          </div>

          <p className="disclaimer">
            <i className="fas fa-exclamation-triangle"></i>
            This AI analysis is for informational purposes only. Please consult a healthcare professional for medical advice.
          </p>
        </div>
      )}
    </div>
  );
};

export default PmosPrediction;
