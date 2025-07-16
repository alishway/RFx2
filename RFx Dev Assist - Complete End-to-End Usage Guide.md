# RFx Dev Assist - Complete End-to-End Usage Guide

## 📋 Test Scenario Overview

**Use Case:** A regional hospital system initiates a request to procure AI-powered data analytics services for patient flow optimization.

**Key Details:**
- **Estimated Value:** $180,000 CAD (above trade agreement threshold)
- **Timeline:** 6-month implementation starting Q2 2024
- **Commodity Type:** Professional Services - IT Consulting
- **Compliance Context:** CETA/CUSMA applicable, 30-day notice required
- **Location:** Ontario, Canada

---

## 👥 Role-Based Flow

### 🟦 End User (`end_user`)
**Access:** Basic intake form creation and submission capabilities

**Flow Steps:**
1. Create and fill intake form
2. Use AI scope chat for requirements refinement
3. Upload supporting documents
4. Submit form for procurement review

### 🟨 Procurement Lead (`procurement_lead`)  
**Access:** Review dashboard, compliance analysis, AI output management

**Flow Steps:**
1. Access submitted forms via review dashboard
2. Analyze compliance flags and scoring
3. Review and approve AI-generated content
4. Prepare documents for approver review

### 🟩 Approver (`approver`)
**Access:** Final approval decisions and workflow completion

**Flow Steps:**
1. Review compliance-analyzed forms
2. Make approval/rejection decisions
3. Provide feedback and revision notes
4. Complete approval workflow

### 🟪 Admin (`admin`)
**Access:** Full system administration and user management

**Flow Steps:**
1. Manage user roles and permissions
2. Monitor system-wide compliance patterns
3. Access audit trails and system logs
4. Configure compliance rules and thresholds

---

## 🚀 Step-by-Step Feature Walkthrough

### 1. **Initial Setup & User Accounts**

**Setup Test Accounts:**
```sql
-- Promote user to procurement_lead
UPDATE profiles 
SET role = 'procurement_lead' 
WHERE email = 'procurement@hospital.ca';

-- Promote user to approver  
UPDATE profiles 
SET role = 'approver' 
WHERE email = 'approver@hospital.ca';

-- Verify roles
SELECT email, role FROM profiles WHERE role != 'end_user';
```

### 2. **End User: Intake Form Creation**

**Navigation:** Dashboard → "Create New RFx Request" button

**Form Fields to Test:**
- **Title:** "AI-Powered Patient Flow Analytics Platform"
- **Estimated Value:** $180,000
- **Start Date:** April 1, 2024
- **End Date:** September 30, 2024
- **Commodity Type:** Select "Professional Services"
- **Budget Tolerance:** Select "Moderate"

**Expected Behavior:**
✅ **Success:** Form saves as draft automatically
✅ **Success:** Values populate in subsequent steps
❌ **Error:** Date validation (end date before start date)

### 3. **AI Scope Chat Testing**

**Test Inputs:**
```
Primary Input: "We need AI analytics to reduce patient wait times in our emergency department."

Follow-up: "The system should integrate with our Epic EHR and provide real-time dashboards."

Constraint Testing: "Only vendors certified in Canada with healthcare data compliance."
```

**Expected AI Responses:**
- ✅ Suggests requirement categories (integration, compliance, reporting)
- ✅ Identifies potential restrictive language ("only vendors certified in Canada")
- ✅ Updates form data automatically with extracted requirements
- ✅ Provides clarifying questions about specific technical needs

**Form Data Updates to Verify:**
- Requirements array populated with extracted items
- Background field enhanced with AI suggestions
- Compliance flags triggered for restrictive criteria

### 4. **File Upload Component**

**Test Files:**
- `current_patient_flow_data.xlsx` (mock hospital data)
- `technical_requirements.pdf` 
- `compliance_checklist.docx`

**Expected Behavior:**
✅ **Success:** Files upload to Supabase storage
✅ **Success:** File metadata saved to `file_attachments` table
❌ **Error:** File size validation (over 10MB)
❌ **Error:** Invalid file types

### 5. **Form Submission**

**Action:** Click "Submit for Review" button

**Backend Triggers:**
- Status changes from `draft` to `submitted`
- Compliance analysis initiated automatically
- AI content generation started
- Procurement team notification sent

**Database Verification:**
```sql
-- Check form status change
SELECT title, status, updated_at FROM intake_forms 
WHERE title LIKE '%Patient Flow%';

-- Verify compliance report created
SELECT * FROM compliance_reports 
WHERE intake_form_id = '[form_id]';
```

### 6. **Procurement Lead: Review Dashboard**

**Navigation:** Dashboard → "Access Procurement Review Dashboard"

**Dashboard Sections to Test:**

