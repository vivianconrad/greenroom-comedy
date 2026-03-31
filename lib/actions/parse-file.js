'use server'

import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from './utils'

/**
 * Parses an uploaded .xlsx file into a 2D array of strings (rows × cells).
 * Runs server-side so ExcelJS (Node-only) can be used safely.
 * Requires the user to be authenticated so this can't be called anonymously.
 */
export async function parseExcelFile(formData) {
  const supabase = await createClient()
  try {
    await getAuthenticatedUser(supabase)

    const file = formData.get('file')
    if (!file || typeof file === 'string') return { error: 'No file provided.' }

    const buf = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buf)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) return { error: 'No sheets found in the file.' }

    const rows = []
    worksheet.eachRow((row) => {
      rows.push(
        row.values.slice(1).map((v) => {
          if (v == null) return ''
          // Rich text cells
          if (typeof v === 'object' && v.richText) {
            return v.richText.map((rt) => rt.text ?? '').join('')
          }
          // Hyperlink cells
          if (typeof v === 'object' && v.text) return String(v.text)
          // Date cells
          if (v instanceof Date) return v.toISOString().split('T')[0]
          return String(v)
        })
      )
    })

    return { rows }
  } catch (e) {
    return { error: e.message }
  }
}
