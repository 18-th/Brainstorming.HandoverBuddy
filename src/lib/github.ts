import { Octokit } from "octokit";

export function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export interface GitHubPR {
  number: number;
  title: string;
  url: string;
  repoFullName: string;
}

export async function fetchUserPRs(
  accessToken: string,
  githubLogin: string
): Promise<GitHubPR[]> {
  const octokit = getOctokit(accessToken);

  const [authored, assigned] = await Promise.all([
    octokit.rest.search.issuesAndPullRequests({
      q: `is:pr is:open author:${githubLogin}`,
      per_page: 50,
    }),
    octokit.rest.search.issuesAndPullRequests({
      q: `is:pr is:open assignee:${githubLogin}`,
      per_page: 50,
    }),
  ]);

  const allItems = [...authored.data.items, ...assigned.data.items];

  const seen = new Set<number>();
  return allItems
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .map((item) => ({
      number: item.number,
      title: item.title,
      url: item.html_url,
      repoFullName: item.repository_url.replace(
        "https://api.github.com/repos/",
        ""
      ),
    }));
}
