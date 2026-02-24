import { execFileSync } from 'child_process';

export interface PRInfo {
  number: number;
  title: string;
  state: string;
  url: string;
  author: string;
  body?: string;
}

export interface IssueInfo {
  number: number;
  title: string;
  state: string;
  url: string;
  labels: string[];
  body?: string;
}

export interface RepoInfo {
  name: string;
  description: string;
  defaultBranch: string;
  url: string;
  stars: number;
  language: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  url: string;
}

export class GitHubService {
  private static instance: GitHubService | null = null;

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  static resetInstance(): void {
    GitHubService.instance = null;
  }

  private execGh(args: string[]): string {
    try {
      return execFileSync('gh', args, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });
    } catch (error: any) {
      const stderr = error.stderr?.toString() || '';
      if (stderr.includes('gh: command not found') || error.code === 'ENOENT') {
        throw new Error('GitHub CLI (gh) is not installed. Install from https://cli.github.com/');
      }
      if (stderr.includes('not logged in')) {
        throw new Error('Not authenticated with GitHub CLI. Run: gh auth login');
      }
      throw new Error(`gh command failed: ${stderr || error.message}`);
    }
  }

  private execGhJson(args: string[]): any {
    const result = this.execGh([...args, '--json']);
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }

  createPR(params: { title: string; body: string; base?: string; head?: string }): PRInfo {
    const args = ['pr', 'create', '--title', params.title, '--body', params.body];
    if (params.base) args.push('--base', params.base);
    if (params.head) args.push('--head', params.head);
    const result = this.execGh(args);
    // gh pr create returns the PR URL
    const url = result.trim();
    const match = url.match(/\/pull\/(\d+)/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      title: params.title,
      state: 'open',
      url,
      author: 'current-user',
      body: params.body,
    };
  }

  listPRs(params: { state?: string; limit?: number }): PRInfo[] {
    const args = ['pr', 'list', '--json', 'number,title,state,url,author'];
    if (params.state) args.push('--state', params.state);
    if (params.limit) args.push('--limit', String(params.limit));
    const result = this.execGh(args);
    try {
      const prs = JSON.parse(result);
      return prs.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.url,
        author: pr.author?.login || '',
      }));
    } catch {
      return [];
    }
  }

  reviewPR(params: { number: number; body: string; event?: string }): { success: boolean; message: string } {
    const args = ['pr', 'review', String(params.number), '--body', params.body];
    if (params.event) args.push(`--${params.event}`);
    this.execGh(args);
    return { success: true, message: `Review added to PR #${params.number}` };
  }

  mergePR(params: { number: number; method?: string }): { success: boolean; message: string } {
    const args = ['pr', 'merge', String(params.number), '--auto'];
    if (params.method === 'squash') args.push('--squash');
    else if (params.method === 'rebase') args.push('--rebase');
    else args.push('--merge');
    this.execGh(args);
    return { success: true, message: `PR #${params.number} merged` };
  }

  createIssue(params: { title: string; body: string; labels?: string[] }): IssueInfo {
    const args = ['issue', 'create', '--title', params.title, '--body', params.body];
    if (params.labels && params.labels.length > 0) {
      args.push('--label', params.labels.join(','));
    }
    const result = this.execGh(args);
    const url = result.trim();
    const match = url.match(/\/issues\/(\d+)/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      title: params.title,
      state: 'open',
      url,
      labels: params.labels || [],
      body: params.body,
    };
  }

  listIssues(params: { state?: string; labels?: string[]; limit?: number }): IssueInfo[] {
    const args = ['issue', 'list', '--json', 'number,title,state,url,labels'];
    if (params.state) args.push('--state', params.state);
    if (params.labels && params.labels.length > 0) args.push('--label', params.labels.join(','));
    if (params.limit) args.push('--limit', String(params.limit));
    const result = this.execGh(args);
    try {
      const issues = JSON.parse(result);
      return issues.map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.url,
        labels: (i.labels || []).map((l: any) => l.name || l),
      }));
    } catch {
      return [];
    }
  }

  getRepoInfo(): RepoInfo {
    const result = this.execGh(['repo', 'view', '--json', 'name,description,defaultBranchRef,url,stargazerCount,primaryLanguage']);
    const data = JSON.parse(result);
    return {
      name: data.name || '',
      description: data.description || '',
      defaultBranch: data.defaultBranchRef?.name || 'main',
      url: data.url || '',
      stars: data.stargazerCount || 0,
      language: data.primaryLanguage?.name || '',
    };
  }

  getWorkflowStatus(params?: { limit?: number }): WorkflowRun[] {
    const args = ['run', 'list', '--json', 'databaseId,name,status,conclusion,url'];
    if (params?.limit) args.push('--limit', String(params.limit));
    const result = this.execGh(args);
    try {
      const runs = JSON.parse(result);
      return runs.map((r: any) => ({
        id: r.databaseId || 0,
        name: r.name || '',
        status: r.status || '',
        conclusion: r.conclusion || '',
        url: r.url || '',
      }));
    } catch {
      return [];
    }
  }
}