**Form Cards Display:**
- Shows form title, estimated value, submission date
- Color-coded status indicators
- Compliance score badges
- Quick action buttons

**Filter and Sort:**
- Filter by status: `submitted`, `in_review`, `approved`, `rejected`
- Sort by date, value, compliance score
- Search by title or commodity type

**Expected Metrics:**
- Total forms count
- Average compliance score
- Critical flags summary

### 7. **Form Review Detail Page**

**Navigation:** Review Dashboard → Click "Review" on form card

**Tabs to Test:**

#### **Overview Tab:**
- **Project Details:** All intake form data displayed
- **Timeline:** Start/end dates with validation warnings
- **Budget:** Value with threshold compliance indicators
- **Files:** List of uploaded attachments with download links

#### **Compliance Tab:**
**Scoring System:**
- Overall score out of 100
- Individual check results with icons
- Critical vs. warning classifications

**Key Compliance Checks:**
- ✅ Timeline feasibility (>30 days for trade agreements)
- ⚠️ Budget threshold compliance ($121,200+ triggers special rules)
- ❌ Restrictive language detection
- ✅ Required documentation completeness

**Expected Results for Test Case:**
- **Score:** ~75/100 (moderate compliance)
- **Critical Flag:** Trade agreement threshold triggered
- **Warning:** Restrictive vendor certification language
- **Recommendations:** Specific improvement suggestions

#### **AI Results Tab:**
**Content Types Generated:**
- **Requirements Analysis:** Structured requirement breakdown
- **Market Research:** Vendor landscape overview  
- **Compliance Notes:** Risk assessment summary
- **Timeline Analysis:** Project schedule evaluation

**Review Actions:**
- Status dropdown: `pending` → `approved` → `needs_revision`
- Revision notes text area
- Version history tracking

**Testing AI Output Management:**
```
1. Change status from "pending" to "needs_revision"
2. Add revision note: "Clarify data privacy requirements"
3. Click "Update Status"
4. Verify database update and UI refresh
```

#### **Documents Tab:**
**Generated Document Placeholders:**
- RFP Template (Draft)
- SOW Template (Draft) 
- Evaluation Matrix (Draft)

**Document Status Tracking:**
- Template used for generation
- Generated timestamp
- Approval status
- Version number

### 8. **Compliance Score Interpretation**

**Score Ranges:**
- **90-100:** Ready for approval (green)
- **70-89:** Minor issues, review recommended (yellow)
- **50-69:** Significant concerns, revision needed (orange)
- **<50:** Critical issues, major revision required (red)

**Critical Flags (Auto-fail conditions):**
- Missing required documentation
- Timeline violations for trade agreements
- Highly restrictive vendor criteria
- Budget posting threshold violations

**Warning Flags (Review recommended):**
- Tight timeline constraints
- Moderate restrictive language
- Incomplete requirements definition
- Budget tolerance concerns

### 9. **Approval Workflow Testing**

**Status Progression:**
```
draft → submitted → in_review → approved/rejected
```

**Procurement Lead Actions:**
```sql
-- Move to review
UPDATE intake_forms 
SET status = 'in_review' 
WHERE id = '[form_id]';
```

**Approver Actions:**
```sql
-- Final approval
UPDATE intake_forms 
SET status = 'approved' 
WHERE id = '[form_id]';

-- Or rejection with notes
UPDATE intake_forms 
SET status = 'rejected' 
WHERE id = '[form_id]';
```

### 10. **Permission-Based Visibility Testing**

**Access Control Verification:**

**End User Should See:**
- ✅ Own submitted forms
- ✅ Basic form creation interface
- ❌ Other users' forms
- ❌ Procurement review dashboard

**Procurement Lead Should See:**
- ✅ All submitted forms
- ✅ Compliance analysis tools
- ✅ AI output management
- ❌ Admin user management

**Approver Should See:**
- ✅ Forms in review status
- ✅ Approval/rejection actions
- ✅ Compliance summaries
- ❌ Detailed AI outputs (summary only)

---

## 🤖 AI-Specific Testing Guidance

### **Scope Chat Behavior**

**Typical Interactions:**
```
User: "We need a new patient management system"
AI: "I can help you define requirements for a patient management system. Let me ask a few questions:
1. What type of healthcare facility is this for?
2. Do you need integration with existing EHR systems?
3. What are your key workflow requirements?"
```

**Edge Case Testing:**
```
Restrictive Input: "Only Microsoft-certified vendors allowed"
Expected Response: "⚠️ I noticed potentially restrictive language. Consider broadening vendor qualifications to 'vendors with equivalent certification' for better competition."

Vague Input: "We need something better"
Expected Response: "Could you provide more details about what you're looking to improve? This will help me suggest specific requirements."
```

### **Compliance AI Analysis**

