# ExcelDataTable Component

A fully reusable, Excel-like data table component with built-in pagination, cell editing, keyboard navigation, and more.

## 🚀 Features

### Excel-like Functionality
- **Click to Edit**: Click any cell to edit immediately
- **Keyboard Navigation**: Arrow keys, Tab, Enter for navigation
- **Cell Selection**: Single cell, multiple cells, range selection
- **Copy/Paste**: Ctrl+C to copy, Ctrl+V to paste
- **Column Resizing**: Drag column borders to resize
- **Row Resizing**: Drag row borders to resize (optional)
- **F2 Editing**: Press F2 to edit selected cell
- **Escape to Cancel**: Press Escape to cancel editing

### Component Features
- **Generic Data Support**: Works with any data type
- **Customizable Columns**: Define your own column structure
- **Built-in Pagination**: Uses CommonPagination component
- **Loading States**: Built-in loading indicators
- **Error Handling**: Comprehensive error handling
- **Responsive Design**: Works on all screen sizes
- **TypeScript Support**: Full TypeScript support

## 📦 Installation

The component is already included in your project at:
```
frontend/src/components/ExcelDataTable.tsx
```

## 🔧 Basic Usage

### 1. Import the Component

```tsx
import ExcelDataTable from '../components/ExcelDataTable';
```

### 2. Define Your Data Interface

```tsx
interface YourData {
  id: string;
  name: string;
  email: string;
  // ... other fields
}
```

### 3. Define Your Columns

```tsx
const columns = [
  {
    id: 'select',
    header: 'Sr. No.',
    size: 80,
    isRowHeader: true  // This makes it a row header (Sr. No.)
  },
  {
    accessorKey: 'name',
    header: 'Full Name',
    size: 200
  },
  {
    accessorKey: 'email',
    header: 'Email Address',
    size: 250
  }
  // ... more columns
];
```

### 4. Use the Component

```tsx
<ExcelDataTable
  data={yourData}
  columns={yourColumns}
  onUpdateRow={handleUpdateRow}
  enableExcelFeatures={true}
  showRefreshButton={true}
  onRefresh={handleRefresh}
/>
```

## 📋 Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data objects |
| `columns` | `ExcelColumn[]` | Column definitions |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Show loading state |
| `onUpdateRow` | `function` | `undefined` | Handle row updates |
| `pagination` | `object` | `undefined` | Pagination configuration |
| `onPageChange` | `function` | `undefined` | Handle page changes |
| `onItemsPerPageChange` | `function` | `undefined` | Handle items per page changes |
| `showPagination` | `boolean` | `false` | Show pagination footer |
| `enableExcelFeatures` | `boolean` | `true` | Enable Excel functionality |
| `showRefreshButton` | `boolean` | `true` | Show refresh button |
| `onRefresh` | `function` | `undefined` | Handle refresh |
| `showFiltersInfo` | `boolean` | `false` | Show filter information |
| `masterFilters` | `object` | `{}` | Master filter data |
| `detailedFilters` | `object` | `{}` | Detailed filter data |
| `filterLoading` | `boolean` | `false` | Show filter loading state |
| `tableHeight` | `string` | `"h-screen"` | Table height CSS class |
| `rowHeight` | `number` | `28` | Default row height in pixels |
| `enableColumnResize` | `boolean` | `true` | Enable column resizing |
| `enableRowResize` | `boolean` | `true` | Enable row resizing |

## 🎯 Column Definition

### Column Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | No* | Unique column identifier |
| `accessorKey` | `string` | No* | Data field key |
| `header` | `string` | Yes | Column header text |
| `size` | `number` | Yes | Column width in pixels |
| `cell` | `function` | No | Custom cell renderer |
| `isRowHeader` | `boolean` | No | Mark as row header (Sr. No.) |

*Either `id` or `accessorKey` is required

### Column Examples

```tsx
// Basic column
{
  accessorKey: 'name',
  header: 'Full Name',
  size: 200
}

// Row header column (Sr. No.)
{
  id: 'select',
  header: 'Sr. No.',
  size: 80,
  isRowHeader: true
}

// Custom cell renderer
{
  accessorKey: 'status',
  header: 'Status',
  size: 120,
  cell: ({ row }) => (
    <span className={`px-2 py-1 rounded ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {row.status}
    </span>
  )
}
```

## 🔄 Data Updates

### Handle Row Updates

```tsx
const handleUpdateRow = useCallback(async (rowIndex: number, columnId: string, value: any) => {
  try {
    // Make API call to update data
    await updateRowInDatabase(rowIndex, columnId, value);
    
    // Update local state
    setData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      }
      return newData;
    });
    
    console.log(`Updated row ${rowIndex}, column ${columnId} to: ${value}`);
  } catch (error) {
    console.error('Error updating row:', error);
    throw error; // This will show error in the UI
  }
}, []);
```

## 📄 Pagination

### Enable Pagination

```tsx
<ExcelDataTable
  data={data}
  columns={columns}
  showPagination={true}
  pagination={{
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10
  }}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
