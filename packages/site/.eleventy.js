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
    const lexiconDir = path.join(__dirname, "src/_includes/docs/lexicon");
    if (!fs.existsSync(lexiconDir)) return [];

    const files = fs
      .readdirSync(lexiconDir)
      .filter((file) => file.endsWith(".md"));

    return files.map((file) => {
      const filePath = path.join(lexiconDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const slug = path.basename(file, ".md");

      return {
        slug: slug,
        title: slug.replace(/_/g, " "),
        content: content,
        url: `/wiki/${slug}/`,
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
