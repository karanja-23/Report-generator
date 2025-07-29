import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml'; // for HTML
import css from 'highlight.js/lib/languages/css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  private readonly colors = {
    critical: { bg: [220, 53, 69] as [number, number, number], text: [255, 255, 255] as [number, number, number] },
    high: { bg: [253, 126, 20] as [number, number, number], text: [255, 255, 255] as [number, number, number] },
    medium: { bg: [255, 193, 7] as [number, number, number], text: [255, 255, 255] as [number, number, number] },
    low: { bg: [40, 167, 69] as [number, number, number], text: [255, 255, 255] as [number, number, number] },
    primary: [70, 82, 104] as [number, number, number],
    secondary: [108, 117, 125] as [number, number, number],
    text: [33, 37, 41] as [number, number, number],
    lightGray: [248, 249, 250] as [number, number, number],
    darkGray: [173, 181, 189] as [number, number, number],
    white: [255, 255, 255] as [number, number, number]
  };

  constructor() { }
  async generateProjectReportPDF(project: any): Promise<void> {
    const doc = new jsPDF();
    const tocMap: Record<string, number> = {};
    let yPosition = 20;
  
    // 1. Add cover page (this will be page 1 but not numbered)
    yPosition = await this.addCoverPage(doc, project);
  
    // 2. Reserve a page for the Table of Contents (this will be page 2 but show as page 1)
    doc.addPage();
    const tocPageNumber = doc.getNumberOfPages(); // This is page 2
    yPosition = 20;
  
    // 3. Insert Project Information (this will be page 3 but show as page 2)
    doc.addPage();
    // Subtract 1 to account for the unnumbered cover page
    tocMap['projectInfo'] = doc.getNumberOfPages() - 1;
    yPosition = 20;
    yPosition = await this.addProjectInfo(doc, project, yPosition);
  
    // 4. Insert Executive Summary
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    tocMap['executiveSummary'] = doc.getNumberOfPages() - 1;
    yPosition = await this.addExecutiveSummary(doc, project, yPosition);
  
    // 5. Insert Severity Summary
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    tocMap['severitySummary'] = doc.getNumberOfPages() - 1;
    yPosition = this.addSeveritySummary(doc, project, yPosition);
  
    // 6. Insert Detailed Findings
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    tocMap['detailedFindings'] = doc.getNumberOfPages() - 1;
    yPosition = await this.addFindings(doc, project, yPosition);
    
    // 7. Fill in the Table of Contents with correct page numbers
    doc.setPage(tocPageNumber);
    this.addTableOfContents(doc, tocMap, 20);
  
    // 8. Apply footers to all pages except the cover
    this.addFooterExceptCoverPage(doc);
  
    // 9. Save the completed PDF
    doc.save(`${project.name || 'project'}_qa_report.pdf`);
}

// Alternative approach: More explicit page tracking
async generateProjectReportPDFAlternative(project: any): Promise<void> {
    const doc = new jsPDF();
    const tocMap: Record<string, number> = {};
    let yPosition = 20;
    let pageCounter = 0; // Track numbered pages separately
  
    // 1. Add cover page (unnumbered)
    yPosition = await this.addCoverPage(doc, project);
  
    // 2. Reserve a page for the Table of Contents (page 1)
    doc.addPage();
    pageCounter = 1;
    const tocPageNumber = doc.getNumberOfPages();
    yPosition = 20;
  
    // 3. Insert Project Information (page 2)
    doc.addPage();
    pageCounter = 2;
    tocMap['projectInfo'] = pageCounter;
    yPosition = 20;
    yPosition = await this.addProjectInfo(doc, project, yPosition);
  
    // 4. Insert Executive Summary
    if (yPosition > 220) {
      doc.addPage();
      pageCounter++;
    }
    tocMap['executiveSummary'] = pageCounter;
    yPosition = await this.addExecutiveSummary(doc, project, yPosition);
  
    // 5. Insert Severity Summary
    if (yPosition > 220) {
      doc.addPage();
      pageCounter++;
    }
    tocMap['severitySummary'] = pageCounter;
    yPosition = this.addSeveritySummary(doc, project, yPosition);
  
    // 6. Insert Detailed Findings
    if (yPosition > 220) {
      doc.addPage();
      pageCounter++;
    }
    tocMap['detailedFindings'] = pageCounter;
    yPosition = await this.addFindings(doc, project, yPosition);
    
    // 7. Fill in the Table of Contents with correct page numbers
    doc.setPage(tocPageNumber);
    this.addTableOfContents(doc, tocMap, 20);
  
    // 8. Apply footers to all pages except the cover
    this.addFooterExceptCoverPage(doc);
  
    // 9. Save the completed PDF
    doc.save(`${project.name || 'project'}_qa_report.pdf`);
}

