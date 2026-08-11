# Security Policy

## Supported versions

Security fixes are applied to the current `1.x` release line on the `master`
branch. Version `2.0` is a separate rewrite in progress on the [`v2`](https://github.com/Zavy86/WikiDocs/tree/v2)
branch and is not yet covered by this policy.

| Version | Supported |
| ------- | --------- |
| 1.x (master) | :white_check_mark: |
| 2.0 (v2, in development) | :x: |

## Reporting a vulnerability

Please report security issues **privately** so a fix can be prepared before the
details are public.

Use GitHub's private vulnerability reporting: open the repository's **Security**
tab and click **Report a vulnerability**. This opens a private advisory visible
only to the maintainers.

When reporting, please include:

- the affected file or endpoint,
- steps to reproduce or a short proof of concept,
- the impact you observed,
- the WikiDocs version and how it is deployed (Docker, Apache, nginx, ...).

For low-severity or non-sensitive issues you may instead open a normal issue.

## Disclosure

Please give the maintainers a reasonable window to release a fix before
disclosing publicly. Reports are reviewed as time allows; this is a
volunteer-maintained project, so please be patient with response times.
