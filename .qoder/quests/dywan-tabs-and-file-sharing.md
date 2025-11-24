# Dywan Section Enhancement with Tabs and File Sharing

## Overview

This document outlines the design for enhancing the Dywan section of the application by adding four tabs (الصادر, الوارد, القرارات) and implementing a file sharing capability that allows employees with specific permissions to receive files from the Dywan section, reply with files or text, and have these operations archived.

## Requirements Analysis

### Functional Requirements

1. **Tabbed Interface in Dywan Section**

   - Add four tabs to the Dywan section:
     - الصادر (Outgoing)
     - الوارد (Incoming)
     - القرارات (Decisions)
     - مشاركة الملفات (File Sharing)

2. **File Sharing Capability**

   - Employees with "dywan.receive_files" permission can receive files from other employees in the Dywan section
   - Recipients can reply to senders with optional files or text messages
   - All file sharing operations are archived for future reference

3. **Permission System**

   - Implement a new permission "dywan.receive_files" to control who can receive files from the Dywan section
   - Only users with this permission will appear in the recipient selection when sending files

4. **Archive Functionality**
   - All file sharing operations (sent and received) are automatically archived
   - Archive includes metadata such as sender, recipient, timestamp, and file information

### Non-Functional Requirements

1. **Usability**

   - Interface should be intuitive and consistent with existing design patterns
   - Tab navigation should be clear and responsive

2. **Performance**

   - File sharing operations should be efficient with minimal latency
   - Archive queries should be optimized for quick retrieval

3. **Security**
   - Only authorized users should be able to send/receive files
   - File access should be restricted to involved parties

## System Design

### Architecture Overview

The enhanced Dywan section will maintain the existing structure while adding new components for tab navigation and file sharing. The file sharing functionality will leverage the existing FileShare model with modifications to support the new workflow.

```
[Frontend] ↔ [API Layer] ↔ [Business Logic] ↔ [Data Layer]
     ↓
[Permission System] → [Archive System]
```

### Component Design

#### 1. Dywan Page Component

The Dywan page will be restructured to include a tabbed interface:

- **Tab Navigation Component**: Handles switching between the four sections
- **Content Area**: Displays content based on the active tab
- **State Management**: Manages active tab and associated data

#### 2. File Sharing Component

A new component will be created within the Dywan section to handle file sharing:

- **File Upload Interface**: Allows users to select and upload files
- **Recipient Selection**: Dropdown showing only users with "dywan.receive_files" permission
- **Message Input**: Text area for optional messages
- **File List Display**: Shows sent and received files with status indicators
- **Reply Functionality**: Allows recipients to reply with files or text

#### 3. Permission Integration

The system will integrate with the existing permission system:

- **New Permission**: "dywan.receive_files" will be added to the permission definitions
- **User Filtering**: When selecting recipients, only users with this permission will be shown
- **Access Control**: Backend validation will ensure only authorized users can perform operations

### Data Model

#### FileShare Model Extension

The existing FileShare model will be used with possible extensions:

| Field          | Type            | Description                                               |
| -------------- | --------------- | --------------------------------------------------------- |
| sender         | ObjectId (User) | User who sent the file                                    |
| recipient      | ObjectId (User) | User who received the file                                |
| fileName       | String          | Original name of the file                                 |
| fileUrl        | String          | Path to the uploaded file                                 |
| fileSize       | Number          | Size of the file in bytes                                 |
| fileType       | String          | Type of file (image/document/other)                       |
| message        | String          | Optional message with the file                            |
| isRead         | Boolean         | Whether the recipient has viewed the file                 |
| downloadCount  | Number          | Number of times the file was downloaded                   |
| relatedToDywan | Boolean         | Indicates if the file sharing is related to Dywan section |
| threadId       | ObjectId        | Identifier for conversation threads                       |
| replyTo        | ObjectId        | Reference to original file share if this is a reply       |

#### Archive Model

A new Archive model will be created to store file sharing operations:

| Field         | Type       | Description                                |
| ------------- | ---------- | ------------------------------------------ |
| operationType | String     | Type of operation (send/reply/archive)     |
| participants  | [ObjectId] | Users involved in the operation            |
| fileShareId   | ObjectId   | Reference to the FileShare record          |
| metadata      | Object     | Additional information about the operation |
| timestamp     | Date       | When the operation occurred                |

### API Design

#### New Endpoints

1. **GET /api/dywan/file-share/recipients**

   - Returns list of users with "dywan.receive_files" permission
   - Used for populating recipient dropdown

2. **GET /api/dywan/file-share/thread/:threadId**

   - Returns all file shares in a conversation thread
   - Used for displaying conversation history

3. **POST /api/dywan/file-share**

   - Creates a new file share operation from Dywan section
   - Requires "fileshare.send" permission

4. **POST /api/dywan/file-share/:id/reply**

   - Creates a reply to an existing file share
   - Requires "fileshare.send" permission

5. **POST /api/dywan/archive**
   - Archives a file sharing operation
   - Automatically called when file shares are created

#### Modified Endpoints

1. **GET /api/file-share/received**

   - Add filter parameter to distinguish Dywan-related shares
   - Add thread information for conversation display

