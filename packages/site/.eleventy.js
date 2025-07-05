const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItWiki = require("markdown-it-wikilinks");
const yaml = require("js-yaml");
const eleventyGoogleFonts = require("eleventy-google-fonts");
const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  const pathPrefix =
    process.env.ENV === "production" ? "/projects/shattered-wilds/" : "";

  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, { baseHref: pathPrefix });

  eleventyConfig.addPlugin(eleventyGoogleFonts);

  // Add global data for lexicon files
  eleventyConfig.addGlobalData("lexiconFiles", function () {
    const lexiconDir = path.join(__dirname, "../../docs/lexicon");
    if (!fs.existsSync(lexiconDir)) return [];

    function getAllMarkdownFiles(dir, basePath = "") {
      const files = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = getAllMarkdownFiles(
            fullPath,
            path.join(basePath, item)
          );
          files.push(...subFiles);
        } else if (item.endsWith(".md")) {
          // Create slug from relative path to lexicon root
          const relativePath = path.relative(lexiconDir, fullPath);
          const slug = relativePath
            .replace(/\.md$/, "")
            .replace(/[\/\\]/g, "_");

          // Create title with colon format (e.g., "Action: Move")
          const titleParts = relativePath.replace(/\.md$/, "").split(/[\/\\]/);
          let title =
            titleParts.length > 1
              ? `${titleParts[0]}: ${titleParts.slice(1).join(" ")}`
              : titleParts[0];
          title = title.replace(/_/g, " ");

          files.push({
            filePath: fullPath,
            slug: slug,
            title: title,
            basePath: basePath,
          });
        }
      }

      return files;
    }

    const markdownFiles = getAllMarkdownFiles(lexiconDir);

    return markdownFiles.map((file) => {
      const content = fs.readFileSync(file.filePath, "utf8");

      return {
        slug: file.slug,
        title: file.title,
        content: content,
        url: `/wiki/${file.slug}/`,
      };
    });
  });

  eleventyConfig.addPassthroughCopy({
    "node_modules/simpledotcss/simple.min.css": "simple.min.css",
  });
  eleventyConfig.addPassthroughCopy("src/bundle.css");
  eleventyConfig.addPassthroughCopy("assets", { expand: true });

  const processMarkdown = (value) => {
    if (value === undefined) {
      return undefined;
    }
    return wikiLinks(value);
  };

  const filterMarkdown = (value) => {
    if (value === undefined) {
      return undefined;
    }
    return md.renderInline(newLineToBR(processMarkdown(value)));
  };

  const newLineToBR = (value) => {
    return value.replaceAll(/\n/g, "<br>\n");
  };

  const wikiLinks = (value) => {
    return value.replace(/\[\[([^\]]*)\]\]/g, (_, r) => {
      var link, text;
      if (r.includes(" | ")) {
        [link, text] = r.split(" | ");
      } else {
        link = text = r;
      }
      return `<a href="/wiki/${link.replace(" ", "_")}">${text}</a>`;
    });
  };

  const wikiOptions = {
    baseURL: "/wiki/",
    makeAllLinksAbsolute: true,
    uriSuffix: "",
  };

  const md = markdownIt({ html: true })
    .use(markdownItAnchor)
    .use(markdownItAttrs)
    .use(markdownItWiki(wikiOptions))
    .use((md) => {
      // Apply `refine` to text content
      md.renderer.rules.text = (tokens, idx) => {
        return processMarkdown(tokens[idx].content);
      };

      // Ensure refined text is treated as actual HTML, not escaped
      md.renderer.rules.html_inline = (tokens, idx) => {
        return processMarkdown(tokens[idx].content);
      };

      md.renderer.rules.html_block = (tokens, idx) => {
        return processMarkdown(tokens[idx].content);
      };
    });

  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));
  eleventyConfig.addLiquidFilter("markdown", (value) => md.render(value));
  eleventyConfig.addLiquidFilter("md", filterMarkdown);

  return {
    passthroughFileCopy: true,
    dir: { input: "src", output: "_site" },
  };
};
