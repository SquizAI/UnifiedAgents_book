# Diagram Style Guide and Templates

This guide establishes consistent standards for all visual elements throughout "Unified Agentic Systems: The Ultimate Guide to AI-Driven Tool Integration."

## Color Palette

### Primary Colors
- Dark Blue (#1A365D) - Main components, primary flow
- Teal (#2A9D8F) - User interactions, input/output
- Orange (#E76F51) - Highlighting, important elements
- Gray (#6C757D) - Secondary elements, background

### Secondary Colors
- Light Blue (#457B9D) - Supporting elements
- Green (#52B788) - Success paths, confirmations
- Red (#E63946) - Error handling, warnings
- Purple (#7209B7) - AI/LLM components

## Typography

- **Component Labels**: Sans-serif, bold, 14pt
- **Flow Labels**: Sans-serif, regular, 12pt
- **Annotations**: Sans-serif, italic, 10pt
- **Code Snippets**: Monospace, regular, 10pt

## Diagram Types and Templates

### 1. System Architecture Diagrams

Used for high-level system organization and component relationships.

**Components:**
- Rectangular boxes for system components
- Rounded rectangles for external systems
- Solid arrows for data flow
- Dashed arrows for control flow

**Example Structure:**
```
┌────────────────┐      ┌────────────────┐
│                │      │                │
│  Component A   ├─────►│  Component B   │
│                │      │                │
└────────────────┘      └────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌────────────────┐      ┌────────────────┐
│                │      │                │
│  Component C   │◄─ ─ ─│  Component D   │
│                │      │                │
└────────────────┘      └────────────────┘
```

### 2. Sequence Diagrams

Used for temporal interactions between components.

**Components:**
- Vertical lifelines for components
- Horizontal arrows for messages
- Rectangular boxes for activation periods

**Example Structure:**
```
    Component A        Component B        Component C
        │                   │                  │
        │──────Request─────►│                  │
        │                   │                  │
        │                   │───Process Data───►
        │                   │                  │
        │                   │◄─────Response────│
        │                   │                  │
        │◄───────Reply──────│                  │
        │                   │                  │
```

### 3. Flowcharts

Used for decision processes and operation sequences.

**Components:**
- Rectangles for processes
- Diamonds for decisions
- Ovals for start/end
- Arrows for flow direction

**Example Structure:**
```
        ┌─────────┐
        │  Start  │
        └────┬────┘
             │
        ┌────▼────┐
        │ Process │
        └────┬────┘
             │
        ┌────▼────┐
        │Decision?│
        └────┬────┘
      ┌──────┴──────┐
      │             │
┌─────▼────┐   ┌────▼─────┐
│ Option A │   │ Option B │
└─────┬────┘   └────┬─────┘
      │             │
      └──────┬──────┘
             │
        ┌────▼────┐
        │   End   │
        └─────────┘
```

### 4. Entity Relationship Diagrams

Used for data models and relationships.

**Components:**
- Rectangles for entities
- Diamond shapes for relationships
- Lines with appropriate notation for cardinality

**Example Structure:**
```
┌──────────┐       ┌───────────────┐       ┌──────────┐
│          │       │               │       │          │
│  Entity A│───┬───│ Relationship  │───┬───│ Entity B │
│          │   │   │               │   │   │          │
└──────────┘   │   └───────────────┘   │   └──────────┘
               │                        │
               │ 1..*                   │ 0..*
               ▼                        ▼
```

## Layout Guidelines

1. **Reading Flow**: Diagrams should follow left-to-right and top-to-bottom reading patterns
2. **Whitespace**: Maintain consistent spacing between elements (minimum 20px)
3. **Alignment**: Align related elements for visual clarity
4. **Grouping**: Use subtle background shading to group related components
5. **Labeling**: All components should be clearly labeled
6. **Legend**: Include legends for complex diagrams

## File Formats

- Source files: Draw.io (XML) or Figma
- Export formats: SVG (preferred), PNG (300dpi minimum)
- Naming convention: `chapter_[number]_[diagram_type]_[description].svg`

## Accessibility Considerations

1. Color should not be the only means of conveying information
2. Maintain sufficient contrast ratios (4.5:1 minimum)
3. Include descriptive alt text for all diagrams
4. Consider colorblind-friendly palettes

---

*This style guide will be applied to all diagrams throughout the book to ensure visual consistency and professional presentation.*
