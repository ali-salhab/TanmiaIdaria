# Components Organization

This folder contains all reusable React components organized by feature/domain.

## Folder Structure

```
components/
├── dashboard/          # Dashboard-specific components
│   └── DashboardSidebar.jsx
├── chat/              # Chat-related components
│   ├── AdminChat.jsx
│   ├── ChatSidebar.jsx
│   └── ChatWindow.jsx
├── employees/         # Employee-related components
│   ├── EmployeeDocuments.jsx
│   └── ImageUploadWithScanner.jsx
├── common/            # Common reusable components
│   ├── Pagination.jsx
│   ├── FilterBar.jsx
│   ├── FileUpload.jsx
│   └── DropdownWithSettings.jsx
├── permissions/       # Permission management components
│   ├── AddUserModal.jsx
│   └── Modal.jsx
├── incidents/        # Incident-related components
│   └── IncidentAddDialog.jsx
└── layout/           # Layout components
    ├── Navbar.jsx
    └── Sidebar.jsx
```

## Usage

Import components using their relative paths:
```jsx
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import AdminChat from '../components/chat/AdminChat';
```

