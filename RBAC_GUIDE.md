# Role-Based Access Control (RBAC) Implementation

## Overview
The system now implements role-based access control with two user roles:
- **Customer**: Default role for new registrations
- **Admin**: Can manage user roles and access admin features

## Key Features Implemented

### 1. Role Management
- ✅ Only admins can change user roles
- ✅ Admins cannot demote themselves
- ✅ Real-time role updates in the UI
- ✅ Role validation on both frontend and database level

### 2. Access Controls
- ✅ Users page only accessible to admins
- ✅ "Manage Users" button only visible to admins
- ✅ Users navigation link only visible to admins
- ✅ Role change controls only visible to admins

### 3. Default Behavior
- ✅ New registrations default to 'customer' role
- ✅ Admin protection prevents self-demotion
- ✅ Unauthorized access redirects to dashboard

## How to Create Your First Admin

Since new registrations default to 'customer', you need to manually create the first admin:

### Option 1: Direct Database Update (Firebase Console)
1. Register a new user through the app
2. Go to Firebase Console > Firestore Database
3. Find the 'users' collection
4. Locate your user document (by email)
5. Edit the document and change `role` from `customer` to `admin`
6. Save the changes
7. Refresh your app - you should now have admin access

### Option 2: Temporary Code Change (Development Only)
1. Temporarily change the default role in `AuthContext.tsx`:
   ```typescript
   role: 'admin', // Temporarily for first admin
   ```
2. Register your admin account
3. Change it back to:
   ```typescript
   role: 'customer', // Normal default
   ```
4. Deploy the corrected version

## Role Management Interface

### Admin Users Can:
- View all registered users in `/users` page
- Change user roles between 'customer' and 'admin'
- See role change dropdowns for other users
- Cannot change their own role (protection)

### Customer Users:
- Cannot access `/users` page
- No "Manage Users" button in dashboard
- No "Users" link in navigation
- Standard user dashboard access

## Security Features

### Frontend Protection:
- Route guards redirect non-admins
- UI elements conditionally rendered based on role
- Role validation before API calls

### Database Protection:
- Role change functions validate admin status
- Self-demotion prevention
- Error handling for unauthorized attempts

## Files Modified

### Core Files:
- `lib/userService.ts` - Added role management functions
- `app/contexts/AuthContext.tsx` - Updated role types and defaults
- `app/users/page.tsx` - Added role management interface
- `app/dashboard/page.tsx` - Admin-only features
- `app/components/Navbar.tsx` - Role-based navigation

### New Functions:
- `updateUserRole()` - Change user role (admin only)
- `isUserAdmin()` - Check admin status
- `getUserRole()` - Get user role
- Role validation and protection

## Testing the Implementation

### Test Admin Functionality:
1. Create first admin (see above)
2. Register a new customer account
3. Login as admin
4. Go to Users page
5. Change customer role to admin
6. Verify role change works
7. Try to change your own role (should be prevented)

### Test Customer Limitations:
1. Login as customer
2. Verify no "Users" link in nav
3. Try accessing `/users` directly (should redirect)
4. Verify no "Manage Users" in dashboard

## Role Badges & UI

### Visual Indicators:
- **Admin**: Blue badge with "ADMIN" text
- **Customer**: Purple badge with "CUSTOMER" text
- **Current User**: Special "You" badge
- **Updating**: Loading indicator during role changes

### Interactive Elements:
- Role dropdown for admins to change other users
- Disabled state during role updates
- Error messages for failed operations

## Production Considerations

### Security Rules (Firestore):
Consider implementing these database rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth.uid == userId;
      
      // Only admins can write user data
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```

### Best Practices:
- Always validate roles on the server side
- Log role changes for audit purposes
- Implement proper error handling
- Consider rate limiting for role changes
- Regular security reviews of admin accounts

## Next Steps

1. **Create your first admin** using one of the methods above
2. **Test the role management** functionality
3. **Update Firestore security rules** for production
4. **Consider adding audit logs** for role changes
5. **Implement additional admin features** as needed
