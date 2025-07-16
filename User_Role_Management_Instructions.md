### 👥 User Role Management Instructions:

**1. End User (Default Role)**
- **Creation**: Automatically assigned when users sign up
- **Access**: Can create and edit their own intake forms (draft status only)
- **Management**: No admin action needed - this is the default role

**2. Procurement Lead**
- **Creation**: Must be manually updated in the database
- **Access**: Can view and update all intake forms, manage procurement workflows
- **How to create**: Run this SQL in Supabase:
```sql
UPDATE profiles SET role = 'procurement_lead' WHERE email = 'user@company.com';
```

**3. Approver** 
- **Creation**: Must be manually updated in the database
- **Access**: Same as Procurement Lead plus approval workflows
- **How to create**: Run this SQL in Supabase:
```sql
UPDATE profiles SET role = 'approver' WHERE email = 'user@company.com';
```

**4. Admin**
- **Creation**: Must be manually updated in the database  
- **Access**: Full system access including user management
- **How to create**: Run this SQL in Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@company.com';
```

### 🔧 Role Management Best Practices:
1. **First Admin**: Manually promote the first user to admin via SQL
2. **Role Changes**: Currently via SQL - you may want to build an admin interface later
3. **Audit Trail**: All role changes are automatically logged in the audit_trails table
4. **Security**: RLS policies enforce role-based data access

The system is ready for Sprint 3 implementation!
