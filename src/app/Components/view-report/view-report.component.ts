import { Component, OnInit, PLATFORM_ID, Inject,AfterViewInit } from '@angular/core';
import { RouterModule,ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../Services/reports.service';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProjectViewService } from '../../Services/project-view.service';
import { LoadingComponent } from '../loading/loading.component';
@Component({
  selector: 'app-view-report',
  imports: [DatePickerModule,FormsModule, CommonModule,LoadingComponent],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.css'
})
export class ViewReportComponent implements OnInit, AfterViewInit {
  editors: { [key: string]: any } = {};
  isBrowser: boolean;
  isLoading: boolean = false;
  editor: any
  editorInitialized: boolean = false  ;
  description: any;


  constructor(
    private route: ActivatedRoute,
    private reportsService: ReportsService,
    public projectViewService: ProjectViewService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
   }
  projectId: number = 0
  project: any;
  date: any;
  expandReport: boolean = false
  categories: any = [];
  high: number = 0;
  medium: number = 0;
  low: number = 0;
  critical: number = 0;
  async ngOnInit() {
    this.isLoading = true;
    this.projectId = this.route.snapshot.params['id'];
    await this.getProjectById(this.projectId);
    this.getCategories ();
   }
   async ngAfterViewInit() {
   
    if (this.isBrowser) {
      
      setTimeout(async () => {
        await this.initializeEditor('project-description',this.description);

        if (this.project?.findings && this.project.findings.length > 0) {
          for (let i = 0; i < this.project.findings.length; i++) {
            const finding = this.project.findings[i];
            const editorId = `finding-description-${i}`;
            await this.initializeEditor(editorId, finding.description);
          }
        } else {
          // Initialize empty finding editor
          await this.initializeEditor('finding-description-empty', null);
        }
        
        this.isLoading = false;
      }, 1000);
      
    }
  
   }
   async getProjectById(id: number){
    const response = await fetch(this.reportsService.myUrl + 'project/' + id);
    const data = await response.json();
    this.project = data;      
    this.date = new Date(this.project.created_at); 
    this.description = this.project.description;
    console.log(this.description);
  }
  async getCategories(){
    this.categories = await this.reportsService.getCategories();
  }
  goBack(){
    
    if(this.expandReport){
      this.expandReport = this.projectViewService.toggleView();
    }
    window.history.back();
  }
  toggle(){
    this.expandReport = this.projectViewService.toggleView();
  }
  
  async initializeEditor(holderId: string, data: any) {
    try {
      const [
        EditorJS,
        InlineCode,
        List,
        Header,
        Quote,
        Delimiter,
        CodeTool,
        Underline
      ] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/inline-code'),
        import('@editorjs/list'),
        import('@editorjs/header'),
        import('@editorjs/quote'),
        import('@editorjs/delimiter'),
        import('@editorjs/code'),
        import('@editorjs/underline')
      ]);

      // Check if element exists before initializing
      const element = document.getElementById(holderId);
      if (!element) {
        console.warn(`Element with id ${holderId} not found`);
        return;
      }

      this.editors[holderId] = new EditorJS.default({
        holder: holderId,
        placeholder: holderId.includes('project') ? 'Enter project description...' : 'Enter finding description...',
        autofocus: false, // Set to false to avoid conflicts with multiple editors
        data: data || {},
        inlineToolbar: ['inlineCode', 'underline'],
        
        tools: {
          header: {
            class: Header.default as any,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          list: {
            class: List.default as any,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          quote: {
            class: Quote.default,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author'
            }
          },
          code: {
            class: CodeTool.default,
            config: {
              placeholder: 'Enter code here...'
            }
          },
          delimiter: {
            class: Delimiter.default
          },
          inlineCode: {
            class: InlineCode.default,
            shortcut: 'CMD+SHIFT+M'
          },
          underline: {
            class: Underline.default,
            shortcut: 'CMD+U'
          }
        },
        
        onReady: () => {
          console.log(`EditorJS ${holderId} is ready`);
        },
        onChange: (api, event) => {
          console.log(`EditorJS ${holderId} content changed`);
        },
        logLevel: 'ERROR' as any
      });

    } catch (error) {
      console.error(`Failed to initialize EditorJS for ${holderId}:`, error);
    }
  }

  editProject(){
    
  }
}
