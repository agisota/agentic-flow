import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getTable tool input
 */
export const GetTableInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target table element'),
  includeHeaders: z.boolean().default(true).optional().describe('Include header row(s) in output'),
  trim: z.boolean().default(true).optional().describe('Trim whitespace from cell text'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetTableInput = z.infer<typeof GetTableInputSchema>;

/**
 * Schema for table cell data
 */
export const TableCellSchema = z.object({
  text: z.string().describe('Cell text content'),
  colspan: z.number().optional().describe('Column span'),
  rowspan: z.number().optional().describe('Row span'),
  isHeader: z.boolean().optional().describe('Is header cell'),
});

export type TableCell = z.infer<typeof TableCellSchema>;

/**
 * Schema for getTable tool output
 */
export const GetTableOutputSchema = z.object({
  headers: z.array(z.string()).describe('Table headers'),
  rows: z.array(z.array(TableCellSchema)).describe('Table rows with cell data'),
  rowCount: z.number().describe('Number of data rows'),
  columnCount: z.number().describe('Number of columns'),
  selector: z.string().describe('Selector used'),
});

export type GetTableOutput = z.infer<typeof GetTableOutputSchema>;

/**
 * Extract table data with colspan/rowspan support
 *
 * Features:
 * - Parse table headers (thead or first row)
 * - Handle colspan and rowspan
 * - Support for complex table structures
 * - Text normalization
 * - Shadow DOM support
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Structured table data
 */
export async function getTable(
  page: Page,
  input: GetTableInput
): Promise<GetTableOutput> {
  const { selector, includeHeaders, trim, timeout } = input;

  try {
    // Wait for the table to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Table not found: ${selector}`);
    }

    // Extract table data using page evaluation
    const tableData = await element.evaluate((table, options) => {
      const { includeHeaders, trim } = options;

      // Helper to get text content
      const getText = (el: Element): string => {
        let text = el.textContent || '';
        if (trim) {
          text = text.trim().replace(/\s+/g, ' ');
        }
        return text;
      };

      // Find headers
      const headers: string[] = [];
      const headerRows = Array.from(table.querySelectorAll('thead tr'));

      if (headerRows.length > 0) {
        // Use thead for headers
        const headerRow = headerRows[0];
        if (headerRow) {
          const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
          headerCells.forEach(cell => {
            headers.push(getText(cell));
          });
        }
      } else {
        // Try to find headers in first row
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          const cells = Array.from(firstRow.querySelectorAll('th, td'));
          const hasHeaders = cells.some(cell => cell.tagName.toLowerCase() === 'th');

          if (hasHeaders) {
            cells.forEach(cell => {
              headers.push(getText(cell));
            });
          }
        }
      }

      // Extract rows
      const rows: any[][] = [];
      const bodyRows = Array.from(
        table.querySelectorAll('tbody tr, tr')
      ).filter(row => {
        // Skip header rows
        if (headerRows.includes(row)) return false;
        if (!includeHeaders && row === table.querySelector('tr')) {
          const hasHeaders = Array.from(row.querySelectorAll('th, td'))
            .some(cell => cell.tagName.toLowerCase() === 'th');
          return !hasHeaders;
        }
        return true;
      });

      bodyRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const rowData = cells.map(cell => {
          const cellData: any = {
            text: getText(cell),
            isHeader: cell.tagName.toLowerCase() === 'th',
          };

          // Handle colspan
          const colspan = cell.getAttribute('colspan');
          if (colspan && parseInt(colspan) > 1) {
            cellData.colspan = parseInt(colspan);
          }

          // Handle rowspan
          const rowspan = cell.getAttribute('rowspan');
          if (rowspan && parseInt(rowspan) > 1) {
            cellData.rowspan = parseInt(rowspan);
          }

          return cellData;
        });

        rows.push(rowData);
      });

      // Calculate column count
      const columnCount = Math.max(
        headers.length,
        ...rows.map(row =>
          row.reduce((sum, cell) => sum + (cell.colspan || 1), 0)
        )
      );

      return {
        headers,
        rows,
        rowCount: rows.length,
        columnCount,
      };
    }, { includeHeaders, trim });

    return {
      ...tableData,
      selector,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract table from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getTable
 */
export const getTableTool = {
  name: 'playwright_get_table',
  description: 'Extract structured data from HTML table. Handles complex tables with colspan/rowspan, headers, and multiple rows.',
  inputSchema: GetTableInputSchema,
  outputSchema: GetTableOutputSchema,
};
