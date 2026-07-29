# Wiki|Docs

Just a databaseless markdown flat-file wiki.

Project homepage: [https://www.wikidocs.app](https://www.wikidocs.app)

> This is the new version 2 Wiki|Docs, a complete rewrite of the original project.
> 
> The new version is based on a modern architecture with API, a web client, and a desktop application.
> 
> If you are looking for the oldest version of the project written in PHP, please follow
> [this branch](https://github.com/Zavy86/WikiDocs/tree/v1).

_Please consider supporting this project by making a donation via [PayPal](https://www.paypal.me/zavy86)_.

[![Wiki|Docs presentation and contributors recruitment on YouTube](https://www.wikidocs.app/datasets/documents/homepage/cover-side-project-wikidocs-youtube.jpg)](https://youtu.be/x2nVq9RbG54 "Watch Wiki|Docs presentation and contributors recruitment on YouTube")


## Features

- Open source
- Plain text files
- No database required
- Markdown syntax
- YAML Frontmatter
- Editor full WYSIWYG
- Support for KaTeX math
- Support for Mermaid diagrams
- ~~Unlimited page revisions~~
- Uploading and downloading Attachments
- Uploading images ~~(also from clipboard)~~
- Content can be categorized in namespaces
- ~~Automatic generated index and sitemap~~
- Public and private browsing
- Syntax highlighting
- ~~Multi-language~~
- ~~Dark mode~~
- ~~Sitemap~~
- Sync
- and many more...

~~Striked~~ features are work in progress.


## Demo

Try the demo playground at: [http://demo.wikidocs.app](http://demo.wikidocs.app)

Authentication: 

Username: `john.doe@wikidocs.app`  
Password: `wikidocs`


## Setup

To run Wiki|Docs you can either use the desktop application or run it in a self-hosted environment.


### Desktop

[Download](https://github.com/Zavy86/wikidocs/releases) the lastest release of the desktop application and run the installer.
The application will be installed in your system, and you can start it from the start menu or desktop shortcut.


### Self-hosted

A [Docker image](https://hub.docker.com/repository/docker/zavy86/wikidocs) is available on Docker Hub, which can be used
to run Wiki|Docs in a container.

Running in container is the recommended way to self-host Wiki|Docs, as it is the easiest and fastest way to get started.

You can access to the web client at `http://localhost:3000` after running the container, and you can also interact with
the backend API at `http://localhost:3000/api/` where you can find the swagger documentation.


#### Quick run

```
docker run -p 3000:3000 zavy86/wikidocs:2
```


#### Additional settings

```
docker run --name wikidocs -d -p 3000:3000 -v /path/to/local/wikidocs/datasets/or/volume:/var/lib/wikidocs zavy86/wikidocs:2
```


#### With Docker Compose

Use the following `docker-compose.yml` file to run Wiki|Docs with Docker Compose:

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
      - "3000:3000"

```


## Sync

If you want to sync your Wiki|Docs data between multiple devices, you can self-host the application and configure your
desktop application to connect to your self-hosted instance.

This way, you can access and edit your Wiki|Docs content online and from any device.

> This feature is work in progress and will be available in a future release.


## Developers

Here you can find a list of the contributors that helped to make this project possible.

If you want to contribute to the project, please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

### Creator

**Manuel Zavatta**
- [WebSite](http://www.zavy.im)
- [GitHub](https://github.com/Zavy86)
- [YouTube](https://www.youtube.com/@zavy86)
- [Contacts](mailto://manuel.zavatta@gmail.com)


### Version 1 Contributors

- [Amin Persia](https://github.com/leomoon)
- [ffiesta](https://github.com/ffiesta)
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


## License

Project is licensed under the [MIT License](LICENSE).
