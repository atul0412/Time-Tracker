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

  // Create flattened timesheet data
  const flattenedData = timesheets.map((entry, index) => {
    console.log(`Processing entry ${index}:`, entry.data);
    const row = {};

    dynamicFieldNames.forEach((fieldName) => {
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

      // Format dates
      if (value && !isNaN(new Date(value).getTime()) && fieldName.toLowerCase().includes('date')) {
        value = formatDateToReadable(value);
      }

      row[fieldName] = value;
    });

    console.log(`Row ${index}:`, row);
    return row;
  });

  console.log('Flattened data:', flattenedData);

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');

  // Generate and save the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, filename);
  
  console.log('Excel file generated successfully');
};
