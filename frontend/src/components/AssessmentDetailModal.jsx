// components/AssessmentDetailModal.jsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const SYMPTOM_LABELS = {
  age: 'Age',
  weight: 'Weight (kg)',
  height: 'Height (cm)',
  bmi: 'BMI',
  blood_group: 'Blood Group',
  pulse_rate: 'Pulse Rate (bpm)',
  rr: 'Respiratory Rate',
  hb: 'Hemoglobin (g/dL)',
  cycle: 'Cycle Regularity',
  cycle_length: 'Cycle Length (days)',
  marriage_status: 'Marriage Status (years)',
  pregnant: 'Pregnant',
  no_of_abortions: 'Number of Abortions',
  hip: 'Hip (inch)',
  waist: 'Waist (inch)',
  waist_hip_ratio: 'Waist-Hip Ratio',
  weight_gain: 'Weight Gain',
  hair_growth: 'Excess Hair Growth',
  skin_darkening: 'Skin Darkening',
  hair_loss: 'Hair Loss',
  pimples: 'Pimples',
  fast_food: 'Fast Food Consumption',
  reg_exercise: 'Regular Exercise',
  bp_systolic: 'BP Systolic (mmHg)',
  bp_diastolic: 'BP Diastolic (mmHg)',
  follicle_no_l: 'Follicle Count (Left)',
  follicle_no_r: 'Follicle Count (Right)',
  avg_f_size_l: 'Avg Follicle Size Left (mm)',
  avg_f_size_r: 'Avg Follicle Size Right (mm)',
  endometrium: 'Endometrium (mm)',
};

const formatValue = (key, val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val === 'Y' || val === 'y') return 'Yes';
  if (val === 'N' || val === 'n') return 'No';
  return String(val);
};

const getRiskColor = (label) => {
  if (!label) return '#999';
  if (label.toLowerCase().includes('low')) return '#4caf50';
  if (label.toLowerCase().includes('medium')) return '#ff9800';
  return '#f44336';
};

const getRiskBg = (label) => {
  if (!label) return '#f5f5f5';
  if (label.toLowerCase().includes('low')) return '#e8f5e9';
  if (label.toLowerCase().includes('medium')) return '#fff3e0';
  return '#ffebee';
};

// Fetch a protected image and return a blob URL
function useAuthImage(imageId) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageId) return;
    let objectUrl = null;
    setLoading(true);

    api
      .get(`/pcos/history/clinical/images/${imageId}`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      })
      .catch(() => setBlobUrl(null))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  return { blobUrl, loading };
}

// Single authenticated image thumbnail
function AuthImage({ imageId, filename, onClick }) {
  const { blobUrl, loading } = useAuthImage(imageId);

  return (
    <button style={styles.imgThumb} onClick={onClick} title={filename}>
      {loading && (
        <div style={styles.imgPlaceholder}>
          <i className="fas fa-spinner fa-spin" style={{ color: '#e91e63', fontSize: '1.2rem' }} />
        </div>
      )}
      {!loading && blobUrl && (
        <img
          src={blobUrl}
          alt={filename}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, display: 'block' }}
        />
      )}
      {!loading && !blobUrl && (
        <div style={styles.imgPlaceholder}>
          <i className="fas fa-image" style={{ color: '#ddd', fontSize: '1.5rem' }} />
        </div>
      )}
    </button>
  );
}

