# Presentation Quick Start Guide

## 🎯 What You Have

A fully functional web-based presentation system at `/presentation` with:
- 23-25 slides covering your entire portfolio
- Professional 16:9 format
- Dark theme with cyan accents
- Keyboard navigation and fullscreen mode
- Interactive elements and smooth animations

## 🚀 Start Presenting Right Now

### 1. Open the Presentation
```bash
# Dev server should already be running
# If not, start it:
npm run dev

# Open in browser:
http://localhost:4321/presentation
```

### 2. Enter Fullscreen
Press **F** key (or click fullscreen button if browser shows one)

### 3. Navigate
- **Arrow keys** (left/right/up/down) to move between slides
- **Space bar** to advance to next slide
- **N key** to toggle navigation dock (for jumping to sections)

### 4. Present!
You're ready to share your screen and walk through your work.

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Key | Action |
|-----|--------|
| **→** or **Space** | Next slide |
| **←** | Previous slide |
| **F** | Toggle fullscreen |
| **N** | Show/hide navigation dock |
| **ESC** | Exit fullscreen |

## 📋 Slide Structure Reference

### Section 1: Opening (Slide 0)
- Spinning logo on black background

### Section 2: Foundation (Slides 1-4)
- Slide 1: Who I Am (with portrait)
- Slide 2: My Superpower (design → code → product)
- Slide 3: Core Capabilities (6-item grid)
- Slide 4: How I Solve Problems (5-stage process)

### Section 3: Case Studies (Slides 5-19)

**Banking Suite (Slides 5-9)**
- Context & Challenge
- Approach & Process
- Solution
- Impact
- Visual Showcase

**Design Community (Slides 10-14)**
- Context & Challenge
- Approach & Process
- Solution
- Impact
- Visual Showcase

**Project 3 (Slides 15-19)** - *Placeholder - Add your content*
- Ready for your third case study

### Section 4: Honorable Mentions (Slide 20)
- 6 additional projects in grid

### Section 5: Closing (Slides 21-22)
- What I'm Looking For
- Let's Connect

## 📝 What Needs Your Attention

### Priority 1: Add Third Case Study
File: `src/data/presentation-content.ts`

Replace the `caseStudies.project3` section with your actual project:
```typescript
project3: {
  title: "Your Project Name",
  subtitle: "Context",
  context: { /* your details */ },
  approach: { /* your process */ },
  solution: { /* your solution */ },
  impact: { /* your results */ },
  images: [/* your image paths */]
}
```

### Priority 2: Review & Update Content
Check `src/data/presentation-content.ts` for:
- Ensure all metrics are accurate
- Verify dates and durations
- Update any text that doesn't sound right
- Remove any mdashes (use commas or periods instead)

### Priority 3: Test Everything
- [ ] Click through all slides
- [ ] Verify all images load
- [ ] Test fullscreen mode
- [ ] Try navigation dock (N key)
- [ ] Practice your talking points

## 🎨 Customizing Content

All content lives in one file: `src/data/presentation-content.ts`

### Update Personal Info
```typescript
foundation: {
  whoIAm: {
    name: "Your Name",
    title: "Your Title",
    descriptors: ["Item 1", "Item 2"]
  }
}
```

### Modify Capabilities
```typescript
capabilities: [
  {
    title: "Capability Name",
    description: "Description",
    icon: "code" // or "layers", "zap", "rocket", "users", "database"
  }
]
```

### Update Contact Info
```typescript
closing: {
  contact: {
    email: "your@email.com",
    linkedin: "linkedin.com/in/yourprofile",
    portfolio: "yoursite.com"
  }
}
```

## 🎬 Presentation Tips

### Before You Present
1. Close unnecessary browser tabs
2. Turn on Do Not Disturb mode
3. Hide desktop icons if sharing full screen
4. Test your microphone/audio
5. Have a glass of water nearby

### During Presentation
- Use the **N key** to jump between sections if needed
- Press **F** to exit fullscreen if you need to show something else
- Don't rush - let visuals breathe
- Speak to the narrative, not just read the slides

### For Screen Sharing
- Share "Entire Screen" (not just browser window) for best quality
- Or share "Browser Window" if you prefer
- Make sure fullscreen mode works with your screen sharing app

## 🐛 Troubleshooting

### Images Not Showing
Check paths in `src/data/presentation-content.ts` - they should start with `/images/`

### Navigation Dock Not Working
Press **N** to toggle visibility. If still not working, check browser console (F12)

### Slides Won't Advance
Try clicking on the slide first, then use arrow keys

### Fullscreen Not Working
Some browsers require user gesture. Try pressing F while cursor is over the slide area

## 📦 Export to PDF (Optional)

To create a PDF backup:
1. Open `http://localhost:4321/presentation?print-pdf`
2. Press Ctrl/Cmd + P (Print)
3. Choose "Save as PDF"
4. Settings: Landscape, no margins

## 🔧 For Developers

### File Structure
```
src/
├── pages/presentation.astro          # Main page
├── components/Presentation/          # React components
├── data/presentation-content.ts      # All content
└── styles/presentation.css           # Styling
```

### Making Layout Changes
Edit `src/pages/presentation.astro` - look for the specific slide section you want to modify

### Adding New Slides
1. Add section in `<div class="slides">` in presentation.astro
2. Update navigation dock slide numbers if needed
3. Follow existing patterns for consistency

## 📚 Full Documentation

For detailed information, see:
- `PRESENTATION_README.md` - Complete technical documentation
- `PRESENTATION_IMPLEMENTATION_SUMMARY.md` - What was built

## ✅ Ready to Deploy

When you're happy with everything:
```bash
npm run build
```

The presentation will be included in your production build at `/presentation`

---

**Current Status**: ✅ Ready to use
**Branch**: `feature/presentation-system`
**Next Step**: Review content and practice presenting!

**Need Help?** Check the README files or review the code comments in the files.
