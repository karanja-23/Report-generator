import {
  Component,
  OnInit,
  PLATFORM_ID,
  Inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ReportsService } from '../../Services/reports.service';
import { ProjectViewService } from '../../Services/project-view.service';
import { PdfGeneratorService } from '../../Services/pdf-generator.service';

import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-view-report',
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    LoadingComponent,
  ],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.css',
  providers: [MessageService],
})
export class ViewReportComponent implements OnInit, AfterViewInit, OnDestroy {
  isBrowser: boolean;

  isLoading: boolean = false;
  editorsInitializing: boolean = false;

  editors: { [key: string]: any } = {};
  editor: any;
  editorInitialized: boolean = false;

  projectId: number = 0;
  project: any;
  date: any;
  description: any;

  expandReport: boolean = false;
  showNewFindingForm: boolean = false;
  showDeleteConfirmation: boolean = false;
  editProjectMessage: string = '';

  categories: any = [];
  severities: any = [];

  high: number = 0;
  medium: number = 0;
  low: number = 0;
  critical: number = 0;

  newFinding: any = {
    title: '',
    description: '',
    project_id: this.projectId,
    category_id: null,
    severity_id: null,
  };
  editFinding: any = {
    title: '',
    description: '',
    project_id: this.projectId,
    category_id: null,
    severity_id: null,
  };
  editFindingMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportsService: ReportsService,
    public projectViewService: ProjectViewService,
    private messageService: MessageService,
    private pdfGeneratorService: PdfGeneratorService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.projectId = this.route.snapshot.params['id'];

    try {
      await this.getProjectById(this.projectId);
      await this.getCategories();
      await this.getSeverities();
      this.calculateSeverityCount();
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.isLoading = false;
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      // delay to ensure all Angular rendering is complete
      setTimeout(async () => {
        try {
          await this.initializeAllEditors();
        } catch (error) {
          console.error(
            'Failed to initialize editors in ngAfterViewInit:',
            error
          );
          this.isLoading = false;
        }
      }, 4000);
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.cleanupAllEditors();
  }

