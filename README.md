<div align="center">

<img src="resources/icon.png" alt="SkinsTrackr Logo" width="120" />

# SkinsTrackr

### Yet another CS2 Inventory Manager

[Download](#download) • [Features](#features) • [Showcase](#showcase) • [Community](#community--support) • [FAQ](#-faq)

</div>

---

SkinsTrackr is a desktop application designed to help Counter-Strike 2 players manage their in-game inventories. SkinsTrackr provides inventory tracking, storage unit transfers, offline inventory caching and multi-account support.

---

## Download

### Latest (1.1.0)

| Platform    | Download                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Windows     | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.1.0/SkinsTrackr-Setup-1.1.0.exe) |
| macOS (ARM) | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.1.0/SkinsTrackr-1.1.0-arm64.dmg) |
| macOS (x64) | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.1.0/SkinsTrackr-1.1.0.dmg)       |
| Linux       | [Download](https://github.com/SkinsTrackr/skinstrackr/releases/download/v1.1.0/SkinsTrackr-1.1.0.AppImage)  |

### Older versions

See [Releases](https://github.com/SkinsTrackr/skinstrackr/releases)

### How to run on linux

The .AppImage is a direct executable and will not be installed on your computer. You need to give it correct executable permissions and probably run it through your shell:

1. Make the file executable with e.g. `sudo chmod 755 <SkinsTrackr file>`
2. Run with `./<SkinsTrackr file>`

---

## Features

- **Complete Inventory View** - Browse your entire CS2 inventory including storage units.
- **Offline Inventory Caching** - Log in once and your inventory is saved locally. View your items anytime without needing to re-authenticate every session.
- **Storage Unit transferring** - Move items from/to storage units.
- **Multi-account support** - Manage multiple Steam accounts in one application. Each account is cached offline.
- **Advanced Filtering** - Search, filter and group items by name, rarity, price, and more.
- **Up-to-date market pricing** - Recent prices from SCM.

---

## Showcase

### Inventory View

![Inventory View](.github/media/inventory-view.gif)

### Item Transfer

![Item Transfer](.github/media/item-transfer.gif)

### Multi-Account Management and Caching

![Multi-Account Caching](.github/media/multi-accounts-cache.gif)

---

## Community / Support

- Join the [Discord](https://discord.com/invite/Rmu3fGKGyu).
- Create an issue here on [Github](https://github.com/SkinsTrackr/skinstrackr/issues).
- Alternatively submit feedback/bugs through [Google Forms](https://forms.gle/qxTKNiW6Bra95xnf7).

---

## ❓ FAQ

### Will I get VAC banned using this tool?

Short answer: No

Long answer:

1. This tool does not interact with any of your game files, nor the CS2 game servers. It is not even required to have the game installed to use skinstrackr.
2. As most other inventory managers, this app uses DoctorMcKay's [node-steamuser](https://github.com/DoctorMcKay/node-steam-user) + [node-globaloffensive](https://github.com/DoctorMcKay/node-globaloffensive). Both are mature libraries to interact with the Steam network and CS2 Game Coordinator.

### How often does my inventory sync?

Every time you login, SkinsTrackr will automatically look for changes in the inventory/containers and update your locally saved inventory.
This is also the case every time you transfer any items.

You can also manually trigger a sync at any time using the refresh button in the user overview in the bottom left.

### Is all my data private? Where is it stored?

Since SkinsTrackr currently only supports the Steam Web token for login (which is a one-time-use), no credentials or sensitive info is stored at all. The only stored data are logged in users with their cached inventories.

Nothing is ever sent to external servers except for the necessary Steam API calls to retrieve your profile and inventory.

---

## Author

**jzimr (Oooodin)**

- Github: [jzimr](https://github.com/jzimr)
- Discord: Oooodin (Ooodin#1626)
- Steam: [Oooodin](https://steamcommunity.com/id/oooodin/)

---

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.
