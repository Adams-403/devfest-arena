# Contributing to DevFest Arena

Thank you for your interest in contributing to DevFest Arena! We welcome contributions from everyone, whether it's code, documentation, bug reports, or feature requests.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Code Style](#-code-style)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Reporting Bugs](#-reporting-bugs)
- [Suggesting Enhancements](#-suggesting-enhancements)
- [License](#-license)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
   ```bash
   git clone https://github.com/your-username/devfest-arena.git
   cd devfest-arena
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Create a new branch for your changes
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
5. Make your changes
6. Run tests (if available)
   ```bash
   npm test
   ```
7. Commit your changes following the [commit message guidelines](#-commit-message-guidelines)
8. Push your changes to your fork
   ```bash
   git push origin your-branch-name
   ```
9. Open a pull request against the `main` branch

## 🔄 Development Workflow

1. Always work on a feature branch, never on `main`
2. Keep your fork in sync with the upstream repository
   ```bash
   git remote add upstream https://github.com/your-username/devfest-arena.git
   git fetch upstream
   git merge upstream/main
   ```
3. Rebase your feature branch on top of the latest `main` before submitting a PR
   ```bash
   git checkout your-feature-branch
   git rebase main
   ```

## 🎨 Code Style

- Use TypeScript for all new code
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use Prettier for code formatting
- Use ESLint for code quality
- Write meaningful commit messages
- Include comments where necessary
- Keep functions small and focused on a single responsibility

## ✏️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### Examples

```
feat(auth): add login with Google

Add Google OAuth authentication to allow users to sign in with their Google accounts.

Closes #123
```

## 🔄 Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations, and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## 🐛 Reporting Bugs

Use GitHub Issues to report bugs. Please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots if applicable
- Browser/OS version if relevant

## 💡 Suggesting Enhancements

We welcome enhancement suggestions! Please:

1. Use the "Enhancement" issue template
2. Describe the enhancement and why it would be useful
3. Include any relevant screenshots or mockups
4. List any alternative solutions or features you've considered

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## 🙏 Thank You!

Your contributions to open source, large or small, make great projects like this possible. Thank you for taking the time to contribute.