// You might also need to update your addFooterExceptCoverPage method

  
private async addCoverPage(doc: jsPDF, project: any): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Clean background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Left accent strip
  const stripWidth = 50;
  doc.setFillColor(70, 82, 104); // #465268
  doc.rect(0, 0, stripWidth, pageHeight, 'F');

  // === LOGO inside strip ===
  const logoMaxWidth = 40; // keep it inside the 50pt strip
  const logoX = (stripWidth - logoMaxWidth) / 2; // center horizontally
  const logoY = 30;
  let logoHeight = 20;

  try {
    const dimensions = await this.getImageDimensions('assets/logo.png');
    if (dimensions) {
      const aspectRatio = dimensions.height / dimensions.width;
      logoHeight = logoMaxWidth * aspectRatio;
      doc.addImage('assets/logo-light.png', 'PNG', logoX, logoY, logoMaxWidth, logoHeight);
    } else {
      throw new Error('Invalid logo dimensions');
    }
  } catch {
    doc.setFillColor(248, 249, 250);
    doc.rect(logoX, logoY, logoMaxWidth, logoHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.rect(logoX, logoY, logoMaxWidth, logoHeight, 'S');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('LOGO', logoX + logoMaxWidth / 2, logoY + logoHeight / 2, { align: 'center' });
  }

  // === Main content ===
  const leftMargin = 10;
  const contentX = stripWidth + leftMargin;
  const contentWidth = pageWidth - contentX - 30;

  let y = 40;

  // Report type
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text('QUALITY ASSURANCE', contentX, y);

  // Title
  y += 20;
  const title = 'Test Report';
  let titleFontSize = 34;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  while (doc.getTextWidth(title) > contentWidth && titleFontSize > 20) {
    titleFontSize -= 2;
    doc.setFontSize(titleFontSize);
  }

  doc.text(title, contentX, y);

  // Decorative underline
  y += 8;
  doc.setDrawColor(70, 82, 104);
  doc.setLineWidth(2);
  doc.line(contentX, y, contentX + 80, y);

  // Project label
  y += 25;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('PROJECT', contentX, y);

  // Project name
  y += 12;
  const projectName = project.name || 'Project Name';
  let nameFontSize = 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(nameFontSize);

  while (doc.getTextWidth(projectName) > contentWidth && nameFontSize > 12) {
    nameFontSize -= 1;
    doc.setFontSize(nameFontSize);
  }

  const wrappedName = doc.splitTextToSize(projectName, contentWidth);
  doc.text(wrappedName, contentX, y);
  y += (wrappedName.length * 13);

  // Report date label
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('REPORT DATE', contentX, y);

  // Report date value
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  y += 12;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(12);
  doc.text(date, contentX, y);

  // Version & status
  if (project.version || project.status) {
    y += 30;

    if (project.version) {
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('VERSION', contentX, y);
      y += 12;
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text(project.version, contentX, y);
    }

    if (project.status) {
      const statusX = contentX + Math.min(120, contentWidth * 0.4);
      y -= 12;
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('STATUS', statusX, y);
      y += 12;
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text(project.status, statusX, y);
    }
  }

  // Footer
  const footerY = pageHeight - 40;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by Hosea Karanja Mungai', contentX, footerY);

  // Decorative circle
  const decoSize = 35;
  const decoX = pageWidth - decoSize - 20;
  const contentBottomY = y + 20;
  const decoY = contentBottomY + (footerY - contentBottomY) / 2 - decoSize / 2;
  doc.setFillColor(136, 152, 185); // #8898b9
  doc.circle(decoX + decoSize / 2, decoY + decoSize / 2, decoSize / 2, 'F');

  return pageHeight;
}



// Helper method to get image dimensions
private getImageDimensions(src: string): Promise<{width: number, height: number} | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}


