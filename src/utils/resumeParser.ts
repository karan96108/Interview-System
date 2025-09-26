import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/;

const sanitize = (value?: string): string | undefined => value?.trim() || undefined;

const guessNameFromText = (text: string): string | undefined => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[^A-Za-z'\s-]/g, ' ').trim())
    .filter((line) => line.length > 0);

  for (const line of lines.slice(0, 8)) {
    if (/(resume|curriculum|profile)/i.test(line)) {
      continue;
    }
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const properCase = words.every((word) => /^[A-Z][a-z'\-]+$/.test(word));
      if (properCase) {
        return line;
      }
    }
  }

  return undefined;
};

const extractFields = (text: string) => {
  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);

  return {
    name: sanitize(guessNameFromText(text)),
    email: sanitize(emailMatch?.[0]),
    phone: sanitize(phoneMatch?.[0])
  };
};

const readPdf = async (arrayBuffer: ArrayBuffer) => {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean);
    pageTexts.push(strings.join(' '));
  }

  return pageTexts.join('\n');
};

const readDocx = async (arrayBuffer: ArrayBuffer) => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseResumeFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop()?.toLowerCase();

  let text: string;

  if (extension === 'pdf') {
    text = await readPdf(arrayBuffer);
  } else if (extension === 'docx') {
    text = await readDocx(arrayBuffer);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX resume.');
  }

  const extracted = extractFields(text);

  return {
    resumeText: text,
    extracted
  };
};

export const fillFieldFromInput = (
  field: 'name' | 'email' | 'phone',
  message: string
): string | undefined => {
  const trimmed = message.trim();

  if (field === 'email') {
    const match = trimmed.match(emailRegex);
    return match?.[0];
  }

  if (field === 'phone') {
    const match = trimmed.match(phoneRegex);
    return match?.[0];
  }

  if (field === 'name') {
    const normalized = trimmed
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    if (normalized.split(' ').length >= 2) {
      return normalized;
    }
  }

  return undefined;
};
