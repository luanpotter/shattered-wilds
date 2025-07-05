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
  // NOTE: kept to allow for a different prefix in the future
  const pathPrefix = process.env.ENV === "production" ? "" : "";

  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, { baseHref: pathPrefix });

  eleventyConfig.addPlugin(eleventyGoogleFonts);

  // Add global data for lexicon files
  const lexiconFiles = parseLexicon();
  eleventyConfig.addGlobalData("lexiconFiles", lexiconFiles);

  // Add a generic Liquid shortcode to render any lexicon entry as a bullet item
  eleventyConfig.addShortcode("item", (path, excludeTags = []) => {
    const slug = path.replace(/[\/\\]/g, '_');
    const entry = lexiconFiles.find(e => e.slug === slug);
    if (!entry) {
      return `<span style='color:red'>[Missing lexicon entry: ${slug}]</span>`;
    }
    // Build metadata HTML
    let metaHtml = "";
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      metaHtml = '<span class="item-metadata">' +
        Object.values(entry.metadata).map((tag) => {
          if (excludeTags.includes(tag.key)) {
            return '';
          }
          return `<span class="${tag.cssClass}">${tag.title}${tag.value ? `: ${tag.value}` : ""}</span>`;
        }).join(' ') +
        '</span>';
    }
    const para = entry.content.split(/\n\n/)[0].trim();
    return `<strong><a href="${entry.url}">${entry.title.replace(/^[^:]+: /, '')}</a></strong> ${metaHtml} : ${para}`;
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

const parseLexicon = () => {
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
        const slug = relativePath.replace(/\.md$/, "").replace(/[\/\\]/g, "_");

        // Create title with colon format (e.g., "Action: Move")
        const titleParts = relativePath.replace(/\.md$/, "").split(/[\/\\]/);
        let title =
          titleParts.length > 1
            ? `${titleParts[0]}: ${titleParts.slice(1).join(" ")}`
            : titleParts[0];
        title = title.replace(/_/g, " ");

        // Parse frontmatter if present
        const content = fs.readFileSync(fullPath, "utf8");
        let frontMatter = {};
        let markdownContent = content;

        // Use regex to extract YAML frontmatter
        const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
        if (fmMatch) {
          try {
            frontMatter = yaml.load(fmMatch[1]);
            markdownContent = content.slice(fmMatch[0].length).trim();
          } catch (e) {
            console.warn(
              `Failed to parse frontmatter for ${fullPath}:`,
              e.message
            );
          }
        }

        const parseFrontMatter = (frontMatter) => {
          if (!frontMatter || typeof frontMatter !== "object") {
            return [];
          }
          const specialTitles = {
            ap: "AP",
          };
          return Object.entries(frontMatter).map(([key, value]) => ({
            key: key,
            title: (specialTitles[key] || key)
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase()),
            value: value === true ? undefined : value,
            cssClass: value === true ? `metadata-trait` : `metadata-${key.replace(/_/g, "-")}`,
          }));
        };

        files.push({
          filePath: fullPath,
          slug: slug,
          title: title,
          basePath: basePath,
          content: markdownContent,
          metadata: parseFrontMatter(frontMatter),
          isCategory: titleParts.length === 1, // Root level files are categories
          category: titleParts.length > 1 ? titleParts[0] : null,
        });
      }
    }

    return files;
  }

  const markdownFiles = getAllMarkdownFiles(lexiconDir);

  // Group items by category for category pages
  const categoryGroups = {};
  markdownFiles.forEach((file) => {
    if (file.category) {
      if (!categoryGroups[file.category]) {
        categoryGroups[file.category] = [];
      }
      categoryGroups[file.category].push(file);
    }
  });

  // Build a lookup for slug to url
  const slugToUrl = {};
  markdownFiles.forEach((file) => {
    slugToUrl[file.slug] = `/wiki/${file.slug}/`;
  });

  return markdownFiles.map((file) => {
    let categoryItems = null;
    if (file.isCategory && categoryGroups[file.title]) {
      categoryItems = categoryGroups[file.title]
        .filter((item) => item.slug !== file.slug)
        .map((item) => ({
          ...item,
          url: slugToUrl[item.slug],
        }));
    }
    return {
      slug: file.slug,
      title: file.title,
      content: file.content,
      metadata: file.metadata,
      url: `/wiki/${file.slug}/`,
      isCategory: file.isCategory,
      category: file.category,
      categoryItems: categoryItems,
    };
  });
};
