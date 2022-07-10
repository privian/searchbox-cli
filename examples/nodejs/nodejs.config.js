export default {
  manifest: 'nodejs.manifest.json',
  adapter: {
    http: {
      checkUrl: (url) => {
        // ignore some pages
        const ignore = ['/all.html', '/deprecations.html'];
        if (ignore.some((path) => url.endsWith(path))) {
          return null;
        }
        return url;
      },
    },
  },
  parser: {
    html: {
      selectors: {
        snippets: 'p, ul, ol, pre',
      },
      transform: (section, url) => {
        section.category = url.match(/(\w+)\.\w+$/)?.[1];
        section.title = String(section.title).replace(/\#$/, '');
        return section;
      },
    },
  },
};
