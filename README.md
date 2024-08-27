# Kotlin Multiplatform SPM publishing to a remote repo

## Main Docs

This plugin helps support [KMMBridge](https://touchlab.co/kmmbridge/) features. To understand how to use it, please follow those docs and tutorials.

## Overview

When publishing SPM binaries for KMP, publishing to the same repo as the code is simpler. However, you can publish to any repo. 

There are cases where publishing to a separate repo makes sense. The most obvious use case is publishing KMP code from a module inside your Android repo. SPM uses git tags to manage versions, and if your Android repo also uses tags, they can be get confused.

In any case, publishing to a different repo requires more configuration.

## What this action does

This action takes the `Package.swift` from your local repo and pushes it to a remote repo. It will also add a tag for versioning purposes.

To support using GitHub Releases, the tag will overwrite the release tag if it already exists.

## How it works

GitHub Actions give the action runner significant permissions, but only to the repo on which it is running. To access any other repo, and to be able to update those repos, requires extra steps and configuration.

This action assumes you have already configured access to the "other" repo you plan to communicate with. The git commands in the action use the git CLI tool. If auth fails for the CLI tool, this action will fail.

## Arguments

* `commitMessage` - Required - Message for the commit which updates the `Package.swift` file
* `tagMessage` - Optional - Message for the version tag commit. Defaults to "Version ${tagVersion}"
* `tagVersion` - Required - Version string to use in the tag. Should follow [semver rules](https://semver.org/).
* `remoteRepo` - Required - Repo we are publishing to in [org]/[repo] format.
* `remoteBranch` - Required - Branch we are pushing to.
* `remoteRepoUrl` - Optional - Full url for the repo we are publishing to. Defaults to "https://github.com/${remoteRepo}.git".
* `localPackagePath` - Optional - Local path to the `Package.swift` file. This is usually the repo root. The default for this argument is an empty string. Internally, we expand the argument with the following: ".${localPackagePath}/Package.swift". If you provide a value for this argument, leave out the `.` prefix and the `/Package.swift` suffix. For example, if your `Package.swift` is for some reason at `[repo root]/mylibrary/Package.swift`, the argument would be `/mylibrary`.
* `remotePackagePath` - Optional - Similar to `localPackagePath`, we assume repo root. If not, follow the same convention.
