# Contributing to Notesourcing

## 🚨 **CRITICAL: READ FIRST - FEATURE PROTECTION**

> **⚠️ MANDATORY**: Before making ANY changes to this codebase, you MUST read [`FEATURES.md`](./FEATURES.md) to understand all implemented features and avoid accidental removal.

**For AI Agents & Developers**: This project has comprehensive functionality that must be preserved. Always check the feature documentation before implementing changes.

## 📋 **Pre-Development Checklist**

- [ ] Read `FEATURES.md` completely
- [ ] Run `npm run features` to open feature documentation
- [ ] Understand the feature you're modifying/adding
- [ ] Verify no existing features will be affected
- [ ] Test all related functionality after changes

## 🛠️ **Development Guidelines**

### **1. Feature Preservation Protocol**

**NEVER remove or modify existing functionality without explicit approval:**

- ✅ **Safe Operations**: Adding new features, fixing bugs, improving UI/UX
- ⚠️ **Requires Caution**: Refactoring existing components, changing data structures
- ❌ **Dangerous Operations**: Removing components, deleting functions, changing APIs

### **2. AI Agent Instructions**

When working with AI assistance:

1. **Always reference FEATURES.md** before making changes
2. **Preserve all existing functionality** unless explicitly asked to remove it
3. **Test real-time features** - this app relies heavily on Firestore listeners
4. **Maintain role-based permissions** - SuperAdmin, Admin, and User roles exist
5. **Keep community features intact** - shared notes, community management, etc.

### **3. Code Organization**

```
src/
├── pages/           # Main application pages
│   ├── Home.jsx     # Public feed with all notes
│   ├── Dashboard.jsx # User's personal notes management
│   ├── Community.jsx # Individual community view
│   ├── Login.jsx    # Authentication
│   └── Note.jsx     # Individual note view
├── App.jsx          # Main app component with routing
├── firebase.js      # Firebase configuration
└── main.jsx         # React entry point
```

### **4. Critical Components to Protect**

#### **Real-time Functionality**

- All `onSnapshot` listeners in components
- Real-time updates for notes across pages
- Live reactions and community interactions

#### **Authentication & Roles**

- SuperAdmin capabilities (view all notes, manage users)
- Admin role permissions
- User authentication context

#### **Note Management**

- Personal notes (Dashboard)
- Shared notes in communities
- Note reactions and interactions
- QR code generation for notes

#### **Community Features**

- Community creation and management
- Shared note posting in communities
- Community member management

## 🧪 **Testing Requirements**

Before submitting changes:

### **Automated Feature Validation**

```bash
# Basic feature validation - checks critical patterns exist
npm run validate-features

# Comprehensive integrity check - deep structural validation
npm run integrity-check

# Complete validation suite (both checks)
npm run full-check

# Safe build with full validation
npm run safe-build
```

### **Runtime Feature Monitoring**

During development, the app includes a **real-time feature monitor** that actively watches for missing functionality:

- **🚨 Automatic alerts** if critical features are removed
- **👀 Real-time monitoring** of authentication, real-time listeners, and SuperAdmin features
- **🔔 Visual warnings** appear immediately when features go missing
- **📋 Console logs** with links to FEATURES.md for restoration

The monitor only runs in development mode and will show prominent red banners if any critical functionality is missing.

### **Manual Testing Checklist**

- [ ] Login/logout functionality works
- [ ] Personal notes appear in Dashboard
- [ ] Community notes appear in Home feed in real-time
- [ ] New notes created in communities appear immediately for other users
- [ ] Reactions work on all notes
- [ ] SuperAdmin can see all notes in Dashboard
- [ ] Community page shows correct notes for that community
- [ ] Note sharing and QR codes work

### **Real-time Testing**

- [ ] Open app in multiple browser tabs/windows
- [ ] Create a note in one tab, verify it appears in others instantly
- [ ] Test with different user roles
- [ ] Verify community notes appear in home feed immediately

## 🔧 **Common Pitfalls to Avoid**

### **1. Breaking Real-time Updates**

```javascript
// ❌ DON'T: Replace onSnapshot with getDocs
const fetchNotes = async () => {
  const snapshot = await getDocs(collection(db, "personalNotes"));
  // This breaks real-time updates!
};

// ✅ DO: Keep onSnapshot listeners
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "personalNotes"),
    (snapshot) => {
      // Real-time updates work correctly
    }
  );
  return unsubscribe;
}, []);
```

### **2. Removing Role-based Features**

```javascript
// ❌ DON'T: Remove SuperAdmin functionality
if (user.role === "SuperAdmin") {
  // Don't remove this - SuperAdmins need to see all notes
}

// ✅ DO: Preserve all role checks
```

### **3. Breaking Community Features**

- Don't remove shared note creation in communities
- Don't remove community management pages
- Don't break the link between Dashboard and Communities page

## 📝 **Making Changes Safely**

### **Step-by-Step Process**

1. **Understand the Current State**

   ```bash
   npm run features  # Open FEATURES.md
   ```

2. **Identify Affected Components**

   - Read the relevant sections in FEATURES.md
   - Check dependencies and related functionality

3. **Plan Your Changes**

   - Document what you plan to change
   - Identify potential side effects
   - Plan testing approach

4. **Implement with Care**

   - Make incremental changes
   - Test frequently
   - Preserve all existing functionality

5. **Verify Everything Works**
   - Run through the manual testing checklist
   - Test with different user roles
   - Verify real-time updates still work

## 🚀 **Development Commands**

```bash
# Quick access to feature documentation
npm run features

# Open contributing guidelines
npm run contributing

# Open all documentation
npm run docs

# Check features reminder
npm run check-features

# Validate that critical features are still present
npm run validate-features

# Safe build (validates features first, then builds)
npm run safe-build

# Development server
npm run dev

# Build for production
npm run build
```

## 📚 **Key Documentation Files**

- [`FEATURES.md`](./FEATURES.md) - **MUST READ** - Complete feature inventory
- [`README.md`](./README.md) - Project overview and specifications
- [`README_DEV.md`](./README_DEV.md) - Development setup instructions

## ⚡ **Quick Reference for AI Agents**

When asked to implement new features or make changes:

1. **First Action**: Read `FEATURES.md`
2. **Before Coding**: Understand what exists
3. **While Coding**: Preserve all existing functionality
4. **After Coding**: Test real-time features thoroughly
5. **Before Completion**: Verify nothing was accidentally removed

## 🔗 **Firebase Architecture Notes**

This app uses:

- **Firestore Collections**: `personalNotes`, `sharedNotes`, `users`, `communities`
- **Real-time Listeners**: Essential for live updates across all pages
- **Authentication**: Firebase Auth with role-based permissions
- **Security**: Client-side only, all persistence via Firebase

## 📞 **Getting Help**

If you're unsure about any changes:

1. Review the feature documentation thoroughly
2. Test in a development environment first
3. When in doubt, ask before removing existing functionality

---

**Remember**: This project serves real users with established workflows. Preserving existing functionality is more important than perfect code structure. Always err on the side of caution when making changes.