// Lightbox — also needs auth fetch
function Lightbox({ imageId, filename, onClose }) {
  const { blobUrl, loading } = useAuthImage(imageId);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={styles.lightbox} onClick={onClose}>
      <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.lightboxClose} onClick={onClose}>✕</button>
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{ color: '#e91e63', fontSize: '2rem' }} />
          </div>
        )}
        {!loading && blobUrl && (
          <img
            src={blobUrl}
            alt={filename}
            style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: 12, display: 'block' }}
          />
        )}
        <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
          {filename}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentDetailModal({ type, item, onClose }) {
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !activeImg) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, activeImg]);

  // Fetch image metadata list
  useEffect(() => {
    if (type === 'clinical' && item?.id && item?.image_count > 0) {
      setLoadingImages(true);
      api
        .get(`/pcos/history/clinical/${item.id}/images`)
        .then((res) => setImages(res.data || []))
        .catch(() => setImages([]))
        .finally(() => setLoadingImages(false));
    }
  }, [type, item]);

  if (!item) return null;

  const skipKeys = new Set([
    'id', 'user_id', 'created_at', 'risk_score', 'risk_label',
    'diagnosis', 'image_count',
  ]);
  const detailEntries = Object.entries(item).filter(([k]) => !skipKeys.has(k));

  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Centered modal */}
      <div style={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalType}>
              {type === 'symptoms' ? '🩺 Risk Assessment' : '🔬 Clinical Analysis'}
              <span style={styles.idBadge}>#{item.id}</span>
            </div>
            <div style={styles.modalDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Scrollable body */}
        <div style={styles.modalBody}>
          {/* Result banner */}
          {type === 'symptoms' && item.risk_label && (
            <div style={{
              ...styles.resultBanner,
              background: getRiskBg(item.risk_label),
              borderColor: getRiskColor(item.risk_label) + '55',
            }}>
              <div style={styles.bannerRow}>
                <div style={{ ...styles.riskPill, background: getRiskColor(item.risk_label), color: '#fff' }}>
                  {item.risk_label}
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: getRiskColor(item.risk_label), lineHeight: 1 }}>
                    {Math.round((item.risk_score || 0) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 2 }}>PCOS Risk Score</div>
                </div>
              </div>
              <p style={styles.disclaimer}>
                This score is based on your submitted symptom data and is not a clinical diagnosis — please consult a healthcare professional.
              </p>
            </div>
          )}

          {type === 'clinical' && item.diagnosis && (
            <div style={{ ...styles.resultBanner, background: '#f3e5f5', borderColor: '#ce93d866' }}>
              <div style={styles.bannerRow}>
                <div style={{ ...styles.riskPill, background: '#9c27b0', color: '#fff' }}>
                  {item.diagnosis}
                </div>
              </div>
              <p style={styles.disclaimer}>
                This result is derived from your uploaded lab report. Always verify findings with a licensed clinician.
              </p>
            </div>
          )}

          {/* Uploaded images (clinical) */}
          {type === 'clinical' && item.image_count > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📎 Uploaded Lab Report Images</div>
              {loadingImages ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#aaa' }}>
                  <i className="fas fa-spinner fa-spin" /> Loading…
                </div>
              ) : images.length > 0 ? (
                <div style={styles.imageGrid}>
                  {images.map((img) => (
                    <AuthImage
                      key={img.id}
                      imageId={img.id}
                      filename={img.filename}
                      onClick={() => setActiveImg(img)}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Could not load images.</p>
              )}
            </div>
          )}

          {type === 'clinical' && item.image_count === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#bbb' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔬</div>
              <p style={{ fontSize: '0.88rem' }}>No lab images were attached to this assessment.</p>
            </div>
          )}

          {/* Symptom answers */}
          {type === 'symptoms' && detailEntries.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📋 Your Answers</div>
              <div style={styles.answersGrid}>
                {detailEntries.map(([key, val], i) => (
                  <div
                    key={key}
                    style={{
                      ...styles.answerRow,
                      background: i % 2 === 0 ? '#fff' : '#fdfafa',
                    }}
                  >
                    <div style={styles.answerLabel}>
                      {SYMPTOM_LABELS[key] ||
                        key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div style={styles.answerVal}>{formatValue(key, val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <span style={{ fontSize: '0.73rem', color: '#ccc' }}>Read-only · no changes allowed</span>
          <button style={styles.closeFooterBtn} onClick={onClose}>Done</button>
        </div>
      </div>

      {/* Lightbox */}
      {activeImg && (
        <Lightbox
          imageId={activeImg.id}
          filename={activeImg.filename}
          onClose={() => setActiveImg(null)}
        />
      )}
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(620px, 94vw)',
    maxHeight: '88vh',
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(233,30,99,0.18), 0 4px 20px rgba(0,0,0,0.1)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    animation: 'modalPop 0.25s cubic-bezier(.34,1.56,.64,1)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem 1.6rem 1rem',
    borderBottom: '1px solid #fce4ec',
    flexShrink: 0,
  },
  modalType: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#333',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  idBadge: {
    background: '#fce4ec',
    color: '#e91e63',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '0.15rem 0.55rem',
    borderRadius: 20,
  },
  modalDate: {
    fontSize: '0.8rem',
    color: '#aaa',
  },
  closeBtn: {
    background: '#fce4ec',
    border: 'none',
    borderRadius: '50%',
    width: 34, height: 34,
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#e91e63',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalBody: {
    overflowY: 'auto',
    flex: 1,
    padding: '1.2rem 1.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  resultBanner: {
    padding: '1.2rem 1.4rem',
    borderRadius: 16,
    border: '1.5px solid',
    flexShrink: 0,
  },
  bannerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  riskPill: {
    padding: '0.35rem 1rem',
    borderRadius: 30,
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  disclaimer: {
    margin: '0.8rem 0 0',
    fontSize: '0.8rem',
    color: '#888',
    lineHeight: 1.5,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#bbb',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '0.7rem',
  },
  imgThumb: {
    aspectRatio: '1',
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid #fce4ec',
    cursor: 'pointer',
    padding: 0,
    background: '#f9f9f9',
    transition: 'border-color 0.2s, transform 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  answersGrid: {
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid #fce4ec',
  },
  answerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    borderBottom: '1px solid #fce4ec',
  },
  answerLabel: {
    fontSize: '0.82rem',
    color: '#888',
    flex: 1,
  },
  answerVal: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
    textAlign: 'right',
    marginLeft: '1rem',
  },
  modalFooter: {
    padding: '1rem 1.6rem',
    borderTop: '1px solid #fce4ec',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  closeFooterBtn: {
    background: 'linear-gradient(135deg, #e91e63, #f06292)',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    padding: '0.5rem 1.4rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.88rem',
  },
  lightbox: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  lightboxContent: {
    background: '#fff',
    borderRadius: 16,
    padding: '1.5rem',
    cursor: 'default',
    position: 'relative',
    maxWidth: '90vw',
  },
  lightboxClose: {
    position: 'absolute',
    top: 10, right: 10,
    background: '#fce4ec',
    border: 'none',
    borderRadius: '50%',
    width: 30, height: 30,
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#e91e63',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
