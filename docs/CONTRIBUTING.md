# Contributing

Thanks for your interest in contributing to evm-tt! Please take a moment to review this document **before submitting a pull request.**

If you want to contribute, but aren't sure where to start, you can create a [new discussion](https://github.com/ChefBingbong/ethereum-transaction-tracer/discussions).


## Rules
2. Contributors must be humans, not bots.
4. First time contributions must not contain only spelling or grammatical fixes.

## Basic guide

This guide is intended to help you get started with contributing. By following these steps, you will understand the development process and workflow.

1. [Cloning the repository](#cloning-the-repository)
2. [Installing Node.js and pnpm](#installing-nodejs-and-pnpm)
4. [Installing dependencies](#installing-dependencies)
5. [Running the test suite](#running-the-test-suite)
7. [Submitting a pull request](#submitting-a-pull-request)
8. [Versioning](#versioning)

---

### Cloning the repository

To start contributing to the project, clone it to your local machine using git:

```bash
git clone https://github.com/ChefBingbong/ethereum-transaction-tracer.git
```

<div align="right">
  <a href="#basic-guide">&uarr; back to top</a></b>
</div>

---

### Installing Node.js and Bun

evm-tt uses [turbo monorepo](https://pnpm.io/workspaces) together with bun and Node.js to manage multiple projects. You need to install **Node.js v22 or higher** and **bun v1.2.0 or higher**.

You can run the following commands in your terminal to check your local Node.js and bun.js versions:

```bash
node -v
bun -v
```


### Installing dependencies

Once in the project's root directory, run the following command to install the project's dependencies:

```bash
bun i
```

### Running the test suite

T0-DO

<div align="right">
  <a href="#basic-guide">&uarr; back to top</a></b>
</div>

---


### Submitting a pull request

When you're ready to submit a pull request, you can follow these naming conventions:

- Pull request titles use the [Imperative Mood](https://en.wikipedia.org/wiki/Imperative_mood) (e.g., `Add something`, `Fix something`).
- [Changesets](#versioning) use past tense verbs (e.g., `Added something`, `Fixed something`).

When you submit a pull request, GitHub will automatically lint, build, and test your changes. If you see an ❌, it's most likely a bug in your code. Please, inspect the logs through the GitHub UI to find the cause.

<div align="right">
  <a href="#basic-guide">&uarr; back to top</a></b>
</div>

---

### Versioning

When adding new features or fixing bugs, we'll need to bump the package versions. We use [Changesets](https://github.com/changesets/changesets) to do this.

> **Note**
>
> Only changes to the codebase that affect the public API or existing behavior (e.g. bugs) need changesets.

Each changeset defines which package(s) should be published and whether the change should be a major/minor/patch release, as well as providing release notes that will be added to the changelog upon release.

To create a new changeset, run `bun changeset`. This will run the Changesets CLI, prompting you for details about the change. You’ll be able to edit the file after it’s created — don’t worry about getting everything perfect up front.

Even though you can technically use any markdown formatting you like, headings should be avoided since each changeset will ultimately be nested within a bullet list. Instead, bold text should be used as section headings.

If your PR is making changes to an area that already has a changeset (e.g. there’s an existing changeset covering theme API changes but you’re making further changes to the same API), you should update the existing changeset in your PR rather than creating a new one.

---

<br>

<div>
  ✅ Now you're ready to contribute to evm-tt!
</div>

<div align="right">
  <a href="#advanced-guide">&uarr; back to top</a></b>
</div>

---
