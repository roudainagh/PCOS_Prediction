// components/DoctorsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './DoctorsPage.css';

const DoctorsPage = () => {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 9;

  // Load CSV
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch('/data/gynecologues_tn.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,

          complete: (results) => {
            const parsedDoctors = results.data.map((row, index) => ({
              id: index + 1,
              nom: row.nom || 'Unknown Doctor',
              specialite: row.specialite || 'Gynecologist',
              adresse: row.adresse || 'Unknown Location',
              actes: row.actes || '',
            }));

            setDoctors(parsedDoctors);
            setFilteredDoctors(parsedDoctors);

            // Unique specialties
            const uniqueSpecialties = [
              ...new Set(
                parsedDoctors.map((doc) => doc.specialite)
              ),
            ];

            // Unique locations
            const uniqueLocations = [
              ...new Set(
                parsedDoctors.map((doc) => {
                  const address = doc.adresse || '';
                  return address.split(' ')[0];
                })
              ),
            ];

            setSpecialties(uniqueSpecialties);
            setLocations(uniqueLocations);

            setLoading(false);
          },
        });

      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  // Filtering
  useEffect(() => {
    let filtered = doctors;

    // Search
    if (searchTerm) {
      filtered = filtered.filter((doctor) =>
        doctor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.actes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter((doctor) =>
        doctor.specialite
          .toLowerCase()
          .includes(selectedSpecialty.toLowerCase())
      );
    }

    // Location
    if (selectedLocation) {
      filtered = filtered.filter((doctor) =>
        doctor.adresse
          .toLowerCase()
          .includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
    setCurrentPage(1);

  }, [
    searchTerm,
    selectedSpecialty,
    selectedLocation,
    doctors,
  ]);

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;

  const currentDoctors = filteredDoctors.slice(
    indexOfFirstDoctor,
    indexOfLastDoctor
  );

  const totalPages = Math.ceil(
    filteredDoctors.length / doctorsPerPage
  );

  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(
      selectedDoctor?.id === doctor.id ? null : doctor
    );
  };

  if (loading) {
    return (
      <div className="doctors-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctors-page">

      {/* Hero */}
      <div className="doctors-hero">
        <div className="doctors-hero-content">
          <div className="badge">Find Your Specialist</div>
          <p>
            Connect with experienced gynecologists in Tunisia
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-container">

          {/* Search */}
          <div className="search-box">
            <i className="fas fa-search"></i>

            <input
              type="text"
              placeholder="Search doctor or service..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>

        
          {/* Location */}
          <div className="filter-group">
            <select
              className="filter-select"
              value={selectedLocation}
              onChange={(e) =>
                setSelectedLocation(e.target.value)
              }
            >
              <option value="">
                All Locations
              </option>

              {locations.map((location, index) => (
                <option
                  key={index}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Stats */}
      <div className="results-stats">
        <p>
          Found{' '}
          <strong>
            {filteredDoctors.length}
          </strong>{' '}
          doctors
        </p>

        <button
          className="clear-filters"
          onClick={() => {
            setSearchTerm('');
            setSelectedSpecialty('all');
            setSelectedLocation('');
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Grid */}
      <div className="doctors-grid-container">

        <div className="doctors-grid">

          {currentDoctors.length > 0 ? (

            currentDoctors.map((doctor) => (

              <div
                key={doctor.id}
                className="doctor-card"
              >

                {/* Header */}
                <div className="doctor-card-header">

                  <div className="doctor-avatar">
                    {getInitials(doctor.nom)}
                  </div>

                </div>

                {/* Body */}
                <div className="doctor-card-body">

                  <h3>{doctor.nom}</h3>

                  <p className="specialty">
                    <i className="fas fa-stethoscope"></i>
                    {doctor.specialite}
                  </p>

                  <p className="location">
                    <i className="fas fa-map-marker-alt"></i>
                    {doctor.adresse}
                  </p>

                  {/* Services */}
                  <div className="services-preview">

                    <p className="services-label">
                      <i className="fas fa-notes-medical"></i>
                      Services
                    </p>

                    <div className="services-tags">

                      {(doctor.actes?.split('|') || [])
                        .slice(0, 3)
                        .map((service, idx) => (

                          <span
                            key={idx}
                            className="service-tag"
                          >
                            {service.trim()}
                          </span>

                        ))}

                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="doctor-card-footer">

                  <button
                    className="btn-view-details"
                    onClick={() =>
                      handleViewDetails(doctor)
                    }
                  >
                    {selectedDoctor?.id === doctor.id
                      ? 'Hide Details'
                      : 'View Details'}
                  </button>

                </div>

                {/* Expanded */}
                {selectedDoctor?.id === doctor.id && (

                  <div className="doctor-details-expanded">

                    <div className="details-section">

                      <h4>Full Services</h4>

                      <ul>

                        {(doctor.actes?.split('|') || [])
                          .map((service, idx) => (

                            <li key={idx}>
                              <i className="fas fa-check-circle"></i>
                              {service.trim()}
                            </li>

                          ))}

                      </ul>

                    </div>

                  </div>

                )}

              </div>

            ))

          ) : (

            <div className="no-results">

              <i className="fas fa-user-md"></i>

              <h3>No doctors found</h3>

              <p>
                Try adjusting your filters
              </p>

            </div>

          )}

        </div>

      </div>

      {/* Pagination */}
      <div className="pagination">

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.max(prev - 1, 1)
            )
          }
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <span>
          {currentPage} / {totalPages || 1}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, totalPages)
            )
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>

      </div>

      {/* Back */}
      <div className="back-to-home">

        <button
          onClick={() => navigate('/')}
          className="btn-back"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Home
        </button>

      </div>

    </div>
  );
};

export default DoctorsPage;