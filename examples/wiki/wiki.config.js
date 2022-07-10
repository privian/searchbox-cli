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
      max: {
        snippets: 2,
      },
      selectors: {
        headings: 'h1',
        snippets: 'p, ul, ol',
      },
      transform: (section, url) => {
        section.title = String(section.title).replace(/\[edit\]/, '');
        return section;
      },
    },
  },
};
