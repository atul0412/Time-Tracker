import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportTimesheetToExcel = (project, timesheets, filename = 'timesheet.xlsx') => {
  if (!Array.isArray(timesheets) || timesheets.length === 0) {
    console.warn('No timesheet data to export');
    return;
  }

  if (!project || !Array.isArray(project.fields)) {
    console.warn('Invalid project or missing fields');
    return;
  }

  console.log(timesheets, project.fields);

  // Extract ordered field names from the project schema
  const dynamicFieldNames = project.fields.map((field) => field.fieldName);

  // Create flattened timesheet data based on the schema
  const flattenedData = timesheets.map((entry) => {
    const row = {};
    dynamicFieldNames.forEach((fieldName) => {
      row[fieldName] = entry?.data[fieldName] ?? ''; // fallback to empty string if undefined
    });
    return row;
  });

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');

  // Generate and save the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, filename);
};
