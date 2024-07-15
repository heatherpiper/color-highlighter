# Color Highlighter

## Overview

Automatically detect and highlight color codes in your notes.

![Color Highlighter in Obsidian](images/example.png)

Color Highlighter provides a visual representation of colors directly in your text, making it easier to work with color-related information. Customizable options allow you to control where and how your highlights appear.

> [!NOTE]
> This plugin is currently in beta. Please report any issues or leave feedback to help improve it.

## Features

- Automatically detects and highlights color codes in various formats
    - HEX
        - #RGB
        - #RGBA
        - #RRGGBB
        - #RRGGBBAA 
    - RGB and RBGA
    - HSL and HSLA
- Customize where colors are highlighted:
    - Everywhere
    - Within inline code (single backticks)
    - Within code blocks (triple backticks)
- Customize highlighting style:
    - Background color
    - Border
    - Square
    - Underline
- Works in Source Mode, Reading Mode, and Live Preview
- Automatically adjusts text color for optimal contrast with highlighted background
- Optionally shows a color picker tool when hovering over highlighted color codes

## Installation

### Install manually

As this plugin is currently in beta, it's not yet available in the Obsidian community plugins browser. 

To install:

1. Download the [latest release](https://github.com/heatherpiper/color-highlighter/releases) files (`main.js` and `manifest.json`).
2. Create a new folder inside your Obsidian vault's plugin directory at `.obsidian/plugins/color-highlighter`.
3. Move the downloaded files into the new directory.
4. Reload Obsidian.
5. Go to **Settings → Community plugins** and enable Color Highlighter.

### Install using BRAT

BRAT (Beta Reviewers Auto-update Tool) is a community plugin that makes it easier to review and test new plugins and themes that are still in beta. Updates are downloaded automatically without the need for the user to manually change any files. 

To install using BRAT:

1. Make sure you have installed and enabled the BRAT plugin from the Obsidian community plugins browser.
2. Copy this link: `https://github.com/heatherpiper/color-highlighter`
3. Open the command palette and select the command **BRAT: Add a beta plugin for testing**.
4. Paste the link into the pop-up modal and select **Add Plugin**.
5. After BRAT confirms the installation, go to **Settings → Community plugins** and enable Color Highlighter. You made need to first refresh the list of plugins.

## Usage

Once installed and enabled, the plugin will automatically highlight color codes based on your settings. To configure the plugin:

1. Go to **Settings → Community plugins**.
2. Find Color Highlighter in the list and select the gear icon to access its settings.
3. Choose your preferred highlight location(s):
   - **Highlight everywhere**: Highlight all color codes anywhere in your notes.
   - **Highlight only in code**:
       - **Highlight in inline code**: Only highlight color codes within single backticks.
       - **Highlight in code blocks**: Only highlight color codes within triple backticks.
4. Choose your preferred highlight style:
   - **Background**: Highlight color codes by changing their background color
   - **Border**: Highlight color codes by adding a solid color border
   - **Square**: Highlight color codes by adding a small colored square following the color code
   - **Underline**: Highlight color codes by adding a solid color underline

![Color Highlighter highlight styles](images/highlighting-styles.png)

5. By default, the color picker is displayed when hovering over highlighted color codes. You may choose to disable this behavior.
    - If disabled, the color picker can still be displayed using the command **Color Highlighter: Show color picker** in the command palette.

> [!NOTE]
> After changing any of these settings, you may need to reload any open notes in order to see the changes take effect.

## Feedback and Contributions

As this plugin is in beta, your feedback is crucial! If you encounter any issues or have suggestions for improvements:

1. Check the [GitHub issues](https://github.com/heatherpiper/color-highlighter/issues) to see if it has already been reported.
2. If not, please open a new issue with as much detail as possible.

Contributions are welcome! Feel free to fork the repository and submit pull requests.

## License

[MIT License](LICENSE)
