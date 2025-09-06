import { JSDOM } from 'jsdom';

export interface ExtractedContent {
  title: string;
  content: string;
  text: string;
  length: number;
}

export async function extractReadableContent(html: string, url: string): Promise<ExtractedContent | null> {
  try {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach(el => el.remove());
    
    // Try to find main content area
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.main-content'
    ];
    
    let contentElement: Element | null = null;
    
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    // Fallback to body if no content area found
    if (!contentElement) {
      contentElement = document.body;
    }
    
    if (!contentElement) return null;
    
    // Extract title
    const title = document.querySelector('h1')?.textContent?.trim() || 
                  document.querySelector('title')?.textContent?.trim() || 
                  '';
    
    // Extract text content
    const text = contentElement.textContent || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract HTML content
    const content = contentElement.innerHTML;
    
    return {
      title,
      content,
      text: cleanText,
      length: cleanText.length
    };
  } catch (error) {
    console.error('Error extracting readable content:', error);
    return null;
  }
}

export function shouldExtractFullText(summary: string | null, title: string): boolean {
  if (!summary) return true;
  
  const summaryLength = summary.length;
  const titleLength = title.length;
  
  // Extract if summary is too short (< 200 chars) or mostly title repetition
  if (summaryLength < 200) return true;
  
  // Check if summary is mostly the same as title
  const similarity = calculateSimilarity(summary, title);
  if (similarity > 0.8) return true;
  
  return false;
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
