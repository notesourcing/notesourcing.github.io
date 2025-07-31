# Note Attribution Feature

## Overview

The Note Attribution feature allows users to attribute notes to different entities beyond themselves. This implements the requirement from the README.md specification:

> "A note can be attributed to the user herself, to another person, to a pseudonym, an eteronym, or it can be anonymous. If using a pseudonym or eteronym, the user can choose to reveal that it is a pseudonym (or eteronym) or to use it as if it was the name of a person."

## Attribution Types

### 1. 👤 Self Attribution (Default)

- Notes are attributed to the user themselves
- Displays the user's email or display name
- This is the default behavior for backward compatibility

### 2. 👥 Other Person Attribution

- Notes can be attributed to another person
- User enters the name of the person
- Useful for citing sources or attributing quotes

### 3. 🎭 Pseudonym Attribution

- Notes can be attributed to a pseudonym
- User enters the pseudonym name
- Optional reveal toggle to show it's a pseudonym
- When revealed: displays as "PseudonymName (pseudonimo)"
- When hidden: displays as just "PseudonymName"

### 4. ✍️ Eteronym Attribution

- Notes can be attributed to an eteronym (literary alias)
- User enters the eteronym name
- Optional reveal toggle to show it's an eteronym
- When revealed: displays as "EteronymName (eteronimo)"
- When hidden: displays as just "EteronymName"

### 5. ❓ Anonymous Attribution

- Notes are completely anonymous
- Displays as "Anonimo"
- No user identification shown

## User Interface

### Creating Notes

1. **Attribution Section**: Appears in the note creation form (NewNoteForm)
2. **Radio Button Selection**: Choose attribution type
3. **Name Input**: For other/pseudonym/eteronym types
4. **Reveal Toggle**: For pseudonym/eteronym to control visibility

### Viewing Notes

1. **Note Cards**: Display attribution in the author field
2. **Note Detail Page**: Shows current attribution in read-only mode
3. **Consistent Display**: Attribution format is consistent across all views

### Editing Notes

1. **Edit Mode**: Attribution can be changed when editing notes
2. **Full Control**: All attribution options available during editing
3. **Persistence**: Attribution changes are saved with the note

## Technical Implementation

### Data Structure

```javascript
{
  attribution: {
    type: "self" | "other" | "pseudonym" | "eteronym" | "anonymous",
    name: "string", // Required for other/pseudonym/eteronym
    revealPseudonym: boolean // For pseudonym/eteronym reveal option
  }
}
```

### Components Modified

- **NewNoteForm.jsx**: Added attribution selection interface
- **NoteCard.jsx**: Added attribution display logic
- **Note.jsx**: Added attribution editing and display
- **Home.jsx**: Updated note creation to handle attribution
- **Community.jsx**: Updated shared note creation to handle attribution

### Styling

- **Attribution section**: Distinct visual styling with borders and background
- **Radio buttons**: Accessible with emoji icons
- **Reveal option**: Highlighted with warning-style colors
- **Responsive design**: Works on mobile and desktop

## Backward Compatibility

- **Existing Notes**: Notes without attribution data default to "self" attribution
- **Migration**: No database migration required
- **Fallback**: Robust fallback logic for missing attribution data

## Security Considerations

- **User Control**: Only note authors can edit attribution
- **Data Validation**: Client-side validation for required fields
- **Firebase Rules**: Server-side validation should be added for production

## Future Enhancements

1. **Saved Pseudonyms**: Remember user's pseudonyms for quick selection
2. **Eteronym Profiles**: Rich profiles for literary eteronyms
3. **Attribution History**: Track attribution changes over time
4. **Bulk Attribution**: Change attribution for multiple notes at once
5. **Public Attribution Directory**: Browse notes by attribution type
