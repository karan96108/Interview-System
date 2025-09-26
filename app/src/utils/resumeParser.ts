import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
import mammoth from 'mammoth/mammoth.browser'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export const parsePdf = async (arrayBuffer: ArrayBuffer) => {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
    text += `${strings.join(' ')}\n`
  }
  return text
}

export const parseDocx = async (arrayBuffer: ArrayBuffer) => {
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export const parseResume = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePdf(arrayBuffer)
  }
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    return parseDocx(arrayBuffer)
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX resume.')
}