/>
```

### Pagination Handlers

```tsx
const handlePageChange = (page: number) => {
  setCurrentPage(page);
  fetchDataForPage(page);
};

const handleItemsPerPageChange = (itemsPerPage: number) => {
  setItemsPerPage(itemsPerPage);
  setCurrentPage(1);
  fetchDataForPage(1, itemsPerPage);
};
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Arrow Keys` | Navigate between cells |
| `Tab` | Move to next cell |
| `Shift + Tab` | Move to previous cell |
| `Enter` | Move to cell below |
| `F2` | Edit selected cell |
| `Escape` | Cancel editing |
| `Ctrl + A` | Select all cells |
| `Ctrl + C` | Copy selected cells |
| `Ctrl + V` | Paste into selected cell |
| `Delete` | Clear cell content |

## 🎨 Customization

### Custom Table Height

```tsx
<ExcelDataTable
  data={data}
  columns={columns}
  tableHeight="h-[500px]"  // Custom height
/>
```

### Custom Row Height

```tsx
<ExcelDataTable
  data={data}
  columns={columns}
  rowHeight={40}  // 40px row height
/>
```

### Disable Features

```tsx
<ExcelDataTable
  data={data}
  columns={columns}
  enableExcelFeatures={false}    // Disable Excel features
  enableColumnResize={false}     // Disable column resizing
  enableRowResize={false}        // Disable row resizing
  showRefreshButton={false}      // Hide refresh button
/>
```

## 📱 Responsive Design

The component automatically adapts to different screen sizes:

- **Desktop**: Full Excel-like experience
- **Tablet**: Optimized for touch
- **Mobile**: Responsive layout with scroll

## 🚨 Error Handling

### Loading States

```tsx
<ExcelDataTable
  data={data}
  columns={columns}
  loading={isLoading}  // Shows loading spinner
/>
```

### Update Errors

```tsx
const handleUpdateRow = async (rowIndex: number, columnId: string, value: any) => {
  try {
    await updateData(rowIndex, columnId, value);
  } catch (error) {
    // Error will be shown in the UI
    throw error;
  }
};
```

## 🔍 Example Implementation

See the complete example at:
```
frontend/src/app/excel-example/page.tsx
```

This page demonstrates:
- Basic usage
- Column definitions
- Data updates
- Custom styling
- Feature toggles

## 🧪 Testing

### Test the Component

1. Navigate to `/excel-example` in your app
2. Try clicking on cells to edit
3. Use keyboard navigation
4. Test column resizing
5. Try copy/paste functionality

### Test Excel Features

- Click any cell to edit
- Use arrow keys to navigate
- Press F2 to edit
- Use Ctrl+A to select all
- Use Ctrl+C to copy
- Drag column borders to resize

## 🤝 Contributing

To add new features to ExcelDataTable:

1. **Add new props** to the interface
2. **Implement functionality** in the component
3. **Update documentation** in this README
4. **Add examples** to the example page

## 📚 Related Components

- **CommonPagination**: Built-in pagination component
- **DataTable**: Original data table (now uses CommonPagination)
- **SurnameDataTable**: Surname-specific table with pagination

## 🎯 Use Cases

Perfect for:
- **Admin Panels**: User management, settings
- **Data Entry**: Bulk data input, forms
- **Reports**: Data display, analytics
- **CRUD Operations**: Create, read, update, delete
- **Excel-like Applications**: Spreadsheet replacements

## 🚀 Performance Tips

1. **Use `useCallback`** for event handlers
2. **Memoize data** when possible
3. **Limit row count** for large datasets
4. **Enable pagination** for better performance
5. **Use `loading` states** for async operations

## 🔧 Troubleshooting

### Common Issues

1. **Cells not editing**: Check `enableExcelFeatures={true}`
2. **Pagination not showing**: Check `showPagination={true}`
3. **Column resizing not working**: Check `enableColumnResize={true}`
4. **Data not updating**: Implement `onUpdateRow` handler

### Debug Mode

Enable console logging to debug issues:

```tsx
// Check browser console for detailed logs
console.log('ExcelDataTable props:', { data, columns, loading });
```

---

**Happy coding! 🎉**

The ExcelDataTable component gives you Excel-like functionality in any React application with minimal setup and maximum flexibility.
