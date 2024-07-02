/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ColorHighlighterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");

// settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  highlightEverywhere: true,
  highlightInBackticks: false,
  highlightInCodeblocks: false,
  highlightStyle: "background"
};
var ColorHighlighterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const descEl = containerEl.createEl("p", {
      text: "NOTE: After changing any of these settings, you may need to reload any open notes in order to see the changes.",
      cls: "setting-item-description"
    });
    new import_obsidian.Setting(containerEl).setName("Highlight everywhere").setDesc("Highlight color codes everywhere in notes").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.highlightEverywhere).onChange(async (value) => {
        this.plugin.settings.highlightEverywhere = value;
        if (value) {
          this.plugin.settings.highlightInBackticks = false;
          this.plugin.settings.highlightInCodeblocks = false;
        }
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Highlight in inline code").setDesc("Highlight color codes within inline code (single backticks)").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.highlightInBackticks).onChange(async (value) => {
        this.plugin.settings.highlightInBackticks = value;
        if (value) {
          this.plugin.settings.highlightEverywhere = false;
        }
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Highlight in codeblocks").setDesc("Highlight color codes within codeblocks (triple backticks)").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.highlightInCodeblocks).onChange(async (value) => {
        this.plugin.settings.highlightInCodeblocks = value;
        if (value) {
          this.plugin.settings.highlightEverywhere = false;
        }
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Highlight style").setDesc("Choose how to highlight color codes").addDropdown(
      (dropdown) => dropdown.addOption("background", "Background color").addOption("border", "Border").addOption("square", "Colored square").addOption("underline", "Underline").setValue(this.plugin.settings.highlightStyle).onChange(async (value) => {
        this.plugin.settings.highlightStyle = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// main.ts
var import_language = require("@codemirror/language");
var COLOR_REGEX = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/g;
var ColorHighlighterPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.namedColors = {
      white: "#FFFFFF",
      black: "#000000"
    };
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ColorHighlighterSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
    this.registerEditorExtension(this.createEditorExtension());
    this.addStyles();
  }
  addStyles() {
    const styles = `
            .color-highlighter {
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }
            .color-highlighter.background {
                border-radius: 3px;
                padding: 0.1em 0.2em;
            }
            .color-highlighter.border {
                border-radius: 3px;
                border-width: 2px;
                border-style: solid;
                padding: 0 2px;
            }
            .color-highlighter.underline {
                text-decoration: none !important;
                border-bottom-width: 2px;
                border-bottom-style: solid;
                padding-bottom: 1px;
            }
            .color-highlighter.underline::before,
            .color-highlighter.underline::after {
                content: "";
                position: absolute;
                bottom: -2px;
                width: 0;
                height: 2px;
                background-color: inherit;
            }
            .color-highlighter.underline::before {
                left: 0;
            }
            .color-highlighter.underline::after {
                right: 0;
            }
            .color-highlighter-square {
                display: inline-block;
                width: 10px;
                height: 10px;
                margin-left: 2px;
                vertical-align: middle;
            }
        `;
    this.registerMarkdownPostProcessor((el) => {
      el.createEl("style", { text: styles });
    });
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.app.workspace.updateOptions();
  }
  createEditorExtension() {
    const plugin = this;
    return import_view.ViewPlugin.fromClass(
      class ColorHighlighterView {
        constructor(view) {
          this.decorations = this.buildDecorations(view);
        }
        update(update) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
          }
        }
        buildDecorations(view) {
          const builder = new import_state.RangeSetBuilder();
          const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = plugin.settings;
          for (const { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let match;
            while ((match = COLOR_REGEX.exec(text)) !== null) {
              const start = from + match.index;
              const end = start + match[0].length;
              if (this.shouldHighlight(view.state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks)) {
                this.addDecoration(builder, start, end, match[0], view, highlightStyle);
              }
            }
          }
          return builder.finish();
        }
        shouldHighlight(state, start, end, highlightEverywhere, highlightInBackticks, highlightInCodeblocks) {
          if (highlightEverywhere) {
            return true;
          }
          const isInBackticks = this.isWithinInlineCode(state, start, end);
          const isInCodeblock = this.isWithinCodeBlock(state, start);
          return highlightInBackticks && isInBackticks || highlightInCodeblocks && isInCodeblock;
        }
        isWithinInlineCode(state, start, end) {
          const line = state.doc.lineAt(start);
          const lineText = line.text;
          const startInLine = start - line.from;
          const endInLine = end - line.from;
          let backtickCount = 0;
          let withinBackticks = false;
          for (let i = 0; i < lineText.length; i++) {
            if (lineText[i] === "`") {
              backtickCount++;
              withinBackticks = !withinBackticks;
            }
            if (i === startInLine && withinBackticks) return true;
            if (i === endInLine - 1 && withinBackticks) return true;
          }
          return false;
        }
        isWithinCodeBlock(state, pos) {
          const tree = (0, import_language.syntaxTree)(state);
          let node = tree.resolveInner(pos, 1);
          while (node) {
            if (node.type.name.includes("CodeBlock") || node.type.name.includes("FencedCode") || node.type.name.includes("hmd-codeblock") || node.type.name.includes("HyperMD-codeblock")) {
              return true;
            }
            if (node.parent) {
              node = node.parent;
            } else {
              break;
            }
          }
          return false;
        }
        addDecoration(builder, start, end, color, view, highlightStyle) {
          const editorBackground = getComputedStyle(view.dom).backgroundColor;
          let decorationAttributes = {
            class: "color-highlighter-inline-code"
          };
          const effectiveColor = this.getEffectiveColor(color, editorBackground);
          const contrastColor = plugin.getContrastColor(effectiveColor, editorBackground);
          switch (highlightStyle) {
            case "background":
              decorationAttributes.style = `background-color: ${effectiveColor}; color: ${contrastColor}; border-radius: 3px; padding: 0.1em 0.2em;`;
              break;
            case "underline":
              decorationAttributes.class += " color-highlighter-underline";
              decorationAttributes.style = `border-bottom: 2px solid ${effectiveColor}; text-decoration: none !important; text-decoration-skip-ink: none; border-radius: 0;`;
              break;
            case "square":
              break;
            case "border":
              decorationAttributes.class += " color-highlighter-border";
              decorationAttributes.style = `border: 2px solid ${effectiveColor}; border-radius: 3px;`;
              break;
          }
          builder.add(start, end, import_view.Decoration.mark({
            attributes: decorationAttributes
          }));
          if (highlightStyle === "square") {
            builder.add(end, end, import_view.Decoration.widget({
              widget: new class extends import_view.WidgetType {
                constructor(color2) {
                  super();
                  this.color = color2;
                }
                toDOM() {
                  const span = document.createElement("span");
                  span.className = "color-highlighter-square";
                  span.style.display = "inline-block";
                  span.style.width = "10px";
                  span.style.height = "10px";
                  span.style.backgroundColor = this.color;
                  span.style.marginLeft = "2px";
                  span.style.verticalAlign = "middle";
                  return span;
                }
                eq(other) {
                  return other instanceof this.constructor && other.color === this.color;
                }
                updateDOM(dom) {
                  return false;
                }
                ignoreEvent() {
                  return false;
                }
                get estimatedHeight() {
                  return 10;
                }
                get lineBreaks() {
                  return 0;
                }
                coordsAt(dom, pos, side) {
                  return null;
                }
                destroy() {
                }
              }(color)
            }));
          }
        }
        getContrastColor(color, background) {
          if (color.startsWith("hsl")) {
            color = this.hslToRgb(color);
          } else if (color.startsWith("rgba")) {
            color = this.blendRgbaWithBackground(color, background);
          }
          const hex = color.startsWith("#") ? color.slice(1) : this.rgbToHex(color);
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          const yiq = (r * 299 + g * 587 + b * 114) / 1e3;
          return yiq >= 128 ? "black" : "white";
        }
        rgbToHex(rgb) {
          const [r, g, b] = rgb.match(/\d+/g).map(Number);
          return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        blendRgbaWithBackground(rgba, background) {
          const [r, g, b, a] = rgba.match(/[\d.]+/g).map(Number);
          const [bgR, bgG, bgB] = this.extractRgbComponents(background);
          const alpha = a !== void 0 ? a : 1;
          const blendedR = Math.round((1 - alpha) * bgR + alpha * r);
          const blendedG = Math.round((1 - alpha) * bgG + alpha * g);
          const blendedB = Math.round((1 - alpha) * bgB + alpha * b);
          return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        }
        extractRgbComponents(rgbString) {
          const [r, g, b] = rgbString.match(/\d+/g).map(Number);
          return [r, g, b];
        }
        hslToRgb(hsl) {
          const [h, s, l] = hsl.match(/\d+/g).map(Number);
          const sNorm = s / 100;
          const lNorm = l / 100;
          const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
          const x = c * (1 - Math.abs(h / 60 % 2 - 1));
          const m = lNorm - c / 2;
          let r = 0, g = 0, b = 0;
          if (h < 60) {
            r = c;
            g = x;
            b = 0;
          } else if (h < 120) {
            r = x;
            g = c;
            b = 0;
          } else if (h < 180) {
            r = 0;
            g = c;
            b = x;
          } else if (h < 240) {
            r = 0;
            g = x;
            b = c;
          } else if (h < 300) {
            r = x;
            g = 0;
            b = c;
          } else {
            r = c;
            g = 0;
            b = x;
          }
          r = Math.round((r + m) * 255);
          g = Math.round((g + m) * 255);
          b = Math.round((b + m) * 255);
          return `rgb(${r},${g},${b})`;
        }
        getEffectiveColor(color, background) {
          if (color.startsWith("#")) {
            if (color.length === 4) {
              color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
            } else if (color.length === 5) {
              const r = parseInt(color[1] + color[1], 16);
              const g = parseInt(color[2] + color[2], 16);
              const b = parseInt(color[3] + color[3], 16);
              const a = parseInt(color[4] + color[4], 16) / 255;
              return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
            } else if (color.length === 9) {
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);
              const a = parseInt(color.slice(7, 9), 16) / 255;
              return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
            }
          }
          return color;
        }
      },
      {
        decorations: (v) => v.decorations
      }
    );
  }
  postProcessor(el, ctx) {
    const { highlightEverywhere, highlightInBackticks, highlightInCodeblocks, highlightStyle } = this.settings;
    const processNode = (node) => {
      var _a, _b;
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const parent = node.parentElement;
        if (highlightEverywhere || highlightInBackticks && (parent == null ? void 0 : parent.tagName) === "CODE" && ((_a = parent.parentElement) == null ? void 0 : _a.tagName) !== "PRE" || highlightInCodeblocks && (parent == null ? void 0 : parent.tagName) === "CODE" && ((_b = parent.parentElement) == null ? void 0 : _b.tagName) === "PRE") {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match;
          while ((match = COLOR_REGEX.exec(node.textContent)) !== null) {
            const colorCode = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + colorCode.length;
            if (startIndex > lastIndex) {
              fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex, startIndex)));
            }
            const span = document.createElement("span");
            span.textContent = colorCode;
            const backgroundColor = this.getEffectiveBackgroundColor(colorCode, window.getComputedStyle(el).backgroundColor);
            span.classList.add("color-highlighter");
            switch (highlightStyle) {
              case "background":
                span.classList.add("background");
                const contrastColor = this.getContrastColor(backgroundColor, "white");
                span.style.backgroundColor = backgroundColor;
                span.style.color = contrastColor;
                break;
              case "underline":
                span.classList.add("underline");
                span.style.borderBottomColor = backgroundColor;
                break;
              case "square":
                const square = document.createElement("span");
                square.classList.add("color-highlighter-square");
                square.style.backgroundColor = backgroundColor;
                span.appendChild(square);
                break;
              case "border":
                span.classList.add("border");
                span.style.borderColor = backgroundColor;
                break;
            }
            fragment.appendChild(span);
            lastIndex = endIndex;
          }
          if (lastIndex < node.textContent.length) {
            fragment.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
          }
          return fragment;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const newElement = node.cloneNode(false);
        Array.from(node.childNodes).forEach((child) => {
          const processedChild = processNode(child);
          newElement.appendChild(processedChild);
        });
        return newElement;
      }
      return node.cloneNode(true);
    };
    try {
      const fragment = document.createDocumentFragment();
      Array.from(el.childNodes).forEach((node) => {
        const processedNode = processNode(node);
        fragment.appendChild(processedNode);
      });
      el.innerHTML = "";
      el.appendChild(fragment);
    } catch (error) {
      console.error("Error in postProcessor:", error);
    }
  }
  convertNamedColor(color) {
    return this.namedColors[color.toLowerCase()] || color;
  }
  highlightColors(text, wrapInBackticks) {
    return text.replace(COLOR_REGEX, (match) => {
      const editorBackground = getComputedStyle(document.body).backgroundColor;
      const contrastColor = this.getContrastColor(match, editorBackground);
      const highlighted = `<span style="background-color: ${match}; color: ${contrastColor}; border-radius: 3px; padding: 1px 3px;">${match}</span>`;
      return wrapInBackticks ? `\`${highlighted}\`` : highlighted;
    });
  }
  getContrastColor(color, background) {
    if (color.startsWith("hsl")) {
      color = this.hslToRgb(color);
    } else if (color.startsWith("rgba")) {
      color = this.blendRgbaWithBackground(color, background);
    } else if (color.startsWith("#")) {
      if (color.length === 9 || color.length === 5) {
        const r2 = parseInt(color.slice(1, 3), 16);
        const g2 = parseInt(color.slice(3, 5), 16);
        const b2 = parseInt(color.slice(5, 7), 16);
        const a = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : parseInt(color.slice(4, 5), 16) / 15;
        color = this.blendRgbaWithBackground(`rgba(${r2},${g2},${b2},${a})`, background);
      } else if (color.length === 4) {
        color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
    }
    const hex = color.startsWith("#") ? color.slice(1) : this.rgbToHex(color);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1e3;
    return yiq >= 128 ? "black" : "white";
  }
  rgbToHex(rgb) {
    try {
      if (rgb.startsWith("#")) {
        return rgb.slice(1);
      }
      const [r, g, b] = this.extractRgbComponents(rgb);
      return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch (error) {
      return "000000";
    }
  }
  blendRgbaWithBackground(rgba, background) {
    var _a;
    try {
      const [r, g, b, a] = ((_a = rgba.match(/[\d.]+/g)) == null ? void 0 : _a.map(Number)) || [];
      const [bgR, bgG, bgB] = this.extractRgbComponents(background);
      const alpha = a !== void 0 ? a : 1;
      const blendedR = Math.round((1 - alpha) * bgR + alpha * r);
      const blendedG = Math.round((1 - alpha) * bgG + alpha * g);
      const blendedB = Math.round((1 - alpha) * bgB + alpha * b);
      return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
    } catch (error) {
      return background;
    }
  }
  blendHslaWithBackground(hsla, background) {
    try {
      const [h, s, l, a] = this.extractHslaComponents(hsla);
      const [bgR, bgG, bgB] = this.extractRgbComponents(background);
      const rgba = this.hslaToRgba(h, s, l, a);
      const blendedR = Math.round((1 - a) * bgR + a * rgba[0]);
      const blendedG = Math.round((1 - a) * bgG + a * rgba[1]);
      const blendedB = Math.round((1 - a) * bgB + a * rgba[2]);
      return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
    } catch (error) {
      return background;
    }
  }
  getEffectiveBackgroundColor(color, background) {
    if (color.startsWith("rgba")) {
      return this.blendRgbaWithBackground(color, background);
    } else if (color.startsWith("hsla")) {
      return this.blendHslaWithBackground(color, background);
    } else if (color.startsWith("#")) {
      if (color.length === 9) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = parseInt(hex.slice(6, 8), 16) / 255;
        return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
      } else if (color.length === 5) {
        const r = parseInt(color[1] + color[1], 16);
        const g = parseInt(color[2] + color[2], 16);
        const b = parseInt(color[3] + color[3], 16);
        const a = parseInt(color[4] + color[4], 16) / 255;
        return this.blendRgbaWithBackground(`rgba(${r},${g},${b},${a})`, background);
      }
    }
    return color;
  }
  extractRgbComponents(rgbString) {
    rgbString = this.convertNamedColor(rgbString);
    if (rgbString.startsWith("#")) {
      const hex = rgbString.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      } else if (hex.length === 6 || hex.length === 8) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) {
      console.error("Invalid RGB string:", rgbString);
      return [0, 0, 0];
    }
    return match.slice(0, 3).map(Number);
  }
  extractHslaComponents(hsla) {
    const match = hsla.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?,?\s*([\d.]+)?\)/);
    if (!match) {
      throw new Error("Invalid HSLA string");
    }
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10) / 100;
    const l = parseInt(match[3], 10) / 100;
    const a = match[4] ? parseFloat(match[4]) : 1;
    return [h, s, l, a];
  }
  hslToRgb(hsl) {
    var _a;
    try {
      const [h, s, l] = ((_a = hsl.match(/\d+%?/g)) == null ? void 0 : _a.map((val) => {
        if (val.endsWith("%")) {
          return parseFloat(val) / 100;
        }
        return parseFloat(val);
      })) || [];
      if (h === void 0 || s === void 0 || l === void 0) {
        throw new Error("Invalid HSL values");
      }
      const sNorm = s;
      const lNorm = l;
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs(h / 60 % 2 - 1));
      const m = lNorm - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      return `rgb(${r},${g},${b})`;
    } catch (error) {
      return "rgb(0,0,0)";
    }
  }
  hslaToRgba(h, s, l, a) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a];
  }
};
