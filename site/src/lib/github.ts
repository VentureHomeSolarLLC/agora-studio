import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'VentureHomeSolarLLC';
const REPO = 'agora-studio';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export interface FileChange {
  path: string;
  content: string;
}

export async function createOrUpdateFile(path: string, content: string, message: string) {
  const { data: existing } = await octokit.repos.getContent({
    owner: OWNER, repo: REPO, path, ref: BRANCH,
  }).catch(() => null);

  const params: any = {
    owner: OWNER, repo: REPO, path, message,
    content: Buffer.from(content).toString('base64'),
    branch: BRANCH,
  };

  if (existing && 'sha' in existing) {
    params.sha = existing.sha;
  }

  const { data } = await octokit.repos.createOrUpdateFileContents(params);
  return { sha: data.commit.sha, html_url: data.commit.html_url };
}

export async function createMultipleFiles(changes: FileChange[], message: string) {
  const results = [];
  for (const change of changes) {
    const result = await createOrUpdateFile(change.path, change.content, `${message} - ${change.path.split('/').pop()}`);
    results.push(result);
  }
  const last = results[results.length - 1];
  return { sha: last.sha, html_url: last.html_url, paths: changes.map(c => c.path) };
}
