import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useCase } from '../../hooks/useCases'
import { useUIStore } from '../../stores/useUIStore'
import { ExportButton } from './ExportButton'
import { SimilarCasesModal } from './SimilarCasesModal'
import './CaseDetail.css'

export const CaseDetail: React.FC = () => {
  const { selectedCaseId, deselectCase, selectCase } = useUIStore()
  const { data: caseData, isLoading, isError } = useCase(selectedCaseId || '')
  const [showSimilarCases, setShowSimilarCases] = useState(false)

  const isOpen = selectedCaseId !== null

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onClose={deselectCase} className="case-detail-dialog">
      <div className="case-detail-backdrop" aria-hidden="true" />

      <div className="case-detail-container">
        <Dialog.Panel className="case-detail-panel">
          <div className="case-detail-header">
            <Dialog.Title className="case-detail-title">Case Details</Dialog.Title>
            <button
              type="button"
              onClick={deselectCase}
              className="case-detail-close"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="case-detail-content">
            {isLoading && (
              <div className="case-detail-loading">
                <div className="loading-spinner" />
                <p>Loading case details...</p>
              </div>
            )}

            {isError && (
              <div className="case-detail-error">
                <p>Error loading case details.</p>
              </div>
            )}

            {caseData && (
              <>
                <div className="case-detail-section">
                  <h3 className="case-detail-section-title">Incident</h3>
                  <div className="case-detail-grid">
                    <div className="case-detail-field">
                      <span className="case-detail-label">Case ID</span>
                      <span className="case-detail-value case-id">{caseData.id}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Date</span>
                      <span className="case-detail-value">
                        {caseData.month_name} {caseData.year}
                      </span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Agency</span>
                      <span className="case-detail-value">{caseData.agency}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">State</span>
                      <span className="case-detail-value">{caseData.state}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">County</span>
                      <span className="case-detail-value">{caseData.cntyfips}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Status</span>
                      <span
                        className={`case-status-badge ${caseData.solved === 1 ? 'solved' : 'unsolved'}`}
                      >
                        {caseData.solved === 1 ? 'Solved' : 'Unsolved'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="case-detail-section">
                  <h3 className="case-detail-section-title">Victim</h3>
                  <div className="case-detail-grid">
                    <div className="case-detail-field">
                      <span className="case-detail-label">Age</span>
                      <span className="case-detail-value">{caseData.vic_age}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Sex</span>
                      <span className="case-detail-value">{caseData.vic_sex}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Race</span>
                      <span className="case-detail-value">{caseData.vic_race}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Ethnicity</span>
                      <span className="case-detail-value">{caseData.vic_ethnic}</span>
                    </div>
                  </div>
                </div>

                <div className="case-detail-section">
                  <h3 className="case-detail-section-title">Offender</h3>
                  <div className="case-detail-grid">
                    <div className="case-detail-field">
                      <span className="case-detail-label">Age</span>
                      <span className="case-detail-value">{caseData.off_age}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Sex</span>
                      <span className="case-detail-value">{caseData.off_sex}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Race</span>
                      <span className="case-detail-value">{caseData.off_race}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Ethnicity</span>
                      <span className="case-detail-value">{caseData.off_ethnic}</span>
                    </div>
                  </div>
                </div>

                <div className="case-detail-section">
                  <h3 className="case-detail-section-title">Crime</h3>
                  <div className="case-detail-grid">
                    <div className="case-detail-field">
                      <span className="case-detail-label">Weapon</span>
                      <span className="case-detail-value">{caseData.weapon}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Relationship</span>
                      <span className="case-detail-value">{caseData.relationship}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Circumstance</span>
                      <span className="case-detail-value">{caseData.circumstance}</span>
                    </div>
                    <div className="case-detail-field">
                      <span className="case-detail-label">Situation</span>
                      <span className="case-detail-value">{caseData.situation}</span>
                    </div>
                  </div>
                </div>

                <div className="case-detail-footer">
                  <button
                    type="button"
                    className="find-similar-button"
                    onClick={() => setShowSimilarCases(true)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Find Similar Cases
                  </button>
                  <ExportButton cases={[caseData]} label="Export Case" />
                </div>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>

      {/* Similar Cases Modal */}
      {showSimilarCases && selectedCaseId && (
        <SimilarCasesModal
          caseId={selectedCaseId}
          onClose={() => setShowSimilarCases(false)}
          onSelectCase={(id) => {
            setShowSimilarCases(false)
            selectCase(id)
          }}
        />
      )}
    </Dialog>
  )
}
