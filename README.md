# Wiki|Docs

> A database free, flat file wiki built with Markdown.

[![license](https://img.shields.io/github/license/Zavy86/WikiDocs)](LICENSE)
[![release](https://img.shields.io/github/v/release/Zavy86/WikiDocs?display_name=release&sort=semver)](https://github.com/Zavy86/WikiDocs/releases)
[![total downloads](https://img.shields.io/github/downloads/Zavy86/WikiDocs/total)](https://github.com/Zavy86/WikiDocs/releases)
[![docker pulls](https://img.shields.io/docker/pulls/zavy86/wikidocs)](https://hub.docker.com/r/zavy86/wikidocs)

Wiki|Docs is a privacy-friendly wiki for people who want to own their knowledge base.

Run it entirely on your computer with the standalone desktop app, or host it yourself with Docker. Your content remains portable Markdown files, rather than data locked into a database or cloud service.

<p align="center">
  <a href="#demo"><img src="https://img.shields.io/badge/TRY THE DEMO-2ea44f" alt="TRY THE DEMO" /></a>
  <a href="#setup"><img src="https://img.shields.io/badge/INSTALL WIKI|DOCS-0969da" alt="INSTALL WIKI|DOCS" /></a>
  <a href="#screenshots"><img src="https://img.shields.io/badge/SEE SCREENSHOTS-8250df" alt="SEE SCREENSHOTS" /></a>
  <a href="#contributing"><img src="https://img.shields.io/badge/CONTRIBUTE-e16f24" alt="CONTRIBUTE" /></a>
</p>

Project homepage: [https://www.wikidocs.app](https://www.wikidocs.app)

> This is the new version of Wiki|Docs, a complete rewrite of the original project.  
> The new version is built on a modern architecture with a REST API, web client, and desktop application.  
> If you are looking for the original PHP version of the project, please see
> [this branch](https://github.com/Zavy86/WikiDocs/tree/legacy).


[![Wiki|Docs presentation and contributors recruitment on YouTube](screenshots/wikidocs-youtube.jpg)](https://youtu.be/x2nVq9RbG54 "Watch Wiki|Docs presentation and contributors recruitment on YouTube")

_Please consider supporting this project by making a donation via [PayPal](https://www.paypal.me/zavy86)_.


## What's new in Wiki|Docs

Wiki|Docs 2 is a complete rewrite in TypeScript across the entire stack: the NestJS backend, Angular web client, and Electron desktop application.

The new architecture brings:

- A standalone desktop application that keeps your Markdown files on your computer, ready for use with the LLM tools you choose.
- A self-hosted Docker service that can remotely store and serve the same portable data (privately or publicly).
- Desktop and remote sync, so you can work locally and keep your knowledge base updated with your self-hosted instance.
- REST APIs that make Wiki|Docs straightforward to integrate with other tools and workflows.


## Why Wiki|Docs?

Wiki|Docs is designed for people who value ownership over their information. It keeps the writing experience simple while giving you the freedom to work locally, self host when needed, and move your content without vendor lock in.

| What you need | What Wiki\|Docs provides |
| --- | --- |
| Privacy and portability | Plain Markdown files and no database required. |
| A simple local workspace | A standalone desktop app that works without a hosted service. |
| Access from anywhere | Optional Docker self hosting and sync between your desktop app and remote instance. |


## Quick start

1. [Try the public demo](#demo) to explore Wiki|Docs immediately.
2. [Download the desktop application](https://github.com/Zavy86/wikidocs/releases) to keep your wiki entirely local.
3. [Run the Docker image](#self-hosted) when you want a self-hosted instance or remote sync.


## Features

Wiki|Docs combines the convenience of a modern editor with the durability of plain text Markdown. Whether you are documenting a project, building a personal knowledge base, or sharing a team wiki, the same portable files remain at the center of your workflow.

- Open source
- Plain text files
- No database required
- Markdown syntax
- YAML Frontmatter
- Editor full WYSIWYG
- Support for KaTeX math
- Support for Mermaid diagrams
- Unlimited page revisions
- Uploading and downloading attachments
- Uploading images (also from clipboard)
- Content can be categorized in namespaces
- Public and private browsing
- Desktop and remote sync
- Syntax highlighting
- Multiple languages
- Dark mode
- And much more.


## Demo

Explore the demo playground at [http://demo.wikidocs.app](http://demo.wikidocs.app) with the following credentials:

Authentication:

Username: `john.doe@wikidocs.app`<br>
Password: `wikidocs`

If Wiki|Docs is useful to you, please consider [starring the project](https://github.com/Zavy86/WikiDocs/stargazers).


## Screenshots

Here is a glimpse of the desktop and web experience. Select any image to open the original screenshot at full size.

<p align="center">
  <a href="screenshots/wikidocs-homepage.png" target="_blank"><img src="screenshots/wikidocs-homepage.png" alt="Wiki|Docs homepage" width="250" /></a>
  <a href="screenshots/wikidocs-settings.png" target="_blank"><img src="screenshots/wikidocs-settings.png" alt="Wiki|Docs settings" width="250" /></a>
  <a href="screenshots/wikidocs-profile.png" target="_blank"><img src="screenshots/wikidocs-profile.png" alt="Wiki|Docs profile" width="250" /></a>
</p>
<p align="center">
  <a href="screenshots/wikidocs-accounts.png" target="_blank"><img src="screenshots/wikidocs-accounts.png" alt="Wiki|Docs accounts" width="250" /></a>
  <a href="screenshots/wikidocs-editor.png" target="_blank"><img src="screenshots/wikidocs-editor.png" alt="Wiki|Docs editor" width="250" /></a>
  <a href="screenshots/wikidocs-attachments.png" target="_blank"><img src="screenshots/wikidocs-attachments.png" alt="Wiki|Docs attachments" width="250" /></a>
</p>
<p align="center">
  <a href="screenshots/wikidocs-versions.png" target="_blank"><img src="screenshots/wikidocs-versions.png" alt="Wiki|Docs page versions" width="250" /></a>
  <a href="screenshots/wikidocs-trash.png" target="_blank"><img src="screenshots/wikidocs-trash.png" alt="Wiki|Docs trash" width="250" /></a>
  <a href="screenshots/wikidocs-print.png" target="_blank"><img src="screenshots/wikidocs-print.png" alt="Wiki|Docs print view" width="250" /></a>
</p>
<p align="center">
  <a href="screenshots/wikidocs-api.png" target="_blank"><img src="screenshots/wikidocs-api.png" alt="Wiki|Docs API documentation" width="750" /></a>
</p>


## Setup

To run Wiki|Docs you can either use the desktop application or run it in a self-hosted environment.

### Desktop

[Download](https://github.com/Zavy86/wikidocs/releases) the latest desktop application release and run the installer.

The application will be installed on your system, then you can launch it from the Start menu or desktop shortcut.

### Self-hosted

A [Docker image](https://hub.docker.com/repository/docker/zavy86/wikidocs) is available on Docker Hub to run Wiki|Docs in a container.

Running Wiki|Docs in a container is the recommended way to host it yourself, as it is the easiest and fastest way to get started.

Once the container is running, open the web client at `http://localhost:3210`. The backend API and Swagger documentation are available at `http://localhost:3210/api/`.

#### Quick run

```
docker run -p 3210:3210 zavy86/wikidocs:2
```

#### Additional settings

```
docker run --name wikidocs -d -p 3210:3210 -v /path/to/local/wikidocs/datasets/or/volume:/var/lib/wikidocs zavy86/wikidocs:2
```

#### With Docker Compose

Use the following `docker-compose.yml` file to run Wiki|Docs with Docker Compose.

```
volumes:
  datasets:

services:
  wikidocs:
    image: zavy86/wikidocs:2
    environment:
      MODE: public|private
      SECRET: generate-a-secret-key-here
    volumes:
      - datasets:/var/lib/wikidocs/datasets
    ports:
      - "3210:3210"
```


## Sync

To sync your Wiki|Docs data across multiple devices, host the application yourself and configure the desktop app to connect to your remote instance.

Open the Settings menu from the File menu (press Alt on Windows) to enter the sync configuration.

You can then access and edit your Wiki|Docs content online from any device.


## Migration

Before migrating from version 1.x.x (legacy), always create a complete backup of your dataset.

Despite the significant structural changes in this release, your data remains fully compatible. On first launch, reconfigure the wiki and create an administrator user. All existing documents will then work as expected.

The only manual adjustment is to move the homepage document to the root directory, because version 2 no longer uses the legacy homepage slug as its index page.

If you use Docker, point to port `3210` instead of `80` and bind the dataset volume to `/var/lib/wikidocs/datasets`.


## Help and documentation

Start with the resources below to learn how to use, host, extend, or get help with Wiki|Docs.

- Visit [WikiDocs.app](https://www.wikidocs.app) for product documentation and guides.
- Open your self hosted instance at `/api/` for the Swagger documentation.
- Ask questions or share ideas in [GitHub Discussions](https://github.com/Zavy86/WikiDocs/discussions).
- Report a problem through [GitHub Issues](https://github.com/Zavy86/WikiDocs/issues).


## Contributing

Contributions of every kind are welcome, from bug reports and feature ideas to documentation, testing, code, and pull request reviews.

- [Report a bug](https://github.com/Zavy86/WikiDocs/issues/new?labels=bug)
- [Propose a feature](https://github.com/Zavy86/WikiDocs/discussions)
- [Improve the documentation](https://github.com/Zavy86/WikiDocs/issues/new)
- [See where help is wanted](https://github.com/Zavy86/WikiDocs/labels/help%20wanted)
- [Find a good first issue](https://github.com/Zavy86/WikiDocs/labels/good%20first%20issue)
- [Contribute code](CONTRIBUTING.md)


## Developers

This section recognizes the people who have helped make this project possible.

If you want to contribute to the project, please check the [CONTRIBUTING](CONTRIBUTING.md) file for more information.

### Creator

💡 [**Manuel Zavatta**](https://github.com/Zavy86)
( [Website](http://im.zavy.dev)
| [LinkedIn](https://www.linkedin.com/in/manuel-zavatta/)
| [YouTube](https://www.youtube.com/@zavy86)
| [Contacts](mailto://manuel.zavatta@gmail.com) )

### Collaborators

- [Amin Persia](https://github.com/leomoon)  
- [Paulo Taborda](https://github.com/ffiesta)

### Contributors
- [Alex Meyer](https://github.com/reyemxela)
- [Micha](https://github.com/serial)
- [Bo Allen](https://github.com/bitwisecreative)
- [Joel Vega](https://github.com/jv3ga)
- [Sam](https://github.com/sam-6174)
- [kevwkev](https://github.com/kevwkev)
- [Сергей Ворон](https://github.com/vorons)
- [Nicolas Prenveille](https://github.com/nicolas35380)
- [Antonio Rodrigues](https://github.com/aaadonai)
- [Miguel Renato](https://github.com/MiguelRenato)
- [Alain Martini](https://github.com/inalto)
- [Davide Visentin](https://github.com/dvisentin-freelance)
- [Christian Weber](https://github.com/pce-consulting)
- [Petr Husák](https://github.com/petrhusak)
- [Oliver Lehmann](https://github.com/OlliL)
- [Prabal Khare](https://github.com/00PrabalK00)
- [Roberto Bellingeri](https://github.com/bellingeri)


## License

This project is licensed under the [MIT License](LICENSE).
