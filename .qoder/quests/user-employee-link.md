# User-Employee Linking System Design

## Overview

This design document outlines the approach to link the User and Employee entities in the system. The key requirement is that every user in the system must be an employee, so we need to establish a relationship between these two models. Additionally, the admin interface needs to be updated to allow selecting an employee when creating a new user.

## Current State Analysis

### User Model

The User model currently exists independently and contains authentication-related fields such as username, password, role (admin, employee, viewer, user, hr, finance), permission groups, and direct permissions. It also contains a profile object with fields like firstName, lastName, email, phone, department, avatar, bio, and documents. This profile information is redundant since it should come from the Employee model.

### Employee Model

The Employee model contains comprehensive employee information including personal details (firstName, fatherName, lastName, fullName, nationalId, birthDate), contact information (phone), employment details (currentJobTitle, employmentType, hiringDate), educational information (educationLevel, specialization, university), and family information (maritalStatus, childrenCount).

## Proposed Solution

### Backend Changes

#### 1. Database Schema Modification

- Add an employeeId field to the User model as a required ObjectId reference to the Employee model
- Add a unique index on the employeeId field to prevent multiple users for the same employee
- Remove redundant profile fields from the User model (firstName, lastName, email, phone, department) as they will be fetched from the Employee model
- Add a virtual populate field in the Employee model to reference the associated user

#### 2. API Endpoint Modifications

- Modify the user creation endpoint (`POST /api/users`) to require an employee ID
- Create a new endpoint (`GET /api/employees/search`) to search employees by name or national ID for user creation
- Update user retrieval endpoints (`GET /api/users/:id` and `GET /api/users`) to populate and include employee data
- Add validation to prevent creating multiple users for the same employee

#### 3. Controller Logic Updates

- Update UserController.createUser to validate that an employee ID is provided and that the employee exists
- Implement logic in UserController.getUser and UserController.getUsers to populate associated employee data
- Update UserController.updateUserProfile to either update the user's profile fields or redirect to employee update
- Create new EmployeeController.searchEmployees method for the employee search functionality

#### 4. Data Migration

- For existing users, populate the employeeId field by matching user profile data with employee records
- For existing employees without users, they will only be accessible after a user is created for them

### Frontend Changes

#### 1. User Creation Form Updates

- Replace the current username input field in the user creation form with an employee search component
- Implement a searchable dropdown/select component that allows admins to search employees by name or national ID
- Display selected employee's basic information (name, national ID, job title) in the form
- Keep only the password and role fields as inputs from the admin
- Disable the create button until an employee is selected and a password is entered
- Show validation errors if an employee already has a user account

#### 2. Profile Page Implementation

- Update the UserProfile page to display combined user and employee information
- Fetch user data along with populated employee data in a single API call
- Organize the profile display to show user-specific information (username, role, permissions) and employee information (personal details, job information, contact details)
- Update document management to work with the combined data structure
- Ensure all update functionalities work correctly with the new data structure

## Detailed Design

### Data Model Relationship

| User Model      | Relationship | Employee Model     |
| --------------- | ------------ | ------------------ |
| _id             | ←→           | userId             |
| employeeId      | ←→           | _id                |
| username        |              |                    |
| password        |              |                    |
| role            |              |                    |
| permissionGroups|              |                    |
| directPermissions|             |                    |
| profile         |              | (firstName, lastName, email, phone, department) |
|                 |              | fullName           |
|                 |              | currentJobTitle    |
|                 |              | phone              |
|                 |              | ...                |

### API Endpoints

#### Modified Endpoints

- `POST /api/users` - Create user (now requires employeeId)
- `GET /api/users/:id` - Get user with employee data
- `GET /api/users` - List users with employee data

#### New Endpoints

- `GET /api/employees/search?q={query}` - Search employees for user creation
- `GET /api/employees/:id/user` - Get user data for a specific employee

### Workflow

#### User Creation Process

1. Admin navigates to user creation page
2. Admin searches for an employee using the search functionality
3. Admin selects an employee from the search results
4. Admin enters a password for the new user
5. System creates a user record linked to the selected employee
6. System prevents creating multiple users for the same employee

#### Profile Display Process

1. User accesses their profile page
2. System fetches user data along with associated employee data
3. System displays combined information in the profile view

## Implementation Considerations

### Data Integrity

- Ensure that each employee can only be linked to one user account
- Validate that the employee exists before creating a user
- Handle cases where employee data might be missing or incomplete

### Security

- Maintain existing authentication and authorization mechanisms
- Ensure that user passwords are properly hashed and secured
- Validate that only authorized administrators can create users

### Performance

- Optimize employee search functionality for large datasets
- Efficiently join user and employee data in API responses
- Implement appropriate indexing on the foreign key relationships

## Validation Rules

### User Creation Validation

- Employee ID must be provided
- Employee must exist in the system
- Employee must not already be linked to another user
- Password must meet security requirements

### Data Consistency Validation

- Prevent deletion of employees who are linked to users
- Handle updates to employee information that should reflect in user profiles

## Error Handling

### Common Error Scenarios

- Attempting to create a user for a non-existent employee
- Attempting to create a user for an employee who already has a user account
- Database connection issues during user creation
- Invalid search queries for employees

## Testing Requirements

### Functional Tests

- Verify that user creation requires a valid employee ID
- Confirm that employee data is correctly displayed in user profiles
- Test the employee search functionality
- Validate that one employee cannot have multiple user accounts

### Integration Tests

- Test the complete user creation workflow
- Verify data integrity between user and employee models
- Test the complete user creation workflow
- Verify data integrity between user and employee models
- Test API endpoints for proper data retrieval and error handling
