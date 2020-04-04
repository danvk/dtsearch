import fetch from 'node-fetch';

import { Hit } from "./response";
import {GITHUB_TOKEN} from './key';

const GITHUB_API = 'https://api.github.com/graphql';

interface Repo {
  name: string;
  owner: string;
}

function extractGitHubRepo(hit: Hit): Repo | undefined {
  const {repository} = hit;
  if (!repository || repository.host !== 'github.com') {
    return undefined;
  }
  const {project, user} = repository;
  return {name: project, owner: user};
}

interface StarResponse {
  data: {
    [key: string]: {
      stargazers: {
        totalCount: number;
      }
    }
  }
}

/** Add star counts to hits. Mutates hit array in place. */
export async function addStars(hits: readonly Hit[]) {
  // TODO(danvk): de-dupe repos
  const repos = hits.map(extractGitHubRepo);
  const fragments = repos.map((repo, i) => {
    if (!repo) {
      return '';
    }

    return `
    r${i}: repository(owner:"${repo.owner}", name:"${repo.name}") {
      stargazers {
        totalCount
      }
    }`
  });
  const query = `query {
    ${fragments.join('')}
  }`;

  const response = await fetch(GITHUB_API, {
    headers: {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({query}),
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL query failed: ${response.status} ${response.statusText}`);
  }

  const {data} = await response.json() as StarResponse;
  for (const [key, val] of Object.entries(data)) {
    const idx = Number(key.slice(1));
    const stars = val.stargazers.totalCount;
    hits[idx].stars = stars;
  }
}
