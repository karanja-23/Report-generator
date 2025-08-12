import {
  Component,
  OnInit,
  PLATFORM_ID,
  Inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { ReportsService } from '../../Services/reports.service';
import { Projects } from '../../Interfaces/projects';
import { TableModule } from 'primeng/table';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectViewService } from '../../Services/project-view.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoadingComponent } from '../loading/loading.component';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-reports',
  imports: [
    TableModule,
    CommonModule,
    FormsModule,
    RouterModule,
    DialogModule,
    ButtonModule,
    DatePickerModule,
    ToastModule,
    LoadingComponent,
    PaginatorModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  providers: [MessageService],
})
export class ReportsComponent implements OnInit, OnDestroy {
  projects: Projects[] = [];
  filteredProjects: Projects[] = [];
  searchTerm: string = '';
  selectedProjectId: number | null = null;
  isLoading: boolean = true;
  showAddModal: boolean = false;
  modalClass: string = 'modal';
  private isBrowser: boolean;
  editor!: any;
  private editorInitialized: boolean = false;
  currentView: 'list' | 'grid' = 'list';

  gridFirst = 0;
  gridRows = 4;
  gridTotalRecords = 0;
  paginatedProjects: any[] = [];

  listFirst = 0;
  listRows = 5;

  reportName: string = '';
  reportDescription: string = '';
  reportCreatedAt: Date = new Date();
  createProjectMessage: string = '';

  constructor(
    private router: Router,
    public reportsService: ReportsService,
    public projectViewService: ProjectViewService,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    this.isLoading = true;
    this.projects = await this.reportsService.getProjects();
    this.filteredProjects = this.projects;
    this.projectViewService.setView(false);
    this.isLoading = false;
    this.updateGridPaginatedData();
  }
  updateGridPaginatedData() {
    this.gridTotalRecords = this.filteredProjects.length;
    this.paginatedProjects = this.filteredProjects.slice(
      this.gridFirst,
      this.gridFirst + this.gridRows
    );
  }
  ngOnDestroy(): void {
    this.projectViewService.setRenderingAuthpage(false);
  }
  setView(view: 'list' | 'grid') {
    this.currentView = view;
  }
  onGridPageChange(event: any) {
    this.gridFirst = event.first;
    this.gridRows = event.rows;
    this.updateGridPaginatedData();
  }
  searchProjects(searchValue: string) {
    if (!searchValue || searchValue.trim() === '') {
      this.filteredProjects = this.projects;
    } else {
      this.filteredProjects = this.projects.filter(
        (project) =>
          (project.name.toLowerCase() ?? '').includes(
            searchValue.toLowerCase()
          ) ||
          (project.created_at.toLowerCase() ?? '').includes(
            searchValue.toLowerCase()
          )
      );
    }

    this.gridFirst = 0;
    this.listFirst = 0;

    // Update grid paginated data
    this.updateGridPaginatedData();
  }
  onClickReport(reportId: number) {
    this.router.navigate(['reports', reportId]);
  }
  selectProject(projectId: number) {
    if (this.selectedProjectId === projectId) {
      this.selectedProjectId = null;
    } else {
      this.selectedProjectId = projectId;
    }
  }

  onListPageChange(event: any) {
    this.listFirst = event.first;
    this.listRows = event.rows;
  }
  toggleAddModal() {
    this.showAddModal = !this.showAddModal;
    if (this.showAddModal && this.isBrowser && !this.editorInitialized) {
      setTimeout(() => {
        this.initializeEditor();
      }, 300);
    }
  }
  onMaximizeChange(event: { maximized: boolean }) {
    if (event.maximized) {
      this.handleMaximize();
    } else {
      this.handleMinimize();
    }
  }
  handleMaximize() {
    this.projectViewService.setView(true);
  }
  handleMinimize() {
    this.projectViewService.setView(false);
  }

  async handleCreateNewProject() {
    
    const editorData = await this.editor.save();

    const newProject = {
      name: this.reportName,
      description: editorData,
      created_at: this.reportCreatedAt,
    };
    this.showAddModal = false;
    this.isLoading = true;

    this.createProjectMessage = await this.reportsService.createProject(
      newProject
    );
    this.isLoading = false;
    this.showSuccess();
    this.projects = await this.reportsService.getProjects();
    this.filteredProjects = this.projects;
    this.reportName = '';
    this.reportDescription = '';
    this.reportCreatedAt = new Date();
  }
  showSuccess() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: this.createProjectMessage,
      life: 5000,
    });
  }
  async initializeEditor() {
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
      ]);

      this.editor = new EditorJS.default({
        holder: 'editorjs',

        placeholder: 'Enter project description...',

        autofocus: true,

        inlineToolbar: ['inlineCode', 'underline'],

        tools: {
          header: {
            class: Header.default as any,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },

          list: {
            class: List.default as any,
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
            class: TableModule.default as any,
            config: {
              rows: 2,
              cols: 2,
            },
          },
        },

        onReady: () => {
          console.log('EditorJS is ready');
        },
        onChange: (api, event) => {
          console.log('EditorJS content changed');
        },
        logLevel: 'ERROR' as any,
      });

      this.editorInitialized = true;
    } catch (error) {
      console.error('Failed to initialize EditorJS:', error);
    }
  }
}