private addTableOfContents(doc: jsPDF, tocMap: Record<string, number>, yPosition: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  yPosition += 15;
  doc.setTextColor(51, 65, 85);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TABLE OF CONTENTS', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 25;

  const tocItems = [
    { title: '1. Project Information', key: 'projectInfo' },
    { title: '2. Executive Summary', key: 'executiveSummary' },
    { title: '3. Severity Summary', key: 'severitySummary' },
    { title: '4. Detailed Findings', key: 'detailedFindings' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const leftX = 25;
  const rightX = 170;

  tocItems.forEach(item => {
    const page = tocMap[item.key] ?? '-';
    const pageNumberText = page.toString();
    
    // Display the title
    doc.text(item.title, leftX, yPosition);
    
    // Display the page number at fixed right position
    doc.text(pageNumberText, rightX, yPosition, { align: 'right' });
    
    // Calculate dots between title and page number
    const titleWidth = doc.getTextWidth(item.title);
    const pageNumberWidth = doc.getTextWidth(pageNumberText);
    const dotsStart = leftX + titleWidth + 3;
    const dotsEnd = rightX - pageNumberWidth - 3; // End just before page number
    const dotsWidth = dotsEnd - dotsStart;
    
    if (dotsWidth > 5) {
      const dotSpacing = 3;
      const dotCount = Math.floor(dotsWidth / dotSpacing);
      
      // Create evenly spaced dots
      let dotsText = '';
      for (let i = 0; i < dotCount; i++) {
        dotsText += '.';
        if (i < dotCount - 1) {
          dotsText += ' '.repeat(Math.max(1, Math.floor(dotSpacing / 2)));
        }
      }
      
      doc.text(dotsText, dotsStart, yPosition);
    }

    yPosition += 12;
  });

  return yPosition + 20;
}
private async addProjectInfo(doc: jsPDF, project: any, yPosition: number): Promise<number> {
  // Section header
  doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
  doc.rect(20, yPosition - 5, 170, 12, 'F');
  doc.setTextColor('#fff');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PROJECT INFORMATION', 25, yPosition + 3);

  yPosition += 20;

  // Project basic info
  doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);

  const projectData = [
    ['Project Name', project.name || 'N/A'],
    ['Date Created', new Date(project.created_at).toLocaleDateString()],
    ['Report Generated', new Date().toLocaleDateString()],
    ['Total Findings', project.findings?.length.toString() || '0'],
    ['Assessment Status', 'In Progress'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['', '']],
    body: projectData,
    theme: 'grid',
    headStyles: {
      fillColor: this.colors.lightGray,
      textColor: this.colors.text,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 60 },
      1: { cellWidth: 110 }
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 80;

  if (project.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold'); // Keep bold for heading
    doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
    doc.text('Project Description:', 20, yPosition);
    yPosition += 15;
  
    try {
      const parsedDescription = typeof project.description === 'string' 
        ? JSON.parse(project.description) 
        : project.description;
      
      if (parsedDescription.blocks) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const leftMargin = 20;
        const rightMargin = 20;
        const maxTextWidth = pageWidth - leftMargin - rightMargin;
  
        // Set text style to match executive summary
        doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
        doc.setFontSize(10); // Same as executive summary
        doc.setFont('helvetica', 'normal'); // Same as executive summary
        const lineHeight = 7; // Same as executive summary
  
        // Process each paragraph separately for better spacing
        parsedDescription.blocks.forEach((block: any, blockIndex: number) => {
          if (block.type === 'paragraph' && block.data && block.data.text) {
            const paragraphLines = doc.splitTextToSize(block.data.text, maxTextWidth);
            
            // Add the paragraph with same line height as executive summary
            paragraphLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, leftMargin, yPosition + (lineIndex * lineHeight));
            });
            
            yPosition += paragraphLines.length * lineHeight;
            
            // Add reduced space between paragraphs (except for the last one)
            if (blockIndex < parsedDescription.blocks.length - 1) {
              yPosition += 3; // Reduced from 8 to 3
            }
          }
        });
  
        yPosition += 15; // Final space after description
      }
    } catch (error) {
      console.error('Error parsing description JSON:', error);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text('Error parsing description', 20, yPosition);
      yPosition += 20;
    }
  }
  

  return yPosition;
}
private addExecutiveSummary(doc: jsPDF, project: any, yPosition: number): number {
  const marginX = 20;
  const contentWidth = 170;
  const lineHeight = 7;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 30;

  // Add new page if too close to bottom
  if (yPosition > pageHeight - bottomMargin - 30) {
    doc.addPage();
    yPosition = 30;
  }

  // Section header
  doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
  doc.rect(marginX, yPosition - 5, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. EXECUTIVE SUMMARY', marginX + 5, yPosition + 3);
  yPosition += 20;

  // Severity Data
  const severityCounts = this.calculateSeverityCounts(project.findings);
  const totalFindings = project.findings?.length || 0;
  const critical = severityCounts['Critical'] || 0;
  const high = severityCounts['High'] || 0;
  const medium = severityCounts['Medium'] || 0;
  const low = severityCounts['Low'] || 0;

  // Set up text styling
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);

  // Findings distribution narrative
  const distributionTexts = [];
  
  if (critical > 0) {
    distributionTexts.push(`${critical} critical issue${critical > 1 ? 's' : ''} requiring immediate remediation to prevent potential system failures or security breaches.`);
  }
  
  if (high > 0) {
    distributionTexts.push(`${high} high-priority issue${high > 1 ? 's' : ''} that could significantly impact system reliability and user experience.`);
  }
  
  if (medium > 0) {
    distributionTexts.push(`${medium} medium-priority issue${medium > 1 ? 's' : ''} affecting system efficiency and requiring planned resolution.`);
  }
  
  if (low > 0) {
    distributionTexts.push(`${low} low-priority issue${low > 1 ? 's' : ''} consisting of minor inconsistencies and cosmetic concerns.`);
  }

  // If no findings, add appropriate text
  if (totalFindings === 0) {
    distributionTexts.push(`No significant issues were identified during the assessment, indicating a well-maintained and stable system.`);
  }

  // Create a flowing narrative from the findings
  let findingsNarrative = '';
  if (distributionTexts.length > 0) {
    findingsNarrative = `The assessment revealed ${distributionTexts.join(' Additionally, there are ')}`;
    
    // Add concluding statement based on severity distribution
    if (critical > 0 || high > 0) {
      findingsNarrative += ' Priority should be given to addressing the most severe issues to maintain system integrity and prevent potential disruptions.';
    } else if (medium > 0 || low > 0) {
      findingsNarrative += ' These findings present opportunities for system optimization and quality enhancement.';
    }
  }

  // Render findings narrative
  const narrativeLines = doc.splitTextToSize(findingsNarrative, contentWidth);
  for (const line of narrativeLines) {
    if (yPosition > pageHeight - bottomMargin) {
      doc.addPage();
      yPosition = 30;
    }
    doc.text(line, marginX, yPosition);
    yPosition += lineHeight;
  }

  return yPosition + 15;
}


