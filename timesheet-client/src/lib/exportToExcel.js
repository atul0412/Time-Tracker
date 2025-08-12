import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDateToReadable } from './dateFormate';

export const exportTimesheetToExcel = (project, timesheets, filename = 'timesheet.xlsx') => {
  console.log('Export function called with:', { project, timesheets: timesheets.length, filename });

  if (!Array.isArray(timesheets) || timesheets.length === 0) {
    console.warn('No timesheet data to export');
    return;
  }

  if (!project) {
    console.warn('Invalid project');
    return;
  }

  // Debug: Log the first timesheet to see its structure
  console.log('First timesheet data:', timesheets[0]);

  // Try multiple ways to get field names
  let dynamicFieldNames = [];
  
  if (project.fields && Array.isArray(project.fields)) {
    // Use project schema fields if available
    dynamicFieldNames = project.fields.map((field) => field.fieldName);
    console.log('Using project fields:', dynamicFieldNames);
  } else if (timesheets.length > 0 && timesheets[0].data) {
    // Fallback: extract field names from the first timesheet entry
    dynamicFieldNames = Object.keys(timesheets[0].data);
    console.log('Using fields from timesheet data:', dynamicFieldNames);
  } else {
    // Last resort: use common field names
    dynamicFieldNames = ['date', 'Developer Name', 'Developer name', 'task', 'Effort Hours', 'workingHours', 'Frontend/Backend'];
    console.log('Using default field names:', dynamicFieldNames);
  }

  // ✅ Convert all field names to uppercase for display headers
  const capitalizedFieldNames = dynamicFieldNames.map(field => field.toUpperCase());
  console.log('Capitalized field names:', capitalizedFieldNames);

  // ✅ Identify the hours field name (using original case for data lookup)
  const hoursFieldNames = ['Effort Hours', 'workingHours', 'Working Hours', 'hours', 'Hours'];
  const hoursFieldName = dynamicFieldNames.find(field => 
    hoursFieldNames.some(hourField => 
      field.toLowerCase().includes(hourField.toLowerCase()) || 
      hourField.toLowerCase().includes(field.toLowerCase())
    )
  );

  console.log('Hours field identified as:', hoursFieldName);

  // ✅ Calculate total hours
  let totalHours = 0;

  // Create flattened timesheet data
  const flattenedData = timesheets.map((entry, index) => {
    console.log(`Processing entry ${index}:`, entry.data);
    const row = {};

    dynamicFieldNames.forEach((fieldName, fieldIndex) => {
      let value = entry?.data?.[fieldName] ?? '';

      // Handle different field name variations
      if (!value && fieldName === 'Developer Name') {
        value = entry?.data?.['Developer name'] ?? '';
      }
      if (!value && fieldName === 'Developer name') {
        value = entry?.data?.['Developer Name'] ?? '';
      }
      if (!value && fieldName === 'Effort Hours') {
        value = entry?.data?.['workingHours'] ?? '';
      }
      if (!value && fieldName === 'workingHours') {
        value = entry?.data?.['Effort Hours'] ?? '';
      }

      // ✅ Calculate total hours
      if (fieldName === hoursFieldName && value) {
        const hours = parseFloat(value) || 0;
        totalHours += hours;
      }

      // Format dates
      if (value && !isNaN(new Date(value).getTime()) && fieldName.toLowerCase().includes('date')) {
        value = formatDateToReadable(value);
      }

      // ✅ Use capitalized field name as key
      row[capitalizedFieldNames[fieldIndex]] = value;
    });

    console.log(`Row ${index}:`, row);
    return row;
  });

  console.log('Flattened data:', flattenedData);
  console.log('Total hours calculated:', totalHours);

  // ✅ Add empty row for spacing
  const emptyRow = {};
  capitalizedFieldNames.forEach(field => {
    emptyRow[field] = '';
  });
  flattenedData.push(emptyRow);

  // ✅ Add total row with capitalized headers
  const totalRow = {};
  capitalizedFieldNames.forEach((field, index) => {
    // Find corresponding original field name for hours field
    const originalField = dynamicFieldNames[index];
    if (originalField === hoursFieldName) {
      totalRow[field] = totalHours;
    } else if (index === 0) {
      // Put "TOTAL" in the first column
      totalRow[field] = 'TOTAL';
    } else {
      totalRow[field] = '';
    }
  });
  flattenedData.push(totalRow);

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);

  // ✅ Style the total row (make it bold and add borders)
  const totalRowIndex = flattenedData.length; // 1-based index for Excel
  const emptyRowIndex = flattenedData.length - 1; // 1-based index for Excel

  // Set column widths based on capitalized field names
  const columnWidths = capitalizedFieldNames.map(field => ({
    wch: Math.max(field.length + 5, 12) // Minimum width of 12, or field length + 5
  }));
  worksheet['!cols'] = columnWidths;

  // ✅ Add styling to the total row
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  
  // Style the total row
  capitalizedFieldNames.forEach((field, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex - 1, c: colIndex });
    if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '', t: 's' };
    
    // Add cell formatting (this requires xlsx-style or similar, but we'll use basic formatting)
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFCCCCCC" } }, // Light gray background
      border: {
        top: { style: "thick" },
        bottom: { style: "thick" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };
  });

  // ✅ Style the header row (first row) to be bold
  capitalizedFieldNames.forEach((field, colIndex) => {
    const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (!worksheet[headerCellAddress]) worksheet[headerCellAddress] = { v: field, t: 's' };
    
    worksheet[headerCellAddress].s = {
      font: { bold: true, color: { rgb: "FF000000" } }, // Bold black text
      fill: { fgColor: { rgb: "FFE6E6FA" } }, // Light lavender background
      alignment: { horizontal: "center" }, // Center align headers
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TIMESHEETS'); // ✅ Worksheet name also in caps

  // ✅ Add workbook properties
  workbook.Props = {
    Title: `${project.name?.toUpperCase()} - TIMESHEET REPORT`, // ✅ Title in caps
    Subject: "TIMESHEET EXPORT", // ✅ Subject in caps
    Author: "TIME-TRACKER", // ✅ Author in caps
    CreatedDate: new Date()
  };

  // Generate and save the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  // ✅ Generate filename with project name and total hours
  const projectName = project.name?.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'PROJECT'; // ✅ Project name in caps
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = filename === 'timesheet.xlsx' 
    ? `${projectName}_TIMESHEET_${timestamp}_${totalHours}H.xlsx` // ✅ Filename elements in caps
    : filename;
  
  saveAs(blob, finalFilename);
  
  console.log('Excel file generated successfully with total hours:', totalHours);
  console.log('All headers converted to capital case');
  
  // ✅ Return summary for potential use by calling function
  return {
    totalHours,
    totalEntries: timesheets.length,
    filename: finalFilename,
    headers: capitalizedFieldNames // ✅ Return capitalized headers
  };
};
