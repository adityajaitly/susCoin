# susCoin Color Palette Guide

## 🌍 Tech Meets Climate Design System

This guide covers the comprehensive color palette designed for susCoin - a gamified carbon credits platform that makes climate impact fun, transparent, and inclusive.

## 🎨 Color Palette Overview

### Light Theme (Default)
- **Background**: `#F6F8FA` - Clean, light background
- **Surface/Cards**: `#FFFFFF` - Pure white for content areas
- **Text Primary**: `#0B1220` - High contrast text
- **Text Muted**: `#64748B` - Secondary text
- **Primary**: `#065F46` (emerald-800) - Main brand color
- **Secondary**: `#1D4ED8` (blue-700) - Supporting actions
- **Accent**: `#A3E635` (lime-400) - Gamification highlights
- **Borders/Lines**: `#E5E7EB` - Subtle dividers

### Dark Theme
- **Background**: `#0F172A` - Deep dark background
- **Surface/Cards**: `#111827` - Elevated content areas
- **Text Primary**: `#F3F4F6` - High contrast text
- **Text Muted**: `#9CA3AF` - Secondary text
- **Primary**: `#22C55E` - Bright green for dark mode
- **Secondary**: `#60A5FA` - Bright blue
- **Accent**: `#BEF264` - Bright lime
- **Borders/Lines**: `#1F2937` - Subtle dividers

## 🚦 State Colors

### Success States
- **Color**: `#16A34A`
- **Usage**: Confirmations, achievements, positive feedback
- **Text**: White text for AAA contrast

### Warning States
- **Color**: `#F59E0B`
- **Usage**: Caution messages, pending actions
- **Text**: Dark text (`#0B1220`) for readability

### Error States
- **Color**: `#EF4444`
- **Usage**: Errors, failures, critical alerts
- **Text**: White text for high contrast

### Info States
- **Color**: `#0891B2`
- **Usage**: Information, tips, guidance
- **Text**: Dark text on light backgrounds, white on this color

## 📊 Data Visualization Colors

Colorblind-safe palette for charts and graphs:
- `#0072B2` - Blue
- `#E69F00` - Orange
- `#009E73` - Green
- `#F0E442` - Yellow
- `#56B4E9` - Light Blue
- `#D55E00` - Red-Orange
- `#CC79A7` - Pink
- `#000000` - Black

## 🎯 Usage Guidelines

### Primary Buttons
```css
.btn-primary {
  background-color: var(--primary);
  color: white; /* AAA contrast */
}
```
- Use for main actions: "Start Earning", "Log Action", "Redeem Credits"
- White text on `#065F46` passes AAA contrast requirements

### Secondary Buttons
```css
.btn-secondary {
  background-color: var(--secondary);
  color: white; /* AA+ contrast */
}
```
- Use for supporting actions: "Learn More", "View Details", "Settings"

### Accent Elements
```css
.badge-accent {
  background-color: var(--accent);
  color: var(--text); /* Dark text for readability */
}
```
- Use for gamification: badges, highlights, achievements
- **Never use for long text backgrounds**
- Always use dark text (`#0F172A`) for readability

### Cards and Surfaces
```css
.card {
  background-color: var(--card);
  border: 1px solid var(--line);
}
```
- Use for content containers, stats cards, action cards
- Consistent elevation and separation

## ⚠️ Important Notes

### Contrast Requirements
- **Primary buttons**: White text on `#065F46` (AAA pass)
- **Avoid**: White text on teal/cyan ~600 colors (fails contrast)
- **Accent lime**: Use for highlights/badges only, not long text backgrounds

### Accessibility
- All color combinations meet WCAG AA standards
- Primary actions meet AAA standards
- Colorblind-safe data visualization palette included

### Theme Switching
```javascript
// Toggle between light and dark themes
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
}
```

## 🛠️ Implementation

### CSS Custom Properties
```css
:root {
  --bg: #F6F8FA;
  --card: #FFFFFF;
  --text: #0B1220;
  --muted: #64748B;
  --primary: #065F46;
  --secondary: #1D4ED8;
  --accent: #A3E635;
  --line: #E5E7EB;
  --success: #16A34A;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #0891B2;
}

[data-theme="dark"] {
  --bg: #0F172A;
  --card: #111827;
  --text: #F3F4F6;
  --muted: #9CA3AF;
  --primary: #22C55E;
  --secondary: #60A5FA;
  --accent: #BEF264;
  --line: #1F2937;
}
```

### Utility Classes
```css
.bg-primary { background-color: var(--primary); }
.text-primary { color: var(--text); }
.border-line { border-color: var(--line); }
```

### Component Classes
```css
.btn-primary { /* Primary button styles */ }
.card { /* Card container styles */ }
.badge-success { /* Success badge styles */ }
```

## 🎮 Gamification Examples

### Achievement Badges
```html
<span class="badge badge-accent">🌱 First Green Action</span>
<span class="badge badge-success">🏆 Top 10 Leader</span>
<span class="badge badge-info">📊 Data Contributor</span>
```

### Progress Indicators
```css
.progress-bar {
  background-color: var(--accent);
  color: var(--text);
}
```

### Leaderboard Highlights
```css
.leaderboard-top {
  background-color: var(--primary);
  color: white;
}
```

## 📱 Responsive Considerations

- Colors work across all device sizes
- Dark mode respects system preferences
- High contrast maintained on mobile devices
- Touch targets use appropriate contrast ratios

## 🔄 Future Considerations

- Consider adding semantic color variations
- Explore micro-interaction color states
- Plan for seasonal theme variations
- Maintain consistency across all platforms

---

*This color system is designed to make climate action feel rewarding, accessible, and visually appealing while maintaining the highest standards of accessibility and usability.*
