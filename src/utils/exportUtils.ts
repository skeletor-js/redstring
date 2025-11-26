import type { Case } from '../types/case';

/**
 * Export cases to CSV format
 */
export async function exportToCSV(cases: Case[], filename: string): Promise<void> {
  if (cases.length === 0) {
    throw new Error('No cases to export');
  }

  // Define CSV headers (all case fields)
  const headers = [
    'id',
    'state',
    'year',
    'month',
    'month_name',
    'agency',
    'solved',
    'vic_age',
    'vic_sex',
    'vic_race',
    'vic_ethnic',
    'off_age',
    'off_sex',
    'off_race',
    'off_ethnic',
    'weapon',
    'relationship',
    'circumstance',
    'situation',
    'cntyfips',
    'county_fips_code',
    'latitude',
    'longitude',
  ];

  // Build CSV content
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const caseItem of cases) {
    const row = headers.map((header) => {
      const value = caseItem[header as keyof Case];

      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }

      // Escape values that contain commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format a case for display
 */
export function formatCaseForDisplay(caseItem: Case): Record<string, string> {
  return {
    'Case ID': caseItem.id,
    State: caseItem.state,
    Year: String(caseItem.year),
    Month: caseItem.month_name,
    Agency: caseItem.agency,
    Status: caseItem.solved === 1 ? 'Solved' : 'Unsolved',
    'Victim Age': String(caseItem.vic_age),
    'Victim Sex': caseItem.vic_sex,
    'Victim Race': caseItem.vic_race,
    'Victim Ethnicity': caseItem.vic_ethnic,
    'Offender Age': String(caseItem.off_age),
    'Offender Sex': caseItem.off_sex,
    'Offender Race': caseItem.off_race,
    'Offender Ethnicity': caseItem.off_ethnic,
    Weapon: caseItem.weapon,
    Relationship: caseItem.relationship,
    Circumstance: caseItem.circumstance,
    Situation: caseItem.situation,
    County: caseItem.cntyfips,
  };
}
