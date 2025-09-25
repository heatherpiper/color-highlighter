# Changelog

## 0.7.1

- Updated the regex for HSL and HSLA colors to correctly highlight values with decimal points.

## 0.7.0

- **New feature**: You can now override the default highlight style on a per-note basis by specifying a `highlightStyle` in a note's frontmatter (properties).
- A note's `highlightStyle` property can also be set by selecting the command **Color Highlighter: Set highlight style for this note** in the command palette and then choosing a highlight style from the dropdown menu.
- **Style fixes**:
  - Fixed an issue with the contrast border for background style highlights displaying with a gap.
  - Fixed an issue where color codes styled as strikethroughs appeared to have a gap on either side of them.

## 0.6.0

- **New settings**:
  - You can now adjust the vertical padding, horizontal padding, and border radius of background style highlights.
  - You can now adjust the border thickness and border radius or border style highlights.
  - You can now adjust the border radius of square style highlights and choose the position of square, either before or after the color code text.
  - You can now adjust the thickness of underline style highlights.
- Fixed strikethrough formatting applying to square style highlights.
- Refactored `highlightStyle` to use TypeScript enum rather than string literals for type safety.

## 0.5.2

- **New setting**: If you use the square style highlight, you can now choose to scale the size of the square with the text size. If this setting is disabled, the square will always be a fixed 10 x 10 pixels.
- The cursor color (`--caret-color`) now matches the text color for background highlights to ensure it has the appropriate contrast to be visible within all highlight colors.
- Changes made in settings are now instantly reflected in open notes without needing to reload them.
- Tags are now excluded from highlighting in all viewing modes, both inline and in yaml frontmatter.
- Migrated all style assignment to use CSS stylesheet instead of assigning styles in JavaScript.
- Refactored `editorExtension` for improved modularity.

## 0.5.1

- Fixed the color picker hover area not extending to square highlights in headings.
- Improved target element detection for hover events.
- Color regex is now case insensitive.
- Reverted square highlights back to a 10 x 10 pixel square (previously was 1em x 1em, which scaled with text)
- Fixed colors being blended with the editor background color only if they have an alpha channel.
- Moved styles to a separate styles.css file.
- Removed casting to any.
- Removed uses of innerHTML.
-Implemented custom types for color components and color strings.

## 0.5.0

- **New setting**: Use contrasting border for low-contrast highlights.
  - This adds a faint border around highlights if there is not sufficient contrast between the highlight color and the editor's background color.
  - This setting applies to the 'background' and 'square' highlight styles.
- Fixed a bug which caused highlights to not work inside code blocks in Reading Mode if there was a language specified. Highlights within code blocks should now work consistently in all viewing modes.
- When the square highlight style is chosen, the hover area to show the color picker now extends to the square itself.
- Small adjustments to highlight styles for cohesiveness.

## 0.4.0

- **New feature**: A color picker tool now appears when you hover over a highlighted color code (can be disabled in the settings).
  - The color picker can also be displayed by selecting the command **Color Highlighter: Show color picker** in the command palette. This command will work whether the hover behavior is enabled or not.
- Updated wording and overall structure of the settings page for improved clarity.
- The hash symbol in hex colors is now excluded from highlights in Source Mode. This solves a rendering issue caused by the use of escape characters before the hash symbol.
- Improved code documentation and small optimizations.

## 0.3.0

- Major reorganization of the entire codebase for better modularity.
- Updates to configuration files and the build process.
- Introduction of a configuration object for regex patterns for easier color code pattern maintenance going forward.

## 0.2.6

- Code optimization:
  - Removed unused leftover methods.
  - Better handling of null values.
- Fixed an issue where the true background color was not being properly retrieved.

## 0.2.5

- Fix background color not being processed properly, resulting in an error.
- Improved error handling.
- Small tweaks and optimizations.

## 0.2.4

- Fixes Dataview inline queries inadvertently displaying on a new line.
- Fixes callout icons disappearing when Color Highlighter is enabled.
- Improves performance by reducing DOM manipulations.

## 0.2.3

- Fixes highlighting and text contrast adjustments for 8-digit hex codes.
- Fixes highlighting and text contrast adjustments for 3- and 4-digit hex codes.  
- Fixes certain highlighting styles not working in some view modes.

## 0.2.2

- Bug fixes

## 0.2.1

- Short-form HEX color codes (with three or four digits) are now supported.
- Eight-digit HEX color codes are now supported.
- Fixes certain highlight styles having excess padding.
- Fixes monospace font being incorrectly applied to any highlighted color code.
- Other minor fixes and adjustments.

## 0.2.0

- Adds three new highlight styles: Border, Colored Square, and Underline.
- Adds support for HSLA formatted colors.
- Minor bug fixes.

## 0.1.1

- HSLA formatted colors are now supported.
- RGBA formatted colors now have their text contrast adjusted properly in Live Preview and Reading modes.

## 0.1.0 (Initial release)

- Color highlighting implemented for HEX, RGB, RGBA, and HSL color formats.
- Customize highlight locations.
- Automatic contrast adjustment for readability.
