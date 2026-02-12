# Icon Placeholder

## 🎨 Extension Icons

The extension requires three icon sizes:
- **16x16**: Toolbar icon
- **48x48**: Extension management page
- **128x128**: Chrome Web Store

### Creating Icons

You can create icons using:

1. **Online Tools**:
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/

2. **Design Software**:
   - Adobe Illustrator
   - Figma
   - Canva

3. **Icon Libraries**:
   - https://www.flaticon.com/
   - https://icons8.com/

### Suggested Design

**Theme**: Security & Government
- **Colors**: Blue (#667eea), Purple (#764ba2), Gold (accent)
- **Symbol**: Shield with document or lock
- **Style**: Modern, professional, trustworthy

### File Names
- icon16.png
- icon48.png
- icon128.png

### Quick Generation

For development, you can use a free icon generator:

```bash
# Example using ImageMagick (if installed):
convert -size 128x128 xc:#667eea -fill white -pointsize 72 -gravity center -annotate +0+0 "E" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

Or use an online service like:
- https://favicon.io/favicon-generator/

### Installation

Once created, place the icon files in:
```
/app/enibandhan-extension/icons/
├── icon16.png
├── icon48.png
└── icon128.png
```