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

  // ✅ Identify task column for text wrapping
  const taskFieldNames = ['task', 'Task', 'description', 'Description', 'work', 'Work'];
  const taskFieldName = dynamicFieldNames.find(field => 
    taskFieldNames.some(taskField => 
      field.toLowerCase().includes(taskField.toLowerCase())
    )
  );
  console.log('Task field identified as:', taskFieldName);

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

  // ✅ Set column widths based on capitalized field names with special handling for task column
  const columnWidths = capitalizedFieldNames.map((field, index) => {
    const originalField = dynamicFieldNames[index];
    if (originalField === taskFieldName) {
      // Make task column wider to accommodate wrapped text
      return { wch: 45 }; // Width of 45 characters for task column
    }
    // Adjust column width based on field name length
    if (field.length > 15) {
      return { wch: field.length + 8 }; // Longer fields get more space
    }
    return { wch: Math.max(field.length + 5, 15) }; // Minimum width of 15, or field length + 5
  });
  worksheet['!cols'] = columnWidths;

  // ✅ Initialize rows array if it doesn't exist
  if (!worksheet['!rows']) worksheet['!rows'] = [];

  // ✅ Enhanced header styling for maximum prominence and boldness
  capitalizedFieldNames.forEach((field, colIndex) => {
    const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (!worksheet[headerCellAddress]) {
      worksheet[headerCellAddress] = { v: field, t: 's' };
    }
    
    const originalField = dynamicFieldNames[colIndex];
    const isTaskColumn = originalField === taskFieldName;
    
    worksheet[headerCellAddress].s = {
      font: { 
        bold: true,        // ✅ Bold text
        size: 14,          // ✅ Larger font size for prominence
        color: { rgb: "FFFFFF" },  // ✅ White text for strong contrast
        name: "Calibri"    // ✅ Professional font family
      },
      fill: { 
        fgColor: { rgb: "FF2E5B8A" } // ✅ Strong blue background for maximum contrast
      },
      alignment: { 
        horizontal: "center", 
        vertical: "center",
        wrapText: isTaskColumn // ✅ Enable text wrap for task column header
      },
      border: {
        top: { style: "thick", color: { rgb: "FF000000" } },    // ✅ Thick borders for definition
        bottom: { style: "thick", color: { rgb: "FF000000" } },
        left: { style: "medium", color: { rgb: "FF000000" } },
        right: { style: "medium", color: { rgb: "FF000000" } }
      }
    };
  });

  // ✅ Style all data cells with enhanced formatting
  flattenedData.forEach((row, rowIndex) => {
    if (rowIndex === 0) return; // Skip header row (already styled above)
    
    capitalizedFieldNames.forEach((field, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const originalField = dynamicFieldNames[colIndex];
      const isTaskColumn = originalField === taskFieldName;
      const isTotalRow = rowIndex === totalRowIndex - 1;
      const isEmptyRow = rowIndex === emptyRowIndex - 1;
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: row[field] || '', t: 's' };
      }

      // ✅ Base styling for all data cells
      let cellStyle = {
        font: {
          size: 11,
          name: "Calibri",
          color: { rgb: "FF000000" }
        },
        border: {
          top: { style: "thin", color: { rgb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
          left: { style: "thin", color: { rgb: "FFCCCCCC" } },
          right: { style: "thin", color: { rgb: "FFCCCCCC" } }
        },
        alignment: {
          vertical: "center",
          horizontal: "left"
        }
      };

      // ✅ Special styling for task column
      if (isTaskColumn) {
        cellStyle.alignment = {
          vertical: "top",
          horizontal: "left",
          wrapText: true // ✅ Enable text wrap for task column
        };
      }

      // ✅ Special styling for hours column (right-align numbers)
      if (originalField === hoursFieldName) {
        cellStyle.alignment.horizontal = "right";
        if (row[field] && !isNaN(parseFloat(row[field]))) {
          cellStyle.numFmt = "0.00"; // Format numbers with 2 decimal places
        }
      }

      // ✅ Enhanced styling for total row
      if (isTotalRow) {
        cellStyle = {
          font: { 
            bold: true, 
            size: 12,
            name: "Calibri",
            color: { rgb: "FF000000" }
          },
          fill: { 
            fgColor: { rgb: "FFE6E6E6" } // Light gray background
          },
          alignment: { 
            horizontal: colIndex === 0 ? "left" : "center",
            vertical: "center",
            wrapText: isTaskColumn
          },
          border: {
            top: { style: "thick", color: { rgb: "FF000000" } },
            bottom: { style: "thick", color: { rgb: "FF000000" } },
            left: { style: "medium", color: { rgb: "FF000000" } },
            right: { style: "medium", color: { rgb: "FF000000" } }
          }
        };

        // Right-align total hours
        if (originalField === hoursFieldName) {
          cellStyle.alignment.horizontal = "right";
          cellStyle.numFmt = "0.00";
        }
      }

      // ✅ Style for empty spacing row
      if (isEmptyRow) {
        cellStyle = {
          fill: { fgColor: { rgb: "FFFFFFFF" } }, // White background
          border: {} // No borders for spacing row
        };
      }

      worksheet[cellAddress].s = cellStyle;
    });
  });

  // ✅ Enhanced row heights for better readability
  worksheet['!rows'] = flattenedData.map((row, index) => {
    if (index === 0) {
      // Header row - larger height for prominence
      return { hpt: 30 }; // Height in points
    }
    
    // Check if this row has task data that might need wrapping
    const taskColumnIndex = dynamicFieldNames.findIndex(field => field === taskFieldName);
    if (taskColumnIndex >= 0) {
      const taskValue = row[capitalizedFieldNames[taskColumnIndex]];
      if (taskValue && typeof taskValue === 'string') {
        // Dynamic height based on text length
        if (taskValue.length > 100) {
          return { hpt: 50 }; // Very long text
        } else if (taskValue.length > 50) {
          return { hpt: 35 }; // Long text
        }
      }
    }
    
    // Special height for total row
    const isTotalRow = index === flattenedData.length - 1;
    if (isTotalRow) {
      return { hpt: 25 }; // Slightly taller for totals
    }
    
    return { hpt: 22 }; // Default row height (slightly increased)
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TIMESHEETS');

  // ✅ Enhanced workbook properties
  workbook.Props = {
    Title: `${project.name?.toUpperCase()} - TIMESHEET REPORT`,
    Subject: "TIMESHEET EXPORT",
    Author: "TIME-TRACKER",
    CreatedDate: new Date(),
    Company: "Time Tracking System",
    Category: "Timesheet Reports"
  };

  // ✅ Add custom workbook view settings
  workbook.Workbook = {
    Views: [{
      xWindow: 0,
      yWindow: 0,
      windowWidth: 25600,
      windowHeight: 19200,
      firstSheet: 0,
      activeTab: 0,
      visibility: 'visible'
    }]
  };

  // Generate and save the Excel file with enhanced options
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true,  // ✅ Enable cell styling
    bookSST: true,     // ✅ Enable shared string table for better performance
    compression: true   // ✅ Enable compression
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  // ✅ Generate enhanced filename with project name and total hours
  const projectName = project.name?.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'PROJECT';
  const timestamp = new Date().toISOString().split('T')[0];
  const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const finalFilename = filename === 'timesheet.xlsx' 
    ? `${projectName}_TIMESHEET_${timestamp}_${timeString}_${totalHours}H.xlsx`
    : filename;
  
  saveAs(blob, finalFilename);
  
  console.log('✅ Excel file generated successfully with enhanced formatting!');
  console.log('📊 Total hours calculated:', totalHours);
  console.log('📝 Headers are now BOLD with strong blue background and white text');
  console.log('📋 Task column has text wrapping enabled with dynamic row heights');
  console.log('💾 Filename:', finalFilename);
  
  // ✅ Return comprehensive summary
  return {
    success: true,
    totalHours,
    totalEntries: timesheets.length,
    filename: finalFilename,
    headers: capitalizedFieldNames,
    taskFieldName: taskFieldName,
    hoursFieldName: hoursFieldName,
    exportDate: new Date().toISOString(),
    projectName: project.name
  };
};
