# Generic Editor Implementation Guide

## Overview

A flexible, reusable editor system has been implemented for Docmost, allowing editors to be easily used across different contexts with configurable features.

## Architecture

```
BaseEditor (Generic Component)
├── Preset System (minimal, basic, full, title, readonly)
├── Plugin System (collaboration, comments, uploads, menus)
└── Event System (onCreate, onUpdate, onSave, etc.)

Implementations:
├── PageEditor (existing - full collaborative editor)
├── SpaceDescriptionEditor (new - basic rich text)
└── Custom editors (easy to create)
```

## Files Created

### Core Editor System

- `apps/client/src/features/editor/base-editor.tsx` - Generic editor component
- `apps/client/src/features/editor/plugins/types.ts` - Plugin type definitions
- `apps/client/src/features/editor/presets/editor-presets.ts` - 5 preset configurations
- `apps/client/src/features/editor/presets/extension-builder.ts` - Extension factory

### Plugin System

- `apps/client/src/features/editor/plugins/collaboration-plugin.tsx` - Y.js/Hocuspocus integration
- `apps/client/src/features/editor/plugins/upload-plugin.tsx` - Abstracted upload handlers
- `apps/client/src/features/editor/plugins/comments-plugin.tsx` - Optional comments
- `apps/client/src/features/editor/plugins/menu-plugin.tsx` - Conditional menus
- `apps/client/src/features/editor/plugins/index.ts` - Plugin exports

### Utilities

- `apps/client/src/features/editor/utils/upload-factory.ts` - Upload handler creation
- `apps/client/src/features/editor/utils/text-conversion.ts` - Plain text <-> TipTap JSON

### Example Implementation

- `apps/client/src/features/space/components/space-description-editor.tsx` - Working example

### Backup

- `apps/client/src/features/editor/page-editor-original-backup.tsx` - Original PageEditor backup
- `apps/client/src/features/editor/page-editor-new.tsx` - Example PageEditor wrapper (not active)

## Available Presets

### 1. Minimal

**Use case:** Simple text input fields
**Features:** Plain text only, no formatting

```typescript
<BaseEditor preset="minimal" placeholder="Enter text..." />
```

### 2. Basic

**Use case:** Space descriptions, user bios, simple rich text
**Features:** Bold, italic, headings, lists, links, basic formatting

```typescript
<BaseEditor
  preset="basic"
  value={text}
  onChange={(content) => setText(content)}
/>
```

### 3. Full

**Use case:** Full page editing (PageEditor)
**Features:** All 40+ extensions, tables, images, code, math, diagrams

```typescript
<BaseEditor
  preset="full"
  collaboration={{ documentName: 'doc-1', user }}
  uploads={{ onUpload: uploadFn }}
  menus={{ bubble: true, table: true }}
/>
```

### 4. Title

**Use case:** Page titles
**Features:** Heading 1 only, no other formatting

```typescript
<BaseEditor preset="title" placeholder="Untitled" />
```

### 5. Readonly

**Use case:** Viewing pages, history
**Features:** All extensions but not editable

```typescript
<BaseEditor preset="readonly" content={content} editable={false} />
```

## Plugin Configuration

### Collaboration

```typescript
collaboration={{
  documentName: `page.${pageId}`,
  user: currentUser,
  token: authToken,
  onConnectionStatus: (status) => console.log(status)
}}
```

### Comments

```typescript
comments={{
  enabled: true,
  pageId: pageId,
  onCommentClick: (commentId) => handleComment(commentId)
}}
```

### Uploads

```typescript
uploads={{
  onUpload: (file, context) => uploadFile(file, context),
  context: { pageId, userId },  // Any context
  enableImages: true,
  enableVideos: true,
  enableAttachments: true
}}
```

### Menus

```typescript
menus={{
  bubble: true,      // Text formatting menu
  table: true,       // Table menus
  image: true,       // Image menu
  video: true,       // Video menu
  callout: true,     // Callout menu
  link: true,        // Link menu
  subpages: true,    // Subpages menu
  excalidraw: true,  // Excalidraw menu
  drawio: true       // Drawio menu
}}
```

## Usage Examples

### Space Description Editor (Working Example)

