export default {
  manifest: 'wiki.manifest.json',
  adapter: {
    http: {
      checkUrl: (url) => {
        // don't index "special" pages
        if (
          url.match(
            /\/(Special|Category|Help|Template|Wikipedia|Portal|Talk)\:/
          ) ||
          url.match(/\/Main_Page$/)
        ) {
          return null;
        }
        return url;
      },
      maxPages: 1000,
    },
  },
  parser: {
    html: {
      beforeParse: ($) => {
        // remove sidebars which are placed before the main content
        $('.infobox, .nomobile, .sidebar, .toc').remove();
      },
      headings: 'h1',
      snippet: 'p, ul, ol',
      snippetAllowedTags: 'li, code',
      snippetMaxElements: 2,
      transformFunc: (section, url) => {
        section.title = String(section.title).replace(/\[edit\]/, '');
        return section;
      },
    },
  },
};
