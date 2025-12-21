import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  GridOptions
} from 'ag-grid-community';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'Order' | 'Wages' | 'Sales' | 'Expense' | 'Stocking';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent {

  @ViewChild('agGrid') agGrid!: AgGridAngular;
  isSearchClicked = false;
  private gridApi!: GridApi;

  reportTypes: ReportType[] = ['Order', 'Wages', 'Sales', 'Expense', 'Stocking'];
  selectedType: ReportType = 'Order';

  startDate: Date = new Date();
  endDate: Date = new Date();

  rowData: any[] = [];
  columnDefs: ColDef[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120
  };

  gridOptions: GridOptions = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 10,
    rowHeight: 42,
    headerHeight: 48
  };

  clientId: string = '';

  private baseUrl = 'https://richmill-git-main-richmill123s-projects.vercel.app/api';

  constructor(private http: HttpClient) {
    const user = sessionStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.clientId = parsed._id || parsed;
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  private setupGridColumns(sampleData: any): void {
    if (!sampleData) return;

    this.columnDefs = Object.keys(sampleData)
      .filter(key => !['_id', 'clientId', '__v'].includes(key))
      .map(key => ({
        headerName: this.formatHeader(key),
        field: key,
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          if (params.value instanceof Date) {
            return new Date(params.value).toLocaleDateString();
          }
          if (typeof params.value === 'object') {
            return JSON.stringify(params.value);
          }
          return params.value;
        }
      }));

    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.setGridOption('columnDefs', this.columnDefs);
        this.gridApi.setGridOption('rowData', this.rowData);
        this.gridApi.sizeColumnsToFit();
      }
    });
  }

  onSearch(): void {
    if (!this.clientId) return;
    this.isSearchClicked= true;
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

    const start = formatDate(this.startDate);
    const end = formatDate(this.endDate);

    let apiUrl = '';

    switch (this.selectedType) {
      case 'Order':
        apiUrl = `${this.baseUrl}/orders`;
        break;
      case 'Wages':
        apiUrl = `${this.baseUrl}/wages`;
        break;
      case 'Sales':
        apiUrl = `${this.baseUrl}/sales`;
        break;
      case 'Expense':
        apiUrl = `${this.baseUrl}/expenses`;
        break;
      case 'Stocking':
        apiUrl = `${this.baseUrl}/stock`;
        break;
    }

    apiUrl += `?clientId=${this.clientId}&startDate=${start}&endDate=${end}`;

    this.http.get<any[]>(apiUrl).subscribe({
      next: data => {
        this.rowData = data || [];
        if (data?.length) {
          this.setupGridColumns(data[0]);
        }
      },
      error: err => console.error('API Error:', err)
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.text(`${this.selectedType} Report`, 14, 15);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `Date Range: ${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`,
      14,
      23
    );

    const columns = this.columnDefs
      .filter(c => c.field && c.field !== 'actions')
      .map(c => ({
        header: c.headerName as string,
        dataKey: c.field as string
      }));

    const rows = this.rowData.map(row => {
      const r: any = {};
      columns.forEach(c => {
        r[c.dataKey] =
          typeof row[c.dataKey] === 'object'
            ? JSON.stringify(row[c.dataKey])
            : row[c.dataKey];
      });
      return r;
    });

    autoTable(doc, {
      columns,
      body: rows,
      startY: 30,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255]
      }
    });

    doc.save(`${this.selectedType}_Report.pdf`);
  }

  exportToCSV(): void {
    this.gridApi.exportDataAsCsv({
      fileName: `${this.selectedType}_Report_${new Date()
        .toISOString()
        .slice(0, 10)}`
    });
  }
  


  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }
}