2. **GET /api/file-share/sent**
   - Add filter parameter to distinguish Dywan-related shares
   - Add thread information for conversation display

### User Interface Design

#### Tabbed Navigation

The Dywan page will feature a tabbed interface at the top:

```
[ الصادر ] [ الوارد ] [ القرارات ] [ مشاركة الملفات ]
```

Each tab will display relevant content:

- **الصادر**: Documents sent out from the organization
- **الوارد**: Documents received from external sources
- **القرارات**: Official decisions and resolutions
- **مشاركة الملفات**: File sharing interface with permission-based recipient selection

#### File Sharing Interface

The file sharing tab will include:

1. **Send File Section**

   - File upload button
   - Recipient dropdown (filtered by permission)
   - Message text area
   - Send button

2. **File List Section**

   - Tabs for "Received" and "Sent" files
   - Each file entry showing:
     - Sender/recipient information
     - File name and type
     - Timestamp
     - Message (if any)
     - Status indicators (read/unread, download count)
     - Reply button (for received files)

3. **Conversation View**
   - When a file is selected, show the full conversation thread
   - Display all replies in chronological order
   - Provide reply form at the bottom

#### Archive Interface

An archive section will be accessible to authorized users:

- List of all file sharing operations
- Filter by date range, participants, or file types
- Search functionality
- Export options

### Security Design

#### Permission Model

A new permission will be added:

- **Key**: "dywan.receive_files"
- **Label**: "استلام ملفات الديوان"
- **Description**: "القدرة على استلام ملفات من قسم الديوان"
- **Category**: "الديوان"

#### Access Control

1. **Recipient Selection**

   - Only users with "dywan.receive_files" permission appear in recipient dropdown
   - Backend validation ensures recipient has proper permissions

2. **File Access**

   - Only sender and recipient can download files
   - Archive access restricted to users with appropriate permissions

3. **Reply Functionality**
   - Only recipient can reply to received files
   - All replies maintain the same access restrictions

### Archive Strategy

#### Data Archiving

1. **Automatic Archiving**

   - All file share operations are automatically archived
   - Archive entry created when file share is created
   - Metadata includes operation type, participants, and timestamp

2. **Archive Structure**
   - Organized by operation type and date
   - Easily searchable by participants or file information
   - Retains all conversation threads for future reference

#### Archive Access

1. **Authorized Users**

   - Users with "dywan.view_archive" permission can access archives
   - Managers can view archives for their subordinates
   - Audit personnel have broader access for compliance purposes

2. **Search and Filter**
   - Date range filtering
   - Participant filtering
   - File type filtering
   - Keyword search in messages

## Implementation Plan

### Phase 1: UI Development

1. **Tabbed Interface**

   - Implement tab navigation component
   - Restructure existing Dywan content into tabbed sections
   - Create basic layout for each tab

2. **File Sharing UI**
   - Design file upload interface
   - Create recipient selection dropdown
   - Implement file list display
   - Add reply functionality

### Phase 2: Backend Development

1. **Permission System**

   - Add "dywan.receive_files" permission
   - Implement recipient filtering logic
   - Add backend validation for permissions

2. **API Development**

   - Create new endpoints for Dywan file sharing
   - Modify existing file share endpoints to support Dywan features
   - Implement archive functionality

3. **Data Model Extensions**
   - Extend FileShare model with Dywan-specific fields
   - Create Archive model
   - Implement data relationships

### Phase 3: Integration and Testing

1. **Frontend-Backend Integration**

   - Connect UI components to API endpoints
   - Implement real-time updates using sockets where appropriate
   - Handle error states and user feedback

2. **Security Testing**

   - Validate permission checks
   - Test file access restrictions
   - Verify archive access controls

3. **User Acceptance Testing**
   - Conduct usability testing with sample users
   - Gather feedback on tab navigation
   - Validate file sharing workflow

### Phase 4: Archive Implementation

1. **Archive System**

   - Implement automatic archiving logic
   - Create archive search and filter functionality
   - Develop export capabilities

2. **Performance Optimization**
   - Optimize database queries for archive access
   - Implement caching where appropriate
   - Ensure scalability for growing archive data

## Risk Assessment

### Technical Risks

1. **Permission Integration**

   - Risk: Difficulty in filtering users by permissions
   - Mitigation: Thorough testing of permission system integration

2. **Data Model Changes**

   - Risk: Impact on existing file sharing functionality
   - Mitigation: Backward compatibility testing

3. **Performance with Large Archives**
   - Risk: Slow queries with growing archive data
   - Mitigation: Database indexing and query optimization

### Security Risks

1. **Unauthorized File Access**

   - Risk: Users accessing files they shouldn't have access to
   - Mitigation: Comprehensive access control validation

2. **Data Leakage**
   - Risk: Sensitive information being shared inappropriately
   - Mitigation: Clear permission boundaries and audit trails

## Success Metrics

1. **User Adoption**

   - Percentage of eligible users actively using the file sharing feature
   - User satisfaction scores from feedback surveys

2. **Performance**

   - Page load times for Dywan section
   - File upload/download success rates

3. **Security**

   - Zero unauthorized access incidents
   - Successful permission validation in all test cases

4. **Archiving Effectiveness**
   - Complete capture of all file sharing operations
   - Fast archive search and retrieval times
