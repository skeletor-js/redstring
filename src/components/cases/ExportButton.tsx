import React from 'react';
import type { Case } from '../../types/case';
import { exportToCSV } from '../../utils/exportUtils';

interface ExportButtonProps {
  cases: Case[];
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ cases, label = 'Export CSV' }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `redstring-cases-${timestamp}.csv`;
      await exportToCSV(cases, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export cases. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || cases.length === 0}
      className="export-button"
    >
      {isExporting ? 'Exporting...' : label}
    </button>
  );
};