private addSeveritySummary(doc: jsPDF, project: any, yPosition: number): number {
  // Calculate total content height needed
  const headerHeight = 30;
  const cardHeight = 50;
  const summaryBarHeight = 20;
  const spacing = 20;
  const totalContentHeight = headerHeight + cardHeight + summaryBarHeight + spacing + 35;
  
  // Check if we need a new page - account for all content that will be added
  if (yPosition + totalContentHeight > 280) { // Assuming page height ~280, adjust as needed
    doc.addPage();
    yPosition = 20;
  }
  
  // Section header
  doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
  doc.rect(20, yPosition - 5, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. SEVERITY SUMMARY', 25, yPosition + 3);
  
  yPosition += 30;
  
  const severityCounts = this.calculateSeverityCounts(project.findings);
  const totalFindings = Object.values(severityCounts).reduce((a, b) => a + b, 0);
  
  // Enhanced card layout with better proportions
  const cardWidth = 38;
  const cardHeightActual = 50;
  const cardSpacing = 6;
  const startX = 20 + (170 - (Object.keys(severityCounts).length * cardWidth + (Object.keys(severityCounts).length - 1) * cardSpacing)) / 2;
  let xPosition = startX;
  
  Object.entries(severityCounts).forEach(([severity, count]) => {
    const color = this.colors[severity.toLowerCase() as keyof typeof this.colors] as any;
    const percentage = totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0;
    
    // Modern card with subtle shadow
    doc.setFillColor(245, 245, 245);
    doc.rect(xPosition + 1, yPosition + 1, cardWidth, cardHeightActual, 'F');
    
    // Main card background
    doc.setFillColor(255, 255, 255);
    doc.rect(xPosition, yPosition, cardWidth, cardHeightActual, 'F');
    
    // Colored top accent bar
    doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
    doc.rect(xPosition, yPosition, cardWidth, 4, 'F');
    
    // Subtle border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.rect(xPosition, yPosition, cardWidth, cardHeightActual);
    
    // Severity indicator circle
    const circleRadius = 3;
    const circleX = xPosition + cardWidth - 8;
    const circleY = yPosition + 12;
    doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
    doc.circle(circleX, circleY, circleRadius, 'F');
    
    // Severity level text
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(severity.toUpperCase(), xPosition + cardWidth/2, yPosition + 12, { align: 'center' });
    
    // Count - main metric
    doc.setTextColor(color.text[0], color.text[1], color.text[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(count.toString(), xPosition + cardWidth/2, yPosition + 28, { align: 'center' });
    
    // Percentage indicator
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${percentage}%`, xPosition + cardWidth/2, yPosition + 36, { align: 'center' });
    
    // Label
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('FINDINGS', xPosition + cardWidth/2, yPosition + 44, { align: 'center' });
    
    xPosition += cardWidth + cardSpacing;
  });
  
  // Add summary statistics below cards
  yPosition += cardHeightActual + 20;
  
  // Summary metrics bar
  doc.setFillColor(250, 250, 250);
  doc.rect(20, yPosition, 170, 20, 'F');
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.5);
  doc.rect(20, yPosition, 170, 20);
  
  // Total findings
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL FINDINGS:', 25, yPosition + 8);
  
  doc.setTextColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(totalFindings.toString(), 70, yPosition + 8);
  
  // Average risk level
  const averageRiskLevel = this.calculateAverageRiskLevel(severityCounts);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AVERAGE RISK LEVEL:', 25, yPosition + 16);
  
  const riskColor = this.getRiskLevelColor(averageRiskLevel.level);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Display differently if no findings
  if (totalFindings === 0) {
    doc.text('NO FINDINGS', 85, yPosition + 16);
  } else {
    doc.text(`${averageRiskLevel.level.toUpperCase()} `, 65, yPosition + 16);
  }
  
  return yPosition + 35;
}

// Helper methods for enhanced functionality
private calculateAverageRiskLevel(severityCounts: any): { level: string, score: number } {
  // More robust extraction - handle different possible key formats
  const getSeverityCount = (severity: string): number => {
    // Try different possible key formats
    const possibleKeys = [
      severity,
      severity.toLowerCase(),
      severity.toUpperCase(),
      severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()
    ];
    
    for (const key of possibleKeys) {
      if (severityCounts[key] !== undefined) {
        return Number(severityCounts[key]) || 0;
      }
    }
    return 0;
  };
  
  const critical = getSeverityCount('critical');
  const high = getSeverityCount('high');
  const medium = getSeverityCount('medium');
  const low = getSeverityCount('low');
  
  const totalFindings = critical + high + medium + low;
  
  // Debug: Log the values to understand what's happening
  console.log('Severity counts:', { critical, high, medium, low, totalFindings });
  console.log('Original severityCounts:', severityCounts);
  
  if (totalFindings === 0) {
    return { level: 'none', score: 0 };
  }
  
  // Assign weighted scores to each severity level
  const severityWeights = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  
  const weightedSum = (critical * severityWeights.critical) + 
                      (high * severityWeights.high) + 
                      (medium * severityWeights.medium) + 
                      (low * severityWeights.low);
  
  const averageScore = weightedSum / totalFindings;
  
  console.log('Weighted calculation:', { weightedSum, totalFindings, averageScore });
  
  // Determine risk level based on average score
  let level: string;
  if (averageScore >= 3.5) {
    level = 'critical';
  } else if (averageScore >= 2.5) {
    level = 'high';
  } else if (averageScore >= 1.5) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { level, score: averageScore };
}
private getRiskLevelColor(riskLevel: string): number[] {
  const riskColors = {
    critical: [220, 38, 38],
    high: [234, 88, 12],
    medium: [245, 158, 11],
    low: [34, 197, 94]
  };
  return riskColors[riskLevel as keyof typeof riskColors] || [100, 100, 100];
}

  private async addFindings(doc: jsPDF, project: any, yPosition: number): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    const safeBottom = pageHeight - 25;
    const maxTextWidth = 160;
    const startX = 25;
    let y = yPosition;
  
    // Check if we need a new page
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    
    // Section header
    doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    doc.rect(20, y - 5, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. FINDINGS', 25, y + 3);
    
    y += 25;
  
    if (!project.findings || project.findings.length === 0) {
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.colors.secondary);
      doc.text('No findings available.', startX, y);
      return y + 10;
    }
  
    // Process each finding
    for (let i = 0; i < project.findings.length; i++) {
      const finding = project.findings[i];
      
      // Check if we need a new page for the finding
      if (y + 50 > safeBottom) {
        doc.addPage();
        y = 30;
      }
  
      y = await this.addSingleFindingWithHeaders(doc, finding, i + 1, y);
    }
  
    return y;
  }
  
  private async addSingleFindingWithHeaders(
    doc: jsPDF,
    finding: any,
    index: number,
    y: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    const safeBottom = pageHeight - 25;
    const maxTextWidth = 160;
    const startX = 25;
  
    const title = `${index}. ${finding.title || 'Untitled Finding'}`;
    const titleLines = doc.splitTextToSize(title, maxTextWidth);
    const titleHeight = titleLines.length * 5;
  
    // Add new page if title and metadata overflow
    if (y + titleHeight + 30 > safeBottom) {
      doc.addPage();
      y = 30;
    }
  
    // --- Title ---
    doc.setTextColor(...this.colors.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(titleLines, startX, y);
    y += titleHeight + 6;
  
    // --- Category and Severity Row with better UI ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Category section with background
    const categoryText = finding.category?.name || 'Uncategorized';
    const categoryLabel = 'CATEGORY';
    
    // Category background box
    doc.setFillColor(...this.colors.lightGray);
    doc.roundedRect(startX, y - 3, 45, 10, 2, 2, 'F');
    
    // Category label
    doc.setTextColor(...this.colors.secondary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryLabel, startX + 2, y + 1);
    
    // Category value
    doc.setTextColor(...this.colors.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(categoryText, startX + 2, y + 5);
    
    // Severity section with colored background
    const severityKey = (finding.severity?.name || 'medium').toLowerCase();
    const colorEntry = this.colors[severityKey as keyof typeof this.colors];
    // Use bg color instead of text color for better visibility on white background
    const severityColor = 'bg' in colorEntry ? (colorEntry.bg as number[]) : [0, 0, 0];
    const severityColorTuple = severityColor as [number, number, number];
    
    const severityValue = finding.severity?.name || 'Medium';
    const severityLabel = 'SEVERITY';
    const severityStartX = startX + 55;
    
    // Severity background box with severity color
    doc.setFillColor(...severityColorTuple);
    doc.roundedRect(severityStartX, y - 3, 40, 10, 2, 2, 'F');
    
    // Severity label
    doc.setTextColor(...this.colors.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(severityLabel, severityStartX + 2, y + 1);
    
    // Severity value
    doc.setTextColor(...this.colors.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(severityValue.toUpperCase(), severityStartX + 2, y + 5);
    
    y += 15;
  
    // --- Description with Header Support ---
    if (finding.description) {
      doc.setTextColor(...this.colors.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Description:', startX, y);
      y += 6;
  
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
  
      const { text: descText, images } = await this.parseEditorJSContent(finding.description, true);
      
      // Process text with headers and images
      y = await this.processTextWithHeadersAndImages(doc, descText, images, startX, y, maxTextWidth);
    }
  
    // --- Separator ---
    const sepHeight = 12;
    if (y + sepHeight > safeBottom) {
      doc.addPage();
      y = 30;
    }
  
    doc.setDrawColor(...this.colors.darkGray);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(startX, y, 185, y);
    doc.setLineDashPattern([], 0);
    y += sepHeight;
  
    return y;
  }
  
  private async processTextWithHeadersAndImages(
    doc: jsPDF,
    text: string,
    images: any[],
    startX: number,
    y: number,
    maxWidth: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    const safeBottom = pageHeight - 25;
    const headerRegex = /\[HEADER:(\d+):(\d+)\](.*?)\[\/HEADER\]/g;
    
    // Split text by image placeholders and headers
    const textParts = text.split(/\[IMAGE_PLACEHOLDER_\d+\]/);
    let currentY = y;
    let imageIndex = 0;
  
    for (let i = 0; i < textParts.length; i++) {
      const part = textParts[i].trim();
      
      if (part) {
        // Check if we need a new page before processing text
        const estimatedTextHeight = this.estimateTextHeight(doc, part, maxWidth);
        if (currentY + estimatedTextHeight > safeBottom) {
          doc.addPage();
          currentY = 30;
        }
        
        // Process this text part for headers - pass safeBottom for boundary checking
        currentY = await this.processTextWithHeaders(doc, part, startX, currentY, maxWidth, safeBottom);
      }
  
      // Add image if available
      if (i < images.length && imageIndex < images.length) {
        // More conservative image height estimation
        const estImgHeight = 80; // Increased from 60 to account for captions/spacing
        
        // Check if image will fit on current page
        if (currentY + estImgHeight > safeBottom) {
          doc.addPage();
          currentY = 30;
        }
        
        // Add the image and get actual height used
        const imageStartY = currentY;
        currentY = await this.addImageToPDF(doc, images[imageIndex], currentY);
        
        // Double-check we didn't overflow after adding the actual image
        if (currentY > safeBottom) {
          // If we overflowed, move image to next page
          doc.addPage();
          currentY = 30;
          currentY = await this.addImageToPDF(doc, images[imageIndex], currentY);
        }
        
        imageIndex++;
        
        // Add some spacing after image
        currentY += 5;
      }
    }
  
    return currentY;
  }
  
  // Helper method to estimate text height
  private estimateTextHeight(doc: jsPDF, text: string, maxWidth: number): number {
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = 4; // Adjust based on your font size
    return lines.length * lineHeight + 10; // Add some padding
  }
  
  // Updated processTextWithHeaders to accept safeBottom parameter
  private async processTextWithHeaders(
    doc: jsPDF,
    text: string,
    startX: number,
    y: number,
    maxWidth: number,
    safeBottom: number // Add this parameter
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerRegex = /\[HEADER:(\d+):(\d+)\](.*?)\[\/HEADER\]/g;
    let currentY = y;
    
    // Split text into segments (headers and regular text)
    const segments = [];
    let lastIndex = 0;
    let match;
    
    while ((match = headerRegex.exec(text)) !== null) {
      // Add text before header
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add header
      segments.push({
        type: 'header',
        level: parseInt(match[1]),
        size: parseInt(match[2]),
        content: match[3]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // Process each segment
    for (const segment of segments) {
      if (segment.type === 'header') {
        // Check if header fits on current page
        const headerHeight = segment.size || 12;
        if (currentY + headerHeight + 5 > safeBottom) {
          doc.addPage();
          currentY = 30;
        }
        
        doc.setFontSize(segment.size || 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text(segment.content, startX, currentY);
        currentY += (segment.size || 12) * 0.4 + 5;
        
      } else if (segment.type === 'text' && segment.content.trim()) {
        // Process regular text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.text);
        
        const lines = doc.splitTextToSize(segment.content.trim(), maxWidth);
        const textHeight = lines.length * 4;
        
        // Check if text block fits on current page
        if (currentY + textHeight > safeBottom) {
          doc.addPage();
          currentY = 30;
        }
        
        doc.text(lines, startX, currentY);
        currentY += textHeight + 3;
      }
    }
    
    return currentY;
  }
  
  
  
  
  async getBase64ImageFromURL(imageUrl: string): Promise<string> {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status}`);
      }
      const blob = await res.blob();
    
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  }
  
  private async parseEditorJSContent(description: any, collectImages: boolean = false): Promise<{
    text: string;
    images: Array<{ base64: string; caption: string; position: number }>;
  }> {
    if (!description?.blocks) return { text: '', images: [] };
    
    const contentLines: string[] = [];
    const images: Array<{ base64: string; caption: string; position: number }> = [];
    let imageCount = 0;
  
    for (const block of description.blocks) {
      const { type, data } = block;
    
      switch (type) {
        case 'header':
case 'Header':
  const level = Math.min(Math.max(data.level || 1, 1), 6);
  // Add header with appropriate styling based on level
  const headerText = data.text || '';
  const fontSize = 14 - (level - 1) * 2; // h1=14, h2=12, h3=10, etc.
  
  // Add some spacing before header
  if (contentLines.length > 0) {
    contentLines.push('\n');
  }
  
  // Store header info for PDF rendering
  contentLines.push(`[HEADER:${level}:${fontSize}]${headerText}[/HEADER]`);
  break;
          
        case 'paragraph':
          const paragraphText = this.stripHtmlTags(data.text || '');
          if (paragraphText.trim()) {
            contentLines.push(`\n${paragraphText}`);
          }
          break;
          case 'list':
case 'List': {
  const isOrdered = data.style === 'ordered';
  const listItems = this.parseListItems(data.items || [], isOrdered);

  // Optional: Add spacing before the list
  if (contentLines.length > 0) {
    contentLines.push('');
  }

  listItems.forEach(item => {
    // Don't add bullet if it's already present
    const line = item.trim().startsWith('•') || item.trim().match(/^\d+\./)
      ? '        ' + item  // 8 spaces for clear distinction
      : '        • ' + item;  // 8 spaces for clear distinction

    contentLines.push(line);
  });

  contentLines.push('');
  break;
}

        case 'code':
        case 'CodeTool':
          if (data.code) {
            contentLines.push(`\n--- Code Block ---`);
            const fullCode = data.code.toString().trim();
            const codeLines = fullCode.split('\n');
            codeLines.forEach((line:any) => {
              contentLines.push(`  ${line}`);
            });
            contentLines.push(`--- End Code ---`);
          }
          break;
          
        case 'quote':
        case 'Quote':
          const quoteText = this.stripHtmlTags(data.text || '');
          const caption = data.caption ? ` — ${data.caption}` : '';
          contentLines.push(`\n> "${quoteText}"${caption}`);
          break;
          
        case 'image':
        case 'ImageTool':
          if (collectImages) {
            const imageResult = await this.processImageForPDF(data);
            if (imageResult.base64) {
              const imageCaption = data.caption || data.file?.caption || `Image ${imageCount + 1}`;
              images.push({
                base64: imageResult.base64,
                caption: imageCaption,
                position: contentLines.length
              });
              contentLines.push(`\n[IMAGE_PLACEHOLDER_${imageCount}]`);
              imageCount++;
            } else {
              contentLines.push(`\n[Image: ${data.caption || 'Unable to load'}]`);
            }
          } else {
            contentLines.push(`\n[Image: ${data.caption || 'Untitled'}]`);
          }
          break;
          case 'table':
  if (data?.content?.length) {
    contentLines.push('\n--- Table ---');

    const rows = data.content.map((row: string[]) =>
      row.map(cell => this.stripHtmlTags(cell))
    );

    // Add Markdown-style header row if table has at least one row
    if (rows.length > 0) {
      const header = rows[0];
      const separator = header.map(() => '---');

      contentLines.push(`| ${header.join(' | ')} |`);
      contentLines.push(`| ${separator.join(' | ')} |`);

      for (let i = 1; i < rows.length; i++) {
        contentLines.push(`| ${rows[i].join(' | ')} |`);
      }
    }

    contentLines.push('--- End Table ---');
  }
  break;
          
        default:
          contentLines.push(`\n[Unsupported block: ${type}]`);
      }
    }
  
    return {
      text: contentLines.join('\n').trim(),
      images
    };
  }
  
  
  // Method to add image to PDF
  private async addImageToPDF(doc: jsPDF, image: { base64: string; caption: string }, yPosition: number): Promise<number> {
    try {
      // Get image dimensions
      const img = new Image();
      img.src = image.base64;
      
      return new Promise((resolve) => {
        img.onload = () => {
          const maxWidth = 140; // Maximum width for images in PDF
          const maxHeight = 80; // Maximum height for images in PDF
          
          let width = img.width;
          let height = img.height;
          
          // Scale image to fit within max dimensions
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio, 1); // Don't scale up
          
          width *= ratio;
          height *= ratio;
          
          // Center the image
          const x = 25 + (maxWidth - width) / 2;
          
          // Add image to PDF
          doc.addImage(image.base64, 'JPEG', x, yPosition, width, height);
          
          // Add caption below image
          yPosition += height + 5;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
          doc.text(image.caption, 25 + maxWidth/2, yPosition, { align: 'center' });
          
          resolve(yPosition + 10);
        };
        
        img.onerror = () => {
          // Fallback if image fails to load
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(`[Image: ${image.caption} - Failed to load]`, 25, yPosition);
          resolve(yPosition + 10);
        };
      });
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`[Image: ${image.caption} - Error]`, 25, yPosition);
      return yPosition + 10;
    }
  }
  
  // Updated processImageForPDF method
  private async processImageForPDF(data: any): Promise<{ base64: string; format: string }> {
    const imageUrl = data.file?.url || data.url;
    
    if (!imageUrl) {
      return { base64: '', format: '' };
    }
    
    try {
      // Handle relative URLs
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
      const base64 = await this.getBase64ImageFromURL(fullUrl);
      
      // Extract format from base64 string
      const formatMatch = base64.match(/^data:image\/([a-zA-Z]*);base64,/);
      const format = formatMatch ? formatMatch[1] : 'jpeg';
      
      return { base64, format };
    } catch (error) {
      console.error('Failed to process image for PDF:', error);
      return { base64: '', format: '' };
    }
  }
  
  private async handleImageBlock(data: any, contentLines: string[]): Promise<void> {
    if (!data) {
      contentLines.push('\n[Image block with no data]');
      return;
    }
  
    const imageUrl = data.file?.url || data.url;
    const caption = data.caption || data.file?.caption || 'Untitled';
    
    if (!imageUrl) {
      contentLines.push('\n[Image block with missing URL]');
      return;
    }
  
    try {
      // Convert image to base64 for PDF embedding
      const base64Image = await this.getBase64ImageFromURL(imageUrl);
      
      if (base64Image) {
        contentLines.push(`\n[Image: ${caption}]`);
        contentLines.push(`![${caption}](${base64Image})`);
        
        // Add additional metadata if available
        if (data.withBorder) contentLines.push('[With Border]');
        if (data.withBackground) contentLines.push('[With Background]');
        if (data.stretched) contentLines.push('[Stretched]');
      } else {
        // Fallback if base64 conversion fails
        contentLines.push(`\n[Image: ${caption}]`);
        contentLines.push(`[Original URL: ${imageUrl}]`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      contentLines.push(`\n[Image: ${caption} - Error loading]`);
      contentLines.push(`[Original URL: ${imageUrl}]`);
    }
  }
  
  private parseListItems(items: any[], isOrdered: boolean = false): string[] {
    const result: string[] = [];
    
    if (!Array.isArray(items)) return result;
    
    items.forEach((item, index) => {
      const prefix = isOrdered ? `${index + 1}. ` : '• ';
      
      if (typeof item === 'string') {
        const cleanText = this.stripHtmlTags(item);
        if (cleanText.trim()) {
          result.push(`\n${prefix}${cleanText}`);
        }
      } else if (item && typeof item === 'object') {
        // Handle nested list items or complex list structures
        const text = item.content || item.text || item.value || '';
        const cleanText = this.stripHtmlTags(text);
        if (cleanText.trim()) {
          result.push(`\n${prefix}${cleanText}`);
        }
        
        // Handle nested items if they exist
        if (item.items && Array.isArray(item.items)) {
          const nestedItems = this.parseListItems(item.items, isOrdered);
          nestedItems.forEach(nestedItem => {
            result.push(`  ${nestedItem}`); // Indent nested items
          });
        }
      }
    });
    
    return result;
  }
  
  private stripHtmlTags(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
  
  // Additional utility method for handling different image formats in PDF
  


  private calculateSeverityCounts(findings: any[]): { [key: string]: number } {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    
    if (findings) {
      findings.forEach(finding => {
        const severity = finding.severity?.name || 'Medium';
        if (counts.hasOwnProperty(severity)) {
          counts[severity as keyof typeof counts]++;
        }
      });
    }
    
    return counts;
  }
  private addFooterExceptCoverPage(doc: jsPDF): void {
    const pageCount = (doc as any).internal.pages.length - 1; // Correct way to get page count
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Skip the cover page (first page)
        if (i === 1) {
            continue;
        }
        
        // Add footer/pagination for all other pages
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add page number
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i-1} of ${pageCount-1}`, 
            pageWidth - 20, 
            pageHeight - 10, 
            { align: 'right' }
        );
        
        // Add any other footer content here (company name, etc.)
        doc.setFontSize(8);
        doc.text('Sibasi Limited QA Report', 
            20, 
            pageHeight - 10, 
            { align: 'left' }
        );
    }
}
  
}