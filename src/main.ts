import * as core from '@actions/core'
import simpleGit from 'simple-git'
import * as fs from 'fs'
import * as path from 'node:path'

function notEmpty(p: string | undefined) {
  return p && p.trim().length > 0
}

function assertNotEmpty(p: string | undefined, message: string) {
  if (!notEmpty(p)) {
    core.setFailed(message)
    throw new Error(message)
  }
}

export async function run(): Promise<void> {
  const commitMessage: string = core.getInput('commitMessage')
  let tagMessage: string = core.getInput('tagMessage')
  const tagVersion: string = core.getInput('tagVersion')
  const remoteRepo: string = core.getInput('remoteRepo')
  let remoteRepoUrl: string = core.getInput('remoteRepoUrl')
  const packageFileOnly: string = core.getInput('packageFileOnly')
  let localPackagePath: string = core.getInput('localPackagePath')
  let remotePackagePath: string = core.getInput('remotePackagePath')
  const remoteBranch: string = core.getInput('remoteBranch')

  core.debug(`commitMessage: ${commitMessage}`)
  core.debug(`tagMessage: ${tagMessage}`)
  core.debug(`tagVersion: ${tagVersion}`)
  core.debug(`remoteRepo: ${remoteRepo}`)
  core.debug(`remoteRepoUrl: ${remoteRepoUrl}`)
  core.debug(`packageFileOnly: ${packageFileOnly}`)
  core.debug(`localPackagePath: ${localPackagePath}`)
  core.debug(`remotePackagePath: ${remotePackagePath}`)
  core.debug(`remoteBranch: ${remoteBranch}`)

  tagMessage = notEmpty(tagMessage) ? tagMessage : `Version ${tagVersion}`
  remoteRepoUrl = notEmpty(remoteRepoUrl) ? remoteRepoUrl : `https://github.com/${remoteRepo}.git`
  localPackagePath = notEmpty(localPackagePath) ? localPackagePath : ''
  remotePackagePath = notEmpty(remotePackagePath) ? remotePackagePath : ''
  const packageFileOnlyBool = packageFileOnly === 'true'

  assertNotEmpty(commitMessage, '\'commitMessage\' cannot be empty')
  assertNotEmpty(remoteRepo, '\'remoteRepo\' cannot be empty')
  assertNotEmpty(remoteBranch, '\'remoteBranch\' cannot be empty')

  try {
    const git = simpleGit()
    try {
      await git.raw('fetch', remoteRepoUrl, remoteBranch)
    } catch (e) {
      console.log(`Branch ${remoteBranch} not found in remote repo ${remoteRepoUrl}.`)
      await git.raw('fetch', remoteRepoUrl)
    }
    await git.raw('branch', 'remote_swift_package', 'FETCH_HEAD')
    await git.raw('worktree', 'add', '.git/tmp/remote_swift_package', 'remote_swift_package')

    if (packageFileOnlyBool) {
      const packageSource = fs.readFileSync(`.${localPackagePath}/Package.swift`, 'utf8')
      fs.writeFileSync(`.git/tmp/remote_swift_package${remotePackagePath}/Package.swift`, packageSource)
    } else {
      const files = fs.readdirSync('.')

      for (const file of files) {
        if (file === '.git' || file === '.github') {
          continue
        }

        const filePath = path.join('.', file) // Get full path
        const stats = fs.statSync(filePath) // Get file stats

        if (stats.isFile()) {
          fs.copyFileSync(filePath, `.git/tmp/remote_swift_package/${file}`)
          console.log(`File: ${filePath}`)
        } else if (stats.isDirectory()) {
          fs.cpSync(filePath, `.git/tmp/remote_swift_package/${file}`, { recursive: true })
          console.log(`Directory: ${filePath}`)
        }
      }
    }

    const worktreeGit = simpleGit('.git/tmp/remote_swift_package')
    if (tagVersion) {
      await worktreeGit.raw('fetch', '--tags') // Get release tag
      await worktreeGit.add('.')
      await worktreeGit.commit(commitMessage)
      await worktreeGit.raw('tag', '-fa', tagVersion, '-m', tagMessage)
      await worktreeGit.raw('push', '--follow-tags', remoteRepoUrl, `remote_swift_package:${remoteBranch}`)
    } else {
      await worktreeGit.add('.')
      await worktreeGit.commit(commitMessage)
      await worktreeGit.raw('push', remoteRepoUrl, '-u', `remote_swift_package:${remoteBranch}`)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
    throw error
  }
}
