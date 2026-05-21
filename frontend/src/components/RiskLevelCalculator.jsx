// components/RiskLevelCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pcosAPI } from '../services/api';
import './RiskLevelCalculator.css';

const RiskLevelCalculator = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // token is auto-attached by api.js interceptor
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);

  const [formData, setFormData] = useState({
    weight_kg: '',
    height_m: '',
    bmi: '',
    period_type: 'Regular',
    overweight: 'No',
    excess_facial_hair: 'No',
    excess_body_hair: 'No',
    dark_area: 'No',
    pimple_face: 'No',
    hormonal_acne_face: 'No',
    fast_food: 'No',
    losing_hair: 'No',
    depress: 'No',
    mental_stress: 'No',
    insomnia: 'No',
    family_background: 'I do not know',
    cyst_ovary: 'I do not know',
    diabetes_measurment: 'Normal',
    hormonal_imbalance: 'Normal',
    gain_weight: 'No',
    slow_activity: 'No',
    mood_swing_period: 'Normal',
    craving_pt: 'Normal',
    blood_pressure: 'Normal',
    diagnosis_age: 'adult',
  });

  // Auto-calculate BMI
  useEffect(() => {
    if (formData.weight_kg && formData.height_m && parseFloat(formData.height_m) > 0) {
      const bmiValue =
        parseFloat(formData.weight_kg) /
        (parseFloat(formData.height_m) * parseFloat(formData.height_m));
      setFormData((prev) => ({ ...prev, bmi: bmiValue.toFixed(1) }));
    }
  }, [formData.weight_kg, formData.height_m]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sections = [
    {
      title: 'About You',
      icon: 'fas fa-heart',
      description: "Let's get to know you better",
      fields: [
        {
          type: 'measurement',
          label: 'Your Measurements',
          fields: [
            { name: 'weight_kg', label: 'Weight', placeholder: 'kg', step: '0.1' },
            { name: 'height_m', label: 'Height', placeholder: 'm', step: '0.01' },
          ],
        },
        { name: 'bmi', label: 'Your BMI', type: 'text', disabled: true, placeholder: 'Auto-calculated' },
        { name: 'period_type', label: 'Menstrual Cycle', type: 'select', options: ['Regular', 'Irregular', 'No period'] },
        { name: 'diagnosis_age', label: 'Age Group', type: 'select', options: ['Youth', 'Young adult', 'adult'] },
      ],
    },
    {
      title: 'Physical Signs',
      icon: 'fas fa-female',
      description: 'Tell us about any physical changes',
      fields: [
        { name: 'overweight', label: 'Feel overweight?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'excess_facial_hair', label: 'Excess facial hair?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'excess_body_hair', label: 'Excess body hair?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'dark_area', label: 'Dark patches on skin?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'pimple_face', label: 'Pimples on face?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'hormonal_acne_face', label: 'Hormonal acne?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'losing_hair', label: 'Hair thinning?', type: 'radio', options: ['Yes', 'No'] },
      ],
    },
    {
      title: 'Daily Life',
      icon: 'fas fa-smile',
      description: 'How are you feeling day-to-day?',
      fields: [
        { name: 'fast_food', label: 'Eat fast food regularly?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'depress', label: 'Feeling down often?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'mental_stress', label: 'High stress levels?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'insomnia', label: 'Trouble sleeping?', type: 'radio', options: ['Yes', 'No'] },
        { name: 'mood_swing_period', label: 'Mood swings', type: 'select', options: ['Normal', 'Medium', 'High', 'Extreme'] },
        { name: 'craving_pt', label: 'Food cravings', type: 'select', options: ['Normal', 'Medium', 'High', 'Extreme'] },
        { name: 'gain_weight', label: 'Unexplained weight gain?', type: 'select', options: ['No', 'May be', 'Yes'] },
        { name: 'slow_activity', label: 'Low energy?', type: 'select', options: ['No', 'May be', 'Yes'] },
      ],
    },
    {
      title: 'Health History',
      icon: 'fas fa-notes-medical',
      description: 'Share your medical background',
      fields: [
        { name: 'family_background', label: 'Family history of PCOS?', type: 'select', options: ['Yes', 'No', 'I do not know'] },
        { name: 'cyst_ovary', label: 'Diagnosed with ovarian cysts?', type: 'select', options: ['Yes', 'No', 'I do not know'] },
        { name: 'diabetes_measurment', label: 'Blood sugar status', type: 'select', options: ['Normal', 'Abnormal', 'I do not know'] },
        { name: 'hormonal_imbalance', label: 'Hormonal imbalance?', type: 'select', options: ['Normal', 'Abnormal', 'I do not know'] },
        { name: 'blood_pressure', label: 'Blood pressure', type: 'select', options: ['Low', 'Normal', 'High'] },
      ],
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.bmi || parseFloat(formData.bmi) < 10 || parseFloat(formData.bmi) > 80) {
        alert('💝 Please enter valid weight and height first!');
        setLoading(false);
        return;
      }

      const submissionData = {
        ...formData,
        weight_kg: parseFloat(formData.weight_kg),
        height_m: parseFloat(formData.height_m),
        bmi: parseFloat(formData.bmi),
      };

      // Token is auto-attached by the axios interceptor in api.js
      const response = await pcosAPI.submitSymptoms(submissionData);
      const backendResult = response.data;

      setResult({
        riskLevel: backendResult.risk_label,
        percentage: Math.round(backendResult.risk_score * 100),
        message: backendResult.message,
        assessmentId: backendResult.id,
        createdAt: backendResult.created_at,
        recommendations: getRecommendations(backendResult.risk_label),
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        alert('🔐 Your session has expired. Please log in again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert("⛔ You don't have permission to perform this action.");
      } else {
        alert(error.response?.data?.detail || '🌸 Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = (riskLabel) => {
    const map = {
      'Low Risk': [
        '💝 Continue maintaining a healthy lifestyle',
        '📊 Track your symptoms monthly for early detection',
        '🥗 Keep a balanced diet rich in whole foods',
        '💪 Exercise regularly (150 mins/week)',
        '🩺 Schedule annual check-ups with your gynecologist',
      ],
      'Medium Risk': [
        '🩺 Schedule a consultation with an endocrinologist',
        '📊 Track symptoms weekly and note any changes',
        '🥗 Consider dietary modifications (low glycemic index foods)',
        '💪 Increase physical activity to 3–4 times/week',
        '💊 Discuss supplements (inositol, vitamin D) with your doctor',
        '😴 Prioritize sleep (7–8 hours/night)',
      ],
      'High Risk': [
        '🚨 Please consult a gynecologist or endocrinologist ASAP',
        '📋 Complete additional hormonal testing',
        '💊 Discuss treatment options (metformin, hormonal therapy)',
        '🥗 Work with a nutritionist for PCOS-specific diet',
        '💪 Start with gentle exercises (walking, yoga)',
        '📊 Use our tracker daily to monitor symptoms',
      ],
    };
    return map[riskLabel] || map['Medium Risk'];
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const RiskChart = ({ percentage, riskLabel }) => {
    const color =
      riskLabel === 'Low Risk' ? '#4caf50' : riskLabel === 'Medium Risk' ? '#ff9800' : '#f44336';
    const icon =
      riskLabel === 'Low Risk' ? 'fas fa-smile-wink' : riskLabel === 'Medium Risk' ? 'fas fa-meh' : 'fas fa-frown';

    return (
      <div className="risk-chart">
        <div className="gauge-container">
          <svg className="gauge" viewBox="0 0 200 100">
            <path d="M20,80 A80,80 0 0,1 180,80" fill="none" stroke="#e0e0e0" strokeWidth="15" strokeLinecap="round" />
            <path
              d="M20,80 A80,80 0 0,1 180,80"
              fill="none"
              stroke={color}
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="100" y="50" textAnchor="middle" fontSize="24" fontWeight="bold" fill={color}>
              {percentage}%
            </text>
            <text x="100" y="70" textAnchor="middle" fontSize="10" fill="#666">
              Risk Score
            </text>
          </svg>
          <div className="gauge-icon" style={{ backgroundColor: color }}>
            <i className={icon}></i>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="risk-calculator-container">
      <div className="calculator-header">
        <div className="header-badge">
          <i className="fas fa-heartbeat"></i>
          <span>PMOS · understand &amp; thrive</span>
        </div>
        <h1>Risk Level Calculator</h1>
        <p>Let's understand your health journey together 💗</p>
      </div>

      {!result ? (
        <>
          <div className="progress-steps">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className={`progress-step ${idx === currentSection ? 'active' : ''} ${idx < currentSection ? 'completed' : ''}`}
                onClick={() => setCurrentSection(idx)}
              >
                <div className="step-circle">
                  {idx < currentSection ? <i className="fas fa-check"></i> : idx + 1}
                </div>
                <div className="step-label">{section.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {sections.map((section, idx) => (
              <div key={idx} className={`form-section ${idx === currentSection ? 'active' : 'hidden'}`}>
                <div className="section-header">
                  <div className="section-icon">
                    <i className={section.icon}></i>
                  </div>
                  <div>
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                  </div>
                </div>

                <div className="section-content">
                  {section.fields.map((field, fieldIdx) => {
                    if (field.type === 'measurement') {
                      return (
                        <div key={fieldIdx} className="form-group measurement-group">
                          <label>{field.label}</label>
                          <div className="measurement-row">
                            {field.fields.map((subField, subIdx) => (
                              <div key={subIdx} className="measurement-field">
                                <input
                                  type="number"
                                  name={subField.name}
                                  value={formData[subField.name]}
                                  onChange={handleChange}
                                  placeholder={subField.placeholder}
                                  step={subField.step}
                                  required
                                />
                                <span className="measurement-unit">{subField.placeholder}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (field.type === 'radio') {
                      return (
                        <div key={fieldIdx} className="form-group">
                          <label>{field.label}</label>
                          <div className="radio-group">
                            {field.options.map((option) => (
                              <label key={option} className="radio-label">
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={option}
                                  checked={formData[field.name] === option}
                                  onChange={handleChange}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (field.type === 'select') {
                      return (
                        <div key={fieldIdx} className="form-group">
                          <label>{field.label}</label>
                          <select name={field.name} value={formData[field.name]} onChange={handleChange}>
                            {field.options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      );
                    } else {
                      return (
                        <div key={fieldIdx} className="form-group">
                          <label>{field.label}</label>
                          <input
                            type="text"
                            name={field.name}
                            value={formData[field.name]}
                            disabled={field.disabled}
                            placeholder={field.placeholder}
                          />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}

            <div className="form-buttons">
              {currentSection > 0 && (
                <button type="button" onClick={prevSection} className="btn-secondary">
                  ← Back
                </button>
              )}
              {currentSection < sections.length - 1 ? (
                <button type="button" onClick={nextSection} className="btn-primary">
                  Continue →
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Calculating...</>
                  ) : (
                    <><i className="fas fa-chart-line"></i> See My Results 💗</>
                  )}
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        <div className="results-container">
          <div className={`result-card ${result.riskLevel.toLowerCase().replace(' ', '-')}`}>
            <div className="result-header">
              <i className="fas fa-clipboard-check"></i>
              <h2>Your Assessment Results</h2>
              <p className="assessment-date">
                {new Date(result.createdAt).toLocaleDateString()}
              </p>
            </div>

            <RiskChart percentage={result.percentage} riskLabel={result.riskLevel} />

            <div className="risk-message">
              <i className="fas fa-info-circle"></i>
              <p>{result.message}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <i className="fas fa-chart-simple"></i>
                <div className="stat-info">
                  <span className="stat-label">Risk Level</span>
                  <span className={`stat-value ${result.riskLevel.toLowerCase().replace(' ', '-')}`}>
                    {result.riskLevel}
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-percent"></i>
                <div className="stat-info">
                  <span className="stat-label">Risk Score</span>
                  <span className="stat-value">{result.percentage}%</span>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-id-card"></i>
                <div className="stat-info">
                  <span className="stat-label">Assessment ID</span>
                  <span className="stat-value">#{result.assessmentId}</span>
                </div>
              </div>
            </div>

            <div className="recommendations-section">
              <h3><i className="fas fa-lightbulb"></i> Personalized Recommendations</h3>
              <div className="recommendations-grid">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="rec-number">{index + 1}</span>
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-buttons">
              {/* Go to Dashboard — shows all past results */}
              <button onClick={() => navigate('/dashboard')} className="btn-save">
                <i className="fas fa-chart-pie"></i> View My Dashboard
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setCurrentSection(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-new"
              >
                <i className="fas fa-redo"></i> New Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskLevelCalculator;