**Restrictive Language Detection:**
- "Only [specific vendor]"
- "Must be located in [specific city]"
- "Minimum 20 years experience" (overly specific)
- "Exactly matches our current system"

**Trade Agreement Triggers:**
- Value > $121,200 CAD
- Timeline < 30 days posting period
- Services covered under CETA/CUSMA

---

## 📊 Testing Tips & Validation

### **Database Validation Queries**

```sql
-- Check form progression
SELECT title, status, created_at, updated_at 
FROM intake_forms 
ORDER BY updated_at DESC;

-- Audit trail verification  
SELECT table_name, action, user_id, created_at 
FROM audit_trails 
WHERE table_name = 'intake_forms'
ORDER BY created_at DESC;

-- Compliance analysis results
SELECT 
  if.title,
  cr.overall_score,
  cr.critical_flags,
  cr.warning_flags
FROM intake_forms if
JOIN compliance_reports cr ON if.id = cr.intake_form_id;

-- AI output tracking
SELECT 
  content_type,
  status,
  ai_model,
  generated_at
FROM ai_generated_outputs 
WHERE intake_form_id = '[form_id]';
```

### **UI Element Validation**

**Form Validation:**
- Required field indicators (red asterisks)
- Date picker constraints
- Currency formatting
- File upload progress indicators

**Navigation Consistency:**
- Breadcrumb navigation on all screens
- Back buttons maintain state
- Dashboard access from all contexts

**Responsive Design:**
- Mobile form usability
- Dashboard card layouts
- Modal dialog responsiveness

### **Error Handling Scenarios**

**Test Invalid Inputs:**
- Negative budget values
- Past start dates
- Files over size limits
- Invalid email formats

**Network Error Simulation:**
- Offline form saving (localStorage)
- AI service unavailability fallbacks
- File upload interruption recovery

---

## 🔄 Expected Outcomes Summary

### **Successful Flow Completion:**
1. ✅ End user creates and submits comprehensive intake form
2. ✅ AI generates structured requirements and compliance analysis
3. ✅ Procurement lead reviews and addresses compliance issues
4. ✅ Approver makes informed decision based on analysis
5. ✅ System tracks complete audit trail of decisions

### **Key Performance Indicators:**
- **Form Completion Rate:** >90% of started forms submitted
- **Compliance Score Improvement:** Average 15-point increase after AI suggestions
- **Review Cycle Time:** <5 business days from submission to decision
- **User Satisfaction:** Clear workflow progression and feedback

### **Known Limitations (Sprint 4):**
- Document generation creates placeholders, not full DOCX files
- AI responses use fallback logic when service unavailable
- Advanced compliance rules require manual configuration
- Email notifications not yet implemented

---

## 📝 Test Data Templates

### **Sample Intake Form Payload:**
```json
{
  "title": "AI-Powered Patient Flow Analytics Platform",
  "estimated_value": 180000,
  "start_date": "2024-04-01",
  "end_date": "2024-09-30",
  "commodity_type": "Professional Services",
  "budget_tolerance": "moderate",
  "background": "Regional hospital system needs AI analytics to optimize patient flow and reduce emergency department wait times.",
  "requirements": [
    "Real-time patient flow monitoring",
    "Epic EHR integration",
    "Predictive analytics dashboard",
    "Mobile accessibility for staff"
  ]
}
```

### **Test File Names:**
- `hospital_patient_data_sample.xlsx`
- `technical_specifications_v2.pdf`
- `vendor_requirements_checklist.docx`
- `current_system_architecture.png`

---

## 🎯 Validation Checklist

### **Sprint 4 Feature Verification:**

- [ ] **Database Schema:** All tables created with proper relationships
- [ ] **Role-Based Access:** Permissions enforced across user types
- [ ] **Intake Form:** Complete workflow from creation to submission
- [ ] **AI Integration:** Scope chat functional with fallback handling
- [ ] **Compliance Analysis:** Scoring system operational with recommendations
- [ ] **Review Dashboard:** Procurement lead can access and manage forms
- [ ] **Approval Workflow:** Status progression works end-to-end
- [ ] **Document Placeholders:** Generation tracking in place
- [ ] **Navigation Consistency:** Breadcrumbs and back buttons functional
- [ ] **Audit Trail:** All user actions logged for compliance

### **Ready for Sprint 5:**
- [ ] All Sprint 4 features tested and validated
- [ ] User feedback collected on workflow efficiency
- [ ] Performance baseline established for AI response times
- [ ] Security review completed for role-based access
- [ ] Database optimization validated for expected load

---

*This guide provides comprehensive testing scenarios for the RFx Dev Assist application as delivered in Sprint 4. Use it to validate functionality, train users, and prepare for Sprint 5 enhancements.*