```typescript
import SpaceDescriptionEditor from "@/features/space/components/space-description-editor";

// With plain text (form integration)
<SpaceDescriptionEditor
  value={form.values.description}
  onChange={(text) => form.setFieldValue('description', text)}
  placeholder="Describe your space..."
/>
```

### Custom Simple Editor

```typescript
import { BaseEditor } from "@/features/editor/base-editor";

<BaseEditor
  preset="basic"
  defaultContent={initialText}
  onUpdate={(content) => saveContent(content)}
  collaboration={false}  // No real-time collab
  uploads={false}        // No file uploads
  menus={{ bubble: true }}  // Just text formatting
/>
```

### Full-Featured Editor (Like PageEditor)

```typescript
import { BaseEditor } from "@/features/editor/base-editor";

<BaseEditor
  preset="full"
  content={pageContent}
  collaboration={{
    documentName: `page.${pageId}`,
    user: currentUser,
    token: authToken
  }}
  uploads={{
    onUpload: (file) => uploadToPage(file, pageId),
    context: pageId
  }}
  comments={{ enabled: true, pageId }}
  menus={{ bubble: true, table: true, image: true }}
  onCreate={(editor) => {
    editor.storage.pageId = pageId;
  }}
  onUpdate={(content) => {
    updatePageCache(content);
  }}
/>
```

## How to Integrate into Existing Forms

### Option 1: Replace Textarea (recommended for new forms)

```typescript
// Before:
<Textarea
  label="Description"
  {...form.getInputProps("description")}
/>

// After:
<SpaceDescriptionEditor
  value={form.values.description}
  onChange={(text) => form.setFieldValue('description', text)}
/>
```

### Option 2: Use with JSON storage (when backend supports it)

```typescript
<SpaceDescriptionEditor
  initialContent={space.descriptionJSON}
  onSave={(content) => updateSpace({ descriptionJSON: content })}
/>
```

## Benefits

### For Developers

- ✅ **Reusable** - One component for multiple use cases
- ✅ **Flexible** - Mix and match features via props
- ✅ **Type-safe** - Strong TypeScript support
- ✅ **Maintainable** - Changes in one place
- ✅ **Testable** - Isolated feature testing

### For Users

- ✅ **Consistent** - Same editing experience everywhere
- ✅ **Powerful** - Rich text where needed
- ✅ **Simple** - Plain text where appropriate
- ✅ **Fast** - Only loads needed features

## Migration Strategy

### Phase 1: ✅ Complete

- BaseEditor infrastructure created
- Plugin system implemented
- SpaceDescriptionEditor example built
- Text conversion utilities added

### Phase 2: Safe Adoption (Current)

- Use SpaceDescriptionEditor for new features
- Keep existing PageEditor as-is (tested, stable)
- Gradually adopt BaseEditor in other places

### Phase 3: Future (Optional)

- Refactor PageEditor to use BaseEditor
- Add more presets as needed
- Optimize bundle size with code splitting

## Testing

### Manual Testing

1. Create a test page with SpaceDescriptionEditor
2. Test basic formatting (bold, italic, lists, links)
3. Verify form integration (value/onChange)
4. Test in different contexts (create/edit forms)

### Unit Testing

```typescript
import { render } from '@testing-library/react';
import { BaseEditor } from '@/features/editor/base-editor';

test('renders with minimal preset', () => {
  render(<BaseEditor preset="minimal" />);
});
```

## Troubleshooting

### Issue: Editor not showing

- Check that all imports are correct
- Verify preset exists
- Ensure BaseEditor styles are imported

### Issue: Collaboration not working

- Verify collaboration config is provided
- Check token is valid
- Ensure user object is complete

### Issue: Uploads not working

- Verify uploads config is provided
- Check onUpload function signature
- Ensure context is passed correctly

## Future Enhancements

- [ ] Lazy loading for heavy extensions
- [ ] More presets (markdown, code-only)
- [ ] Editor themes/styling system
- [ ] Per-user extension preferences
- [ ] Mobile optimizations
- [ ] Accessibility improvements

## Questions?

See the implementation files for detailed code examples and comments.

Key files:

- [base-editor.tsx](apps/client/src/features/editor/base-editor.tsx) - Main component
- [space-description-editor.tsx](apps/client/src/features/space/components/space-description-editor.tsx) - Working example
- [editor-presets.ts](apps/client/src/features/editor/presets/editor-presets.ts) - Available presets
