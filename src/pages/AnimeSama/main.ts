import { pageInterface } from '../pageInterface';

function getCombinedSeasonEpisode(url: string) {
  if (utils.urlPart(url, 4) !== 'ascendance-of-a-bookworm') return null;

  const match = j
    .$('#selectEpisodes')
    .val()
    ?.toString()
    .match(/Episode (\d+)/i);
  if (!match) return null;

  const episode = Number(match[1]);
  if (episode > 26) return { episode: episode - 26, season: 3 };
  if (episode > 14) return { episode: episode - 14, season: 2 };
  return { episode, season: 1 };
}

const filmTitleAliases = {
  'haikyuu/La Guerre des poubelles': 'Haikyuu Gomi Suteba no Kessen',
};

function getIdentifierPart(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const AnimeSama: pageInterface = {
  name: 'AnimeSama',
  domain: 'https://anime-sama.to',
  languages: ['French'],
  type: 'anime',
  isSyncPage(url) {
    return Boolean($('#playerDF').length);
  },
  sync: {
    getTitle(url) {
      let titre = j.$('#titreOeuvre').text().trim();
      const saison = j.$('#avOeuvre').text().trim();
      const selectedEpisode = j.$('#selectEpisodes').val()?.toString();
      const combinedSeasonEpisode = getCombinedSeasonEpisode(url);
      if (saison === 'Film' && selectedEpisode) {
        const aliasKey = `${utils.urlPart(url, 4)}/${selectedEpisode}`;
        titre = filmTitleAliases[aliasKey] || `${titre} ${selectedEpisode}`;
      } else if (combinedSeasonEpisode && combinedSeasonEpisode.season > 1) {
        titre += ` Season ${combinedSeasonEpisode.season}`;
      } else if (saison !== 'Saison 1' && saison.startsWith('Saison')) {
        const normalizedSeason = saison
          .replace(/^Saison\b/i, 'Season')
          .replace(/\bPartie\b/i, 'Part');
        titre += ` ${normalizedSeason}`;
      } else if (saison !== 'Saison 1' && !saison.startsWith('Saga')) {
        titre += ` ${saison}`;
      }
      return titre;
    },
    getIdentifier(url) {
      let identifier = utils.urlPart(url, 4) || '';
      const combinedSeasonEpisode = getCombinedSeasonEpisode(url);
      if (combinedSeasonEpisode && combinedSeasonEpisode.season > 1) {
        return `${identifier}/saison${combinedSeasonEpisode.season}`;
      }

      if (
        identifier !== '' &&
        utils.urlPart(url, 5) &&
        utils.urlPart(url, 5).startsWith('saison')
      ) {
        identifier += `/${utils.urlPart(url, 5)}`;
      } else if (identifier !== '' && utils.urlPart(url, 5) === 'film') {
        const selectedFilm = j.$('#selectEpisodes').val()?.toString();
        if (selectedFilm) identifier += `/film/${getIdentifierPart(selectedFilm)}`;
      }
      return identifier;
    },
    getOverviewUrl(url) {
      return `${AnimeSama.domain}/catalogue/${utils.urlPart(url, 4)}`;
    },
    getEpisode(url) {
      const combinedSeasonEpisode = getCombinedSeasonEpisode(url);
      if (combinedSeasonEpisode) return combinedSeasonEpisode.episode;

      const temp = j
        .$('#selectEpisodes')
        .val()
        ?.toString()
        .match(/Episode (\d+)/i);
      if (!temp) return 1;
      return Number(temp[1]);
    },
  },
  init(page) {
    api.storage.addStyle(
      require('!to-string-loader!css-loader!less-loader!./style.less').toString(),
    );
    utils.changeDetect(
      () => {
        page.handlePage();
      },
      () => {
        return j.$('#selectEpisodes').val();
      },
    );

    utils.waitUntilTrue(
      () => this.isSyncPage(),
      () => page.handlePage(),
      1000,
    );
  },
};
