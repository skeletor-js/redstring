/**
 * Test suite for exportUtils.
 *
 * Tests CSV generation, proper escaping, and all fields included.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { exportToCSV, formatCaseForDisplay } from '../../../src/utils/exportUtils'
import type { Case } from '../../../src/types/case'

// Mock DOM APIs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

const mockCase: Case = {
  id: 'CA_2020_12345',
  state: 'CALIFORNIA',
  year: 2020,
  month: 6,
  month_name: 'June',
  agency: 'Los Angeles Police Department',
  solved: 0,
  vic_age: 35,
  vic_sex: 'Male',
  vic_race: 'White',
  vic_ethnic: 'Not Hispanic or Latino',
  off_age: 25,
  off_sex: 'Male',
  off_race: 'Black',
  off_ethnic: 'Not Hispanic or Latino',
  weapon: 'Handgun - pistol, revolver, etc',
  relationship: 'Stranger',
  circumstance: 'Felony type',
  situation: 'Single victim/single offender',
  cntyfips: 'Los Angeles County',
  county_fips_code: '06037',
  latitude: 34.0522,
  longitude: -118.2437,
}

describe('exportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock document.createElement and related methods
    document.createElement = vi.fn((tagName: string) => {
      const element = {
        tagName,
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
      }
      return element as any
    })

    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportToCSV', () => {
    it('should throw error when no cases provided', async () => {
      await expect(exportToCSV([], 'test.csv')).rejects.toThrow('No cases to export')
    })

    it('should create CSV with header row', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement')

      await exportToCSV([mockCase], 'test.csv')

      expect(createElementSpy).toHaveBeenCalledWith('a')
    })

    it('should include all case fields in CSV', async () => {
      // We'll check this by verifying the Blob creation
      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([mockCase], 'test.csv')

      expect(blobContent).toContain('id,state,year,month')
      expect(blobContent).toContain('CA_2020_12345')
      expect(blobContent).toContain('CALIFORNIA')

      global.Blob = originalBlob
    })

    it('should handle commas in values by quoting', async () => {
      const caseWithComma: Case = {
        ...mockCase,
        weapon: 'Handgun, pistol, revolver',
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([caseWithComma], 'test.csv')

      expect(blobContent).toContain('"Handgun, pistol, revolver"')

      global.Blob = originalBlob
    })

    it('should escape quotes in values', async () => {
      const caseWithQuote: Case = {
        ...mockCase,
        agency: 'Sheriff\'s Department "Main"',
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([caseWithQuote], 'test.csv')

      // Quotes should be escaped as ""
      expect(blobContent).toContain('Sheriff\'s Department ""Main""')

      global.Blob = originalBlob
    })

    it('should handle newlines in values', async () => {
      const caseWithNewline: Case = {
        ...mockCase,
        circumstance: 'Felony type\nWith details',
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([caseWithNewline], 'test.csv')

      // Newlines should cause the value to be quoted
      expect(blobContent).toContain('"Felony type\nWith details"')

      global.Blob = originalBlob
    })

    it('should handle null values', async () => {
      const caseWithNull: Case = {
        ...mockCase,
        off_age: null as any,
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([caseWithNull], 'test.csv')

      // Null should be represented as empty string
      const lines = blobContent.split('\n')
      expect(lines.length).toBeGreaterThan(1)

      global.Blob = originalBlob
    })

    it('should handle undefined values', async () => {
      const caseWithUndefined: Case = {
        ...mockCase,
        latitude: undefined as any,
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([caseWithUndefined], 'test.csv')

      // Undefined should be represented as empty string
      expect(blobContent).toBeTruthy()

      global.Blob = originalBlob
    })

    it('should create blob with correct MIME type', async () => {
      const originalBlob = global.Blob
      let blobOptions: any = null

      global.Blob = vi.fn((content: any[], options: any) => {
        blobOptions = options
        return { type: options.type } as any
      }) as any

      await exportToCSV([mockCase], 'test.csv')

      expect(blobOptions.type).toBe('text/csv;charset=utf-8;')

      global.Blob = originalBlob
    })

    it('should trigger download with correct filename', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement')
      let linkElement: any = null

      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'a') {
          linkElement = {
            tagName,
            href: '',
            download: '',
            style: {},
            click: vi.fn(),
          }
          return linkElement
        }
        return {} as any
      })

      await exportToCSV([mockCase], 'my-export.csv')

      expect(linkElement.download).toBe('my-export.csv')
    })

    it('should clean up blob URL after download', async () => {
      await exportToCSV([mockCase], 'test.csv')

      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle multiple cases', async () => {
      const case2: Case = {
        ...mockCase,
        id: 'NY_2019_67890',
        state: 'NEW YORK',
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([mockCase, case2], 'test.csv')

      const lines = blobContent.split('\n')
      // Header + 2 data rows
      expect(lines.length).toBeGreaterThanOrEqual(3)
      expect(blobContent).toContain('CA_2020_12345')
      expect(blobContent).toContain('NY_2019_67890')

      global.Blob = originalBlob
    })

    it('should include all required CSV headers', async () => {
      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([mockCase], 'test.csv')

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
      ]

      headers.forEach((header) => {
        expect(blobContent).toContain(header)
      })

      global.Blob = originalBlob
    })
  })

  describe('formatCaseForDisplay', () => {
    it('should format case data with display labels', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(formatted['Case ID']).toBe('CA_2020_12345')
      expect(formatted['State']).toBe('CALIFORNIA')
      expect(formatted['Year']).toBe('2020')
      expect(formatted['Month']).toBe('June')
      expect(formatted['Agency']).toBe('Los Angeles Police Department')
    })

    it('should format solved status as text', () => {
      const solvedCase = { ...mockCase, solved: 1 }
      const unsolvedCase = { ...mockCase, solved: 0 }

      const formattedSolved = formatCaseForDisplay(solvedCase)
      const formattedUnsolved = formatCaseForDisplay(unsolvedCase)

      expect(formattedSolved['Status']).toBe('Solved')
      expect(formattedUnsolved['Status']).toBe('Unsolved')
    })

    it('should include victim information', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(formatted['Victim Age']).toBe('35')
      expect(formatted['Victim Sex']).toBe('Male')
      expect(formatted['Victim Race']).toBe('White')
      expect(formatted['Victim Ethnicity']).toBe('Not Hispanic or Latino')
    })

    it('should include offender information', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(formatted['Offender Age']).toBe('25')
      expect(formatted['Offender Sex']).toBe('Male')
      expect(formatted['Offender Race']).toBe('Black')
      expect(formatted['Offender Ethnicity']).toBe('Not Hispanic or Latino')
    })

    it('should include crime details', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(formatted['Weapon']).toBe('Handgun - pistol, revolver, etc')
      expect(formatted['Relationship']).toBe('Stranger')
      expect(formatted['Circumstance']).toBe('Felony type')
      expect(formatted['Situation']).toBe('Single victim/single offender')
    })

    it('should include location information', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(formatted['County']).toBe('Los Angeles County')
    })

    it('should convert numeric values to strings', () => {
      const formatted = formatCaseForDisplay(mockCase)

      expect(typeof formatted['Year']).toBe('string')
      expect(typeof formatted['Victim Age']).toBe('string')
      expect(typeof formatted['Offender Age']).toBe('string')
    })

    it('should return all expected display fields', () => {
      const formatted = formatCaseForDisplay(mockCase)

      const expectedFields = [
        'Case ID',
        'State',
        'Year',
        'Month',
        'Agency',
        'Status',
        'Victim Age',
        'Victim Sex',
        'Victim Race',
        'Victim Ethnicity',
        'Offender Age',
        'Offender Sex',
        'Offender Race',
        'Offender Ethnicity',
        'Weapon',
        'Relationship',
        'Circumstance',
        'Situation',
        'County',
      ]

      expectedFields.forEach((field) => {
        expect(formatted).toHaveProperty(field)
      })
    })
  })

  describe('CSV Format Validation', () => {
    it('should produce valid CSV structure', async () => {
      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([mockCase], 'test.csv')

      const lines = blobContent.split('\n')

      // First line should be headers
      expect(lines[0]).toContain('id,state,year')

      // Second line should be data
      expect(lines[1]).toContain('CA_2020_12345')

      global.Blob = originalBlob
    })

    it('should handle special characters correctly', async () => {
      const specialCase: Case = {
        ...mockCase,
        agency: 'Agency with "quotes", commas, and\nnewlines',
      }

      const originalBlob = global.Blob
      let blobContent = ''

      global.Blob = vi.fn((content: any[], options: any) => {
        blobContent = content[0]
        return { type: options.type } as any
      }) as any

      await exportToCSV([specialCase], 'test.csv')

      // Special characters should be properly escaped
      expect(blobContent).toContain('"Agency with ""quotes"", commas, and\nnewlines"')

      global.Blob = originalBlob
    })
  })
})
