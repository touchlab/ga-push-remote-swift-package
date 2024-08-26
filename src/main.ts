import * as core from '@actions/core'
import simpleGit from 'simple-git'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
    const commitMessage: string = core.getInput('commitMessage')
    const remoteRepo: string = core.getInput('remoteRepo')
    let remoteRepoUrl: string = core.getInput('remoteRepoUrl')
    const localPackagePath: string = core.getInput('localPackagePath')
    const remotePackagePath: string = core.getInput('remotePackagePath')
    const remoteBranch: string = core.getInput('remoteBranch')

    core.debug(`commitMessage: ${commitMessage}`)
    core.debug(`remoteRepo: ${remoteRepo}`)
    core.debug(`remoteRepoUrl: ${remoteRepoUrl}`)
    core.debug(`localPackagePath: ${localPackagePath}`)
    core.debug(`remotePackagePath: ${remotePackagePath}`)
    core.debug(`remoteBranch: ${remoteBranch}`)

    remoteRepoUrl = remoteRepoUrl ? remoteRepoUrl : `https://github.com/${remoteRepo}.git`

    const git = simpleGit()

    await git.pull()

    await git.raw('fetch', remoteRepoUrl, remoteBranch)

    await git.raw('branch', 'remote_swift_package', 'FETCH_HEAD')
    await git.raw('worktree', 'add', '.git/tmp/remote_swift_package', 'remote_swift_package')

    const packageSource = fs.readFileSync(`.${localPackagePath}`, 'utf8')
    fs.writeFileSync(`.git/tmp/remote_swift_package${remotePackagePath}`, packageSource);

    const worktreeGit = simpleGit('.git/tmp/remote_swift_package')
    await worktreeGit.add('.')
    await worktreeGit.commit(commitMessage)

    await worktreeGit.raw('push', remoteRepoUrl, remoteBranch)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
