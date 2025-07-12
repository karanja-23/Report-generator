import { Component, OnInit, PLATFORM_ID, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../Services/reports.service';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProjectViewService } from '../../Services/project-view.service';
import { LoadingComponent } from '../loading/loading.component';
import { PdfGeneratorService } from '../../Services/pdf-generator.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
@Component({
  selector: 'app-view-report',
  imports: [DatePickerModule, FormsModule, CommonModule, LoadingComponent, ToastModule,ButtonModule],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.css',
  providers: [MessageService]
})
export class ViewReportComponent implements OnInit, AfterViewInit, OnDestroy {
  editors: { [key: string]: any } = {};
  isBrowser: boolean;
  isLoading: boolean = false;
  editor: any;
  editorInitialized: boolean = false;
  description: any;
  showNewFindingForm: boolean = false;
  showDeleteConfirmation: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private reportsService: ReportsService,
    public projectViewService: ProjectViewService,
    private messageService: MessageService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any,
    private pdfGeneratorService: PdfGeneratorService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  projectId: number = 0;
  project: any;
  date: any;
  expandReport: boolean = false;
  categories: any = [];
  high: number = 0;
  medium: number = 0;
  low: number = 0;
  critical: number = 0;
  severities: any = [];
  editProjectMessage: string = '';
  newFinding: any = {
    title: '',
    description: '',
    project_id: this.projectId,
    category_id: null,
    severity_id: null
  };

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.projectId = this.route.snapshot.params['id'];
    await this.getProjectById(this.projectId);
    this.getCategories();
    this.getSeverities();
    this.calculateSeverityCount();
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      setTimeout(async () => {
        
        await this.initializeEditor('project-description', this.description);
  
        if (this.project?.findings && this.project.findings.length > 0) {
          for (let i = 0; i < this.project.findings.length; i++) {
            const finding = this.project.findings[i];
            const editorId = `finding-description-${i}`;
            
            const element = document.getElementById(editorId);
            if (element) {
              await this.initializeEditor(editorId, finding.description);
            } else {
              console.warn(`Element ${editorId} not found`);
            }
          }
        }
        
        this.isLoading = false;
      }, 3000);
    }
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
      severity_id: null
    };
  
    setTimeout(async () => {
      if (this.isBrowser) {
        const editorId = 'finding-description-new';
        if (this.editors[editorId]) {
          await this.editors[editorId].clear();
        } else {
          await this.initializeEditor(editorId, null);
        }
      }
    }, 200);
  }

  cancelNewFinding(): void {
    this.showNewFindingForm = false;
  
    const editorId = 'finding-description-new';
  
    if (this.editors[editorId]) {
      try {
        const destroyResult = this.editors[editorId].destroy();
        if (destroyResult && typeof destroyResult.then === 'function') {
          destroyResult.then(() => {
            delete this.editors[editorId];
          }).catch((error: any) => {
            console.error('Error destroying editor:', error);
            delete this.editors[editorId];
          });
        } else {
          delete this.editors[editorId];
        }
      } catch (error) {
        console.error('Error destroying editor:', error);
        delete this.editors[editorId];
      }
    }
  
    this.newFinding = {
      title: '',
      description: '',
      project_id: this.projectId,
      category_id: null,
      severity_id: null
    };
  }

  async addNewFinding(): Promise<void> {
    await this.saveFindingDescription();
    
    const hasDescription = this.newFinding.description && 
                          this.newFinding.description.blocks && 
                          this.newFinding.description.blocks.length > 0;
                          
    console.log('Validation check:', {
      title: !!this.newFinding.title,
      description: hasDescription,
      descriptionData: this.newFinding.description,
      category: !!this.newFinding.category_id,
      severity: !!this.newFinding.severity_id
    });
                          
    if (!this.newFinding.title || !hasDescription || !this.newFinding.category_id || !this.newFinding.severity_id) {
      console.error('All fields are required');
      return;
    }
    
    const finding = {
      title: this.newFinding.title,
      description: this.newFinding.description,
      project_id: this.projectId,
      category_id: this.newFinding.category_id,
      severity_id: this.newFinding.severity_id
    };
    
    console.log('Submitting finding:', finding);
    
    try {
      const response = await this.reportsService.postFinding(finding);
      console.log('Finding created:', response);
      
      this.cancelNewFinding();
      await this.getProjectById(this.projectId);
    } catch (error) {
      console.error('Error creating finding:', error);
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
      if (editor.isReady) {
        await editor.isReady;
      }
  
      const outputData = await editor.save();
      this.newFinding.description = outputData;
      console.log('Finding description saved:', outputData);
    } catch (error) {
      console.error('Save failed:', error);
      this.newFinding.description = null;
    }
  }
  
  async getSeverities(): Promise<void> {
    try {
      this.severities = await this.reportsService.getSeverities();
    } catch (error) {
      console.error('Error fetching severities:', error);
    }
  }

  async getProjectById(id: number): Promise<void> {
    try {
      const response = await fetch(this.reportsService.myUrl + 'project/' + id);
      const data = await response.json();
      
      this.project = data;      
      this.date = new Date(this.project.created_at); 
      this.description = this.project.description;
      console.log(this.project.findings);
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

  goBack(): void {
    if(this.expandReport) {
      this.expandReport = this.projectViewService.toggleView();
    }
    window.history.back();
  }
  async getUpdatedDescription(editorId: string): Promise<string> {
    try {
      // Check if editor exists for this ID
      if (!this.editors[editorId]) {
        console.warn(`Editor not found for ${editorId}`);
        return '';
      }
  
      const editor = this.editors[editorId];
      
      // Get the editor data
      const outputData = await editor.save();
      
      // Convert EditorJS data to JSON string for storage
      return JSON.stringify(outputData);
      
    } catch (error) {
      console.error(`Failed to get updated description for ${editorId}:`, error);
      return '';
    }
  }
  toggle(): void {
    this.expandReport = this.projectViewService.toggleView();
  }
  
  async initializeEditor(editorId: string, initialData: any = null): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
  
    try {
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
  
      const element = document.getElementById(editorId);
      if (!element) {
        console.warn(`Element with id ${editorId} not found`);
        return;
      }
  
      // Check if editor already exists for this element
      if (this.editors[editorId]) {
        console.warn(`Editor already exists for ${editorId}`);
        return;
      }
  
      // Prepare initial data with proper structure
      let editorData: any = undefined;
      
      if (initialData) {
        try {
          // If initialData is a string, try to parse it
          if (typeof initialData === 'string') {
            const parsed = JSON.parse(initialData);
            // Validate that it has the required structure
            if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
              editorData = parsed;
            }
          } else if (typeof initialData === 'object' && initialData.blocks && Array.isArray(initialData.blocks)) {
            editorData = initialData;
          }
        } catch (error) {
          console.warn('Failed to parse initial data, using default empty data:', error);
        }
      }
  
      // Create editor configuration based on working pattern
      const editorConfig: any = {
        holder: editorId,
        placeholder: editorId.includes('project-description') 
          ? 'Enter project description...' 
          : 'Enter finding description...',
        autofocus: false,
        
        // Use simplified inline toolbar like the working example
        inlineToolbar: ['inlineCode', 'underline'],
        
        // Remove sanitizer to use default configuration (like working example)
        
        tools: {
          // Header tool
          header: {
            class: Header.default as any,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          
          // List tool with enhanced config
          list: {
            class: List.default as any,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          
          // Quote tool
          quote: {
            class: Quote.default,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author'
            }
          },
          
          // Code block
          code: {
            class: CodeTool.default,
            config: {
              placeholder: 'Enter code here...'
            }
          },
          
          // Delimiter
          delimiter: {
            class: Delimiter.default
          },
          
          // Inline tools
          inlineCode: {
            class: InlineCode.default,
            shortcut: 'CMD+SHIFT+M'
          },
                   
          underline: {
            class: Underline.default,
            shortcut: 'CMD+U'
          },
          
          // Table with simplified config
          table: {
            class: TableModule.default as any,
            config: {
              rows: 2,
              cols: 2,
            },
          },
  
          // Image tool
          image: {
            class: ImageTool.default,
            config: {
              endpoints: {
                byFile: 'http://127.0.0.1:6060/api/uploadFile',
               
              }
            },
          }
        },
        
        onReady: () => {
          console.log(`EditorJS is ready for ${editorId}`);
        },
        onChange: (api: any, event: any) => {
          console.log(`EditorJS content changed for ${editorId}`);
        },
        logLevel: 'ERROR' as any
      };
  
      // Only add data property if we have valid data
      if (editorData) {
        editorConfig.data = editorData;
      }
  
      const editorInstance = new EditorJS.default(editorConfig);
      
      // Store the editor instance
      this.editors[editorId] = editorInstance;
      
      // Set the main editor reference if this is the project description editor
      if (editorId === 'project-description') {
        this.editor = editorInstance;
        this.editorInitialized = true;
      }
      
    } catch (error) {
      console.error(`Failed to initialize EditorJS for ${editorId}:`, error);
    }
  }
  editProject(): void {
    // Implementation for editing project
  }

  calculateSeverityCount(): void {
    if (!this.project?.findings) {
      this.critical = this.high = this.medium = this.low = 0;
      return;
    }

    this.critical = this.project.findings.filter((finding: any) => finding.severity?.name === 'Critical').length;
    this.high = this.project.findings.filter((finding: any) => finding.severity?.name === 'High').length;
    this.medium = this.project.findings.filter((finding: any) => finding.severity?.name === 'Medium').length;
    this.low = this.project.findings.filter((finding: any) => finding.severity?.name === 'Low').length;
  }

  async generatePDF(): Promise<void> {
    if (!this.isBrowser || !this.project) return;
    
    this.isLoading = true;
    try {
      await this.pdfGeneratorService.generateProjectReportPDF(this.project);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up all editor instances
    Object.keys(this.editors).forEach(editorId => {
      const editor = this.editors[editorId];
      try {
        if (editor && editor.destroy) {
          editor.destroy();
        }
      } catch (error) {
        console.error(`Error destroying editor ${editorId}:`, error);
      }
    });
    this.editors = {};
  }
  async editProjectDetails(): Promise<void> {
    const updatedDescription = this.getUpdatedDescription('project-description');
    this.project.description = await updatedDescription;
    this.editProjectMessage = await this.reportsService.editProjectDetails({name: this.project.name, description: this.project.description}, this.project.id);
    this.showSuccess();
  }
  showSuccess() {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: this.editProjectMessage, life: 5000 });
  }
  showError() {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: this.editProjectMessage, life: 5000 });
  }
  showConfirmation() {
    this.showDeleteConfirmation = true;
  }
  hideDeleteConfirmation() {
    this.showDeleteConfirmation = false;
  }
  async handleDeleteProject() {
    this.showDeleteConfirmation = false;
    this.isLoading = true;
    try{
      this.editProjectMessage = await this.reportsService.deleteProject(this.project.id);
      this.isLoading = false;      
      this.showSuccess();
      setTimeout(() => {
        this.router.navigate(['/reports']);
      }, 2000);
     
    }
    catch(error){
      console.error('Error deleting project:', error);
      this.editProjectMessage = 'Error deleting project';
      this.showError();
    }
    
    
    
  }
    
}