  async getProjectById(id: number): Promise<void> {
    try {
      const response = await fetch(this.reportsService.myUrl + 'project/' + id);
      const data = await response.json();

      this.project = data;
      this.date = new Date(this.project.created_at);
      this.description = this.project.description;
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }

  async getCategories(): Promise<void> {
    try {
      this.categories = await this.reportsService.getCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async getSeverities(): Promise<void> {
    try {
      this.severities = await this.reportsService.getSeverities();
    } catch (error) {
      console.error('Error fetching severities:', error);
    }
  }

  private async initializeAllEditors(): Promise<void> {
    try {
      console.log('Starting editor initialization...');
      this.editorsInitializing = true;

      // Wait for Angular to complete rendering
      await this.waitForDOMReady();

      // Initialize project description editor
      await this.initializeProjectDescriptionEditor();

      // Initialize finding editors
      await this.initializeFindingEditors();

      this.isLoading = false;
      this.editorsInitializing = false;
      console.log('All editors initialized successfully');
    } catch (error) {
      console.error('Error initializing editors:', error);
      this.isLoading = false;
      this.editorsInitializing = false;
    }
  }

  /**
   * Wait for DOM elements to be ready
   */
  private async waitForDOMReady(): Promise<void> {
    return new Promise((resolve) => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          resolve();
        }, 200); // Increased delay
      });
    });
  }

  /**
   * Initialize project description editor specifically
   */
  private async initializeProjectDescriptionEditor(): Promise<void> {
    const editorId = 'project-description';
    const element = await this.waitForElement(editorId);

    if (element && !this.editors[editorId]) {
      try {
        console.log(
          'Initializing project description editor with data:',
          this.description
        );
        await this.initializeEditor(editorId, this.description);
        console.log('Project description editor initialized');
      } catch (error) {
        console.error(
          'Failed to initialize project description editor:',
          error
        );
      }
    }
  }

  /**
   * Initialize all finding editors
   */
  private async initializeFindingEditors(): Promise<void> {
    if (!this.project?.findings || !Array.isArray(this.project.findings)) {
      console.log('No findings to initialize editors for');
      return;
    }

    console.log(
      `Initializing ${this.project.findings.length} finding editors...`
    );

    for (let i = 0; i < this.project.findings.length; i++) {
      const finding = this.project.findings[i];
      const editorId = `finding-description-${i}`;

      try {
        const element = await this.waitForElement(editorId, 3000); // 3 second timeout

        if (element && !this.editors[editorId]) {
          console.log(
            `Initializing finding editor ${i} with data:`,
            finding.description
          );
          await this.initializeEditor(editorId, finding.description);
          console.log(`Finding editor ${i} initialized for: ${finding.title}`);
        } else if (!element) {
          console.warn(`Element not found for finding editor: ${editorId}`);
        }
      } catch (error) {
        console.error(`Failed to initialize finding editor ${i}:`, error);
      }
    }
  }

  /**
   * Wait for a specific DOM element to be available
   */
  private async waitForElement(
    elementId: string,
    timeout: number = 5000
  ): Promise<HTMLElement | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.getElementById(elementId);
      if (element) {
        console.log(`Element ${elementId} found`);
        return element;
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 100)); // Increased check interval
    }

    console.warn(`Element ${elementId} not found within ${timeout}ms`);
    return null;
  }

  /**
   * Initialize a single editor
   */
  async initializeEditor(
    editorId: string,
    initialData: any = null
  ): Promise<void> {
    if (!this.isBrowser) {
      console.log('Not in browser, skipping editor initialization');
      return;
    }

    try {
      // Cleanup existing editor if it exists
      if (this.editors[editorId]) {
        console.log(`Cleaning up existing editor: ${editorId}`);
        await this.cleanupEditor(editorId);
      }

      const element = document.getElementById(editorId);
      if (!element) {
        throw new Error(`Element with id ${editorId} not found`);
      }

      // Clear any existing content
      element.innerHTML = '';

      console.log(`Starting initialization for ${editorId}...`);
      console.log(`Initial data for ${editorId}:`, initialData);

      // Dynamic imports for EditorJS
      const [
        EditorJS,
        InlineCode,
        List,
        Header,
        Quote,
        Delimiter,
        CodeTool,
        Underline,
        TableModule,
        ImageTool,
      ] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/inline-code'),
        import('@editorjs/list'),
        import('@editorjs/header'),
        import('@editorjs/quote'),
        import('@editorjs/delimiter'),
        import('@editorjs/code'),
        import('@editorjs/underline'),
        import('@editorjs/table'),
        import('@editorjs/image'),
      ]);

      // Prepare initial data with better parsing
      let editorData: any = undefined;

      if (initialData) {
        try {
          if (typeof initialData === 'string' && initialData.trim()) {
            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(initialData);
              if (parsed && typeof parsed === 'object') {
                if (parsed.blocks && Array.isArray(parsed.blocks)) {
                  editorData = parsed;
                  console.log(`Parsed JSON data for ${editorId}:`, editorData);
                } else {
                  // If it's not EditorJS format, create a paragraph block
                  editorData = {
                    blocks: [
                      {
                        type: 'paragraph',
                        data: { text: initialData },
                      },
                    ],
                  };
                  console.log(
                    `Created paragraph block for ${editorId}:`,
                    editorData
                  );
                }
              }
            } catch (jsonError) {
              // If JSON parsing fails, treat as plain text
              editorData = {
                blocks: [
                  {
                    type: 'paragraph',
                    data: { text: initialData },
                  },
                ],
              };
              console.log(`Treated as plain text for ${editorId}:`, editorData);
            }
          } else if (typeof initialData === 'object' && initialData !== null) {
            if (initialData.blocks && Array.isArray(initialData.blocks)) {
              editorData = initialData;
              console.log(`Used object data for ${editorId}:`, editorData);
            } else {
              // Convert object to string and create paragraph
              editorData = {
                blocks: [
                  {
                    type: 'paragraph',
                    data: { text: JSON.stringify(initialData) },
                  },
                ],
              };
              console.log(
                `Converted object to paragraph for ${editorId}:`,
                editorData
              );
            }
          }
        } catch (error) {
          console.warn(
            `Failed to process initial data for ${editorId}:`,
            error
          );
          // Create empty blocks as fallback
          editorData = {
            blocks: [
              {
                type: 'paragraph',
                data: { text: '' },
              },
            ],
          };
        }
      } else {
        console.log(`No initial data for ${editorId}, creating empty blocks`);
        // Create empty paragraph block
        editorData = {
          blocks: [
            {
              type: 'paragraph',
              data: { text: '' },
            },
          ],
        };
      }

      // Editor configuration
      const editorConfig: any = {
        holder: editorId,
        placeholder: editorId.includes('project-description')
          ? 'Enter project description...'
          : 'Enter finding description...',
        autofocus: false,
        minHeight: 200,

        inlineToolbar: ['inlineCode', 'underline'],

        tools: {
          header: {
            class: Header.default,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },

          list: {
            class: List.default,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
            },
          },

          quote: {
            class: Quote.default,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: "Quote's author",
            },
          },

          code: {
            class: CodeTool.default,
            config: {
              placeholder: 'Enter code here...',
            },
          },

          delimiter: {
            class: Delimiter.default,
          },

          inlineCode: {
            class: InlineCode.default,
            shortcut: 'CMD+SHIFT+M',
          },

          underline: {
            class: Underline.default,
            shortcut: 'CMD+U',
          },

          table: {
            class: TableModule.default,
            config: {
              rows: 2,
              cols: 2,
            },
          },

          image: {
            class: ImageTool.default,
            config: {
              endpoints: {
                byFile: 'http://127.0.0.1:6060/api/uploadFile',
              },
            },
          },
        },

        onReady: () => {
          console.log(`EditorJS ready for ${editorId}`);
        },

        onChange: (api: any, event: any) => {
          console.log(`Content changed for ${editorId}`);
        },

        logLevel: 'ERROR' as any,
      };

      // Add initial data if available
      if (editorData && editorData.blocks && editorData.blocks.length > 0) {
        editorConfig.data = editorData;
        console.log(`Setting initial data for ${editorId}:`, editorConfig.data);
      }

      console.log(`Creating EditorJS instance for ${editorId}...`);

      // Create editor instance
      const editorInstance = new EditorJS.default(editorConfig);

      // Wait for editor to be ready with timeout
      const readyTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Editor ready timeout')), 15000); // Increased timeout
      });

      await Promise.race([editorInstance.isReady, readyTimeout]);

      // Store the editor instance
      this.editors[editorId] = editorInstance;

      // Set main editor reference for project description
      if (editorId === 'project-description') {
        this.editor = editorInstance;
        this.editorInitialized = true;
      }

      console.log(`Editor ${editorId} initialized successfully with content`);
    } catch (error) {
      console.error(`Failed to initialize EditorJS for ${editorId}:`, error);

      // Fallback: Create a simple textarea if EditorJS fails
      this.createFallbackEditor(editorId, initialData);

      throw error;
    }
  }

  /**
   * Create a fallback textarea if EditorJS initialization fails
   */
  private createFallbackEditor(editorId: string, initialData: any): void {
    const element = document.getElementById(editorId);
    if (!element) return;

    // Extract text content from EditorJS data for fallback
    let textContent = '';
    if (initialData) {
      try {
        if (typeof initialData === 'string') {
          try {
            const data = JSON.parse(initialData);
            if (data && data.blocks) {
              textContent = data.blocks
                .map((block: any) => {
                  return block.data?.text || block.data?.code || '';
                })
                .join('\n');
            } else {
              textContent = initialData;
            }
          } catch {
            textContent = initialData;
          }
        } else if (typeof initialData === 'object' && initialData.blocks) {
          textContent = initialData.blocks
            .map((block: any) => {
              return block.data?.text || block.data?.code || '';
            })
            .join('\n');
        }
      } catch (error) {
        console.warn('Could not extract text for fallback editor');
        textContent = '';
      }
    }

    element.innerHTML = `
      <textarea 
        class="fallback-editor" 
        style="width: 100%; min-height: 200px; padding: 15px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;"
        placeholder="${
          editorId.includes('project-description')
            ? 'Enter project description...'
            : 'Enter finding description...'
        }"
      >${textContent}</textarea>
    `;

    console.log(
      `Fallback editor created for ${editorId} with content:`,
      textContent
    );
  }

  /**
   * Cleanup a specific editor
   */
  private async cleanupEditor(editorId: string): Promise<void> {
    const editor = this.editors[editorId];
    if (!editor) return;

    try {
      if (editor.destroy && typeof editor.destroy === 'function') {
        await editor.destroy();
      }
    } catch (error) {
      console.error(`Error destroying editor ${editorId}:`, error);
    } finally {
      delete this.editors[editorId];
    }
  }

  /**
   * Clean up all editor instances
   */
  private async cleanupAllEditors(): Promise<void> {
    const cleanupPromises = Object.keys(this.editors).map((editorId) =>
      this.cleanupEditor(editorId)
    );

    await Promise.all(cleanupPromises);
    this.editors = {};
    this.editorInitialized = false;
  }

  async showAddFindingForm(): Promise<void> {
    if (this.showNewFindingForm) {
      return;
    }

    this.showNewFindingForm = true;

    this.newFinding = {
      title: '',
      description: '',
      project_id: this.projectId,
      category_id: null,
      severity_id: null,
    };

    setTimeout(async () => {
      if (this.isBrowser) {
        const editorId = 'finding-description-new';
        try {
          await this.initializeEditor(editorId, null);
        } catch (error) {
          console.error('Failed to initialize new finding editor:', error);
        }
      }
    }, 500);
  }

  async cancelNewFinding(): Promise<void> {
    const editorId = 'finding-description-new';

    // Cleanup the editor first
    await this.cleanupEditor(editorId);

    //hide the form
    this.showNewFindingForm = false;

    // Reset the form data
    this.newFinding = {
      title: '',
      description: '',
      project_id: this.projectId,
      category_id: null,
      severity_id: null,
    };
  }

  async addNewFinding(): Promise<void> {
    try {
      await this.saveFindingDescription();

      const hasDescription =
        this.newFinding.description &&
        this.newFinding.description.blocks &&
        this.newFinding.description.blocks.length > 0;

      if (
        !this.newFinding.title ||
        !hasDescription ||
        !this.newFinding.category_id ||
        !this.newFinding.severity_id
      ) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'All fields are required',
        });
        return;
      }

      const finding = {
        title: this.newFinding.title,
        description: this.newFinding.description,
        project_id: this.projectId,
        category_id: this.newFinding.category_id,
        severity_id: this.newFinding.severity_id,
      };
      this.isLoading = true;
      const response = await this.reportsService.postFinding(finding);

      // Cleanup and reset form
      await this.cancelNewFinding();

      // Refresh project data
      await this.getProjectById(this.projectId);
      this.calculateSeverityCount();

      // Reinitialize all editors after adding new finding

      setTimeout(async () => {
        try {
          await this.cleanupAllEditors();
          await this.initializeAllEditors();
        } catch (error) {
          console.error('Error reinitializing editors:', error);
          this.isLoading = false;
        }
      }, 1000);
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Finding created successfully',
        });
      }, 2000);
    } catch (error) {
      console.error('Error creating finding:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error creating finding',
      });
    }
  }

  async saveFindingDescription(): Promise<void> {
    const editorId = 'finding-description-new';
    const editor = this.editors[editorId];

    if (!editor) {
      console.warn(`Editor instance not found for: ${editorId}`);
      this.newFinding.description = null;
      return;
    }

    try {
      // Ensure editor is ready
      if (editor.isReady) {
        await editor.isReady;
      }

      const outputData = await editor.save();
      this.newFinding.description = outputData;
      console.log('Finding description saved:', outputData);
    } catch (error) {
      console.error('Save failed:', error);

      // Try to get content from fallback editor if EditorJS failed
      const element = document.getElementById(editorId);
      if (element) {
        const textarea = element.querySelector(
          'textarea.fallback-editor'
        ) as HTMLTextAreaElement;
        if (textarea && textarea.value.trim()) {
          this.newFinding.description = {
            blocks: [
              {
                type: 'paragraph',
                data: { text: textarea.value },
              },
            ],
          };
          return;
        }
      }

      this.newFinding.description = null;
    }
  }

  async editProjectDetails(): Promise<void> {
    const updatedDescription = await this.getUpdatedDescription(
      'project-description'
    );
    this.project.description = updatedDescription;
    this.editProjectMessage = await this.reportsService.editProjectDetails(
      {
        name: this.project.name,
        description: this.project.description,
      },
      this.project.id
    );
    this.showSuccess();
  }
  async updateFinding(
    findingDescriptionId: string,
    finding: any
  ): Promise<void> {
    const updatedDescription = await this.getUpdatedDescription(
      findingDescriptionId
    );
    const findingDescription = updatedDescription;
    const updatedSeverity = finding.severity_id
      ? finding.severity_id
      : finding.severity.id;
    const updatedCategory = finding.category_id
      ? finding.category_id
      : finding.category.id;
    console.log(finding.severity.id);
    this.editProjectMessage = await this.reportsService.editFinding(
      {
        title: finding.title,
        project_id: finding.project_id,
        category_id: updatedCategory,
        severity_id: updatedSeverity,
        description: findingDescription,
      },
      finding.id
    );

    this.showSuccess();

    // Refresh project data
    await this.getProjectById(this.projectId);
    this.calculateSeverityCount();
  }

  async handleDeleteProject(): Promise<void> {
    this.showDeleteConfirmation = false;
    this.isLoading = true;

    try {
      this.editProjectMessage = await this.reportsService.deleteProject(
        this.project.id
      );
      this.isLoading = false;
      this.showSuccess();
      setTimeout(() => {
        this.router.navigate(['/reports']);
      }, 2000);
    } catch (error) {
      console.error('Error deleting project:', error);
      this.editProjectMessage = 'Error deleting project';
      this.isLoading = false;
      this.showError();
    }
  }

  /**
   * Get updated description from editor
   */
  async getUpdatedDescription(editorId: string): Promise<string> {
    try {
      if (!this.editors[editorId]) {
        console.warn(`Editor not found for ${editorId}`);
        return '';
      }

      const editor = this.editors[editorId];

      // Ensure editor is ready before saving
      if (editor.isReady) {
        await editor.isReady;
      }

      const outputData = await editor.save();
      return JSON.stringify(outputData);
    } catch (error) {
      console.error(
        `Failed to get updated description for ${editorId}:`,
        error
      );

      // Try to get content from fallback editor
      const element = document.getElementById(editorId);
      if (element) {
        const textarea = element.querySelector(
          'textarea.fallback-editor'
        ) as HTMLTextAreaElement;
        if (textarea) {
          return JSON.stringify({
            blocks: [
              {
                type: 'paragraph',
                data: { text: textarea.value },
              },
            ],
          });
        }
      }

      return '';
    }
  }

  /**
   * Calculate severity counts from findings
   */
  calculateSeverityCount(): void {
    if (!this.project?.findings) {
      this.critical = this.high = this.medium = this.low = 0;
      return;
    }

    this.critical = this.project.findings.filter(
      (finding: any) => finding.severity?.name === 'Critical'
    ).length;
    this.high = this.project.findings.filter(
      (finding: any) => finding.severity?.name === 'High'
    ).length;
    this.medium = this.project.findings.filter(
      (finding: any) => finding.severity?.name === 'Medium'
    ).length;
    this.low = this.project.findings.filter(
      (finding: any) => finding.severity?.name === 'Low'
    ).length;
  }

  /**
   * Track by function for ngFor to help Angular track finding changes
   */
  trackByFindingId(index: number, finding: any): any {
    return finding?.id || index;
  }

  /**
   * Get selected severity for a finding
   */
  getSelectedSeverity(finding: any): number | null {
    return finding?.severity_id || finding?.severity?.id || null;
  }

  /**
   * Get selected category for a finding
   */
  getSelectedCategory(finding: any): number | null {
    return finding?.category_id || finding?.category?.id || null;
  }

  goBack(): void {
    if (this.expandReport) {
      this.expandReport = this.projectViewService.toggleView();
    }
    this.router.navigate(['/reports']);
  }

  toggle(): void {
    this.expandReport = this.projectViewService.toggleView();
  }

  showConfirmation(): void {
    this.showDeleteConfirmation = true;
  }

  hideDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
  }

  async generatePDF(): Promise<void> {
    if (!this.isBrowser || !this.project) return;

    this.isLoading = true;
    try {
      await this.pdfGeneratorService.generateProjectReportPDF(this.project);
    } catch (error) {
      console.error('PDF generation failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'PDF generation failed',
      });
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'PDF generated successfully',
        });
      }, 1000);
    }
  }

  showSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: this.editProjectMessage,
      life: 5000,
    });
  }

  showError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: this.editProjectMessage,
      life: 5000,
    });
  }
  async deleteFinding(findingId: number): Promise<void> {
    try {
      await this.reportsService.deleteFinding(findingId);
      this.project.findings = this.project.findings.filter(
        (finding: any) => finding.id !== findingId
      );
      this.calculateSeverityCount();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Finding deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete finding:', error);
    }
  }
}
